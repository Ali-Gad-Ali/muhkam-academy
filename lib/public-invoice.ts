import { normalizeSiteSettings } from '@/lib/defaults';
import { isSupabaseConfigured, supabaseRest } from '@/lib/supabase-server';
import type { InvoiceRecord, SiteSettings } from '@/lib/types';

export async function getPublicInvoice(token: string) {
  if (!isSupabaseConfigured()) return null;
  const [invoices, settingsRows] = await Promise.all([
    supabaseRest<InvoiceRecord[]>(`invoices?public_token=eq.${encodeURIComponent(token)}&limit=1`),
    supabaseRest<SiteSettings[]>('site_settings?id=eq.main&limit=1'),
  ]);
  return invoices[0] ? { invoice: invoices[0], settings: normalizeSiteSettings(settingsRows[0]) } : null;
}
