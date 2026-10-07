# Alder & Ember

Website and brand system for **Alder & Ember**, a UK supplier and installer of premium outdoor saunas. This is a **reviewable prototype**, built to the master brief. It is not a launched site: prices, dimensions and lead times are working values awaiting approval, images are labelled placeholders, and the enquiry form runs in demo mode until a destination is configured.

![Home, desktop](docs/screenshots/home-desktop-hero.jpg)

## What is here

- **Original identity:** logo system (editable SVG), palette, type and tokens. See `/brand` in a preview build and [docs/design-system.md](docs/design-system.md).
- **The full launch sitemap:** home, collection, three model pages from one product source, compare, installation & delivery, installations (preview template only), commercial, about, care & support, guides, campaigns, plan your sauna, policies, 404.
- **Signature component, "Find your fit":** a photographic three-model showcase on the home page, driven by the same product records as every other page.
- **Compare and a shortlist selector:** shareable compare URLs, a labelled narrow-screen layout, and a selector that never claims a model "fits" or approves a site.
- **Enquiry journey:** residential and commercial forms, shared client/server validation, honest demo vs live submission, a durable outbox and a HubSpot adapter.
- **Content integrity built in:** every fact carries an approval status. Preview shows working values; production omits anything unresolved.

## Run it

```bash
npm install
npm run dev                  # http://localhost:4321, preview mode
npm run build && npm start   # production-style server (static pages + the enquiry API)
```

Node 22+. Copy `.env.example` to `.env` to change modes. No secrets are needed to preview.

| Command | What it does |
|---|---|
| `npm test` | Unit tests: product data, content gating, selector rules, enquiry validation and handler |
| `npm run check` | Type-check Astro, TypeScript and React (`astro check`) |
| `npm run build:production` | Production-mode build (hides unapproved values and routes) |
| `npm run check:production` | Builds in production mode and scans the output for leaked working values, drafts and unapproved routes |
| `npm run e2e` / `npm run a11y` | Browser journey checks / axe accessibility scan (need a running build: `npm run build && npm run serve`) |
| `npm run build:static` / `npm run e2e:static` | Static, sub-path-safe preview bundle / its browser test |
| `npm run crawl` | Crawls a running build for broken links, anchors and assets |
| `npm run contrast` | WCAG contrast check for every text and control pair in the tokens |
| `npm run logo` | Regenerates the logo SVGs and PNG favicons into `public/brand/` |
| `npm run manifest` | Regenerates [docs/asset-manifest.md](docs/asset-manifest.md) |
| `npm run outbox:retry` | Retries delivery of queued enquiries to HubSpot |

## Stack and why

**Astro 7 + React islands + TypeScript.** Pages are prerendered to static HTML, which is what a content-led, indexable site needs, and only the interactive pieces (model showcase, gallery, compare, selector, enquiry form) ship JavaScript. Only `/api/enquiry` runs on the server (`@astrojs/node`). The brief allows a code prototype where no Webflow environment exists; this is **not** an editable Webflow site. [docs/cms-mapping.md](docs/cms-mapping.md) maps every template, collection and interaction to a Webflow build.

## Deploying

`npm run build` produces `dist/client` (static pages) and `dist/server` (the enquiry endpoint). Run it with `npm start` on any Node 22 host behind HTTPS; put `ENQUIRY_*` and `HUBSPOT_*` variables in the host's secret store, never in the repo. A static-only host can serve `dist/client` but cannot run `/api/enquiry`, so use the Node host (or swap in the matching Astro adapter) for the live form. Nothing has been deployed: production deployment needs the agreed environment and authorisation ([docs/launch-dependencies.md](docs/launch-dependencies.md)).

## Hosted preview (static bundle)

`npm run build:static` builds `dist-static/`: a fully static copy that works from any URL or sub-path (every link is relative, no server). The enquiry form there is a **client-side demo**: it validates for real, then says plainly that nothing was sent. `npm run package:artifact` prepares it for publishing as a hosted Artifact, and `npm run e2e:static` tests it from a nested sub-path, failing if any request escapes that path. The same bundle can go on any static host (for example GitHub Pages, Netlify or Vercel). A static host cannot run `/api/enquiry`, so live enquiries still need the Node build.

## Content modes

`PUBLIC_CONTENT_MODE=preview` (default) shows brief and working values with a visible preview notice. `production` shows only approved and brief-supplied values and does not generate routes that lack approved content (guides, installations, campaigns, the brand sheet). Details and the consequences of changing a value are in [docs/content-editing.md](docs/content-editing.md).

## Handover documents

| Document | Contents |
|---|---|
| [docs/design-system.md](docs/design-system.md) | Tokens, type, layout, components and states, motion, accessibility approach, logo rationale |
| [docs/references.md](docs/references.md) | What was inspected, what was observed, and what is original |
| [docs/content-editing.md](docs/content-editing.md) | The content source, approval statuses, roles, how to change prices and options safely |
| [docs/cms-mapping.md](docs/cms-mapping.md) | Page and template inventory, and the Webflow CMS mapping |
| [docs/integrations.md](docs/integrations.md) | HubSpot, booking, accessories, email, analytics and consent: what is implemented, demo, or awaiting configuration |
| [docs/launch-dependencies.md](docs/launch-dependencies.md) | What must be supplied or decided before launch, with owners |
| [docs/asset-manifest.md](docs/asset-manifest.md) | Image roles, status and the outstanding photography brief |
| [docs/test-report.md](docs/test-report.md) | The checks actually run, with outcomes and what could not be verified |
| [docs/screenshots/](docs/screenshots) | Representative desktop and mobile screenshots |

## Not done, on purpose

No public deployment, live CRM writes, live payments or customer emails. No invented reviews, projects, contact details, certifications, manufacturer names, running costs, weights or warm-up times. See [docs/launch-dependencies.md](docs/launch-dependencies.md).
