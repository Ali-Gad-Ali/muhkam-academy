import { NextRequest, NextResponse } from 'next/server';

import { isLocalDemo, requireAdmin, supabaseRest } from '@/lib/supabase-server';
import type { ApplicationRecord, InvoiceRecord } from '@/lib/types';

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const input = (await request.json()) as { application_id: string; recipient_name: string; phone: string; amount: number; payment_method: string };
  if (!input.application_id || !input.recipient_name || Number(input.amount) < 0) return NextResponse.json({ error: 'بيانات الفاتورة غير مكتملة.' }, { status: 400 });

  if (!isLocalDemo()) {
    const apps = await supabaseRest<ApplicationRecord[]>(`applications?id=eq.${input.application_id}&select=id,payment_status`);
    if (!apps[0] || apps[0].payment_status !== 'paid') return NextResponse.json({ error: 'لا يمكن إنشاء فاتورة قبل اعتماد الدفع.' }, { status: 409 });
    const existing = await supabaseRest<InvoiceRecord[]>(`invoices?application_id=eq.${input.application_id}&status=eq.issued&limit=1`);
    if (existing[0]) return NextResponse.json({ error: 'يوجد بالفعل فاتورة فعالة لهذا الطلب.' }, { status: 409 });
  }

  const now = new Date();
  const invoice: InvoiceRecord = {
    id: crypto.randomUUID(),
    invoice_number: `MH-${now.getFullYear()}-${String(now.getTime()).slice(-7)}`,
    application_id: input.application_id,
    recipient_name: input.recipient_name.trim(),
    phone: input.phone.trim(),
    amount: Number(input.amount),
    currency: 'EGP',
    payment_method: input.payment_method,
    issued_at: now.toISOString(),
    status: 'issued',
    public_token: crypto.randomUUID(),
  };
  if (isLocalDemo()) return NextResponse.json({ ...invoice, demo: true });
  const [saved] = await supabaseRest<InvoiceRecord[]>('invoices', { method: 'POST', body: JSON.stringify(invoice) });
  return NextResponse.json(saved);
}
