# Integrations

Boundaries are small and explicit. Nothing here has been connected to a live system, and no secrets are committed.

| Integration | Status | Where |
|---|---|---|
| Enquiry form (client and server validation) | **Implemented** | `src/lib/enquiry/schema.ts`, `handler.ts`, `src/pages/api/enquiry.ts` |
| Demo submission | **Implemented** and the default | `ENQUIRY_MODE=demo` |
| Durable outbox and retry | **Implemented**, tested with mocks and by hand | `src/lib/enquiry/outbox.ts`, `scripts/outbox-retry.mjs` |
| HubSpot Forms API | **Implemented, not verified against a real portal.** Awaiting configuration | `src/lib/enquiry/hubspot.ts` |
| Sales alert and customer confirmation email | **Not configured.** Returns "not sent"; the UI never claims an email was sent | `src/lib/enquiry/notify.ts` |
| Analytics and consent | **Boundary built, no provider chosen**, so nothing is sent and no banner is shown | `src/lib/analytics.ts`, `src/lib/consent.ts` |
| Static preview form | **Client-side demo only.** Validates, then shows the demo confirmation; sends and stores nothing | `PUBLIC_STATIC_DEMO=true` (`npm run build:static`) |
| Booking | **Not built.** No calendar or booking process exists; no slots are invented | n/a |
| Accessory checkout | **Not built.** No approved catalogue, prices, stock process, payment provider or terms; no pretend cart | n/a |
| Email marketing | **Not connected.** The opt-in is a separate, optional checkbox that travels as a property | `ae_marketing_opt_in` |
| File uploads | **Not built.** No secure storage exists; photos are requested in the reply | n/a |

## The enquiry flow

1. The browser validates (for usability), then POSTs JSON to `/api/enquiry`.
2. The server rejects wrong content types, cross-origin requests, oversize bodies (20 KB), honeypot hits, submissions faster than 2 s and rate-limit breaches (5 per IP per 10 minutes), then **validates again** (never trusting the client).
3. A client-generated idempotency key makes a repeat submission return the original result rather than creating a duplicate.
4. **Demo mode:** nothing is stored or sent, and the response says so. The page shows "Demo mode: nothing was sent". A demo is never counted as a conversion.
5. **Live mode:** if no destination is configured the server returns 503 rather than accepting into a void. Otherwise it writes the enquiry to the outbox (success is returned only after that write), then sends it to HubSpot. If HubSpot fails the record stays queued and is retried by `npm run outbox:retry`. The response says `delivered` or `queued`; the page only ever says it has *received* the enquiry.
6. Analytics `submit_enquiry_success` fires only for a live, accepted enquiry.

Limits: the rate limiter and idempotency cache are in memory (single process). Use a shared store if the site runs on more than one instance.

## HubSpot: before going live

1. Confirm the form (GUID) and internal property names with Sales. The default names in `hubspot.ts` (`ae_model_of_interest` and so on) are placeholders. Override with `HUBSPOT_FIELD_MAP`.
2. Define the lead stages as the source of truth in HubSpot: new, consultation, site assessment, quoted, ordered, installation, aftercare.
3. Test against a sandbox or test form. Do not write to the live sales system during preview.
4. Marketing consent: the opt-in is sent as a plain property. Recording it as HubSpot subscription consent needs the real subscription type IDs, which were not supplied.
5. Set `ENQUIRY_MODE=live`, `PUBLIC_ENQUIRY_MODE=live`, `HUBSPOT_PORTAL_ID`, `HUBSPOT_FORM_GUID`, and a private `ENQUIRY_OUTBOX_DIR`. The outbox holds personal data: keep it outside the web root and apply the approved retention policy.

## Analytics events

| Event | Fired | Properties (non-personal, allow-listed) |
|---|---|---|
| `view_product` | model page load | `model_id` |
| `compare_models` | comparison changed by the visitor | `model_ids` |
| `start_model_selector` | first selector interaction | `entry_page` |
| `complete_model_selector` | result shown | `suggested_model_id`, `project_type`, `result_kind` |
| `start_enquiry` | first form interaction | `model_id`, `source_page` |
| `submit_enquiry_success` | live enquiry accepted | `model_id`, `project_type`, `campaign_id` |
| `enquiry_submission_error` | submission failed | `error_category` |
| `consultation_booking_success`, `accessory_order_success` | **not wired** (no booking or checkout) | n/a |

Names, emails, phone numbers, postcodes, uploaded photos and free text can never reach a provider: `sanitize()` drops every key not on the allow-list and any value that looks like an email or a long number (covered by tests). Qualified enquiry, consultation, quote, order and order value are CRM outcomes, not website events.

## Consent

Analytics and marketing are off until a visitor opts in; the choice is stored locally as a small flag with no identifier. With no provider configured there is nothing non-essential to consent to, so no banner is shown (the `/cookies` page still has working controls). When a provider is chosen, set `PUBLIC_ANALYTICS_PROVIDER` (which also shows the banner) and register it with `configureProvider()`. Its cookies must be listed in the approved cookie text before launch.
