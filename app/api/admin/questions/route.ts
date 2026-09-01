import { NextRequest, NextResponse } from 'next/server';

import { isLocalDemo, requireAdmin, supabaseRest } from '@/lib/supabase-server';
import type { FormQuestion } from '@/lib/types';

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const question = (await request.json()) as FormQuestion;
  const payload = { ...question, id: undefined, system_key: null };
  if (isLocalDemo()) return NextResponse.json({ ...payload, id: crypto.randomUUID(), demo: true });
  const [saved] = await supabaseRest<FormQuestion[]>('form_questions', { method: 'POST', body: JSON.stringify(payload) });
  return NextResponse.json(saved);
}

export async function PUT(request: NextRequest) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const questions = (await request.json()) as FormQuestion[];
  if (isLocalDemo()) return NextResponse.json({ questions, demo: true });
  const saved = await Promise.all(questions.map(async (question) => {
    const [row] = await supabaseRest<FormQuestion[]>(`form_questions?id=eq.${question.id}`, { method: 'PATCH', body: JSON.stringify({ label: question.label, type: question.type, required: question.required, placeholder: question.placeholder, options: question.options, position: question.position, active: question.active, condition: question.condition, updated_at: new Date().toISOString() }) });
    return row;
  }));
  return NextResponse.json({ questions: saved });
}

export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'السؤال غير محدد' }, { status: 400 });
  if (isLocalDemo()) return NextResponse.json({ ok: true, demo: true });
  await supabaseRest(`form_questions?id=eq.${id}`, { method: 'DELETE' });
  const dependents = await supabaseRest<FormQuestion[]>('form_questions?select=*');
  await Promise.all(dependents.filter((q) => q.condition?.questionId === id).map((q) => supabaseRest(`form_questions?id=eq.${q.id}`, { method: 'PATCH', body: JSON.stringify({ condition: null }) })));
  return NextResponse.json({ ok: true });
}
