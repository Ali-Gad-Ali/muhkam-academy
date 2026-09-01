import { NextRequest, NextResponse } from 'next/server';

import { legacySiteSettingsPayload, normalizeSiteSettings, siteSettingsPayload } from '@/lib/defaults';
import { isLocalDemo, requireAdmin, supabaseRest } from '@/lib/supabase-server';
import type { SiteSettings } from '@/lib/types';

export async function PUT(request: NextRequest) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const settings = normalizeSiteSettings((await request.json()) as Partial<SiteSettings>);
  if (isLocalDemo()) return NextResponse.json({ ...settings, demo: true });
  try {
    const [saved] = await supabaseRest<SiteSettings[]>('site_settings?id=eq.main', {
      method: 'PATCH',
      body: JSON.stringify(siteSettingsPayload(settings)),
    });
    return NextResponse.json(normalizeSiteSettings(saved));
  } catch (error) {
    const [saved] = await supabaseRest<SiteSettings[]>('site_settings?id=eq.main', {
      method: 'PATCH',
      body: JSON.stringify(legacySiteSettingsPayload(settings)),
    });
    return NextResponse.json({
      ...normalizeSiteSettings(saved),
      warning: 'تم حفظ الإعدادات الأساسية. حدّث جدول site_settings لحفظ حقول الهداية والخصم.',
    });
  }
}
