'use client';

import { DndContext, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core';
import { format, addDays } from 'date-fns';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { shiftSelected, shiftTrainFromHere } from '@/lib/board/shift';

type Props = {
  project: any;
  zones: any[];
  trains: any[];
  initialAssignments: any[];
  baseline?: Record<string, string>;
  readOnly?: boolean;
};

function TrainToken({ train }: { train: any }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: `train:${train.id}` });
  return <div ref={setNodeRef} {...listeners} {...attributes} className="cursor-grab rounded p-2 text-white" style={{ background: train.color }}>{train.abbreviation} · {train.name}</div>;
}

function Cell({ id, children }: { id: string; children?: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <div ref={setNodeRef} className={`h-16 min-w-24 border p-1 ${isOver ? 'bg-blue-50' : 'bg-white'}`}>{children}</div>;
}

export function BoardClient({ project, zones, trains, initialAssignments, baseline = {}, readOnly = false }: Props) {
  const supabase = createClient();
  const [assignments, setAssignments] = useState(initialAssignments);
  const [selected, setSelected] = useState<Array<{ zone_id: string; period_index: number }>>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const map = useMemo(() => new Map(assignments.map((a) => [`${a.zone_id}:${a.period_index}`, a])), [assignments]);
  const trainMap = useMemo(() => Object.fromEntries(trains.map((t) => [t.id, t])), [trains]);

  const saveAssignment = async (zone_id: string, period_index: number, train_id: string) => {
    const payload = { project_id: project.id, zone_id, period_index, train_id, status: 'planned' };
    await supabase.from('assignments').upsert(payload, { onConflict: 'project_id,zone_id,period_index' });
  };

  const onDragEnd = async (ev: DragEndEvent) => {
    if (!ev.over || readOnly) return;
    const [_, zoneId, periodRaw] = String(ev.over.id).split(':');
    const period = Number(periodRaw);
    const active = String(ev.active.id);
    const trainId = active.startsWith('train:') ? active.split(':')[1] : map.get(active)?.train_id;
    if (!trainId) return;
    await saveAssignment(zoneId, period, trainId);
    setAssignments((prev) => [...prev.filter((a) => !(a.zone_id === zoneId && a.period_index === period)), { zone_id: zoneId, period_index: period, train_id: trainId, status: 'planned' }]);
  };

  const periods = Array.from({ length: project.period_count }, (_, i) => i);

  return (
    <div className="grid grid-cols-[220px_1fr] gap-3">
      <aside className="space-y-2 rounded border bg-white p-3">
        <h3 className="font-semibold">Trains</h3>
        {trains.filter((t) => t.active).map((t) => <TrainToken key={t.id} train={t} />)}
        {!readOnly && <div className="space-y-2 pt-3 text-sm"><button className="w-full rounded border p-2" onClick={() => {
          const shifted = shiftSelected(assignments, selected, 1, project.period_count);
          if (shifted.collisions.length) return alert('Collision detected');
          setAssignments((prev) => prev.map((a) => {
            const m = shifted.moves.find((x) => x.from.zone_id === a.zone_id && x.from.period_index === a.period_index);
            return m ? { ...a, period_index: m.toPeriod } : a;
          }));
        }}>Shift selected +1</button><button className="w-full rounded border p-2" onClick={() => setAssignments((prev) => prev.filter((a) => !selected.some((s) => s.zone_id === a.zone_id && s.period_index === a.period_index)))}>Clear selected</button></div>}
      </aside>
      <DndContext onDragEnd={onDragEnd}>
        <div className="overflow-auto rounded border bg-slate-100">
          <div className="sticky top-0 z-10 grid bg-white" style={{ gridTemplateColumns: `220px repeat(${project.period_count}, minmax(96px, 1fr))` }}>
            <div className="sticky left-0 border bg-white p-2 font-semibold">Zone / Period</div>
            {periods.map((p) => <div key={p} className="border p-2 text-xs"><div>P{p + 1}</div><div>{format(addDays(new Date(project.start_date), p * project.takt_length_days), 'MMM d')}</div></div>)}
          </div>
          {zones.map((z, zi) => <div key={z.id} className="grid" style={{ gridTemplateColumns: `220px repeat(${project.period_count}, minmax(96px, 1fr))` }}><div className="sticky left-0 border bg-white p-2">{zi + 1}. {z.name}</div>{periods.map((p) => {
            const k = `${z.id}:${p}`;
            const a = map.get(k);
            const t = a ? trainMap[a.train_id] : null;
            const base = baseline[k];
            const changed = base && a && base !== a.train_id;
            return <div key={k} onClick={() => { if (!readOnly) setSelected([{ zone_id: z.id, period_index: p }]); setEditing(a ? { ...a, zone_id: z.id, period_index: p } : { zone_id: z.id, period_index: p, status: 'planned' }); }}><Cell id={`cell:${z.id}:${p}`}>{a && <div className={`h-full rounded p-1 text-white ${changed ? 'ring-2 ring-amber-500' : ''}`} style={{ background: t?.color }}><div className="text-lg font-bold">{t?.abbreviation}</div><div className="text-xs">{a.status}</div></div>}</Cell></div>;
          })}</div>)}
        </div>
      </DndContext>
      {editing && !readOnly && <div className="fixed inset-y-0 right-0 w-80 border-l bg-white p-4 shadow"><h3 className="font-semibold">Cell</h3><button className="absolute right-2 top-2" onClick={() => setEditing(null)}>✕</button><select className="mt-3 w-full border p-2" value={editing.train_id ?? ''} onChange={(e) => setEditing((s: any) => ({ ...s, train_id: e.target.value }))}><option value="">Empty</option>{trains.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select><select className="mt-2 w-full border p-2" value={editing.status ?? 'planned'} onChange={(e) => setEditing((s: any) => ({ ...s, status: e.target.value }))}><option>planned</option><option>in_progress</option><option>complete</option><option>blocked</option></select><textarea className="mt-2 w-full border p-2" placeholder="Note" value={editing.note ?? ''} onChange={(e) => setEditing((s: any) => ({ ...s, note: e.target.value }))} /><button className="mt-3 w-full bg-blue-600 p-2 text-white" onClick={async () => {
        if (!editing.train_id) {
          await supabase.from('assignments').delete().eq('project_id', project.id).eq('zone_id', editing.zone_id).eq('period_index', editing.period_index);
          setAssignments((prev) => prev.filter((a) => !(a.zone_id === editing.zone_id && a.period_index === editing.period_index)));
        } else {
          await supabase.from('assignments').upsert({ ...editing, project_id: project.id }, { onConflict: 'project_id,zone_id,period_index' });
          setAssignments((prev) => [...prev.filter((a) => !(a.zone_id === editing.zone_id && a.period_index === editing.period_index)), editing]);
        }
        setEditing(null);
      }}>Save</button><button className="mt-2 w-full border p-2" onClick={() => {
        const r = shiftTrainFromHere(assignments, editing.train_id, editing.period_index, 1, project.period_count);
        if (r.collisions.length) return alert('Collision detected, cancelled');
        setAssignments((prev) => prev.map((a) => {
          const m = r.moves.find((x) => x.from.zone_id === a.zone_id && x.from.period_index === a.period_index && x.from.train_id === a.train_id);
          return m ? { ...a, period_index: m.toPeriod } : a;
        }));
      }}>Shift this train from here +1</button></div>}
    </div>
  );
}
