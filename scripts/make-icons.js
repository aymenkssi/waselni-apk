// Builds the app icons and splash image from the website logo (assets/images/logo-source.png).
// Usage: node scripts/make-icons.js [path/to/puppeteer-core] [path/to/chromium]
const fs = require('fs');
const path = require('path');

const puppeteer = require(process.argv[2] || 'puppeteer-core');
const CHROME = process.argv[3] || process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const DIR = path.join(__dirname, '..', 'assets', 'images');
const SRC = 'data:image/png;base64,' + fs.readFileSync(path.join(DIR, 'logo-source.png')).toString('base64');

// Launcher icons: the smiling parcel of the logo, clipped to its box (x 245-535, y 305-545 in the 1536 x 1024 source).
const BOX = { x: 245, y: 305, w: 290, h: 240 };
const page = (size, inner, bg) => {
  const scale = (inner * 0.8) / BOX.w;
  return `<!doctype html><html><body style="margin:0;width:${size}px;height:${size}px;background:${bg};display:flex;align-items:center;justify-content:center;overflow:hidden">
  <div style="width:${inner}px;height:${inner}px;border-radius:${bg === 'transparent' ? inner / 2 : 0}px;background:#fff;display:flex;align-items:center;justify-content:center">
    <div style="width:${BOX.w * scale}px;height:${BOX.h * scale}px;position:relative;overflow:hidden">
      <img src="${SRC}" style="position:absolute;width:${1536 * scale}px;left:${-BOX.x * scale}px;top:${-BOX.y * scale}px;mix-blend-mode:multiply;filter:contrast(1.08) brightness(1.18)"></div></div></body></html>`;
};

// The source logo has a grey glow around it: crop to the logo and blend it on white.
const crop = (w, h) => `<!doctype html><html><body style="margin:0;width:${w}px;height:${h}px;background:transparent;overflow:hidden;display:flex;align-items:center;justify-content:center">
  <div style="width:${w}px;height:${h}px;overflow:hidden;position:relative;background:#fff;border-radius:${h * 0.12}px">
    <img src="${SRC}" style="position:absolute;width:${w * 1.42}px;left:${-w * 0.21}px;top:${-h * 0.43}px;mix-blend-mode:multiply;filter:contrast(1.08) brightness(1.18)"></div></body></html>`;

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const p = await browser.newPage();
  const shot = async (html, file, w, h) => {
    await p.setViewport({ width: w, height: h });
    await p.setContent(html, { waitUntil: 'load' });
    await p.screenshot({ path: path.join(DIR, file), omitBackground: true });
  };
  await shot(page(1024, 1024, '#fff'), 'icon.png', 1024, 1024);
  await shot(page(1024, 680, 'transparent'), 'adaptive-icon.png', 1024, 1024);
  await shot(page(512, 512, '#fff'), 'play-icon-512.png', 512, 512);
  await shot(page(196, 196, '#fff'), 'favicon.png', 196, 196);
  await shot(crop(800, 400), 'logo.png', 800, 400);
  await shot(crop(800, 400), 'splash-icon.png', 800, 400);
  await browser.close();
})();
