// Verifies the static bundle works from a nested sub-path with NO request escaping that prefix.
//   npm run e2e:static        (builds a bundle anchored to /a/b/c/, then runs this file)
//   LIVE_URL=https://owner.github.io/repo/ node tests/e2e/static-bundle.mjs   (same checks against a real deployment)
// Like GitHub Pages, the local server answers any missing path with 404.html and a 404 status.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const ROOT = process.env.BUNDLE_DIR ? new URL(process.env.BUNDLE_DIR.replace(/\/?$/, '/'), 'file://' + process.cwd() + '/').pathname : new URL('../../dist-static-test/', import.meta.url).pathname;
const PREFIX = '/a/b/c/';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };
const escaped = [];
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (!u.pathname.startsWith(PREFIX)) { if (u.pathname !== '/favicon.ico') escaped.push(u.pathname); // browsers probe /favicon.ico by themselves
 res.statusCode = 404; return res.end('outside prefix'); }
  let p = normalize(join(ROOT, decodeURIComponent(u.pathname.slice(PREFIX.length))));
  if (!p.startsWith(ROOT)) { res.statusCode = 403; return res.end(); }
  try { if ((await stat(p)).isDirectory()) p = join(p, 'index.html'); const b = await readFile(p); res.setHeader('content-type', MIME[extname(p)] || 'application/octet-stream'); res.end(b); }
  catch {
    res.statusCode = 404;
    if (extname(u.pathname)) return res.end('not found'); // a missing file (asset), not a missing page
    try { res.setHeader('content-type', 'text/html'); res.end(await readFile(join(ROOT, '404.html'))); } catch { res.end('not found'); }
  }
});
// LIVE_URL=https://owner.github.io/repo/ runs the same checks against a real deployment instead of the local server
const LIVE = process.env.LIVE_URL ? process.env.LIVE_URL.replace(/\/?$/, '/') : null;
if (!LIVE) await new Promise((r) => server.listen(5055, '127.0.0.1', r));
const base = LIVE ?? `http://127.0.0.1:5055${PREFIX}`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text() + m.location().url)) errors.push('console: ' + m.text() + ' ' + m.location().url); });
page.on('requestfailed', (r) => { if (r.failure()?.errorText !== 'net::ERR_ABORTED') errors.push('requestfailed: ' + r.url() + ' ' + r.failure()?.errorText); }); // aborted = we navigated away mid-load
let passed = 0;
const step = async (name, fn) => { try { await fn(); passed++; console.log('PASS', name); } catch (e) { console.log('FAIL', name, '\n    ', e.message.split('\n')[0], '\n     at', page.url()); process.exitCode = 1; } };

await step('home loads with styles and fonts from the sub-path', async () => {
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  const h1 = await page.locator('h1').first().innerText(); // the kicker is set in capitals by CSS
  assert.match(h1, /premium outdoor saunas/i);
  assert.match(h1, /A quieter moment, just outside/);
  const font = await page.evaluate(() => getComputedStyle(document.querySelector('h1')).fontFamily);
  assert.match(font, /Newsreader/);
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.evaluate(() => document.fonts.check('300 40px "Newsreader Variable"')), true);
});

await step('the model showcase hydrates and works (island scripts load from relative URLs)', async () => {
  await page.locator('#find-your-fit').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  await page.getByRole('tab', { name: /Ember/ }).click();
  await page.getByRole('tabpanel').getByText('From £18,950').waitFor();
});

await step('static links and React-created links both navigate within the bundle', async () => {
  await page.getByRole('link', { name: /Explore the Ember/ }).click(); // created by React: a real href, no click interception
  await page.waitForURL(/saunas\/ember\/index\.html/);
  assert.match(await page.locator('h1').innerText(), /The Ember/);
  await page.locator('.site-nav').getByRole('link', { name: 'Installation & delivery' }).click(); // static, rewritten at build time
  await page.waitForURL(/installation-delivery\/index\.html/);
  await page.getByRole('link', { name: 'Home', exact: true }).first().click().catch(() => {});
});

const underPrefix = (href, from) => new URL(href, from).pathname.startsWith(new URL(base).pathname);

await step('generated links are real hrefs under the project prefix, and open in a new tab (Ctrl-click)', async () => {
  // home model explorer: links change with the selected model
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  await page.locator('#find-your-fit').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  await page.getByRole('tab', { name: /Ember/ }).click();
  const panel = page.getByRole('tabpanel');
  for (const [name, expect_] of [[/Explore the Ember/, /saunas\/ember\/index\.html$/], [/Plan your Ember/, /plan-your-sauna\/index\.html\?model=ember$/], [/Compare models/, /compare\/index\.html\?m=/]]) {
    const href = await panel.getByRole('link', { name }).first().getAttribute('href');
    assert.match(href, expect_, `explorer link ${name}`);
    assert.ok(underPrefix(href, page.url()), `explorer link escapes the prefix: ${href}`);
  }
  // selector result link (created after interaction), opened with a native modified click
  await page.goto(base + 'compare/index.html#selector', { waitUntil: 'networkidle' });
  await page.locator('#selector').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  await page.selectOption('#sel-people', '2');
  await page.locator('.sel').getByLabel('I would like one').check();
  await page.getByRole('button', { name: 'Show a starting point' }).click();
  const link = page.locator('.sel__result').getByRole('link', { name: 'Compare these models' });
  await link.waitFor();
  const href = await link.getAttribute('href');
  assert.ok(underPrefix(href, page.url()) && /compare\/index\.html\?m=/.test(href), `selector link: ${href}`);
  const [popup] = await Promise.all([ctx.waitForEvent('page'), link.click({ modifiers: ['Control'] })]);
  await popup.waitForLoadState('domcontentloaded');
  assert.ok(new URL(popup.url()).pathname.startsWith(new URL(base).pathname), `new tab left the prefix: ${popup.url()}`);
  assert.match(await popup.locator('h1').innerText(), /Compare/);
  await popup.close();
  // the model page panel and compare table links
  await page.goto(base + 'saunas/alder/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  for (const a of await page.locator('a[data-enquiry-cta], .ppanel a').all()) assert.ok(underPrefix(await a.getAttribute('href'), page.url()), 'product panel link escapes the prefix');
  await page.goto(base + 'compare/index.html', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'The Alder', exact: true }).waitFor(); // the comparison island has hydrated
  for (const a of await page.locator('.cmp-table a').all()) assert.ok(underPrefix(await a.getAttribute('href'), page.url()), 'compare table link escapes the prefix');
});

