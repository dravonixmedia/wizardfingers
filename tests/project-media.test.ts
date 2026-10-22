import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { defaultFfmpeg, discoverProjectMedia, encodePublicPath, extractCover, mp4Size, thumbWidths, titleFromFilename, webmSize } from '../src/lib/project-media.ts';

// --- Temporary fixtures (removed after the run) ------------------------------

const root = mkdtempSync(join(tmpdir(), 'wf-media-'));
after(() => rmSync(root, { recursive: true, force: true }));

const put = (rel: string, data: Buffer | string, base = root) => {
  const file = join(base, rel);
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
const coverCache = join(root, '.cover-cache');
const { entries, oversized } = await discoverProjectMedia({ root, warn: (m) => warnings.push(m), covers: { cacheDir: coverCache } });
const byId = Object.fromEntries(entries.map((e) => [e.id, e]));

// --- Automatic covers (real encoded videos, made with the bundled ffmpeg) ------------------------

const ffmpeg = defaultFfmpeg();
const real = mkdtempSync(join(tmpdir(), 'wf-covers-'));
after(() => rmSync(real, { recursive: true, force: true }));
const encode = (rel: string, args: string[]) => {
  const file = join(real, rel);
  mkdirSync(dirname(file), { recursive: true });
  execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args, file]);
  return file;
};
// 1.5 s of black, then a bright test pattern (landscape H.264).
encode('motion/black-open-film.mp4', ['-f', 'lavfi', '-i', 'color=black:s=640x360:d=1.5:r=24', '-f', 'lavfi', '-i', 'testsrc=s=640x360:d=3:r=24', '-filter_complex', '[0][1]concat=n=2:v=1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p']);
/** Sets the track's display matrix to a 90° rotation, as phones do when recording upright. */
const rotate90 = (file: string) => {
  const buf = readFileSync(file);
  const i = buf.indexOf('tkhd');
  const base = i + 4 + 4 + (buf[i + 4] === 1 ? 32 : 20) + 8 + 8;
  [0, 65536, 0, -65536, 0, 0, 0, 0, 2 ** 30].forEach((v, k) => buf.writeInt32BE(v, base + k * 4));
  writeFileSync(file, buf);
};
// Landscape pixels flagged as rotated 90° (as phones record portrait video).
rotate90(encode('motion/phone-clip.mp4', ['-f', 'lavfi', '-i', 'testsrc=s=640x360:d=3:r=24', '-c:v', 'libx264', '-pix_fmt', 'yuv420p']));
// Portrait WebM.
encode('intelligence/tall-loop.webm', ['-f', 'lavfi', '-i', 'testsrc=s=360x640:d=3:r=24', '-c:v', 'libvpx-vp9', '-b:v', '200k']);
// A video with its own poster: the poster wins, nothing is extracted.
encode('intelligence/posted-film.webm', ['-f', 'lavfi', '-i', 'testsrc=s=640x360:d=2:r=24', '-c:v', 'libvpx-vp9', '-b:v', '200k']);
put('intelligence/posted-film-poster.png', await image(640, 360, 'png'), real);
// Only black frames: the brightest candidate is still used rather than nothing.
encode('motion/all-black.webm', ['-f', 'lavfi', '-i', 'color=black:s=320x180:d=2:r=24', '-c:v', 'libvpx-vp9', '-b:v', '50k']);
// Not a video at all.
put('motion/broken-upload.mp4', 'definitely not a video', real);

const cache = join(real, '.cache');
const realWarnings: string[] = [];
const realFound = await discoverProjectMedia({ root: real, covers: { cacheDir: cache }, warn: (m) => realWarnings.push(m) });
const realById = Object.fromEntries(realFound.entries.map((e) => [e.id, e]));
const cover = (id: string) => {
  const e = realById[id];
  assert.equal(e?.kind, 'video');
  return e.kind === 'video' ? e.poster : undefined;
};

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

test('an undecodable video without a poster keeps the dark title frame and warns', () => {
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
  assert.ok(warnings.some((w) => w.includes('Beach Wedding Teaser.webm') && /cover/.test(w)));
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
  const again = await discoverProjectMedia({ root, covers: { cacheDir: coverCache } });
  assert.deepEqual(again.entries, entries);
});

