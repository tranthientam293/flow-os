create table public.ledger_expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  amount      bigint not null check (amount > 0),
  category_id text not null check (category_id ~ '^[a-z0-9-]{1,64}$'),
  note        text check (char_length(note) <= 200),
  spent_on    date not null default current_date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index ledger_expenses_user_spent_on_idx on public.ledger_expenses (user_id, spent_on desc, created_at desc);

alter table public.ledger_expenses enable row level security;

create policy "ledger_expenses: read own"   on public.ledger_expenses for select to authenticated using ((select auth.uid()) = user_id);
create policy "ledger_expenses: insert own" on public.ledger_expenses for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "ledger_expenses: update own" on public.ledger_expenses for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "ledger_expenses: delete own" on public.ledger_expenses for delete to authenticated using ((select auth.uid()) = user_id);

create trigger ledger_expenses_updated_at before update on public.ledger_expenses
  for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.ledger_expenses to authenticated;
