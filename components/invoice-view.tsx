'use client';

import Image from 'next/image';
import { useSyncExternalStore } from 'react';
import { CheckCircle2, MessageCircle, Printer, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

import { buildWhatsAppUrl } from '@/lib/whatsapp';
import type { InvoiceRecord, SiteSettings } from '@/lib/types';

const subscribeToOrigin = () => () => undefined;

export function InvoiceView({ token, initialData }: { token: string; initialData: { invoice: InvoiceRecord; settings: SiteSettings } | null }) {
  const origin = useSyncExternalStore(subscribeToOrigin, () => window.location.origin, () => process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');

  if (!initialData) {
    return (
      <main className="invoice-page center-state">
        <ShieldCheck aria-hidden="true" />
        <h1>الفاتورة غير موجودة</h1>
        <p>راجع الرابط أو تواصل مع إدارة Muhkam Academy.</p>
      </main>
    );
  }

  const { invoice, settings } = initialData;
  const verifyUrl = `${origin}/verify/${token}`;
  const invoiceSummaryText = [
    `فاتورة ${invoice.invoice_number}`,
    `العميل: ${invoice.recipient_name}`,
    `المبلغ: ${Number(invoice.amount).toLocaleString('ar-EG')} ${settings.currency}`,
    `طريقة الدفع: ${invoice.payment_method}`,
    `تاريخ الإصدار: ${new Date(invoice.issued_at).toLocaleDateString('ar-EG')}`,
    `رابط التحقق: ${verifyUrl}`,
  ].join('\n');
  const customerWhatsappUrl = buildWhatsAppUrl(invoice.phone, invoiceSummaryText);

  return (
    <main className="invoice-page">
      <div className="invoice-actions">
        <a className="secondary-button" href={customerWhatsappUrl} target="_blank" rel="noreferrer">
          <MessageCircle aria-hidden="true" />
          مشاركة واتساب
        </a>
        <button className="primary-button" onClick={() => window.print()}>
          <Printer aria-hidden="true" />
          طباعة / حفظ PDF
        </button>
      </div>
      <article className="invoice-paper">
        <header>
          <div className="brand">
            <Image src="/muhkam-logo.png" alt={settings.invoice_company_name} width={760} height={240} className="brand-logo-image" />
          </div>
          <div className="invoice-number" dir="ltr">
            <span>INVOICE</span>
            <strong>{invoice.invoice_number}</strong>
          </div>
        </header>

        <section className="invoice-meta">
          <div>
            <span>فاتورة إلى</span>
            <h1>{invoice.recipient_name}</h1>
            <p dir="ltr">{invoice.phone}</p>
          </div>
          <div>
            <span>تاريخ الإصدار</span>
            <strong>{new Date(invoice.issued_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
            <b><CheckCircle2 aria-hidden="true" /> مدفوعة</b>
          </div>
        </section>

        <section className="invoice-lines">
          <div className="line-head"><span>البيان</span><span>القيمة</span></div>
          <div className="line-item">
            <div>
              <strong>{settings.course_name}</strong>
              <small>رسوم الاشتراك والتدريب</small>
            </div>
            <strong>{Number(invoice.amount).toLocaleString('ar-EG')} ج.م</strong>
          </div>
          <div className="line-total"><strong>الإجمالي المدفوع</strong><strong>{Number(invoice.amount).toLocaleString('ar-EG')} ج.م</strong></div>
        </section>

        <footer>
          <div className="payment-details">
            <span>طريقة الدفع</span>
            <strong>{invoice.payment_method}</strong>
            <p>{settings.verification_message}</p>
            <small>{settings.invoice_address}{settings.invoice_tax_number ? ` - رقم ضريبي: ${settings.invoice_tax_number}` : ''}</small>
          </div>
          <div className="qr-card">
            <QRCodeSVG value={verifyUrl} size={168} bgColor="#ffffff" fgColor="#111827" level="M" />
          </div>
        </footer>
      </article>
    </main>
  );
}
