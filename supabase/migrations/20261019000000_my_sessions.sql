-- Devices signed in to your account: one auth.sessions row per sign-in.
-- auth.sessions isn't exposed to the API, so these functions read and revoke
-- the caller's own rows only.

-- Your sessions, this device first, then most recently active.
create or replace function public.list_my_sessions()
returns table (
  id uuid,
  user_agent text,
  ip text,
  created_at timestamptz,
  last_active_at timestamptz,
  is_current boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id,
    s.user_agent,
    host(s.ip),
    s.created_at,
    coalesce(s.refreshed_at at time zone 'utc', s.updated_at, s.created_at),
    s.id = (auth.jwt() ->> 'session_id')::uuid
  from auth.sessions s
  where s.user_id = auth.uid()
    and (s.not_after is null or s.not_after > now())
  order by 6 desc, 5 desc;
$$;

-- Signs one of your devices out. Deleting the session also deletes its
-- refresh tokens, so that device can't renew its access token; the one it
-- holds keeps working until it expires (JWT expiry, 1 hour by default).
create or replace function public.revoke_my_session(p_session_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.sessions
  where id = p_session_id and user_id = auth.uid();
$$;

revoke execute on function public.list_my_sessions() from public, anon;
revoke execute on function public.revoke_my_session(uuid) from public, anon;
grant execute on function public.list_my_sessions() to authenticated;
grant execute on function public.revoke_my_session(uuid) to authenticated;
