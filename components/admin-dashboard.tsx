'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  Banknote,
  Bell,
  Check,
  ClipboardList,
  Eye,
  FileCheck2,
  FileText,
  Gauge,
  Loader2,
  LogOut,
  MessageCircle,
  Plus,
  Save,
  Search,
  Settings,
  Trash2,
  Users,
} from 'lucide-react';

import { defaultQuestions, defaultSettings } from '@/lib/defaults';
import { buildWhatsAppUrl, formatEgyptWhatsAppNumber } from '@/lib/whatsapp';
import type { ApplicationRecord, DashboardPayload, FormQuestion, InvoiceRecord, QuestionType, SiteSettings } from '@/lib/types';

type AdminTab = 'overview' | 'applications' | 'questions' | 'invoices' | 'settings';

const tabs: Array<[AdminTab, string, typeof Gauge]> = [
  ['overview', 'نظرة عامة', Gauge],
  ['applications', 'طلبات التقديم', Users],
  ['questions', 'إدارة الأسئلة', ClipboardList],
  ['invoices', 'الفواتير', FileText],
  ['settings', 'الإعدادات', Settings],
];

const questionLabels: Record<QuestionType, string> = {
  short_text: 'نص قصير',
  long_text: 'نص طويل',
  email: 'بريد إلكتروني',
  phone: 'رقم هاتف',
  single_choice: 'اختيار واحد',
  yes_no: 'نعم / لا',
  file: 'رفع ملف',
};

