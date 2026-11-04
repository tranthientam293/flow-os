-- Only the fund owner edits or deletes (soft delete) transactions. Members
-- still read and add them.

drop policy "ledger_fund_transactions: creator or owner edits" on public.ledger_fund_transactions;

create policy "ledger_fund_transactions: owner edits" on public.ledger_fund_transactions for update to authenticated
  using (deleted_at is null and public.ledger_fund_is_owner(fund_id))
  with check (public.ledger_fund_is_owner(fund_id));
