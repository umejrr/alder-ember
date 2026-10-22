// Browser journey checks against a running build (npm run build && scripts/serve-dist.sh start).
// The enquiry API rate-limits by address (5 per window), so restart the server between runs.
//   node tests/e2e/journey.mjs [baseUrl]
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const base = process.argv[2] || 'http://127.0.0.1:4321';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
let passed = 0;
const step = async (name, fn) => {
  try { await fn(); passed++; console.log('PASS', name); }
  catch (e) { console.log('FAIL', name, '\n   ', e.message.split('\n').slice(0, 4).join(' | ')); process.exitCode = 1; }
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
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  // only the visible model's image is in the page until a visitor shows interest in another
  assert.equal(await page.locator('.fyf__img').count(), 1, 'the other models must not be loaded up front');
  // the stage keeps a fixed aspect ratio, whatever the height of the text beside it
  const stage = await page.locator('.fyf__stage').boundingBox();
  assert.ok(Math.abs(stage.width / stage.height - 1.5) < 0.02, `stage ratio is ${stage.width / stage.height}`);
  await tab('Ember').click();
  const panel = page.getByRole('tabpanel');
  await panel.getByText('From £18,950').waitFor();
  assert.equal(await panel.getByRole('link', { name: /Explore the Ember/ }).getAttribute('href'), '/saunas/ember');
  assert.match(await panel.getByRole('link', { name: /Plan your Ember/ }).getAttribute('href'), /plan-your-sauna\?model=ember/);
  assert.equal(new URL(page.url()).pathname, '/', 'tabs must not navigate');
  // image, facts and links agree: the active image is the Ember's, and the panel names the Ember
  await page.waitForFunction(() => document.querySelector('.fyf__img.is-active img')?.getAttribute('alt')?.length > 0);
  assert.equal(await page.locator('.fyf').getAttribute('data-model'), 'ember');
  const activeSrc = await page.locator('.fyf__img.is-active img').evaluate((i) => i.currentSrc || i.src);
  assert.match(activeSrc, /ember-exterior/, "the active image must be the Ember's own photograph");
  const tag = page.locator('.fyf__img.is-active .pic__tag'); // an unapproved image carries a label; if there is one it must not name another model
  if (await tag.count()) assert.doesNotMatch(await tag.innerText(), /not the (rowan|alder)/i);
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

await step('Enquiry: inline errors + summary, input preserved, honest not-sent result', async () => {
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
  await page.getByText('Your enquiry has not been sent').waitFor();
  assert.ok(!(await page.content()).includes('We’ve received your enquiry'), 'an unconnected form must not claim receipt');
});

await step('Gallery: no lightbox, three large tiles spanning the gallery, buttons and tiles select the image', async () => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(base + '/saunas/alder', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  const gallery = page.getByRole('group', { name: /The Alder images/ });
  assert.equal(await page.getByRole('dialog').count(), 0, 'there is no enlarged view: with three images the tiles are the gallery');
  assert.equal(await gallery.getByRole('button', { name: /View larger/ }).count(), 0, 'no "View larger" button');
  // the tiles span the full width of the gallery and are large enough to judge a photograph
  const stage = await gallery.locator('.gal__stage').boundingBox();
  const tiles = await gallery.locator('.gal__thumb').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
  assert.equal(tiles.length, 3);
  assert.ok(Math.abs(tiles[0].left - stage.x) < 1.5, 'the first tile starts where the main image starts');
  assert.ok(Math.abs(tiles[2].right - (stage.x + stage.width)) < 1.5, 'the last tile ends where the main image ends');
  for (const t of tiles) assert.ok(t.width >= 200 && t.height >= 120, `tile is ${Math.round(t.width)} x ${Math.round(t.height)}`);
  // beside the decision panel both columns end on one line
  const col = await page.locator('.product-top__gallery').boundingBox();
  const panel = await page.locator('.product-top__panel').boundingBox();
  assert.ok(Math.abs(col.y + col.height - (panel.y + panel.height)) < 2, 'the gallery and the decision panel end together');
  await gallery.getByRole('button', { name: 'Next image' }).click();
  await gallery.locator('.gal__count').getByText('2 / 3').waitFor();
  await gallery.getByRole('button', { name: /Show image 3 of 3/ }).click();
  await gallery.locator('.gal__count').getByText('3 / 3').waitFor();
  assert.equal(await gallery.getByRole('button', { name: /Show image 3 of 3/ }).getAttribute('aria-current'), 'true');
});
await step('Gallery: one arrow key press moves exactly one image, and wraps (audit A03)', async () => {
  await page.goto(base + '/saunas/rowan', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  const gallery = page.getByRole('group', { name: /The Rowan images/ });
  const count = gallery.locator('.gal__count');
  await count.getByText('1 / 3').waitFor();
  await gallery.getByRole('button', { name: 'Next image' }).focus();
  await page.keyboard.press('ArrowRight');
  assert.equal((await count.innerText()).trim(), '2 / 3', 'ArrowRight must advance one image');
  await page.keyboard.press('ArrowLeft');
  assert.equal((await count.innerText()).trim(), '1 / 3', 'ArrowLeft must go back one image');
  await page.keyboard.press('ArrowLeft');
  assert.equal((await count.innerText()).trim(), '3 / 3', 'ArrowLeft from the first image wraps to the last');
  await gallery.getByRole('button', { name: /Show image 3 of 3/ }).focus();
  await page.keyboard.press('ArrowLeft');
  assert.equal((await count.innerText()).trim(), '2 / 3');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  assert.equal((await count.innerText()).trim(), '1 / 3', 'two presses, two images');
});
await step('Sticky left columns stay in view beside long content, and every chapter has its own vertical padding', async () => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const [route, sel] of [['/installation-delivery', '#prepare'], ['/commercial', '#enquire'], ['/saunas/alder', '#specifications']]) {
    await page.goto(base + route, { waitUntil: 'networkidle' });
    const side = page.locator(`${sel} .side`);
    assert.equal(await side.evaluate((e) => getComputedStyle(e).position), 'sticky', `${route} ${sel} must have a sticky left column`);
    const want = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const header = parseFloat(root.getPropertyValue('--header-h'));
      return header + 32 + (document.querySelector('[data-local-nav]') ? 48 + 2 : 0); // the header, 2rem, and the local navigation on a model page
    });
    const top = await page.locator(sel).evaluate((e) => e.getBoundingClientRect().top + window.scrollY);
    await page.evaluate((y) => window.scrollTo(0, y), top + 120);
    await page.waitForTimeout(150);
    const box = await side.boundingBox();
    assert.ok(Math.abs(box.y - want) < 4, `${route} ${sel}: the left column sits at ${Math.round(box.y)}px, expected about ${Math.round(want)}px`);
  }
  // every section that is a dark photographic chapter or an ordinary section keeps its own vertical padding
  await page.goto(base + '/saunas/rowan', { waitUntil: 'networkidle' });
  const pad = await page.locator('#overview').evaluate((e) => parseFloat(getComputedStyle(e).paddingTop));
  assert.ok(pad >= 64, `the "Why the Rowan" chapter has ${pad}px of top padding`);
  const sides = await page.locator('.side').count();
  assert.ok(sides >= 3, 'the left column is marked on the model page');
});
await step('Enquiry: changing the model reconciles the heating preference (audit A04)', async () => {
  await page.goto(base + '/plan-your-sauna?model=ember&heating=wood', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('#enq-model').inputValue(), 'ember');
  assert.equal(await page.locator('#enq-heating').inputValue(), 'wood');
  await page.selectOption('#enq-model', 'rowan');
  assert.equal(await page.locator('#enq-heating').inputValue(), 'advice', 'wood-burning must not survive a move to the Rowan');
  assert.match(await page.locator('.enq__note').innerText(), /not offered on The Rowan/);
  assert.equal(await page.locator('#enq-heating option[value=wood]').isDisabled(), true);
  // an incoming URL that contradicts itself is reconciled too
  await page.goto(base + '/plan-your-sauna?model=rowan&heating=wood', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('#enq-heating').inputValue(), 'advice');
  assert.match(await page.locator('.enq__note').innerText(), /not offered on The Rowan/);
});

