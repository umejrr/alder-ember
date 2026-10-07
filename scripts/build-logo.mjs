// Builds the Alder & Ember logo system into public/brand/.
//   npm run logo
//
// - Wordmark letters are outlined from Newsreader (SIL OFL 1.1) so the distribution SVGs
//   need no font installed. The live-text editable source is written alongside them.
// - The symbol and ampersand are original geometry from scripts/logo/geometry.mjs.
// - PNG favicons are rendered with the pre-installed Chromium.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as fontkit from 'fontkit';
import { chromium } from 'playwright';
import { faviconC, symbolA, symbolB, symbolC } from './logo/geometry.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'public', 'brand');
mkdirSync(join(out, 'explorations'), { recursive: true });

const roman = fontkit.openSync(join(here, 'logo/fonts/Newsreader-logo-normal.ttf'));
const italic = fontkit.openSync(join(here, 'logo/fonts/Newsreader-logo-italic.ttf'));

const C = {
  charcoal: '#252824',
  canvas: '#F4F0E8',
  ember: '#A54F32',
  emberOnDark: '#E8A07F',
};

const r = (n) => Math.round(n * 100) / 100;

/** Outline a string. Cap height = 100 units. Returns { d, w, scale }. */
function typeset(font, str, { x = 0, y = 100, tracking = 0.012, upper = false, size = 100 } = {}) {
  const s = upper ? str.toUpperCase() : str;
  const scale = size / font.capHeight;
  const run = font.layout(s);
  let cx = x;
  let d = '';
  run.glyphs.forEach((g, i) => {
    const pos = run.positions[i];
    const path = g.path.transform(scale, 0, 0, -scale, cx + (pos.xOffset || 0) * scale, y - (pos.yOffset || 0) * scale);
    d += path.toSVG();
    cx += pos.xAdvance * scale + tracking * font.unitsPerEm * scale;
  });
  return { d, w: cx - x - tracking * font.unitsPerEm * scale };
}

/** Wordmark "Alder & Ember". The ampersand is Newsreader Italic's, set at cap height. */
function wordmarkC({ x = 0, y = 100, tracking = 0.012, size = 100 } = {}) {
  const gap = size * 0.25;
  const a = typeset(roman, 'Alder', { x, y, tracking, size });
  const amp = typeset(italic, '&', { x: x + a.w + gap, y, tracking: 0, size });
  const e = typeset(roman, 'Ember', { x: x + a.w + gap + amp.w + gap, y, tracking, size });
  return {
    inner: `<path d="${a.d}"/><path d="${amp.d}"/><path d="${e.d}"/>`,
    w: a.w + gap + amp.w + gap + e.w,
    parts: { a, amp, e },
  };
}

function parts(sym, k, ox, oy, fillBase, fillAccent) {
  const t = `transform="translate(${r(ox)} ${r(oy)}) scale(${k})"`;
  return `<g ${t}><path fill="${fillBase}" d="${sym.base.join('')}"/><path fill="${fillAccent}" d="${sym.accent.join('')}"/></g>`;
}

const fills = {
  currentColor: { base: 'currentColor', accent: 'var(--logo-accent, currentColor)', text: 'currentColor' },
  dark: { base: C.charcoal, accent: C.charcoal, text: C.charcoal },
  light: { base: C.canvas, accent: C.canvas, text: C.canvas },
  brand: { base: C.charcoal, accent: C.ember, text: C.charcoal },
  'brand-on-dark': { base: C.canvas, accent: C.emberOnDark, text: C.canvas },
};

