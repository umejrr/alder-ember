# Performance

Lab numbers from one machine, produced by `npm run perf` (Lighthouse 12, median of three runs per row, never the best run). They are a repeatable baseline for comparing changes. They are **not** Core Web Vitals field data, and the targets below are budgets to hold against real approved assets, not guarantees.

## What changed, and why

| Change | Why |
|---|---|
| Hero served as AVIF with a WebP fallback, in four widths for desktop and a separate 4:5 crop for narrow screens | The audited hero was a 695 KiB WebP and narrow screens downloaded the desktop image. The mobile hero is now about 20 to 49 KiB |
| Every preview photo is AVIF + WebP, cropped to its slot's ratio at export | Smaller files, and composition is decided in one place (`scripts/images/preview-photos.manifest.json`) instead of by CSS cropping a larger image |
| Gallery thumbnails use a 320 px variant | They displayed a 640 px file in a 100 px box |
| The model explorer renders only the visible model's image, and fetches and decodes another when a visitor shows interest (hover, focus, choice) | Before, all three full-size model photographs were in the page and loaded together |
| The two critical latin font files are preloaded on image-led pages only (home, model pages) | The late font swap was the home page's only layout shift (CLS 0.052 in one run; 0 now). On text-led pages (Compare, Enquiry) the same preload was **measured to hurt**: it put 153 KiB ahead of the text and raised mobile LCP by 1 to 2 s in Lighthouse's model, so those pages leave it off and keep a small swap shift (0.02 to 0.05, under the 0.1 target) |
| Exterior photographs have a 960 px step, and the first gallery image is `fetchpriority="high"` | At a phone's pixel ratio the browser was choosing the 1267 px file for the largest image on a model page |
| Compare renders both its control sets and lets CSS choose between them | Choosing in script moved the layout when the page hydrated (CLS 0.072 on mobile in one run; it is now about 0.02) |
| No animation or smooth-scroll library | The home page's reveal, materials and planning behaviour together is about 3.6 KiB of inline script (1.7 KiB gzip: IntersectionObserver and class toggles); transitions are CSS on opacity and transform |

## Budgets

| Resource | Budget | Now |
|---|---:|---:|
| Mobile hero (AVIF) | 100 to 160 KiB | 20 KiB at 480 px, 49 KiB at 819 px |
| Desktop hero (AVIF) | 200 to 350 KiB | 81 KiB at 1280 px, 108 KiB at 1536 px (the supplied source is 1536 px wide, so there is nothing larger to serve) |
| Supporting editorial image at its intended size (AVIF) | under 150 to 200 KiB | 17 to 222 KiB; the two largest (222 and 209) are the textured installation and site-access stills, both placeholders for approved photography |
| Motion script (gzip) | under 20 KiB | 1.7 KiB (reveal, materials and planning on the home page) |
| LCP, INP, CLS (75th percentile, field) | 2.5 s, 200 ms, 0.1 | not measured in the field |

## Lab results, before and after

Same script, same settings, same machine. "Before" is the audited build (`ac06696`); "after" is the review branch.

Median of 3 runs per row, Lighthouse 12 (mobile = default Moto G Power emulation with simulated slow 4G; desktop preset), local server, 2026-10-19.

Each cell reads *before → after*. Total blocking time was 0 ms in every run of both builds.

| Page | Device | Performance | LCP | CLS | Transferred |
|---|---|---:|---:|---:|---:|
| Home | mobile | 84 → **92** | 4.05 s → **3.23 s** | 0.023 → **0.000** | 1313 KiB → **451 KiB** |
| Home | desktop | 95 → **100** | 1.47 s → **0.73 s** | 0.005 → **0.000** | 1709 KiB → **508 KiB** |
| Model (Alder) | mobile | 78 → **83** | 5.71 s → **4.58 s** | 0.020 → **0.000** | 962 KiB → **679 KiB** |
| Model (Alder) | desktop | 98 → **99** | 1.07 s → **0.90 s** | 0.006 → **0.001** | 845 KiB → **639 KiB** |
| Compare | mobile | 95 → **98** | 2.41 s → **1.81 s** | 0.029 → **0.021** | 478 KiB → **486 KiB** |
| Compare | desktop | 99 → **100** | 0.78 s → **0.72 s** | 0.002 → **0.004** | 478 KiB → **486 KiB** |
| Enquiry | mobile | 99 → **95** | 1.66 s → **2.41 s** | 0.047 → **0.021** | 481 KiB → **490 KiB** |
| Enquiry | desktop | 100 → **100** | 0.72 s → **0.72 s** | 0.001 → **0.004** | 481 KiB → **490 KiB** |

What the table does and does not show:

- **Image-led pages improved clearly.** Home transfers 451 KiB on mobile against 1313 KiB, and Model 679 KiB against 962 KiB; mobile LCP is 0.8 to 1.1 s faster and layout shift is 0. The Home row was re-measured on the final build with the supplied hero image; the other three pages do not use the hero and were measured earlier on the same code.
- **Compare and Enquiry are not a result either way.** They carry no photographs, so the image work does not touch them, and they transfer about 8 KiB more than before (the editable project summary and the new styles). Enquiry's mobile median fell from 99 to 95, but that row is noisy: five further single runs of the same page, on the same build and machine, scored 94, 83, 100, 81 and 95 (LCP 1.4 s to 3.9 s). The three-run median is the figure to read, and a gap of this size on that page is inside the spread, so it is reported as it came out rather than tuned.
- The remaining shift on the text-led pages (about 0.02 to 0.05) is the web-font swap, left in on purpose; see the preload row above.

## Reading the numbers

- The mobile preset simulates a slow 4G connection and a mid-range phone, which is why mobile LCP is several times the desktop figure. The comparison between the two builds is the meaningful part, not the absolute value.
- The totals include fonts, CSS, scripts and the images the page actually requested, at the viewport Lighthouse uses.
- Cache headers on GitHub Pages are the host's (`max-age=600`), and cannot be changed from this repository. A host that allows long-lived immutable caching for hashed assets would help repeat visits; that is a hosting choice for launch, not something promised here.
- The static preview is not the production architecture: the enquiry API, real approved photography and the real domain will all change the picture. Re-run `npm run perf` against the launch build.