await step('Carried preferences are visible, editable, and the confirmation uses the edited values (audit A05)', async () => {
  await page.goto(base + '/compare#selector', { waitUntil: 'networkidle' });
  await page.locator('#selector').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  await page.selectOption('#sel-people', '6');
  await page.locator('.sel').getByLabel('I would like one').check();
  await page.getByRole('button', { name: 'Show a starting point' }).click();
  await page.locator('.sel__result').getByRole('heading', { name: 'The Ember' }).waitFor();
  await page.locator('.sel__result').getByRole('link', { name: /Plan your Ember/ }).click();
  await page.waitForURL(/plan-your-sauna\?/);
  assert.equal(await page.locator('#enq-people').inputValue(), '6');
  assert.equal(await page.locator('#enq-changingArea').inputValue(), 'yes');
  await page.selectOption('#enq-people', '4');
  await page.selectOption('#enq-changingArea', 'no');
  await page.fill('#enq-name', 'Sam Taylor'); await page.fill('#enq-email', 'sam@example.com'); await page.fill('#enq-postcode', 'SW1A 1AA');
  await page.fill('#enq-description', 'A flat lawn behind the house with side access.');
  await page.waitForTimeout(2300);
  await page.getByRole('button', { name: 'Send your enquiry' }).click();
  await page.getByText('Your enquiry has not been sent').waitFor();
  const summary = await page.locator('.enq__summary').innerText();
  assert.match(summary, /Usual number of people: 4/);
  assert.ok(!/changing area/i.test(summary.replace(/Does not need a changing area/i, '')), 'the old changing-area answer must not come back');
});

