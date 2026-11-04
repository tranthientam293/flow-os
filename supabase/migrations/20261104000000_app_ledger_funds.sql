-- Ledger funds: shared money pots. Anyone can create a fund and becomes its
-- owner; the owner adds and removes members by email. Members (owner included)
-- record money put in (contribute) or taken out (spend). Every change to a
-- transaction is kept in ledger_fund_transaction_revisions by a trigger.

create table public.ledger_funds (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(btrim(name)) between 1 and 80),
  note       text check (char_length(note) <= 200),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ledger_funds_created_by_idx on public.ledger_funds (created_by);

-- A person in a fund, matched by email so they can be added before they sign
-- up; user_id is filled in once they're known. Removing a member sets
-- removed_at (their past transactions keep pointing at the row).
create table public.ledger_fund_members (
  id           uuid primary key default gen_random_uuid(),
  fund_id      uuid not null references public.ledger_funds (id) on delete cascade,
  user_id      uuid references auth.users (id) on delete set null,
  email        text not null check (email = lower(email) and char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  role         text not null default 'member' check (role in ('owner', 'member')),
  removed_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (fund_id, id),
  check (role <> 'owner' or removed_at is null)
);

create unique index ledger_fund_members_fund_email_key on public.ledger_fund_members (fund_id, email);
create unique index ledger_fund_members_one_owner_key on public.ledger_fund_members (fund_id) where role = 'owner';
create index ledger_fund_members_user_id_idx on public.ledger_fund_members (user_id);
create index ledger_fund_members_email_idx on public.ledger_fund_members (email);

-- Money in (contribute) or out (spend) of a fund. member_id is whose money it
-- is (who put it in, or who used it); created_by / updated_by are the members
-- who recorded and last changed it. Deleting sets deleted_at, so the history
-- stays readable.
create table public.ledger_fund_transactions (
  id          uuid primary key default gen_random_uuid(),
  fund_id     uuid not null references public.ledger_funds (id) on delete cascade,
  member_id   uuid not null,
  kind        text not null check (kind in ('contribute', 'spend')),
  amount      bigint not null check (amount > 0),
  note        text check (char_length(note) <= 200),
  occurred_on date not null default current_date,
  created_by  uuid,
  updated_by  uuid,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (fund_id, id),
  foreign key (fund_id, member_id) references public.ledger_fund_members (fund_id, id),
  foreign key (fund_id, created_by) references public.ledger_fund_members (fund_id, id),
  foreign key (fund_id, updated_by) references public.ledger_fund_members (fund_id, id)
);

create index ledger_fund_transactions_fund_idx on public.ledger_fund_transactions (fund_id, occurred_on desc, created_at desc) where deleted_at is null;
create index ledger_fund_transactions_member_idx on public.ledger_fund_transactions (fund_id, member_id);
create index ledger_fund_transactions_created_by_idx on public.ledger_fund_transactions (fund_id, created_by);
create index ledger_fund_transactions_updated_by_idx on public.ledger_fund_transactions (fund_id, updated_by);

-- One row per change to a transaction: what it looked like after the change
-- (for 'deleted', what it was when deleted) and who made it.
create table public.ledger_fund_transaction_revisions (
  id             uuid primary key default gen_random_uuid(),
  fund_id        uuid not null,
  transaction_id uuid not null,
  action         text not null check (action in ('created', 'edited', 'deleted')),
  actor_id       uuid,
  member_id      uuid not null,
  kind           text not null,
  amount         bigint not null,
  note           text,
  occurred_on    date not null,
  -- clock_timestamp: several changes in one transaction keep their order.
  created_at     timestamptz not null default clock_timestamp(),
  foreign key (fund_id, transaction_id) references public.ledger_fund_transactions (fund_id, id) on delete cascade,
  foreign key (fund_id, actor_id) references public.ledger_fund_members (fund_id, id),
  foreign key (fund_id, member_id) references public.ledger_fund_members (fund_id, id)
);

create index ledger_fund_transaction_revisions_tx_idx on public.ledger_fund_transaction_revisions (fund_id, transaction_id, created_at);
create index ledger_fund_transaction_revisions_actor_idx on public.ledger_fund_transaction_revisions (fund_id, actor_id);
create index ledger_fund_transaction_revisions_member_idx on public.ledger_fund_transaction_revisions (fund_id, member_id);

create trigger ledger_funds_updated_at before update on public.ledger_funds
  for each row execute function public.set_updated_at();
create trigger ledger_fund_members_updated_at before update on public.ledger_fund_members
  for each row execute function public.set_updated_at();
create trigger ledger_fund_transactions_updated_at before update on public.ledger_fund_transactions
  for each row execute function public.set_updated_at();

-- The signed-in user's member row in a fund (null when they aren't a current
-- member). Matched by account, or by sign-in email before the row is linked.
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
    and (
      m.user_id = (select auth.uid())
      or (m.user_id is null and m.email = lower((select auth.jwt()) ->> 'email'))
    )
  limit 1;
