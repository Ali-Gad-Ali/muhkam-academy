'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BadgeCheck, BookOpenCheck, Code2, MessageCircle, Sparkles } from 'lucide-react';

import { defaultSettings } from '@/lib/defaults';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import type { SiteSettings } from '@/lib/types';

export default function HomePage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch('/api/public/form')
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as { settings?: SiteSettings };
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const whatsappUrl = buildWhatsAppUrl(settings.whatsapp_number || '');
  const effectivePrice = Math.max(0, Number(settings.course_price) - Number(settings.course_discount_amount || 0));
  const visibleGuideItems = (settings.guide_items || []).filter((item) => item.active !== false);

  return (
    <main className="public-page">
      <header className="topbar">
        <Link className="brand" href="/" aria-label={settings.brand_name}>
          <span className="brand-icon"><Code2 aria-hidden="true" /></span>
          <span>
            <strong>{settings.brand_name}</strong>
            <small>Learn. Build. Grow.</small>
          </span>
        </Link>
        <a className="ghost-link" href={whatsappUrl} target="_blank" rel="noreferrer" aria-disabled={whatsappUrl === '#'} onClick={(event) => { if (whatsappUrl === '#') event.preventDefault(); }}>
          <MessageCircle aria-hidden="true" />
          تواصل معنا
        </a>
      </header>

      <section className="hero-grid">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles aria-hidden="true" /> برنامج تدريبي عملي</span>
          <h1>{settings.course_name}</h1>
          <p>{settings.course_description}</p>
          <div className="hero-actions">
            <Link className="primary-button" href="/apply">
              سجل الآن
              <ArrowLeft aria-hidden="true" />
            </Link>
            <a className="secondary-button" href={whatsappUrl} target="_blank" rel="noreferrer" aria-disabled={whatsappUrl === '#'} onClick={(event) => { if (whatsappUrl === '#') event.preventDefault(); }}>
              <MessageCircle aria-hidden="true" />
              اسأل على واتساب
            </a>
          </div>
        </div>

        <aside className="course-panel" aria-label="تفاصيل الدورة">
          <div className="price-row">
            <div>
              <span>سعر الدورة</span>
              <strong>{effectivePrice.toLocaleString('ar-EG')} {settings.currency}</strong>
            </div>
            <b>متاح الآن</b>
          </div>
          <ul className="check-list">
            <li><BadgeCheck aria-hidden="true" /> مسار واضح من الأساسيات إلى مشاريع كاملة.</li>
            <li><BadgeCheck aria-hidden="true" /> متابعة عملية تساعدك على بناء بورتفوليو حقيقي.</li>
            <li><BadgeCheck aria-hidden="true" /> دعم بعد انتهاء الكورس لتجهيزك للتقديم.</li>
          </ul>
        </aside>
      </section>

      <section className="guide-section">
        <div className="section-heading">
          <span className="section-icon"><BookOpenCheck aria-hidden="true" /></span>
          <div>
            <h2>{settings.guide_title}</h2>
            <p>{settings.guide_intro}</p>
          </div>
        </div>
        <div className="guide-grid">
          {visibleGuideItems.map((item) => (
            <article className="guide-card" key={item.id}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      {loading ? <div className="sr-only" aria-live="polite">جار تحميل بيانات الصفحات...</div> : null}
    </main>
  );
}