await step('Clear these preferences also clears the URL, and unrelated parameters survive (audit A06)', async () => {
  await page.goto(base + '/plan-your-sauna?model=ember&heating=electric&people=5&utm_source=newsletter#top', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('#enq-model').inputValue(), 'ember');
  await page.getByRole('button', { name: 'Clear these preferences' }).click();
  const u = new URL(page.url());
  for (const k of ['model', 'heating', 'people', 'use', 'changing']) assert.equal(u.searchParams.has(k), false, `${k} should be gone from the URL`);
  assert.equal(u.searchParams.get('utm_source'), 'newsletter');
  assert.equal(u.hash, '#top');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('#enq-model').inputValue(), '', 'a cleared model must not come back on reload');
  assert.equal(await page.locator('#enq-heating').inputValue(), '');
  assert.equal(await page.locator('#enq-people').inputValue(), '');
});

await step('Product page: a heating preference carried from another model is changed in the open (audit A04)', async () => {
  await page.goto(base + '/saunas/ember', { waitUntil: 'networkidle' });
  await page.evaluate(() => sessionStorage.setItem('ae-prefs-v1', 'model=ember&heating=wood'));
  await page.goto(base + '/saunas/rowan', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  const note = page.locator('.ppanel__heat-note');
  await note.getByText(/not offered on The Rowan/).waitFor();
  assert.equal(await page.locator('.ppanel__heat-opt.is-off input').isDisabled(), true);
  assert.match(await page.locator('[data-enquiry-cta]').getAttribute('href'), /heating=advice/, 'the enquiry link must carry the reconciled preference');
  assert.doesNotMatch(await page.locator('[data-enquiry-cta]').getAttribute('href'), /heating=wood/);
});

await step('Selector: a result never outlives the answers that produced it (audit A08)', async () => {
  await page.goto(base + '/compare#selector', { waitUntil: 'networkidle' });
  await page.locator('#selector').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  await page.selectOption('#sel-people', '6');
  await page.getByRole('button', { name: 'Show a starting point' }).click();
  const result = page.locator('.sel__result');
  await result.getByRole('heading', { name: 'The Ember' }).waitFor();
  const plan = result.getByRole('link', { name: /Plan your Ember/ });
  assert.match(await plan.getAttribute('href'), /model=ember/);
  await page.selectOption('#sel-people', '2'); // the answers change, the old result is now outdated
  await result.getByText('Your answers have changed since this starting point').waitFor();
  assert.equal(await plan.isVisible(), false, 'outdated result must not offer actions');
  await result.getByRole('button', { name: 'Update the starting point' }).click();
  await result.getByRole('heading', { name: 'The Rowan' }).waitFor();
  assert.match(await result.getByRole('link', { name: /Plan your Rowan/ }).getAttribute('href'), /model=rowan/);
  assert.equal(await result.getByText('Your answers have changed').count(), 0);
});

await step('Reveal: content stays visible when the reveal script fails or is blocked (audit A10)', async () => {
  // 1. script throws at the first use of IntersectionObserver
  const c1 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p1 = await c1.newPage();
  await p1.addInitScript(() => { window.IntersectionObserver = function () { throw new Error('blocked for test'); }; });
  await p1.goto(base + '/', { waitUntil: 'networkidle' });
  assert.equal(await p1.evaluate(() => document.documentElement.classList.contains('reveal-armed')), false, 'must not arm when setup fails');
  const hidden1 = await p1.evaluate(() => [...document.querySelectorAll('.reveal')].filter((e) => getComputedStyle(e).opacity !== '1').length);
  assert.equal(hidden1, 0, 'every .reveal element must be visible');
  await c1.close();
  // 2. no JavaScript at all
  const c2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
  const p2 = await c2.newPage();
  await p2.goto(base + '/', { waitUntil: 'load' });
  const hidden2 = await p2.evaluate(() => [...document.querySelectorAll('.reveal')].filter((e) => getComputedStyle(e).opacity !== '1').length).catch(() => null);
  if (hidden2 !== null) assert.equal(hidden2, 0);
  assert.ok(await p2.getByRole('heading', { level: 1 }).isVisible(), 'the headline must be visible without JavaScript');
  assert.ok(await p2.locator('.intro__statement').first().isVisible(), 'below-the-fold copy must be visible without JavaScript');
  await c2.close();
  // 3. reduced motion
  const c3 = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const p3 = await c3.newPage();
  await p3.goto(base + '/', { waitUntil: 'networkidle' });
  const hidden3 = await p3.evaluate(() => [...document.querySelectorAll('.reveal')].filter((e) => getComputedStyle(e).opacity !== '1').length);
  assert.equal(hidden3, 0, 'reduced motion shows the final state');
  await c3.close();
});

await step('Compare (desktop): a comparison keeps two models and says why', async () => {
  await page.goto(base + '/compare', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'The Rowan', exact: true }).waitFor();
  await page.getByRole('button', { name: 'The Rowan', exact: true }).click(); // 3 -> 2
  assert.equal(await page.locator('.cmp-table thead th').count(), 2);
  await page.getByRole('button', { name: 'The Alder', exact: true }).click(); // cannot go below two
  assert.equal(await page.locator('.cmp-table thead th').count(), 2);
  assert.match(await page.locator('#cmp-hint').innerText(), /at least two models/i);
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

await step('Mobile compare: two explicit selectors, swap on a clash, price context beside each price (audit A11)', async () => {
  await mp.goto(base + '/compare', { waitUntil: 'networkidle' });
  const a = mp.locator('#cmp-pick-0');
  const b = mp.locator('#cmp-pick-1');
  await a.waitFor();
  assert.equal(await a.inputValue(), 'rowan');
  assert.equal(await b.inputValue(), 'alder');
  await a.selectOption('alder'); // clashes with the other slot: they swap, and the page says so
  assert.equal(await a.inputValue(), 'alder');
  assert.equal(await b.inputValue(), 'rowan');
  assert.match(await mp.locator('#cmp-hint').innerText(), /moved across/);
  const price = mp.locator('.cmp-stack section').filter({ has: mp.getByRole('heading', { name: 'Starting price' }) });
  assert.equal(await price.locator('.cmp__sub').count(), 2, 'each price carries its own qualification');
  assert.match(await price.innerText(), /Delivery and installation/);
});

await browser.close();
console.log(`\n${passed} steps passed`);