const xml = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const svgWrap = (vb, inner, title, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${xml(title)}"${extra}>\n<title>${xml(title)}</title>\n${inner}\n</svg>\n`;

// ---- Final lockups (direction C) ------------------------------------------------------
function horizontal(f) {
  const symH = 118;
  const k = symH / 64;
  const wm = wordmarkC({ x: symH + 38, y: 100 });
  // vertically centre the symbol on the cap-height band (y 0..100)
  const symY = 50 - symH / 2;
  const inner =
    parts(symbolC, k, 0, symY, f.base, f.accent) + `<g fill="${f.text}">${wm.inner}</g>`;
  const top = Math.min(symY, -12);
  const h = Math.max(symY + symH, 100 + 28) - top;
  return svgWrap(`0 ${r(top)} ${r(symH + 38 + wm.w)} ${r(h)}`, inner, 'Alder & Ember');
}

function compact(f) {
  const symH = 112;
  const k = symH / 64;
  const x0 = symH + 26;
  const size = 44;
  const l1 = wordmarkLine('Alder', '&', x0, 48, size);
  const l2 = typeset(roman, 'Ember', { x: x0, y: 112, tracking: 0.012, size });
  const inner =
    parts(symbolC, k, 0, 0, f.base, f.accent) +
    `<g fill="${f.text}">${l1.inner}<path d="${l2.d}"/></g>`;
  const w = x0 + Math.max(l1.w, l2.w);
  return svgWrap(`0 -4 ${r(w)} ${symH + 8}`, inner, 'Alder & Ember');
}

/** "Alder &" on one line (used by the compact lockup). */
function wordmarkLine(word, ampChar, x, y, size) {
  const a = typeset(roman, word, { x, y, tracking: 0.012, size });
  const amp = typeset(italic, ampChar, { x: x + a.w + size * 0.25, y, tracking: 0, size });
  return { inner: `<path d="${a.d}"/><path d="${amp.d}"/>`, w: a.w + size * 0.25 + amp.w };
}

function symbolOnly(f, sym = symbolC) {
  return svgWrap('0 0 64 64', parts(sym, 1, 0, 0, f.base, f.accent), 'Alder & Ember');
}

const written = [];
const write = (name, svg) => {
  writeFileSync(join(out, name), svg);
  written.push(name);
};

const variants = [
  ['', 'currentColor'],
  ['-dark', 'dark'],
  ['-light', 'light'],
  ['-brand', 'brand'],
  ['-brand-on-dark', 'brand-on-dark'],
];
for (const [suffix, key] of variants) {
  write(`logo-horizontal${suffix}.svg`, horizontal(fills[key]));
  write(`logo-compact${suffix}.svg`, compact(fills[key]));
  write(`symbol${suffix}.svg`, symbolOnly(fills[key]));
}

// Favicon: simplified, heavier parts; carries its own background so it works on any tab colour.
const favicon = svgWrap(
  '0 0 64 64',
  `<rect width="64" height="64" rx="8" fill="${C.charcoal}"/>` +
    `<g transform="translate(6 6) scale(0.8125)"><path fill="${C.canvas}" d="${faviconC.base.join('')}"/><path fill="${C.emberOnDark}" d="${faviconC.accent.join('')}"/></g>`,
  'Alder & Ember',
);
write('favicon.svg', favicon);

// Editable source with LIVE text (requires Newsreader installed to preview as intended).
const sourceInner =
  parts(symbolC, 118 / 64, 0, -9, 'currentColor', 'var(--logo-accent, currentColor)') +
  `<text x="${118 + 38}" y="100" font-family="Newsreader, serif" font-size="${r(100 / (roman.capHeight / roman.unitsPerEm))}" letter-spacing="1.2" fill="currentColor">Alder <tspan font-style="italic">&amp;</tspan> Ember</text>`;
write(
  'logo-horizontal.source.svg',
  svgWrap('0 -12 760 140', sourceInner, 'Alder & Ember (editable source: live text, ampersand shown as italic placeholder; final uses the custom outlined ampersand)'),
);

// ---- Three exploration directions ----------------------------------------------------
function directionA() {
  const symH = 104;
  const wmA = typeset(roman, 'Alder', { x: 0, y: 100, tracking: 0.16, upper: true });
  const gap = 26;
  const ampRoman = typeset(roman, '&', { x: wmA.w + gap, y: 100, tracking: 0 });
  const eA = typeset(roman, 'Ember', { x: wmA.w + gap + ampRoman.w + gap, y: 100, tracking: 0.16, upper: true });
  const x0 = symH + 36;
  const inner =
    parts(symbolA, symH / 64, 0, 50 - symH / 2, C.charcoal, C.ember) +
    `<g fill="${C.charcoal}" transform="translate(${x0} 0)"><path d="${wmA.d}"/><path d="${ampRoman.d}"/><path d="${eA.d}"/></g>`;
  const w = x0 + wmA.w + gap + ampRoman.w + gap + eA.w;
  return svgWrap(`0 -6 ${r(w)} 112`, inner, 'Direction A: architectural wordmark');
}
function directionB() {
  const symH = 104;
  const a = typeset(roman, 'Alder', { x: 0, y: 100, tracking: 0.01 });
  const gap = 18;
  const amp2 = typeset(italic, '&', { x: a.w + gap, y: 100, tracking: 0 });
  const e = typeset(roman, 'Ember', { x: a.w + gap + amp2.w + gap, y: 100, tracking: 0.01 });
  const x0 = symH + 34;
  const inner =
    parts(symbolB, symH / 64, 0, 50 - symH / 2, C.charcoal, C.ember) +
    `<g fill="${C.charcoal}" transform="translate(${x0} 0)"><path d="${a.d}"/><path d="${amp2.d}"/><path d="${e.d}"/></g>`;
  const w = x0 + a.w + gap + amp2.w + gap + e.w;
  return svgWrap(`0 -10 ${r(w)} 124`, inner, 'Direction B: timber and warmth');
}
write('explorations/direction-a-architectural-wordmark.svg', directionA());
write('explorations/direction-b-timber-and-warmth.svg', directionB());
write('explorations/direction-c-ae-construction.svg', horizontal(fills.brand));

// ---- PNG exports ---------------------------------------------------------------------
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
async function png(svg, size, file) {
  const sized = svg.replace('<svg ', `<svg width="${size}" height="${size}" `);
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<body style="margin:0;background:transparent">${sized}</body>`);
  await page.locator('svg').screenshot({ path: join(out, file), omitBackground: true });
  written.push(file);
}
for (const s of [16, 32, 48]) await png(favicon, s, `favicon-${s}.png`);
await png(favicon, 180, 'apple-touch-icon.png');
await png(favicon, 512, 'icon-512.png');
await browser.close();

// Every SVG must be well-formed XML, or it breaks when loaded as an <img> or opened in an editor.
const { execFileSync } = await import('node:child_process');
for (const f of written.filter((n) => n.endsWith('.svg'))) {
  try {
    execFileSync('python3', ['-I', '-c', 'import sys,xml.etree.ElementTree as E; E.parse(sys.argv[1])', join(out, f)], { stdio: 'pipe' });
  } catch (e) {
    console.error('INVALID SVG:', f, String(e.stderr || e.message).split('\n').slice(-2).join(' '));
    process.exitCode = 1;
  }
}
console.log('Wrote', written.length, 'files to public/brand/ (all SVGs are well-formed XML)');
