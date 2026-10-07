// Packages dist-static/ for publishing as a hosted Artifact (home page = primary page, the rest = published files).
//   node scripts/build-static.mjs && node scripts/package-artifact.mjs   ->  dist-artifact-pkg/ + _files.json
// The primary page is wrapped in a host skeleton, so it must be a fragment (no <html>/<head>/<body>).
// The latin fonts are embedded as data: URIs so the look never depends on a font host being reachable.
import { cpSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SRC = 'dist-static';
const PKG = 'dist-artifact-pkg';
const ASSETS = 'assets';
rmSync(PKG, { recursive: true, force: true });
cpSync(SRC, PKG, { recursive: true });
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });

// 1. embed the two latin faces in every stylesheet that references them
const EMBED = [/newsreader-latin-opsz-normal\.[\w-]+\.woff2/, /manrope-latin-wght-normal\.[\w-]+\.woff2/];
for (const css of walk(join(PKG, ASSETS)).filter((f) => f.endsWith('.css'))) {
  let text = readFileSync(css, 'utf8');
  for (const re of EMBED) {
    text = text.replace(new RegExp(`url\\(\\./(${re.source})\\)`, 'g'), (_m, name) => {
      const file = join(PKG, ASSETS, name);
      return `url(data:font/woff2;base64,${readFileSync(file).toString('base64')})`;
    });
  }
  writeFileSync(css, text);
}

// 2. primary page -> fragment
const html = readFileSync(join(PKG, 'index.html'), 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
const shim = head.match(/<meta name="ae-root"[^>]*><script>[\s\S]*?<\/script>/)[0];
const cssLinks = [...head.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]);
const inlineCss = cssLinks.map((href) => {
  const path = join(PKG, href);
  // the CSS now lives in the page at the artifact root, so its relative font URLs need the assets/ prefix
  return readFileSync(path, 'utf8').replace(/url\(\.\//g, `url(${ASSETS}/`);
}).join('\n');
const fragment = `<title>Alder &amp; Ember</title>\n${shim}\n<script>document.documentElement.classList.add('js');</script>\n<style>\n${inlineCss}\n</style>\n${body}\n`;
// the primary page is published from this file; remove the full document from the files list
writeFileSync(join(PKG, '_primary.html'), fragment);
rmSync(join(PKG, 'index.html'));

// 3. list of other files to publish
const TYPES = { '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain' };
const files = walk(PKG)
  .map((f) => relative(PKG, f).split(sep).join('/'))
  .filter((p) => !p.startsWith('_primary') && !/^(robots\.txt|sitemap\.xml)$/.test(p))
  .sort()
  .map((p) => { const ext = p.slice(p.lastIndexOf('.')); return TYPES[ext] && ext !== '.png' ? { path: p, contentType: TYPES[ext] } : { path: p }; });
writeFileSync(join(PKG, '_files.json'), JSON.stringify(files));
const kb = (n) => Math.round(n / 1024);
console.log(`primary fragment ${kb(fragment.length)} KB; ${files.length} other files; total ${kb(walk(PKG).reduce((a, f) => a + statSync(f).size, 0))} KB`);
