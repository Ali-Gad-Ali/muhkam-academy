'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Code2, Loader2, MessageCircle, UploadCloud } from 'lucide-react';

import { defaultQuestions, defaultSettings } from '@/lib/defaults';
import type { FormQuestion, PublicFormPayload } from '@/lib/types';

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

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

  const visibleQuestions = useMemo(
    () => payload.questions.filter((question) => question.active && (!question.condition || values[question.condition.questionId] === question.condition.equals)),
    [payload.questions, values],
  );

  function validate(questions: FormQuestion[]) {
    for (const question of questions) {
      const missingFile = question.type === 'file' && !files[question.id];
      const missingValue = question.type !== 'file' && !values[question.id]?.trim();
      if (question.required && (missingFile || missingValue)) {
        setError(`من فضلك أكمل حقل «${question.label}».`);
        return false;
      }
    }
    setError('');
    return true;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate(visibleQuestions)) return;
    setLoading(true);
    setError('');

    const form = new FormData(event.currentTarget);
    form.set('answers', JSON.stringify(values));
    Object.entries(files).forEach(([id, file]) => form.set(`file_${id}`, file));

    try {
      const response = await fetch('/api/public/applications', { method: 'POST', body: form });
      const data = (await response.json()) as { id?: string; error?: string };
      if (!response.ok) throw new Error(data.error || 'تعذر إرسال الطلب.');
      setSuccessId(data.id || 'received');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'تعذر إرسال الطلب.');
    } finally {
      setLoading(false);
    }
  }

  const { settings } = payload;
  const whatsappUrl = `https://wa.me/${onlyDigits(settings.whatsapp_number)}`;
  const effectivePrice = Math.max(0, Number(settings.course_price) - Number(settings.course_discount_amount || 0));

  return (
    <main className="public-page">
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-icon"><Code2 aria-hidden="true" /></span>
          <span>
            <strong>{settings.brand_name}</strong>
            <small>Application form</small>
          </span>
        </Link>
        <a className="ghost-link" href={whatsappUrl} target="_blank" rel="noreferrer">
          <MessageCircle aria-hidden="true" />
          تواصل معنا
        </a>
      </header>

      {pageLoading ? (
        <section className="center-state">
          <Loader2 className="spin" aria-hidden="true" />
          <p>جار تجهيز نموذج التقديم...</p>
        </section>
      ) : !settings.registration_open ? (
        <section className="form-shell narrow-state">
          <span className="state-mark">!</span>
          <h1>التسجيل مغلق حاليا</h1>
          <p>يمكنك التواصل مع الإدارة عبر واتساب لمعرفة موعد فتح الدفعة القادمة.</p>
          <a className="primary-button" href={whatsappUrl} target="_blank" rel="noreferrer">
            <MessageCircle aria-hidden="true" />
            تواصل عبر واتساب
          </a>
        </section>
      ) : successId ? (
        <section className="form-shell narrow-state">
          <span className="success-mark"><CheckCircle2 aria-hidden="true" /></span>
          <h1>تم استلام طلبك بنجاح</h1>
          <p>سيراجع فريقنا بياناتك وإثبات الدفع، ويمكنك التواصل معنا عبر واتساب في أي وقت.</p>
          <b className="reference-chip">رقم الطلب: {successId.slice(0, 12)}</b>
          <a className="primary-button" href={`${whatsappUrl}?text=${encodeURIComponent(`مرحبا، قدمت في ${settings.course_name} ورقم طلبي ${successId}`)}`} target="_blank" rel="noreferrer">
            <MessageCircle aria-hidden="true" />
            تواصل مع الإدارة
          </a>
        </section>
      ) : (
        <section className="form-shell">
          <div className="form-header">
            <span className="eyebrow">التسجيل</span>
            <h1>انضم إلى دورة {settings.course_name}</h1>
            <p>املأ بياناتك بدقة وسيتم التواصل معك لتأكيد الحجز.</p>
            <div className="course-summary">
              <span>{settings.course_name}</span>
              <strong>{effectivePrice.toLocaleString('ar-EG')} ج.م</strong>
            </div>
          </div>

          <form className="application-form" onSubmit={submit}>
            <input name="company_website" tabIndex={-1} autoComplete="off" className="honeypot" aria-hidden="true" />
            <div className="form-grid">
              {visibleQuestions.map((question) => (
                <DynamicField
                  key={question.id}
                  question={question}
                  value={values[question.id] || ''}
                  file={files[question.id]}
                  onChange={(value) => setValues((current) => ({ ...current, [question.id]: value }))}
                  onFile={(file) => setFiles((current) => ({ ...current, [question.id]: file }))}
                />
              ))}
              {error && <p role="alert" className="form-alert">{error}</p>}
            </div>
            <button className="primary-button submit-wide" disabled={loading}>
              {loading ? <Loader2 className="spin" aria-hidden="true" /> : null}
              {loading ? 'جار الإرسال...' : 'تسجيل الآن'}
            </button>
          </form>
        </section>
      )}
    </main>
  );
}

function DynamicField({ question, value, file, onChange, onFile }: { question: FormQuestion; value: string; file?: File; onChange: (value: string) => void; onFile: (file: File) => void }) {
  const label = (
    <label className="field-label" htmlFor={question.id}>
      {question.label} {question.required ? <b>*</b> : null}
    </label>
  );

  if (question.type === 'single_choice' || question.type === 'yes_no') {
    const options = question.type === 'yes_no' ? ['نعم', 'لا'] : question.options;
    return (
      <div className="field-card">
        {label}
        <div className="choice-grid">
          {options.map((option) => (
            <label key={option} className={`choice-button ${value === option ? 'selected' : ''}`}>
              <input type="radio" name={question.id} value={option} checked={value === option} onChange={() => onChange(option)} />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (question.type === 'long_text') {
    return (
      <div className="field-card field-card-wide">
        {label}
        <textarea id={question.id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={question.placeholder || ''} />
      </div>
    );
  }

  if (question.type === 'file') {
    return (
      <div className="field-card field-card-wide">
        {label}
        <label className={`upload-box ${file ? 'has-file' : ''}`} htmlFor={question.id}>
          <UploadCloud aria-hidden="true" />
          <strong>{file ? file.name : 'اضغط لاختيار صورة إثبات الدفع'}</strong>
          <span>PNG أو JPG أو WEBP أو PDF بحد أقصى 5MB</span>
          <input id={question.id} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => event.target.files?.[0] && onFile(event.target.files[0])} />
        </label>
      </div>
    );
  }

  return (
    <div className="field-card">
      {label}
      <input
        id={question.id}
        type={question.type === 'email' ? 'email' : 'text'}
        inputMode={question.type === 'phone' ? 'tel' : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={question.placeholder || ''}
        dir={question.type === 'email' || question.type === 'phone' ? 'ltr' : 'rtl'}
      />
    </div>
  );
}
