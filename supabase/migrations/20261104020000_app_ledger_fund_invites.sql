-- Fund invitations: adding someone to a fund invites them. They join only
-- once they accept; until then they can't see the fund and can't be picked
-- in a transaction. Declining (or the owner cancelling) sets removed_at, like
-- removing a member; the owner can invite them again.

alter table public.ledger_fund_members
  add column status    text not null default 'active' check (status in ('invited', 'active')),
  add column joined_at timestamptz;

-- Everyone already in a fund has joined.
update public.ledger_fund_members set joined_at = created_at where joined_at is null;

alter table public.ledger_fund_members
  alter column status set default 'invited',
  add constraint ledger_fund_members_owner_active check (role <> 'owner' or status = 'active');

create index ledger_fund_members_invites_idx on public.ledger_fund_members (email) where status = 'invited' and removed_at is null;

-- Only members who have joined count.
create or replace function public.ledger_fund_member_id(p_fund_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.id
  from public.ledger_fund_members m
  where m.fund_id = p_fund_id
    and m.removed_at is null
    and m.status = 'active'
    and (
      m.user_id = (select auth.uid())
      or (m.user_id is null and m.email = lower((select auth.jwt()) ->> 'email'))
    )
  limit 1;
$$;

-- A transaction's person must have joined the fund.
create or replace function public.ledger_fund_transactions_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := public.ledger_fund_member_id(new.fund_id);
begin
  if tg_op = 'INSERT' then
    if v_me is null then
      raise exception 'You aren''t a member of this fund' using errcode = '42501';
    end if;
    new.created_by := v_me;
    new.updated_by := null;
    new.deleted_at := null;
  else
    if new.fund_id <> old.fund_id then
      raise exception 'A transaction can''t move to another fund' using errcode = '42501';
    end if;
    if old.deleted_at is not null then
      raise exception 'This transaction was deleted' using errcode = '42501';
    end if;
    new.created_by := old.created_by;
    new.updated_by := coalesce(v_me, new.updated_by);
  end if;

  if (tg_op = 'INSERT' or new.member_id <> old.member_id)
     and not exists (
       select 1 from public.ledger_fund_members m
       where m.id = new.member_id and m.removed_at is null and m.status = 'active'
     ) then
    raise exception 'This person isn''t in the fund' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.ledger_create_fund(p_name text, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(auth.jwt() ->> 'email');
  v_fund uuid;
begin
  if v_uid is null or v_email is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  insert into public.ledger_funds (name, note, created_by)
  values (btrim(p_name), nullif(btrim(p_note), ''), v_uid)
  returning id into v_fund;

  insert into public.ledger_fund_members (fund_id, user_id, email, display_name, role, status, joined_at)
  values (v_fund, v_uid, v_email, public.ledger_fund_default_name(v_uid, v_email), 'owner', 'active', now());

  return v_fund;
end;
$$;

-- The owner invites someone by email. Inviting a removed member or someone
-- who declined sends a new invitation.
create or replace function public.ledger_add_fund_member(p_fund_id uuid, p_email text, p_display_name text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(p_email));
  v_user uuid;
  v_name text;
  v_member uuid;
  v_status text;
  v_removed timestamptz;
begin
  if not public.ledger_fund_is_owner(p_fund_id) then
    raise exception 'Only the fund owner can invite people' using errcode = '42501';
  end if;

  select u.id into v_user from auth.users u where lower(u.email) = v_email limit 1;
  v_name := coalesce(nullif(btrim(p_display_name), ''), public.ledger_fund_default_name(v_user, v_email));

  select m.id, m.status, m.removed_at into v_member, v_status, v_removed
  from public.ledger_fund_members m
  where m.fund_id = p_fund_id and m.email = v_email;

  if v_member is not null then
    if v_removed is null then
      raise exception '%', case v_status
        when 'invited' then 'This person is already invited'
        else 'This person is already in the fund'
      end using errcode = '23505';
    end if;
    update public.ledger_fund_members m
    set removed_at = null,
        status = 'invited',
        joined_at = null,
        display_name = v_name,
        user_id = coalesce(m.user_id, v_user),
        created_at = now()
    where m.id = v_member;
    return v_member;
  end if;

  insert into public.ledger_fund_members (fund_id, user_id, email, display_name, role, status)
  values (p_fund_id, v_user, v_email, v_name, 'member', 'invited')
  returning id into v_member;
  return v_member;
end;
$$;

-- The owner removes a member or cancels an invitation.
create or replace function public.ledger_remove_fund_member(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fund uuid;
  v_role text;
begin
  select m.fund_id, m.role into v_fund, v_role
  from public.ledger_fund_members m
  where m.id = p_member_id and m.removed_at is null;

  if v_fund is null or not public.ledger_fund_is_owner(v_fund) then
    raise exception 'Only the fund owner can remove members' using errcode = '42501';
  end if;
  if v_role = 'owner' then
    raise exception 'The owner can''t be removed' using errcode = '42501';
  end if;

  update public.ledger_fund_members set removed_at = now() where id = p_member_id;
end;
$$;

-- Only joined members count toward member_count and see their funds.
create or replace function public.ledger_my_funds()
returns table (
  id uuid, name text, note text, created_at timestamptz,
  my_member_id uuid, my_role text, member_count integer,
  contributed bigint, spent bigint, balance bigint
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_email text := lower(auth.jwt() ->> 'email');
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  update public.ledger_fund_members m
  set user_id = v_uid
  where m.user_id is null and m.email = v_email;

  return query
    select f.id, f.name, f.note, f.created_at, me.id, me.role,
           (select count(*)::integer from public.ledger_fund_members x
            where x.fund_id = f.id and x.removed_at is null and x.status = 'active'),
           coalesce(t.contributed, 0)::bigint,
           coalesce(t.spent, 0)::bigint,
           (coalesce(t.contributed, 0) - coalesce(t.spent, 0))::bigint
    from public.ledger_fund_members me
    join public.ledger_funds f on f.id = me.fund_id
    left join lateral (
      select sum(tx.amount) filter (where tx.kind = 'contribute') as contributed,
             sum(tx.amount) filter (where tx.kind = 'spend') as spent
      from public.ledger_fund_transactions tx
      where tx.fund_id = f.id and tx.deleted_at is null
    ) t on true
    where me.user_id = v_uid and me.removed_at is null and me.status = 'active'
    order by f.created_at desc;
end;
$$;

-- The signed-in user's open invitations, newest first, with who sent them.
create or replace function public.ledger_my_fund_invites()
returns table (
  member_id uuid, fund_id uuid, fund_name text, fund_note text,
  invited_by text, invited_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, f.id, f.name, f.note, o.display_name, m.created_at
  from public.ledger_fund_members m
  join public.ledger_funds f on f.id = m.fund_id
  left join public.ledger_fund_members o on o.fund_id = m.fund_id and o.role = 'owner'
  where m.status = 'invited'
    and m.removed_at is null
    and (
      m.user_id = (select auth.uid())
      or (m.user_id is null and m.email = lower((select auth.jwt()) ->> 'email'))
    )
  order by m.created_at desc;
$$;

-- Accepts an invitation: the user joins the fund. Returns the fund id.
create or replace function public.ledger_accept_fund_invite(p_member_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(auth.jwt() ->> 'email');
  v_fund uuid;
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  update public.ledger_fund_members m
  set status = 'active', joined_at = now(), user_id = v_uid
  where m.id = p_member_id
    and m.status = 'invited'
    and m.removed_at is null
    and (m.user_id = v_uid or (m.user_id is null and m.email = v_email))
  returning m.fund_id into v_fund;

  if v_fund is null then
    raise exception 'This invitation is no longer available' using errcode = 'P0002';
  end if;
  return v_fund;
end;
$$;

-- Declines an invitation. The owner can invite them again later.
create or replace function public.ledger_decline_fund_invite(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(auth.jwt() ->> 'email');
begin
  update public.ledger_fund_members m
  set removed_at = now()
  where m.id = p_member_id
    and m.status = 'invited'
    and m.removed_at is null
    and (m.user_id = v_uid or (m.user_id is null and m.email = v_email));

  if not found then
    raise exception 'This invitation is no longer available' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function
  public.ledger_my_fund_invites(),
  public.ledger_accept_fund_invite(uuid),
  public.ledger_decline_fund_invite(uuid)
from public, anon;

grant execute on function
  public.ledger_my_fund_invites(),
  public.ledger_accept_fund_invite(uuid),
  public.ledger_decline_fund_invite(uuid)
to authenticated;
