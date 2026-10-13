-- Owners can include themselves in their center's trainer list: they can then
-- be picked as the trainer for a session, and the center shows up in their own
-- trainer schedule.

alter table public.roster_members
  add column also_trainer boolean not null default false;

drop function public.roster_member_directory(uuid);

create function public.roster_member_directory(p_center_id uuid)
returns table (id uuid, center_id uuid, user_id uuid, display_name text, color text, role text, status text, also_trainer boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.center_id, m.user_id, m.display_name, m.color, m.role, m.status, m.also_trainer
  from public.roster_members m
  where m.center_id = p_center_id
    and public.roster_member_id(p_center_id) is not null
  order by m.role = 'owner' desc, m.display_name;
$$;

revoke execute on function public.roster_member_directory(uuid) from public, anon;
grant execute on function public.roster_member_directory(uuid) to authenticated;
