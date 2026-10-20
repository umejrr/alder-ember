// Layout sweep against a running build: horizontal overflow on every route at seven widths, plus a 200% text-size pass and a
// 320 px (400% reflow) pass. Real rendering in Chromium; it does not replace testing on real iOS and Android devices.
//   node tests/e2e/responsive.mjs [baseUrl]
import { chromium } from 'playwright';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = process.argv[2] || 'http://127.0.0.1:4321';
const routes = ['/', '/saunas', '/saunas/rowan', '/saunas/alder', '/saunas/ember', '/compare', '/installation-delivery', '/installations', '/installations/preview-template',
  '/commercial', '/about', '/care-support', '/guides', '/guides/choosing-a-sauna-for-your-space', '/plan-your-sauna', '/campaigns/meet-the-alder', '/privacy', '/cookies', '/terms', '/warranty', '/brand', '/image-credits', '/nope'];
const widths = [320, 375, 390, 768, 1024, 1100, 1440, 1920];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const problems = [];
let checks = 0;

async function probe(page, label) {
  const r = await page.evaluate(() => {
    const doc = document.documentElement;
    const vw = doc.clientWidth;
    const wide = [...document.querySelectorAll('body *')]
      .filter((e) => {
        const cs = getComputedStyle(e);
        if (cs.position === 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return false;
        let p = e.parentElement;
        while (p && p !== document.body) { // content inside its own horizontal scroller is allowed to be wider
          const o = getComputedStyle(p).overflowX;
          if (o === 'auto' || o === 'scroll' || o === 'hidden') return false;
          p = p.parentElement;
        }
        const b = e.getBoundingClientRect();
        return b.width > 0 && b.right > vw + 1;
      })
      .slice(0, 3)
      .map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}`);
    // a navigation label broken across lines is a sign the bar ran out of room (it should have switched to the menu button)
    const broken = [...document.querySelectorAll('.site-nav a, .site-nav .btn')]
      .filter((a) => a.getClientRects().length && a.getBoundingClientRect().height > 3.2 * parseFloat(getComputedStyle(a).fontSize))
      .map((a) => a.textContent.trim());
    return { over: doc.scrollWidth - vw, wide, broken };
  });
  checks++;
  if (r.over > 0 || r.wide.length) problems.push(`${label}: page overflows by ${r.over}px ${r.wide.join(', ')}`);
  if (r.broken.length) problems.push(`${label}: navigation labels wrap inside the header: ${r.broken.join(', ')}`);
}

for (const route of routes) {
  for (const w of widths) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(base + route, { waitUntil: 'networkidle' });
    await probe(page, `${route} @${w}`);
    await ctx.close();
  }
}
await browser.close();

// Text enlarged to 200% the way a visitor does it: the browser's own default font size is raised, so rem units and rem
// breakpoints both follow it (injecting a root font-size from the page would not move media queries).
const profile = mkdtempSync(join(tmpdir(), 'ae-textsize-'));
mkdirSync(join(profile, 'Default'), { recursive: true });
writeFileSync(join(profile, 'Default', 'Preferences'), JSON.stringify({ webkit: { webprefs: { default_font_size: 32, default_fixed_font_size: 26 } } }));
const big = await chromium.launchPersistentContext(profile, { executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', viewport: { width: 390, height: 900 } });
const bigPage = big.pages()[0] ?? (await big.newPage());
await bigPage.goto(base + '/', { waitUntil: 'networkidle' });
const rootSize = await bigPage.evaluate(() => getComputedStyle(document.documentElement).fontSize);
if (rootSize !== '32px') { console.log(`could not set the browser default font size (root is ${rootSize}); the 200% text pass was not run`); problems.push('200% text pass could not run'); }
else {
  // /brand is an internal specimen sheet that shows fixed-size mock-ups, so it is left out of the enlarged-text pass
  for (const route of routes.filter((r) => r !== '/brand')) {
    for (const w of [390, 768, 1440]) {
      await bigPage.setViewportSize({ width: w, height: 900 });
      await bigPage.goto(base + route, { waitUntil: 'networkidle' });
      await probe(bigPage, `${route} @${w} with the browser text size at 200%`);
    }
  }
}
await big.close();
console.log(`${checks} layout checks across ${routes.length} routes.`);
if (problems.length) { console.log(problems.join('\n')); process.exit(1); }
console.log('No horizontal overflow at any width, nor with text enlarged to 200%.');
