import Link from 'next/link';
import { ArrowLeft, BadgeCheck, BookOpenCheck, Code2, MessageCircle } from 'lucide-react';

import { defaultSettings } from '@/lib/defaults';

export default function HomePage() {
  const settings = defaultSettings;
  const whatsappUrl = `https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}`;
  const effectivePrice = Math.max(0, Number(settings.course_price) - Number(settings.course_discount_amount || 0));

  return (
    <main className="site-shell min-h-screen overflow-hidden text-white">
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 lg:px-8">
        <div className="flex items-center gap-3" aria-label={settings.brand_name}>
          <span className="brand-mark"><Code2 aria-hidden="true" /></span>
          <div>
            <strong className="block text-sm tracking-wide text-white">{settings.brand_name.toUpperCase()}</strong>
            <span className="block text-[10px] tracking-[.2em] text-cyan-300/70">LEARN • BUILD • GROW</span>
          </div>
        </div>

        <a className="support-link" href={whatsappUrl} target="_blank" rel="noreferrer">
          <MessageCircle /> تواصل معنا
        </a>
      </header>

      <section className="relative z-10 mx-auto grid w-full max-w-6xl gap-8 px-5 pb-16 pt-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:px-8">
        <div>
          <span className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-2 text-xs font-bold tracking-[0.18em] text-cyan-200">
            برنامج تدريبي عملي
          </span>

          <h1 className="mt-6 text-4xl font-black leading-tight text-white md:text-5xl lg:text-6xl">
            {settings.course_name}
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
            {settings.course_description}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3.5 text-base font-bold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-300"
            >
              سجل الآن
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/50 px-6 py-3.5 text-base font-bold text-white transition hover:border-cyan-300/60 hover:text-cyan-100"
            >
              <MessageCircle className="h-4 w-4 text-cyan-300" />
              واتساب
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-300">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">تطبيق عملي</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">مشاريع حقيقية</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">دعم بعد الكورس</span>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <p className="text-sm text-slate-400">سعر الدورة</p>
              <div className="mt-1 flex items-end gap-2">
                <span className="text-3xl font-black text-white">{effectivePrice.toLocaleString('ar-EG')}</span>
                <span className="pb-1 text-sm text-slate-400">{settings.currency}</span>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
              متاح الآن
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {[
              'من الصفر إلى مشاريع عملية جاهزة للتقديم.',
              'شرح مفصل مع متابعة ودعم طوال المسار.',
              'خطة واضحة بعد انتهاء الكورس لتبدأ مهنيًا.',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/5 p-3">
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                <p className="text-sm leading-7 text-slate-200">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-500/8 p-4 text-sm text-cyan-50">
            <p className="font-bold">تواصل الآن واتساب</p>
            <p className="mt-2 text-cyan-100/80">للاستفسار عن التفاصيل والإعلان عن الدفعات القادمة.</p>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20 lg:px-8">
        <div className="rounded-[30px] border border-white/10 bg-slate-950/45 p-6 shadow-2xl shadow-slate-950/20 md:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-300">
              <BookOpenCheck className="h-5 w-5" />
            </span>
            <h2 className="text-2xl font-black text-white md:text-3xl">{settings.guide_title}</h2>
          </div>

          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">{settings.guide_intro}</p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {settings.guide_items.map((item) => (
              <article key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-xl font-bold text-white">{item.title}</h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-300">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
