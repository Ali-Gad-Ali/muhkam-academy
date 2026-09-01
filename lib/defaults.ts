import type { ApplicationRecord, FormQuestion, InvoiceRecord, SiteSettings } from '@/lib/types';

export const defaultSettings: SiteSettings = {
  id: 'main',
  brand_name: 'Muhkam Academy',
  course_name: 'Full Stack Web Development',
  course_description: 'برنامج تدريبي عملي يأخذك من الأساسيات إلى بناء مشاريع حقيقية جاهزة لسوق العمل.',
  course_price: 2500,
  course_discount_amount: 0,
  currency: 'EGP',
  registration_open: true,
  whatsapp_number: '201000000000',
  invoice_company_name: 'Muhkam Academy',
  invoice_address: 'القاهرة، جمهورية مصر العربية',
  invoice_tax_number: '',
  verification_message: 'هذه الفاتورة صادرة إلكترونيًا من Muhkam Academy.',
  verification_link: '',
  guide_title: 'هداية بعد إكمال الكورس',
  guide_intro: 'بمجرد إنهاء الكورس، ستتلقى هذه المزايا القيمة لتبدأ رحلتك المهنية بثقة.',
  guide_items: [
    { id: 'prompt-master', title: 'حساب Prompt Master', description: '1- اكونت برومبت ماستر\n2- باكدج عباره عن cv + لينكدان + كفر ليتر\n3- اشتراك ب 1000 جنية علي موقع برومبت ماستر\n4- اكونت جيمناي مدفوع مجاني مع الكورس', active: true },
    { id: 'cv', title: 'بريدك المهني', description: 'تجهيز سيرة ذاتية احترافية، ملف LinkedIn، وكفر ليتير جاهز للتقديم.', active: true },
    { id: 'gpt', title: 'مزايا إضافية', description: 'دعم فني لأسئلة المشروع، جلسات متابعة، وتوجيه في بناء مسارك المهني.', active: true },
  ],
  logo_url: null,
};

export const defaultQuestions: FormQuestion[] = [
  { id: 'full-name', system_key: 'full_name', label: 'الاسم بالكامل', type: 'short_text', required: true, placeholder: 'اكتب اسمك الثلاثي', options: [], position: 1, active: true, condition: null },
  { id: 'phone', system_key: 'phone', label: 'رقم الهاتف', type: 'phone', required: true, placeholder: '01xxxxxxxxx', options: [], position: 2, active: true, condition: null },
  { id: 'email', system_key: 'email', label: 'البريد الإلكتروني', type: 'email', required: true, placeholder: 'name@example.com', options: [], position: 3, active: true, condition: null },
  { id: 'graduation', system_key: 'graduation_status', label: 'هل أنت متخرج؟', type: 'single_choice', required: true, placeholder: null, options: ['متخرج', 'طالب'], position: 4, active: true, condition: null },
  { id: 'qualification', system_key: 'qualification', label: 'المؤهل الدراسي', type: 'short_text', required: true, placeholder: 'الكلية أو المعهد والتخصص', options: [], position: 5, active: true, condition: null },
  { id: 'payment-method', system_key: 'payment_method', label: 'طريقة الدفع', type: 'single_choice', required: true, placeholder: null, options: ['أونلاين', 'أوفلاين'], position: 6, active: true, condition: null },
  { id: 'payment-proof', system_key: 'payment_proof', label: 'صورة إثبات الدفع', type: 'file', required: true, placeholder: null, options: [], position: 7, active: true, condition: { questionId: 'payment-method', equals: 'أونلاين' } },
];

