-- Fix org bootstrap RLS issues for first-time users.
-- 1) Allow org owners to read their own org rows before membership row exists.
-- 2) Allow first owner membership insert for org owned by current user.

drop policy if exists "org member read" on organizations;
create policy "org member or owner read" on organizations
for select
using (is_org_member(id) or owner_id = auth.uid());

drop policy if exists "members manage" on organization_members;

drop policy if exists "members read" on organization_members;

create policy "members read" on organization_members
for select
using (is_org_member(org_id) or exists (
  select 1 from organizations o where o.id = organization_members.org_id and o.owner_id = auth.uid()
));

create policy "members admin manage" on organization_members
for all
using (is_org_admin(org_id))
with check (is_org_admin(org_id));

create policy "members owner bootstrap insert" on organization_members
for insert
with check (
  user_id = auth.uid()
  and role = 'owner'
  and exists (
    select 1 from organizations o
    where o.id = organization_members.org_id
      and o.owner_id = auth.uid()
  )
);
