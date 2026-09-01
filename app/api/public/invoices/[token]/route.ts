import { NextRequest, NextResponse } from 'next/server';

import { defaultSettings } from '@/lib/defaults';
import { isSupabaseConfigured, supabaseRest } from '@/lib/supabase-server';
import type { InvoiceRecord, SiteSettings } from '@/lib/types';

export async function GET(_request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'الفاتورة غير موجودة في وضع المعاينة.' }, { status: 404 });
  const [invoices, settingsRows] = await Promise.all([
    supabaseRest<InvoiceRecord[]>(`invoices?public_token=eq.${encodeURIComponent(token)}&limit=1`),
    supabaseRest<SiteSettings[]>('site_settings?id=eq.main&limit=1'),
  ]);
  if (!invoices[0]) return NextResponse.json({ error: 'الفاتورة غير موجودة.' }, { status: 404 });
  return NextResponse.json({ invoice: invoices[0], settings: settingsRows[0] || defaultSettings });
}
