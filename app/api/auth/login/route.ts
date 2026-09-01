import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    if (process.env.NODE_ENV !== 'production') return NextResponse.json({ ok: true, demo: true });
    return NextResponse.json({ error: 'لم يتم إعداد خدمة تسجيل الدخول بعد.' }, { status: 503 });
  }

  const { email, password } = (await request.json()) as { email?: string; password?: string };
  if (!email || !password) return NextResponse.json({ error: 'أدخل البريد وكلمة المرور.' }, { status: 400 });
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = (await response.json()) as { access_token?: string; expires_in?: number; user?: { email?: string }; error_description?: string; msg?: string };
  const allowedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!response.ok || !data.access_token || (allowedEmail && data.user?.email?.toLowerCase() !== allowedEmail)) {
    return NextResponse.json({ error: 'بيانات الدخول غير صحيحة أو الحساب غير مصرح له.' }, { status: 401 });
  }

  const result = NextResponse.json({ ok: true });
  result.cookies.set('mh_admin_session', data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: Math.min(data.expires_in || 3600, 3600),
  });
  return result;
}
