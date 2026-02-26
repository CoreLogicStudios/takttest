import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/ui/AppShell';
import { createClient } from '@/lib/supabase/server';
import { ensureDefaultOrg, enforceProjectLimit } from '@/lib/supabase/queries';

export default async function AppPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const org = await ensureDefaultOrg();
  const { data: projects } = await supabase.from('projects').select('*').eq('org_id', org.id).eq('is_archived', false).order('created_at', { ascending: false });

  async function createProject(formData: FormData) {
    'use server';
    const name = String(formData.get('name') || 'New Project');
    const supabase = createClient();
    const org = await ensureDefaultOrg();
    await enforceProjectLimit(org.id);
    const { data } = await supabase.from('projects').insert({ org_id: org.id, name, start_date: new Date().toISOString().slice(0, 10), takt_length_days: 5, period_count: 20, working_days_mode: false }).select('id').single();
    redirect(`/app/projects/${data!.id}`);
  }

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold">Projects</h1>
      <form action={createProject} className="mb-4 flex gap-2"><input name="name" className="border p-2" placeholder="Project name" /><button className="bg-blue-600 px-3 py-2 text-white">Create</button></form>
      <ul className="space-y-2">{projects?.map((p) => <li key={p.id} className="rounded border bg-white p-3"><Link href={`/app/projects/${p.id}`} className="font-medium">{p.name}</Link></li>)}</ul>
    </AppShell>
  );
}