export const demoApplications: ApplicationRecord[] = [
  {
    id: 'app-demo-1', created_at: new Date(Date.now() - 32 * 60 * 1000).toISOString(), applicant_name: 'أحمد محمد علي', phone: '201012345678', email: 'ahmed@example.com', status: 'reviewing', payment_status: 'pending', payment_proof_path: null,
    answers: [
      { questionId: 'full-name', label: 'الاسم بالكامل', type: 'short_text', value: 'أحمد محمد علي' },
      { questionId: 'phone', label: 'رقم الهاتف', type: 'phone', value: '201012345678' },
      { questionId: 'email', label: 'البريد الإلكتروني', type: 'email', value: 'ahmed@example.com' },
      { questionId: 'graduation', label: 'هل أنت متخرج؟', type: 'single_choice', value: 'متخرج' },
      { questionId: 'qualification', label: 'المؤهل الدراسي', type: 'short_text', value: 'حاسبات ومعلومات' },
      { questionId: 'payment-method', label: 'طريقة الدفع', type: 'single_choice', value: 'أونلاين' },
    ],
  },
  {
    id: 'app-demo-2', created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), applicant_name: 'سارة محمود', phone: '201098765432', email: 'sara@example.com', status: 'accepted', payment_status: 'paid', payment_proof_path: null,
    answers: [
      { questionId: 'full-name', label: 'الاسم بالكامل', type: 'short_text', value: 'سارة محمود' },
      { questionId: 'phone', label: 'رقم الهاتف', type: 'phone', value: '201098765432' },
      { questionId: 'email', label: 'البريد الإلكتروني', type: 'email', value: 'sara@example.com' },
      { questionId: 'graduation', label: 'هل أنت متخرج؟', type: 'single_choice', value: 'طالب' },
      { questionId: 'qualification', label: 'المؤهل الدراسي', type: 'short_text', value: 'كلية الهندسة' },
      { questionId: 'payment-method', label: 'طريقة الدفع', type: 'single_choice', value: 'أوفلاين' },
    ],
  },
];

export const demoInvoices: InvoiceRecord[] = [];

export function normalizeSiteSettings(settings?: Partial<SiteSettings> | null): SiteSettings {
  const guideItems = Array.isArray(settings?.guide_items) && settings.guide_items.length
    ? settings.guide_items.map((item) => ({
        id: item.id || crypto.randomUUID(),
        title: item.title || 'عنصر جديد',
        description: item.description || '',
        active: item.active !== false,
      }))
    : defaultSettings.guide_items.map((item) => ({ ...item, active: item.active !== false }));

  return {
    ...defaultSettings,
    ...settings,
    course_price: Number(settings?.course_price ?? defaultSettings.course_price),
    course_discount_amount: Number(settings?.course_discount_amount ?? defaultSettings.course_discount_amount),
    registration_open: settings?.registration_open ?? defaultSettings.registration_open,
    guide_title: settings?.guide_title || defaultSettings.guide_title,
    guide_intro: settings?.guide_intro || defaultSettings.guide_intro,
    guide_items: guideItems,
  };
}

export function siteSettingsPayload(settings: SiteSettings) {
  return {
    brand_name: settings.brand_name,
    course_name: settings.course_name,
    course_description: settings.course_description,
    course_price: settings.course_price,
    course_discount_amount: settings.course_discount_amount,
    currency: settings.currency,
    registration_open: settings.registration_open,
    whatsapp_number: settings.whatsapp_number,
    invoice_company_name: settings.invoice_company_name,
    invoice_address: settings.invoice_address,
    invoice_tax_number: settings.invoice_tax_number,
    verification_message: settings.verification_message,
    verification_link: settings.verification_link,
    guide_title: settings.guide_title,
    guide_intro: settings.guide_intro,
    guide_items: settings.guide_items,
    logo_url: settings.logo_url,
    updated_at: new Date().toISOString(),
  };
}

export function legacySiteSettingsPayload(settings: SiteSettings) {
  return {
    brand_name: settings.brand_name,
    course_name: settings.course_name,
    course_description: settings.course_description,
    course_price: settings.course_price,
    currency: settings.currency,
    registration_open: settings.registration_open,
    whatsapp_number: settings.whatsapp_number,
    invoice_company_name: settings.invoice_company_name,
    invoice_address: settings.invoice_address,
    invoice_tax_number: settings.invoice_tax_number,
    verification_message: settings.verification_message,
    verification_link: settings.verification_link,
    logo_url: settings.logo_url,
    updated_at: new Date().toISOString(),
  };
}
