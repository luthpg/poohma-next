'use client';

import { env } from '@/env';
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * 認証済みかどうかを検証
 * @returns 認証済みかどうか
 */
export async function isSignedIn() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  return error == null && data?.user != null;
}
