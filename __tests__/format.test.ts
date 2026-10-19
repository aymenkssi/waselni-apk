import { addDays, averageRating, formatDate, formatPrice, fullName, initials, parseNumber, toIsoDate } from '../lib/format';
import { foldText } from '../lib/text';

describe('format', () => {
  it('formats dates without Intl', () => {
    expect(formatDate('2027-03-12T00:00:00', 'fr')).toBe('12 mars 2027');
    expect(formatDate('2027-03-12', 'en')).toBe('Mar 12, 2027');
    expect(formatDate('2027-08-01', 'ar')).toBe('1 أغسطس 2027');
    expect(formatDate(null, 'fr')).toBe('—');
  });

  it('adds days across months', () => {
    expect(addDays('2027-01-30', 3)).toBe('2027-02-02');
    expect(toIsoDate(new Date(2027, 11, 31))).toBe('2027-12-31');
  });

  it('formats prices per language', () => {
    expect(formatPrice(12.5, 'fr')).toBe('12,50 €');
    expect(formatPrice(8, 'en')).toBe('€8');
    expect(formatPrice(undefined, 'fr')).toBe('—');
  });

  it('parses numbers typed with a comma', () => {
    expect(parseNumber('12,5')).toBe(12.5);
    expect(parseNumber(' 3 ')).toBe(3);
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('-2')).toBeNull();
  });

  it('computes the average rating', () => {
    expect(averageRating({ rating_sum: 14, rating_count: 3 })).toBe(4.7);
    expect(averageRating({ rating_sum: 0, rating_count: 0 })).toBeNull();
  });

  it('builds names and initials', () => {
    expect(fullName({ first_name: 'Amina', last_name: 'B.' })).toBe('Amina B.');
    expect(fullName(null)).toBe('—');
    expect(initials({ first_name: 'amina', last_name: 'ben' })).toBe('AB');
  });

  it('folds accents for searches', () => {
    expect(foldText('Égypte')).toBe('egypte');
    expect(foldText('Côte d’Ivoire')).toContain('cote');
    expect(foldText('الإمارات')).toBe('الامارات');
  });
});
