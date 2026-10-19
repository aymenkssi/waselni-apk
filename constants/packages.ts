/** Parcel types offered by the site (NewRequest.js). The label in the user's language is what the server stores. */
export const PACKAGE_TYPES = ['clothes', 'documents', 'electronics', 'food', 'cosmetics', 'medicine', 'gifts', 'other'] as const;
export type PackageType = (typeof PACKAGE_TYPES)[number];
