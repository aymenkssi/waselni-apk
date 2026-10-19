import { fileUrl, toUploadFile } from '../lib/files';
import { isSiret, isTotpCode, offerErrors, passwordError, registerErrors, requestErrors } from '../lib/validation';

const okRegister = { email: 'a@b.fr', password: 'secret123', confirm: 'secret123', first_name: 'A', last_name: 'B', phone: '+33 6 12 34 56 78', country: 'France', city: 'Lyon', accepted: true };
const route = { origin_country: 'France', origin_city: 'Paris', destination_country: 'Tunisie', destination_city: 'Tunis' };

describe('validation', () => {
  it('checks the registration form like the server', () => {
    expect(registerErrors(okRegister)).toEqual({});
    expect(registerErrors({ ...okRegister, password: 'short', confirm: 'short' }).password).toBe('err_password_short');
    expect(registerErrors({ ...okRegister, confirm: 'other123' }).confirm).toBe('err_password_mismatch');
    expect(registerErrors({ ...okRegister, accepted: false }).accepted).toBe('err_terms');
    expect(passwordError('x'.repeat(73))).toBe('err_password_long');
  });

  it('checks trips', () => {
    const f = { ...route, departure_date: '2027-01-10', arrival_date: '2027-01-12', capacity_kg: '20', price_per_kg: '8,5' };
    expect(offerErrors(f, '2027-01-01')).toEqual({});
    expect(offerErrors({ ...f, arrival_date: '2027-01-09' }, '2027-01-01').arrival_date).toBe('err_arrival_before');
    expect(offerErrors(f, '2027-01-11').departure_date).toBe('err_date_past');
    expect(offerErrors({ ...f, capacity_kg: '0' }, '2027-01-01').capacity_kg).toBe('err_number');
  });

  it('checks shipping requests', () => {
    const f = { ...route, weight: '3', package_type: 'clothes', deadline: '2027-02-01', description: 'Vêtements' };
    expect(requestErrors(f, '2027-01-01')).toEqual({});
    expect(requestErrors({ ...f, destination_city: ' ' }, '2027-01-01').destination_city).toBe('err_required');
    expect(requestErrors({ ...f, package_type: '' }, '2027-01-01').package_type).toBe('err_required');
  });

  it('checks SIRET numbers and 2FA codes', () => {
    expect(isSiret('732 829 320 00074')).toBe(true);
    expect(isSiret('1234')).toBe(false);
    expect(isTotpCode('123456')).toBe(true);
    expect(isTotpCode('AB12CD34')).toBe(true);
    expect(isTotpCode('12345')).toBe(false);
  });
});

describe('files', () => {
  it('names picked files with an extension the server accepts', () => {
    expect(toUploadFile('file:///cache/IMG_1.JPG', null, 'image/jpeg')).toEqual({ uri: 'file:///cache/IMG_1.JPG', name: 'IMG_1.JPG', type: 'image/jpeg' });
    expect(toUploadFile('content://media/42', 'scan', 'application/pdf')).toEqual({ uri: 'content://media/42', name: 'scan.pdf', type: 'application/pdf' });
    expect(toUploadFile('file:///x/photo.heic', 'photo.heic', null).type).toBe('image/heic');
  });

  it('builds absolute upload URLs', () => {
    expect(fileUrl('https://waselni.fr', '/api/uploads/avatar_1.jpg')).toBe('https://waselni.fr/api/uploads/avatar_1.jpg');
    expect(fileUrl('https://waselni.fr', 'https://cdn/x.png')).toBe('https://cdn/x.png');
    expect(fileUrl('https://waselni.fr', null)).toBeNull();
  });
});
