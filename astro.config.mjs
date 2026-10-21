// @ts-check
import { defineConfig } from 'astro/config';

// Static output, deployed to Cloudflare Workers Static Assets (see wrangler.jsonc).
export default defineConfig({
  site: 'https://wizardfingers.com',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  image: {
    responsiveStyles: false,
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  devToolbar: { enabled: false },
});
