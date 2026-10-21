/**
 * Cloudflare Worker entry for wizardfingers.com.
 *
 * - Permanently redirects www.wizardfingers.com → wizardfingers.com (path + query preserved).
 * - Serves the pre-rendered Astro site from the ASSETS binding
 *   (404s use dist/404.html via `not_found_handling: "404-page"`).
 * - Adds security and caching headers.
 * - Answers byte-range requests for /media/ files with 206 (needed for Safari video).
 *
 * Only the default handler may be exported from this file.
 */
import { canonicalRedirect, withHeaders, withRange } from './lib.ts';

interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const redirect = canonicalRedirect(request);
    if (redirect) return redirect;
    const { pathname } = new URL(request.url);
    const response = await withRange(request, await env.ASSETS.fetch(request), pathname);
    return withHeaders(response, pathname);
  },
} satisfies ExportedHandler<Env>;
