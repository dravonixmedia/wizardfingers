/**
 * Cloudflare Worker entry for wizardfingers.com.
 *
 * - Permanently redirects www.wizardfingers.com → wizardfingers.com (path + query preserved).
 * - Serves the pre-rendered Astro site from the ASSETS binding
 *   (404s use dist/404.html via `not_found_handling: "404-page"`).
 * - Adds security and caching headers.
 *
 * Only the default handler may be exported from this file.
 */
import { canonicalRedirect, withHeaders } from './lib.ts';

interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const redirect = canonicalRedirect(request);
    if (redirect) return redirect;
    const response = await env.ASSETS.fetch(request);
    return withHeaders(response, new URL(request.url).pathname);
  },
} satisfies ExportedHandler<Env>;
