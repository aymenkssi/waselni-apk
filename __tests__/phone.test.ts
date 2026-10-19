import { fullPhone, localDigits } from '../lib/phone';

describe('phone', () => {
  it('joins the country code and the typed number', () => {
    expect(fullPhone('+33', '06 12 34 56 78')).toBe('+33612345678');
    expect(fullPhone('+216', '20 123 456')).toBe('+21620123456');
    expect(fullPhone('+212', '0612-345678')).toBe('+212612345678');
  });

  it('keeps the leading 0 in Italy and works without a known code', () => {
    expect(fullPhone('+39', '06 1234 5678')).toBe('+390612345678');
    expect(fullPhone('', '0612345678')).toBe('612345678');
    expect(localDigits('06 12', '+33')).toBe('612');
  });
});
