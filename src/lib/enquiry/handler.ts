/**
 * Enquiry handler. Framework-free so it can be tested with mocks.
 *
 * Modes (ENQUIRY_MODE):
 *   demo (default)  validates, stores nothing, sends nothing, and says so in the response.
 *   live            requires a configured destination. Success is returned ONLY after the
 *                   enquiry is durably recorded in the outbox. CRM delivery is then attempted;
 *                   if it fails the record stays `pending` and is retried (npm run outbox:retry).
 *                   We never claim an email was sent or a CRM record exists unless confirmed.
 */
import { validateEnquiry, type EnquiryInput } from './schema';

export interface Deps {
  mode: 'demo' | 'live';
  now: () => number;
  /** durable store; returns a stable reference */
  store: { save(e: EnquiryInput, meta: { ip: string }): Promise<{ reference: string }>; markDelivered(ref: string): Promise<void>; markFailed(ref: string, err: string): Promise<void> };
  /** CRM destination; null when not configured */
  crm: { send(e: EnquiryInput, reference: string): Promise<void> } | null;
  limiter: { take(key: string, now: number): boolean };
  dedupe: { get(key: string): HandlerResponse | undefined; set(key: string, r: HandlerResponse): void };
}

export interface HandlerResponse {
  status: number;
  body: Record<string, unknown>;
}

export const MAX_BODY_BYTES = 20_000;
const MIN_FILL_MS = 2000;

export async function handleEnquiry(
  req: { rawBody: string; ip: string; origin?: string | null; host?: string | null; contentType?: string | null },
  deps: Deps,
): Promise<HandlerResponse> {
  // 1. transport checks
  if ((req.contentType ?? '').split(';')[0].trim() !== 'application/json') {
    return { status: 415, body: { ok: false, error: 'unsupported_media_type' } };
  }
  if (req.origin && req.host) {
    try {
      if (new URL(req.origin).host !== req.host) return { status: 403, body: { ok: false, error: 'forbidden_origin' } };
    } catch {
      return { status: 403, body: { ok: false, error: 'forbidden_origin' } };
    }
  }
  if (Buffer.byteLength(req.rawBody, 'utf8') > MAX_BODY_BYTES) {
    return { status: 413, body: { ok: false, error: 'payload_too_large' } };
  }
  if (!deps.limiter.take(req.ip, deps.now())) {
    return { status: 429, body: { ok: false, error: 'rate_limited' } };
  }

  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(req.rawBody);
    if (!raw || typeof raw !== 'object') throw new Error('not an object');
  } catch {
    return { status: 400, body: { ok: false, error: 'invalid_json' } };
  }

  // 2. spam: honeypot field must be empty; humans take longer than a couple of seconds
  if (typeof raw.website_url_confirm === 'string' && raw.website_url_confirm.length > 0) {
    return { status: 400, body: { ok: false, error: 'rejected' } };
  }
  const startedAt = Number(raw.startedAt);
  if (Number.isFinite(startedAt) && deps.now() - startedAt < MIN_FILL_MS) {
    return { status: 400, body: { ok: false, error: 'rejected' } };
  }

  // 3. server-side validation (never trust the client)
  const result = validateEnquiry(raw);
  if (!result.ok) return { status: 400, body: { ok: false, error: 'validation', fieldErrors: result.errors } };
  const enquiry = result.value;

  // 4. duplicate-submission protection
  const seen = deps.dedupe.get(enquiry.idempotencyKey);
  if (seen) return seen;

  let response: HandlerResponse;

  if (deps.mode === 'demo') {
    response = { status: 200, body: { ok: true, mode: 'demo', sent: false, message: 'Demo mode: nothing was sent or stored.' } };
    deps.dedupe.set(enquiry.idempotencyKey, response);
    return response;
  }

  // live: refuse rather than silently accept into a void
  if (!deps.crm) {
    return { status: 503, body: { ok: false, error: 'not_configured' } };
  }

  let reference: string;
  try {
    ({ reference } = await deps.store.save(enquiry, { ip: req.ip }));
  } catch {
    return { status: 503, body: { ok: false, error: 'storage_unavailable' } };
  }

  let delivery: 'delivered' | 'queued' = 'queued';
  try {
    await deps.crm.send(enquiry, reference);
    await deps.store.markDelivered(reference);
    delivery = 'delivered';
  } catch (err) {
    await deps.store.markFailed(reference, err instanceof Error ? err.message : 'unknown');
  }

  response = { status: 200, body: { ok: true, mode: 'live', reference, delivery } };
  deps.dedupe.set(enquiry.idempotencyKey, response);
  return response;
}
