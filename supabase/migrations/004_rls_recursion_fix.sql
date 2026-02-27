-- Fix stack depth recursion in RLS checks.
-- Root cause: organization_members policies called is_org_member/is_org_admin,
-- and those functions queried organization_members again under RLS.
-- Make helper functions SECURITY DEFINER so they can evaluate membership
-- without recursively re-triggering organization_members policies.

create or replace function is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from organization_members m
    where m.org_id = target_org
      and m.user_id = auth.uid()
  );
$$;

create or replace function is_org_admin(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from organization_members m
    where m.org_id = target_org
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  );
$$;

grant execute on function is_org_member(uuid) to authenticated;
grant execute on function is_org_admin(uuid) to authenticated;
