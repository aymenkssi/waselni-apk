/**
 * Generates the Google Play images of Waselni:
 *  - images/icon-512.png (512 x 512, from assets/images/play-icon-512.png)
 *  - images/feature-graphic-<lang>.png (1024 x 500) for fr, en, ar
 *  - images/screenshots-<lang>/*.png framed from build/raw/<lang>/*.png (1080 x 1920, see capture-screens.js)
 *
 * Fonts (once) and puppeteer-core: see play-store/README.md, section "Refaire les images".
 * Run from the repository root: PUPPETEER_CORE=<path> node play-store/scripts/compose-images.js
 */
const fs = require('fs');
const path = require('path');

const puppeteer = require(process.env.PUPPETEER_CORE || 'puppeteer-core');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const ROOT = path.join(__dirname, '..');
const FONTS = path.join(ROOT, 'build', 'fonts');
const OUT = path.join(ROOT, 'images');
const ASSETS = path.join(ROOT, '..', 'assets', 'images');

function font(pkg, file) {
  const p = path.join(FONTS, pkg, 'package', 'files', file);
  if (!fs.existsSync(p)) throw new Error(`Missing font ${file}: see play-store/README.md`);
  return `url(data:font/woff2;base64,${fs.readFileSync(p).toString('base64')})`;
}
const fontCss = [
  ['Figtree', 'fontsource-figtree-5.2.8', 'figtree-latin-800-normal.woff2', 800],
  ['Figtree', 'fontsource-figtree-5.2.8', 'figtree-latin-700-normal.woff2', 700],
  ['Figtree', 'fontsource-figtree-5.2.8', 'figtree-latin-500-normal.woff2', 500],
  ['Kufi', 'fontsource-noto-kufi-arabic-5.2.8', 'noto-kufi-arabic-arabic-700-normal.woff2', 700],
  ['Kufi', 'fontsource-noto-kufi-arabic-5.2.8', 'noto-kufi-arabic-arabic-500-normal.woff2', 500],
].map(([family, pkg, file, weight]) => `@font-face{font-family:${family};src:${font(pkg, file)};font-weight:${weight};}`).join('\n');

const png = (file) => `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`;
const LOGO = png(path.join(ASSETS, 'logo.png'));
const NAVY = '#1E3A5F', NAVY_DARK = '#10294A', ORANGE = '#F97316', WHITE = '#FFFFFF';
const BG = `radial-gradient(900px 700px at 90% -10%,#2D6AA5 0%,transparent 60%),radial-gradient(700px 700px at -10% 110%,${ORANGE}55 0%,transparent 60%),linear-gradient(160deg,${NAVY_DARK} 0%,${NAVY} 60%,#16304F 100%)`;

const TEXT = {
  fr: { tagline: 'Vos colis à l\'étranger avec des voyageurs de confiance', chips: ['Identités vérifiées', 'Messagerie', 'Suivi de l\'envoi'], dir: 'ltr' },
  en: { tagline: 'Send parcels abroad\nwith trusted travellers', chips: ['Verified identities', 'Messaging', 'Shipment tracking'], dir: 'ltr' },
  ar: { tagline: 'أرسل طرودك إلى الخارج\nمع مسافرين موثوقين', chips: ['هويات موثقة', 'رسائل', 'تتبع الإرسال'], dir: 'rtl' },
};

// Same order as capture-screens.js.
const CAPTIONS = {
  fr: ['Envoyez vos colis à l\'étranger, entre particuliers', 'Trouvez un trajet en quelques secondes', 'Transporteurs vérifiés et avis authentiques', 'Discutez directement dans l\'application', 'Suivez votre envoi étape par étape', 'Publiez votre demande d\'envoi en 1 minute', 'Chaque transporteur fait vérifier son identité', 'Mode sombre, en français, anglais et arabe'],
  en: ['Send parcels abroad, between individuals', 'Find a trip in seconds', 'Verified carriers and genuine reviews', 'Chat directly in the app', 'Track your shipment step by step', 'Post your shipping request in 1 minute', 'Every carrier gets their identity verified', 'Dark mode, in English, French and Arabic'],
  ar: ['أرسل طرودك إلى الخارج بين الأفراد', 'اعثر على رحلة في ثوانٍ', 'ناقلون موثقون وتقييمات حقيقية', 'تواصل مباشرة داخل التطبيق', 'تابع إرسالك خطوة بخطوة', 'انشر طلب الإرسال في دقيقة', 'كل ناقل يتحقق من هويته', 'الوضع الداكن، بالعربية والفرنسية والإنجليزية'],
};

