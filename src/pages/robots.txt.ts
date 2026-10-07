import type { APIRoute } from 'astro';
import { absoluteUrl } from '@/lib/site-url';
import { shouldIndex } from '@/lib/visibility';

export const prerender = true;

export const GET: APIRoute = () => {
  const sitemap = absoluteUrl('/sitemap.xml');
  // Preview builds block everything. Production allows crawling once a real domain is configured.
  const body = shouldIndex()
    ? ['User-agent: *', 'Allow: /', 'Disallow: /api/', 'Disallow: /brand', sitemap ? `Sitemap: ${sitemap}` : ''].filter(Boolean).join('\n')
    : 'User-agent: *\nDisallow: /';
  return new Response(body + '\n', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
