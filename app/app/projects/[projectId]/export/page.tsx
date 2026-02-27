import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { format, addDays } from 'date-fns';
import { showWatermark } from '@/lib/billing/gating';

export default async function ExportPage({ params }: { params: { projectId: string } }) {
  const supabase = await createClient();
  const [projectRes, zonesRes, trainsRes, assignmentsRes] = await Promise.all([
    supabase.from('projects').select('*, organizations(subscription_status)').eq('id', params.projectId).maybeSingle(),
    supabase.from('zones').select('*').eq('project_id', params.projectId).order('order_index'),
    supabase.from('trains').select('*').eq('project_id', params.projectId).order('order_index'),
    supabase.from('assignments').select('*').eq('project_id', params.projectId)
  ]);
  const project = projectRes.data;
  if (!project) notFound();

  const zones = zonesRes.data ?? [];
  const trains = Object.fromEntries((trainsRes.data ?? []).map((t) => [t.id, t]));
  const assignmentMap = new Map((assignmentsRes.data ?? []).map((a) => [`${a.zone_id}:${a.period_index}`, a]));
  const pages = Array.from({ length: Math.ceil(zones.length / 20) }, (_, i) => zones.slice(i * 20, (i + 1) * 20));

  return (
    <main className="p-4">
      <button className="no-print mb-3 rounded bg-blue-600 px-3 py-2 text-white" onClick={() => window.print()}>
        Print / Save as PDF
      </button>
      {pages.map((chunk, pageIndex) => (
        <section key={pageIndex} className="mb-4 rounded border bg-white p-3">
          <header className="mb-2">
            <h1 className="text-xl font-bold">{project.name}</h1>
            <p className="text-xs">
              Start {project.start_date} · Takt {project.takt_length_days} days · Generated {format(new Date(), 'PPpp')}
            </p>
          </header>
          <div className="overflow-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="border p-1">Zone</th>
                  {Array.from({ length: project.period_count }, (_, p) => (
                    <th key={p} className="border p-1">
                      P{p + 1}
                      <br />
                      {format(addDays(new Date(project.start_date), p * project.takt_length_days), 'MM/dd')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chunk.map((z) => (
                  <tr key={z.id}>
                    <td className="border p-1">{z.name}</td>
                    {Array.from({ length: project.period_count }, (_, p) => {
                      const a = assignmentMap.get(`${z.id}:${p}`);
                      const t = a ? trains[a.train_id] : null;
                      return (
                        <td
                          key={p}
                          className="border p-1 text-center"
                          style={{ background: t?.color ?? 'transparent', color: t ? 'white' : 'inherit' }}
                        >
                          {t?.abbreviation ?? ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageIndex === 0 && (
            <div className="mt-3 text-xs">
              <h2 className="font-semibold">Legend</h2>
              {Object.values(trains).map((t: any) => (
                <div key={t.id} className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3" style={{ background: t.color }} />
                  {t.abbreviation} - {t.name} {t.notes && `(${t.notes})`}
                </div>
              ))}
            </div>
          )}
          {showWatermark((project as any).organizations ?? null) && (
            <div className="pointer-events-none fixed inset-0 flex items-center justify-center text-6xl font-bold text-slate-300/40">
              FREE PLAN
            </div>
          )}
        </section>
      ))}
    </main>
  );
}
