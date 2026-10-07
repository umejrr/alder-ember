// Verifies that a PRODUCTION build does not publish unresolved claims.
//   npm run check:production
// Builds with PUBLIC_CONTENT_MODE=production into dist-prod/, then scans every HTML file.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const out = 'dist-prod';
rmSync(out, { recursive: true, force: true });
execFileSync('npx', ['astro', 'build', '--outDir', out], {
  env: { ...process.env, PUBLIC_CONTENT_MODE: 'production', PUBLIC_SITE_URL: 'https://example.invalid' },
  stdio: 'pipe',
});

const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const root = join(out, 'client');
const files = walk(root);
const html = files.filter((f) => f.endsWith('.html'));
let failures = 0;
const blockers = new Set();
const fail = (msg) => { failures++; console.log('FAIL', msg); };

const forbidden = [
  [/From £\s?\d|£(8,950|12,950|18,950)/, 'a working starting price'],
  [/\d\.\d\s?×\s?\d\.\d/, 'working dimensions (W × D × H)'],
  [/\b\d–\d adults\b/, 'a working comfortable-capacity range'],
  [/\b(four|five|six|seven|eight|two|three) (to|or) (four|five|six|seven|eight|three) adults\b/i, 'capacity in words'],
  [/8–12 weeks/, 'the working lead time'],
  [/Preview build/i, 'the preview-build notice'],
  [/England and Wales/, 'the unconfirmed coverage statement'],
];
for (const f of html) {
  const text = readFileSync(f, 'utf8');
  // strip scripts/styles and serialised island props (checked separately below)
  const visible = text.replace(/<(script|style)[\s\S]*?<\/\1>/g, '');
  if (/Preview image|PREVIEW IMAGE/.test(visible)) blockers.add(f.replace(root, ''));
  for (const [re, what] of forbidden) if (re.test(visible)) fail(`${f.replace(root, '')} contains ${what}`);
  // serialised island props must not carry working values either
  const props = [...text.matchAll(/props="([^"]*)"/g)].map((m) => m[1]).join(' ');
  if (/&quot;(8950|12950|18950)/.test(props) || /£[\d,]+/.test(props)) fail(`${f.replace(root, '')} leaks a price through island props`);
  if (!/<meta name="robots" content="[^"]*"/.test(text)) fail(`${f.replace(root, '')} has no robots meta`);
}

// unresolved routes must not exist
for (const gone of ['guides/index.html', 'guides/choosing-a-sauna-for-your-space/index.html', 'installations/index.html', 'installations/preview-template/index.html', 'campaigns/meet-the-alder/index.html', 'brand/index.html']) {
  if (existsSync(join(root, gone))) fail(`${gone} is generated without approved content`);
}
// indexable pages must be indexable; unapproved policy pages must stay noindex
const robotsOf = (rel) => readFileSync(join(root, rel), 'utf8').match(/<meta name="robots" content="([^"]*)"/)?.[1];
if (robotsOf('index.html') !== 'index, follow') fail('home page is not indexable in production');
for (const p of ['privacy', 'terms', 'cookies', 'warranty']) if (!/noindex/.test(robotsOf(`${p}/index.html`) ?? '')) fail(`${p} is indexable without approved text`);
if (/Disallow: \/\n/.test(readFileSync(join(root, 'robots.txt'), 'utf8') + '\n') && !/Allow: \//.test(readFileSync(join(root, 'robots.txt'), 'utf8'))) fail('robots.txt blocks everything in production');
if (!existsSync(join(root, 'sitemap.xml'))) fail('sitemap.xml missing in production with a site URL');
else {
  const sm = readFileSync(join(root, 'sitemap.xml'), 'utf8');
  for (const bad of ['/guides', '/installations', '/privacy', '/terms', '/warranty', '/cookies', '/brand']) if (sm.includes(`${bad}<`) || sm.includes(`${bad}/`)) fail(`sitemap lists ${bad}`);
}

console.log(`Scanned ${html.length} HTML files.`);
if (blockers.size) console.log(`LAUNCH BLOCKER (expected until approved photography is supplied): ${blockers.size} page(s) still show labelled placeholder images.`);
if (failures) { console.log(`${failures} problem(s).`); process.exit(1); }
console.log('Production build publishes no working values, drafts or unapproved routes.');
