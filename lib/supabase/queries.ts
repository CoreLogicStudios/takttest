import { createClient } from './server';
import { projectLimit, zoneLimit } from '@/lib/billing/gating';

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return { supabase, user };
}

async function createOrgForUser(supabase: any, userId: string) {
  const { data: org, error: createOrgError } = await supabase
    .from('organizations')
    .insert({ name: 'My Org', owner_id: userId })
    .select('*')
    .single();
  if (createOrgError || !org) throw new Error(createOrgError?.message ?? 'Unable to create organization');

  const { error: memberError } = await supabase
    .from('organization_members')
    .upsert({ org_id: org.id, user_id: userId, role: 'owner' }, { onConflict: 'org_id,user_id' });

  if (memberError) throw new Error(memberError.message);
  return org as { id: string; subscription_status?: 'free' | 'pro' | 'trial' };
}

export async function ensureDefaultOrg() {
  const { supabase, user } = await requireUser();

  const { data: membership } = await supabase
    .from('organization_members')
    .select('org_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membership?.org_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id,name,subscription_status,owner_id,created_at')
      .eq('id', membership.org_id)
      .maybeSingle();

    if (org) return org;
  }

  const { data: ownedOrg } = await supabase
    .from('organizations')
    .select('id,name,subscription_status,owner_id,created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (ownedOrg) {
    await supabase
      .from('organization_members')
      .upsert({ org_id: ownedOrg.id, user_id: user.id, role: 'owner' }, { onConflict: 'org_id,user_id' });
    return ownedOrg;
  }

  return createOrgForUser(supabase, user.id);
}

export async function getOrg() {
  const org = await ensureDefaultOrg();
  return org as any;
}

export async function enforceProjectLimit(orgId: string) {
  const { supabase } = await requireUser();
  const { data: org } = await supabase.from('organizations').select('subscription_status').eq('id', orgId).maybeSingle();
  const lim = projectLimit(org as any);
  if (!Number.isFinite(lim)) return;
  const { count } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('is_archived', false);
  if ((count ?? 0) >= lim) throw new Error('Project limit reached for free plan');
}

export async function enforceZoneLimit(projectId: string) {
  const { supabase } = await requireUser();
  const { data: project } = await supabase
    .from('projects')
    .select('org_id, organizations(subscription_status)')
    .eq('id', projectId)
    .maybeSingle();
  const lim = zoneLimit((project as any)?.organizations);
  if (!Number.isFinite(lim)) return;
  const { count } = await supabase.from('zones').select('*', { count: 'exact', head: true }).eq('project_id', projectId);
  if ((count ?? 0) >= lim) throw new Error('Zone limit reached for free plan');
}
