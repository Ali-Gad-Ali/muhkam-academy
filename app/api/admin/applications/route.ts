import { NextRequest, NextResponse } from 'next/server';

import { isLocalDemo, requireAdmin, supabaseRest } from '@/lib/supabase-server';
import type { ApplicationRecord } from '@/lib/types';

export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const { id, status, payment_status } = (await request.json()) as Pick<ApplicationRecord, 'id' | 'status' | 'payment_status'>;
  if (!id) return NextResponse.json({ error: 'الطلب غير محدد' }, { status: 400 });
  if (isLocalDemo()) return NextResponse.json({ id, status, payment_status, demo: true });
  const [saved] = await supabaseRest<ApplicationRecord[]>(`applications?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ status, payment_status, updated_at: new Date().toISOString() }) });
  return NextResponse.json(saved);
}