$$;

create or replace function public.ledger_fund_is_owner(p_fund_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.ledger_fund_members m
    where m.id = public.ledger_fund_member_id(p_fund_id)
      and m.role = 'owner'
  );
$$;

-- Fills in who recorded a transaction and keeps it from moving between funds,
-- changing a deleted one, or naming a removed member.
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
     and exists (select 1 from public.ledger_fund_members m where m.id = new.member_id and m.removed_at is not null) then
    raise exception 'This person is no longer in the fund' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger ledger_fund_transactions_guard before insert or update on public.ledger_fund_transactions
  for each row execute function public.ledger_fund_transactions_guard();

-- Writes the history row for every add, edit and delete.
create or replace function public.ledger_fund_transactions_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action text;
begin
  if tg_op = 'INSERT' then
    v_action := 'created';
  elsif new.deleted_at is not null and old.deleted_at is null then
    v_action := 'deleted';
  elsif (new.member_id, new.kind, new.amount, new.note, new.occurred_on)
        is distinct from
        (old.member_id, old.kind, old.amount, old.note, old.occurred_on) then
    v_action := 'edited';
  else
    return null;
  end if;

  insert into public.ledger_fund_transaction_revisions
    (fund_id, transaction_id, action, actor_id, member_id, kind, amount, note, occurred_on)
  values
    (new.fund_id, new.id, v_action,
     case when tg_op = 'INSERT' then new.created_by else new.updated_by end,
     new.member_id, new.kind, new.amount, new.note, new.occurred_on);
  return null;
end;
$$;

create trigger ledger_fund_transactions_log after insert or update on public.ledger_fund_transactions
  for each row execute function public.ledger_fund_transactions_log();

alter table public.ledger_funds                      enable row level security;
alter table public.ledger_fund_members               enable row level security;
alter table public.ledger_fund_transactions          enable row level security;
alter table public.ledger_fund_transaction_revisions enable row level security;

create policy "ledger_funds: members read" on public.ledger_funds for select to authenticated
  using (public.ledger_fund_member_id(id) is not null);
create policy "ledger_funds: owner updates" on public.ledger_funds for update to authenticated
  using (public.ledger_fund_is_owner(id)) with check (public.ledger_fund_is_owner(id));
create policy "ledger_funds: owner deletes" on public.ledger_funds for delete to authenticated
  using (public.ledger_fund_is_owner(id));

-- Members see everyone in the fund, removed members included (for history).
create policy "ledger_fund_members: members read" on public.ledger_fund_members for select to authenticated
  using (public.ledger_fund_member_id(fund_id) is not null);

create policy "ledger_fund_transactions: members read" on public.ledger_fund_transactions for select to authenticated
  using (public.ledger_fund_member_id(fund_id) is not null);
create policy "ledger_fund_transactions: members add" on public.ledger_fund_transactions for insert to authenticated
  with check (public.ledger_fund_member_id(fund_id) is not null);