const page = (body, w, h) => `<!doctype html><html><head><meta charset="utf-8"><style>
${fontCss}
*{margin:0;padding:0;box-sizing:border-box}
body{width:${w}px;height:${h}px;overflow:hidden;font-family:Figtree,Kufi,sans-serif;-webkit-font-smoothing:antialiased}
.ar{font-family:Kufi,Figtree,sans-serif}
</style></head><body>${body}</body></html>`;

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const shot = async (html, w, h, file) => {
    const p = await browser.newPage();
    await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await p.setContent(html, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await p.screenshot({ path: file });
    await p.close();
    console.log('wrote', path.relative(ROOT, file));
  };

  fs.mkdirSync(OUT, { recursive: true });
  fs.copyFileSync(path.join(ASSETS, 'play-icon-512.png'), path.join(OUT, 'icon-512.png'));
  console.log('wrote images/icon-512.png');

  for (const [lang, t] of Object.entries(TEXT)) {
    const cls = lang === 'ar' ? 'ar' : '';
    const chips = t.chips.map((c) => `<span style="background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.3);color:${WHITE};border-radius:999px;padding:8px 20px;font-size:22px;font-weight:700">${c}</span>`).join('');
    await shot(page(`
      <div dir="${t.dir}" class="${cls}" style="width:1024px;height:500px;background:${BG};display:flex;align-items:center;gap:44px;padding:0 56px;color:${WHITE}">
        <div style="flex:0 0 400px;height:220px;background:${WHITE};border-radius:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 18px 40px rgba(0,0,0,.3)">
          <img src="${LOGO}" style="width:370px">
        </div>
        <div style="flex:1">
          <div style="font-size:${lang === 'ar' ? 34 : 40}px;font-weight:800;line-height:1.3;white-space:pre-line">${t.tagline}</div>
          <div style="width:72px;height:6px;border-radius:3px;background:${ORANGE};margin:22px 0"></div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">${chips}</div>
        </div>
      </div>`, 1024, 500), 1024, 500, path.join(OUT, `feature-graphic-${lang}.png`));
  }

  for (const lang of Object.keys(TEXT)) {
    const rawDir = path.join(ROOT, 'build', 'raw', lang);
    if (!fs.existsSync(rawDir)) continue;
    const files = fs.readdirSync(rawDir).filter((f) => f.endsWith('.png')).sort();
    for (const [i, f] of files.entries()) {
      const caption = CAPTIONS[lang][i] || '';
      await shot(page(`
        <div dir="${TEXT[lang].dir}" class="${lang === 'ar' ? 'ar' : ''}" style="width:1080px;height:1920px;background:${BG};display:flex;flex-direction:column;align-items:center;padding-top:70px">
          <div style="color:${WHITE};font-size:${lang === 'ar' ? 58 : 64}px;font-weight:800;text-align:center;padding:0 70px;line-height:1.3;height:250px;display:flex;align-items:center">${caption}</div>
          <div style="width:96px;height:8px;border-radius:4px;background:${ORANGE};margin:10px 0 50px"></div>
          <img src="${png(path.join(rawDir, f))}" style="width:780px;border-radius:52px;border:14px solid #0B1424;box-shadow:0 40px 90px rgba(0,0,0,.45)">
        </div>`, 1080, 1920), 1080, 1920, path.join(OUT, `screenshots-${lang}`, f));
    }
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
