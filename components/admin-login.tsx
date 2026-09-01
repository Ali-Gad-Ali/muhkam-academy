'use client';

import { useState } from 'react';
import { ArrowLeft, Code2, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function AdminLogin() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  async function submit(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await response.json() as { error?: string }; if (!response.ok) throw new Error(data.error || 'تعذر تسجيل الدخول.'); window.location.href = '/admin';
    } catch (loginError) { setError(loginError instanceof Error ? loginError.message : 'تعذر تسجيل الدخول.'); }
    finally { setLoading(false); }
  }
  return <main className="site-shell grid min-h-screen place-items-center px-5 py-12"><div className="aurora aurora-one" /><section className="relative z-10 w-full max-w-md rounded-[28px] border border-white/10 bg-slate-950/70 p-7 shadow-2xl backdrop-blur-xl sm:p-10"><div className="mb-8 flex items-center gap-3"><span className="brand-mark"><Code2 /></span><div><strong className="text-white">MUHKAM</strong><span className="block text-[10px] tracking-[.2em] text-cyan-300/70">ADMIN PORTAL</span></div></div><span className="step-orb mb-5"><LockKeyhole /></span><h1 className="text-3xl font-black text-white">تسجيل دخول الإدارة</h1><p className="mt-2 text-sm leading-6 text-slate-400">لوحة التحكم مخصصة للحساب الإداري المصرح به فقط.</p><form onSubmit={submit} className="mt-8"><FieldGroup><Field><FieldLabel htmlFor="admin-email" className="field-label">البريد الإلكتروني</FieldLabel><Input id="admin-email" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className="premium-input text-left" placeholder="admin@example.com" /></Field><Field><FieldLabel htmlFor="admin-password" className="field-label">كلمة المرور</FieldLabel><Input id="admin-password" type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} className="premium-input text-left" /></Field>{error && <p className="rounded-xl border border-red-400/20 bg-red-400/8 px-4 py-3 text-sm text-red-200">{error}</p>}<Button className="submit-button mt-2 h-12 w-full">{loading ? <Loader2 className="animate-spin" /> : <ShieldCheck />} دخول آمن <ArrowLeft /></Button></FieldGroup></form>{!process.env.NEXT_PUBLIC_SUPABASE_URL && <p className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/5 p-3 text-xs leading-5 text-amber-100/80">وضع المعاينة المحلي مفعل: يمكنك الضغط على دخول آمن دون بيانات.</p>}</section></main>;
}
