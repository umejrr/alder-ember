# Performance

Lab numbers from one machine, produced by `npm run perf` (Lighthouse 12, median of three runs per row, never the best run). They are a repeatable baseline for comparing changes. They are **not** Core Web Vitals field data, and the targets below are budgets to hold against real approved assets, not guarantees.

## What changed, and why

| Change | Why |
|---|---|
| Hero served as AVIF with a WebP fallback, in two widths for desktop and a separate 4:5 crop for narrow screens | The audited hero was a 695 KiB WebP and narrow screens downloaded the desktop image. The mobile hero is now about 24 to 70 KiB |
| Every preview photo is AVIF + WebP, cropped to its slot's ratio at export | Smaller files, and composition is decided in one place (`scripts/images/preview-photos.manifest.json`) instead of by CSS cropping a larger image |
| Gallery thumbnails use a 320 px variant | They displayed a 640 px file in a 100 px box |
| The model explorer renders only the visible model's image, and fetches and decodes another when a visitor shows interest (hover, focus, choice) | Before, all three full-size model photographs were in the page and loaded together |
| The two critical latin font files are preloaded | The late font swap was the home page's only layout shift (CLS 0.052). It is now 0 |
| No animation or smooth-scroll library | The home page's reveal, materials and planning behaviour together is about 3.6 KiB of inline script (1.7 KiB gzip: IntersectionObserver and class toggles); transitions are CSS on opacity and transform |

## Budgets

| Resource | Budget | Now |
|---|---:|---:|
| Mobile hero (AVIF) | 100 to 160 KiB | 24 KiB at 480 px, 70 KiB at 800 px |
| Desktop hero (AVIF) | 200 to 350 KiB | 63 KiB at 1280 px, 156 KiB at 1920 px |
| Supporting editorial image at its intended size (AVIF) | under 150 to 200 KiB | 17 to 222 KiB; the two largest (222 and 209) are the textured installation and site-access stills, both placeholders for approved photography |
| Motion script (gzip) | under 20 KiB | 1.7 KiB (reveal, materials and planning on the home page) |
| LCP, INP, CLS (75th percentile, field) | 2.5 s, 200 ms, 0.1 | not measured in the field |

## Lab results, before and after

Same script, same settings, same machine. "Before" is the audited build (`ac06696`); "after" is the review branch.

RESULTS_PLACEHOLDER

## Reading the numbers

- The mobile preset simulates a slow 4G connection and a mid-range phone, which is why mobile LCP is several times the desktop figure. The comparison between the two builds is the meaningful part, not the absolute value.
- The totals include fonts, CSS, scripts and the images the page actually requested, at the viewport Lighthouse uses.
- Cache headers on GitHub Pages are the host's (`max-age=600`), and cannot be changed from this repository. A host that allows long-lived immutable caching for hashed assets would help repeat visits; that is a hosting choice for launch, not something promised here.
- The static preview is not the production architecture: the enquiry API, real approved photography and the real domain will all change the picture. Re-run `npm run perf` against the launch build.
