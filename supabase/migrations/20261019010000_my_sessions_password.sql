-- Signing a device out asks for your password, checked here against
-- auth.users so the browser can't skip it. Five wrong passwords in 15
-- minutes block further tries until the oldest one ages out.
-- Each function returns 'ok', 'wrong_password' or 'too_many_attempts'
-- instead of raising, so a failed try is still recorded.

create table public.password_failures (
  user_id uuid not null references auth.users (id) on delete cascade,
  failed_at timestamptz not null default now()
);

create index password_failures_user_id_failed_at_idx
  on public.password_failures (user_id, failed_at);

-- Only the functions below touch it.
alter table public.password_failures enable row level security;
revoke all on public.password_failures from anon, authenticated;

create or replace function public.check_my_password(p_password text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  delete from public.password_failures
  where user_id = v_user_id and failed_at <= now() - interval '15 minutes';

  if (select count(*) from public.password_failures where user_id = v_user_id) >= 5 then
    return 'too_many_attempts';
  end if;

  if exists (
    select 1 from auth.users u
    where u.id = v_user_id
      and coalesce(u.encrypted_password, '') <> ''
      and u.encrypted_password = extensions.crypt(p_password, u.encrypted_password)
  ) then
    delete from public.password_failures where user_id = v_user_id;
    return 'ok';
  end if;

  insert into public.password_failures (user_id) values (v_user_id);
  return 'wrong_password';
end;
$$;

-- Internal: only the functions below call it.
revoke execute on function public.check_my_password(text) from public, anon, authenticated;

drop function public.revoke_my_session(uuid);

-- Signs one of your other devices out.
create or replace function public.revoke_my_session(p_session_id uuid, p_password text)
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

  delete from auth.sessions
  where id = p_session_id
    and user_id = auth.uid()
    and id <> (auth.jwt() ->> 'session_id')::uuid;
  return 'ok';
end;
$$;

-- Signs every device out except this one.
create or replace function public.revoke_my_other_sessions(p_password text)
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

  delete from auth.sessions
  where user_id = auth.uid()
    and id <> (auth.jwt() ->> 'session_id')::uuid;
  return 'ok';
end;
$$;

revoke execute on function public.revoke_my_session(uuid, text) from public, anon;
revoke execute on function public.revoke_my_other_sessions(text) from public, anon;
grant execute on function public.revoke_my_session(uuid, text) to authenticated;
grant execute on function public.revoke_my_other_sessions(text) to authenticated;
