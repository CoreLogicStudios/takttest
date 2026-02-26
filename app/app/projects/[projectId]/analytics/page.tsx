import { AppShell } from '@/components/ui/AppShell';
import { createClient } from '@/lib/supabase/server';
import { canUseAnalytics } from '@/lib/billing/gating';
import { Paywall } from '@/components/ui/Paywall';
import { computeAnalytics } from '@/lib/board/analytics';

export default async function AnalyticsPage({ params }: { params: { projectId: string } }) {
  const supabase = createClient();
  const { data: project } = await supabase.from('projects').select('*, organizations(subscription_status)').eq('id', params.projectId).single();
  if (!canUseAnalytics(project.organizations)) return <AppShell><Paywall feature="Analytics" /></AppShell>;
  const [zones, assignments, trains] = await Promise.all([
    supabase.from('zones').select('id').eq('project_id', params.projectId),
    supabase.from('assignments').select('train_id,period_index').eq('project_id', params.projectId),
    supabase.from('trains').select('id,name').eq('project_id', params.projectId)
  ]);
  const metrics = computeAnalytics({ zonesCount: zones.data?.length ?? 0, periodCount: project.period_count, taktLengthDays: project.takt_length_days, assignments: assignments.data ?? [] });
  return <AppShell><h1 className="mb-3 text-2xl">Analytics</h1><div className="grid gap-2"><div className="rounded bg-white p-3">Total duration: {metrics.totalDurationDays} days</div><div className="rounded bg-white p-3">Flow efficiency: {(metrics.flowEfficiency * 100).toFixed(1)}%</div><div className="rounded bg-white p-3"><h3 className="font-semibold">Train utilization</h3>{metrics.trainUtilization.map((u) => <div key={u.trainId}>{trains.data?.find((t) => t.id === u.trainId)?.name ?? u.trainId}: {(u.utilization * 100).toFixed(1)}%</div>)}</div><div className="rounded bg-white p-3"><h3 className="font-semibold">Idle zones per period</h3>{metrics.idleZones.map((i) => <div key={i.period}>P{i.period + 1}: {i.idle}</div>)}</div></div></AppShell>;
}
