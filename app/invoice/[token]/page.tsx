import type { Metadata } from 'next';

import { InvoiceView } from '@/components/invoice-view';
import { getPublicInvoice } from '@/lib/public-invoice';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params; const data = await getPublicInvoice(token);
  return data ? { title: `فاتورة ${data.invoice.invoice_number} | ${data.settings.brand_name}`, description: `فاتورة إلكترونية صادرة من ${data.settings.brand_name}`, openGraph: { title: `فاتورة ${data.invoice.invoice_number}`, description: `فاتورة إلكترونية صادرة من ${data.settings.brand_name}`, images: [] }, twitter: { title: `فاتورة ${data.invoice.invoice_number}`, description: `فاتورة إلكترونية صادرة من ${data.settings.brand_name}`, images: [] } } : { title: 'الفاتورة غير موجودة', openGraph: { images: [] }, twitter: { images: [] } };
}

export default async function InvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; return <InvoiceView token={token} initialData={await getPublicInvoice(token)} />;
}
