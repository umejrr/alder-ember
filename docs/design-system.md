# Design system

Tokens live in `src/styles/tokens.css`; shared patterns in `src/styles/global.css`; interactive-component styles in `src/styles/*.css`. Use semantic tokens (`--bg`, `--fg`, `--fg-muted`, `--rule`, `--accent`), not one-off hex values.

## Colour

The brief's proposed palette, kept as proposed. Every pair used for text and controls is checked by `npm run contrast` (all pass at their target).

| Token | Value | Role |
|---|---|---|
| `--c-canvas` | `#F4F0E8` | Main backgrounds |
| `--c-surface` | `#FFFCF7` | Cards, fields, quiet surfaces |
| `--c-charcoal` | `#252824` | Text, primary buttons |
| `--c-muted` | `#5B6056` | Supporting text and **form-control borders** (5.7:1; WCAG needs 3:1 for control boundaries, so the lighter `--c-border` is for dividers only) |
| `--c-timber` | `#795B45` | Supporting accent, focus rings |
| `--c-ember` | `#A54F32` | **One job:** selected state (active model, the bar in the logo). Never a CTA fill or heading colour |
| `--c-forest` | `#111C16` | Dark chapters, footer, mobile menu |
| `--c-ember-on-forest` | `#E8A07F` | The ember accent on dark surfaces (8.1:1) |

Derived: `--c-on-forest` (`#F4F0E8`), `--c-on-forest-muted` (`#C3C8BC`), `--c-forest-raised` (`#17261E`), `--c-ember-strong` (`#8F4128`, text on light), `--error` (`#A3261A`).

## Type

- **Newsreader** (variable, optical size 6–72) for display, headings and prices. Weights 300–400; large sizes use tight tracking.
- **Manrope** (variable) for body, navigation, buttons, facts and forms. Tabular lining numerals for prices and dimensions.
- Both are SIL Open Font License 1.1, self-hosted via Fontsource (no Google request). A small, separately licensed outline of Newsreader is used for the logo (`scripts/logo/fonts`, licence text included).
- Fluid scale: display 38–84 px, H1 34–60, H2 32–48, H3 22–28, body 16–18, label 12 uppercase with 0.14em tracking. Line height 1.08 (display) to 1.6 (body); reading measure about 40 rem.

## Layout

12-column grid on desktop (spans set as `c-N` plus an optional `c-start-N`), simpler tablet layouts, single column on mobile. Content width 1320 px, wide 1680 px. Gutters 20–72 px. Section spacing `clamp(56px, … , 136px)`. Radius 2 px; borders 1 px; no shadows. Image frames dominate; no floating rounded cards.

## Components

| Component | File | Notes |
|---|---|---|
| Header + mobile menu | `components/Header.astro` | Transparent over the hero, solid after it, no height jump. Mobile panel traps focus, Esc closes, focus returns to the toggle, page scroll is locked while open |
| Footer | `components/Footer.astro` | Large finishing wordmark, legal links and cookie preferences |
| Buttons and links | `global.css` | Primary (charcoal), secondary (outlined), text link with an arrow cue; dark-surface variants. 48 px minimum height |
| Model explorer | `react/FindYourFit.tsx`, `styles/find-your-fit.css` | A 3:2 stage whose ratio never depends on the text beside it, a rail of all three models (above the stage on narrow screens, below it on wide ones), and a concise panel: name, one fit sentence, capacity, external size, price with its qualification beside it and the full scope one click away, then one primary action. Tabs change the model only (no navigation). The rail state and the shown image/facts/links only differ while the next image is fetched and decoded, so they never describe different models. Only the visible model's image loads up front. Arrow/Home/End keys, live-region announcement, selection stored for the enquiry |
| Materials chapter | `pages/index.astro` | Three editorial details. With scripting on wide screens one sticky stage follows native scroll and visible buttons do the same; otherwise (narrow, no scripting) each detail carries its own image in a linear sequence |
| Planning sequence | `pages/index.astro` | Four stages with the stage in view marked by an ember rule; clicking a stage marks it. Same readable content with no scripting |
| Product local navigation | `pages/saunas/[slug].astro` | Sticks under the header, marks the section in view, scroll offsets account for both |
| Enquiry project summary | `react/EnquiryForm.tsx` | Every carried preference (model, people, heating, changing area) is a visible, editable, removable field; a model change re-checks the heating preference through one shared rule and says what it changed |
| Model card / facts / price | `ModelCard`, `ModelFacts`, `PriceBlock` | One information hierarchy everywhere; unknown values render "Confirmed on enquiry", never zero |
| Gallery | `react/Gallery.tsx` | Keyboard operable, image count, thumbnails, enlarged view with explicit close and focus restoration |
| Compare | `react/CompareTool.tsx` | Real table on wide screens (at least two models, and it says so); on narrow ones two explicit selectors that swap on a clash, stacked groups with every value labelled and the price qualification beside each price. Shareable `?m=` URL, reset |
| Selector | `react/ModelSelector.tsx` | Shortlist only. Each result carries the answer snapshot that produced it; once the answers change it is marked outdated and its links are withdrawn until updated. Result in an `aria-live` region |
| Enquiry form | `react/EnquiryForm.tsx` | Persistent labels, inline errors plus a summary, input preserved on failure, honest demo vs live result, separate optional marketing consent |
| Accordion | `FaqList.astro` | Native `<details>`: scroll position is kept and state is exposed to assistive tech |
| Placeholder image | `Picture.astro` | Tonal frame with faint board lines and a visible label; never a drawn cabin |
| Stock preview image | `Picture.astro` | Real, openly licensed photograph, cropped to the slot's ratio, with responsive AVIF and WebP sources, a visible "Stock preview · not The Alder" tag and a credit on `/image-credits`; atmosphere only, never shown as the product |

