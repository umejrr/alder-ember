// Retry delivery of pending/failed enquiries to HubSpot.   npm run outbox:retry
// Requires the same env as the server: ENQUIRY_OUTBOX_DIR, HUBSPOT_PORTAL_ID, HUBSPOT_FORM_GUID.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const dir = resolve(process.env.ENQUIRY_OUTBOX_DIR || './data/outbox');
const { HUBSPOT_PORTAL_ID: portal, HUBSPOT_FORM_GUID: guid } = process.env;
if (!portal || !guid) {
  console.error('HUBSPOT_PORTAL_ID and HUBSPOT_FORM_GUID are required. Nothing was sent.');
  process.exit(1);
}
const map = process.env.HUBSPOT_FIELD_MAP ? JSON.parse(process.env.HUBSPOT_FIELD_MAP) : null;
const DEFAULT_MAP = { name: 'firstname', email: 'email', phone: 'phone', postcode: 'zip', projectType: 'ae_project_type', model: 'ae_model_of_interest', description: 'message', budget: 'ae_budget_range', timing: 'ae_preferred_timing', dimensions: 'ae_approx_dimensions', heating: 'ae_heating_preference', people: 'ae_usual_people', changingArea: 'ae_changing_area_preference', organisation: 'company', website: 'website', venueType: 'ae_venue_type', venueStatus: 'ae_venue_status', usualUsers: 'ae_usual_users', usageFrequency: 'ae_usage_frequency', openingTarget: 'ae_opening_target', contractors: 'ae_contractors', campaignId: 'ae_campaign_id', sourcePage: 'ae_source_page', marketingOptIn: 'ae_marketing_opt_in', reference: 'ae_enquiry_reference' };
const fieldMap = { ...DEFAULT_MAP, ...(map ?? {}) };

let ok = 0, failed = 0;
for (const name of (await readdir(dir).catch(() => [])).filter((n) => n.endsWith('.json'))) {
  const path = join(dir, name);
  const rec = JSON.parse(await readFile(path, 'utf8'));
  if (rec.delivery.status === 'delivered') continue;
  const src = { ...rec.enquiry, reference: rec.reference };
  const fields = Object.entries(fieldMap).filter(([k]) => src[k] !== undefined && src[k] !== '').map(([k, n]) => ({ name: n, value: String(src[k]) }));
  try {
    const res = await fetch(`${process.env.HUBSPOT_API_BASE || 'https://api.hsforms.com'}/submissions/v3/integration/submit/${portal}/${guid}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fields, context: { pageUri: src.sourcePage ?? '', pageName: 'Alder & Ember enquiry' } }),
    });
    if (!res.ok) throw new Error(`HubSpot responded ${res.status}`);
    rec.delivery = { status: 'delivered', attempts: rec.delivery.attempts + 1, deliveredAt: new Date().toISOString() };
    ok++;
  } catch (e) {
    rec.delivery = { status: 'failed', attempts: rec.delivery.attempts + 1, lastError: String(e.message).slice(0, 300) };
    failed++;
  }
  await writeFile(path, JSON.stringify(rec, null, 2), { mode: 0o600 });
}
console.log(`Retried: ${ok} delivered, ${failed} still failing.`);
