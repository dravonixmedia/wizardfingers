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
