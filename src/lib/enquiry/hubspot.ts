/**
 * HubSpot Forms API adapter (v3 submissions).
 *
 * STATUS: implemented against HubSpot's documented endpoint but NOT verified against a real
 * portal: no HubSpot account, form or field names were supplied. Before launch (docs/integrations.md):
 *   1. confirm the form GUID and internal property names with Sales / the project team,
 *   2. set HUBSPOT_FIELD_MAP if names differ from the defaults below,
 *   3. test against a sandbox or test form, never the live sales system.
 * The portal ID and form GUID are not secrets, but they stay server-side with the rest of the config.
 */
import type { EnquiryInput } from './schema';

export interface HubspotConfig {
  portalId: string;
  formGuid: string;
  /** map of our field -> HubSpot internal property name */
  fieldMap?: Record<string, string>;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/** Default property names are PLACEHOLDERS until confirmed. */
export const DEFAULT_FIELD_MAP: Record<string, string> = {
  name: 'firstname',
  email: 'email',
  phone: 'phone',
  postcode: 'zip',
  projectType: 'ae_project_type',
  model: 'ae_model_of_interest',
  description: 'message',
  budget: 'ae_budget_range',
  timing: 'ae_preferred_timing',
  dimensions: 'ae_approx_dimensions',
  heating: 'ae_heating_preference',
  people: 'ae_usual_people',
  changingArea: 'ae_changing_area_preference',
  organisation: 'company',
  website: 'website',
  venueType: 'ae_venue_type',
  venueStatus: 'ae_venue_status',
  usualUsers: 'ae_usual_users',
  usageFrequency: 'ae_usage_frequency',
  openingTarget: 'ae_opening_target',
  contractors: 'ae_contractors',
  campaignId: 'ae_campaign_id',
  sourcePage: 'ae_source_page',
  marketingOptIn: 'ae_marketing_opt_in',
  reference: 'ae_enquiry_reference',
};

export function toHubspotFields(e: EnquiryInput, reference: string, map = DEFAULT_FIELD_MAP) {
  const src: Record<string, unknown> = { ...e, reference };
  const fields = Object.entries(map)
    .filter(([k]) => src[k] !== undefined && src[k] !== '')
    .map(([k, name]) => ({ name, value: String(src[k]) }));
  return fields;
}

export function createHubspotClient(cfg: HubspotConfig) {
  const map = { ...DEFAULT_FIELD_MAP, ...(cfg.fieldMap ?? {}) };
  const f = cfg.fetchImpl ?? fetch;
  return {
    async send(e: EnquiryInput, reference: string) {
      const url = `https://api.hsforms.com/submissions/v3/integration/submit/${encodeURIComponent(cfg.portalId)}/${encodeURIComponent(cfg.formGuid)}`;
      const body = {
        fields: toHubspotFields(e, reference, map),
        context: { pageUri: e.sourcePage ?? '', pageName: 'Alder & Ember enquiry' },
        // Marketing opt-in travels as a plain property. Recording it as HubSpot subscription consent needs the
        // real subscription type IDs, which have not been supplied (see docs/integrations.md).
      };
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), cfg.timeoutMs ?? 8000);
      try {
        const res = await f(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal });
        if (!res.ok) throw new Error(`HubSpot responded ${res.status}`);
      } finally {
        clearTimeout(t);
      }
    },
  };
}
