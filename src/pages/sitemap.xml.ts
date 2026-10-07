import type { APIRoute } from 'astro';
import { absoluteUrl } from '@/lib/site-url';
import { productList } from '@/content/products';
import { policies } from '@/content/policies';
import { policyIsApproved, shouldIndex, visibleCampaigns, visibleGuides, visibleInstallations, installationsRouteEnabled, guidesRouteEnabled } from '@/lib/visibility';

export const prerender = true;

/** Only real, indexable pages. Empty sections, drafts and unapproved policies are left out. Needs PUBLIC_SITE_URL. */
export const GET: APIRoute = () => {
  if (!shouldIndex() || !absoluteUrl('/')) return new Response('Not available', { status: 404 });
  const paths = [
    '/', '/saunas', ...productList.filter((p) => p.published).map((p) => `/saunas/${p.slug}`),
    '/compare', '/installation-delivery', '/commercial', '/about', '/care-support', '/plan-your-sauna',
    ...(installationsRouteEnabled() ? ['/installations', ...visibleInstallations().map((i) => `/installations/${i.slug}`)] : []),
    ...(guidesRouteEnabled() ? ['/guides', ...visibleGuides().map((g) => `/guides/${g.slug}`)] : []),
    ...visibleCampaigns().filter((c) => c.approval === 'approved').map((c) => `/campaigns/${c.slug}`),
    ...Object.values(policies).filter(policyIsApproved).map((p) => `/${p.slug}`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
    .map((p) => `  <url><loc>${absoluteUrl(p)}</loc></url>`)
    .join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
