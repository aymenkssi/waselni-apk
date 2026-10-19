import { CarrierType, Role } from './types';

const CARRIER_ROLES: Role[] = ['CARRIER_INDIVIDUAL', 'CARRIER_PRO', 'SHIPPER_CARRIER'];
const SHIPPER_ROLES: Role[] = ['SHIPPER', 'SHIPPER_CARRIER', 'ADMIN'];

type Who = { role?: Role; carrier_type?: CarrierType | null } | null | undefined;

/** Can publish trips and must have their identity verified. */
export const isCarrier = (u: Who) => !!u && (CARRIER_ROLES.includes(u.role!) || u.role === 'ADMIN');
/** Can publish shipping requests. */
export const isShipper = (u: Who) => !!u && SHIPPER_ROLES.includes(u.role!);
/** Professional carrier: CARRIER_PRO, or shipper + professional carrier (same rule as the server). */
export const isProCarrier = (u: Who) => !!u && (u.role === 'CARRIER_PRO' || (u.role === 'SHIPPER_CARRIER' && u.carrier_type === 'pro'));
/** Has to go through the identity verification (admins do not). */
export const needsIdentityCheck = (u: Who) => !!u && CARRIER_ROLES.includes(u.role!);

/** Translation key of the account type shown to the user. */
export function roleKey(u: Who): string {
  if (!u?.role) return 'role_SHIPPER';
  if (u.role === 'SHIPPER_CARRIER') return u.carrier_type === 'pro' ? 'role_SHIPPER_CARRIER_PRO' : 'role_SHIPPER_CARRIER';
  return `role_${u.role}`;
}
