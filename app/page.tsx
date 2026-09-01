import Link from 'next/link';
import { ArrowLeft, BadgeCheck, BookOpenCheck, Code2, MessageCircle, Sparkles } from 'lucide-react';

import { defaultSettings } from '@/lib/defaults';

export default function HomePage() {
  const settings = defaultSettings;
  const whatsappUrl = `https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}`;
  const effectivePrice = Math.max(0, Number(settings.course_price) - Number(settings.course_discount_amount || 0));

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
        <a className="ghost-link" href={whatsappUrl} target="_blank" rel="noreferrer">
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
            <a className="secondary-button" href={whatsappUrl} target="_blank" rel="noreferrer">
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
          {settings.guide_items.map((item) => (
            <article className="guide-card" key={item.id}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