await step('missing pages at any depth return 404 with the branded, styled page and working recovery links', async () => {
  const np = await ctx.newPage(); // its own page: the 404 responses are expected here, not errors
  for (const path of ['qa-missing-page', 'qa-missing-page/', 'qa-missing-page/deep/', 'a/b/c/d/e/missing/', 'saunas/not-a-model']) {
    const res = await np.goto(base + path, { waitUntil: 'networkidle' });
    assert.equal(res.status(), 404, `${path} should be a 404`);
    assert.match(await np.locator('h1').innerText(), /can.t find that page/i, path);
    const font = await np.evaluate(() => getComputedStyle(document.querySelector('h1')).fontFamily);
    assert.match(font, /Newsreader/, `${path}: the stylesheet did not load (font ${font})`);
    const logo = await np.locator('.site-header img, .site-header svg, header img, header svg').first().boundingBox();
    assert.ok(logo && logo.width < 400, `${path}: logo is unstyled (${logo && logo.width}px wide)`);
    for (const a of await np.locator('main a[href]').all()) assert.ok(underPrefix(await a.getAttribute('href'), np.url()), `${path}: recovery link escapes the prefix`);
    await np.getByRole('link', { name: 'Explore the saunas' }).click();
    await np.waitForURL(/saunas\/index\.html$/);
    assert.match(await np.locator('h1').first().innerText(), /./);
  }
  await np.close();
});

await step('every page in the bundle loads without errors', async () => {
  const routes = ['index.html', 'saunas/index.html', 'saunas/rowan/index.html', 'saunas/alder/index.html', 'saunas/ember/index.html', 'compare/index.html', 'installation-delivery/index.html', 'commercial/index.html', 'about/index.html', 'care-support/index.html', 'guides/index.html', 'guides/planning-base-and-access/index.html', 'plan-your-sauna/index.html', 'campaigns/meet-the-alder/index.html', 'privacy/index.html', 'terms/index.html', '404.html'];
  for (const r of routes) {
    const res = await page.goto(base + r, { waitUntil: 'networkidle' });
    assert.equal(res.status(), 200, r);
  }
});

await step('compare and the gallery work on the model page', async () => {
  await page.goto(base + 'compare/index.html', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'The Alder', exact: true }).waitFor();
  assert.equal(await page.locator('.cmp-table thead th').count(), 3);
  await page.goto(base + 'saunas/alder/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  await page.getByRole('button', { name: 'Next image' }).first().click();
  await page.getByText('2 / 3').first().waitFor();
});

await step('enquiry: real validation, then a plain statement that nothing was sent', async () => {
  const requests = [];
  page.on('request', (r) => { if (r.method() === 'POST') requests.push(r.url()); });
  await page.goto(base + 'plan-your-sauna/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  await page.getByRole('button', { name: 'Send your enquiry' }).click();
  await page.getByRole('alert').first().waitFor();
  await page.fill('#enq-name', 'Sam Taylor'); await page.fill('#enq-email', 'sam@example.com'); await page.fill('#enq-postcode', 'SW1A 1AA');
  await page.selectOption('#enq-model', 'alder'); await page.fill('#enq-description', 'A flat lawn behind the house with side access.');
  await page.getByRole('button', { name: 'Send your enquiry' }).click();
  await page.getByText('Your enquiry has not been sent').waitFor();
  assert.deepEqual(requests, [], 'the unconnected static form must not POST anywhere');
});

await step('mobile menu works and nothing escaped the sub-path', async () => {
  const m = await browser.newContext({ viewport: { width: 375, height: 800 }, hasTouch: true });
  const mp = await m.newPage();
  await mp.goto(base + 'index.html', { waitUntil: 'networkidle' });
  await mp.locator('[data-menu-toggle]').click();
  await mp.locator('[data-mobile-nav]').getByRole('link', { name: 'Commercial' }).click();
  await mp.waitForURL(/commercial\/index\.html/);
  assert.deepEqual(escaped, [], 'requests escaped the sub-path: ' + escaped.join(', '));
});

await step('no console, page or network errors', async () => { assert.deepEqual(errors, [], errors.slice(0, 6).join(' | ')); });

await browser.close(); if (!LIVE) server.close();
console.log(`\n${passed} steps passed`);
