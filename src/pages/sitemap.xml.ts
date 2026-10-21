import type { APIRoute } from 'astro';
import { publishedProjects, site } from '../content';

/** Sitemap of published pages only. Samples and drafts are never listed. */
export const GET: APIRoute = () => {
  const urls = ['/', ...publishedProjects.filter((p) => !p.sample).map((p) => `/work/${p.slug}/`)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${new URL(u, site.url).toString()}</loc></url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
