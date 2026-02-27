import { createClient } from './server';
import { projectLimit, zoneLimit } from '@/lib/billing/gating';

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return { supabase, user };
}

export async function ensureDefaultOrg() {
  const { supabase, user } = await requireUser();
  const { data: member } = await supabase.from('organization_members').select('org_id, organizations(*)').eq('user_id', user.id).limit(1).maybeSingle();
  if (member?.org_id) return member.organizations as any;

  const { data: org, error } = await supabase.from('organizations').insert({ name: 'My Org', owner_id: user.id }).select('*').single();
  if (error) throw error;
  await supabase.from('organization_members').insert({ org_id: org.id, user_id: user.id, role: 'owner' });
  return org;
}

export async function getOrg() {
  const org = await ensureDefaultOrg();
  return org as any;
}

export async function enforceProjectLimit(orgId: string) {
  const { supabase } = await requireUser();
  const { data: org } = await supabase.from('organizations').select('subscription_status').eq('id', orgId).single();
  const lim = projectLimit(org as any);
  if (!Number.isFinite(lim)) return;
  const { count } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('is_archived', false);
  if ((count ?? 0) >= lim) throw new Error('Project limit reached for free plan');
}

export async function enforceZoneLimit(projectId: string) {
  const { supabase } = await requireUser();
  const { data: project } = await supabase.from('projects').select('org_id, organizations(subscription_status)').eq('id', projectId).single();
  const lim = zoneLimit((project as any).organizations);
  if (!Number.isFinite(lim)) return;
  const { count } = await supabase.from('zones').select('*', { count: 'exact', head: true }).eq('project_id', projectId);
  if ((count ?? 0) >= lim) throw new Error('Zone limit reached for free plan');
}
