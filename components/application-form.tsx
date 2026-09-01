'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BadgeCheck, CheckCircle2, Code2, Loader2, MessageCircle, ShieldCheck, UploadCloud } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { defaultQuestions, defaultSettings } from '@/lib/defaults';
import type { FormQuestion, PublicFormPayload } from '@/lib/types';

function onlyDigits(value: string) { return value.replace(/\D/g, ''); }

export function ApplicationForm() {
  const [payload, setPayload] = useState<PublicFormPayload>({ settings: defaultSettings, questions: defaultQuestions });
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [successId, setSuccessId] = useState('');

  useEffect(() => {
    void fetch('/api/public/form').then((response) => response.json() as Promise<PublicFormPayload>).then((data) => { if (data.settings && data.questions) setPayload(data); }).catch(() => undefined).finally(() => setPageLoading(false));
  }, []);

  const visible = useMemo(() => payload.questions.filter((q) => q.active && (!q.condition || values[q.condition.questionId] === q.condition.equals)), [payload.questions, values]);
  const splitAt = Math.min(3, Math.max(1, visible.length));
  const currentQuestions = step === 1 ? visible.slice(0, splitAt) : visible.slice(splitAt);
  const hasSecondStep = visible.length > splitAt;

  function validate(questions: FormQuestion[]) {
    for (const question of questions) {
      if (!question.required) continue;
      if (question.type === 'file' ? !files[question.id] : !values[question.id]?.trim()) { setError(`من فضلك أكمل حقل «${question.label}».`); return false; }
    }
    setError(''); return true;
  }

  async function submit(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    if (step === 1 && hasSecondStep) { if (validate(currentQuestions)) setStep(2); return; }
    if (!validate(currentQuestions)) return;
    setLoading(true); setError('');
    const form = new FormData(event.currentTarget);
    form.set('answers', JSON.stringify(values));
    Object.entries(files).forEach(([id, file]) => form.set(`file_${id}`, file));
    try {
      const response = await fetch('/api/public/applications', { method: 'POST', body: form });
      const data = await response.json() as { id?: string; error?: string };
      if (!response.ok) throw new Error(data.error || 'تعذر إرسال الطلب.');
      setSuccessId(data.id || 'received');
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'تعذر إرسال الطلب.'); }
    finally { setLoading(false); }
  }

  const { settings } = payload;
  const whatsAppUrl = `https://wa.me/${onlyDigits(settings.whatsapp_number)}`;

  return (
    <main className="site-shell min-h-screen overflow-hidden">
      <div className="aurora aurora-one" /><div className="aurora aurora-two" />
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 lg:px-10">
        <Link href="/apply" className="flex items-center gap-3" aria-label={settings.brand_name}>
          {settings.logo_url ? <Image src={settings.logo_url} alt="" width={44} height={44} unoptimized className="h-11 w-11 rounded-xl object-cover" /> : <span className="brand-mark"><Code2 aria-hidden="true" /></span>}
          <span><strong className="block text-sm tracking-wide text-white">{settings.brand_name.toUpperCase()}</strong><span className="block text-[10px] tracking-[.2em] text-cyan-300/70">LEARN • BUILD • GROW</span></span>
        </Link>
        <a className="support-link" href={whatsAppUrl} target="_blank" rel="noreferrer"><MessageCircle /> تواصل معنا</a>
      </header>

      <section className="relative z-10 mx-auto grid w-full max-w-7xl items-start gap-12 px-5 pb-16 pt-6 lg:grid-cols-[.85fr_1.15fr] lg:px-10 lg:pt-12">
        <div className="max-w-xl pt-4 lg:sticky lg:top-10">
          <span className="eyebrow"><span /> {settings.registration_open ? 'التسجيل متاح الآن' : 'التسجيل مغلق حاليًا'}</span>
          <h1 className="mt-7 text-4xl font-black leading-[1.25] text-white sm:text-5xl lg:text-6xl">ابدأ رحلتك في<span className="gradient-text block">عالم البرمجة.</span></h1>
          <p className="mt-6 max-w-lg text-base leading-8 text-slate-300 sm:text-lg">{settings.course_description}</p>
          <div className="mt-9 flex flex-wrap gap-3 text-sm text-slate-300"><span className="feature-pill"><BadgeCheck /> تدريب عملي</span><span className="feature-pill"><ShieldCheck /> بياناتك آمنة</span></div>
          <div className="course-card mt-10"><div><span className="text-xs text-slate-400">الكورس الحالي</span><h2 className="mt-1 text-lg font-bold text-white">{settings.course_name}</h2></div><div className="price-box"><strong>{Number(settings.course_price).toLocaleString('ar-EG')}</strong><span>جنيه</span></div></div>
        </div>

        <div className="form-card">
          {pageLoading ? <div className="grid min-h-[430px] place-items-center text-center text-slate-400"><div><Loader2 className="mx-auto mb-3 animate-spin text-cyan-300" /><p>جارٍ تجهيز نموذج التقديم…</p></div></div>
          : !settings.registration_open ? <div className="grid min-h-[430px] place-items-center text-center"><div><span className="step-orb mx-auto mb-5">!</span><h2 className="text-2xl font-bold text-white">التسجيل مغلق حاليًا</h2><p className="mx-auto mt-3 max-w-sm leading-7 text-slate-400">يمكنك التواصل مع الإدارة عبر واتساب لمعرفة موعد فتح الدفعة القادمة.</p><Button className="submit-button mt-7 h-12 px-6" render={<a aria-label="التواصل عبر واتساب" href={whatsAppUrl} target="_blank" rel="noreferrer">واتساب</a>}><MessageCircle /> تواصل عبر واتساب</Button></div></div>
          : successId ? <div className="grid min-h-[430px] place-items-center text-center"><div><span className="success-icon"><CheckCircle2 /></span><p className="step-label mt-6">تم استلام طلبك بنجاح</p><h2 className="mt-2 text-3xl font-black text-white">خطوة ممتازة لبداية جديدة!</h2><p className="mx-auto mt-4 max-w-md leading-7 text-slate-400">سيراجع فريقنا بياناتك وإثبات الدفع، ويمكنك التواصل معنا عبر واتساب في أي وقت.</p><span className="reference-chip mt-5">رقم الطلب: {successId.slice(0, 12)}</span><Button className="submit-button mt-7 h-12 px-6" render={<a aria-label="التواصل مع الإدارة عبر واتساب" href={`${whatsAppUrl}?text=${encodeURIComponent(`مرحبًا، قدمت في ${settings.course_name} ورقم طلبي ${successId}`)}`} target="_blank" rel="noreferrer">واتساب</a>}><MessageCircle /> تواصل مع الإدارة</Button></div></div>
          : <>
              <div className="mb-8 flex items-start justify-between gap-4"><div><span className="step-label">الخطوة {step} من {hasSecondStep ? 2 : 1}</span><h2 className="mt-2 text-2xl font-bold text-white">{step === 1 ? 'بيانات التقديم' : 'الدراسة وطريقة الدفع'}</h2><p className="mt-2 text-sm leading-6 text-slate-400">املأ بياناتك بدقة وسنتواصل معك لتأكيد الحجز.</p></div><span className="step-orb">0{step}</span></div>
              <div className="progress-track"><span style={{ width: step === 1 && hasSecondStep ? '48%' : '100%' }} /></div>
              <form className="mt-8" onSubmit={submit}>
                <input name="company_website" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px]" aria-hidden="true" />
                <FieldGroup className="gap-6">
                  {currentQuestions.map((question) => <DynamicField key={question.id} question={question} value={values[question.id] || ''} file={files[question.id]} onChange={(value) => setValues((current) => ({ ...current, [question.id]: value }))} onFile={(file) => setFiles((current) => ({ ...current, [question.id]: file }))} />)}
                  {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/8 px-4 py-3 text-sm text-red-200">{error}</p>}
                  <div className="flex gap-3 pt-1">
                    {step === 2 && <Button type="button" variant="outline" className="h-13 border-white/10 bg-white/5 px-5" onClick={() => { setStep(1); setError(''); }}><ArrowRight /> السابق</Button>}
                    <Button disabled={loading} className="submit-button h-13 flex-1 text-base" size="lg">{loading ? <><Loader2 className="animate-spin" /> جارٍ الإرسال…</> : step === 1 && hasSecondStep ? <>التالي: بيانات الدراسة والدفع <ArrowLeft /></> : <>إرسال طلب التقديم <ArrowLeft /></>}</Button>
                  </div>
                </FieldGroup>
              </form>
              <p className="mt-5 text-center text-xs leading-5 text-slate-500">بإرسال الطلب أنت توافق على استخدام بياناتك للتواصل بخصوص الكورس فقط.</p>
            </>}
        </div>
      </section>
    </main>
  );
}