export function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [data, setData] = useState<DashboardPayload>({ settings: defaultSettings, questions: defaultQuestions, applications: [], invoices: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selected, setSelected] = useState<ApplicationRecord | null>(null);

  useEffect(() => {
    void fetch('/api/admin/data')
      .then(async (response) => {
        if (response.status === 401) {
          window.location.href = '/admin/login';
          return null;
        }
        return response.json() as Promise<DashboardPayload>;
      })
      .then((payload) => {
        if (payload?.settings) setData(payload);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      data.applications.filter((application) => {
        const text = `${application.applicant_name} ${application.phone} ${application.email}`.toLowerCase();
        return text.includes(search.toLowerCase()) && (paymentFilter === 'all' || application.payment_status === paymentFilter);
      }),
    [data.applications, paymentFilter, search],
  );

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2600);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  async function saveQuestions() {
    setSaving(true);
    const response = await fetch('/api/admin/questions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data.questions),
    });
    setSaving(false);
    flash(response.ok ? 'تم حفظ الأسئلة.' : 'تعذر حفظ الأسئلة.');
  }

  async function addQuestion() {
    const draft: FormQuestion = {
      id: crypto.randomUUID(),
      system_key: null,
      label: 'سؤال جديد',
      type: 'short_text',
      required: false,
      placeholder: '',
      options: [],
      position: data.questions.length + 1,
      active: true,
      condition: null,
    };
    const response = await fetch('/api/admin/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    const saved = response.ok ? ((await response.json()) as FormQuestion) : draft;
    setData((current) => ({ ...current, questions: [...current.questions, saved] }));
    flash('تمت إضافة سؤال.');
  }

  async function deleteQuestion(id: string) {
    if (!window.confirm('هل تريد حذف السؤال؟')) return;
    await fetch(`/api/admin/questions?id=${id}`, { method: 'DELETE' });
    setData((current) => ({
      ...current,
      questions: current.questions
        .filter((question) => question.id !== id)
        .map((question, index) => ({ ...question, position: index + 1, condition: question.condition?.questionId === id ? null : question.condition })),
    }));
    flash('تم حذف السؤال.');
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    setData((current) => {
      const questions = [...current.questions];
      const target = index + direction;
      if (target < 0 || target >= questions.length) return current;
      [questions[index], questions[target]] = [questions[target], questions[index]];
      return { ...current, questions: questions.map((question, position) => ({ ...question, position: position + 1 })) };
    });
  }

  async function saveSettings() {
    setSaving(true);
    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data.settings),
    });
    setSaving(false);
    flash(response.ok ? 'تم حفظ الإعدادات.' : 'تعذر حفظ الإعدادات.');
  }

  async function updateApplication(application: ApplicationRecord, changes: Partial<ApplicationRecord>) {
    const next = { ...application, ...changes };
    const response = await fetch('/api/admin/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: next.id, status: next.status, payment_status: next.payment_status }),
    });
    if (!response.ok) return;
    setData((current) => ({
      ...current,
      applications: current.applications.map((item) => (item.id === next.id ? next : item)),
    }));
    setSelected(next);
    flash('تم تحديث الطلب.');
  }

  async function createInvoice(application: ApplicationRecord) {
    const amount = Math.max(0, Number(data.settings.course_price) - Number(data.settings.course_discount_amount || 0));
    const methodQuestionId = data.questions.find((question) => question.system_key === 'payment_method')?.id;
    const response = await fetch('/api/admin/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        application_id: application.id,
        recipient_name: application.applicant_name || 'متقدم الكورس',
        phone: application.phone,
        amount,
        payment_method: application.answers.find((answer) => answer.questionId === methodQuestionId)?.value || 'تحويل',
      }),
    });
    const invoice = (await response.json()) as InvoiceRecord & { error?: string };
    if (!response.ok) {
      flash(invoice.error || 'تعذر إنشاء الفاتورة.');
      return;
    }
    setData((current) => ({ ...current, invoices: [invoice, ...current.invoices] }));
    setTab('invoices');
    flash('تم إنشاء الفاتورة.');
  }

  if (loading) {
    return (
      <main className="admin-loading">
        <Loader2 className="spin" aria-hidden="true" />
      </main>
    );
  }

  const paid = data.applications.filter((item) => item.payment_status === 'paid').length;
  const pending = data.applications.filter((item) => item.payment_status === 'pending').length;
  const revenue = data.invoices.filter((item) => item.status === 'issued').reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <main className="admin-layout">
      {notice ? <div className="admin-toast"><Check aria-hidden="true" /> {notice}</div> : null}

      <aside className="admin-sidebar">
        <div className="admin-logo">
          <strong>MUHKAM</strong>
          <span>Admin</span>
        </div>
        <nav>
          {tabs.map(([id, label, Icon]) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
              <Icon aria-hidden="true" />
              {label}
              {id === 'applications' ? <b>{data.applications.length}</b> : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-actions">
          <Link href="/apply"><Eye aria-hidden="true" /> عرض التقديم</Link>
          <button onClick={logout}><LogOut aria-hidden="true" /> تسجيل الخروج</button>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <div>
            <span>لوحة تحكم Muhkam Academy</span>
            <h1>{tab === 'overview' ? 'نظرة عامة' : tabs.find(([id]) => id === tab)?.[1]}</h1>
          </div>
          <button className="icon-button" aria-label="التنبيهات"><Bell aria-hidden="true" /></button>
        </header>

        {data.demo ? <div className="demo-banner">أنت في وضع المعاينة. أضف مفاتيح Supabase على Vercel لتفعيل الحفظ الحقيقي.</div> : null}

        {tab === 'overview' ? <Overview applications={data.applications} paid={paid} pending={pending} revenue={revenue} setTab={setTab} /> : null}
        {tab === 'applications' ? (
          <Applications
            applications={filtered}
            search={search}
            setSearch={setSearch}
            paymentFilter={paymentFilter}
            setPaymentFilter={setPaymentFilter}
            selected={selected}
            setSelected={setSelected}
            updateApplication={updateApplication}
            createInvoice={createInvoice}
          />
        ) : null}
        {tab === 'questions' ? <Questions questions={data.questions} setData={setData} addQuestion={addQuestion} deleteQuestion={deleteQuestion} moveQuestion={moveQuestion} saveQuestions={saveQuestions} saving={saving} /> : null}
        {tab === 'invoices' ? <Invoices invoices={data.invoices} /> : null}
        {tab === 'settings' ? <SettingsPanel settings={data.settings} setData={setData} save={saveSettings} saving={saving} /> : null}
      </section>
    </main>
  );
}

function Overview({ applications, paid, pending, revenue, setTab }: { applications: ApplicationRecord[]; paid: number; pending: number; revenue: number; setTab: (tab: AdminTab) => void }) {
  return (
    <div className="stack">
      <div className="stats-grid">
        <Stat title="إجمالي المتقدمين" value={applications.length} Icon={Users} />
        <Stat title="بانتظار المراجعة" value={pending} Icon={FileCheck2} />
        <Stat title="مدفوع" value={paid} Icon={BadgeCheck} />
        <Stat title="إجمالي الفواتير" value={`${revenue.toLocaleString('ar-EG')} ج.م`} Icon={Banknote} />
      </div>
      <article className="admin-card">
        <div className="card-heading">
          <div>
            <h2>أحدث الطلبات</h2>
            <p>آخر المتقدمين للكورس</p>
          </div>
          <button className="text-button" onClick={() => setTab('applications')}>عرض الكل</button>
        </div>
        <ApplicationsTable applications={applications.slice(0, 5)} onSelect={() => undefined} compact />
      </article>
    </div>
  );
}

function Stat({ title, value, Icon }: { title: string; value: string | number; Icon: typeof Users }) {
  return (
    <article className="stat-card">
      <span><Icon aria-hidden="true" /></span>
      <p>{title}</p>
      <strong>{value}</strong>
    </article>
  );
}

function Applications(props: {
  applications: ApplicationRecord[];
  search: string;
  setSearch: (value: string) => void;
  paymentFilter: string;
  setPaymentFilter: (value: string) => void;
  selected: ApplicationRecord | null;
  setSelected: (value: ApplicationRecord | null) => void;
  updateApplication: (application: ApplicationRecord, changes: Partial<ApplicationRecord>) => void;
  createInvoice: (application: ApplicationRecord) => void;
}) {
  return (
    <div className="admin-split">
      <article className="admin-card">
        <div className="filters-row">
          <label className="search-input">
            <Search aria-hidden="true" />
            <input value={props.search} onChange={(event) => props.setSearch(event.target.value)} placeholder="ابحث بالاسم أو الهاتف أو البريد" />
          </label>
          <select value={props.paymentFilter} onChange={(event) => props.setPaymentFilter(event.target.value)} aria-label="حالة الدفع">
            <option value="all">كل حالات الدفع</option>
            <option value="pending">قيد المراجعة</option>
            <option value="paid">مدفوع</option>
            <option value="rejected">مرفوض</option>
          </select>
        </div>
        <ApplicationsTable applications={props.applications} onSelect={props.setSelected} />
      </article>

      <aside className="admin-card detail-panel">
        {props.selected ? (
          <>
            <span className="mini-label">تفاصيل الطلب</span>
            <h2>{props.selected.applicant_name || 'بدون اسم'}</h2>
            <dl>
              <div><dt>الهاتف</dt><dd dir="ltr">{props.selected.phone}</dd></div>
              <div><dt>البريد</dt><dd dir="ltr">{props.selected.email}</dd></div>
              <div><dt>حالة الطلب</dt><dd><StatusBadge value={props.selected.status} /></dd></div>
              <div><dt>حالة الدفع</dt><dd><StatusBadge value={props.selected.payment_status} /></dd></div>
            </dl>
            <div className="detail-actions">
              <button onClick={() => props.updateApplication(props.selected!, { status: 'reviewing' })}>قيد المراجعة</button>
              <button onClick={() => props.updateApplication(props.selected!, { status: 'accepted', payment_status: 'paid' })}>قبول الدفع</button>
              <button onClick={() => props.updateApplication(props.selected!, { status: 'rejected', payment_status: 'rejected' })}>رفض</button>
            </div>
            <button className="primary-button submit-wide" onClick={() => props.createInvoice(props.selected!)}>إنشاء فاتورة</button>
            {props.selected.payment_proof_url ? <a className="text-button" href={props.selected.payment_proof_url} target="_blank" rel="noreferrer">فتح إثبات الدفع</a> : null}
          </>
        ) : (
          <div className="empty-state">
            <Users aria-hidden="true" />
            <p>اختر طلبا لعرض تفاصيله.</p>
          </div>
        )}
      </aside>
    </div>
  );
}

function ApplicationsTable({ applications, onSelect, compact = false }: { applications: ApplicationRecord[]; onSelect: (application: ApplicationRecord) => void; compact?: boolean }) {
  if (!applications.length) return <div className="empty-state"><p>لا توجد طلبات حتى الآن.</p></div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>المتقدم</th>
            <th>التواصل</th>
            <th>حالة الطلب</th>
            <th>الدفع</th>
            {!compact ? <th>إجراءات</th> : null}
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => (
            <tr key={application.id} onClick={() => onSelect(application)}>
              <td>
                <strong>{application.applicant_name || 'بدون اسم'}</strong>
                <small>{new Date(application.created_at).toLocaleDateString('ar-EG')}</small>
              </td>
              <td>
                <span dir="ltr">{application.phone}</span>
                <small dir="ltr">{application.email}</small>
              </td>
              <td><StatusBadge value={application.status} /></td>
              <td><StatusBadge value={application.payment_status} /></td>
              {!compact ? <td><button className="icon-button" aria-label="عرض"><Eye aria-hidden="true" /></button></td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Questions(props: {
  questions: FormQuestion[];
  setData: React.Dispatch<React.SetStateAction<DashboardPayload>>;
  addQuestion: () => void;
  deleteQuestion: (id: string) => void;
  moveQuestion: (index: number, direction: -1 | 1) => void;
  saveQuestions: () => void;
  saving: boolean;
}) {
  function update(id: string, changes: Partial<FormQuestion>) {
    props.setData((current) => ({
      ...current,
      questions: current.questions.map((question) => (question.id === id ? { ...question, ...changes } : question)),
    }));
  }

  function updateCondition(id: string, questionId: string | null, equals?: string) {
    props.setData((current) => ({
      ...current,
      questions: current.questions.map((question) => {
        if (question.id !== id) return question;
        if (!questionId) return { ...question, condition: null };
        const target = current.questions.find((item) => item.id === questionId);
        const nextEquals = equals ?? (target && (target.type === 'single_choice' || target.type === 'yes_no') ? (target.options[0] ?? '') : '');
        return { ...question, condition: { questionId, equals: nextEquals } };
      }),
    }));
  }

  return (
    <div className="stack">
      <div className="toolbar-row">
        <p>عدّل أسئلة نموذج التقديم وترتيبها، ثم احفظ التغييرات.</p>
        <div>
          <button className="secondary-button" onClick={props.addQuestion}><Plus aria-hidden="true" /> إضافة سؤال</button>
          <button className="primary-button" onClick={props.saveQuestions} disabled={props.saving}>
            {props.saving ? <Loader2 className="spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
            حفظ
          </button>
        </div>
      </div>
      {props.questions.map((question, index) => {
        const conditionQuestion = props.questions.find((item) => item.id === question.condition?.questionId && item.id !== question.id);
        const conditionOptions = conditionQuestion && (conditionQuestion.type === 'single_choice' || conditionQuestion.type === 'yes_no')
          ? conditionQuestion.options
          : [];

        return (
          <article className="question-card" key={question.id}>
            <div className="question-fields">
              <label>
                نص السؤال
                <input value={question.label} onChange={(event) => update(question.id, { label: event.target.value })} />
              </label>
              <label>
                نوع الإجابة
                <select value={question.type} onChange={(event) => update(question.id, { type: event.target.value as QuestionType })}>
                  {Object.entries(questionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>
                الحالة
                <select value={question.required ? 'required' : 'optional'} onChange={(event) => update(question.id, { required: event.target.value === 'required' })}>
                  <option value="required">مطلوب</option>
                  <option value="optional">اختياري</option>
                </select>
              </label>
            </div>

            <div className="question-condition">
              <label>
                يظهر هذا السؤال فقط إذا كان جواب السؤال
                <select value={question.condition?.questionId ?? ''} onChange={(event) => updateCondition(question.id, event.target.value || null)}>
                  <option value="">لا يوجد شرط</option>
                  {props.questions.filter((item) => item.id !== question.id).map((item) => (
                    <option key={item.id} value={item.id}>{item.label || 'سؤال بدون عنوان'}</option>
                  ))}
                </select>
              </label>

              {conditionQuestion ? (
                <label>
                  يساوي
                  {conditionOptions.length ? (
                    <select value={question.condition?.equals ?? conditionOptions[0]} onChange={(event) => updateCondition(question.id, conditionQuestion.id, event.target.value)}>
                      {conditionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : (
                    <input
                      value={question.condition?.equals ?? ''}
                      onChange={(event) => updateCondition(question.id, conditionQuestion.id, event.target.value)}
                      placeholder="اكتب قيمة الشرط"
                    />
                  )}
                </label>
              ) : null}
            </div>

            <div className="row-actions">
              <button className="icon-button" onClick={() => props.moveQuestion(index, -1)} aria-label="نقل لأعلى"><ArrowUp aria-hidden="true" /></button>
              <button className="icon-button" onClick={() => props.moveQuestion(index, 1)} aria-label="نقل لأسفل"><ArrowDown aria-hidden="true" /></button>
              <button className="icon-button danger" onClick={() => props.deleteQuestion(question.id)} aria-label="حذف"><Trash2 aria-hidden="true" /></button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Invoices({ invoices }: { invoices: InvoiceRecord[] }) {
  if (!invoices.length) return <article className="admin-card empty-state"><FileText aria-hidden="true" /><p>لا توجد فواتير بعد.</p></article>;
  return (
    <article className="admin-card">
      <div className="card-heading">
        <div>
          <h2>الفواتير الصادرة</h2>
          <p>روابط قابلة للطباعة والمشاركة والتحقق</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>رقم الفاتورة</th>
              <th>المستلم</th>
              <th>القيمة</th>
              <th>التاريخ</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => {
              return (
                <tr key={invoice.id}>
                  <td dir="ltr">{invoice.invoice_number}</td>
                  <td>{invoice.recipient_name}<small dir="ltr">{invoice.phone}</small></td>
                  <td>{Number(invoice.amount).toLocaleString('ar-EG')} ج.م</td>
                  <td>{new Date(invoice.issued_at).toLocaleDateString('ar-EG')}</td>
                  <td>
                    <div className="row-actions">
                      <a className="icon-button" href={`/invoice/${invoice.public_token}`} target="_blank" aria-label="عرض الفاتورة"><Eye aria-hidden="true" /></a>
                      <a className="icon-button" href={buildWhatsAppUrl(invoice.phone)} target="_blank" aria-label="فتح شات العميل على واتساب"><MessageCircle aria-hidden="true" /></a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function SettingsPanel({ settings, setData, save, saving }: { settings: SiteSettings; setData: React.Dispatch<React.SetStateAction<DashboardPayload>>; save: () => void; saving: boolean }) {
  function update(changes: Partial<SiteSettings>) {
    setData((current) => ({ ...current, settings: { ...current.settings, ...changes } }));
  }

  function updateGuideItem(id: string, changes: Partial<{ title: string; description: string; active: boolean }>) {
    setData((current) => ({
      ...current,
      settings: {
        ...current.settings,
        guide_items: current.settings.guide_items.map((item) => (item.id === id ? { ...item, ...changes, active: changes.active ?? item.active ?? true } : item)),
      },
    }));
  }

  function addGuideItem() {
    setData((current) => ({
      ...current,
      settings: {
        ...current.settings,
        guide_items: [...current.settings.guide_items, { id: crypto.randomUUID(), title: 'عنصر جديد', description: 'اكتب نص العنصر...', active: true }],
      },
    }));
  }

  function removeGuideItem(id: string) {
    setData((current) => ({
      ...current,
      settings: {
        ...current.settings,
        guide_items: current.settings.guide_items.filter((item) => item.id !== id),
      },
    }));
  }

  return (
    <div className="settings-grid">
      <article className="admin-card admin-form">
        <h2>بيانات الكورس والموقع</h2>
        <label>اسم العلامة<input value={settings.brand_name} onChange={(event) => update({ brand_name: event.target.value })} /></label>
        <label>اسم الكورس<input value={settings.course_name} onChange={(event) => update({ course_name: event.target.value })} /></label>
        <label>وصف الكورس<textarea value={settings.course_description} onChange={(event) => update({ course_description: event.target.value })} /></label>
        <div className="two-cols">
          <label>السعر الأساسي<input type="number" value={settings.course_price} onChange={(event) => update({ course_price: Number(event.target.value) })} /></label>
          <label>قيمة الخصم<input type="number" value={settings.course_discount_amount} onChange={(event) => update({ course_discount_amount: Number(event.target.value) })} /></label>
        </div>
        <label>حالة التسجيل<select value={settings.registration_open ? 'open' : 'closed'} onChange={(event) => update({ registration_open: event.target.value === 'open' })}><option value="open">مفتوح</option><option value="closed">مغلق</option></select></label>
        <label>رقم واتساب الإدارة<input dir="ltr" value={settings.whatsapp_number} onChange={(event) => update({ whatsapp_number: formatEgyptWhatsAppNumber(event.target.value) })} /></label>
      </article>

      <article className="admin-card admin-form">
        <h2>الفاتورة والتحقق</h2>
        <label>اسم الشركة في الفاتورة<input value={settings.invoice_company_name} onChange={(event) => update({ invoice_company_name: event.target.value })} /></label>
        <label>عنوان الشركة<textarea value={settings.invoice_address} onChange={(event) => update({ invoice_address: event.target.value })} /></label>
        <label>الرقم الضريبي<input value={settings.invoice_tax_number} onChange={(event) => update({ invoice_tax_number: event.target.value })} /></label>
        <label>رسالة التحقق<textarea value={settings.verification_message} onChange={(event) => update({ verification_message: event.target.value })} /></label>
        <label>رابط إضافي للتحقق<input value={settings.verification_link} onChange={(event) => update({ verification_link: event.target.value })} /></label>
      </article>

      <article className="admin-card admin-form settings-wide">
        <h2>قسم الهداية بعد الكورس</h2>
        <label>عنوان القسم<input value={settings.guide_title} onChange={(event) => update({ guide_title: event.target.value })} /></label>
        <label>وصف القسم<textarea value={settings.guide_intro} onChange={(event) => update({ guide_intro: event.target.value })} /></label>
        {settings.guide_items.map((item, index) => (
          <div className="nested-card" key={item.id}>
            <div className="row-actions" style={{ justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <input type="checkbox" checked={item.active !== false} onChange={(event) => updateGuideItem(item.id, { active: event.target.checked })} />
                <span>إظهار العنصر</span>
              </label>
              <button type="button" className="icon-button" aria-label="حذف العنصر" onClick={() => removeGuideItem(item.id)}><Trash2 aria-hidden="true" /></button>
            </div>
            <label>عنوان العنصر {index + 1}<input value={item.title} onChange={(event) => updateGuideItem(item.id, { title: event.target.value })} /></label>
            <label>النص<textarea value={item.description} onChange={(event) => updateGuideItem(item.id, { description: event.target.value })} /></label>
          </div>
        ))}
        <button type="button" className="secondary-button" onClick={addGuideItem}>
          <Plus aria-hidden="true" /> إضافة عنصر
        </button>
      </article>

      <div className="settings-actions">
        <button className="primary-button" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
          حفظ الإعدادات
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const labels: Record<string, string> = {
    pending: 'قيد المراجعة',
    paid: 'مدفوع',
    rejected: 'مرفوض',
    new: 'جديد',
    reviewing: 'قيد المتابعة',
    accepted: 'مقبول',
  };
  return <span className={`status-badge status-${value}`}>{labels[value] || value}</span>;
}