-- Edits and deletes (setting deleted_at): whoever recorded it, or the owner.
create policy "ledger_fund_transactions: creator or owner edits" on public.ledger_fund_transactions for update to authenticated
  using (
    deleted_at is null
    and (created_by = public.ledger_fund_member_id(fund_id) or public.ledger_fund_is_owner(fund_id))
  )
  with check (public.ledger_fund_member_id(fund_id) is not null);

create policy "ledger_fund_transaction_revisions: members read" on public.ledger_fund_transaction_revisions for select to authenticated
  using (public.ledger_fund_member_id(fund_id) is not null);

revoke all on table
  public.ledger_funds,
  public.ledger_fund_members,
  public.ledger_fund_transactions,
  public.ledger_fund_transaction_revisions
from anon, authenticated;

grant select, update, delete on public.ledger_funds                      to authenticated;
grant select                 on public.ledger_fund_members               to authenticated;
grant select, insert         on public.ledger_fund_transactions          to authenticated;
grant update (member_id, kind, amount, note, occurred_on, deleted_at)
                             on public.ledger_fund_transactions          to authenticated;
grant select                 on public.ledger_fund_transaction_revisions to authenticated;

-- A display name for a user: their flowOS profile name, else the part of the
-- email before @.
create or replace function public.ledger_fund_default_name(p_user_id uuid, p_email text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select left(coalesce(
    nullif(btrim((select p.display_name from public.profiles p where p.id = p_user_id)), ''),
    split_part(p_email, '@', 1)
  ), 80);
$$;

-- Creates a fund with the signed-in user as its owner.
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

  insert into public.ledger_fund_members (fund_id, user_id, email, display_name, role)
  values (v_fund, v_uid, v_email, public.ledger_fund_default_name(v_uid, v_email), 'owner');

  return v_fund;
end;
$$;

-- The owner adds someone by email (adding a removed member back restores
-- them). The name defaults to their flowOS name or the start of the email.
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
begin
  if not public.ledger_fund_is_owner(p_fund_id) then
    raise exception 'Only the fund owner can add members' using errcode = '42501';
  end if;

  select u.id into v_user from auth.users u where lower(u.email) = v_email limit 1;
  v_name := coalesce(nullif(btrim(p_display_name), ''), public.ledger_fund_default_name(v_user, v_email));

  select m.id into v_member
  from public.ledger_fund_members m
  where m.fund_id = p_fund_id and m.email = v_email;

  if v_member is not null then
    update public.ledger_fund_members m
    set removed_at = null,
        display_name = v_name,
        user_id = coalesce(m.user_id, v_user)
    where m.id = v_member and m.removed_at is not null;
    if not found then
      raise exception 'This person is already in the fund' using errcode = '23505';
    end if;
    return v_member;
  end if;

  insert into public.ledger_fund_members (fund_id, user_id, email, display_name, role)
  values (p_fund_id, v_user, v_email, v_name, 'member')
  returning id into v_member;
  return v_member;
end;
$$;

-- The owner removes a member. Their transactions stay, under their name.
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

-- The signed-in user's funds with their balance, totals and member count.
-- Also links member rows added by email to the user's account.
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
           (select count(*)::integer from public.ledger_fund_members x where x.fund_id = f.id and x.removed_at is null),
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
    where me.user_id = v_uid and me.removed_at is null
    order by f.created_at desc;
end;
$$;

revoke execute on function
  public.ledger_fund_member_id(uuid),
  public.ledger_fund_is_owner(uuid),
  public.ledger_create_fund(text, text),
  public.ledger_add_fund_member(uuid, text, text),
  public.ledger_remove_fund_member(uuid),
  public.ledger_my_funds()
from public, anon;

grant execute on function
  public.ledger_fund_member_id(uuid),
  public.ledger_fund_is_owner(uuid),
  public.ledger_create_fund(text, text),
  public.ledger_add_fund_member(uuid, text, text),
  public.ledger_remove_fund_member(uuid),
  public.ledger_my_funds()
to authenticated;

revoke execute on function
  public.ledger_fund_default_name(uuid, text),
  public.ledger_fund_transactions_guard(),
  public.ledger_fund_transactions_log()
from public, anon, authenticated;
