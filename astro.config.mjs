import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';

// Public pages are prerendered to static HTML (indexable, fast). Only the
// enquiry endpoint runs on the server (src/pages/api/enquiry.ts).
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || undefined,
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
