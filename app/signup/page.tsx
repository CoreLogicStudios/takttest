'use client';
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

  return <main className="mx-auto mt-20 max-w-md rounded bg-white p-6 shadow"><h1 className="mb-4 text-xl">Sign up</h1><form onSubmit={onSubmit} className="space-y-3"><input className="w-full border p-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} /><input type="password" className="w-full border p-2" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} /><button className="w-full bg-blue-600 p-2 text-white">Create account</button>{message && <p>{message}</p>}</form></main>;
}
