/** Formatting helpers that do not depend on Intl (not fully available on Hermes). */
import { Language, PublicUser } from './types';

const MONTHS: Record<Language, string[]> = {
  fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

const pad = (n: number) => String(n).padStart(2, '0');

/** "12 mars 2027" / "Mar 12, 2027" from an ISO date or date-time (calendar day as written by the server). */
export function formatDate(iso: string | null | undefined, lang: Language): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!m) return '—';
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const name = MONTHS[lang][mo - 1] ?? '';
  return lang === 'en' ? `${name} ${d}, ${y}` : `${d} ${name} ${y}`;
}

/** Date and local time of a server timestamp, e.g. for messages: "12 mars 2027 · 14:05". */
export function formatDateTime(iso: string | null | undefined, lang: Language): string {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '—';
  return `${formatDate(toIsoDate(d), lang)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Local time only ("14:05"), for messages sent today. */
export function formatTime(iso: string | null | undefined): string {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '';
}

/** YYYY-MM-DD in local time. */
export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(iso: string, days: number): string {
  const d = parseIsoDate(iso);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

/** "12,50 €" in French and Arabic, "€12.50" in English. */
export function formatPrice(value: number | null | undefined, lang: Language): string {
  if (value == null || Number.isNaN(value)) return '—';
  const s = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return lang === 'en' ? `€${s}` : `${s.replace('.', ',')} €`;
}

/** Parses a number typed with a comma or a dot; null when invalid. */
export function parseNumber(text: string): number | null {
  const t = text.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
}

/** Average rating rounded to one decimal, or null without reviews. */
export function averageRating(u: Pick<PublicUser, 'rating_sum' | 'rating_count'> | null | undefined): number | null {
  if (!u?.rating_count) return null;
  return Math.round(((u.rating_sum ?? 0) / u.rating_count) * 10) / 10;
}

export function fullName(u: PublicUser | null | undefined): string {
  return [u?.first_name, u?.last_name].filter(Boolean).join(' ').trim() || '—';
}

export function initials(u: PublicUser | null | undefined): string {
  return `${u?.first_name?.[0] ?? ''}${u?.last_name?.[0] ?? ''}`.toUpperCase() || '?';
}
