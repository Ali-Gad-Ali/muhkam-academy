create extension if not exists pgcrypto;

create table if not exists public.site_settings (
  id text primary key default 'main',
  brand_name text not null default 'Muhkam Academy',
  course_name text not null default 'Full Stack Web Development',
  course_description text not null default '',
  course_price numeric(12,2) not null default 2500,
  currency text not null default 'EGP',
  registration_open boolean not null default true,
  whatsapp_number text not null default '',
  invoice_company_name text not null default 'Muhkam Academy',
  invoice_address text not null default '',
  invoice_tax_number text not null default '',
  verification_message text not null default '',
  verification_link text not null default '',
  logo_url text,
  updated_at timestamptz not null default now()
);

alter table public.site_settings
  add column if not exists course_discount_amount numeric(12,2) not null default 0,
  add column if not exists guide_title text not null default 'هداية بعد إكمال الكورس',
  add column if not exists guide_intro text not null default 'بمجرد إنهاء الكورس، ستتلقى هذه المزايا القيمة لتبدأ رحلتك المهنية بثقة.',
  add column if not exists guide_items jsonb not null default '[]'::jsonb;

create table if not exists public.form_questions (
  id uuid primary key default gen_random_uuid(),
  system_key text,
  label text not null,
  type text not null check (type in ('short_text','long_text','email','phone','single_choice','yes_no','file')),
  required boolean not null default false,
  placeholder text,
  options jsonb not null default '[]'::jsonb,
  position integer not null default 0,
  active boolean not null default true,
  condition jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  applicant_name text not null default '',
  phone text not null default '',
  email text not null default '',
  answers jsonb not null default '[]'::jsonb,
  status text not null default 'new' check (status in ('new','reviewing','accepted','rejected')),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','rejected')),
  payment_proof_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  application_id uuid not null references public.applications(id) on delete restrict,
  recipient_name text not null,
  phone text not null default '',
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'EGP',
  payment_method text not null default '',
  issued_at timestamptz not null default now(),
  status text not null default 'issued' check (status in ('issued','void')),
  public_token uuid not null default gen_random_uuid() unique
);

create table if not exists public.submission_guard (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists applications_created_at_idx on public.applications(created_at desc);
create index if not exists applications_payment_status_idx on public.applications(payment_status);
create index if not exists invoices_public_token_idx on public.invoices(public_token);
create index if not exists submission_guard_lookup_idx on public.submission_guard(ip_hash, created_at desc);

alter table public.site_settings enable row level security;
alter table public.form_questions enable row level security;
alter table public.applications enable row level security;
alter table public.invoices enable row level security;
alter table public.submission_guard enable row level security;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do update set public = false;

insert into public.site_settings (id) values ('main') on conflict (id) do nothing;

insert into public.form_questions (system_key,label,type,required,placeholder,options,position,condition)
select * from (values
  ('full_name','الاسم بالكامل','short_text',true,'اكتب اسمك الثلاثي','[]'::jsonb,1,null::jsonb),
  ('phone','رقم الهاتف','phone',true,'01xxxxxxxxx','[]'::jsonb,2,null::jsonb),
  ('email','البريد الإلكتروني','email',true,'name@example.com','[]'::jsonb,3,null::jsonb),
  ('graduation_status','هل أنت متخرج؟','single_choice',true,null,'["متخرج","طالب"]'::jsonb,4,null::jsonb),
  ('qualification','المؤهل الدراسي','short_text',true,'الكلية أو المعهد والتخصص','[]'::jsonb,5,null::jsonb),
  ('payment_method','طريقة الدفع','single_choice',true,null,'["أونلاين","أوفلاين"]'::jsonb,6,null::jsonb)
) as seed(system_key,label,type,required,placeholder,options,position,condition)
where not exists (select 1 from public.form_questions);

insert into public.form_questions (system_key,label,type,required,options,position,condition)
select 'payment_proof','صورة إثبات الدفع','file',true,'[]'::jsonb,7,
  jsonb_build_object('questionId', (select id::text from public.form_questions where system_key='payment_method' limit 1), 'equals','أونلاين')
where not exists (select 1 from public.form_questions where system_key='payment_proof');
