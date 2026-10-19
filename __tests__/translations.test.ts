import fs from 'fs';
import path from 'path';
import { translations } from '../constants/translations';
import { PACKAGE_TYPES } from '../constants/packages';
import { LANGUAGES } from '../lib/types';

const ROOT = path.join(__dirname, '..');
const sourceFiles = (dir: string): string[] => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? sourceFiles(path.join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(ROOT, dir, e.name)] : []);
const sources = ['app', 'components', 'hooks', 'contexts'].flatMap(sourceFiles).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
// Plural forms may spell the number out (e.g. Arabic singular and dual), so {n} is optional there.
const placeholders = (s: string, key: string) =>
  [...new Set([...s.matchAll(/\{([a-z])\}/g)].map((m) => m[1]))].filter((p) => !(key.includes('__') && p === 'n')).sort().join(',');

describe('translations', () => {
  it('has the same keys and placeholders in every language', () => {
    const fr = translations.fr;
    for (const lang of LANGUAGES) {
      expect(Object.keys(translations[lang]).sort()).toEqual(Object.keys(fr).sort());
      for (const [key, text] of Object.entries(translations[lang])) {
        expect(`${lang}.${key}: ${placeholders(text, key)}`).toBe(`${lang}.${key}: ${placeholders(fr[key], key)}`);
        expect(text.trim()).not.toBe('');
      }
    }
  });

  it('defines every key used by the screens', () => {
    const used = [...sources.matchAll(/\bt\('([a-z0-9_]+)'/g)].map((m) => m[1]);
    const plural = [...sources.matchAll(/\btn\('([a-z0-9_]+)'/g)].map((m) => `${m[1]}__other`);
    const missing = [...new Set([...used, ...plural])].filter((k) => !(k in translations.fr));
    expect(missing).toEqual([]);
  });

  it('defines the keys built from API values', () => {
    const groups: Record<string, string[]> = {
      req_status: ['OPEN', 'IN_NEGOTIATION', 'ACCEPTED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
      offer_status: ['ACTIVE', 'PAUSED', 'EXPIRED'],
      contract_status: ['PROPOSED', 'ACCEPTED', 'PICKED_UP', 'DELIVERED', 'CANCELLED'],
      step: ['PROPOSED', 'ACCEPTED', 'PICKED_UP', 'DELIVERED'],
      role: ['SHIPPER', 'CARRIER_INDIVIDUAL', 'CARRIER_PRO', 'SHIPPER_CARRIER', 'SHIPPER_CARRIER_PRO', 'ADMIN'],
      verif_short: ['NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED'],
      verif_banner: ['NOT_STARTED', 'PENDING', 'REJECTED'],
      doc: ['PASSPORT', 'RESIDENCE_PERMIT', 'DRIVING_LICENSE'],
      pkg: [...PACKAGE_TYPES],
      theme: ['system', 'light', 'dark'],
      dim: ['length', 'width', 'height'],
      profile: ['shipper_desc', 'carrier_desc', 'both_desc'],
      tab: ['home', 'offers', 'requests', 'messages', 'profile'],
    };
    const missing = Object.entries(groups).flatMap(([prefix, values]) => values.map((v) => `${prefix}_${v}`)).filter((k) => !(k in translations.fr));
    expect(missing).toEqual([]);
  });

  it('only uses validation messages that exist', () => {
    const libSources = sourceFiles('lib').map((f) => fs.readFileSync(f, 'utf8')).join('\n') + sources;
    const used = [...libSources.matchAll(/'(err_[a-z0-9_]+)'/g)].map((m) => m[1]);
    expect([...new Set(used)].filter((k) => !(k in translations.fr))).toEqual([]);
  });
});
