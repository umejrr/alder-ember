// Builds the downloadable copies of the photography brief (PDF and Word) from docs/photo-brief.md and docs/hero-photo-brief.md.
//   node scripts/build-brief.mjs [outDir]        (needs pandoc and python-docx; Chromium comes from CHROMIUM_PATH or the Playwright install)
// The Markdown files stay the source of truth. The hero brief is added as Appendix A, links between the two become plain words,
// and the PDF uses the site's own fonts so it looks like the same brand.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(import.meta.dirname, '..');
const outDir = resolve(process.argv[2] || join(root, 'docs'));
const name = 'Alder-and-Ember-Photography-Brief';
const font = (pkg, file) => `file://${join(root, 'node_modules', '@fontsource-variable', pkg, 'files', file)}`;

const main = readFileSync(join(root, 'docs/photo-brief.md'), 'utf8').replace(/^# .*\n+/, '');
const hero = readFileSync(join(root, 'docs/hero-photo-brief.md'), 'utf8').replace(/^# .*\n+/, '');
const plain = (s) =>
  s.replace(/\[hero-photo-brief\.md\]\(hero-photo-brief\.md\)/g, 'Appendix A').replace(/\[photo-brief\.md\]\(photo-brief\.md\)/g, 'the main brief');
const combined = `${plain(main)}\n\n<div class="page-break"></div>\n\n# Appendix A: the hero photograph\n\n${plain(hero)}`;

const css = `
@font-face { font-family: 'Manrope'; src: url('${font('manrope', 'manrope-latin-wght-normal.woff2')}'); font-weight: 200 800; }
@font-face { font-family: 'Newsreader'; src: url('${font('newsreader', 'newsreader-latin-wght-normal.woff2')}'); font-weight: 200 800; font-style: normal; }
@font-face { font-family: 'Newsreader'; src: url('${font('newsreader', 'newsreader-latin-wght-italic.woff2')}'); font-weight: 200 800; font-style: italic; }
@page { size: A4; margin: 17mm 15mm 19mm; }
* { box-sizing: border-box; }
html { font-size: 10pt; }
body { font-family: 'Manrope', system-ui, sans-serif; color: #252824; line-height: 1.55; margin: 0; max-width: none; padding: 0; }
header#title-block-header { margin: 0 0 9mm; padding-bottom: 6mm; border-bottom: 1px solid #d8d2c8; }
header#title-block-header .kicker { font-size: 8.5pt; letter-spacing: .18em; text-transform: uppercase; font-weight: 700; color: #8f4128; margin: 0 0 3mm; }
header#title-block-header h1.title { font-family: 'Newsreader', Georgia, serif; font-weight: 400; font-size: 30pt; line-height: 1.08; margin: 0 0 3mm; color: #111c16; }
header#title-block-header .subtitle { font-size: 10.5pt; color: #5b6056; margin: 0; max-width: 150mm; }
header#title-block-header .date { font-size: 9pt; color: #5b6056; margin: 3mm 0 0; }
h1, h2, h3 { font-family: 'Newsreader', Georgia, serif; color: #111c16; font-weight: 500; line-height: 1.15; }
h1 { font-size: 24pt; margin: 0 0 5mm; }
h2 { font-size: 16pt; margin: 9mm 0 3mm; padding-top: 4mm; border-top: 1px solid #d8d2c8; break-after: avoid; }
h3 { font-size: 12.5pt; margin: 6mm 0 2mm; break-after: avoid; }
p, li { orphans: 3; widows: 3; }
p { margin: 0 0 2.6mm; }
ul, ol { margin: 0 0 3mm; padding-left: 5.5mm; }
li { margin: 0 0 1.4mm; }
strong { font-weight: 700; color: #111c16; }
code { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: .92em; background: #f4f0e8; padding: .1em .35em; border-radius: 2px; white-space: nowrap; }
pre { background: #f4f0e8; border: 1px solid #d8d2c8; padding: 3.5mm; font-size: 7.4pt; line-height: 1.35; break-inside: avoid; overflow: hidden; }
pre code { background: none; padding: 0; font-family: 'DejaVu Sans Mono', 'Liberation Mono', monospace; font-weight: 400; white-space: pre; }
table { width: 100%; border-collapse: collapse; margin: 3mm 0 5mm; font-size: 8pt; line-height: 1.4; }
th, td { border: 1px solid #d8d2c8; padding: 1.6mm 2mm; text-align: left; vertical-align: top; overflow-wrap: break-word; }
th { background: #f4f0e8; font-weight: 700; color: #111c16; }
tr { break-inside: avoid; }
td code { white-space: nowrap; }
hr { border: 0; border-top: 1px solid #d8d2c8; margin: 6mm 0; }
.page-break { break-after: page; }
`;

const work = mkdtempSync(join(tmpdir(), 'ae-brief-'));
const md = join(work, 'brief.md');
const html = join(work, 'brief.html');
writeFileSync(md, combined);
writeFileSync(join(work, 'style.css'), css);
const meta = ['--metadata', 'title=Photography brief', '--metadata', 'subtitle=Every image on the site: what the shoot needs to deliver, where each photograph appears, how it is cropped, and what must be in the frame.', '--metadata', 'date=20 October 2026'];
execFileSync('pandoc', [md, '-f', 'gfm', '-t', 'html5', '-s', '--embed-resources', '-c', join(work, 'style.css'), ...meta, '-o', html]);
// pandoc turns the dashes under each table header into equal column widths; let the browser size the columns to their content instead
let page = readFileSync(html, 'utf8').replace(/<colgroup>[\s\S]*?<\/colgroup>/g, '').replace('<header id="title-block-header">', '<header id="title-block-header"><p class="kicker">Alder &amp; Ember</p>');
writeFileSync(html, page);

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const tab = await browser.newPage();
await tab.goto(`file://${html}`, { waitUntil: 'load' });
await tab.evaluate(() => document.fonts.ready);
await tab.pdf({
  path: join(outDir, `${name}.pdf`),
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: `<div style="width:100%;font:7.5pt Helvetica,Arial,sans-serif;color:#5b6056;padding:0 15mm;display:flex;justify-content:space-between"><span>Alder &amp; Ember · Photography brief</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  margin: { top: '17mm', bottom: '19mm', left: '15mm', right: '15mm' },
});
await browser.close();

// the Word copy is for editing and commenting: built from the same HTML, then tables are sized to their content on an A4 page
execFileSync('pandoc', [html, '-f', 'html', '-t', 'docx', ...meta, '-o', join(outDir, `${name}.docx`)]);
execFileSync('python3', [join(root, 'scripts/fit-docx.py'), join(outDir, `${name}.docx`)]);
console.log(`wrote ${join(outDir, name)}.pdf and .docx`);
