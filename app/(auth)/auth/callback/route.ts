import { createClient } from '@/lib/supabase/server';
import { NextDataPathnameNormalizer } from 'next/dist/server/normalizers/request/next-data';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
    } else {
      console.warn(error);
      return NextResponse.redirect(`${requestUrl.origin}/login`)
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/login`);
}
