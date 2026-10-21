import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { discoverProjectMedia, encodePublicPath, mp4Size, thumbWidths, titleFromFilename, webmSize } from '../src/lib/project-media.ts';

// --- Temporary fixtures (removed after the run) ------------------------------

const root = mkdtempSync(join(tmpdir(), 'wf-media-'));
after(() => rmSync(root, { recursive: true, force: true }));

const put = (rel: string, data: Buffer | string) => {
  const file = join(root, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, data);
  return file;
};
const image = (w: number, h: number, format: 'jpeg' | 'png' | 'webp' | 'avif') =>
  sharp({ create: { width: w, height: h, channels: 3, background: '#334' } })[format]().toBuffer();

const box = (type: string, ...children: Buffer[]) => {
  const body = Buffer.concat(children);
  const head = Buffer.alloc(8);
  head.writeUInt32BE(8 + body.length, 0);
  head.write(type, 4, 'latin1');
  return Buffer.concat([head, body]);
};
/** Minimal MP4: ftyp, an mdat before the moov (as many encoders write it), one track header. */
const mp4 = (w: number, h: number, rotate90 = false) => {
  const tkhd = Buffer.alloc(84);
  const m = rotate90 ? [0, 1, 0, -1, 0, 0, 0, 0, 1] : [1, 0, 0, 0, 1, 0, 0, 0, 1];
  m.forEach((v, i) => tkhd.writeInt32BE(i === 2 || i === 5 || i === 8 ? v * 2 ** 30 : v * 65536, 40 + i * 4));
  tkhd.writeUInt32BE(w * 65536, 76);
  tkhd.writeUInt32BE(h * 65536, 80);
  return Buffer.concat([box('ftyp', Buffer.from('isom\0\0\0\0isom')), box('mdat', Buffer.alloc(64)), box('moov', box('trak', box('tkhd', tkhd)))]);
};
const ebml = (id: number[], body: Buffer) => {
  const size = Buffer.from([0x01, 0, 0, 0, 0, 0, 0, 0]); // 8-byte size field
  size.writeUInt32BE(body.length, 4);
  return Buffer.concat([Buffer.from(id), size, body]);
};
const uint16 = (v: number) => Buffer.from([v >> 8, v & 0xff]);
/** Minimal WebM: EBML header, Segment → Tracks → TrackEntry → Video → PixelWidth/PixelHeight. */
const webm = (w: number, h: number) =>
  Buffer.concat([
    ebml([0x1a, 0x45, 0xdf, 0xa3], Buffer.from([0x42, 0x82, 0x84, ...Buffer.from('webm')])),
    ebml([0x18, 0x53, 0x80, 0x67], ebml([0x16, 0x54, 0xae, 0x6b], ebml([0xae], ebml([0xe0], Buffer.concat([Buffer.from([0xb0, 0x82]), uint16(w), Buffer.from([0xba, 0x82]), uint16(h)]))))),
  ]);

put('motion/halo-villa-film.mp4', mp4(1920, 1080));
put('motion/halo-villa-film-poster.jpg', await image(1920, 1080, 'jpeg'));
put('motion/weddings/Beach Wedding Teaser.webm', webm(720, 1280));
put('motion/02-uae-national-day-cgi.mp4', mp4(1920, 1080, true));
put('motion/studio still #2.png', await image(800, 1000, 'png'));
put('motion/notes.txt', 'not media');
put('motion/.hidden-still.jpg', await image(10, 10, 'jpeg'));
put('motion/.gitkeep', '');
put('intelligence/.gitkeep', '');
put('intelligence/ai-portrait-series.jpg', await image(1200, 1500, 'jpeg'));
put('intelligence/dreams/neon-city.webp', await image(1600, 900, 'webp'));
put('intelligence/dreams/neon-city.avif', await image(1600, 900, 'avif'));
put('intelligence/dreams/neon-city.mp4', mp4(1600, 900));
put('intelligence/ai-dubai-reel.mp4', mp4(1080, 1920));
put('intelligence/.DS_Store', 'x');
put('digital/ignored.jpg', await image(10, 10, 'jpeg')); // Digital stays link-only

const warnings: string[] = [];
const { entries, oversized } = await discoverProjectMedia({ root, warn: (m) => warnings.push(m) });
const byId = Object.fromEntries(entries.map((e) => [e.id, e]));

// --- Titles and URLs -----------------------------------------------------------

test('titles come from filenames, keeping acronyms', () => {
  assert.equal(titleFromFilename('halo-villa-film.mp4'), 'Halo Villa Film');
  assert.equal(titleFromFilename('ai-dubai-reel.mp4'), 'AI Dubai Reel');
  assert.equal(titleFromFilename('uae_cgi spot.webm'), 'UAE CGI Spot');
  assert.equal(titleFromFilename('03-story-of-the-sea.mp4'), 'Story of the Sea');
  assert.equal(titleFromFilename('Beach Wedding Teaser.webm'), 'Beach Wedding Teaser');
  assert.equal(titleFromFilename('iPhone-launch-film.mp4'), 'iPhone Launch Film');
});

