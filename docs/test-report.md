# Test report

Everything below was actually run on 19 October 2026 against the review branch (`claude/audit-upgrade-review`), in Chromium only, in a cloud container. Where something could not be verified, that is stated at the end rather than implied. The audit this follows is answered item by item in [audit-response.md](audit-response.md).

## Automated checks (all passing)

| Check | Command | Result |
|---|---|---|
| Unit tests | `npm test` | **70 passed** in 4 files |
| Type check | `npm run check` | **0 errors, 0 warnings, 0 hints** across 92 files (Astro, TypeScript, React) |
| Contrast | `npm run contrast` | **20 pairs pass, 0 fail** (text pairs at 4.5:1, controls and focus at 3:1) |
| Broken links, anchors, assets | `npm run crawl` on a preview build | **25 pages crawled, none broken** |
| Production leak check | `npm run check:production` | **Pass.** 17 HTML files scanned: no working price, dimension, capacity or lead time, no preview notice, no draft or unapproved route, correct robots rules, sitemap contains only real pages. Reports 10 pages still showing labelled stock preview images as a **launch blocker** (expected) |
| Accessibility scan | `npm run a11y` (axe-core, WCAG 2.0/2.1/2.2 A and AA tags) | **No violations** on 24 routes at 1440 px and 375 px |
| Browser journeys | `npm run e2e` | **20 of 20 steps pass** (below) |
| Layout sweep | `npm run responsive` | **227 checks, no horizontal overflow**: 23 routes at 320, 375, 390, 768, 1024, 1440 and 1920 px, and 22 routes at 390, 768 and 1440 px with the browser's own default text size raised to 200% (the internal `/brand` specimen sheet is excluded from that pass) |
| Hero text legibility | `npm run hero` | **Pass at 769, 1024, 1280, 1440, 1920 and 2560 px.** The copy is hidden, what sits behind it is captured, and contrast is taken against the brightest 1% of those pixels: headline 5.2:1 or better (large text needs 3:1), lead paragraph 5.6:1 or better (needs 4.5:1), on the supplied hero image. The lowest figures are at the narrowest and widest-overlap widths, and the check must be re-run on every replacement hero photograph. Axe cannot sample photographs, so this is the only check of text over the hero image |
| Static bundle from a nested sub-path | `npm run e2e:static` | **10 of 10 steps pass**: styles, fonts and islands load from `/a/b/c/`; static and React-created links navigate; every generated link is a real `href` under the prefix and a Ctrl-click opens a new tab inside it; five nested missing URLs return 404 with the branded, styled page and working recovery links; every page loads; compare and the gallery work; the demo form sends no request; the mobile menu works; and **no request escaped the prefix** |
| Logo SVG validity | `npm run logo` | All 25 files are well-formed XML |

**Negative controls.** The nested-404 step was run against a bundle built without the base anchor and **failed**, as it should. The hero check was run against the previous stock hero and scrim and **failed** at 769, 1024, 1280 and 1440 px (headline 1.8:1 to 2.6:1 where it crosses the cabin wall), which led to a stronger scrim; on the supplied hero it also **failed** once, the lead paragraph at 769 px (3.6:1), when the scrim was lightened, which is why a stronger scrim is kept at tablet widths. The responsive sweep failed before the fixes below: its first run found the 320 px header overflow, the 200% text overflows in the header, the 12-column grid and long headings, and the gallery label collision.

### What the audit follow-up added

