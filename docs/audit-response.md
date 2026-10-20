# Response to the live audit (19 October 2026)

The audit tested the deployed preview at `ac06696` and handed over eleven reproducible faults (A01 to A11), a creative critique and an implementation specification. This document says what was done about each, how it was checked, and what is still open. Nothing here claims a deployment, a mobile-device audit, an accessibility certification or a field performance score: those were not done.

The work is on the review branch `claude/audit-upgrade-review`, branched from the audited commit. It was **not** published: the Pages workflow only watches `main` and the preview branch, so pushing this branch changes nothing live.

## The eleven faults

Every fault was reproduced against the source first, then fixed, then covered by a check that fails without the fix. Counts are from the runs recorded in [test-report.md](test-report.md).

| # | Fault | What changed | Check that fails without it |
|---|---|---|---|
| A01 | React-created links broke on Ctrl-click, middle-click and copy | One base-aware helper, `src/lib/base-url.ts` (`pageHref`, `assetUrl`, `assetSrcset`), builds every runtime `href`. The click-interception shim is deleted | Static bundle at `/a/b/c/`: every explorer, selector, panel and compare link is under the prefix, and a Ctrl-click opens a new tab inside it. Unit tests for the helper (relative marker, absolute marker, query and fragment, assets, external links) |
| A02 | A missing page at depth lost its CSS and links | `404.html` is built against the known project base (`STATIC_BASE`, set by the Pages workflow); every other page stays relative and portable | Five nested missing URLs return 404, render the branded page, load the font, size the logo and link back. **Negative control:** the same step fails on a bundle built without the base |
| A03 | Enlarged gallery advanced two images per key | The dialog is inside the wrapper, so both handlers fired. One owner now | Journey: one press moves one image, in both directions, with wrap; inline gallery too |
| A04 | Model change kept an unavailable heating preference | One rule, `reconcileHeating`, used by the form, by URL and saved preferences, and by server validation. A changed preference becomes "I need advice", with a polite message | Unit tests for the rule and for validation; journey for Ember/wood to Rowan, an incoming contradictory URL, and switching back |
| A05 | Carried preferences were not all visible or editable | The enquiry opens with an editable project summary: model, people, heating and changing area, each removable. The confirmation uses what is left in the fields | Journey: six people and a changing area carried from the selector, edited to four and "no", and the confirmation reflects the edits |
| A06 | Clear did not clear the URL | `clearUrlPreferences` removes the five preference parameters and leaves any others and the fragment | Journey: clear, reload, nothing returns, and `utm_source` and `#top` survive |
| A07 | `model in products` accepted `constructor`, `__proto__` and `toString` | Explicit allowlist of model ids | Unit tests for six inherited names, unknown, empty, and each real model |
| A08 | A selector result outlived the answers that produced it | A result carries its own answer snapshot. When the answers change it is marked outdated, its links are withdrawn, and one button updates it | Journey: six people, then two, and no link survives until updated |
| A09 | Free-text space was collected and dropped | Removed from the selector (the audit's simpler option). Space is asked once, in the enquiry | Selector unit test; the field no longer exists |
| A10 | Reveal depended on a script that could fail after hiding content | Content is visible by default. `<html>` only gets `reveal-armed` after setup completes, and elements already on screen are never hidden | Journey: a throwing `IntersectionObserver`, no JavaScript, and reduced motion all leave every reveal element visible |
| A11 | Mobile compare was ambiguous | Two explicit selectors that swap on a clash and say so; desktop explains why a comparison keeps two models; the price qualification sits beside each price | Journey at 375 px |

## Found while verifying (not in the audit)

New checks were added as the work went on, and each found something real that is now fixed:

- **A sub-path bug.** React's server renderer writes `srcSet` in camelCase, which the build-time URL rewrite missed, so responsive images would have 404ed from a sub-path. The rewrite and its self-check are now case-insensitive.
- **Layout at 320 px and at large text.** A new sweep (`npm run responsive`) found that the enlarged logo plus the menu button overflowed the header at 320 px; and, with the browser's own text size raised to 200%, the header, the 12-column grid (its eleven gaps alone were wider than a phone), long headings and several columns overflowed. Breakpoints are now in rem, the grid is one column until twelve fit, the lockup is width-constrained, and long words wrap. The sweep injects the browser's default font size, so rem breakpoints react as they would for a real visitor.
- **A performance trade-off, measured rather than assumed.** Preloading the two fonts removed the home page's late-swap layout shift but made mobile Compare and Enquiry slower to show their first text (LCP up 1 to 2 s in Lighthouse's model), so the preload is now limited to the image-led pages. Compare's own hydration shift (CLS 0.072) was removed by rendering both control sets and letting CSS choose.
- **Hero text over the photograph.** Axe cannot sample images, so a new check (`npm run hero`) hides the copy, captures what is behind it and measures contrast. On the first run the headline came out at 1.8:1 to 2.6:1 from 769 to 1440 px where it meets the lit wall of the cabin; the scrim was strengthened. The check has since run on the supplied hero image: the headline is 5.2:1 or better at every desktop width and the lead paragraph 5.6:1 or better (3:1 and 4.5:1 are needed), and it still has to be re-run on every replacement photograph.
- **The stock label met the gallery buttons at 320 px**, and the Rowan page now says in words when a heating preference was carried over from another model and changed.

