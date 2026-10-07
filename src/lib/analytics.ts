/**
 * Analytics boundary (brief section 22 event plan).
 *
 * - Nothing is sent unless (a) a provider is configured via PUBLIC_ANALYTICS_PROVIDER and
 *   (b) the visitor has opted in to analytics.
 * - Only allow-listed, non-personal properties are ever passed on. Names, emails, phone
 *   numbers, postcodes and free text can never reach a provider, even by mistake.
 * - No provider has been chosen yet, so by default every call is a no-op.
 */
import { analyticsAllowed } from './consent';

export type EventName =
  | 'view_product'
  | 'compare_models'
  | 'start_model_selector'
  | 'complete_model_selector'
  | 'start_enquiry'
  | 'submit_enquiry_success'
  | 'enquiry_submission_error'
  | 'consultation_booking_success'
  | 'accessory_order_success';

const ALLOWED: Record<EventName, string[]> = {
  view_product: ['model_id'],
  compare_models: ['model_ids'],
  start_model_selector: ['entry_page'],
  complete_model_selector: ['suggested_model_id', 'project_type', 'result_kind'],
  start_enquiry: ['model_id', 'source_page'],
  submit_enquiry_success: ['model_id', 'project_type', 'campaign_id'],
  enquiry_submission_error: ['error_category'],
  consultation_booking_success: ['source_page', 'model_id'],
  accessory_order_success: ['transaction_context'],
};

type Prim = string | number | boolean;

/** Keep only allow-listed keys with short primitive values that do not look like personal data. */
export function sanitize(name: EventName, props: Record<string, unknown> = {}): Record<string, Prim> {
  const out: Record<string, Prim> = {};
  for (const key of ALLOWED[name] ?? []) {
    let v = props[key];
    if (Array.isArray(v)) v = v.filter((x) => typeof x === 'string').join(',');
    if (typeof v === 'string') {
      if (v.length > 80 || /@/.test(v) || /\d{5,}/.test(v)) continue;
      out[key] = v;
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      out[key] = v;
    }
  }
  return out;
}

export interface Provider {
  send(name: EventName, props: Record<string, Prim>): void;
}

let provider: Provider | null = null;
export function configureProvider(p: Provider | null) {
  provider = p;
}

const configured = (import.meta.env?.PUBLIC_ANALYTICS_PROVIDER as string | undefined) ?? '';
if (configured === 'console') {
  // Development aid only: logs sanitised events, sends nothing anywhere.
  provider = { send: (n, p) => console.debug('[analytics]', n, p) };
}

export function track(name: EventName, props: Record<string, unknown> = {}) {
  if (!provider) return;
  if (!analyticsAllowed()) return;
  provider.send(name, sanitize(name, props));
}
