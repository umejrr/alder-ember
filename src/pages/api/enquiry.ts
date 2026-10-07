import type { APIRoute } from 'astro';
import { handleEnquiry, MAX_BODY_BYTES } from '@/lib/enquiry/handler';
import { getDeps } from '@/lib/enquiry/server';

// Runs on the server (not prerendered). Secrets and destinations are read from the environment only.
export const prerender = false;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) return json(413, { ok: false, error: 'payload_too_large' });
  const rawBody = await request.text();
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() || (() => { try { return clientAddress; } catch { return 'unknown'; } })();
  const res = await handleEnquiry(
    {
      rawBody,
      ip,
      origin: request.headers.get('origin'),
      host: request.headers.get('host'),
      contentType: request.headers.get('content-type'),
    },
    getDeps(),
  );
  return json(res.status, res.body);
};

export const ALL: APIRoute = () => json(405, { ok: false, error: 'method_not_allowed' });
