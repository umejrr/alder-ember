// Crawl a running build and report broken internal links, missing anchors and missing images.
//   scripts/serve-dist.sh start && node scripts/crawl-dist.mjs [baseUrl]
const base = process.argv[2] || 'http://127.0.0.1:4321';
const seen = new Map();
const queue = ['/'];
const broken = [];
const badAnchors = [];
const idsByPage = new Map();

const attr = (html, tag, name) => [...html.matchAll(new RegExp(`<${tag}\\b[^>]*?\\s${name}="([^"]*)"`, 'gi'))].map((m) => m[1]);

while (queue.length) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  const res = await fetch(base + path, { redirect: 'follow' });
  seen.set(path, res.status);
  const type = res.headers.get('content-type') || '';
  if (res.status >= 400 && path !== '/__404') { broken.push(`${res.status} ${path}`); continue; }
  if (!type.includes('text/html')) continue;
  const html = await res.text();
  idsByPage.set(path, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  for (const href of attr(html, 'a', 'href')) {
    if (/^(mailto:|tel:|https?:)/.test(href)) continue;
    const [p, hash] = href.split('#');
    const target = p === '' ? path : new URL(p, base + path).pathname.replace(/\/$/, '') || '/';
    if (!seen.has(target) && !queue.includes(target)) queue.push(target);
    if (hash) badAnchors.push([path, target, hash]);
  }
  for (const src of [...attr(html, 'img', 'src'), ...attr(html, 'link', 'href')]) {
    if (/^(https?:|data:)/.test(src)) continue;
    const t = new URL(src, base + path).pathname;
    if (!seen.has(t)) { const r = await fetch(base + t); seen.set(t, r.status); if (r.status >= 400) broken.push(`${r.status} ${t} (asset on ${path})`); }
  }
}
for (const [from, target, hash] of badAnchors) {
  const ids = idsByPage.get(target);
  if (ids && !ids.has(hash)) broken.push(`missing anchor #${hash} on ${target} (linked from ${from})`);
}
console.log(`Crawled ${[...seen.keys()].filter((p) => idsByPage.has(p)).length} pages.`);
if (broken.length) { console.log('BROKEN:\n' + broken.map((b) => '  ' + b).join('\n')); process.exit(1); }
console.log('No broken internal links, anchors or assets.');
