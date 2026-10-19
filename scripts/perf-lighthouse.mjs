// Repeatable lab measurements with Lighthouse against a running build. Reports the MEDIAN of several runs, never the best.
//   scripts/serve-dist.sh start && node scripts/perf-lighthouse.mjs [baseUrl] [runs] [outFile.md]
// Lighthouse is fetched on demand by npx (it is not a dependency of the site). Chromium comes from CHROME_PATH or the
// Playwright install. Lab numbers on one machine are a baseline for comparing changes, not field data: see docs/performance.md.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const runs = Number(process.argv[3] || 3);
const out = process.argv[4];
const pages = [['Home', '/'], ['Model (Alder)', '/saunas/alder'], ['Compare', '/compare'], ['Enquiry', '/plan-your-sauna']];
const presets = [['mobile', []], ['desktop', ['--preset=desktop']]];
const chrome = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const dir = mkdtempSync(join(tmpdir(), 'lh-'));
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };

const rows = [];
for (const [label, path] of pages) {
  for (const [preset, flags] of presets) {
    const m = { perf: [], lcp: [], cls: [], tbt: [], bytes: [] };
    for (let i = 0; i < runs; i++) {
      const file = join(dir, `${label}-${preset}-${i}.json`);
      execFileSync('npx', ['--yes', 'lighthouse@12', base + path, '--only-categories=performance', ...flags, '--chrome-flags=--headless=new --no-sandbox', '--output=json', `--output-path=${file}`, '--quiet'], {
        env: { ...process.env, CHROME_PATH: chrome }, stdio: 'ignore', timeout: 240000,
      });
      const j = JSON.parse(readFileSync(file, 'utf8'));
      const a = j.audits;
      m.perf.push(j.categories.performance.score * 100);
      m.lcp.push(a['largest-contentful-paint'].numericValue);
      m.cls.push(a['cumulative-layout-shift'].numericValue);
      m.tbt.push(a['total-blocking-time'].numericValue);
      m.bytes.push(a['total-byte-weight'].numericValue);
    }
    rows.push(`| ${label} | ${preset} | ${Math.round(median(m.perf))} | ${(median(m.lcp) / 1000).toFixed(2)} s | ${median(m.cls).toFixed(3)} | ${Math.round(median(m.tbt))} ms | ${Math.round(median(m.bytes) / 1024)} KiB |`);
    console.log(rows[rows.length - 1]);
  }
}
const table = `| Page | Device | Performance | LCP | CLS | TBT | Transferred |\n|---|---|---:|---:|---:|---:|---:|\n${rows.join('\n')}\n`;
const meta = `Median of ${runs} runs per row, Lighthouse 12 (mobile = default Moto G Power emulation with simulated slow 4G; desktop preset), local server, ${new Date().toISOString().slice(0, 10)}.\n`;
if (out) writeFileSync(out, meta + '\n' + table);
console.log('\n' + meta + table);
