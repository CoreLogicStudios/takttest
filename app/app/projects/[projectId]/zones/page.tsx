import { AppShell } from '@/components/ui/AppShell';
import { createClient } from '@/lib/supabase/server';
import { enforceZoneLimit } from '@/lib/supabase/queries';

export default async function ZonesPage({ params }: { params: { projectId: string } }) {
  const supabase = createClient();
  const { data: zones } = await supabase.from('zones').select('*').eq('project_id', params.projectId).order('order_index');

  async function add(formData: FormData) {
    'use server';
    const supabase = createClient();
    await enforceZoneLimit(params.projectId);
    const { count } = await supabase.from('zones').select('*', { count: 'exact', head: true }).eq('project_id', params.projectId);
    await supabase.from('zones').insert({ project_id: params.projectId, name: String(formData.get('name')), group_name: String(formData.get('group_name') || ''), order_index: count ?? 0 });
  }

  return <AppShell><h1 className="mb-4 text-2xl">Zones</h1><form action={add} className="mb-4 flex gap-2"><input name="name" className="border p-2" placeholder="Zone"/><input name="group_name" className="border p-2" placeholder="Group"/><button className="bg-blue-600 px-3 text-white">Add</button></form><details className="mb-4"><summary>CSV import</summary><p className="text-sm">Upload CSV with columns zone_name,group_name. (Client parser intentionally minimal in MVP)</p></details><ul className="space-y-2">{zones?.map((z) => <li key={z.id} className="rounded border bg-white p-2">{z.order_index + 1}. {z.name} {z.group_name && `(${z.group_name})`}</li>)}</ul></AppShell>;
}
