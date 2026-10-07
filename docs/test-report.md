# Test report

Everything below was actually run on 7 October 2026 against this repository, in Chromium only, in a cloud container. Where something could not be verified, that is stated at the end rather than implied.

## Automated checks (all passing)

| Check | Command | Result |
|---|---|---|
| Unit tests | `npm test` | **49 passed** in 3 files |
| Type check | `npm run check` | **0 errors, 0 warnings, 0 hints** across 89 files (Astro, TypeScript, React) |
| Contrast | `npm run contrast` | **20 pairs pass, 0 fail** (text pairs at 4.5:1, controls and focus at 3:1) |
| Broken links, anchors, assets | `npm run crawl` on a preview build | **25 pages crawled, none broken** |
| Same crawl on a production build | server on `dist-prod/`, then `npm run crawl` | **16 pages crawled, none broken** (guides and installations links correctly disappear) |
| Production leak check | `npm run check:production` | **Pass.** 17 HTML files scanned: no working price, dimension, capacity or lead time, no preview notice, no draft or unapproved route, correct robots rules, sitemap contains only real pages. Reports 10 pages still showing labelled stock preview images as a **launch blocker** (expected) |
| Accessibility scan | `npm run a11y` (axe-core, WCAG 2.0/2.1/2.2 A and AA tags) | **No violations** on 24 routes at 1440 px and 375 px. The scan was proven able to fail by injecting an alt-less image, which it caught |
| Browser journeys | `npm run e2e` | **11 of 11 steps pass** (below) |
| Horizontal overflow | scripted sweep, 22 routes | **None** at 320, 375, 390, 768, 1024, 1440 and 1920 px |
| Static bundle from a nested sub-path | `npm run build:static && npm run e2e:static` | **8 of 8 steps pass**, also when wrapped in a simulated host page skeleton: styles and fonts load, islands hydrate, static and React-created links navigate, every page loads, compare and gallery work, the demo form sends no request, the mobile menu works, and **no request escaped the sub-path**. With the stock photos in place this caught a real bug: React's server renderer writes `srcSet` in camelCase, which the build-time URL rewrite missed, so responsive images would have 404ed on a sub-path host. Fixed and covered |
| Logo SVG validity | `npm run logo` | All 25 files are well-formed XML (this caught a real bug: unescaped `&` made the logo unusable as an image file) |

### What the unit tests cover (behaviours where a failure would mislead a customer or lose an enquiry)

- Product data matches the supplied working values; price stored in pence; unresolved technical fields are `null`, never zero; capacity ranges do not overlap.
- Production mode shows no working price, size, capacity or lead time but keeps brief-supplied positioning; unapproved guides and the empty installations route are hidden; links to hidden routes disappear.
- No option is selectable on any model until compatibility is approved; wood-burning is not offered on the Rowan.
- Selector: capacity mapping (1–3 Rowan, 4–5 Alder, 6–8 Ember), advice instead of a forced answer for conflicts or groups over 8, commercial routed to assessment, never the word "fits", approximate space always caveated; preference state excludes personal fields.
- Enquiry: field validation, postcode normalisation, marketing consent false unless explicitly true; the handler's demo vs live behaviour, 503 when live but unconfigured, no success if storage fails, "queued" not "delivered" when the CRM fails, duplicate protection, honeypot, too-fast, wrong content type, cross-origin, oversize and rate-limit rejections; HubSpot field mapping; analytics never carrying personal data.

### Browser journeys (`tests/e2e/journey.mjs`)

1. Find your fit: tabs change model, data and links together without navigating; arrow and Home keys move selection.
2. The chosen model survives navigation into the enquiry form (prefilled, visible and editable).
3. Compare: two, then three columns, shareable URL, reset.
4. Selector recommends from comfortable capacity, carries preferences into the form, never says "fits".
5. Enquiry: empty submit shows an error summary and inline errors (`aria-invalid`); input is preserved; a valid demo submission says "Demo mode: nothing was sent" and never claims receipt.
6. Direct load and refresh work for key routes; an unknown route returns 404.
7. No unexpected console or page errors.
8. Mobile menu: opens, the Close control is not covered by the panel (a bug found by screenshot and fixed), Escape closes, focus returns to the toggle.
9. Mobile: no horizontal overflow on key pages.
10. Mobile compare shows two models with every value labelled.
11. Gallery (model page): next-image button, enlarged view opened from the keyboard, explicit Close, focus returned to the opener.