States designed for: focus-visible (2 px ring, offset), hover, active, disabled, selected, error (colour plus an icon plus text), loading (spinner and label), empty (preview layouts), success (live and demo variants).

## Motion

Small feedback 160 ms, panels 320 ms, image changes 380 ms, reveals 560 ms, one ease-out curve, translations 16 px. Animation only on opacity and transform. Content is visible by default: the reveal script marks `<html>` with `reveal-armed` only after it has finished setting up, and only then may anything start hidden, so a blocked or failed script, no JavaScript, or reduced motion all leave every heading and action on screen (covered by a journey check). `prefers-reduced-motion` shows final states immediately, and nothing waits on an animation. No preloader, cursor effect, ribbon or scroll hijacking; scroll-driven pieces (materials, planning) follow the native scrollbar and have equivalent controls.

## Links and hosting

Every URL a React island creates goes through `src/lib/base-url.ts` (`pageHref`, `assetUrl`, `assetSrcset`), so the `href` attribute itself is correct wherever the site is mounted. In a static bundle each page carries `<meta name="ae-root">` and the helper builds URLs from it; there is no click interceptor, so Ctrl/Cmd-click, middle-click and copied links all work. `404.html` is the one document served at an arbitrary depth, so the static build anchors it to `STATIC_BASE` (for example `/alder-ember/`) while every other page stays relative and portable.

## Accessibility approach

Semantic landmarks and headings, a skip link, labelled forms with associated errors, tab semantics on the showcase, native disclosure for FAQs, 44 px minimum touch targets, visible focus, no information by colour alone. Automated axe checks and keyboard-driven journeys run against every route (see [test-report.md](test-report.md)). This targets WCAG 2.2 AA and is **not** a conformance claim: manual screen-reader and zoom review is still needed.

## Logo

Three directions were drawn and checked in the real header, footer, favicon and small-size contexts: (A) architectural wordmark with a cabin-frame mark, (B) timber and warmth, (C) an A/E construction monogram. **C is implemented.** B read as a bar chart and was rejected; A's mark was a generic window icon.

The symbol is an A and an E sharing one upright, joined by one bar that is both the A's crossbar and the E's middle arm (the only place ember appears in the mark). The wordmark is Newsreader, outlined so no font is needed, with the typeface's own italic ampersand: typeset, not hand-drawn. A hand-drawn angular ampersand was tried and dropped as clumsy. Files are in `public/brand/` (currentColor, dark, light, brand and brand-on-dark versions of the horizontal, compact and symbol marks; simplified favicon; PNG favicons; a live-text editable source). Regenerate with `npm run logo`, which also checks every SVG is well-formed XML.

The symbol is optically aligned to the lettering: its top meets the ascender line and its foot sits on the baseline, so it carries the same height as the words beside it (an earlier version floated about 10% short, which made it read as secondary). The header lockup is rendered at 1.6 rem (1.4 rem on narrow screens).

Clear space is half the symbol height. Minimum sizes (digital, from the renders on `/brand`): symbol 24 px, simplified favicon below that, horizontal lockup 110 px wide. Print reproduction has not been tested. No claim is made about trademark clearance or legal uniqueness.
