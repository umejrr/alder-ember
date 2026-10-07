/**
 * Static preview bundles can be served from any sub-path, so root-absolute asset URLs
 * ("/images/x.webp") are resolved against the page's root marker (<meta name="ae-root">,
 * added by scripts/build-static.mjs). In normal builds there is no marker and URLs are unchanged.
 */
function root(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.querySelector('meta[name="ae-root"]');
  return m ? (m.getAttribute('content') ?? '') : null;
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
