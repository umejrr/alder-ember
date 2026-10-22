# Performance

Lab numbers from one machine, produced by `npm run perf` (Lighthouse 12, median of three runs per row, never the best run). They are a repeatable baseline for comparing changes. They are **not** Core Web Vitals field data, and the targets below are budgets to hold against real approved assets, not guarantees.

## What changed, and why

| Change | Why |
|---|---|
| Hero served as AVIF with a WebP fallback, in four widths for desktop and a separate square crop for phones, from **one `<picture>`** with a media-conditioned source | The audited hero was a 695 KiB WebP and narrow screens downloaded the desktop image. The mobile hero is now about 20 to 52 KiB |
| One `<picture>` for the hero, not two images with one hidden by CSS | A hidden `<img>` is still downloaded. The earlier build fetched the desktop hero on a phone and the phone crop on a desktop, in competition with the image that decides LCP. Each viewport now fetches only its own file (20 KiB on a 390 px phone, 143 KiB on a 1440 px laptop) |
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
| Mobile hero (AVIF) | 100 to 160 KiB | 20 KiB at 480 px, 33 KiB at 640 px, 52 KiB at 835 px |
| Desktop hero (AVIF) | 200 to 350 KiB | 75 KiB at 1280 px, 143 KiB at 1884 px (the supplied source is 1884 px wide, so there is nothing larger to serve) |
| Supporting editorial image at its largest size (AVIF, 1448 to 1536 px wide) | under 150 to 200 KiB | 62 to 255 KiB; the largest are the installation (255), the Rowan exterior (238), the Alder exterior (219) and site access (196). Only the size the screen needs is fetched, and the sources are native-width, so nothing is upscaled |
| Motion script (gzip) | under 20 KiB | 1.7 KiB (reveal, materials and planning on the home page) |
| LCP, INP, CLS (75th percentile, field) | 2.5 s, 200 ms, 0.1 | not measured in the field |

## Lab results, before and after

Same script, same settings, same machine. "Before" is the audited build (`ac06696`); "after" is the review branch.

Median of 3 runs per row, Lighthouse 12 (mobile = default Moto G Power emulation with simulated slow 4G; desktop preset), local server, 2026-10-19.

Each cell reads *before → after*. Total blocking time was 0 ms in every run of both builds.

| Page | Device | Performance | LCP | CLS | Transferred |
|---|---|---:|---:|---:|---:|
| Home | mobile | 84 → **93** | 4.05 s → **3.09 s** | 0.023 → **0.000** | 1313 KiB → **412 KiB** |
| Home | desktop | 95 → **100** | 1.47 s → **0.73 s** | 0.005 → **0.000** | 1709 KiB → **503 KiB** |
| Model (Alder) | mobile | 78 → **80** | 5.71 s → **4.89 s** | 0.020 → **0.000** | 962 KiB → **704 KiB** |
| Model (Alder) | desktop | 98 → **99** | 1.07 s → **0.93 s** | 0.006 → **0.000** | 845 KiB → **649 KiB** |
| Compare | mobile | 95 → **98** | 2.41 s → **1.81 s** | 0.029 → **0.021** | 478 KiB → **486 KiB** |
| Compare | desktop | 99 → **100** | 0.78 s → **0.72 s** | 0.002 → **0.004** | 478 KiB → **486 KiB** |
| Enquiry | mobile | 99 → **95** | 1.66 s → **2.41 s** | 0.047 → **0.021** | 481 KiB → **490 KiB** |
| Enquiry | desktop | 100 → **100** | 0.72 s → **0.72 s** | 0.001 → **0.004** | 481 KiB → **490 KiB** |

What the table does and does not show:

- **Image-led pages improved clearly.** Home transfers 412 KiB on mobile against 1313 KiB, and Model 704 KiB against 962 KiB; mobile LCP is 0.8 to 1.0 s faster and layout shift is 0. Home and Model were re-measured on the final build (22 October, after the gallery change). On the model page the three image tiles are now large, so it transfers about 30 KiB more and scores 2 points lower on mobile than just before that change (82 to 80, LCP 4.52 s to 4.89 s); Compare and Enquiry carry no photographs and were measured earlier on the same code.
- **Compare and Enquiry are not a result either way.** They carry no photographs, so the image work does not touch them, and they transfer about 8 KiB more than before (the editable project summary and the new styles). Enquiry's mobile median fell from 99 to 95, but that row is noisy: five further single runs of the same page, on the same build and machine, scored 94, 83, 100, 81 and 95 (LCP 1.4 s to 3.9 s). The three-run median is the figure to read, and a gap of this size on that page is inside the spread, so it is reported as it came out rather than tuned.
- The remaining shift on the text-led pages (about 0.02 to 0.05) is the web-font swap, left in on purpose; see the preload row above.

## Reading the numbers

- The mobile preset simulates a slow 4G connection and a mid-range phone, which is why mobile LCP is several times the desktop figure. The comparison between the two builds is the meaningful part, not the absolute value.
- The totals include fonts, CSS, scripts and the images the page actually requested, at the viewport Lighthouse uses.
- Cache headers on GitHub Pages are the host's (`max-age=600`), and cannot be changed from this repository. A host that allows long-lived immutable caching for hashed assets would help repeat visits; that is a hosting choice for launch, not something promised here.
- The static preview is not the production architecture: the enquiry API, real approved photography and the real domain will all change the picture. Re-run `npm run perf` against the launch build.
