alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table projects enable row level security;
alter table project_templates enable row level security;
alter table zones enable row level security;
alter table trains enable row level security;
alter table assignments enable row level security;
alter table baselines enable row level security;
alter table public_shares enable row level security;

create function is_org_member(target_org uuid)
returns boolean language sql stable as $$
  select exists(select 1 from organization_members m where m.org_id = target_org and m.user_id = auth.uid());
$$;

create function is_org_admin(target_org uuid)
returns boolean language sql stable as $$
  select exists(select 1 from organization_members m where m.org_id = target_org and m.user_id = auth.uid() and m.role in ('owner','admin'));
$$;

create policy "org member read" on organizations for select using (is_org_member(id));
create policy "org admin update" on organizations for update using (is_org_admin(id));
create policy "org owner insert" on organizations for insert with check (owner_id = auth.uid());

create policy "members read" on organization_members for select using (is_org_member(org_id));
create policy "members manage" on organization_members for all using (is_org_admin(org_id)) with check (is_org_admin(org_id));

create policy "projects org" on projects for all using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy "templates org" on project_templates for all using (is_org_member(org_id)) with check (is_org_member(org_id));

create policy "zones project org" on zones for all using (
  exists(select 1 from projects p where p.id = zones.project_id and is_org_member(p.org_id))
) with check (
  exists(select 1 from projects p where p.id = zones.project_id and is_org_member(p.org_id))
);

create policy "trains project org" on trains for all using (
  exists(select 1 from projects p where p.id = trains.project_id and is_org_member(p.org_id))
) with check (
  exists(select 1 from projects p where p.id = trains.project_id and is_org_member(p.org_id))
);

create policy "assignments project org" on assignments for all using (
  exists(select 1 from projects p where p.id = assignments.project_id and is_org_member(p.org_id))
) with check (
  exists(select 1 from projects p where p.id = assignments.project_id and is_org_member(p.org_id))
);

create policy "baselines project org" on baselines for all using (
  exists(select 1 from projects p where p.id = baselines.project_id and is_org_member(p.org_id))
) with check (
  exists(select 1 from projects p where p.id = baselines.project_id and is_org_member(p.org_id))
);

create policy "public shares project org" on public_shares for all using (
  exists(select 1 from projects p where p.id = public_shares.project_id and is_org_member(p.org_id))
) with check (
  exists(select 1 from projects p where p.id = public_shares.project_id and is_org_member(p.org_id))
);

create or replace function get_shared_project(share_token text)
returns table(project jsonb, zones jsonb, trains jsonb, assignments jsonb)
language plpgsql
security definer
set search_path = public
as $$
declare share_row public_shares%rowtype;
begin
  select * into share_row from public_shares where token = share_token and revoked_at is null and (expires_at is null or expires_at > now());
  if not found then
    return;
  end if;

  return query
  select
    to_jsonb(p.*),
    (select coalesce(jsonb_agg(z order by z.order_index), '[]'::jsonb) from zones z where z.project_id = p.id),
    (select coalesce(jsonb_agg(t order by t.order_index), '[]'::jsonb) from trains t where t.project_id = p.id),
    (select coalesce(jsonb_agg(a), '[]'::jsonb) from assignments a where a.project_id = p.id)
  from projects p
  where p.id = share_row.project_id;
end;
$$;

grant execute on function get_shared_project(text) to anon, authenticated;
