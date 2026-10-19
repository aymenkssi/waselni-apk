/** Form checks done on the phone before calling the API (the server checks again). Return translation keys. */
import { parseNumber } from './format';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isEmail = (s: string) => EMAIL_RE.test(s.trim());

/** Same rule as the site: 8 to 72 characters (bcrypt limit). */
export function passwordError(pw: string): string | null {
  if (pw.length < 8) return 'err_password_short';
  if (pw.length > 72) return 'err_password_long';
  return null;
}

export const isSiret = (s: string) => /^\d{14}$/.test(s.replace(/\s/g, ''));

export const isTotpCode = (s: string) => /^\d{6}$/.test(s.trim()) || /^[A-Za-z0-9]{8}$/.test(s.trim());

export interface RegisterForm {
  email: string; password: string; confirm: string; first_name: string; last_name: string;
  phone: string; country: string; city: string; accepted: boolean;
}

export function registerErrors(f: RegisterForm): Partial<Record<keyof RegisterForm, string>> {
  const e: Partial<Record<keyof RegisterForm, string>> = {};
  if (!f.first_name.trim()) e.first_name = 'err_required';
  if (!f.last_name.trim()) e.last_name = 'err_required';
  if (!isEmail(f.email)) e.email = 'err_email';
  const pw = passwordError(f.password);
  if (pw) e.password = pw;
  else if (f.password !== f.confirm) e.confirm = 'err_password_mismatch';
  if (f.phone.replace(/\D/g, '').length < 6) e.phone = 'err_phone';
  if (!f.country) e.country = 'err_required';
  if (!f.city.trim()) e.city = 'err_required';
  if (!f.accepted) e.accepted = 'err_terms';
  return e;
}

export interface RouteForm { origin_country: string; origin_city: string; destination_country: string; destination_city: string }

function routeErrors(f: RouteForm) {
  const e: Record<string, string> = {};
  for (const k of ['origin_country', 'origin_city', 'destination_country', 'destination_city'] as const) if (!f[k].trim()) e[k] = 'err_required';
  return e;
}

export interface OfferForm extends RouteForm { departure_date: string; arrival_date: string; capacity_kg: string; price_per_kg: string }

export function offerErrors(f: OfferForm, today: string): Record<string, string> {
  const e = routeErrors(f);
  if (f.departure_date < today) e.departure_date = 'err_date_past';
  if (f.arrival_date < f.departure_date) e.arrival_date = 'err_arrival_before';
  const cap = parseNumber(f.capacity_kg);
  if (cap == null || cap <= 0) e.capacity_kg = 'err_number';
  const price = parseNumber(f.price_per_kg);
  if (price == null || price < 0) e.price_per_kg = 'err_number';
  return e;
}

export interface RequestForm extends RouteForm { weight: string; package_type: string; deadline: string; description: string }

export function requestErrors(f: RequestForm, today: string): Record<string, string> {
  const e = routeErrors(f);
  const w = parseNumber(f.weight);
  if (w == null || w <= 0) e.weight = 'err_number';
  if (!f.package_type) e.package_type = 'err_required';
  if (f.deadline < today) e.deadline = 'err_date_past';
  if (!f.description.trim()) e.description = 'err_required';
  return e;
}
