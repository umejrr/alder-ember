import { afterEach, describe, expect, it } from 'vitest';
import { assetSrcset, assetUrl, pageHref } from '@/lib/base-url';

const g = globalThis as unknown as { document?: unknown };
function mount(root: string | null) {
  g.document = { querySelector: (sel: string) => (sel.includes('ae-root') && root !== null ? { getAttribute: () => root } : null) };
}
afterEach(() => { delete g.document; });

describe('pageHref (audit A01): runtime links are correct as href values, with no click interception', () => {
  it('is unchanged where there is no root marker (normal hosting, build time)', () => {
    expect(pageHref('/compare?m=ember')).toBe('/compare?m=ember');
    mount(null);
    expect(pageHref('/saunas/alder')).toBe('/saunas/alder');
  });

  it('resolves against a relative root marker, keeping query strings and fragments', () => {
    mount('../../');
    expect(pageHref('/compare?m=ember')).toBe('../../compare/index.html?m=ember');
    expect(pageHref('/saunas/alder')).toBe('../../saunas/alder/index.html');
    expect(pageHref('/commercial#enquire')).toBe('../../commercial/index.html#enquire');
    expect(pageHref('/plan-your-sauna?model=ember&heating=wood#top')).toBe('../../plan-your-sauna/index.html?model=ember&heating=wood#top');
    expect(pageHref('/')).toBe('../../index.html');
    expect(pageHref('/?x=1')).toBe('../../index.html?x=1');
  });

  it('works from the bundle root and from an absolute project prefix', () => {
    mount('');
    expect(pageHref('/saunas')).toBe('saunas/index.html');
    mount('/alder-ember/');
    expect(pageHref('/saunas/rowan/')).toBe('/alder-ember/saunas/rowan/index.html');
    expect(pageHref('/compare?m=rowan,ember')).toBe('/alder-ember/compare/index.html?m=rowan,ember');
  });

  it('leaves fragments, external and non-root-relative links alone', () => {
    mount('/alder-ember/');
    expect(pageHref('#fragment')).toBe('#fragment');
    expect(pageHref('https://example.com/x')).toBe('https://example.com/x');
    expect(pageHref('//cdn.example.com/x')).toBe('//cdn.example.com/x');
    expect(pageHref('mailto:a@b.co')).toBe('mailto:a@b.co');
  });

  it('treats files as files, so assets are not turned into directories', () => {
    mount('../');
    expect(pageHref('/brand/logo.svg')).toBe('../brand/logo.svg');
    expect(assetUrl('/images/preview/hero-1280.webp')).toBe('../images/preview/hero-1280.webp');
    expect(assetSrcset('/a/x-640.webp 640w, /a/x-1280.webp 1280w')).toBe('../a/x-640.webp 640w, ../a/x-1280.webp 1280w');
  });
});