## The creative direction

The audit's organising idea, "From the garden, into the warmth", became five chapters on the home page: arrive, choose, inspect, understand, begin.

- **Arrive.** A sauna in a garden is now the dominant subject: the supplied hero image, a dark timber cabin with a glazed front, lit from inside at dusk, set in a lawn with a clipped hedge and silver birch behind it. The headline is short, with "Premium outdoor saunas" carried as a kicker so the offer is unmistakable, and is sized to end before the doorway in the photograph. A separate 4:5 crop serves narrow screens.
- **Choose.** The model explorer has a stage whose 3:2 ratio never depends on the text beside it, a rail of all three models, and a short panel: one fit sentence, capacity, external size, price with its qualification beside it and the full scope one click away, and one primary action. Image, facts, links and selected state cannot disagree, and only the visible model's image loads up front.
- **Inspect.** Three details (exterior, interior, construction) with a sticky stage that follows native scroll, and buttons that do the same job. Narrow screens and no-script get a linear image/text sequence.
- **Understand.** The four stages, with the stage in view marked, and a plain split between what we coordinate and what is assessed separately.
- **Begin.** A short closing and an editable enquiry summary.

Product pages put price, then the action, then lead time and heating; they gained a local navigation that marks the section in view and buyer-oriented section names. About, commercial, installation, care and the collection were reworked so they no longer share one opening; internal-brief wording was removed from customer copy while the accurate business statements stayed.

The logo's mark was floating about 10% short of the lettering. It is now aligned from the ascender line to the baseline and the header lockup is larger.

## What is deliberately not claimed

- **Photography is still unapproved.** The audit is right that coherent product photography is the largest creative dependency, and no code can supply it. The set is now closer (one family of small timber cabins in natural light, and the large cottage removed). Fourteen stock photographs fill the other slots; every one still says "Stock preview · not The ...". The homepage hero is an image supplied for review on 20 October: its origin and rights have **not** been confirmed (it may be a photograph, a render or a reference), so it carries its own status, **"Preview image · awaiting approval"**, is atmosphere only, and is never presented as an Alder & Ember product photograph. `check:production` reports all of them as launch blockers. Credits are in [image-credits.md](image-credits.md).
- **The supplied hero is 1536 × 1024 px.** That is enough for a 1440 px screen at normal density, but it is upscaled on wider or high-density screens, so the approved photograph should be delivered at 6000 px on the long edge (see [hero-photo-brief.md](hero-photo-brief.md)).
- **No social image.** `og:image` and `twitter:image` are emitted only from an approved image (`site.socialImage`), so a stock house can never stand in for an installation in a link preview. Until one is approved none is emitted.
- **No invented content.** No real product photographs, projects, reviews, drawings, construction details, medical benefits, awards or backend were added.

## Not verified here

- Real iOS and Android devices, Safari and Firefox: only Chromium was run.
- Screen-reader and manual keyboard review beyond the scripted journeys, and a real 400% zoom check (the 320 px width and 200% text passes are scripted approximations).
- Field performance (Core Web Vitals from real users) and Lighthouse on the live host: the numbers in [performance.md](performance.md) are lab runs on one machine.
- A live backend, CRM or email delivery.
