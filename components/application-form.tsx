'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, Code2, Loader2, MessageCircle, UploadCloud } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [successId, setSuccessId] = useState('');

  useEffect(() => {
    void fetch('/api/public/form')
      .then((response) => response.json() as Promise<PublicFormPayload>)
      .then((data) => {
        if (data.settings && data.questions) setPayload(data);
      })
      .catch(() => undefined)
      .finally(() => setPageLoading(false));
  }, []);

  const visible = useMemo(
    () => payload.questions.filter((q) => q.active && (!q.condition || values[q.condition.questionId] === q.condition.equals)),
    [payload.questions, values],
  );

  function validate(questions: FormQuestion[]) {
    for (const question of questions) {
      if (!question.required) continue;
      if (question.type === 'file' ? !files[question.id] : !values[question.id]?.trim()) {
        setError(`من فضلك أكمل حقل «${question.label}».`);
        return false;
      }
    }
    setError('');
    return true;
  }

  async function submit(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    if (!validate(visible)) return;
    setLoading(true);
    setError('');
    const form = new FormData(event.currentTarget);
    form.set('answers', JSON.stringify(values));
    Object.entries(files).forEach(([id, file]) => form.set(`file_${id}`, file));

    try {
      const response = await fetch('/api/public/applications', { method: 'POST', body: form });
      const data = await response.json() as { id?: string; error?: string };
      if (!response.ok) throw new Error(data.error || 'تعذر إرسال الطلب.');
      setSuccessId(data.id || 'received');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'تعذر إرسال الطلب.');
    } finally {
      setLoading(false);
    }
  }

  const { settings } = payload;
  const whatsAppUrl = `https://wa.me/${onlyDigits(settings.whatsapp_number)}`;
  const effectivePrice = Math.max(0, Number(settings.course_price) - Number(settings.course_discount_amount || 0));

  return (
    <main className="site-shell min-h-screen overflow-hidden">
      <div className="aurora aurora-one" /><div className="aurora aurora-two" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 lg:px-8">
        <Link href="/apply" className="flex items-center gap-3" aria-label={settings.brand_name}>
          {settings.logo_url ? <Image src={settings.logo_url} alt="" width={44} height={44} unoptimized className="h-11 w-11 rounded-xl object-cover" /> : <span className="brand-mark"><Code2 aria-hidden="true" /></span>}
          <span><strong className="block text-sm tracking-wide text-white">{settings.brand_name.toUpperCase()}</strong><span className="block text-[10px] tracking-[.2em] text-cyan-300/70">LEARN • BUILD • GROW</span></span>
        </Link>
        <a className="support-link" href={whatsAppUrl} target="_blank" rel="noreferrer"><MessageCircle /> تواصل معنا</a>
      </header>

      {pageLoading ? (
        <div className="relative z-10 grid min-h-[60vh] place-items-center text-slate-400">
          <div><Loader2 className="mx-auto mb-3 animate-spin text-cyan-300" /><p>جارٍ تجهيز نموذج التقديم…</p></div>
        </div>
      ) : !settings.registration_open ? (
        <section className="relative z-10 mx-auto grid min-h-[60vh] w-full max-w-4xl place-items-center px-5 pb-16 pt-6">
          <div className="google-form-shell text-center">
            <span className="step-orb mx-auto mb-5">!</span>
            <h2 className="text-2xl font-bold text-white">التسجيل مغلق حاليًا</h2>
            <p className="mx-auto mt-3 max-w-md leading-7 text-slate-400">يمكنك التواصل مع الإدارة عبر واتساب لمعرفة موعد فتح الدفعة القادمة.</p>
            <Button className="submit-button mt-7 h-12 px-6" render={<a aria-label="التواصل عبر واتساب" href={whatsAppUrl} target="_blank" rel="noreferrer">واتساب</a>}><MessageCircle /> تواصل عبر واتساب</Button>
          </div>
        </section>
      ) : successId ? (
        <section className="relative z-10 mx-auto grid min-h-[60vh] w-full max-w-4xl place-items-center px-5 pb-16 pt-6">
          <div className="google-form-shell text-center">
            <span className="success-icon"><CheckCircle2 /></span>
            <p className="step-label mt-6">تم استلام طلبك بنجاح</p>
            <h2 className="mt-2 text-3xl font-black text-white">خطوة ممتازة لبداية جديدة!</h2>
            <p className="mx-auto mt-4 max-w-md leading-7 text-slate-400">سيراجع فريقنا بياناتك وإثبات الدفع، ويمكنك التواصل معنا عبر واتساب في أي وقت.</p>
            <span className="reference-chip mt-5">رقم الطلب: {successId.slice(0, 12)}</span>
            <Button className="submit-button mt-7 h-12 px-6" render={<a aria-label="التواصل مع الإدارة عبر واتساب" href={`${whatsAppUrl}?text=${encodeURIComponent(`مرحبًا، قدمت في ${settings.course_name} ورقم طلبي ${successId}`)}`} target="_blank" rel="noreferrer">واتساب</a>}><MessageCircle /> تواصل مع الإدارة</Button>
          </div>
        </section>
      ) : (
        <section className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-16 pt-4">
          <div className="google-form-shell">
            <div className="google-form-header">
              <span className="google-header-badge">التسجيل</span>
              <h1 className="google-form-title">انضم إلى دورة {settings.course_name}</h1>
              <p className="google-form-subtitle">املأ بياناتك بدقة. سيتم التواصل معك فورًا لتأكيد الحجز.</p>
              <div className="google-summary">
                <span>{settings.course_name}</span>
                <strong>{effectivePrice.toLocaleString('ar-EG')} ج</strong>
              </div>
            </div>

            <form className="google-form-body" onSubmit={submit}>
              <input name="company_website" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px]" aria-hidden="true" />
              <FieldGroup className="google-form-grid gap-5">
                {visible.map((question) => (
                  <DynamicField
                    key={question.id}
                    question={question}
                    value={values[question.id] || ''}
                    file={files[question.id]}
                    onChange={(value) => setValues((current) => ({ ...current, [question.id]: value }))}
                    onFile={(file) => setFiles((current) => ({ ...current, [question.id]: file }))}
                  />
                ))}
                {error && <p role="alert" className="google-form-alert">{error}</p>}
              </FieldGroup>
              <div className="google-form-actions">
                <Button disabled={loading} className="submit-button h-14 flex-1 text-base" size="lg">
                  {loading ? <><Loader2 className="animate-spin" /> جارٍ الإرسال…</> : 'تسجيل الآن'}
                </Button>
              </div>
            </form>
          </div>
        </section>
      )}
    </main>
  );
}

