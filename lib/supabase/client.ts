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

/**
 * 現在のユーザーセッションを取得
 * @param supabaseClient SupabaseClientインスタンス (任意)
 * @returns ユーザーセッションまたはnull
 */
export async function getAuthUserSession() {
  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('セッション取得エラー:', error);
    return null;
  }
  return session;
}

/**
 * 現在認証されているユーザーのIDを取得
 * @param supabaseClient SupabaseClientインスタンス
 * @returns ユーザーIDまたはnull
 */
export async function getAuthUserId() {
  const session = await getAuthUserSession();
  return session?.user?.id || null;
}
