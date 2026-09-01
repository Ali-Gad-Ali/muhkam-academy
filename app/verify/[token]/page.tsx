import type { Metadata } from 'next';

import { VerificationView } from '@/components/verification-view';
import { getPublicInvoice } from '@/lib/public-invoice';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params; const data = await getPublicInvoice(token);
  return data ? { title: `تحقق من ${data.invoice.invoice_number} | ${data.settings.brand_name}`, description: 'صفحة التحقق الرسمية من الفاتورة', openGraph: { images: [] }, twitter: { images: [] } } : { title: 'تعذر التحقق من الفاتورة', openGraph: { images: [] }, twitter: { images: [] } };
}
export default async function VerifyPage({ params }: { params: Promise<{ token: string }> }) { const { token } = await params; return <VerificationView data={await getPublicInvoice(token)} />; }
