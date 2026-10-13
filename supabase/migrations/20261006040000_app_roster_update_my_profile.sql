-- Lets any member (owner or teacher) edit their own name, phone and color in a
-- center. Other member fields stay owner-only through RLS.

create or replace function public.roster_update_my_profile(
  p_center_id uuid,
  p_display_name text,
  p_phone text,
  p_color text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.roster_members m
  set display_name = btrim(p_display_name),
      phone        = nullif(btrim(p_phone), ''),
      color        = p_color
  where m.center_id = p_center_id
    and m.user_id = auth.uid()
    and m.status = 'active';

  if not found then
    raise exception 'You aren''t a member of this center' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.roster_update_my_profile(uuid, text, text, text) from public, anon;
grant execute on function public.roster_update_my_profile(uuid, text, text, text) to authenticated;
