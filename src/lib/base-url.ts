/**
 * One place that knows where the site is mounted.
 *
 * In normal builds the site lives at the host root and every URL is used as written.
 * A static preview bundle (scripts/build-static.mjs) can be served from any sub-path, such as
 * https://owner.github.io/alder-ember/. Its pages carry a root marker, <meta name="ae-root">,
 * holding the path from that page up to the bundle root ("../../" or an absolute "/alder-ember/").
 * Every URL a React island creates at runtime goes through `pageHref` / `assetUrl`, so the
 * href attribute itself is correct. Ctrl/Cmd-click, middle-click and "copy link address" all work,
 * with no click interceptor.
 *
 * Server-side (build time) these functions return their input unchanged. The build step rewrites
 * the rendered HTML to the same URLs the client computes, so hydration sees identical attributes.
 */
function root(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.querySelector('meta[name="ae-root"]');
  return m ? (m.getAttribute('content') ?? '') : null;
}

const FILE = /\.(css|js|mjs|png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|json|txt|xml|webmanifest)$/i;

/** Maps a root-absolute page path ("/compare?m=ember#top") to the URL that works from the current page. */
export function pageHref(href: string): string {
  const r = root();
  if (r === null || !href.startsWith('/') || href.startsWith('//')) return href;
  const m = href.match(/^([^?#]*)(.*)$/)!;
  const clean = m[1].replace(/^\//, '').replace(/\/$/, '');
  if (clean === '') return `${r}index.html${m[2]}`;
  return `${r}${FILE.test(clean) ? clean : `${clean}/index.html`}${m[2]}`;
}

export function assetUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const r = root();
  return r !== null && url.startsWith('/') && !url.startsWith('//') ? r + url.slice(1) : url;
}

export function assetSrcset(srcset: string | null | undefined): string | undefined {
  if (!srcset) return undefined;
  return srcset
    .split(',')
    .map((part) => {
      const [u, d] = part.trim().split(/\s+/);
      return `${assetUrl(u)}${d ? ' ' + d : ''}`;
    })
    .join(', ');
}
