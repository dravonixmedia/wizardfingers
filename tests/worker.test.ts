import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.ts';

const assets = {
  async fetch(req: Request) {
    const { pathname } = new URL(req.url);
    if (pathname === '/') return new Response('<h1>home</h1>', { headers: { 'Content-Type': 'text/html' } });
    if (pathname.startsWith('/_astro/')) return new Response('x', { headers: { 'Content-Type': 'text/javascript' } });
    return new Response('<h1>404</h1>', { status: 404, headers: { 'Content-Type': 'text/html' } });
  },
};
const env = { ASSETS: assets } as never;
const run = (url: string) => worker.fetch(new Request(url), env);

test('www redirects permanently to apex, preserving path and query', async () => {
  const res = await run('https://www.wizardfingers.com/work/some-film/?ref=a&b=2#x');
  assert.equal(res.status, 301);
  assert.equal(res.headers.get('Location'), 'https://wizardfingers.com/work/some-film/?ref=a&b=2');
});

test('www root redirects to apex root', async () => {
  const res = await run('http://www.wizardfingers.com/');
  assert.equal(res.status, 301);
  assert.equal(res.headers.get('Location'), 'https://wizardfingers.com/');
});

test('apex is served from assets with security headers', async () => {
  const res = await run('https://wizardfingers.com/');
  assert.equal(res.status, 200);
  assert.equal(await res.text(), '<h1>home</h1>');
  assert.equal(res.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.match(res.headers.get('Content-Security-Policy') ?? '', /frame-src https:\/\/www\.youtube-nocookie\.com/);
});

test('hashed build assets are cached immutably', async () => {
  const res = await run('https://wizardfingers.com/_astro/app.abc123.js');
  assert.match(res.headers.get('Cache-Control') ?? '', /immutable/);
});

test('missing pages keep their 404 status', async () => {
  const res = await run('https://wizardfingers.com/nope/');
  assert.equal(res.status, 404);
  assert.equal(res.headers.get('Cache-Control'), null);
});

// --- Byte ranges for media (Safari video playback) ---------------------------

const bytes = new Uint8Array(Array.from({ length: 100 }, (_, i) => i));
const mediaEnv = {
  ASSETS: {
    async fetch(req: Request) {
      const { pathname } = new URL(req.url);
      if (pathname === '/media/backgrounds/hero.mp4') return new Response(bytes, { headers: { 'Content-Type': 'video/mp4' } });
      return new Response('<h1>404</h1>', { status: 404, headers: { 'Content-Type': 'text/html' } });
    },
  },
} as never;
const media = (range?: string) =>
  worker.fetch(new Request('https://wizardfingers.com/media/backgrounds/hero.mp4', { headers: range ? { Range: range } : {} }), mediaEnv);

test('media without Range is served whole and advertises ranges', async () => {
  const res = await media();
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Accept-Ranges'), 'bytes');
  assert.equal((await res.arrayBuffer()).byteLength, 100);
});

test('media Range request returns 206 with the requested bytes', async () => {
  const res = await media('bytes=10-19');
  assert.equal(res.status, 206);
  assert.equal(res.headers.get('Content-Range'), 'bytes 10-19/100');
  assert.equal(res.headers.get('Content-Length'), '10');
  assert.equal(res.headers.get('Content-Type'), 'video/mp4');
  assert.deepEqual([...new Uint8Array(await res.arrayBuffer())], [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
});

test('open-ended and suffix ranges', async () => {
  const open = await media('bytes=95-');
  assert.equal(open.headers.get('Content-Range'), 'bytes 95-99/100');
  const suffix = await media('bytes=-5');
  assert.equal(suffix.headers.get('Content-Range'), 'bytes 95-99/100');
  assert.equal((await suffix.arrayBuffer()).byteLength, 5);
});

test('unsatisfiable range returns 416', async () => {
  const res = await media('bytes=200-300');
  assert.equal(res.status, 416);
  assert.equal(res.headers.get('Content-Range'), 'bytes */100');
});
