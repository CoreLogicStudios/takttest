'use client';
import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return setError(error.message);
      router.push('/app');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reach Supabase. Check your NEXT_PUBLIC_SUPABASE_URL / ANON key and network.';
      setError(message);
    }
  };

  const onGoogle = async () => {
    try {
      const supabase = createClient();
      const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/app`;
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
      if (error) setError(error.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reach Supabase. Check your NEXT_PUBLIC_SUPABASE_URL / ANON key and network.';
      setError(message);
    }
  };

  return (
    <main className="mx-auto mt-20 max-w-md rounded bg-white p-6 shadow">
      <h1 className="mb-4 text-xl">Login</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border p-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" className="w-full border p-2" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full bg-blue-600 p-2 text-white">Sign in</button>
      </form>
      <button type="button" onClick={onGoogle} className="mt-3 w-full border border-slate-300 p-2">
        Continue with Google
      </button>
      {error && <p className="mt-2 text-red-600">{error}</p>}
      <p className="mt-3 text-sm">Need an account? <Link href="/signup" className="text-blue-600 underline">Sign up</Link></p>
    </main>
  );
}
