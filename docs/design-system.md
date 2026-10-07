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
| Model showcase | `react/FindYourFit.tsx` | Tabs change the model only (no navigation). Crossfade between images. Arrow/Home/End keys, live-region announcement, selection stored for the enquiry |
| Model card / facts / price | `ModelCard`, `ModelFacts`, `PriceBlock` | One information hierarchy everywhere; unknown values render "Confirmed on enquiry", never zero |
| Gallery | `react/Gallery.tsx` | Keyboard operable, image count, thumbnails, enlarged view with explicit close and focus restoration |
| Compare | `react/CompareTool.tsx` | Real table on wide screens; two-model stacked groups, each value labelled, on narrow ones. Shareable `?m=` URL, reset |
| Selector | `react/ModelSelector.tsx` | Shortlist only. Result in an `aria-live` region |
| Enquiry form | `react/EnquiryForm.tsx` | Persistent labels, inline errors plus a summary, input preserved on failure, honest demo vs live result, separate optional marketing consent |
| Accordion | `FaqList.astro` | Native `<details>`: scroll position is kept and state is exposed to assistive tech |
| Placeholder image | `Picture.astro` | Tonal frame with faint board lines and a visible label; never a drawn cabin |
| Stock preview image | `Picture.astro` | Real, openly licensed photograph with responsive WebP `srcset`, a visible "Stock preview · not The Alder" tag and a credit on `/image-credits`; atmosphere only, never shown as the product |

States designed for: focus-visible (2 px ring, offset), hover, active, disabled, selected, error (colour plus an icon plus text), loading (spinner and label), empty (preview layouts), success (live and demo variants).

## Motion

Small feedback 160 ms, panels 320 ms, reveals 560 ms, one ease-out curve, translations 16 px. Animation only on opacity and transform. Content is visible without JavaScript, `prefers-reduced-motion` shows final states immediately, and nothing waits on an animation. No preloader, cursor effect, ribbon or scroll hijacking.

## Accessibility approach

Semantic landmarks and headings, a skip link, labelled forms with associated errors, tab semantics on the showcase, native disclosure for FAQs, 44 px minimum touch targets, visible focus, no information by colour alone. Automated axe checks and keyboard-driven journeys run against every route (see [test-report.md](test-report.md)). This targets WCAG 2.2 AA and is **not** a conformance claim: manual screen-reader and zoom review is still needed.

## Logo

Three directions were drawn and checked in the real header, footer, favicon and small-size contexts: (A) architectural wordmark with a cabin-frame mark, (B) timber and warmth, (C) an A/E construction monogram. **C is implemented.** B read as a bar chart and was rejected; A's mark was a generic window icon.

The symbol is an A and an E sharing one upright, joined by one bar that is both the A's crossbar and the E's middle arm (the only place ember appears in the mark). The wordmark is Newsreader, outlined so no font is needed, with the typeface's own italic ampersand: typeset, not hand-drawn. A hand-drawn angular ampersand was tried and dropped as clumsy. Files are in `public/brand/` (currentColor, dark, light, brand and brand-on-dark versions of the horizontal, compact and symbol marks; simplified favicon; PNG favicons; a live-text editable source). Regenerate with `npm run logo`, which also checks every SVG is well-formed XML.

Clear space is half the symbol height. Minimum sizes (digital, from the renders on `/brand`): symbol 24 px, simplified favicon below that, horizontal lockup 110 px wide. Print reproduction has not been tested. No claim is made about trademark clearance or legal uniqueness.
