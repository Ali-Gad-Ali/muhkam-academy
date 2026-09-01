import type { NextRequest } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => Boolean(supabaseUrl && serviceKey && anonKey);
export const isLocalDemo = () => !isSupabaseConfigured() && process.env.NODE_ENV !== 'production';

export async function supabaseRest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!supabaseUrl || !serviceKey) throw new Error('Supabase is not configured');
  const headers = new Headers(init.headers);
  headers.set('apikey', serviceKey);
  headers.set('Authorization', `Bearer ${serviceKey}`);
  headers.set('Content-Type', 'application/json');
  headers.set('Prefer', headers.get('Prefer') || 'return=representation');
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Supabase request failed (${response.status}): ${await response.text()}`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function validateAdminToken(token: string | undefined | null) {
  if (isLocalDemo()) return { id: 'local-admin', email: 'admin@muhkam.local' };
  if (!token || !supabaseUrl || !anonKey) return null;
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const user = (await response.json()) as { id: string; email?: string };
  const allowedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (allowedEmail && user.email?.toLowerCase() !== allowedEmail) return null;
  return { id: user.id, email: user.email || '' };
}

export async function requireAdmin(request: NextRequest) {
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const cookie = request.cookies.get('mh_admin_session')?.value;
  return validateAdminToken(bearer || cookie);
}

export async function uploadPrivateFile(path: string, file: File) {
  if (!supabaseUrl || !serviceKey) throw new Error('Supabase is not configured');
  const response = await fetch(`${supabaseUrl}/storage/v1/object/payment-proofs/${path}`, {
    method: 'POST',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': file.type, 'x-upsert': 'false' },
    body: file,
  });
  if (!response.ok) throw new Error(`File upload failed (${response.status})`);
  return path;
}

export async function createSignedProofUrl(path: string) {
  if (!supabaseUrl || !serviceKey || !path) return null;
  const response = await fetch(`${supabaseUrl}/storage/v1/object/sign/payment-proofs/${path}`, {
    method: 'POST',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn: 900 }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { signedURL?: string; signedUrl?: string };
  const signed = data.signedURL || data.signedUrl;
  return signed ? `${supabaseUrl}/storage/v1${signed}` : null;
}

export async function hashClientIp(request: NextRequest) {
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const salt = process.env.RATE_LIMIT_SALT || 'muhkam-local-only';
  const bytes = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
