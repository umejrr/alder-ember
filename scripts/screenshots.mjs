// Capture representative screenshots of a running build.
//   HOST=127.0.0.1 PORT=4321 node dist/server/entry.mjs &   (in another shell)
//   node scripts/screenshots.mjs [baseUrl] [outDir] [route,route,...]
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const base = process.argv[2] || 'http://127.0.0.1:4321';
const out = process.argv[3] || 'screenshots';
const routes = (process.argv[4] || '/').split(',');
const sizes = [
  ['desktop', 1440, 900],
  ['mobile', 390, 844],
];
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
for (const route of routes) {
  for (const [name, width, height] of sizes) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.goto(base + route, { waitUntil: 'networkidle' });
    // reveal everything so full-page captures are complete
    await page.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('is-in')));
    await page.waitForTimeout(700);
    const slug = route === '/' ? 'home' : route.replace(/^\//, '').replace(/[\/?=&]/g, '-');
    await page.screenshot({ path: `${out}/${slug}-${name}-fold.png` });
    await page.screenshot({ path: `${out}/${slug}-${name}-full.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    console.log(`${route} ${name}: horizontal overflow ${overflow}px`);
    await page.close();
  }
}
await browser.close();
