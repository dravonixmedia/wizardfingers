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


/**
 * Byte-range support for media files. Safari only plays MP4 video when the
 * server answers `Range` requests with `206 Partial Content`. If the assets
 * layer already returns 206 it is passed through; if it returns the full file
 * (200), the requested single range is sliced here.
 */
export async function withRange(request: Request, response: Response, pathname: string): Promise<Response> {
  if (!pathname.startsWith('/media/') || request.method !== 'GET') return response;
  const range = request.headers.get('Range');
  if (!range || response.status !== 200) {
    if (response.status === 200) {
      const res = new Response(response.body, response);
      res.headers.set('Accept-Ranges', 'bytes');
      return res;
    }
    return response;
  }

  const body = await response.arrayBuffer();
  const size = body.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  let start: number;
  let end: number;
  if (!match || (match[1] === '' && match[2] === '')) {
    return withFullBody(response, body); // malformed or multi-range: serve the whole file
  } else if (match[1] === '') {
    // Suffix range: last N bytes.
    const n = Number(match[2]);
    start = Math.max(0, size - n);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1);
  }

  if (start >= size || start > end) {
    return new Response(null, {
      status: 416,
      headers: { 'Content-Range': `bytes */${size}`, 'Accept-Ranges': 'bytes' },
    });
  }

  const headers = new Headers(response.headers);
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Content-Length', String(end - start + 1));
  headers.set('Accept-Ranges', 'bytes');
  return new Response(body.slice(start, end + 1), { status: 206, headers });
}

function withFullBody(response: Response, body: ArrayBuffer): Response {
  const headers = new Headers(response.headers);
  headers.set('Accept-Ranges', 'bytes');
  return new Response(body, { status: 200, headers });
}
