/** Request helpers for the Worker entry (kept separate: workerd treats every export of the entry module as an entrypoint). */

export const CANONICAL_HOST = 'wizardfingers.com';

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  'frame-src https://www.youtube-nocookie.com https://player.vimeo.com',
  "connect-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join('; ');

export function canonicalRedirect(request: Request): Response | null {
  const url = new URL(request.url);
  if (url.hostname !== `www.${CANONICAL_HOST}`) return null;
  url.hostname = CANONICAL_HOST;
  url.protocol = 'https:';
  url.port = '';
  url.hash = '';
  return new Response(null, {
    status: 301,
    headers: { Location: url.toString(), 'Cache-Control': 'public, max-age=86400' },
  });
}

export function withHeaders(response: Response, pathname: string): Response {
  const res = new Response(response.body, response);
  const h = res.headers;
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set('X-Frame-Options', 'DENY');
  h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  h.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  const type = h.get('Content-Type') ?? '';
  if (type.includes('text/html')) h.set('Content-Security-Policy', CSP);

  if (response.ok) {
    if (pathname.startsWith('/_astro/')) h.set('Cache-Control', 'public, max-age=31536000, immutable');
    else if (pathname.startsWith('/media/')) h.set('Cache-Control', 'public, max-age=86400');
  }
  return res;
}

