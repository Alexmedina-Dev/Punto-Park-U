// ╔══════════════════════════════════════════════════════════════════════╗
// ║  Formatters — currency, date, phone, and display helpers            ║
// ╚══════════════════════════════════════════════════════════════════════╝

// ── Currency ──────────────────────────────────────────────────────────

const CURRENCY_LOCALE = 'es-CO';
const CURRENCY_OPTIONS: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE, CURRENCY_OPTIONS).format(amount);
}

export function formatAmount(amount?: number | null, fallback = '—'): string {
  if (amount == null) return fallback;
  return `$${amount.toLocaleString(CURRENCY_LOCALE)}`;
}

// ── Date ──────────────────────────────────────────────────────────────

export function formatDate(
  dateStr: string,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(CURRENCY_LOCALE, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      ...options,
    });
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(CURRENCY_LOCALE, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(CURRENCY_LOCALE, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(CURRENCY_LOCALE, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

// ── Phone ─────────────────────────────────────────────────────────────

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 7) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  return phone;
}

// ── Reference ─────────────────────────────────────────────────────────

export function formatReference(ref: string): string {
  // ePayco ref: show last 8 chars grouped
  const clean = ref.replace(/\s/g, '');
  const short = clean.slice(-8);
  return short.match(/.{1,4}/g)?.join(' ') ?? short;
}

export function maskCardNumber(card: string): string {
  const digits = card.replace(/\D/g, '');
  if (digits.length < 8) return `****${digits.slice(-4)}`;
  return `**** **** **** ${digits.slice(-4)}`;
}

// ── Duration ──────────────────────────────────────────────────────────

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

// ── Truncate ──────────────────────────────────────────────────────────

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
