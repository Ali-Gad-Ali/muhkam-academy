import { NextRequest, NextResponse } from 'next/server';

import { defaultQuestions } from '@/lib/defaults';
import { hashClientIp, isSupabaseConfigured, supabaseRest, uploadPrivateFile } from '@/lib/supabase-server';
import type { ApplicationAnswer, FormQuestion } from '@/lib/types';

const acceptedFiles = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

function isVisible(question: FormQuestion, values: Record<string, string>) {
  return !question.condition || values[question.condition.questionId] === question.condition.equals;
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured() && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'التقديم غير متاح حتى يكتمل ربط قاعدة البيانات.' }, { status: 503 });
  }
  try {
    const formData = await request.formData();
    const honeypot = formData.get('company_website');
    if (typeof honeypot === 'string' && honeypot) return NextResponse.json({ ok: true });
    const answersEntry = formData.get('answers');
    const rawAnswers = JSON.parse(typeof answersEntry === 'string' ? answersEntry : '{}') as Record<string, string>;
    const questions = isSupabaseConfigured()
      ? await supabaseRest<FormQuestion[]>('form_questions?active=eq.true&order=position.asc')
      : defaultQuestions;

    for (const question of questions) {
      if (!isVisible(question, rawAnswers)) continue;
      const file = formData.get(`file_${question.id}`);
      if (question.required && question.type === 'file' && !(file instanceof File && file.size > 0)) {
        return NextResponse.json({ error: `الحقل «${question.label}» مطلوب.` }, { status: 400 });
      }
      if (question.required && question.type !== 'file' && !String(rawAnswers[question.id] || '').trim()) {
        return NextResponse.json({ error: `الحقل «${question.label}» مطلوب.` }, { status: 400 });
      }
      if (question.type === 'email' && rawAnswers[question.id] && !/^\S+@\S+\.\S+$/.test(rawAnswers[question.id])) {
        return NextResponse.json({ error: 'صيغة البريد الإلكتروني غير صحيحة.' }, { status: 400 });
      }
    }

    const applicationId = crypto.randomUUID();
    let paymentProofPath: string | null = null;
    const answers: ApplicationAnswer[] = [];

    for (const question of questions) {
      if (!isVisible(question, rawAnswers)) continue;
      if (question.type === 'file') {
        const file = formData.get(`file_${question.id}`);
        if (file instanceof File && file.size) {
          if (file.size > 5 * 1024 * 1024 || !acceptedFiles.has(file.type)) {
            return NextResponse.json({ error: 'إثبات الدفع يجب أن يكون صورة أو PDF وبحجم لا يتجاوز 5MB.' }, { status: 400 });
          }
          const ext = file.type === 'application/pdf' ? 'pdf' : file.type.split('/')[1]?.replace('jpeg', 'jpg') || 'bin';
          const path = `${applicationId}/${question.id}.${ext}`;
          if (isSupabaseConfigured()) await uploadPrivateFile(path, file);
          paymentProofPath ||= path;
          answers.push({ questionId: question.id, label: question.label, type: question.type, value: file.name, filePath: path });
        }
      } else {
        answers.push({ questionId: question.id, label: question.label, type: question.type, value: String(rawAnswers[question.id] || '').trim() });
      }
    }

    if (!isSupabaseConfigured()) return NextResponse.json({ ok: true, id: applicationId, demo: true });

    const ipHash = await hashClientIp(request);
    const since = encodeURIComponent(new Date(Date.now() - 60 * 60 * 1000).toISOString());
    const recent = await supabaseRest<Array<{ id: number }>>(`submission_guard?ip_hash=eq.${ipHash}&created_at=gte.${since}&select=id`);
    if (recent.length >= 5) return NextResponse.json({ error: 'تم إرسال عدة طلبات مؤخرًا. حاول مرة أخرى بعد قليل.' }, { status: 429 });
    await supabaseRest('submission_guard', { method: 'POST', body: JSON.stringify({ ip_hash: ipHash }) });

    const answerFor = (key: string) => {
      const question = questions.find((item) => item.system_key === key);
      return question ? String(rawAnswers[question.id] || '').trim() : '';
    };
    await supabaseRest('applications', {
      method: 'POST',
      body: JSON.stringify({
        id: applicationId,
        applicant_name: answerFor('full_name'),
        phone: answerFor('phone'),
        email: answerFor('email'),
        answers,
        status: 'new',
        payment_status: 'pending',
        payment_proof_path: paymentProofPath,
      }),
    });
    return NextResponse.json({ ok: true, id: applicationId });
  } catch {
    return NextResponse.json({ error: 'تعذر إرسال الطلب. راجع البيانات وحاول مرة أخرى.' }, { status: 500 });
  }
}
