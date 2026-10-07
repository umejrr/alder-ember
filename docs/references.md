# Reference study

## What was inspected, and how

On 7 October 2026 I viewed the three primary references in a headless Chromium browser and by fetching their HTML and CSS, after the environment's network access was opened. (Earlier in the session all three were blocked, so the first design decisions followed the brief's own dossier; they were then checked against the real sites.)

| Reference | Inspected | Not inspected |
|---|---|---|
| Heritage Saunas | Homepage at 1440 px (full page) and 390 px (opening view); the published CSS (font families, colour variables, type sizes) | Model pages, craft/guide pages, interaction behaviour, loading sequence |
| Out of the Valley | Homepage opening view at 1440 px and 390 px | Everything below the opening, product pages, navigation behaviour |
| OKOPOD | Homepage opening view at 1440 px. The browser was redirected to the US site (`/us/`); regional products and pricing are not used here | Mobile layout, product pages, installation pages, configurator |

Competitor screenshots and assets are **not** stored in this repository. Nothing is copied: no logos, photographs, copy, claims, code or fonts.

## Observed patterns (facts about the references)

**Heritage Saunas.** Full-bleed landscape opening with a very large light serif headline set along the bottom edge over a dark gradient. A small light header card holds a wide-set capitals wordmark and five tiny uppercase links (on mobile, the same card with a menu icon). Below the opening the page moves between near-black green and warm beige with hairline vertical rules and no rounded corners; headings are modest serif, labels tiny uppercase. A craft section pairs a flush-edge photograph with a short serif heading and small body. A "Choose your scale" block is a bordered box: a large image area on the left and a list of four options on the right (name and dimensions in small caps; the active row is tinted). Recent builds use a full-width image with a caption strip. The close is one large serif invitation and a minimal footer. The CSS names the display serif "Lust" and sans "Aeonik", "Equitan Sans" and "Brolink": commercial families we do not use.

**Out of the Valley.** Full-bleed misty photograph of a small cabin in woodland, with a soft dark gradient. A small light symbol and wordmark top-left and four plain links top-right. A two-line sans headline with a muted one-line tagline sits lower-left. The opening is a slideshow of products with a caption and previous/next controls bottom-right. Mobile keeps the same composition with a text "Menu" control.

**OKOPOD.** A dark announcement strip with a star rating, then a white header with a widely spaced wordmark, dropdown navigation and two warm tan pill buttons. A large rounded-corner photograph with an oversized sans headline lower-left, slideshow dots and a "Latest News" card.

## What Alder & Ember took, and what is original

Weighting. The brief proposes roughly 50 / 30 / 20 (Out of the Valley / Heritage / OKOPOD). The owner then said Heritage is the closest match to the site they want and should be the main inspiration, so the build leans Heritage-first, with Out of the Valley's restraint and OKOPOD's product clarity as supporting influences.

| Principle | From | How it appears here (original composition) |
|---|---|---|
| Dark forest chapters against warm light chapters, hairline rules, square edges | Heritage | Deep-forest hero, "Considered in every detail", closing and footer; warm canvas for the collection, specifications, forms and planning content |
| Serif-led editorial headings with quiet uppercase labels | Heritage | Newsreader display and headings, Manrope labels and facts |
| A bordered chooser: big image, option list, tinted active row | Heritage | "Find your fit": image left, model rail right, the active model carrying capacity, footprint, price scope and actions (more product information than the reference shows) |
| Photography does the emotional work; a restrained header and one clear action | Out of the Valley | Quiet header, single hero image (no slideshow), copy lower-left, never across the cabin door |
| Clear model information, price context and a visible route to enquiry | OKOPOD | Identical information hierarchy per model, price scope next to price, "Plan your sauna" as the one primary action |

Deliberately **not** carried over: Heritage's one-line headline spanning the whole width, light header card and loading behaviour; Out of the Valley's product slideshow and "commission" positioning; OKOPOD's rounded hero, pill buttons, ratings strip and announcement bar; and every competitor claim (handmade in Devon, local redwood, years of experience, sustainability, finance).

The brief's creative decision rules still win where they conflict: accurate information, then a usable accessible journey, then original identity, then craft, then motion.
