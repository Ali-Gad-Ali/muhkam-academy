export function formatEgyptWhatsAppNumber(value: string) {
  const digits = (value || '').replace(/\D/g, '');
  if (!digits) return '';

  const cleaned = digits.startsWith('00') ? digits.slice(2) : digits;

  if (cleaned.startsWith('2')) return `+${cleaned}`;
  if (cleaned.startsWith('0')) return `+2${cleaned.slice(1)}`;
  if (cleaned.length === 10) return `+2${cleaned}`;
  return `+${cleaned}`;
}

export function formatPhoneForStorage(value: string) {
  return formatEgyptWhatsAppNumber(value);
}

export function normalizeWhatsAppNumber(value: string) {
  const formatted = formatEgyptWhatsAppNumber(value);
  const digits = formatted.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('2')) return digits;
  if (digits.startsWith('0')) return `2${digits.slice(1)}`;
  return digits;
}

export function buildWhatsAppUrl(value: string, text?: string) {
  const number = normalizeWhatsAppNumber(value);
  if (!number) return '#';

  const baseUrl = `https://wa.me/${number}`;
  return text ? `${baseUrl}?text=${encodeURIComponent(text)}` : baseUrl;
}