function DynamicField({ question, value, file, onChange, onFile }: { question: FormQuestion; value: string; file?: File; onChange: (value: string) => void; onFile: (file: File) => void }) {
  const label = <FieldLabel htmlFor={question.id} className="google-field-label">{question.label} {question.required && <b>*</b>}</FieldLabel>;

  if (question.type === 'single_choice' || question.type === 'yes_no') {
    const options = question.type === 'yes_no' ? ['نعم', 'لا'] : question.options;
    return (
      <Field className="google-field-card">
        {label}
        <div className="google-choice-grid">
          {options.map((option) => (
            <label key={option} className={`google-choice ${value === option ? 'selected' : ''}`}>
              <input className="sr-only" type="radio" name={question.id} value={option} checked={value === option} onChange={() => onChange(option)} />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </Field>
    );
  }

  if (question.type === 'long_text') {
    return (
      <Field className="google-field-card">
        {label}
        <textarea id={question.id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={question.placeholder || ''} className="google-input min-h-28 resize-y" />
      </Field>
    );
  }

  if (question.type === 'file') {
    return (
      <Field className="google-field-card">
        {label}
        <label className={`google-upload ${file ? 'has-file' : ''}`} htmlFor={question.id}>
          <UploadCloud />
          <strong>{file ? file.name : 'اضغط لاختيار صورة إثبات الدفع'}</strong>
          <span>PNG أو JPG أو WEBP أو PDF — بحد أقصى 5MB</span>
          <input id={question.id} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </label>
      </Field>
    );
  }

  return (
    <Field className="google-field-card">
      {label}
      <Input
        id={question.id}
        type={question.type === 'email' ? 'email' : 'text'}
        inputMode={question.type === 'phone' ? 'tel' : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder || ''}
        className={`google-input ${question.type === 'email' || question.type === 'phone' ? 'text-left' : ''}`}
        dir={question.type === 'email' || question.type === 'phone' ? 'ltr' : 'rtl'}
      />
    </Field>
  );
}
