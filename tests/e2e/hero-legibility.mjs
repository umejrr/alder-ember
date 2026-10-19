// Text over the home hero photograph cannot be checked by axe, which does not sample images. This hides the copy, captures what is
// behind it, and measures the contrast the headline and lead would have against the brightest 1% of those pixels.
//   node tests/e2e/hero-legibility.mjs [baseUrl]
// The headline is large text (3:1 needed); the lead is body text (4.5:1). Narrow screens put the copy on a solid panel, so only desktop widths are sampled.
import { chromium } from 'playwright';

const base = process.argv[2] || 'http://127.0.0.1:4321';
const widths = [[769, 700], [1024, 768], [1280, 800], [1440, 900], [1920, 1080], [2560, 1300]];
const FG = [244, 240, 232]; // --c-on-forest
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const problems = [];

const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);

for (const [w, h] of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '.hero__copy > *{animation:none!important}.hero__headline,.hero__copy .lead,.hero__copy .btn{visibility:hidden!important}' });
  await page.waitForTimeout(400);
  const boxes = await page.evaluate(() => [['headline', '.hero__headline'], ['lead', '.hero__copy .lead']].map(([name, sel]) => {
    const r = document.querySelector(sel).getBoundingClientRect();
    return { name, x: r.x, y: r.y, w: r.width, h: r.height };
  }));
  const shot = (await page.screenshot()).toString('base64');
  const brightest = await page.evaluate(async ({ shot, boxes }) => {
    const img = new Image();
    img.src = `data:image/png;base64,${shot}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const lin = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return boxes.map((b) => {
      const d = ctx.getImageData(Math.round(b.x), Math.round(b.y), Math.round(b.w), Math.round(b.h)).data;
      const ls = [];
      for (let i = 0; i < d.length; i += 4) ls.push(0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]));
      ls.sort((a, z) => a - z);
      return { name: b.name, l: ls[Math.floor(ls.length * 0.99)] };
    });
  }, { shot, boxes });
  const fg = lum(...FG);
  for (const { name, l } of brightest) {
    const ratio = (fg + 0.05) / (l + 0.05);
    const need = name === 'headline' ? 3 : 4.5;
    console.log(`${String(w).padStart(5)} px  ${name.padEnd(8)} ${ratio.toFixed(2)}:1 (needs ${need})`);
    if (ratio < need) problems.push(`${w}px ${name}: ${ratio.toFixed(2)}:1 < ${need}:1`);
  }
  await page.close();
}
await browser.close();
if (problems.length) {
  console.error('\nHero copy is not legible over the photograph:\n- ' + problems.join('\n- '));
  process.exit(1);
}
console.log('\nHero headline and lead clear their contrast thresholds over the photograph at every desktop width.');
