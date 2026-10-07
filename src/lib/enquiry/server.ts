/** Wires the handler to real adapters from environment variables (server-side only). */
import { resolve } from 'node:path';
import { createDedupe, createRateLimiter } from './limits';
import { createOutbox } from './outbox';
import { createHubspotClient } from './hubspot';
import type { Deps } from './handler';

let cached: Deps | null = null;

export function getDeps(env: NodeJS.ProcessEnv = process.env): Deps {
  if (cached) return cached;
  const mode = env.ENQUIRY_MODE === 'live' ? 'live' : 'demo';
  const outbox = createOutbox(resolve(env.ENQUIRY_OUTBOX_DIR || './data/outbox'));
  let fieldMap: Record<string, string> | undefined;
  try {
    fieldMap = env.HUBSPOT_FIELD_MAP ? JSON.parse(env.HUBSPOT_FIELD_MAP) : undefined;
  } catch {
    fieldMap = undefined;
  }
  const crm =
    env.HUBSPOT_PORTAL_ID && env.HUBSPOT_FORM_GUID
      ? createHubspotClient({ portalId: env.HUBSPOT_PORTAL_ID, formGuid: env.HUBSPOT_FORM_GUID, fieldMap, apiBase: env.HUBSPOT_API_BASE || undefined })
      : null;
  cached = {
    mode,
    now: Date.now,
    store: {
      save: (e) => outbox.save(e),
      markDelivered: (r) => outbox.markDelivered(r),
      markFailed: (r, err) => outbox.markFailed(r, err),
    },
    crm,
    limiter: createRateLimiter(Number(env.ENQUIRY_RATE_LIMIT_MAX) || 5),
    dedupe: createDedupe(),
  };
  return cached;
}
