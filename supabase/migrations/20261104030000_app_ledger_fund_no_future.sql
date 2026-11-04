-- A fund transaction can't be dated in the future. The app blocks days after
-- the user's today; the database allows one day past its own (UTC) date so a
-- user ahead of UTC (e.g. Vietnam, UTC+7) can still pick their today.

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

  if (tg_op = 'INSERT' or new.occurred_on <> old.occurred_on)
     and new.occurred_on > current_date + 1 then
    raise exception 'The date can''t be in the future' using errcode = '23514';
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
