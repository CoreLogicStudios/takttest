'use client';
import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return setMessage(error.message);
    setMessage('Signed up. If email confirmations are enabled, verify your email.');
    router.push('/app');
  };

  const onGoogle = async () => {
    const supabase = createClient();
    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/app`;
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
    if (error) setMessage(error.message);
  };

  return (
    <main className="mx-auto mt-20 max-w-md rounded bg-white p-6 shadow">
      <h1 className="mb-4 text-xl">Sign up</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border p-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" className="w-full border p-2" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full bg-blue-600 p-2 text-white">Create account</button>
      </form>
      <button type="button" onClick={onGoogle} className="mt-3 w-full border border-slate-300 p-2">
        Continue with Google
      </button>
      {message && <p className="mt-2">{message}</p>}
      <p className="mt-3 text-sm">Already have an account? <Link href="/login" className="text-blue-600 underline">Log in</Link></p>
    </main>
  );
}
