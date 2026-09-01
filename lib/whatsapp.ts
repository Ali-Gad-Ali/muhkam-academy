export function normalizeWhatsAppNumber(value: string) {
  const digits = (value || '').replace(/\D/g, '');
  if (!digits) return '';

  let normalized = digits;

  if (normalized.startsWith('00')) {
    normalized = normalized.slice(2);
  }

  if (normalized.startsWith('0') && normalized.length === 10) {
    normalized = `966${normalized.slice(1)}`;
  }

  if (normalized.startsWith('966') || normalized.startsWith('2') || normalized.length >= 11) {
    return normalized;
  }

  return normalized;
}

export function buildWhatsAppUrl(value: string, text?: string) {
  const number = normalizeWhatsAppNumber(value);
  if (!number) return '#';

  const baseUrl = `https://wa.me/${number}`;
  return text ? `${baseUrl}?text=${encodeURIComponent(text)}` : baseUrl;
}
