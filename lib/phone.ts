/** International phone number from the country code given by the API and the number typed by the user. */

/** Digits only, without the national trunk "0" (06 12 34 56 78 → 612345678), except in Italy where the 0 is kept. */
export function localDigits(typed: string, dialCode: string): string {
  const digits = typed.replace(/\D/g, '');
  return dialCode === '+39' ? digits : digits.replace(/^0+/, '');
}

/** "+33612345678"; the number alone when the country has no known code. */
export function fullPhone(dialCode: string, typed: string): string {
  const local = localDigits(typed, dialCode);
  return dialCode ? `${dialCode}${local}` : local;
}
