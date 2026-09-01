import { NextResponse } from 'next/server';

import { defaultQuestions, defaultSettings, normalizeSiteSettings } from '@/lib/defaults';
import { isSupabaseConfigured, supabaseRest } from '@/lib/supabase-server';
import type { FormQuestion, SiteSettings } from '@/lib/types';

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      settings: { ...defaultSettings, registration_open: false },
      questions: defaultQuestions,
      demo: false,
    });
  }
  try {
    const [settingsRows, questions] = await Promise.all([
      supabaseRest<SiteSettings[]>('site_settings?id=eq.main&limit=1'),
      supabaseRest<FormQuestion[]>('form_questions?active=eq.true&order=position.asc'),
    ]);
    return NextResponse.json({ settings: normalizeSiteSettings(settingsRows[0]), questions });
  } catch {
    return NextResponse.json({ error: 'تعذر تحميل نموذج التقديم حاليًا.' }, { status: 503 });
  }
}
