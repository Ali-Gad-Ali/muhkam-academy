'use client';

import { useState } from 'react';
import { ArrowLeft, Code2, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || 'تعذر تسجيل الدخول.');
      window.location.href = '/admin';
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'تعذر تسجيل الدخول.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="public-page login-page">
      <section className="auth-card">
        <div className="brand auth-brand">
          <span className="brand-icon"><Code2 aria-hidden="true" /></span>
          <span>
            <strong>MUHKAM</strong>
            <small>Admin portal</small>
          </span>
        </div>
        <span className="auth-icon"><LockKeyhole aria-hidden="true" /></span>
        <h1>تسجيل دخول الإدارة</h1>
        <p>لوحة التحكم مخصصة للحساب الإداري المصرح به فقط.</p>

        <form className="auth-form" onSubmit={submit}>
          <label>
            البريد الإلكتروني
            <input type="email" dir="ltr" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" />
          </label>
          <label>
            كلمة المرور
            <input type="password" dir="ltr" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error ? <p className="form-alert">{error}</p> : null}
          <button className="primary-button submit-wide" disabled={loading}>
            {loading ? <Loader2 className="spin" aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
            دخول آمن
            <ArrowLeft aria-hidden="true" />
          </button>
        </form>

        {!process.env.NEXT_PUBLIC_SUPABASE_URL ? <p className="demo-note">وضع المعاينة المحلي مفعل: يمكنك الضغط على دخول آمن دون بيانات.</p> : null}
      </section>
    </main>
  );
}
