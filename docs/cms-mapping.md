# Page inventory and Webflow CMS mapping

This repository is a code-based reference implementation. It is **not** an editable Webflow site. This document maps it to the intended Webflow build (Client First-style class organisation, reusable components).

## Page and template inventory

| Route | Template | Data source | Status |
|---|---|---|---|
| `/` | Home | products, site, faqs, installations | Built |
| `/saunas` | Collection | products | Built |
| `/saunas/[rowan\|alder\|ember]` | Product (one template) | products, options, faqs, assets | Built, three pages from one template |
| `/compare` | Compare + selector | products, selector rules | Built |
| `/installation-delivery` | Content page | site, faqs | Built |
| `/installations`, `/installations/[slug]` | Index + story | installations | Index and story templates built; **no stories exist**; production omits both until one is approved |
| `/commercial` | Content page + form | site | Built |
| `/about`, `/care-support` | Content pages | site | Built; contact channels and profiles pending |
| `/guides`, `/guides/[slug]` | Index + article | guides | Built with six **draft** guides; production omits them until approved |
| `/plan-your-sauna` | Enquiry | products | Built; demo submission until configured |
| `/campaigns/[slug]` | Campaign | campaigns, products | Template built; one introduction campaign with no offer |
| `/privacy`, `/cookies`, `/terms`, `/warranty` | Policy | policies | Templates built; **no approved text**; `noindex` until approved. Cookies has working preference controls |
| 404 | Not found | none | Built |
| `/brand` | Internal review sheet | none | Preview only |
| `/robots.txt`, `/sitemap.xml` | Endpoints | visibility rules | Built; sitemap needs `PUBLIC_SITE_URL` |
| Accessories | none | none | **Deliberately not built**: no catalogue or checkout provider (see integrations) |

## CMS collections

| Webflow collection | Source file | Fields (from the brief, section 20) |
|---|---|---|
| **Products** | `content/products.ts` | id, slug, name, short description, format, comfortable min/max capacity, exterior W/D/H, interior dimensions, changing-area status, base requirements, weight, access requirements, clearances, materials, glazing, approved heater relationships, standard items, approved options, starting price (GBP minor units), VAT statement, price-scope copy, estimated lead time, gallery, documents, related FAQs and projects, SEO title/description, publication status, content approval status, last approval date |
| **Options** | `content/options.ts` | id, label, description, compatible product IDs, dependencies, included/optional, price type, approved price, assessment requirement, document reference, approval status |
| **Installations** | `content/installations.ts` | title, slug, model, region, description, gallery, site constraints, approved quotation, permission status, image rights, publication status, SEO |
| **FAQs** and **Guides** | `content/faqs.ts`, `content/guides.ts` | question/title, answer/body, topic, related items, technical approval status, reviewer, dates, SEO |
| **Campaigns** | `content/campaigns.ts` | title, slug, product, hero, approved offer terms, valid dates, content blocks, CTA, attribution id, publication status |
| **Assets** | `content/assets.ts` | role, model, ratio, alt, focal point, crop, kind, evidence type, rights, approval status |
| **Global settings** (single item) | `content/site.ts` | company description, contact channels, coverage copy, global CTA, policy links, cookie config, social, default metadata, response-time copy, integration references |
| **Policies** | `content/policies.ts` | title, approved body, approver, approval status |

Webflow notes: keep **price in minor units** or a number field and format in the template; model **approval status** as an option field and filter collection lists on `approved` for production; model **missing values as empty**, never zero, and hide empty rows with conditional visibility.

## Styles (Client First-style)

Tokens map to Webflow variables: `--c-*` to colour variables, `--s-*` to spacing, `--fs-*` to type sizes, `--w-*` to container widths. Utility-level classes mirror `global.css`: `container`, `section`, `grid-12` with `c-N` spans, `btn`/`btn--secondary`, `text-link`, `label`, `facts`, `accordion`, `is-forest`, `is-surface`.

## Interactions that need custom code in Webflow

Webflow's native interactions cover reveals, the sticky header colour change and accordions (use the native Dropdown or Accordion). These need an embed or custom code and should keep the behaviour described in [design-system.md](design-system.md):

| Behaviour | Why custom |
|---|---|
| "Find your fit" tabs with crossfade and ARIA tab semantics | Webflow Tabs can approximate it; verify keyboard arrows, `aria-selected` and the announcement |
| Compare (shareable URL, narrow-screen two-model layout) | Needs script for URL state and the narrow layout |
| Model selector | Rules in `src/lib/selector.ts` need a script (or a hosted function) |
| Enquiry form with validation, honeypot and idempotency | Use HubSpot's form or an embed posting to a server endpoint; never put credentials in the page |
| Gallery with enlarged view and focus restoration | Lightbox with explicit close and focus return |
| Mobile menu with focus trap | Native Webflow nav lacks a focus trap |
| Consent-aware analytics | Wire to the chosen consent tool; nothing loads before consent |

## What does not carry over

Static prerendering, the production leak check (`check:production`) and the Node enquiry endpoint have no direct Webflow equivalent. Replicate the intent: publish only approved items, validate on a server, and keep the HubSpot connection server-side.
