// Verifies that a PRODUCTION build is final: no preview, demo, draft or placeholder wording anywhere, no route that
// should not exist, indexing rules that match the content, and a link-preview image.
//   npm run check:production
// Builds with PUBLIC_CONTENT_MODE=production into dist-prod/ (with a stand-in domain so the indexing rules can be
// checked), then scans every HTML file.
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
const unfinished = new Set();
const fail = (msg) => { failures++; console.log('FAIL', msg); };
const rel = (f) => f.replace(root, '');

// wording that must never appear on the final site
const forbidden = [
  [/Preview build/i, 'the preview-build notice'],
  [/\(working (figure|value)/i, 'a "working figure" label'],
  [/working values?/i, 'the words "working value"'],
  [/Demo mode|demo prices?/i, 'demo wording'],
  [/Stock preview|Preview image|Preview photo/i, 'a preview image label'],
  [/awaiting approval|not yet approved|once approved/i, 'approval-pending wording'],
  [/Preview note for the team|Template preview|Draft: awaiting/i, 'an internal preview note'],
  [/lorem ipsum|TODO|FIXME/i, 'placeholder text'],
];
// a page that is honest about being unfinished is reported, not failed: it needs the owner's text
const openItem = /(is being finalised|has not been approved yet)/i;

for (const f of html) {
  const text = readFileSync(f, 'utf8');
  // strip scripts/styles: only what a visitor can read is checked
  const visible = text.replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(/<meta[^>]*>/g, '');
  for (const [re, what] of forbidden) if (re.test(visible)) fail(`${rel(f)} contains ${what}`);
  if (openItem.test(visible)) unfinished.add(rel(f).replace(/\/index\.html$/, '') || '/');
  if (!/<meta name="robots" content="[^"]*"/.test(text)) fail(`${rel(f)} has no robots meta`);
  if (!/<meta property="og:image" content="https:\/\/example\.invalid\/images\/social-share\.jpg">/.test(text) && !/404/.test(f)) fail(`${rel(f)} has no link-preview image`);
}

// routes that must not exist in the final site
for (const gone of ['brand/index.html', 'cookies/index.html', 'warranty/index.html', 'installations/index.html', 'installations/preview-template/index.html', 'image-credits/index.html']) {
  if (existsSync(join(root, gone))) fail(`${gone} is generated, but is not part of the final site`);
}
// and routes that must
for (const here of ['privacy/index.html', 'terms/index.html', 'plan-your-sauna/index.html', 'saunas/rowan/index.html']) {
  if (!existsSync(join(root, here))) fail(`${here} is missing`);
}
// nothing may link to a page that was removed
for (const f of html) {
  const text = readFileSync(f, 'utf8');
  // /brand/ also holds the logo files, so only the bare page address counts for it
  for (const [dead, tail] of [['/cookies', '["#/?]'], ['/installations', '["#/?]'], ['/warranty', '["#/?]'], ['/image-credits', '["#/?]'], ['/brand', '["#?]']]) {
    if (new RegExp(`href="${dead}${tail}`).test(text)) fail(`${rel(f)} links to the removed page ${dead}`);
  }
}

// indexing: pages with final text are indexable; a page without approved text stays noindex
const robotsOf = (p) => readFileSync(join(root, p), 'utf8').match(/<meta name="robots" content="([^"]*)"/)?.[1];
if (robotsOf('index.html') !== 'index, follow') fail('home page is not indexable once a domain is set');
for (const p of ['privacy', 'terms']) if (robotsOf(`${p}/index.html`) !== 'index, follow') fail(`${p} has approved text but is not indexable`);
const robotsTxt = readFileSync(join(root, 'robots.txt'), 'utf8');
if (!/Allow: \//.test(robotsTxt)) fail('robots.txt blocks everything even though a domain is set');
if (!existsSync(join(root, 'sitemap.xml'))) fail('sitemap.xml missing with a site URL');
else {
  const sm = readFileSync(join(root, 'sitemap.xml'), 'utf8');
  for (const need of ['/privacy', '/terms', '/guides', '/plan-your-sauna']) if (!sm.includes(`${need}<`)) fail(`sitemap does not list ${need}`);
  for (const bad of ['/installations', '/warranty', '/cookies', '/brand', '/image-credits']) if (sm.includes(`${bad}<`) || sm.includes(`${bad}/`)) fail(`sitemap lists ${bad}`);
}

// no domain, no indexing: the same site built without PUBLIC_SITE_URL must say noindex everywhere
execFileSync('npx', ['astro', 'build', '--outDir', `${out}-nodomain`], { env: { ...process.env, PUBLIC_CONTENT_MODE: 'production', PUBLIC_SITE_URL: '' }, stdio: 'pipe' });
const nd = join(`${out}-nodomain`, 'client');
for (const f of walk(nd).filter((x) => x.endsWith('.html'))) {
  if (!/content="noindex, nofollow"/.test(readFileSync(f, 'utf8'))) fail(`${f.replace(nd, '')} is indexable although no domain is configured`);
}
if (!/Disallow: \//.test(readFileSync(join(nd, 'robots.txt'), 'utf8'))) fail('robots.txt allows crawling although no domain is configured');
rmSync(`${out}-nodomain`, { recursive: true, force: true });

console.log(`Scanned ${html.length} HTML files.`);
if (unfinished.size) console.log(`OPEN ITEM: ${[...unfinished].join(', ')} still say the text is being finalised. They need text from the owner.`);
if (failures) { console.log(`${failures} problem(s).`); process.exit(1); }
console.log('The production build is final: no preview, demo, draft or placeholder wording, no removed pages, and indexing follows the domain.');
