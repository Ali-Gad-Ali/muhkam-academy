import { NextResponse } from 'next/server';

import { defaultQuestions, defaultSettings } from '@/lib/defaults';
import { isSupabaseConfigured, supabaseRest } from '@/lib/supabase-server';
import type { FormQuestion, SiteSettings } from '@/lib/types';

export async function GET() {
  if (!isSupabaseConfigured()) {
    const demo = process.env.NODE_ENV !== 'production';
    return NextResponse.json({ settings: demo ? defaultSettings : { ...defaultSettings, registration_open: false }, questions: defaultQuestions, demo });
  }
  try {
    const [settingsRows, questions] = await Promise.all([
      supabaseRest<SiteSettings[]>('site_settings?id=eq.main&limit=1'),
      supabaseRest<FormQuestion[]>('form_questions?active=eq.true&order=position.asc'),
    ]);
    return NextResponse.json({ settings: settingsRows[0] || defaultSettings, questions });
  } catch {
    return NextResponse.json({ error: 'تعذر تحميل نموذج التقديم حاليًا.' }, { status: 503 });
  }
}
