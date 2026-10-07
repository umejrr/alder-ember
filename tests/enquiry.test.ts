import { describe, expect, it, vi } from 'vitest';
import { validateEnquiry, normalisePostcode, contextSummary } from '@/lib/enquiry/schema';
import { handleEnquiry, type Deps } from '@/lib/enquiry/handler';
import { createDedupe, createRateLimiter } from '@/lib/enquiry/limits';
import { toHubspotFields, createHubspotClient } from '@/lib/enquiry/hubspot';
import { sanitize } from '@/lib/analytics';

const good = {
  name: 'Sam Taylor', email: 'sam@example.com', postcode: 'sw1a1aa', projectType: 'residential',
  model: 'alder', description: 'A flat lawn at the back of the garden with side access.',
  idempotencyKey: 'key-0001-abcdef', marketingOptIn: false,
};
const body = (o: Record<string, unknown> = {}) => JSON.stringify({ ...good, startedAt: 1000, ...o });
const now = 10_000;

function deps(over: Partial<Deps> = {}): Deps & { saved: unknown[]; sent: unknown[] } {
  const saved: unknown[] = [];
  const sent: unknown[] = [];
  return {
    saved, sent,
    mode: 'live',
    now: () => now,
    store: {
      save: async (e) => { saved.push(e); return { reference: 'AE-TEST0001' }; },
      markDelivered: vi.fn(async () => {}),
      markFailed: vi.fn(async () => {}),
    },
    crm: { send: async (e) => { sent.push(e); } },
    limiter: createRateLimiter(5),
    dedupe: createDedupe(),
    ...over,
  };
}
const req = (rawBody: string, extra = {}) => ({ rawBody, ip: '1.2.3.4', contentType: 'application/json', origin: 'https://x.test', host: 'x.test', ...extra });

describe('validation', () => {
  it('accepts a good enquiry and normalises the postcode', () => {
    const r = validateEnquiry(good);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.postcode).toBe('SW1A 1AA');
  });

  it('reports each required field', () => {
    const r = validateEnquiry({ ...good, name: '', email: 'nope', postcode: 'ZZZ', projectType: 'x', model: '', description: 'short' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['description', 'email', 'model', 'name', 'postcode', 'projectType']);
  });

  it('keeps marketing consent separate and false unless explicitly true', () => {
    for (const v of ['true', 1, 'yes', undefined]) {
      const r = validateEnquiry({ ...good, marketingOptIn: v });
      expect(r.ok && r.value.marketingOptIn).toBe(false);
    }
    const yes = validateEnquiry({ ...good, marketingOptIn: true });
    expect(yes.ok && yes.value.marketingOptIn).toBe(true);
  });

  it('accepts "Not sure" as a model and optional fields can be empty', () => {
    expect(validateEnquiry({ ...good, model: 'not-sure', phone: '', budget: '' }).ok).toBe(true);
  });

  it('rejects odd phone numbers and bad websites', () => {
    expect(validateEnquiry({ ...good, phone: 'call me maybe' }).ok).toBe(false);
    expect(validateEnquiry({ ...good, website: 'not a site' }).ok).toBe(false);
    expect(validateEnquiry({ ...good, website: 'example.co.uk' }).ok).toBe(true);
  });

  it('postcode normalisation is stable', () => {
    expect(normalisePostcode(' m1 1ae ')).toBe('M1 1AE');
    expect(normalisePostcode('EC1A1BB')).toBe('EC1A 1BB');
  });

  it('context summary contains no personal data', () => {
    const s = contextSummary({ model: 'alder', heating: 'electric', projectType: 'residential', people: 4, changingArea: undefined }).join(' ');
    expect(s).not.toMatch(/sam|example\.com|SW1A/i);
  });
});

