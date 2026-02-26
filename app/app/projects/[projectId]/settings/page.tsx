import { AppShell } from '@/components/ui/AppShell';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function SettingsPage({ params }: { params: { projectId: string } }) {
  const supabase = createClient();
  const { data: project } = await supabase.from('projects').select('*').eq('id', params.projectId).single();

  async function save(formData: FormData) {
    'use server';
    const supabase = createClient();
    await supabase.from('projects').update({
      name: String(formData.get('name')),
      start_date: String(formData.get('start_date')),
      takt_length_days: Number(formData.get('takt_length_days')),
      period_count: Number(formData.get('period_count')),
      working_days_mode: formData.get('working_days_mode') === 'on'
    }).eq('id', params.projectId);
    redirect(`/app/projects/${params.projectId}`);
  }

  return <AppShell><h1 className="mb-4 text-2xl">Project settings</h1><form action={save} className="grid max-w-xl gap-2 rounded bg-white p-4"><input name="name" defaultValue={project.name} className="border p-2"/><input type="date" name="start_date" defaultValue={project.start_date} className="border p-2"/><input name="takt_length_days" type="number" defaultValue={project.takt_length_days} className="border p-2"/><input name="period_count" type="number" defaultValue={project.period_count} className="border p-2"/><label><input type="checkbox" name="working_days_mode" defaultChecked={project.working_days_mode}/> Working days mode</label><button className="bg-blue-600 p-2 text-white">Save</button></form></AppShell>;
}
