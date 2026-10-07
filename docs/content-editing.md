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
| `working` | Approximate, proposed or awaiting approval (all prices, dimensions, capacities, lead times) | shown, with a preview notice | **omitted** (or replaced by "Confirmed on enquiry") |
| `missing` | Not supplied. The value is `null`, never `0` | not shown | not shown |

To approve a value: change its status from `'working'` to `'approved'` (and set `approval.lastApproved` on the product). That single change makes it appear in production. Do this only after the owner below has signed off.

## Who approves what

| Content | Owner |
|---|---|
| Dimensions, weights, base, access, clearances, package inclusions, heater compatibility, lead times, installation details | Operations |
| Starting prices, payment terms, delivery/installation charging scope, option prices | Daniel (with Operations) |
| Enquiry routing, availability, response-time wording | Sales |
| Imagery, installation stories, FAQs, campaigns | Marketing (with permissions recorded) |
| Privacy, cookies, terms, warranty | Daniel and the appropriate adviser |
| Technical guides | Operations or a technical adviser |

## Consequences of common changes

- **Changing a price** updates every card, the comparison, the selector, the enquiry context and the model page. Store it in pence (`1295000` is £12,950). Keep the VAT statement and price-scope sentence accurate: never imply an installed total.
- **Approving an option** (`src/content/options.ts`): set `compatibleProductIds` to `field([...], 'approved')`. Only then does it become selectable for those models. Until then it appears under "Other options to discuss". Give it an approved price or leave `quoted-after-assessment`.
- **Resolving the Ember's changing area:** update `changingArea` (and the options entry) once Operations decides whether it is included, optional or a separate configuration. Until then the site says it is "described with a changing area" and "still being confirmed".
- **Adding a technical value** (weight, base, clearances): replace `missing()` with `field(value, 'approved')`. Missing values must stay `null`.
- **Adding photography:** edit `src/content/assets.ts` ([asset-manifest.md](asset-manifest.md)).
- **Adding an installation story:** append to `src/content/installations.ts` with permission and image rights recorded. Until at least one approved story exists, the installations route and navigation item are left out of production builds.
- **Publishing a guide:** set `approval: 'approved'` and add a `reviewer`. Unapproved guides and the guides index are not built in production.
- **Publishing a policy:** fill `body` and set `approval: 'approved'` in `src/content/policies.ts`. Until then the page says it is being finalised and stays `noindex`.
- **Lead time, coverage and contact details** live in `products.ts` and `site.ts`. Contact details are deliberately empty (`APPROVED_SUPPORT_EMAIL_REQUIRED` and so on in the field notes) and are never rendered until supplied.

## Routes that depend on content

| Route | Production behaviour |
|---|---|
| `/guides`, `/guides/[slug]` | Generated only for approved guides; footer link and FAQ links hide with them |
| `/installations`, `/installations/[slug]` | Generated only when an approved story exists; nav item hides. `/installations/preview-template` is preview-only |
| `/campaigns/[slug]` | Generated only for approved campaigns. The campaign here makes no offer: none was supplied |
| `/brand` | Preview only |
| Policy pages | Always present (legal links are needed) but `noindex` until approved |
| `sitemap.xml` | Only with `PUBLIC_SITE_URL`; lists real, indexable pages only |

## Before a production build

Run `npm run check:production`. It builds in production mode and fails if the output contains a working price, dimension, capacity or lead time, a preview notice, a draft route, or a broken indexing rule.
