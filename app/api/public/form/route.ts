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
    const [settingsRows, questions, applications] = await Promise.all([
      supabaseRest<SiteSettings[]>('site_settings?id=eq.main&limit=1'),
      supabaseRest<FormQuestion[]>('form_questions?active=eq.true&order=position.asc'),
      supabaseRest<Array<{ id: string }>>('applications?select=id'),
    ]);
    const settings = normalizeSiteSettings(settingsRows[0]);
    const limitReached = settings.registration_limit !== null && Number(settings.registration_limit) > 0 && applications.length >= Number(settings.registration_limit);
    return NextResponse.json({
      settings: { ...settings, registration_open: !limitReached && settings.registration_open },
      questions,
    });
  } catch {
    return NextResponse.json({ error: 'تعذر تحميل نموذج التقديم حاليًا.' }, { status: 503 });
  }
}
