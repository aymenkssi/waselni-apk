import { isCarrier, isProCarrier, isShipper, needsIdentityCheck, roleKey } from '../lib/roles';

describe('roles', () => {
  it('matches the server rules for professional carriers', () => {
    expect(isProCarrier({ role: 'CARRIER_PRO' })).toBe(true);
    expect(isProCarrier({ role: 'SHIPPER_CARRIER', carrier_type: 'pro' })).toBe(true);
    expect(isProCarrier({ role: 'SHIPPER_CARRIER', carrier_type: 'individual' })).toBe(false);
    expect(isProCarrier({ role: 'CARRIER_INDIVIDUAL' })).toBe(false);
  });

  it('knows who can post what', () => {
    expect(isShipper({ role: 'SHIPPER' })).toBe(true);
    expect(isShipper({ role: 'CARRIER_PRO' })).toBe(false);
    expect(isCarrier({ role: 'SHIPPER_CARRIER' })).toBe(true);
    expect(isCarrier({ role: 'SHIPPER' })).toBe(false);
    expect(needsIdentityCheck({ role: 'ADMIN' })).toBe(false);
    expect(needsIdentityCheck({ role: 'CARRIER_INDIVIDUAL' })).toBe(true);
  });

  it('labels the account type', () => {
    expect(roleKey({ role: 'SHIPPER_CARRIER', carrier_type: 'pro' })).toBe('role_SHIPPER_CARRIER_PRO');
    expect(roleKey({ role: 'CARRIER_PRO' })).toBe('role_CARRIER_PRO');
    expect(roleKey(null)).toBe('role_SHIPPER');
  });
});
