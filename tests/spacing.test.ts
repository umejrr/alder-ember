import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * One spacing scale. Padding, margin, gap and offsets may only use 0.5rem and whole rems (1rem, 2rem, 3rem ...), or a
 * token that is itself on that scale. A value like 0.3rem, 1.25rem or 14px fails here, so it cannot creep back in.
 */
const ROOT = join(import.meta.dirname, '..', 'src');
const walk = (d: string): string[] => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const FILES = walk(ROOT).filter((f) => /\.(css|astro|tsx)$/.test(f));

const PROP = '(?:padding|margin|gap|row-gap|column-gap|inset|top|right|bottom|left|scroll-margin-top|scroll-padding-top)(?:-(?:top|right|bottom|left|block|inline|block-start|block-end|inline-start|inline-end))?';
const DECL = new RegExp(`(?<![\\w-])(${PROP})\\s*:\\s*([^;{}"]+?)\\s*(?=;|\\}|"|$)`, 'gm');
const POSITION = /^(top|right|bottom|left|inset)$/;

function problems(prop: string, value: string): string[] {
  const out: string[] = [];
  if (/\b(clamp|min|max)\(/.test(value)) out.push('fluid length (clamp/min/max); use a step token');
  // tokens and runtime values are fine
  const rest = value.replace(/var\([^()]*(?:\([^()]*\))?[^()]*\)/g, ' ').replace(/env\([^)]*\)/g, ' ');
  for (const m of rest.matchAll(/(-?\d*\.?\d+)(rem|px|em|%|vw|vh|svh|dvh)?(?![\w-])/g)) {
    const n = Number(m[1]);
    const unit = m[2] ?? '';
    if (n === 0) continue;
    if (unit === '' || unit === '%' || unit === 'vw' || unit === 'vh' || unit === 'svh' || unit === 'dvh') continue; // multipliers, percentages, viewport offsets
    if (unit === 'em') {
      if (!POSITION.test(prop.replace(/-.*/, ''))) out.push(`${m[0]}: em is only allowed to align a glyph (top/left/right/bottom)`);
      continue;
    }
    if (unit === 'px') {
      if (Math.abs(n) > 2) out.push(`${m[0]}: use rem on the scale`);
      continue; // 1px and 2px are hairlines, not spacing
    }
    const a = Math.abs(n);
    if (!(a === 0.5 || Number.isInteger(a))) out.push(`${m[0]}: not on the scale (0.5rem, then whole rems)`);
  }
  return out;
}

describe('spacing scale', () => {
  it('the scale tokens are on the scale', () => {
    const tokens = readFileSync(join(ROOT, 'styles', 'tokens.css'), 'utf8');
    const sp = [...tokens.matchAll(/--sp-[\w]+:\s*([\d.]+)rem/g)].map((m) => Number(m[1]));
    expect(sp.length).toBeGreaterThanOrEqual(8);
    for (const n of sp) expect(n === 0.5 || Number.isInteger(n), `${n}rem`).toBe(true);
    expect(tokens).not.toMatch(/--(gutter|col-gap|section|section-tight)\s*:\s*clamp/);
  });

  it('every padding, margin, gap and offset in the source uses it', () => {
    const found: string[] = [];
    let checked = 0;
    for (const f of FILES) {
      const s = readFileSync(f, 'utf8');
      for (const m of s.matchAll(DECL)) {
        checked++;
        const why = problems(m[1], m[2].trim());
        if (why.length) found.push(`${f.replace(ROOT, 'src')}:${s.slice(0, m.index).split('\n').length}  ${m[1]}: ${m[2].trim()}  (${why.join('; ')})`);
      }
    }
    expect(checked).toBeGreaterThan(200); // the scan really ran over the stylesheets
    expect(found, `\n${found.join('\n')}\n`).toEqual([]);
  });
});