function DynamicField({ question, value, file, onChange, onFile }: { question: FormQuestion; value: string; file?: File; onChange: (value: string) => void; onFile: (file: File) => void }) {
  const label = <FieldLabel htmlFor={question.id} className="field-label">{question.label} {question.required && <b>*</b>}</FieldLabel>;
  if (question.type === 'single_choice' || question.type === 'yes_no') {
    const options = question.type === 'yes_no' ? ['نعم', 'لا'] : question.options;
    return <Field>{label}<div className="choice-grid">{options.map((option) => <label key={option} className={`choice-card ${value === option ? 'selected' : ''}`}><input className="sr-only" type="radio" name={question.id} value={option} checked={value === option} onChange={() => onChange(option)} /><span>{option}</span><i /></label>)}</div></Field>;
  }
  if (question.type === 'long_text') return <Field>{label}<textarea id={question.id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={question.placeholder || ''} className="premium-input min-h-28 resize-y py-3" /></Field>;
  if (question.type === 'file') return <Field>{label}<label className={`upload-zone ${file ? 'has-file' : ''}`} htmlFor={question.id}><UploadCloud /><strong>{file ? file.name : 'اضغط لاختيار صورة إثبات الدفع'}</strong><span>PNG أو JPG أو WEBP أو PDF — بحد أقصى 5MB</span><input id={question.id} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} /></label></Field>;
  return <Field>{label}<Input id={question.id} type={question.type === 'email' ? 'email' : 'text'} inputMode={question.type === 'phone' ? 'tel' : undefined} value={value} onChange={(e) => onChange(e.target.value)} placeholder={question.placeholder || ''} className={`premium-input ${question.type === 'email' || question.type === 'phone' ? 'text-left' : ''}`} dir={question.type === 'email' || question.type === 'phone' ? 'ltr' : 'rtl'} /></Field>;
}
