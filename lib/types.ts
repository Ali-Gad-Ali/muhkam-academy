export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'email'
  | 'phone'
  | 'single_choice'
  | 'yes_no'
  | 'file';

export type QuestionCondition = {
  questionId: string;
  equals: string;
} | null;

export type FormQuestion = {
  id: string;
  system_key?: string | null;
  label: string;
  type: QuestionType;
  required: boolean;
  placeholder?: string | null;
  options: string[];
  position: number;
  active: boolean;
  condition: QuestionCondition;
};

export type SiteSettings = {
  id: string;
  brand_name: string;
  course_name: string;
  course_description: string;
  course_price: number;
  currency: string;
  registration_open: boolean;
  whatsapp_number: string;
  invoice_company_name: string;
  invoice_address: string;
  invoice_tax_number: string;
  verification_message: string;
  verification_link: string;
  logo_url?: string | null;
};

export type ApplicationAnswer = {
  questionId: string;
  label: string;
  type: QuestionType;
  value: string;
  filePath?: string;
};

export type ApplicationRecord = {
  id: string;
  created_at: string;
  applicant_name: string;
  phone: string;
  email: string;
  answers: ApplicationAnswer[];
  status: 'new' | 'reviewing' | 'accepted' | 'rejected';
  payment_status: 'pending' | 'paid' | 'rejected';
  payment_proof_path?: string | null;
  payment_proof_url?: string | null;
};

export type InvoiceRecord = {
  id: string;
  invoice_number: string;
  application_id: string;
  recipient_name: string;
  phone: string;
  amount: number;
  currency: string;
  payment_method: string;
  issued_at: string;
  status: 'issued' | 'void';
  public_token: string;
};

export type PublicFormPayload = {
  settings: SiteSettings;
  questions: FormQuestion[];
  demo?: boolean;
};

export type DashboardPayload = PublicFormPayload & {
  applications: ApplicationRecord[];
  invoices: InvoiceRecord[];
};
