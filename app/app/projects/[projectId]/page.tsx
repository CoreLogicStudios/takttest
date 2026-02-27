import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/ui/AppShell';
import { BoardClient } from '@/components/board/BoardClient';
import { createClient } from '@/lib/supabase/server';
import { canUseBaseline, canUseShareLinks } from '@/lib/billing/gating';
import { Paywall } from '@/components/ui/Paywall';
import { generateDiagonal } from '@/lib/board/generate';

export default async function ProjectBoard({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from('projects')
    .select('*, organizations(subscription_status)')
    .eq('id', projectId)
    .maybeSingle();

  if (!project) notFound();

  const [zonesRes, trainsRes, assignsRes, baseRes] = await Promise.all([
    supabase.from('zones').select('*').eq('project_id', projectId).order('order_index'),
    supabase.from('trains').select('*').eq('project_id', projectId).order('order_index'),
    supabase.from('assignments').select('*').eq('project_id', projectId),
    supabase
      .from('baselines')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  const baselineMap = Object.fromEntries(
    (((baseRes.data?.snapshot_json as any[]) ?? []) as any[]).map((s) => [`${s.zone_id}:${s.period_index}`, s.train_id])
  );

  const orgPlan = (project as any).organizations ?? null;

  async function generate() {
    'use server';
    const supabase = await createClient();
    const [zones, trains] = await Promise.all([
      supabase.from('zones').select('id').eq('project_id', projectId).order('order_index'),
      supabase.from('trains').select('id').eq('project_id', projectId).order('order_index')
    ]);
    const out = generateDiagonal(zones.data ?? [], trains.data ?? [], project.period_count).map((a) => ({
      ...a,
      project_id: projectId,
      status: 'planned'
    }));
    if (out.length) await supabase.from('assignments').upsert(out, { onConflict: 'project_id,zone_id,period_index' });
  }

  async function setBaseline() {
    'use server';
    const supabase = await createClient();
    const { data: a } = await supabase
      .from('assignments')
      .select('zone_id, period_index, train_id')
      .eq('project_id', projectId);
    await supabase.from('baselines').insert({ project_id: projectId, snapshot_json: a ?? [] });
  }

  async function createShare() {
    'use server';
    const supabase = await createClient();
    await supabase
      .from('public_shares')
      .insert({ project_id: projectId, token: crypto.randomUUID().replaceAll('-', '') });
  }

  return (
    <AppShell>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <Link href={`/app/projects/${projectId}/settings`} className="rounded border px-2 py-1">
          Settings
        </Link>
        <Link href={`/app/projects/${projectId}/zones`} className="rounded border px-2 py-1">
          Zones
        </Link>
        <Link href={`/app/projects/${projectId}/trains`} className="rounded border px-2 py-1">
          Trains
        </Link>
        <Link href={`/app/projects/${projectId}/analytics`} className="rounded border px-2 py-1">
          Analytics
        </Link>
        <Link href={`/app/projects/${projectId}/export`} className="rounded border px-2 py-1">
          Export
        </Link>
        <form action={generate}>
          <button className="rounded bg-slate-900 px-3 py-1 text-white">Generate Diagonal</button>
        </form>
        {canUseBaseline(orgPlan) ? (
          <form action={setBaseline}>
            <button className="rounded border px-3 py-1">Set Baseline</button>
          </form>
        ) : (
          <span className="text-xs">Baseline locked on free</span>
        )}
        {canUseShareLinks(orgPlan) ? (
          <form action={createShare}>
            <button className="rounded border px-3 py-1">Create share link</button>
          </form>
        ) : (
          <span className="text-xs">Share locked on free</span>
        )}
      </div>
      {!canUseBaseline(orgPlan) && (
        <div className="mb-2">
          <Paywall feature="Baseline snapshots" />
        </div>
      )}
      <BoardClient
        project={project}
        zones={zonesRes.data ?? []}
        trains={trainsRes.data ?? []}
        initialAssignments={assignsRes.data ?? []}
        baseline={baselineMap}
      />
    </AppShell>
  );
}
