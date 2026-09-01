import Image from 'next/image';
import { BadgeCheck, ExternalLink, ShieldCheck, XCircle } from 'lucide-react';

import type { InvoiceRecord, SiteSettings } from '@/lib/types';

export function VerificationView({ data }: { data: { invoice: InvoiceRecord; settings: SiteSettings } | null }) {
  if (!data) {
    return (
      <main className="verify-page center-state">
        <XCircle aria-hidden="true" />
        <h1>تعذر التحقق</h1>
        <p>الفاتورة غير موجودة أو أن رابط التحقق غير صحيح.</p>
      </main>
    );
  }

  const { invoice, settings } = data;
  const issued = invoice.status === 'issued';

  return (
    <main className="verify-page">
      <section className="verify-card">
        <div className="brand">
          <Image src="/muhkam-logo.png" alt={settings.brand_name} width={760} height={240} className="brand-logo-image" />
        </div>

        <span className={issued ? 'verify-mark success' : 'verify-mark failed'}>
          {issued ? <BadgeCheck aria-hidden="true" /> : <XCircle aria-hidden="true" />}
        </span>
        <h1>{issued ? 'فاتورة صحيحة وفعالة' : 'فاتورة ملغاة'}</h1>
        <p>{settings.verification_message}</p>

        <dl className="verify-details">
          <div><dt>رقم الفاتورة</dt><dd dir="ltr">{invoice.invoice_number}</dd></div>
          <div><dt>تاريخ الإصدار</dt><dd>{new Date(invoice.issued_at).toLocaleDateString('ar-EG')}</dd></div>
          <div><dt>اسم المستلم</dt><dd>{invoice.recipient_name}</dd></div>
          <div><dt>القيمة</dt><dd>{Number(invoice.amount).toLocaleString('ar-EG')} ج.م</dd></div>
        </dl>

        {settings.verification_link ? (
          <a className="primary-button submit-wide" href={settings.verification_link} target="_blank" rel="noreferrer">
            <ExternalLink aria-hidden="true" />
            معرفة المزيد
          </a>
        ) : null}
        <small className="verified-note"><ShieldCheck aria-hidden="true" /> تم التحقق مباشرة من سجل Muhkam Academy</small>
      </section>
    </main>
  );
}
