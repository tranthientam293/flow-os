-- One row per user: Ledger preferences. monthly_limit is in đồng; null means
-- no limit.
create table public.ledger_settings (
  user_id       uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  monthly_limit bigint check (monthly_limit > 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.ledger_settings enable row level security;

create policy "ledger_settings: read own"   on public.ledger_settings for select to authenticated using ((select auth.uid()) = user_id);
create policy "ledger_settings: insert own" on public.ledger_settings for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "ledger_settings: update own" on public.ledger_settings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create trigger ledger_settings_updated_at before update on public.ledger_settings
  for each row execute function public.set_updated_at();

grant select, insert, update on public.ledger_settings to authenticated;
