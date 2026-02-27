import Link from 'next/link';
import { AppShell } from '@/components/ui/AppShell';
import { BoardClient } from '@/components/board/BoardClient';
import { createClient } from '@/lib/supabase/server';
import { canUseBaseline, canUseShareLinks } from '@/lib/billing/gating';
import { Paywall } from '@/components/ui/Paywall';
import { generateDiagonal } from '@/lib/board/generate';

export default async function ProjectBoard({ params }: { params: { projectId: string } }) {
  const supabase = await createClient();
  const { data: project } = await supabase.from('projects').select('*, organizations(subscription_status)').eq('id', params.projectId).single();
  const [zonesRes, trainsRes, assignsRes, baseRes] = await Promise.all([
    supabase.from('zones').select('*').eq('project_id', params.projectId).order('order_index'),
    supabase.from('trains').select('*').eq('project_id', params.projectId).order('order_index'),
    supabase.from('assignments').select('*').eq('project_id', params.projectId),
    supabase.from('baselines').select('*').eq('project_id', params.projectId).order('created_at', { ascending: false }).limit(1).maybeSingle()
  ]);
  const baselineMap = Object.fromEntries(((baseRes.data?.snapshot_json as any[]) ?? []).map((s) => [`${s.zone_id}:${s.period_index}`, s.train_id]));
  const org = project.organizations;

  async function generate() {
    'use server';
    const supabase = await createClient();
    const [zones, trains] = await Promise.all([
      supabase.from('zones').select('id').eq('project_id', params.projectId).order('order_index'),
      supabase.from('trains').select('id').eq('project_id', params.projectId).order('order_index')
    ]);
    const out = generateDiagonal(zones.data ?? [], trains.data ?? [], project.period_count).map((a) => ({ ...a, project_id: params.projectId, status: 'planned' }));
    if (out.length) await supabase.from('assignments').upsert(out, { onConflict: 'project_id,zone_id,period_index' });
  }

  async function setBaseline() {
    'use server';
    const supabase = await createClient();
    const { data: a } = await supabase.from('assignments').select('zone_id, period_index, train_id').eq('project_id', params.projectId);
    await supabase.from('baselines').insert({ project_id: params.projectId, snapshot_json: a ?? [] });
  }

  async function createShare() {
    'use server';
    const supabase = await createClient();
    await supabase.from('public_shares').insert({ project_id: params.projectId, token: crypto.randomUUID().replaceAll('-', '') });
  }

  return <AppShell><div className="mb-3 flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold">{project.name}</h1><Link href={`/app/projects/${params.projectId}/settings`} className="rounded border px-2 py-1">Settings</Link><Link href={`/app/projects/${params.projectId}/zones`} className="rounded border px-2 py-1">Zones</Link><Link href={`/app/projects/${params.projectId}/trains`} className="rounded border px-2 py-1">Trains</Link><Link href={`/app/projects/${params.projectId}/analytics`} className="rounded border px-2 py-1">Analytics</Link><Link href={`/app/projects/${params.projectId}/export`} className="rounded border px-2 py-1">Export</Link><form action={generate}><button className="rounded bg-slate-900 px-3 py-1 text-white">Generate Diagonal</button></form>{canUseBaseline(org) ? <form action={setBaseline}><button className="rounded border px-3 py-1">Set Baseline</button></form> : <span className="text-xs">Baseline locked on free</span>}{canUseShareLinks(org) ? <form action={createShare}><button className="rounded border px-3 py-1">Create share link</button></form> : <span className="text-xs">Share locked on free</span>}</div>
    {!canUseBaseline(org) && <div className="mb-2"><Paywall feature="Baseline snapshots" /></div>}
    <BoardClient project={project} zones={zonesRes.data ?? []} trains={trainsRes.data ?? []} initialAssignments={assignsRes.data ?? []} baseline={baselineMap} />
  </AppShell>;
}
