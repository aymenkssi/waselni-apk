/**
 * Raw phone captures (1080 x 1920) of the web version of the app, in French, English and Arabic,
 * written to play-store/build/raw/<lang>/NN-name.png.
 *
 * Needs: the web export of the app pointing to a test server with the demo accounts below
 * (`expo.extra.siteUrl`), served on http://localhost:3000 (an origin the API accepts),
 * and puppeteer-core. See play-store/README.md, "Refaire les images".
 */
const fs = require('fs');
const path = require('path');

const puppeteer = require(process.env.PUPPETEER_CORE || 'puppeteer-core');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const APP = process.env.APP_URL || 'http://localhost:3000';
const API = process.env.API_URL || 'http://localhost:8001/api';
const PASSWORD = process.env.DEMO_PASSWORD || 'Demo2026!';
const OUT = path.join(__dirname, '..', 'build', 'raw');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, p, body, token) {
  const res = await fetch(API + p, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${p}: ${res.status} ${await res.text()}`);
  return res.json();
}
const login = (email) => api('POST', '/auth/login', { email, password: PASSWORD });

/** A short conversation between the sender and the carrier of the demo contract. */
async function seedConversation(lang) {
  const nadia = await login('nadia@demo.fr');
  const karim = await login('karim@demo.fr');
  // One conversation per language (a different ad each time), so each keeps its own messages.
  const about = { fr: { offer_id: 'offer-1' }, en: { request_id: 'request-1' }, ar: { request_id: 'request-3' } }[lang];
  const conv = await api('POST', '/conversations', { participant_id: 'u-karim', ...about }, nadia.access_token);
  const msgs = await api('GET', `/conversations/${conv.id}/messages`, null, nadia.access_token);
  if (!msgs.items.length) {
    const lines = {
      fr: [['n', 'Bonjour Karim, il vous reste de la place pour 18 kg vers Sfax ?'], ['k', 'Bonjour Nadia, oui sans problème. Je pars de Paris le 24.'],
        ['n', 'Parfait ! Ce sont des vêtements et des cadeaux, bien emballés.'], ['k', 'Très bien, je vous envoie une proposition. Je passe récupérer le colis la veille.']],
      en: [['n', 'Hi Karim, do you still have room for 18 kg to Sfax?'], ['k', 'Hi Nadia, yes, no problem. I leave Paris on the 24th.'],
        ['n', 'Great! It is clothes and gifts, well packed.'], ['k', 'Perfect, I am sending you an offer. I will pick up the parcel the day before.']],
      ar: [['n', 'مرحبًا كريم، هل لديك مكان لـ 18 كغ إلى صفاقس؟'], ['k', 'مرحبًا نادية، نعم بدون مشكلة. أنطلق من باريس يوم 24.'],
        ['n', 'ممتاز! إنها ملابس وهدايا مغلفة جيدًا.'], ['k', 'رائع، سأرسل لك عرضًا. سأمر لاستلام الطرد في اليوم السابق.']],
    }[lang];
    for (const [who, text] of lines) {
      await api('POST', `/conversations/${conv.id}/messages`, { text }, (who === 'n' ? nadia : karim).access_token);
    }
  }
  return conv.id;
}

const SCREENS = [
  { name: 'home', path: '/home' },
  { name: 'trips', path: '/offers' },
  { name: 'trip', path: '/offer/offer-1' },
  { name: 'chat', path: (ctx) => `/conversation/${ctx.conv}`, as: 'nadia@demo.fr' },
  { name: 'tracking', path: '/contract/contract-1', as: 'nadia@demo.fr' },
  { name: 'request', path: '/request/new', as: 'nadia@demo.fr' },
  { name: 'verification', path: '/verification', as: 'lina@demo.fr' },
  { name: 'dark', path: '/home', as: 'karim@demo.fr', dark: true },
];

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const lang of ['fr', 'en', 'ar']) {
    const dir = path.join(OUT, lang);
    fs.mkdirSync(dir, { recursive: true });
    const ctx = { conv: await seedConversation(lang) };
    for (const [i, s] of SCREENS.entries()) {
      const session = s.as ? await login(s.as) : null;
      const page = await browser.newPage();
      await page.setViewport({ width: 360, height: 640, deviceScaleFactor: 3 });
      // No platform figures on the store images (they come from the site's admin settings).
      await page.setRequestInterception(true);
      page.on('request', (r) => (r.url().endsWith('/home-stats')
        ? r.respond({ status: 200, contentType: 'application/json', body: '{"stats_enabled":false,"stats":[]}' })
        : r.continue()));
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: s.dark ? 'dark' : 'light' }]);
      await page.evaluateOnNewDocument((l, sess) => {
        localStorage.setItem('app_language', l);
        if (sess) localStorage.setItem('waselni_session', JSON.stringify(sess));
        else localStorage.removeItem('waselni_session');
      }, lang, session && { access_token: session.access_token, refresh_token: session.refresh_token });
      const p = typeof s.path === 'function' ? s.path(ctx) : s.path;
      await page.goto(APP + p, { waitUntil: 'networkidle0' });
      await sleep(1500);
      const file = path.join(dir, `${String(i + 1).padStart(2, '0')}-${s.name}.png`);
      await page.screenshot({ path: file });
      console.log('wrote', path.relative(path.join(__dirname, '..'), file));
      await page.close();
    }
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
