// Automated accessibility scan (axe-core, WCAG 2.2 A/AA tags) of every route in a running build.
// Automated checks find only a subset of issues: keyboard and screen-reader review is still required.
//   node tests/e2e/a11y.mjs [baseUrl]
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = process.argv[2] || 'http://127.0.0.1:4321';
const routes = ['/', '/saunas', '/saunas/rowan', '/saunas/alder', '/saunas/ember', '/compare', '/compare#selector', '/installation-delivery',
  '/installations', '/installations/preview-template', '/commercial', '/about', '/care-support', '/guides',
  '/guides/choosing-a-sauna-for-your-space', '/plan-your-sauna', '/campaigns/meet-the-alder', '/privacy', '/cookies', '/terms', '/warranty', '/brand', '/nope'];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
let total = 0;
for (const [name, vp] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 375, height: 800 }]]) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  for (const r of routes) {
    await page.goto(base + r, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('is-in')));
    await page.waitForTimeout(450);
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    for (const v of res.violations) {
      total++;
      console.log(`${name} ${r}: [${v.impact}] ${v.id} (${v.nodes.length}) ${v.help}`);
      for (const n of v.nodes.slice(0, 2)) console.log('     ', n.target.join(' '), '|', (n.failureSummary || '').split('\n')[1]?.trim());
    }
  }
  await ctx.close();
}
await browser.close();
console.log(total ? `\n${total} violation group(s)` : '\nNo axe violations on any route at either width.');
process.exit(total ? 1 : 0);
