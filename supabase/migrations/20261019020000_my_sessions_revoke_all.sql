-- "Sign out all devices" now includes the device asking: it replaces
-- revoke_my_other_sessions, which kept the caller's session.

drop function public.revoke_my_other_sessions(text);

-- Signs every device out, this one included. The caller then clears its own
-- local session. Returns 'ok', 'wrong_password' or 'too_many_attempts'.
create or replace function public.revoke_all_my_sessions(p_password text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text := public.check_my_password(p_password);
begin
  if v_status <> 'ok' then
    return v_status;
  end if;

  delete from auth.sessions where user_id = auth.uid();
  return 'ok';
end;
$$;

revoke execute on function public.revoke_all_my_sessions(text) from public, anon;
grant execute on function public.revoke_all_my_sessions(text) to authenticated;
