'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import { CheckCircle2, Code2, MessageCircle, Printer, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

import type { InvoiceRecord, SiteSettings } from '@/lib/types';

const subscribeToOrigin = () => () => undefined;

export function InvoiceView({ token, initialData }: { token: string; initialData: { invoice: InvoiceRecord; settings: SiteSettings } | null }) {
  const origin = useSyncExternalStore(subscribeToOrigin, () => window.location.origin, () => process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  const invoiceRef = useRef<HTMLElement>(null);
  const [shareStatus, setShareStatus] = useState('');

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
  const customerWhatsappUrl = `https://wa.me/${invoice.phone.replace(/\D/g, '')}?text=${encodeURIComponent(invoiceSummaryText)}`;

  async function shareInvoiceImage() {
    if (!invoiceRef.current) return;
    setShareStatus('جار تجهيز صورة الفاتورة...');
    try {
      const { toBlob } = await import('html-to-image');
      const blob = await toBlob(invoiceRef.current, {
        backgroundColor: '#ffffff',
        cacheBust: true,
        pixelRatio: 2,
      });
      if (!blob) throw new Error('Image generation failed');

      const file = new File([blob], `${invoice.invoice_number}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `فاتورة ${invoice.invoice_number}`,
        });
        setShareStatus('تم تجهيز صورة الفاتورة للمشاركة.');
        return;
      }

      const imageUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${invoice.invoice_number}.png`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
      window.open(customerWhatsappUrl, '_blank', 'noopener,noreferrer');
      setShareStatus('تم تحميل صورة الفاتورة. تم فتح شات العميل برسالة نصية مع تفاصيل الفاتورة.');
    } catch {
      window.open(customerWhatsappUrl, '_blank', 'noopener,noreferrer');
      setShareStatus('تعذر تجهيز الصورة تلقائيا. تم فتح شات العميل برسالة نصية مع تفاصيل الفاتورة.');
    }
  }

  return (
    <main className="invoice-page">
      <div className="invoice-actions">
        <button className="secondary-button" onClick={shareInvoiceImage}>
          <MessageCircle aria-hidden="true" />
          مشاركة واتساب
        </button>
        <button className="primary-button" onClick={() => window.print()}>
          <Printer aria-hidden="true" />
          طباعة / حفظ PDF
        </button>
      </div>
      {shareStatus ? <p className="share-status">{shareStatus}</p> : null}

      <article className="invoice-paper" ref={invoiceRef}>
        <header>
          <div className="brand">
            <span className="brand-icon"><Code2 aria-hidden="true" /></span>
            <span>
              <strong>{settings.invoice_company_name}</strong>
              <small>فاتورة دفع إلكترونية</small>
            </span>
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