- **Unit tests (20 new):** the base-aware link helper (relative and absolute root markers, query strings and fragments, assets, external links); the model-id allowlist (six inherited names, unknown, empty, real); the one heating rule (Rowan and wood-burning becomes advice with a reason, valid pairs untouched, incoming URLs and saved state reconciled); server validation rejecting the contradictory pair while keeping people and changing area in the payload.
- **Journey steps (9 new):** one arrow key press moves exactly one gallery image (dialog and inline, with wrap); changing the model reconciles the heating preference and says so; an incoming contradictory URL is reconciled; carried people and changing area are visible, editable, and the confirmation uses the edited values; Clear removes the preference parameters from the address bar and leaves `utm_source` and the fragment; the product page explains a heating preference carried from another model; a selector result never outlives its answers; reveal content stays visible when the script throws, with no JavaScript, and with reduced motion; a desktop comparison keeps two models and says why; mobile compare uses two explicit selectors with price context beside each price. The explorer step also checks that only the visible model's image is in the page up front and that the stage keeps a 3:2 ratio.
- **Static-bundle steps (2 new):** native-link behaviour and nested 404s, as above.

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
- **Visual review** of the home page, collection, a model page, compare, enquiry, installation & delivery and the brand sheet at 1440 px (desktop) and 390 px (mobile), in screenshots regenerated from the final build (`docs/screenshots/`, captured with `npm run shots` at 1440 × 900 and 390 × 844, full-page captures up to 9254 px tall). This found and fixed: collapsing grid columns, double gutters on mobile, an overlapping zoom button, the product enquiry action sitting too far down on mobile, misaligned form fields, and a mobile menu that covered its own Close button when the preview bar was above the header. In this round, looking at the hero found the headline sitting over the lit wall of the cabin at some widths; the contrast figure above is what that review turned into.
- **Logo** inspected at 16, 24, 32 and 48 px, as a favicon, in the header, on forest, on a photographic gradient and as an avatar. Three directions were drawn and compared; one was rejected.

## Performance (lab only)

Lighthouse 12, median of three runs per page and device, before and after, with the same script and settings: see [performance.md](performance.md). They are lab numbers from one machine. The Home row was re-measured on the final build (with the supplied hero image and the lighter scrim); Model, Compare and Enquiry do not use the hero and were measured earlier on the same code. **No field Core Web Vitals and no Lighthouse run against the live host have been collected.**

## Hosted preview

The **live GitHub Pages site (https://umejrr.github.io/alder-ember/) is still the audited build**: this work is on the review branch, which the Pages workflow does not watch, so nothing was published. The earlier live checks (7 October, and 19 October for reachability) therefore say nothing about this branch. The identical static bundle was tested from a nested sub-path with a host-style 404 fallback (above); publishing it is a separate, explicit step.

## Not verified, and why

- **A real HubSpot portal.** None was supplied; the adapter follows the documented endpoint and has only been tested against a mock. Property names are placeholders.
- **Screen readers and keyboard use on real devices.** Only automated axe checks and scripted keyboard journeys have been run, in Chromium. NVDA, JAWS, VoiceOver and TalkBack have not been used. WCAG 2.2 AA is a target, not a claim.
- **Other browsers and real devices.** Firefox, Safari (WebKit), and iOS and Android devices have not been tested: only Chromium is installed here, and the instructions for this environment say not to install others. The `:has()` selected-state styling, `<dialog>`, native `<details>`, `overflow-wrap: anywhere`, AVIF and `<picture>` are all widely supported but unchecked outside Chromium.
- **Alder & Ember photography.** The site uses 14 openly licensed stock photographs (in 16 slots) and one supplied hero image whose origin and rights are unconfirmed, all as clearly labelled previews (see [image-credits.md](image-credits.md)). Crop, focal points, heading-over-image contrast and AVIF/WebP delivery were checked against these, but not against the real product, installation or site photography, which does not exist yet. Stock and supplied images are atmosphere only: none is shown as the Rowan, Alder or Ember, and every one is tagged on the page ("Stock preview" or "Preview image · awaiting approval").
- **A deployed environment.** No HTTPS host, CDN, caching, shared rate-limit store or multi-instance behaviour.
- **Email.** No confirmation or alert emails exist.
- **Print** reproduction of the logo, and **trademark clearance** of the identity.
- **Zoom and text-scaling.** 400% reflow is approximated by the 320 px width, and 200% text by raising Chromium's default font size (a faithful emulation of the setting, run in `npm run responsive`). Real browser zoom, and text-only zoom in Safari or Firefox, were not run. Overflow was checked; clipped or overlapping content at large text was only reviewed on a few pages by eye.
- **Reference sites**: only the homepages' opening views (and Heritage's full page) were inspected; see [references.md](references.md).
