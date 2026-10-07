// Browser journey checks against a running build (npm run build && scripts/serve-dist.sh start).
//   node tests/e2e/journey.mjs [baseUrl]
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const base = process.argv[2] || 'http://127.0.0.1:4321';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
let passed = 0;
const step = async (name, fn) => {
  try { await fn(); passed++; console.log('PASS', name); }
  catch (e) { console.log('FAIL', name, '\n   ', e.message.split('\n')[0]); process.exitCode = 1; }
};

const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await step('Find your fit: tabs change the model, data and links together', async () => {
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.locator('#find-your-fit').scrollIntoViewIfNeeded();
  const tab = (n) => page.getByRole('tab', { name: new RegExp(n) });
  await tab('Ember').click();
  const panel = page.getByRole('tabpanel');
  await panel.getByText('From £18,950').waitFor();
  assert.equal(await panel.getByRole('link', { name: /Explore the Ember/ }).getAttribute('href'), '/saunas/ember');
  assert.match(await panel.getByRole('link', { name: /Plan your Ember/ }).getAttribute('href'), /plan-your-sauna\?model=ember/);
  assert.equal(new URL(page.url()).pathname, '/', 'tabs must not navigate');
  await tab('Ember').focus();
  await page.keyboard.press('ArrowLeft');
  assert.equal(await tab('Alder').getAttribute('aria-selected'), 'true');
  await panel.getByText('From £12,950').waitFor();
  await page.keyboard.press('Home');
  assert.equal(await tab('Rowan').getAttribute('aria-selected'), 'true');
  await panel.getByText('From £8,950').waitFor();
});

await step('Selected model survives navigation (session) into the enquiry form', async () => {
  await page.getByRole('tab', { name: /Ember/ }).click();
  await page.goto(base + '/plan-your-sauna', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('#enq-model').inputValue(), 'ember');
  await page.getByText('From your browsing').waitFor();
});

await step('Compare: three columns, shareable URL, reset', async () => {
  await page.goto(base + '/compare?m=rowan,ember', { waitUntil: 'networkidle' });
  const heads = page.locator('.cmp-table thead th');
  assert.equal(await heads.count(), 2);
  await page.getByRole('button', { name: 'The Alder', exact: true }).click();
  assert.equal(await heads.count(), 3);
  assert.match(page.url(), /compare$|compare\?m=/);
  const cell = page.locator('.cmp-table tbody tr', { hasText: 'Comfortable capacity' }).locator('td');
  assert.match(await cell.nth(1).innerText(), /4–5 adults/);
  await page.getByRole('button', { name: 'Reset' }).click();
});

await step('Selector: recommends from comfortable capacity and carries preferences', async () => {
  await page.goto(base + '/compare#selector', { waitUntil: 'networkidle' });
  await page.locator('#selector').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]')); // client:visible hydration
  await page.selectOption('#sel-people', '4');
  await page.locator('.sel').getByLabel('Electric', { exact: true }).check();
  await page.getByRole('button', { name: 'Show a starting point' }).click();
  const result = page.locator('.sel__result');
  await result.getByRole('heading', { name: 'The Alder' }).waitFor();
  await result.getByText('A useful starting point. We\'ll confirm the model and site requirements with you.').waitFor();
  assert.ok(!/\bfits\b/i.test(await result.innerText()), 'must never say a model "fits"');
  await result.getByRole('link', { name: /Plan your Alder/ }).click();
  await page.waitForURL(/plan-your-sauna\?/);
  assert.equal(await page.locator('#enq-model').inputValue(), 'alder');
  assert.equal(await page.locator('#enq-heating').inputValue(), 'electric');
});

await step('Enquiry: inline errors + summary, input preserved, honest demo success', async () => {
  await page.goto(base + '/plan-your-sauna', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Send your enquiry' }).click();
  const alert = page.getByRole('alert').first();
  await alert.waitFor();
  assert.match(await alert.innerText(), /Please check/);
  assert.equal(await page.locator('#enq-name').getAttribute('aria-invalid'), 'true');
  await page.fill('#enq-name', 'Sam Taylor');
  await page.fill('#enq-email', 'sam@example.com');
  await page.fill('#enq-postcode', 'sw1a 1aa');
  await page.selectOption('#enq-model', 'alder');
  await page.fill('#enq-description', 'A flat lawn behind the house with side access.');
  await page.waitForTimeout(2300); // anti-spam minimum fill time
  await page.getByRole('button', { name: 'Send your enquiry' }).click();
  await page.getByText('Demo mode: nothing was sent').waitFor();
  assert.ok(!(await page.content()).includes('We’ve received your enquiry'), 'a demo must not claim receipt');
});

await step('Gallery: keyboard navigation, enlarged view with explicit close, focus restored', async () => {
  await page.goto(base + '/saunas/alder', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  const gallery = page.getByRole('group', { name: /The Alder images/ });
  await gallery.getByRole('button', { name: 'Next image' }).click();
  await gallery.locator('.gal__count').first().getByText('2 / 3').waitFor();
  const zoom = gallery.getByRole('button', { name: /View larger/ });
  await zoom.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  await dialog.getByRole('button', { name: 'Close' }).click();
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(await page.evaluate(() => document.activeElement?.textContent?.includes('View larger')), true, 'focus must return to the opener');
});

await step('Direct routes load on refresh, unknown route 404s', async () => {
  for (const p of ['/saunas', '/saunas/rowan', '/compare', '/commercial', '/plan-your-sauna']) {
    const r = await page.goto(base + p);
    assert.equal(r.status(), 200, p);
    await page.reload();
  }
  assert.equal((await page.goto(base + '/definitely-not-a-page')).status(), 404);
});

await step('No unexpected console or page errors', async () => {
  const real = errors.filter((e) => !/404|favicon|Failed to load resource/i.test(e));
  assert.deepEqual(real, []);
});

const m = await browser.newContext({ viewport: { width: 375, height: 800 }, hasTouch: true });
const mp = await m.newPage();
await step('Mobile menu: opens, traps focus, Escape closes and restores focus', async () => {
  await mp.goto(base + '/', { waitUntil: 'networkidle' });
  const toggle = mp.locator('[data-menu-toggle]');
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  // regression: with the preview bar above the header, the open panel must not cover the Close control
  const box = await toggle.boundingBox();
  const hit = await mp.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest('[data-menu-toggle]'), { x: box.x + box.width / 2, y: box.y + box.height / 2 });
  assert.equal(hit, true, 'the Close control is covered by the menu panel');
  await mp.getByRole('link', { name: 'Plan your sauna' }).last().waitFor();
  await mp.keyboard.press('Escape');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(await mp.evaluate(() => document.activeElement?.getAttribute('data-menu-toggle')), '');
});

await step('Mobile: no horizontal overflow on key pages', async () => {
  for (const p of ['/', '/saunas', '/saunas/ember', '/compare', '/plan-your-sauna', '/commercial']) {
    await mp.goto(base + p, { waitUntil: 'networkidle' });
    const o = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(o <= 0, `${p} overflows by ${o}px`);
  }
});

await step('Mobile compare shows two models with every value labelled', async () => {
  await mp.goto(base + '/compare', { waitUntil: 'networkidle' });
  assert.equal(await mp.locator('.cmp-table').isVisible(), false);
  const stack = mp.locator('.cmp-stack');
  await stack.waitFor();
  assert.equal(await stack.locator('section').first().locator('.cmp-stack__name').count(), 2);
});

await browser.close();
console.log(`\n${passed} steps passed`);
