// Builds a fully STATIC preview bundle that works from any URL or sub-path (no server, no root-absolute links).
//   node scripts/build-static.mjs          ->  dist-static/
//
// Used for hosts that cannot run the Node server (an Artifact, GitHub Pages, any static host).
//  - the enquiry form runs as a client-side demo: it validates, then says plainly that nothing was sent;
//  - every root-absolute URL in the built HTML/CSS is rewritten to a relative one;
//  - a tiny click shim maps the links that React islands create at runtime (/saunas/alder ...) to the right file;
//  - query strings may be dropped by some hosts, so model choice also travels in sessionStorage (already the case).
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// the asset folder is 'assets' (some static hosts reserve names starting with an underscore)
const ASSETS = 'assets';
const RAW = 'dist-static-raw';
const OUT = 'dist-static';
rmSync(RAW, { recursive: true, force: true });
rmSync(OUT, { recursive: true, force: true });
execFileSync('npx', ['astro', 'build', '--outDir', RAW], {
  env: { ...process.env, ASSETS_DIR: ASSETS, PUBLIC_CONTENT_MODE: 'preview', PUBLIC_STATIC_DEMO: 'true', PUBLIC_ENQUIRY_MODE: 'demo' },
  stdio: 'pipe',
});
cpSync(join(RAW, 'client'), OUT, { recursive: true });
rmSync(RAW, { recursive: true, force: true });

const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const ASSET = /\.(css|js|mjs|png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|json|txt|xml|webmanifest)$/i;

/** Relative URL from a page at depth `d` to a root-absolute target. */
function rel(target, d, { dotSlash = false } = {}) {
  if (!target.startsWith('/') || target.startsWith('//')) return target;
  const m = target.match(/^([^?#]*)(.*)$/);
  let path = m[1];
  const rest = m[2];
  const pre = d === 0 ? (dotSlash ? './' : '') : '../'.repeat(d);
  if (path === '/' || path === '') return pre + 'index.html' + rest;
  const clean = path.replace(/^\//, '');
  if (ASSET.test(clean)) return pre + clean + rest;
  return pre + clean.replace(/\/$/, '') + '/index.html' + rest;
}

const SHIM = `(function(){document.addEventListener('click',function(e){
if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!a)return;
var h=a.getAttribute('href');if(!h||h.charAt(0)!=='/'||h.charAt(1)==='/')return;
var m=document.querySelector('meta[name=ae-root]');var root=m?m.getAttribute('content'):'';
var i=h.search(/[?#]/);var p=i<0?h:h.slice(0,i);var rest=i<0?'':h.slice(i);
var clean=p.replace(/^\\//,'').replace(/\\/$/,'');
var t=/\\.[a-z0-9]+$/i.test(clean)?clean:(clean?clean+'/':'')+'index.html';
e.preventDefault();location.href=root+t+rest;},true);})();`;

let pages = 0;
for (const file of walk(OUT)) {
  if (file.endsWith('.css')) {
    writeFileSync(file, readFileSync(file, 'utf8').replace(new RegExp(`url\\(/${ASSETS}/`, 'g'), 'url(./'));
    continue;
  }
  if (!file.endsWith('.html')) continue;
  const relPath = relative(OUT, file).split(sep);
  const d = relPath.length - 1; // directories deep
  let html = readFileSync(file, 'utf8');
  // attribute URLs
  html = html.replace(/\s(href|src|component-url|renderer-url|before-hydration-url)="(\/[^"]*)"/g, (_m, attr, url) => {
    const dotSlash = attr.endsWith('-url'); // dynamic import() needs an explicit ./ prefix
    return ` ${attr}="${rel(url, d, { dotSlash })}"`;
  });
  // any remaining quoted /assets/ references inside inline scripts
  html = html.replace(new RegExp('(["\'`])/' + ASSETS + '/', 'g'), (_m, q) => `${q}${d === 0 ? './' : '../'.repeat(d)}${ASSETS}/`);
  // root marker + runtime link shim, first thing in <head>
  html = html.replace(/<head>/, `<head><meta name="ae-root" content="${'../'.repeat(d)}"><script>${SHIM}</script>`);
  writeFileSync(file, html);
  pages++;
}

// self-check: no root-absolute internal references left in any HTML
const leaks = [];
for (const f of walk(OUT).filter((x) => x.endsWith('.html'))) {
  const h = readFileSync(f, 'utf8');
  for (const m of h.matchAll(/\s(?:href|src|component-url|renderer-url)="(\/(?!\/)[^"]*)"/g)) {
    // links created by React at runtime are not in the HTML; static ones must all be relative
    leaks.push(`${f}: ${m[1]}`);
  }
}
if (leaks.length) { console.error('Root-absolute URLs left:\n' + leaks.slice(0, 10).join('\n')); process.exit(1); }
console.log(`Static bundle: ${pages} pages, ${walk(OUT).length} files in ${OUT}/ (all links relative)`);
