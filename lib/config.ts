import Constants from 'expo-constants';

/** Public site; the API lives under /api. Overridable with `expo.extra.siteUrl` in app.json (e.g. a test server). */
export const SITE_URL: string = ((Constants.expoConfig?.extra as { siteUrl?: string } | undefined)?.siteUrl ?? 'https://waselni.fr').replace(/\/+$/, '');
export const API_URL = `${SITE_URL}/api`;

export const LEGAL_PAGES = {
  terms: `${SITE_URL}/terms`,
  privacy: `${SITE_URL}/privacy`,
  faq: `${SITE_URL}/faq`,
  contact: `${SITE_URL}/contact`,
  accountDeletion: `${SITE_URL}/account-deletion`,
} as const;
