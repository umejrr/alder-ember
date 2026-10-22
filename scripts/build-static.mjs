// Builds a fully STATIC preview bundle that works from any URL or sub-path (no server, no root-absolute links).
//   node scripts/build-static.mjs          ->  dist-static/
//
// Used for hosts that cannot run the Node server (an Artifact, GitHub Pages, any static host).
//  - the enquiry form runs as a client-side demo: it validates, then says plainly that nothing was sent;
//  - every root-absolute URL in the built HTML/CSS is rewritten to a relative one, so the bundle is portable;
//  - links that React islands create at runtime go through src/lib/base-url.ts, which reads the <meta name="ae-root">
//    marker added here, so they are real hrefs too (Ctrl/Cmd-click, middle-click and copied links all work);
//  - 404.html is the one document served at an arbitrary URL depth, so relative URLs cannot work in it. When
//    STATIC_BASE is set (for example /alder-ember/ on GitHub Pages) it is built with that absolute base instead.
//
// Environment:
//   STATIC_BASE  absolute path the bundle is mounted at, such as /alder-ember/ (only used for 404.html)
//   OUT_DIR      output directory (default dist-static)
import { execFileSync } from 'node:child_process';
import { cpSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// the asset folder is 'assets' (some static hosts reserve names starting with an underscore)
const ASSETS = 'assets';
const RAW = 'dist-static-raw';
const OUT = process.env.OUT_DIR || 'dist-static';
const BASE = process.env.STATIC_BASE ? `/${process.env.STATIC_BASE.replace(/^\/+|\/+$/g, '')}/`.replace(/^\/\/$/, '/') : null;
rmSync(RAW, { recursive: true, force: true });
rmSync(OUT, { recursive: true, force: true });
execFileSync('npx', ['astro', 'build', '--outDir', RAW], {
  env: { ...process.env, ASSETS_DIR: ASSETS, PUBLIC_CONTENT_MODE: 'production', PUBLIC_STATIC_DEMO: 'true', PUBLIC_ENQUIRY_MODE: 'demo' },
  stdio: 'pipe',
});
cpSync(join(RAW, 'client'), OUT, { recursive: true });
rmSync(RAW, { recursive: true, force: true });

const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const ASSET = /\.(css|js|mjs|png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|json|txt|xml|webmanifest)$/i;

/**
 * URL for a root-absolute target, as seen from a page.
 * `prefix` is what goes in front of the site-relative path: "../../" for a page two levels down, or the
 * absolute BASE for 404.html.
 */
function toUrl(target, prefix) {
  if (!target.startsWith('/') || target.startsWith('//')) return target;
  const m = target.match(/^([^?#]*)(.*)$/);
  const rest = m[2];
  const clean = m[1].replace(/^\//, '');
  if (clean === '') return prefix + 'index.html' + rest;
  if (ASSET.test(clean)) return prefix + clean + rest;
  return prefix + clean.replace(/\/$/, '') + '/index.html' + rest;
}

let pages = 0;
for (const file of walk(OUT)) {
  if (file.endsWith('.css')) {
    writeFileSync(file, readFileSync(file, 'utf8').replace(new RegExp(`url\\(/${ASSETS}/`, 'g'), 'url(./'));
    continue;
  }
  if (!file.endsWith('.html')) continue;
  const relPath = relative(OUT, file).split(sep);
  const d = relPath.length - 1; // directories deep
  const isFallback = relPath.length === 1 && relPath[0] === '404.html';
  // 404.html is served for any missing URL at any depth, so its URLs must not depend on where it is requested from
  const useBase = isFallback && BASE !== null;
  const prefix = useBase ? BASE : '../'.repeat(d);
  const dyn = useBase ? BASE : d === 0 ? './' : '../'.repeat(d); // dynamic import() needs an explicit ./ or ../ or absolute prefix
  let html = readFileSync(file, 'utf8');
  // attribute URLs
  html = html.replace(/\s(href|src|component-url|renderer-url|before-hydration-url)="(\/[^"]*)"/g, (_m, attr, url) =>
    ` ${attr}="${toUrl(url, attr.endsWith('-url') ? dyn : prefix)}"`);
  // srcset holds several comma-separated URLs (React's server renderer writes it as srcSet)
  html = html.replace(/\ssrcset="([^"]*)"/gi, (_m, list) =>
    ` srcset="${list.split(',').map((part) => { const [u, ...desc] = part.trim().split(/\s+/); return [toUrl(u, prefix), ...desc].join(' '); }).join(', ')}"`);
  // any remaining quoted /assets/ references inside inline scripts
  html = html.replace(new RegExp('(["\'`])/' + ASSETS + '/', 'g'), (_m, q) => `${q}${dyn}${ASSETS}/`);
  // root marker, first thing in <head>: src/lib/base-url.ts builds runtime links from it
  html = html.replace(/<head>/, `<head><meta name="ae-root" content="${prefix}">`);
  writeFileSync(file, html);
  pages++;
}

// self-check: no root-absolute internal references left in any HTML (404.html with a base is absolute by design)
const leaks = [];
for (const f of walk(OUT).filter((x) => x.endsWith('.html'))) {
  const h = readFileSync(f, 'utf8');
  const fallbackWithBase = BASE !== null && relative(OUT, f) === '404.html';
  for (const m of h.matchAll(/\s(?:href|src|component-url|renderer-url)="(\/(?!\/)[^"]*)"/g)) {
    if (fallbackWithBase && m[1].startsWith(BASE)) continue;
    leaks.push(`${f}: ${m[1]}`);
  }
  for (const m of h.matchAll(/\ssrcset="([^"]*)"/gi)) {
    if (m[1].split(',').some((p) => p.trim().startsWith('/') && !(fallbackWithBase && p.trim().startsWith(BASE)))) leaks.push(`${f}: srcset ${m[1].slice(0, 60)}`);
  }
}
if (leaks.length) { console.error('Root-absolute URLs left:\n' + leaks.slice(0, 10).join('\n')); process.exit(1); }
console.log(`Static bundle: ${pages} pages, ${walk(OUT).length} files in ${OUT}/ (${BASE ? `404.html anchored to ${BASE}, all other links relative` : 'all links relative'})`);