describe('server handler', () => {
  it('demo mode validates but stores and sends nothing, and says so', async () => {
    const d = deps({ mode: 'demo' });
    const r = await handleEnquiry(req(body()), d);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ ok: true, mode: 'demo', sent: false });
    expect(d.saved).toHaveLength(0);
    expect(d.sent).toHaveLength(0);
  });

  it('live mode records durably, then delivers, and returns a reference', async () => {
    const d = deps();
    const r = await handleEnquiry(req(body()), d);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ ok: true, mode: 'live', reference: 'AE-TEST0001', delivery: 'delivered' });
    expect(d.saved).toHaveLength(1);
    expect(d.sent).toHaveLength(1);
  });

  it('keeps the record and reports "queued" (not delivered) when the CRM fails', async () => {
    const d = deps({ crm: { send: async () => { throw new Error('HubSpot responded 500'); } } });
    const r = await handleEnquiry(req(body()), d);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ ok: true, delivery: 'queued' });
    expect(d.saved).toHaveLength(1);
    expect(d.store.markFailed).toHaveBeenCalledWith('AE-TEST0001', 'HubSpot responded 500');
    expect(d.store.markDelivered).not.toHaveBeenCalled();
  });

  it('refuses (503) instead of silently accepting when live but no destination is configured', async () => {
    const d = deps({ crm: null });
    const r = await handleEnquiry(req(body()), d);
    expect(r.status).toBe(503);
    expect(d.saved).toHaveLength(0);
  });

  it('does not claim success if durable storage fails', async () => {
    const d = deps();
    d.store.save = async () => { throw new Error('disk full'); };
    const r = await handleEnquiry(req(body()), d);
    expect(r.status).toBe(503);
    expect(d.sent).toHaveLength(0);
  });

  it('returns server-side field errors', async () => {
    const r = await handleEnquiry(req(body({ email: 'bad' })), deps());
    expect(r.status).toBe(400);
    expect(r.body).toMatchObject({ error: 'validation', fieldErrors: { email: expect.any(String) } });
  });

  it('protects against duplicate submissions with the idempotency key', async () => {
    const d = deps();
    const a = await handleEnquiry(req(body()), d);
    const b = await handleEnquiry(req(body()), d);
    expect(b).toEqual(a);
    expect(d.saved).toHaveLength(1);
  });

  it('rejects the honeypot, too-fast submissions, wrong content type, cross-origin and oversize bodies', async () => {
    expect((await handleEnquiry(req(body({ website_url_confirm: 'http://spam' })), deps())).status).toBe(400);
    expect((await handleEnquiry(req(body({ startedAt: now - 500 })), deps())).status).toBe(400);
    expect((await handleEnquiry(req(body(), { contentType: 'text/plain' }), deps())).status).toBe(415);
    expect((await handleEnquiry(req(body(), { origin: 'https://evil.test' }), deps())).status).toBe(403);
    expect((await handleEnquiry(req(body({ description: 'x'.repeat(30_000) })), deps())).status).toBe(413);
    expect((await handleEnquiry(req('{not json'), deps())).status).toBe(400);
  });

  it('rate limits by IP', async () => {
    const d = deps({ limiter: createRateLimiter(2) });
    expect((await handleEnquiry(req(body({ idempotencyKey: 'key-aaaa-0001' })), d)).status).toBe(200);
    expect((await handleEnquiry(req(body({ idempotencyKey: 'key-aaaa-0002' })), d)).status).toBe(200);
    expect((await handleEnquiry(req(body({ idempotencyKey: 'key-aaaa-0003' })), d)).status).toBe(429);
  });
});

describe('HubSpot adapter', () => {
  it('maps fields and omits empty ones', () => {
    const r = validateEnquiry(good);
    if (!r.ok) throw new Error('fixture invalid');
    const fields = toHubspotFields(r.value, 'AE-TEST0001');
    expect(fields).toContainEqual({ name: 'email', value: 'sam@example.com' });
    expect(fields).toContainEqual({ name: 'ae_enquiry_reference', value: 'AE-TEST0001' });
    expect(fields.find((f) => f.name === 'phone')).toBeUndefined();
  });

  it('throws on a non-2xx response so the record stays queued', async () => {
    const client = createHubspotClient({ portalId: '123', formGuid: 'abc', fetchImpl: (async () => new Response('no', { status: 429 })) as typeof fetch });
    const r = validateEnquiry(good);
    if (!r.ok) throw new Error('fixture invalid');
    await expect(client.send(r.value, 'AE-1')).rejects.toThrow(/429/);
  });
});

describe('analytics never carries personal data', () => {
  it('drops non-allow-listed keys and anything that looks personal', () => {
    const out = sanitize('submit_enquiry_success', { model_id: 'alder', project_type: 'residential', email: 'sam@example.com', name: 'Sam', postcode: 'SW1A 1AA', description: 'my garden' });
    expect(out).toEqual({ model_id: 'alder', project_type: 'residential' });
    expect(sanitize('start_enquiry', { model_id: 'sam@example.com', source_page: '/plan-your-sauna' })).toEqual({ source_page: '/plan-your-sauna' });
    expect(sanitize('compare_models', { model_ids: ['rowan', 'alder'] })).toEqual({ model_ids: 'rowan,alder' });
  });
});
