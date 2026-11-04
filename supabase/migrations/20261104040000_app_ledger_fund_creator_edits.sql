-- Only whoever added a fund transaction edits or deletes (soft delete) it,
-- the owner included only for their own. Members still read and add.

drop policy "ledger_fund_transactions: owner edits" on public.ledger_fund_transactions;

create policy "ledger_fund_transactions: creator edits" on public.ledger_fund_transactions for update to authenticated
  using (deleted_at is null and created_by = public.ledger_fund_member_id(fund_id))
  with check (created_by = public.ledger_fund_member_id(fund_id));
