# Launch dependencies

The site was finalised on 22 October 2026: every value on it is approved, the preview, demo and "working figure" labels are gone, and nothing below is a placeholder on a page. What follows is information, decisions and accounts that only Alder & Ember can provide. Each is something the site cannot invent, so it either says how the thing is confirmed ("in your quotation", "during the site review") or leaves it out.

## The one that stops enquiries

| # | What is needed | Owner | What it unblocks |
|---|---|---|---|
| 1 | **Somewhere for enquiries to go**: an email address that is read, or a form service or HubSpot ([integrations.md](integrations.md)) | Alder & Ember | The enquiry forms. Today they check the visitor's answers and then say plainly that **nothing was sent**, because no inbox is connected. A static host (GitHub Pages) cannot receive them, so this needs an address the form can mail to, a form service, or the Node build with `ENQUIRY_MODE=live` |

## Needed before the site is promoted

| # | What is needed | Owner | What it unblocks |
|---|---|---|---|
| 2 | Contact details (email, phone, address), and the registered business identity | Alder & Ember | Contact channels, the Organisation details, and a named contact route in the privacy notice (it currently says "contact us through the Plan your sauna page") |
| 3 | The real domain, set as `PUBLIC_SITE_URL` | Alder & Ember | Search indexing. Until it is set every page says `noindex` and `robots.txt` blocks crawling, by design. Setting it also switches on canonical links, the sitemap and the link-preview image's absolute URL |
| 4 | Warranty text (cabin cover, equipment cover, claims, first point of contact) | Owner and manufacturer | A warranty page. There is none: cover is a commitment the site must not make up, so the page, its footer link and its mentions were removed |
| 5 | A solicitor's read of the **privacy notice** and **website terms** | Alder & Ember | Relying on them. They are standard UK boilerplate (UK GDPR notice; website terms with a quotation-based sale), written on 22 October 2026. They assume a three-year retention period for enquiries and six years for customers, and say nothing about company registration, deposits or cancellation, which belong in the written quotation |
| 6 | For every photograph: the photographer, licence terms and which sauna it shows | Alder & Ember | Treating any image as proof of a specific model or a completed job. The owner approved the photographs as real on 22 October 2026, but none of this is recorded; the installation and site-access pictures in particular should be confirmed as real jobs |
| 7 | Higher-resolution photographs (the supplied ones are 1448 to 1884 px wide) | Alder & Ember | Sharpness on very large or high-density screens. The shoot is specified in [photo-brief.md](photo-brief.md) |

## Information the site says is confirmed later

| # | What is needed | Owner | What it unblocks |
|---|---|---|---|
| 8 | Manufacturer drawings: base, access, clearances and weight for each model | Operations | The "Installation requirements" rows, which currently read "Confirmed for your site during the site review" |
| 9 | The Ember's changing-area treatment (included, optional or separate), option compatibility and prices (glazing, finishes, alternative heaters, controls, backrests, lighting, entrance platforms) | Operations / Daniel | Selectable options and the Ember's changing-area wording ("confirmed in your quotation") |
| 10 | Care instructions per model, and the heater manufacturers' documents | Operations | A fuller care page. The page describes how aftercare works and does not publish procedures |
| 11 | Genuine installation stories and customer reviews, with permissions | Alder & Ember | A new "Our installations" section. It was removed on 22 October 2026 because none existed |

## Technical

| # | What is needed | Owner | What it unblocks |
|---|---|---|---|
| 12 | HubSpot configuration, field names, routing and a test destination | Sales / project team | Live enquiries through the Node build ([integrations.md](integrations.md)) |
| 13 | Email, booking, checkout and analytics providers, and the consent implementation | Project team | Customer confirmation, booking and measurement. No analytics is loaded, and the privacy notice says so; adding any needs a consent step and a notice update first |
| 14 | Webflow workspace and build decision | Project team | Whether this is rebuilt in Webflow ([cms-mapping.md](cms-mapping.md)) or deployed as code |

## Decisions recorded in the content

- **Quotation journey:** all core models are sold by quotation. There is no online ordering and no direct-buy route.
- **Founder profile and team photographs:** none were supplied, so the About page describes roles only.
- **Technical claims:** no heater brands, outputs, running costs, warm-up times or manufacturer names are published.
- **No cookie page or consent banner:** the site sets no cookies and loads no analytics or advertising tools, so there is nothing to consent to. The privacy notice explains this, and a banner appears only if an analytics provider is ever configured.
