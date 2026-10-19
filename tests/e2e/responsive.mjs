// Layout sweep against a running build: horizontal overflow on every route at seven widths, plus a 200% text-size pass and a
// 320 px (400% reflow) pass. Real rendering in Chromium; it does not replace testing on real iOS and Android devices.
//   node tests/e2e/responsive.mjs [baseUrl]
import { chromium } from 'playwright';

const base = process.argv[2] || 'http://127.0.0.1:4321';
const routes = ['/', '/saunas', '/saunas/rowan', '/saunas/alder', '/saunas/ember', '/compare', '/installation-delivery', '/installations', '/installations/preview-template',
  '/commercial', '/about', '/care-support', '/guides', '/guides/choosing-a-sauna-for-your-space', '/plan-your-sauna', '/campaigns/meet-the-alder', '/privacy', '/cookies', '/terms', '/warranty', '/brand', '/image-credits', '/nope'];
const widths = [320, 375, 390, 768, 1024, 1440, 1920];
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
    return { over: doc.scrollWidth - vw, wide };
  });
  checks++;
  if (r.over > 0 || r.wide.length) problems.push(`${label}: page overflows by ${r.over}px ${r.wide.join(', ')}`);
}

for (const route of routes) {
  for (const w of widths) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(base + route, { waitUntil: 'networkidle' });
    await probe(page, `${route} @${w}`);
    if (w === 390 || w === 1440) {
      await page.addStyleTag({ content: 'html { font-size: 200% !important; }' }); // text enlarged to 200%
      await page.waitForTimeout(150);
      await probe(page, `${route} @${w} with text at 200%`);
    }
    await ctx.close();
  }
}
await browser.close();
console.log(`${checks} layout checks across ${routes.length} routes.`);
if (problems.length) { console.log(problems.join('\n')); process.exit(1); }
console.log('No horizontal overflow at any width, nor with text enlarged to 200%.');
