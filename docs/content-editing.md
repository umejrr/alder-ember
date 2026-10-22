# Editing content

There is no custom admin. Content lives in typed files under `src/content/`, and every page reads from them. When the site moves to Webflow, these map to CMS collections ([cms-mapping.md](cms-mapping.md)).

## The one rule

**Every price and specification comes from `src/content/products.ts`.** Cards, model pages, comparison, selector, enquiry summaries and metadata all read it. Never type a price or dimension into a page.

## Approval statuses

Each value carries a status (`src/content/types.ts`):

| Status | Meaning | Preview build | Production build |
|---|---|---|---|
| `approved` | Confirmed by the named owner | shown | shown |
| `brief` | Supplied in the discovery answers; usable but not independently verified | shown | shown |
| `working` | A draft value that is not approved yet. Nothing in the site uses it today: every price, dimension, capacity and lead time was approved on 22 October 2026. Use it to stage a new value | shown, with a preview notice | **omitted** |
| `missing` | Not supplied. The value is `null`, never `0` | not shown | not shown |

To stage a new or changed value, give it status `'working'` and build with `PUBLIC_CONTENT_MODE=preview` to review it. To approve it: change the status to `'approved'` (and set `approval.lastApproved` on the product). That single change makes it appear in production. Do this only after the owner below has signed off.

## Who approves what

| Content | Owner |
|---|---|
| Dimensions, weights, base, access, clearances, package inclusions, heater compatibility, lead times, installation details | Operations |
| Starting prices, payment terms, delivery/installation charging scope, option prices | Daniel (with Operations) |
| Enquiry routing, availability, response-time wording | Sales |
| Imagery, installation stories, FAQs, campaigns | Marketing (with permissions recorded) |
| Privacy notice, website terms, warranty | Daniel and the appropriate adviser |
| Technical guides | Operations or a technical adviser |

## Consequences of common changes

- **Changing a price** updates every card, the comparison, the selector, the enquiry context and the model page. Store it in pence (`1295000` is £12,950). Keep the VAT statement and price-scope sentence accurate: never imply an installed total.
- **Approving an option** (`src/content/options.ts`): set `compatibleProductIds` to `field([...], 'approved')`. Only then does it become selectable for those models. Until then it appears under "Other options to discuss". Give it an approved price or leave `quoted-after-assessment`.
- **Resolving the Ember's changing area:** update `changingArea` (and the options entry) once Operations decides whether it is included, optional or a separate configuration. Until then the site says it is "described with a changing area" and that how it is specified is "confirmed in your quotation".
- **Adding a technical value** (weight, base, clearances): replace `missing()` with `field(value, 'approved')`. Missing values must stay `null`.
- **Adding photography:** edit `src/content/assets.ts` ([asset-manifest.md](asset-manifest.md)).
- **Adding an installation story:** the "Our installations" section was removed on 22 October 2026 because no real project existed. To bring it back, add real, permissioned projects (a data file, an index and a story page, the navigation item and a home-page block).
- **Publishing a guide:** set `approval: 'approved'` and add a `reviewer`. Unapproved guides and the guides index are not built in production.
- **Editing a policy:** the privacy notice and website terms are sections in `src/content/policies.ts` (each with an optional `id` so another page can link to it, for example `/privacy#cookies`). To add a warranty page, add a `warranty` entry there with its text, add `src/pages/warranty.astro` (it renders `<PolicyPage slug="warranty" />`), and link it from the footer. A policy with an empty `body` says it is being finalised and stays `noindex`.
- **Lead time, coverage and contact details** live in `products.ts` and `site.ts`. Contact details are deliberately empty (`APPROVED_SUPPORT_EMAIL_REQUIRED` and so on in the field notes) and are never rendered until supplied.

## Routes that depend on content

| Route | Production behaviour |
|---|---|
| `/guides`, `/guides/[slug]` | Generated only for approved guides; footer link and FAQ links hide with them |
| `/campaigns/[slug]` | Generated only for approved campaigns. The campaign here makes no offer: none was supplied |
| `/brand` | Preview mode only |
| `/privacy`, `/terms` | Always present, indexable once a domain is set. There is no cookie page: the site sets no cookies (see the privacy notice) |
| `sitemap.xml` | Only with `PUBLIC_SITE_URL`; lists real, indexable pages only |

## Before a production build

Run `npm run check:production`. It builds in production mode and fails if any page contains preview, demo, draft or placeholder wording, if a removed page is still linked, if a page has no link-preview image, or if indexing does not follow the domain (with no `PUBLIC_SITE_URL` every page must say `noindex`).
