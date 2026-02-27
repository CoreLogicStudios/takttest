import { BoardClient } from '@/components/board/BoardClient';
import { createClient } from '@/lib/supabase/server';

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_shared_project', { share_token: token });
  if (error || !data || !data[0]) return <main className="p-6">Share link invalid, expired, or revoked.</main>;
  const payload = data[0] as any;
  const project = payload.project as any;
  return (
    <main className="p-4">
      <h1 className="mb-3 text-2xl">{project.name}</h1>
      <BoardClient readOnly project={project} zones={payload.zones} trains={payload.trains} initialAssignments={payload.assignments} />
    </main>
  );
}
