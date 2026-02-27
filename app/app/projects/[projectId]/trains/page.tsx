import { AppShell } from '@/components/ui/AppShell';
import { createClient } from '@/lib/supabase/server';

export default async function TrainsPage({ params }: { params: { projectId: string } }) {
  const supabase = await createClient();
  const { data: trains } = await supabase.from('trains').select('*').eq('project_id', params.projectId).order('order_index');

  async function add(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const { count } = await supabase.from('trains').select('*', { count: 'exact', head: true }).eq('project_id', params.projectId);
    await supabase.from('trains').insert({ project_id: params.projectId, name: String(formData.get('name')), abbreviation: String(formData.get('abbreviation')), color: String(formData.get('color')), order_index: count ?? 0, notes: String(formData.get('notes') || ''), active: true });
  }

  return <AppShell><h1 className="mb-4 text-2xl">Trains</h1><form action={add} className="mb-4 grid max-w-xl gap-2"><input name="name" className="border p-2" placeholder="Name"/><input name="abbreviation" className="border p-2" placeholder="Abbr"/><input name="color" className="border p-2" defaultValue="#1d4ed8"/><textarea name="notes" className="border p-2" placeholder="Notes"/><button className="bg-blue-600 p-2 text-white">Add train</button></form><ul className="space-y-2">{trains?.map((t) => <li key={t.id} className="flex items-center gap-2 rounded border bg-white p-2"><span className="inline-block h-4 w-4 rounded" style={{ background: t.color }} />{t.abbreviation} - {t.name}</li>)}</ul></AppShell>;
}
