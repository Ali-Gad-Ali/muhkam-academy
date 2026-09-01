import { NextRequest, NextResponse } from 'next/server';

import { isLocalDemo, requireAdmin, supabaseRest } from '@/lib/supabase-server';
import type { SiteSettings } from '@/lib/types';

export async function PUT(request: NextRequest) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const settings = (await request.json()) as SiteSettings;
  if (isLocalDemo()) return NextResponse.json({ ...settings, demo: true });
  const [saved] = await supabaseRest<SiteSettings[]>('site_settings?id=eq.main', { method: 'PATCH', body: JSON.stringify({ ...settings, id: undefined, updated_at: new Date().toISOString() }) });
  return NextResponse.json(saved);
}