## Manual verification

- **Live enquiry path against a local mock of HubSpot** (the real server, `ENQUIRY_MODE=live`): delivered when the CRM is up; the same idempotency key returned the same response with no second record; with the CRM failing the enquiry was accepted but reported **queued** (and recorded as failed, attempts 1) rather than delivered; `npm run outbox:retry` then delivered it (attempts 2); cross-origin and honeypot requests were rejected (403 and 400); invalid bodies returned field errors; outbox files were created with mode 600. The mock received the mapped fields.
- **Visual review** of the home page, collection, a model page, compare, enquiry, installation & delivery and the brand sheet at 1440 px and 390 px, in full-page screenshots (see `docs/screenshots/`). This found and fixed: collapsing grid columns, double gutters on mobile, an overlapping zoom button, the product enquiry action sitting too far down on mobile, misaligned form fields, and a mobile menu that covered its own Close button when the preview bar was above the header.
- **Logo** inspected at 16, 24, 32 and 48 px, as a favicon, in the header, on forest, on a photographic gradient and as an avatar. Three directions were drawn and compared; one was rejected.

## Local indicators (not performance guarantees)

Measured with an unthrottled local browser on a localhost server with **no real images**, so they say little about the live site. Uncompressed transfer: HTML about 52 KB per page, CSS about 31 KB, fonts about 153 KB (Newsreader and Manrope latin subsets), and about 234 KB of JavaScript on pages with React islands (model pages, compare). The home page ships about 1 KB until the model showcase scrolls into view. Layout shift in these runs was 0.000 to 0.046 (the highest was on mobile compare, from the two-model default applying after hydration). **No Lighthouse or field Core Web Vitals run has been done**: that needs real images on a real host.

## Hosted preview

**GitHub Pages (public):** https://umejrr.github.io/alder-ember/ . The browser checks above were run against the live address (`LIVE_URL=https://umejrr.github.io/alder-ember/ npm run e2e:static`) on 7 October 2026: **8 of 8 steps passed**, including every page loading, hydration, navigation, the demo form and the mobile menu, with no console or network errors.

The preview is published as a private Artifact. It could not be opened from this container (claude.ai needs a login), so the hosted page itself has **not** been seen rendering. What was verified instead is that the identical files work from a nested sub-path behind a host-style page wrapper (above). Not verified there: the host's content-security policy and sandbox behaviour with the island scripts, whether the host keeps query strings on in-page navigation (model choice also travels in session storage, so the main flows do not depend on them), and printing or embedding.

## Not verified, and why

- **A real HubSpot portal.** None was supplied; the adapter follows the documented endpoint and has only been tested against a mock. Property names are placeholders.
- **Screen readers and keyboard use on real devices.** Only automated axe checks and scripted keyboard journeys have been run, in Chromium. NVDA, JAWS, VoiceOver and TalkBack have not been used. WCAG 2.2 AA is a target, not a claim.
- **Other browsers.** Firefox and Safari have not been tested (the `:has()` selected-state styling, `<dialog>` and native `<details>` are all widely supported but unchecked here).
- **Alder & Ember photography.** The site uses 16 openly licensed stock photographs as clearly labelled previews (see [image-credits.md](image-credits.md)). Crop, focal points, heading-over-image contrast and responsive WebP delivery were checked against these, but not against the real product, installation or site photography, which does not exist yet. Stock photos are atmosphere only: none shows the Rowan, Alder or Ember, and every one is tagged on the page. AVIF delivery and image performance budgets are untested.
- **A deployed environment.** No HTTPS host, CDN, caching, shared rate-limit store or multi-instance behaviour.
- **Email.** No confirmation or alert emails exist.
- **Print** reproduction of the logo, and **trademark clearance** of the identity.
- **Zoom and text-scaling at 200 to 400 percent** were exercised only through the narrow-width sweep (320 px), not with real browser zoom.
- **Reference sites**: only the homepages' opening views (and Heritage's full page) were inspected; see [references.md](references.md).
