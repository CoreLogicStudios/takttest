'use client';

import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const createClient = () => {
  if (!url || !anonKey) {
    throw new Error(
      'Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local and restart dev server.'
    );
  }

  return createBrowserClient(url, anonKey);
};