test('public paths are percent-encoded per segment', () => {
  assert.equal(encodePublicPath(['media', 'projects', 'motion', 'studio still #2.png']), '/media/projects/motion/studio%20still%20%232.png');
});

// --- Discovery -------------------------------------------------------------------

test('one entry per item, categories from folders, deterministic order', () => {
  assert.deepEqual(
    entries.map((e) => `${e.category}:${e.kind}:${e.title}`),
    [
      'motion:video:UAE National Day CGI', // "02-" prefix orders it first
      'motion:video:Halo Villa Film',
      'motion:image:Studio Still #2',
      'motion:video:Beach Wedding Teaser',
      'intelligence:video:AI Dubai Reel',
      'intelligence:image:AI Portrait Series',
      'intelligence:video:Neon City',
    ],
  );
  assert.deepEqual(oversized, []);
});

test('ids are stable, unique and derived from the path', () => {
  assert.deepEqual(Object.keys(byId).sort(), [
    'intelligence-ai-dubai-reel',
    'intelligence-ai-portrait-series',
    'intelligence-dreams-neon-city',
    'motion-halo-villa-film',
    'motion-studio-still-2',
    'motion-uae-national-day-cgi',
    'motion-weddings-beach-wedding-teaser',
  ]);
});

test('a matching poster becomes the thumbnail, not a separate entry', () => {
  const film = byId['motion-halo-villa-film'];
  assert.equal(film.kind, 'video');
  assert.equal(film.kind === 'video' && film.poster?.src, '/media/projects/motion/halo-villa-film-poster.jpg');
  assert.ok(!entries.some((e) => /poster/i.test(e.title)));
});

test('a video without a poster has none (the card shows a dark title frame)', () => {
  const v = byId['motion-weddings-beach-wedding-teaser'];
  assert.equal(v.kind === 'video' && v.poster, undefined);
  assert.equal(v.kind === 'video' && v.sources[0].src, '/media/projects/motion/weddings/Beach%20Wedding%20Teaser.webm');
  assert.deepEqual([v.width, v.height], [720, 1280]);
});

test('same-name image next to a video is its poster; extra formats do not duplicate', () => {
  const n = byId['intelligence-dreams-neon-city'];
  assert.equal(n.kind, 'video');
  assert.equal(n.kind === 'video' && n.poster?.src, '/media/projects/intelligence/dreams/neon-city.avif');
});

test('sizes: images, MP4 (incl. rotation) and WebM', () => {
  assert.deepEqual([byId['motion-studio-still-2'].width, byId['motion-studio-still-2'].height], [800, 1000]);
  assert.deepEqual([byId['motion-uae-national-day-cgi'].width, byId['motion-uae-national-day-cgi'].height], [1080, 1920]);
  assert.deepEqual([byId['intelligence-ai-dubai-reel'].width, byId['intelligence-ai-dubai-reel'].height], [1080, 1920]);
  assert.deepEqual(mp4Size(join(root, 'motion/halo-villa-film.mp4')), { width: 1920, height: 1080 });
  assert.deepEqual(webmSize(join(root, 'motion/weddings/Beach Wedding Teaser.webm')), { width: 720, height: 1280 });
});

test('hidden, .gitkeep, unsupported and Digital files are ignored', () => {
  assert.ok(!entries.some((e) => /hidden|notes|ignored|DS_Store/i.test(e.path)));
  assert.ok(warnings.some((w) => w.includes('notes.txt')));
});

test('thumbnail widths never exceed the source', () => {
  assert.deepEqual(thumbWidths(3000), [480, 960, 1600, 2400]);
  assert.deepEqual(thumbWidths(1200), [480, 960, 1200]);
  assert.deepEqual(thumbWidths(300), [300]);
});

test('files over the hosting limit are reported, not published', async () => {
  const big = mkdtempSync(join(tmpdir(), 'wf-big-'));
  try {
    mkdirSync(join(big, 'motion'));
    writeFileSync(join(big, 'motion', 'huge.mp4'), Buffer.alloc(25 * 1024 * 1024 + 1));
    const r = await discoverProjectMedia({ root: big });
    assert.deepEqual(r.oversized, ['motion/huge.mp4']);
    assert.equal(r.entries.length, 0);
  } finally {
    rmSync(big, { recursive: true, force: true });
  }
});

test('discovery is deterministic', async () => {
  const again = await discoverProjectMedia({ root });
  assert.deepEqual(again.entries, entries);
});
