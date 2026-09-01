import { NextRequest, NextResponse } from 'next/server';

import { defaultQuestions, defaultSettings, demoApplications, demoInvoices, normalizeSiteSettings } from '@/lib/defaults';
import { createSignedProofUrl, isLocalDemo, requireAdmin, supabaseRest } from '@/lib/supabase-server';
import type { ApplicationRecord, FormQuestion, InvoiceRecord, SiteSettings } from '@/lib/types';

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  if (isLocalDemo()) return NextResponse.json({ settings: { ...defaultSettings, registration_open: false }, questions: defaultQuestions, applications: [], invoices: [], demo: false });
  try {
    const [settingsRows, questions, applications, invoices] = await Promise.all([
      supabaseRest<SiteSettings[]>('site_settings?id=eq.main&limit=1'),
      supabaseRest<FormQuestion[]>('form_questions?order=position.asc'),
      supabaseRest<ApplicationRecord[]>('applications?order=created_at.desc'),
      supabaseRest<InvoiceRecord[]>('invoices?order=issued_at.desc'),
    ]);
    const withUrls = await Promise.all(applications.map(async (app) => ({ ...app, payment_proof_url: app.payment_proof_path ? await createSignedProofUrl(app.payment_proof_path) : null })));
    return NextResponse.json({ settings: normalizeSiteSettings(settingsRows[0]), questions, applications: withUrls, invoices });
  } catch {
    return NextResponse.json({ error: 'تعذر تحميل لوحة التحكم.' }, { status: 503 });
  }
}