// --- Automatic covers -------------------------------------------------------------------

test('covers are extracted for videos without a poster, skipping black opening frames', async () => {
  const c = cover('motion-black-open-film');
  assert.ok(c?.generated);
  assert.deepEqual([c.width, c.height], [640, 360]);
  const { channels } = await sharp(c.thumb.file).greyscale().stats();
  assert.ok(channels[0].mean > 60, `cover is not black (mean ${channels[0].mean})`);
  assert.match(c.src, /^\/media\/thumbs\/[0-9a-f]{12}-640\.webp$/);
});

test('covers keep the video orientation (rotation applied) and proportions', () => {
  const phone = cover('motion-phone-clip');
  assert.deepEqual([phone?.width, phone?.height], [360, 640]);
  assert.deepEqual([realById['motion-phone-clip'].width, realById['motion-phone-clip'].height], [360, 640]);
  const tall = cover('intelligence-tall-loop');
  assert.deepEqual([tall?.width, tall?.height], [360, 640]);
});

test('an uploaded poster takes priority over extraction', () => {
  const p = cover('intelligence-posted-film');
  assert.equal(p?.generated, undefined);
  assert.equal(p?.src, '/media/projects/intelligence/posted-film-poster.png');
  assert.ok(!realFound.entries.some((e) => e.title.includes('Poster')));
});

test('an all-black video still gets its best frame; an unreadable file falls back with a warning', () => {
  assert.ok(cover('motion-all-black')?.generated);
  assert.equal(cover('motion-broken-upload'), undefined);
  assert.ok(realWarnings.some((w) => w.includes('broken-upload.mp4') && /dark title card/.test(w)));
});

test('covers are cached by video content: unchanged videos are not processed again', async () => {
  const before = readdirSync(cache).sort();
  assert.equal(before.length, 4); // black-open, phone, tall, all-black (not the posted or broken one)
  // A missing ffmpeg proves the second run reads only the cache.
  const again = await discoverProjectMedia({ root: real, covers: { cacheDir: cache, ffmpeg: '/nonexistent/ffmpeg' } });
  assert.deepEqual(readdirSync(cache).sort(), before);
  assert.deepEqual(again.entries, realFound.entries);
  const hit = await extractCover(join(real, 'motion/phone-clip.mp4'), { cacheDir: cache, ffmpeg: '/nonexistent/ffmpeg' });
  assert.equal(hit?.cached, true);
});

test('a changed video or a new poster updates the cover on the next build', async () => {
  const first = cover('motion-phone-clip')!.thumb.hash;
  rotate90(encode('motion/phone-clip.mp4', ['-f', 'lavfi', '-i', 'testsrc2=s=640x360:d=3:r=24', '-c:v', 'libx264', '-pix_fmt', 'yuv420p']));
  put('intelligence/tall-loop-poster.jpg', await image(360, 640, 'jpeg'), real);
  const next = await discoverProjectMedia({ root: real, covers: { cacheDir: cache } });
  const byId2 = Object.fromEntries(next.entries.map((e) => [e.id, e]));
  const phone = byId2['motion-phone-clip'];
  assert.ok(phone.kind === 'video' && phone.poster?.generated && phone.poster.thumb.hash !== first);
  const tall = byId2['intelligence-tall-loop'];
  assert.equal(tall.kind === 'video' && tall.poster?.src, '/media/projects/intelligence/tall-loop-poster.jpg');
});

test('without ffmpeg, discovery still succeeds and warns', async () => {
  const w: string[] = [];
  const r = await discoverProjectMedia({ root: real, covers: { cacheDir: join(real, '.empty-cache'), ffmpeg: '/nonexistent/ffmpeg' }, warn: (m) => w.push(m) });
  assert.equal(r.entries.length, realFound.entries.length);
  assert.ok(w.some((m) => m.includes('black-open-film.mp4')));
  assert.ok(!existsSync(join(real, '.empty-cache')) || readdirSync(join(real, '.empty-cache')).length === 0);
});
