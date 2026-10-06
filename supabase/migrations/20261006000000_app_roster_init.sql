create extension if not exists btree_gist with schema extensions;

create or replace function public.roster_valid_labels(p_labels jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(p_labels) = 'object'
    and not exists (
      select 1
      from jsonb_each(p_labels) as e (key, value)
      where e.key not in ('center', 'centers', 'branch', 'branches', 'trainer', 'trainers', 'session_type', 'session_types')
         or jsonb_typeof(e.value) <> 'string'
         or char_length(btrim(e.value #>> '{}')) not between 1 and 30
    );
$$;

create or replace function public.roster_currency_digits(p_currency text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case
    when p_currency in ('VND', 'JPY', 'KRW', 'CLP', 'ISK', 'UGX', 'PYG', 'XAF', 'XOF', 'XPF', 'RWF', 'KMF', 'GNF', 'VUV', 'DJF', 'BIF') then 0
    else 2
  end;
$$;

create table public.roster_centers (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null check (char_length(btrim(name)) between 1 and 120),
  timezone            text not null default 'Asia/Ho_Chi_Minh',
  week_start          smallint not null default 1 check (week_start in (0, 1)),
  default_session_min smallint not null default 60 check (default_session_min between 15 and 480),
  past_edit_days      smallint not null default 7 check (past_edit_days between 0 and 90),
  currency            text not null default 'VND' check (currency ~ '^[A-Z]{3}$'),
  business_type       text not null default 'other' check (business_type in ('music', 'language', 'fitness', 'tutoring', 'dance', 'sports', 'art_stem', 'other')),
  labels              jsonb not null default '{}'::jsonb check (public.roster_valid_labels(labels)),
  created_by          uuid default auth.uid() references auth.users (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index roster_centers_created_by_idx on public.roster_centers (created_by);

create table public.roster_members (
  id             uuid primary key default gen_random_uuid(),
  center_id      uuid not null references public.roster_centers (id) on delete cascade,
  user_id        uuid references auth.users (id) on delete set null,
  role           text not null default 'trainer' check (role in ('owner', 'trainer')),
  status         text not null default 'invited' check (status in ('invited', 'active', 'inactive')),
  display_name   text not null check (char_length(btrim(display_name)) between 1 and 80),
  email          text not null check (email = lower(email) and char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone          text check (char_length(phone) <= 40),
  color          text not null default '#3b82f6' check (color ~ '^#[0-9a-f]{6}$'),
  any_branch     boolean not null default false,
  deactivated_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (center_id, id),
  unique (center_id, email),
  check (status <> 'invited' or user_id is null),
  check (status <> 'active' or user_id is not null)
);

create unique index roster_members_center_user_key on public.roster_members (center_id, user_id) where user_id is not null;
create unique index roster_members_one_owner_key on public.roster_members (center_id) where role = 'owner';
create index roster_members_user_id_idx on public.roster_members (user_id);
create index roster_members_email_idx on public.roster_members (email) where status = 'invited';

create table public.roster_branches (
  id          uuid primary key default gen_random_uuid(),
  center_id   uuid not null references public.roster_centers (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 120),
  code        text not null check (char_length(btrim(code)) between 1 and 8),
  address     text check (char_length(address) <= 300),
  color       text not null default '#3b82f6' check (color ~ '^#[0-9a-f]{6}$'),
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (center_id, id),
  unique (center_id, code)
);

create table public.roster_member_branches (
  center_id  uuid not null,
  member_id  uuid not null,
  branch_id  uuid not null,
  created_at timestamptz not null default now(),
  primary key (member_id, branch_id),
  foreign key (center_id, member_id) references public.roster_members (center_id, id) on delete cascade,
  foreign key (center_id, branch_id) references public.roster_branches (center_id, id) on delete cascade
);

create index roster_member_branches_center_member_idx on public.roster_member_branches (center_id, member_id);
create index roster_member_branches_center_branch_idx on public.roster_member_branches (center_id, branch_id);

create table public.roster_session_types (
  id                 uuid primary key default gen_random_uuid(),
  center_id          uuid not null references public.roster_centers (id) on delete cascade,
  name               text not null check (char_length(btrim(name)) between 1 and 80),
  default_hourly_fee numeric(14, 2) not null default 0 check (default_hourly_fee >= 0),
  archived_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (center_id, id),
  unique (center_id, name)
);

create table public.roster_member_session_types (
  center_id       uuid not null,
  member_id       uuid not null,
  session_type_id uuid not null,
  hourly_fee      numeric(14, 2) check (hourly_fee >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (member_id, session_type_id),
  foreign key (center_id, member_id) references public.roster_members (center_id, id) on delete cascade,
  foreign key (center_id, session_type_id) references public.roster_session_types (center_id, id) on delete cascade
);

create index roster_member_session_types_center_member_idx on public.roster_member_session_types (center_id, member_id);
create index roster_member_session_types_center_type_idx on public.roster_member_session_types (center_id, session_type_id);

create table public.roster_sessions (
  id              uuid primary key default gen_random_uuid(),
  center_id       uuid not null references public.roster_centers (id) on delete cascade,
  member_id       uuid not null,
  branch_id       uuid not null,
  session_type_id uuid not null,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  title           text check (char_length(title) <= 120),
  note            text check (char_length(note) <= 1000),
  status          text not null default 'scheduled' check (status in ('scheduled', 'missed', 'cancelled')),
  series_id       uuid,
  created_by      uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  foreign key (center_id, member_id) references public.roster_members (center_id, id),
  foreign key (center_id, branch_id) references public.roster_branches (center_id, id),
  foreign key (center_id, session_type_id) references public.roster_session_types (center_id, id),
  check (ends_at > starts_at and ends_at - starts_at <= interval '12 hours'),
  constraint roster_sessions_no_overlap exclude using gist (
    member_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status = 'scheduled')
);

create index roster_sessions_center_starts_idx on public.roster_sessions (center_id, starts_at);
create index roster_sessions_member_starts_idx on public.roster_sessions (member_id, starts_at);
create index roster_sessions_center_member_idx on public.roster_sessions (center_id, member_id);
create index roster_sessions_center_branch_idx on public.roster_sessions (center_id, branch_id);
create index roster_sessions_center_type_idx on public.roster_sessions (center_id, session_type_id);
create index roster_sessions_created_by_idx on public.roster_sessions (created_by);
create index roster_sessions_updated_by_idx on public.roster_sessions (updated_by);

create table public.roster_fees (
  id          uuid primary key default gen_random_uuid(),
  center_id   uuid not null references public.roster_centers (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 80),
  amount      numeric(14, 2) not null check (amount >= 0),
  unit        text not null check (unit in ('per_session', 'per_hour', 'per_month')),
  all_members boolean not null default true,
  branch_id   uuid,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (center_id, id),
  foreign key (center_id, branch_id) references public.roster_branches (center_id, id),
  check (unit <> 'per_month' or branch_id is null)
);

create index roster_fees_center_branch_idx on public.roster_fees (center_id, branch_id);

create table public.roster_fee_members (
  center_id uuid not null,
  fee_id    uuid not null,
  member_id uuid not null,
  primary key (fee_id, member_id),
  foreign key (center_id, fee_id) references public.roster_fees (center_id, id) on delete cascade,
  foreign key (center_id, member_id) references public.roster_members (center_id, id) on delete cascade
);

create index roster_fee_members_center_fee_idx on public.roster_fee_members (center_id, fee_id);
create index roster_fee_members_center_member_idx on public.roster_fee_members (center_id, member_id);

create table public.roster_month_closes (
  center_id uuid not null references public.roster_centers (id) on delete cascade,
  month     date not null check (extract(day from month) = 1),
  closed_by uuid default auth.uid() references auth.users (id) on delete set null,
  closed_at timestamptz not null default now(),
  primary key (center_id, month)
);

create index roster_month_closes_closed_by_idx on public.roster_month_closes (closed_by);

create table public.roster_income_lines (
  id              uuid primary key default gen_random_uuid(),
  center_id       uuid not null,
  month           date not null,
  member_id       uuid not null,
  kind            text not null check (kind in ('base', 'fee')),
  session_type_id uuid references public.roster_session_types (id) on delete set null,
  fee_id          uuid references public.roster_fees (id) on delete set null,
  label           text not null,
  quantity        numeric(10, 2) not null,
  unit_amount     numeric(14, 2) not null,
  amount          numeric(14, 2) not null,
  sessions        integer not null default 0,
  foreign key (center_id, month) references public.roster_month_closes (center_id, month) on delete cascade,
  foreign key (center_id, member_id) references public.roster_members (center_id, id) on delete cascade
);

create index roster_income_lines_center_month_idx on public.roster_income_lines (center_id, month);
create index roster_income_lines_center_member_idx on public.roster_income_lines (center_id, member_id);
create index roster_income_lines_session_type_idx on public.roster_income_lines (session_type_id);
create index roster_income_lines_fee_idx on public.roster_income_lines (fee_id);

create trigger roster_centers_updated_at before update on public.roster_centers
  for each row execute function public.set_updated_at();
create trigger roster_members_updated_at before update on public.roster_members
  for each row execute function public.set_updated_at();
create trigger roster_branches_updated_at before update on public.roster_branches
  for each row execute function public.set_updated_at();
create trigger roster_session_types_updated_at before update on public.roster_session_types
  for each row execute function public.set_updated_at();
create trigger roster_member_session_types_updated_at before update on public.roster_member_session_types
  for each row execute function public.set_updated_at();
create trigger roster_sessions_updated_at before update on public.roster_sessions
  for each row execute function public.set_updated_at();
create trigger roster_fees_updated_at before update on public.roster_fees
  for each row execute function public.set_updated_at();

create or replace function public.roster_member_id(p_center_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.id
  from public.roster_members m
  where m.center_id = p_center_id
    and m.user_id = (select auth.uid())
    and m.status = 'active';
$$;

create or replace function public.roster_is_owner(p_center_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.roster_members m
    where m.center_id = p_center_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role = 'owner'
  );
$$;

create or replace function public.roster_can_book(p_member_id uuid, p_branch_id uuid, p_session_type_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.roster_members m
    where m.id = p_member_id
      and (
        m.role = 'owner'
        or (
          (m.any_branch or exists (
            select 1 from public.roster_member_branches mb
            where mb.member_id = m.id and mb.branch_id = p_branch_id
          ))
          and exists (
            select 1 from public.roster_member_session_types mst
            where mst.member_id = m.id and mst.session_type_id = p_session_type_id
          )
        )
      )
  );
$$;

create or replace function public.roster_month_open(p_center_id uuid, p_ts timestamptz)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1
    from public.roster_month_closes mc
    join public.roster_centers c on c.id = mc.center_id
    where mc.center_id = p_center_id
      and mc.month = date_trunc('month', p_ts at time zone c.timezone)::date
  );
$$;

create or replace function public.roster_trainer_can_edit(p_center_id uuid, p_starts_at timestamptz)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.roster_centers c
    cross join lateral (select (now() at time zone c.timezone)::date as today) t
    where c.id = p_center_id
      and p_starts_at >= case
        when c.past_edit_days = 0 then now()
        else (t.today - c.past_edit_days)::timestamp at time zone c.timezone
      end
      and p_starts_at < (((t.today + interval '1 month')::date + 1)::timestamp at time zone c.timezone)
  );
$$;

create or replace function public.roster_centers_validate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'Unknown timezone %', new.timezone using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger roster_centers_validate before insert or update of timezone on public.roster_centers
  for each row execute function public.roster_centers_validate();

create or replace function public.roster_members_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is null and old.user_id is not null and new.status = 'active' then
    new.status := 'inactive';
  end if;

  if current_user = 'authenticated' then
    if new.center_id <> old.center_id
       or new.role <> old.role
       or new.user_id is distinct from old.user_id then
      raise exception 'This change is not allowed' using errcode = '42501';
    end if;
    if old.role = 'owner' and new.status <> old.status then
      raise exception 'The owner can''t be deactivated' using errcode = '42501';
    end if;
  end if;

  if new.status = 'inactive' and old.status <> 'inactive' then
    new.deactivated_at := now();
  elsif new.status <> 'inactive' then
    new.deactivated_at := null;
  end if;

  return new;
end;
$$;

create trigger roster_members_guard before update on public.roster_members
  for each row execute function public.roster_members_guard();

create or replace function public.roster_sessions_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(v_uid, new.created_by);
    new.updated_by := null;
  else
    if new.center_id <> old.center_id then
      raise exception 'A session can''t move to another center' using errcode = '42501';
    end if;
    new.created_by := old.created_by;
    new.updated_by := coalesce(v_uid, new.updated_by);
  end if;

  if tg_op = 'INSERT' or new.branch_id <> old.branch_id then
    if exists (select 1 from public.roster_branches b where b.id = new.branch_id and b.archived_at is not null) then
      raise exception 'This branch is archived' using errcode = '23514';
    end if;
  end if;

  if tg_op = 'INSERT' or new.session_type_id <> old.session_type_id then
    if exists (select 1 from public.roster_session_types st where st.id = new.session_type_id and st.archived_at is not null) then
      raise exception 'This session type is archived' using errcode = '23514';
    end if;
  end if;

  if tg_op = 'INSERT' or new.member_id <> old.member_id then
    if exists (select 1 from public.roster_members m where m.id = new.member_id and m.status = 'inactive') then
      raise exception 'This trainer is inactive' using errcode = '23514';
    end if;
  end if;

  if tg_op = 'UPDATE'
     and v_uid is not null
     and not public.roster_is_owner(new.center_id)
     and (new.branch_id <> old.branch_id or new.session_type_id <> old.session_type_id)
     and not public.roster_can_book(new.member_id, new.branch_id, new.session_type_id) then
    raise exception 'You aren''t assigned to this branch or session type' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger roster_sessions_guard before insert or update on public.roster_sessions
  for each row execute function public.roster_sessions_guard();

alter table public.roster_centers              enable row level security;
alter table public.roster_members              enable row level security;
alter table public.roster_branches             enable row level security;
alter table public.roster_member_branches      enable row level security;
alter table public.roster_session_types        enable row level security;
alter table public.roster_member_session_types enable row level security;
alter table public.roster_sessions             enable row level security;
alter table public.roster_fees                 enable row level security;
alter table public.roster_fee_members          enable row level security;
alter table public.roster_month_closes         enable row level security;
alter table public.roster_income_lines         enable row level security;

create policy "roster_centers: members read" on public.roster_centers for select to authenticated
  using (public.roster_member_id(id) is not null);
create policy "roster_centers: owner updates" on public.roster_centers for update to authenticated
  using (public.roster_is_owner(id)) with check (public.roster_is_owner(id));
create policy "roster_centers: owner deletes" on public.roster_centers for delete to authenticated
  using (public.roster_is_owner(id));

create policy "roster_members: owner or self reads" on public.roster_members for select to authenticated
  using (public.roster_is_owner(center_id) or user_id = (select auth.uid()));
create policy "roster_members: owner invites" on public.roster_members for insert to authenticated
  with check (public.roster_is_owner(center_id) and role = 'trainer' and status = 'invited' and user_id is null);
create policy "roster_members: owner updates" on public.roster_members for update to authenticated
  using (public.roster_is_owner(center_id)) with check (public.roster_is_owner(center_id));
create policy "roster_members: owner removes trainers" on public.roster_members for delete to authenticated
  using (public.roster_is_owner(center_id) and role = 'trainer');

create policy "roster_branches: members read" on public.roster_branches for select to authenticated
  using (public.roster_member_id(center_id) is not null);
create policy "roster_branches: owner inserts" on public.roster_branches for insert to authenticated
  with check (public.roster_is_owner(center_id));
create policy "roster_branches: owner updates" on public.roster_branches for update to authenticated
  using (public.roster_is_owner(center_id)) with check (public.roster_is_owner(center_id));
create policy "roster_branches: owner deletes" on public.roster_branches for delete to authenticated
  using (public.roster_is_owner(center_id));

create policy "roster_member_branches: owner or self reads" on public.roster_member_branches for select to authenticated
  using (public.roster_is_owner(center_id) or member_id = public.roster_member_id(center_id));
create policy "roster_member_branches: owner inserts" on public.roster_member_branches for insert to authenticated
  with check (public.roster_is_owner(center_id));
create policy "roster_member_branches: owner deletes" on public.roster_member_branches for delete to authenticated
  using (public.roster_is_owner(center_id));

create policy "roster_session_types: owner manages" on public.roster_session_types for all to authenticated
  using (public.roster_is_owner(center_id)) with check (public.roster_is_owner(center_id));

create policy "roster_member_session_types: owner or self reads" on public.roster_member_session_types for select to authenticated
  using (public.roster_is_owner(center_id) or member_id = public.roster_member_id(center_id));
create policy "roster_member_session_types: owner inserts" on public.roster_member_session_types for insert to authenticated
  with check (public.roster_is_owner(center_id));
create policy "roster_member_session_types: owner updates" on public.roster_member_session_types for update to authenticated
  using (public.roster_is_owner(center_id)) with check (public.roster_is_owner(center_id));
create policy "roster_member_session_types: owner deletes" on public.roster_member_session_types for delete to authenticated
  using (public.roster_is_owner(center_id));

create policy "roster_sessions: members read" on public.roster_sessions for select to authenticated
  using (public.roster_member_id(center_id) is not null);
create policy "roster_sessions: owner or trainer books" on public.roster_sessions for insert to authenticated
  with check (
    public.roster_month_open(center_id, starts_at)
    and (
      public.roster_is_owner(center_id)
      or (
        member_id = public.roster_member_id(center_id)
        and public.roster_can_book(member_id, branch_id, session_type_id)
        and public.roster_trainer_can_edit(center_id, starts_at)
      )
    )
  );
create policy "roster_sessions: owner or trainer edits" on public.roster_sessions for update to authenticated
  using (
    public.roster_month_open(center_id, starts_at)
    and (
      public.roster_is_owner(center_id)
      or (member_id = public.roster_member_id(center_id) and public.roster_trainer_can_edit(center_id, starts_at))
    )
  )
  with check (
    public.roster_month_open(center_id, starts_at)
    and (
      public.roster_is_owner(center_id)
      or (member_id = public.roster_member_id(center_id) and public.roster_trainer_can_edit(center_id, starts_at))
    )
  );
create policy "roster_sessions: owner or trainer deletes" on public.roster_sessions for delete to authenticated
  using (
    public.roster_month_open(center_id, starts_at)
    and (
      public.roster_is_owner(center_id)
      or (member_id = public.roster_member_id(center_id) and starts_at > now())
    )
  );

create policy "roster_fees: owner manages" on public.roster_fees for all to authenticated
  using (public.roster_is_owner(center_id)) with check (public.roster_is_owner(center_id));

create policy "roster_fee_members: owner manages" on public.roster_fee_members for all to authenticated
  using (public.roster_is_owner(center_id)) with check (public.roster_is_owner(center_id));

create policy "roster_month_closes: members read" on public.roster_month_closes for select to authenticated
  using (public.roster_member_id(center_id) is not null);

create policy "roster_income_lines: owner or self reads" on public.roster_income_lines for select to authenticated
  using (public.roster_is_owner(center_id) or member_id = public.roster_member_id(center_id));

revoke all on table
  public.roster_centers,
  public.roster_members,
  public.roster_branches,
  public.roster_member_branches,
  public.roster_session_types,
  public.roster_member_session_types,
  public.roster_sessions,
  public.roster_fees,
  public.roster_fee_members,
  public.roster_month_closes,
  public.roster_income_lines
from anon, authenticated;

grant select, update, delete         on public.roster_centers              to authenticated;
grant select, insert, update, delete on public.roster_members              to authenticated;
grant select, insert, update, delete on public.roster_branches             to authenticated;
grant select, insert, delete         on public.roster_member_branches      to authenticated;
grant select, insert, update, delete on public.roster_session_types        to authenticated;
grant select, insert, update, delete on public.roster_member_session_types to authenticated;
grant select, insert, update, delete on public.roster_sessions             to authenticated;
grant select, insert, update, delete on public.roster_fees                 to authenticated;
grant select, insert, delete         on public.roster_fee_members          to authenticated;
grant select                         on public.roster_month_closes         to authenticated;
grant select                         on public.roster_income_lines         to authenticated;

create or replace function public.roster_create_center(
  p_name text,
  p_timezone text,
  p_currency text,
  p_business_type text,
  p_labels jsonb,
  p_display_name text,
  p_color text,
  p_session_types jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(auth.jwt() ->> 'email');
  v_center uuid;
begin
  if v_uid is null or v_email is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  insert into public.roster_centers (name, timezone, currency, business_type, labels, created_by)
  values (btrim(p_name), p_timezone, p_currency, p_business_type, coalesce(p_labels, '{}'::jsonb), v_uid)
  returning id into v_center;

  insert into public.roster_members (center_id, user_id, role, status, display_name, email, color)
  values (v_center, v_uid, 'owner', 'active', btrim(p_display_name), v_email, p_color);

  insert into public.roster_session_types (center_id, name, default_hourly_fee)
  select v_center, btrim(t ->> 'name'), coalesce((t ->> 'default_hourly_fee')::numeric, 0)
  from jsonb_array_elements(coalesce(p_session_types, '[]'::jsonb)) as t;

  return v_center;
end;
$$;

create or replace function public.roster_pending_invites()
returns table (member_id uuid, center_id uuid, center_name text, display_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.center_id, c.name, m.display_name
  from public.roster_members m
  join public.roster_centers c on c.id = m.center_id
  where m.status = 'invited'
    and m.email = lower((select auth.jwt()) ->> 'email')
    and not exists (
      select 1 from public.roster_members x
      where x.center_id = m.center_id and x.user_id = (select auth.uid())
    )
  order by m.created_at;
$$;

create or replace function public.roster_claim_invite(p_member_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(auth.jwt() ->> 'email');
  v_center uuid;
begin
  if v_uid is null or v_email is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  update public.roster_members m
  set user_id = v_uid, status = 'active'
  where m.id = p_member_id and m.status = 'invited' and m.email = v_email
  returning m.center_id into v_center;

  if v_center is null then
    raise exception 'This invite is no longer available' using errcode = 'P0002';
  end if;

  return v_center;
end;
$$;

create or replace function public.roster_leave_center(p_center_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.roster_members m
  set status = 'inactive', user_id = null
  where m.center_id = p_center_id
    and m.user_id = auth.uid()
    and m.role = 'trainer'
    and m.status = 'active';

  if not found then
    raise exception 'Only trainers can leave a center' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.roster_member_directory(p_center_id uuid)
returns table (id uuid, center_id uuid, user_id uuid, display_name text, color text, role text, status text)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.center_id, m.user_id, m.display_name, m.color, m.role, m.status
  from public.roster_members m
  where m.center_id = p_center_id
    and public.roster_member_id(p_center_id) is not null
  order by m.role = 'owner' desc, m.display_name;
$$;

create or replace function public.roster_session_type_directory(p_center_id uuid)
returns table (id uuid, center_id uuid, name text, archived_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select st.id, st.center_id, st.name, st.archived_at
  from public.roster_session_types st
  where st.center_id = p_center_id
    and public.roster_member_id(p_center_id) is not null
  order by st.name;
$$;

create or replace function public.roster_my_rates(p_center_id uuid)
returns table (kind text, ref_id uuid, name text, amount numeric, unit text, branch_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (select public.roster_member_id(p_center_id) as id)
  select 'session_type'::text, st.id, st.name, coalesce(mst.hourly_fee, st.default_hourly_fee), 'per_hour'::text, null::uuid
  from me
  join public.roster_member_session_types mst on mst.member_id = me.id
  join public.roster_session_types st on st.id = mst.session_type_id
  where st.archived_at is null
  union all
  select 'fee'::text, f.id, f.name, f.amount, f.unit, f.branch_id
  from me
  join public.roster_fees f on f.center_id = p_center_id and f.active
  where f.all_members
     or exists (select 1 from public.roster_fee_members fm where fm.fee_id = f.id and fm.member_id = me.id);
$$;

create or replace function public.roster_compute_income(p_center_id uuid, p_month date, p_member_id uuid)
returns table (
  member_id uuid, kind text, session_type_id uuid, fee_id uuid, label text,
  quantity numeric, unit_amount numeric, amount numeric, sessions integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with c as (
    select
      (p_month::timestamp at time zone ctr.timezone) as m_start,
      ((p_month + interval '1 month')::timestamp at time zone ctr.timezone) as m_end,
      public.roster_currency_digits(ctr.currency) as digits
    from public.roster_centers ctr
    where ctr.id = p_center_id
  ),
  mem as (
    select m.id, m.created_at, m.deactivated_at
    from public.roster_members m
    where m.center_id = p_center_id
      and (p_member_id is null or m.id = p_member_id)
  ),
  done as (
    select s.member_id, s.branch_id, s.session_type_id,
           extract(epoch from (s.ends_at - s.starts_at)) / 3600.0 as hours
    from public.roster_sessions s
    cross join c
    where s.center_id = p_center_id
      and s.member_id in (select mem.id from mem)
      and s.status = 'scheduled'
      and s.starts_at >= c.m_start
      and s.starts_at < c.m_end
      and s.ends_at <= now()
  ),
  lines as (
    select d.member_id, 'base'::text as kind, d.session_type_id, null::uuid as fee_id, st.name as label,
           sum(d.hours) as qty,
           coalesce(mst.hourly_fee, st.default_hourly_fee) as unit_amount,
           count(*)::integer as sessions
    from done d
    join public.roster_session_types st on st.id = d.session_type_id
    left join public.roster_member_session_types mst
      on mst.member_id = d.member_id and mst.session_type_id = d.session_type_id
    group by d.member_id, d.session_type_id, st.name, mst.hourly_fee, st.default_hourly_fee
    union all
    select m.id, 'fee'::text, null::uuid, f.id, f.name,
           case f.unit
             when 'per_month' then
               case when m.created_at < c.m_end and (m.deactivated_at is null or m.deactivated_at >= c.m_start) then 1 else 0 end
             when 'per_hour' then
               (select coalesce(sum(d.hours), 0) from done d where d.member_id = m.id and (f.branch_id is null or d.branch_id = f.branch_id))
             else
               (select count(*) from done d where d.member_id = m.id and (f.branch_id is null or d.branch_id = f.branch_id))
           end::numeric,
           f.amount,
           case when f.unit = 'per_month' then 0
             else (select count(*)::integer from done d where d.member_id = m.id and (f.branch_id is null or d.branch_id = f.branch_id))
           end
    from mem m
    cross join c
    join public.roster_fees f on f.center_id = p_center_id and f.active
    where f.all_members
       or exists (select 1 from public.roster_fee_members fm where fm.fee_id = f.id and fm.member_id = m.id)
  )
  select l.member_id, l.kind, l.session_type_id, l.fee_id, l.label,
         round(l.qty, 2), l.unit_amount, round(l.qty * l.unit_amount, c.digits), l.sessions
  from lines l
  cross join c
  where l.qty > 0
  order by l.member_id, l.kind, l.label;
$$;

create or replace function public.roster_income(p_center_id uuid, p_month date, p_member_id uuid default null)
returns table (
  member_id uuid, kind text, session_type_id uuid, fee_id uuid, label text,
  quantity numeric, unit_amount numeric, amount numeric, sessions integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_me uuid := public.roster_member_id(p_center_id);
  v_member uuid := p_member_id;
  v_month date := date_trunc('month', p_month)::date;
begin
  if v_me is null then
    raise exception 'Not a member of this center' using errcode = '42501';
  end if;

  if not public.roster_is_owner(p_center_id) then
    if v_member is not null and v_member <> v_me then
      raise exception 'You can only see your own income' using errcode = '42501';
    end if;
    v_member := v_me;
  end if;

  if exists (select 1 from public.roster_month_closes mc where mc.center_id = p_center_id and mc.month = v_month) then
    return query
      select l.member_id, l.kind, l.session_type_id, l.fee_id, l.label,
             l.quantity::numeric, l.unit_amount::numeric, l.amount::numeric, l.sessions
      from public.roster_income_lines l
      where l.center_id = p_center_id
        and l.month = v_month
        and (v_member is null or l.member_id = v_member)
      order by l.member_id, l.kind, l.label;
  else
    return query
      select * from public.roster_compute_income(p_center_id, v_month, v_member);
  end if;
end;
$$;

create or replace function public.roster_close_month(p_center_id uuid, p_month date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_month date := date_trunc('month', p_month)::date;
  v_current date;
begin
  if not public.roster_is_owner(p_center_id) then
    raise exception 'Only the owner can close a month' using errcode = '42501';
  end if;

  select date_trunc('month', now() at time zone c.timezone)::date
  into v_current
  from public.roster_centers c
  where c.id = p_center_id;

  if v_month >= v_current then
    raise exception 'Only past months can be closed' using errcode = '22023';
  end if;

  insert into public.roster_month_closes (center_id, month, closed_by)
  values (p_center_id, v_month, auth.uid());

  insert into public.roster_income_lines
    (center_id, month, member_id, kind, session_type_id, fee_id, label, quantity, unit_amount, amount, sessions)
  select p_center_id, v_month, i.member_id, i.kind, i.session_type_id, i.fee_id, i.label,
         i.quantity, i.unit_amount, i.amount, i.sessions
  from public.roster_compute_income(p_center_id, v_month, null) as i;
end;
$$;

create or replace function public.roster_reopen_month(p_center_id uuid, p_month date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.roster_is_owner(p_center_id) then
    raise exception 'Only the owner can reopen a month' using errcode = '42501';
  end if;

  delete from public.roster_month_closes mc
  where mc.center_id = p_center_id and mc.month = date_trunc('month', p_month)::date;
end;
$$;

revoke execute on function
  public.roster_valid_labels(jsonb),
  public.roster_currency_digits(text),
  public.roster_member_id(uuid),
  public.roster_is_owner(uuid),
  public.roster_can_book(uuid, uuid, uuid),
  public.roster_month_open(uuid, timestamptz),
  public.roster_trainer_can_edit(uuid, timestamptz),
  public.roster_create_center(text, text, text, text, jsonb, text, text, jsonb),
  public.roster_pending_invites(),
  public.roster_claim_invite(uuid),
  public.roster_leave_center(uuid),
  public.roster_member_directory(uuid),
  public.roster_session_type_directory(uuid),
  public.roster_my_rates(uuid),
  public.roster_income(uuid, date, uuid),
  public.roster_close_month(uuid, date),
  public.roster_reopen_month(uuid, date)
from public, anon;

grant execute on function
  public.roster_valid_labels(jsonb),
  public.roster_currency_digits(text),
  public.roster_member_id(uuid),
  public.roster_is_owner(uuid),
  public.roster_can_book(uuid, uuid, uuid),
  public.roster_month_open(uuid, timestamptz),
  public.roster_trainer_can_edit(uuid, timestamptz),
  public.roster_create_center(text, text, text, text, jsonb, text, text, jsonb),
  public.roster_pending_invites(),
  public.roster_claim_invite(uuid),
  public.roster_leave_center(uuid),
  public.roster_member_directory(uuid),
  public.roster_session_type_directory(uuid),
  public.roster_my_rates(uuid),
  public.roster_income(uuid, date, uuid),
  public.roster_close_month(uuid, date),
  public.roster_reopen_month(uuid, date)
to authenticated;

revoke execute on function
  public.roster_compute_income(uuid, date, uuid),
  public.roster_centers_validate(),
  public.roster_members_guard(),
  public.roster_sessions_guard()
from public, anon, authenticated;
