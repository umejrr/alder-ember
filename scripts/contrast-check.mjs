// WCAG 2.x contrast check for the real foreground/background token pairs used in the UI.
// Usage: npm run contrast   (exits non-zero if a pair fails its target)
const tokens = {
  canvas: '#F4F0E8', surface: '#FFFCF7', charcoal: '#252824', muted: '#5B6056',
  timber: '#795B45', ember: '#A54F32', border: '#D8D2C8', forest: '#111C16',
  // derived tokens defined in src/styles/tokens.css
  forestSurface: '#17261E', onForest: '#F4F0E8', onForestMuted: '#C3C8BC',
  emberOnForest: '#E8A07F', emberStrong: '#8F4128', error: '#A3261A',
};
const lum = (hex) => {
  const c = hex.replace('#', '').match(/../g).map((h) => parseInt(h, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};
// [foreground, background, minimum, usage]
const pairs = [
  ['charcoal', 'canvas', 4.5, 'body text on canvas'],
  ['charcoal', 'surface', 4.5, 'body text on surface'],
  ['muted', 'canvas', 4.5, 'supporting text on canvas'],
  ['muted', 'surface', 4.5, 'supporting text on surface'],
  ['timber', 'canvas', 4.5, 'timber labels on canvas'],
  ['ember', 'canvas', 4.5, 'ember small text on canvas'],
  ['ember', 'surface', 4.5, 'ember small text on surface'],
  ['emberStrong', 'canvas', 4.5, 'ember text (stronger) on canvas'],
  ['canvas', 'charcoal', 4.5, 'button label on charcoal'],
  ['onForest', 'forest', 4.5, 'text on forest chapter'],
  ['onForestMuted', 'forest', 4.5, 'supporting text on forest'],
  ['onForest', 'forestSurface', 4.5, 'text on raised forest surface'],
  ['onForestMuted', 'forestSurface', 4.5, 'supporting text on raised forest surface'],
  ['emberOnForest', 'forest', 4.5, 'ember accent text on forest'],
  ['error', 'canvas', 4.5, 'error text on canvas'],
  ['error', 'surface', 4.5, 'error text on surface'],
  ['muted', 'surface', 3.0, 'form control border on surface'],
  ['border', 'canvas', 1.0, 'decorative divider (non-text, informational only)'],
  ['timber', 'canvas', 3.0, 'focus ring / UI component boundary'],
  ['charcoal', 'canvas', 3.0, 'form control boundary'],
];
let failed = 0;
for (const [f, b, min, use] of pairs) {
  const r = ratio(tokens[f], tokens[b]);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  (min ${min})  ${f} on ${b} — ${use}`);
}
process.exit(failed ? 1 : 0);
