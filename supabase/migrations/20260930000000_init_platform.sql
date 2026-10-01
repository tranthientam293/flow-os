create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own"   on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.installed_apps (
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  app_id       text not null check (app_id ~ '^[a-z0-9-]{1,64}$'),
  position     integer not null default 0,
  installed_at timestamptz not null default now(),
  primary key (user_id, app_id)
);

alter table public.installed_apps enable row level security;

create policy "installed_apps: read own"   on public.installed_apps for select to authenticated using ((select auth.uid()) = user_id);
create policy "installed_apps: insert own" on public.installed_apps for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "installed_apps: update own" on public.installed_apps for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "installed_apps: delete own" on public.installed_apps for delete to authenticated using ((select auth.uid()) = user_id);

create table public.app_storage (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  app_id     text not null check (app_id ~ '^[a-z0-9-]{1,64}$'),
  key        text not null check (char_length(key) between 1 and 128),
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, app_id, key)
);

alter table public.app_storage enable row level security;

create policy "app_storage: read own"   on public.app_storage for select to authenticated using ((select auth.uid()) = user_id);
create policy "app_storage: insert own" on public.app_storage for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "app_storage: update own" on public.app_storage for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "app_storage: delete own" on public.app_storage for delete to authenticated using ((select auth.uid()) = user_id);

create trigger app_storage_updated_at before update on public.app_storage
  for each row execute function public.set_updated_at();

create table public.tasks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 500),
  done       boolean not null default false,
  priority   smallint not null default 0 check (priority between 0 and 3),
  due_date   date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_id_idx on public.tasks (user_id, created_at desc);

alter table public.tasks enable row level security;

create policy "tasks: read own"   on public.tasks for select to authenticated using ((select auth.uid()) = user_id);
create policy "tasks: insert own" on public.tasks for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "tasks: update own" on public.tasks for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "tasks: delete own" on public.tasks for delete to authenticated using ((select auth.uid()) = user_id);

create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

create table public.notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title      text not null default '' check (char_length(title) <= 200),
  body       text not null default '' check (char_length(body) <= 100000),
  pinned     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notes_user_id_idx on public.notes (user_id, updated_at desc);

alter table public.notes enable row level security;

create policy "notes: read own"   on public.notes for select to authenticated using ((select auth.uid()) = user_id);
create policy "notes: insert own" on public.notes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "notes: update own" on public.notes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "notes: delete own" on public.notes for delete to authenticated using ((select auth.uid()) = user_id);

create trigger notes_updated_at before update on public.notes
  for each row execute function public.set_updated_at();

grant select, update                 on public.profiles       to authenticated;
grant select, insert, update, delete on public.installed_apps to authenticated;
grant select, insert, update, delete on public.app_storage    to authenticated;
grant select, insert, update, delete on public.tasks          to authenticated;
grant select, insert, update, delete on public.notes          to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));

  insert into public.installed_apps (user_id, app_id, position)
  values (new.id, 'tasks', 0), (new.id, 'notes', 1), (new.id, 'focus-timer', 2);

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
