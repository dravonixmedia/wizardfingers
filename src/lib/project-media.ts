/**
 * Folder-based publishing for Selected Work (build time, Node only).
 *
 * Every supported file under `public/media/projects/<category>/` (any depth) becomes one entry:
 * the category comes from the top-level folder and the title from the filename. A video's
 * matching image (`<name>-poster.jpg`, or `<name>.jpg`) is its thumbnail, not a separate entry;
 * without one, a cover frame is extracted from the video with ffmpeg and cached.
 * See docs/CONTENT.md → "Publish work by uploading files".
 *
 * Self-contained (Node built-ins, sharp and the bundled ffmpeg binary) so the unit tests can
 * import it directly.
 */
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { closeSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, readSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';

export const MEDIA_CATEGORIES = ['motion', 'intelligence'] as const;
export type MediaCategory = (typeof MEDIA_CATEGORIES)[number];

export const VIDEO_EXTENSIONS = ['mp4', 'webm'] as const;
export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif'] as const;
/** Cloudflare Workers Static Assets serves files up to 25 MiB. */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
/** Thumbnail widths (never wider than the source). */
export const THUMB_WIDTHS = [480, 960, 1600, 2400] as const;
/** Public URL prefix of the generated thumbnails (see src/pages/media/thumbs/[file].ts). */
export const THUMB_BASE = '/media/thumbs';

export interface Thumb {
  /** Source file on disk. */
  file: string;
  /** Content hash: thumbnails change URL whenever the image changes. */
  hash: string;
  widths: number[];
}

export interface MediaImageFile {
  /** URL-encoded public path of the original (for a generated cover: its largest thumbnail). */
  src: string;
  /** True for a cover extracted from the video at build time (no poster was uploaded). */
  generated?: boolean;
  width: number;
  height: number;
  thumb: Thumb;
}

export interface MediaVideoSource {
  src: string;
  type: 'video/mp4' | 'video/webm';
}

interface MediaEntryBase {
  /** Stable id derived from the category and relative path, e.g. `motion-weddings-halo-villa-film`. */
  id: string;
  title: string;
  category: MediaCategory;
  /** Path relative to the category folder, e.g. `weddings/halo-villa-film.mp4`. */
  path: string;
  width: number;
  height: number;
}

export interface MediaImageEntry extends MediaEntryBase {
  kind: 'image';
  image: MediaImageFile;
}

export interface MediaVideoEntry extends MediaEntryBase {
  kind: 'video';
  sources: MediaVideoSource[];
  poster?: MediaImageFile;
}

export type MediaEntry = MediaImageEntry | MediaVideoEntry;

// ---------------------------------------------------------------------------
// Names
// ---------------------------------------------------------------------------

/** Kept in capitals wherever they appear as a word. */
export const ACRONYMS = new Set([
  'AI', 'AR', 'BTS', 'CG', 'CGI', 'DJ', 'DXB', 'FPV', 'GCC', 'HD', 'HDR', 'KSA', 'MV', 'NYC', 'TV',
  'TVC', 'UAE', 'UI', 'UK', 'US', 'USA', 'UX', 'VFX', 'VR', 'XR', '3D', '2D', '4K', '8K', 'LED', 'DOP', 'POV',
]);
const MINOR_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'vs', 'with']);

/** Strips an optional ordering prefix ("01-", "2_", "03 ") from a filename stem. */
const ORDER_PREFIX = /^\d+[-_.\s]+(?=\S)/;

/** `halo-villa-film.mp4` → "Halo Villa Film"; `ai-dubai-reel.mp4` → "AI Dubai Reel". */
export function titleFromFilename(filename: string): string {
  const stem = filename.replace(/\.[^.]+$/, '').replace(ORDER_PREFIX, '');
  const words = stem.split(/[-_\s]+/).filter(Boolean);
  return words
    .map((w, i) => {
      const upper = w.toUpperCase();
      if (ACRONYMS.has(upper)) return upper;
      if (i > 0 && MINOR_WORDS.has(w.toLowerCase())) return w.toLowerCase();
      // Respect deliberate capitals ("iPhone", "McLaren"); otherwise capitalise.
      return w === w.toLowerCase() ? w.charAt(0).toUpperCase() + w.slice(1) : w;
    })
    .join(' ');
}

/** URL path with every segment percent-encoded (spaces, #, ?, & and non-ASCII are safe). */
export function encodePublicPath(parts: string[]): string {
  return '/' + parts.map((p) => encodeURIComponent(p)).join('/');
}

const slugify = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const extOf = (name: string) => name.slice(name.lastIndexOf('.') + 1).toLowerCase();
const stemOf = (name: string) => name.replace(/\.[^.]+$/, '');
const isVideo = (name: string) => (VIDEO_EXTENSIONS as readonly string[]).includes(extOf(name));
const isImage = (name: string) => (IMAGE_EXTENSIONS as readonly string[]).includes(extOf(name));
/** Hidden files and folders (".gitkeep", ".DS_Store", "._x.mp4") are ignored. */
const isHidden = (name: string) => name.startsWith('.');
const byName = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }) || (a < b ? -1 : a > b ? 1 : 0);

// ---------------------------------------------------------------------------
// Dimensions
// ---------------------------------------------------------------------------

interface Size {
  width: number;
  height: number;
}

async function imageSize(file: string): Promise<Size | undefined> {
  try {
    const m = await sharp(file).metadata();
    if (!m.width || !m.height) return undefined;
    // EXIF orientations 5–8 are rotated by 90°.
    return (m.orientation ?? 1) >= 5 ? { width: m.height, height: m.width } : { width: m.width, height: m.height };
  } catch {
    return undefined;
  }
}

function readAt(fd: number, pos: number, len: number): Buffer {
  const buf = Buffer.alloc(len);
  const n = readSync(fd, buf, 0, len, pos);
  return buf.subarray(0, n);
}

/** Display size of the first video track of an MP4 (from `moov/trak/tkhd`, rotation applied). */
export function mp4Size(file: string): Size | undefined {
  const fd = openSync(file, 'r');
  try {
    const total = statSync(file).size;
    // Find the top-level moov box (it may sit after mdat).
    let pos = 0;
    let moov: Buffer | undefined;
    while (pos + 8 <= total) {
      const h = readAt(fd, pos, 16);
      let size = h.readUInt32BE(0);
      const type = h.toString('latin1', 4, 8);
      let header = 8;
      if (size === 1) {
        size = Number(h.readBigUInt64BE(8));
        header = 16;
      } else if (size === 0) size = total - pos;
      if (size < header) return undefined;
      if (type === 'moov') {
        moov = readAt(fd, pos + header, Math.min(size - header, 64 * 1024 * 1024));
        break;
      }
      pos += size;
    }
    if (!moov) return undefined;
    const boxes = (buf: Buffer, from: number, to: number, cb: (type: string, start: number, end: number) => boolean | void) => {
      let p = from;
      while (p + 8 <= to) {
        let size = buf.readUInt32BE(p);
        const type = buf.toString('latin1', p + 4, p + 8);
        let header = 8;
        if (size === 1) {
          size = Number(buf.readBigUInt64BE(p + 8));
          header = 16;
        } else if (size === 0) size = to - p;
        if (size < header || p + size > to) return;
        if (cb(type, p + header, p + size)) return;
        p += size;
      }
    };
    let result: Size | undefined;
    boxes(moov, 0, moov.length, (type, start, end) => {
      if (type !== 'trak') return;
      boxes(moov, start, end, (t, s) => {
        if (t !== 'tkhd') return;
        const version = moov[s];
        const base = s + 4 + (version === 1 ? 32 : 20) + 8 + 8; // ids/times, reserved, layer…volume
        const fixed = (o: number) => moov.readInt32BE(o) / 65536;
        const [a, b] = [fixed(base), fixed(base + 4)];
        const width = Math.round(moov.readUInt32BE(base + 36) / 65536);
        const height = Math.round(moov.readUInt32BE(base + 40) / 65536);
        if (width > 0 && height > 0) {
          const rotated = Math.abs(a) < 0.5 && Math.abs(b) > 0.5;
          result = rotated ? { width: height, height: width } : { width, height };
        }
        return true;
      });
      return Boolean(result);
    });
    return result;
  } catch {
    return undefined;
  } finally {
    closeSync(fd);
  }
}

/** Display size of the first video track of a WebM/Matroska file (EBML). */
export function webmSize(file: string): Size | undefined {
  const fd = openSync(file, 'r');
  try {
    const buf = readAt(fd, 0, 4 * 1024 * 1024);
    const vint = (p: number, keepMarker: boolean) => {
      const first = buf[p];
      if (first === undefined || first === 0) return undefined;
      const len = Math.clz32(first) - 23;
      let value = keepMarker ? first : first & (0xff >> len);
      let allOnes = (first & (0xff >> len)) === 0xff >> len;
      for (let i = 1; i < len; i++) {
        value = value * 256 + buf[p + i];
        if (buf[p + i] !== 0xff) allOnes = false;
      }
      return { value, len, unknown: allOnes };
    };
    const MASTERS = new Set([0x18538067, 0x1654ae6b, 0xae, 0xe0]); // Segment, Tracks, TrackEntry, Video
    const uint = (p: number, n: number) => {
      let v = 0;
      for (let i = 0; i < n; i++) v = v * 256 + buf[p + i];
      return v;
    };
    let video: { pw?: number; ph?: number; dw?: number; dh?: number } | undefined;
    const walk = (from: number, to: number): boolean => {
      let p = from;
      while (p < to && p < buf.length) {
        const id = vint(p, true);
        if (!id) return false;
        const size = vint(p + id.len, false);
        if (!size) return false;
        const start = p + id.len + size.len;
        const end = size.unknown ? to : Math.min(start + size.value, to);
        if (id.value === 0x1f43b675) return false; // Cluster: past the headers
        if (id.value === 0xe0) {
          video = {};
          walk(start, end);
          return true;
        }
        if (video) {
          if (id.value === 0xb0) video.pw = uint(start, size.value);
          if (id.value === 0xba) video.ph = uint(start, size.value);
          if (id.value === 0x54b0) video.dw = uint(start, size.value);
          if (id.value === 0x54ba) video.dh = uint(start, size.value);
        } else if (MASTERS.has(id.value) && walk(start, end)) return true;
        p = end;
      }
      return false;
    };
    walk(0, buf.length);
    const v = video as { pw?: number; ph?: number; dw?: number; dh?: number } | undefined;
    const width = v?.dw || v?.pw;
    const height = v?.dh || v?.ph;
    return width && height ? { width, height } : undefined;
  } catch {
    return undefined;
  } finally {
    closeSync(fd);
  }
}

// ---------------------------------------------------------------------------
// Automatic covers (videos without an uploaded poster)
// ---------------------------------------------------------------------------

export interface CoverOptions {
  /**
   * Where extracted covers are kept between builds, keyed by the video's content. The default is
   * inside `node_modules/.astro/`, which Cloudflare's build cache keeps for Astro projects.
   */
  cacheDir?: string;
  /** ffmpeg binary. Default: WF_FFMPEG, then the bundled @ffmpeg-installer binary, then `ffmpeg` on PATH. */
  ffmpeg?: string;
}

/** Bump when the extraction rules change, so cached covers are regenerated. */
const COVER_VERSION = 1;
/** Seconds to try, in order: early in the video but past fade-ins and black opening frames. */
const COVER_TIMES = [1, 2, 3, 4.5, 6, 0.5, 0];
/** A frame is usable when it is neither near-black nor flat (0–255 luminance). */
const MIN_MEAN = 28;
const MIN_STDEV = 14;

const run = promisify(execFile);

export function defaultFfmpeg(): string {
  if (process.env.WF_FFMPEG) return process.env.WF_FFMPEG;
  try {
    const bundled = (createRequire(import.meta.url)('@ffmpeg-installer/ffmpeg') as { path: string }).path;
    if (existsSync(bundled)) return bundled;
  } catch {
    // Not installed for this platform: fall back to PATH.
  }
  return 'ffmpeg';
}

async function videoDuration(ffmpeg: string, file: string): Promise<number | undefined> {
  // `ffmpeg -i` with no output exits with an error but prints the container info on stderr.
  const out = await run(ffmpeg, ['-hide_banner', '-i', file], { maxBuffer: 4 << 20 }).catch((e: { stderr?: string }) => ({ stderr: e.stderr ?? '' }));
  const m = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(out.stderr);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : undefined;
}

async function frameAt(ffmpeg: string, file: string, t: number): Promise<Buffer | undefined> {
  // Fast seek, one frame, rotation applied (ffmpeg auto-rotates by default), PNG on stdout.
  const { stdout } = await run(
    ffmpeg,
    ['-hide_banner', '-loglevel', 'error', '-ss', String(t), '-i', file, '-frames:v', '1', '-an', '-f', 'image2pipe', '-vcodec', 'png', 'pipe:1'],
    { encoding: 'buffer', maxBuffer: 256 << 20 },
  );
  return stdout.length ? stdout : undefined;
}

/**
 * A representative frame near the start of the video, as a JPEG in the cache. Tries a few early
 * timestamps and keeps the first that is neither black nor flat (else the liveliest one).
 * Returns the cached file, or undefined if no frame could be decoded.
 */
export async function extractCover(video: string, options: CoverOptions = {}): Promise<{ file: string; cached: boolean } | undefined> {
  const cacheDir = options.cacheDir ?? join(process.cwd(), 'node_modules', '.astro', 'wizardfingers-covers');
  const key = createHash('sha1').update(`v${COVER_VERSION}\0`).update(readFileSync(video)).digest('hex').slice(0, 16);
  const file = join(cacheDir, `${key}.jpg`);
  if (existsSync(file)) return { file, cached: true };

  const ffmpeg = options.ffmpeg ?? defaultFfmpeg();
  const duration = await videoDuration(ffmpeg, video);
  const times = COVER_TIMES.filter((t) => t === 0 || duration === undefined || t < duration - 0.05);
  let best: { frame: Buffer; score: number } | undefined;
  for (const t of times) {
    const frame = await frameAt(ffmpeg, video, t).catch(() => undefined);
    if (!frame) continue;
    const { channels } = await sharp(frame).greyscale().stats();
    const { mean, stdev } = channels[0];
    if (mean >= MIN_MEAN && stdev >= MIN_STDEV) {
      best = { frame, score: Infinity };
      break;
    }
    if (!best || mean + stdev > best.score) best = { frame, score: mean + stdev };
  }
  if (!best) return undefined;
  mkdirSync(cacheDir, { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, await sharp(best.frame).jpeg({ quality: 90, mozjpeg: true }).toBuffer());
  renameSync(tmp, file); // atomic: a half-written cover is never reused
  return { file, cached: false };
}

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

export interface DiscoverOptions {
  /** Defaults to `<cwd>/public/media/projects`. */
  root?: string;
  /** Public URL of `root`. */
  base?: string;
  /** Called for files that are skipped or need attention (unsupported type, unreadable size…). */
  warn?: (message: string) => void;
  /** Automatic covers for videos without a poster. `false` turns them off. */
  covers?: false | CoverOptions;
}

export interface Discovery {
  entries: MediaEntry[];
  /** Files over the hosting size limit (the build fails on these). */
  oversized: string[];
}

function walkFiles(dir: string, rel: string[] = []): string[][] {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  const out: string[][] = [];
  for (const name of names.sort(byName)) {
    if (isHidden(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walkFiles(full, [...rel, name]));
    else if (st.isFile()) out.push([...rel, name]);
  }
  return out;
}

const hashFile = (file: string) => createHash('sha1').update(readFileSync(file)).digest('hex').slice(0, 12);

const VIDEO_PREFERENCE = ['webm', 'mp4'];
const IMAGE_PREFERENCE = ['avif', 'webp', 'png', 'jpg', 'jpeg'];

export async function discoverProjectMedia(options: DiscoverOptions = {}): Promise<Discovery> {
  const root = options.root ?? join(process.cwd(), 'public', 'media', 'projects');
  const base = (options.base ?? '/media/projects').replace(/\/+$/, '').split('/').filter(Boolean);
  const warn = options.warn ?? (() => {});
  const entries: MediaEntry[] = [];
  const oversized: string[] = [];
  const ids = new Map<string, string>();

  for (const category of MEDIA_CATEGORIES) {
    const files = walkFiles(join(root, category));
    // Group by folder + stem: one entry per name, whatever formats were uploaded.
    const groups = new Map<string, { dir: string[]; stem: string; videos: string[]; images: string[] }>();
    for (const parts of files) {
      const name = parts[parts.length - 1];
      const rel = parts.join('/');
      if (!isVideo(name) && !isImage(name)) {
        warn(`Skipped ${category}/${rel}: unsupported file type (use ${[...VIDEO_EXTENSIONS, ...IMAGE_EXTENSIONS].join(', ')})`);
        continue;
      }
      if (statSync(join(root, category, ...parts)).size > MAX_FILE_BYTES) {
        oversized.push(`${category}/${rel}`);
        continue;
      }
      const dir = parts.slice(0, -1);
      const stem = stemOf(name);
      const key = [...dir, stem.toLowerCase()].join('/');
      const g = groups.get(key) ?? { dir, stem, videos: [], images: [] };
      (isVideo(name) ? g.videos : g.images).push(name);
      groups.set(key, g);
    }

    // Posters: `<video>-poster.<img>` (or an image with the same name as a video) belongs to the video.
    const posterOf = new Map<string, string>(); // video group key → image group key
    for (const [key, g] of groups) {
      if (!g.videos.length) continue;
      const dirKey = g.dir.join('/');
      const named = [dirKey, `${g.stem.toLowerCase()}-poster`].filter((x, i) => i > 0 || x).join('/');
      if (groups.get(named)?.images.length && !groups.get(named)?.videos.length) posterOf.set(key, named);
      else if (g.images.length) posterOf.set(key, key);
    }
    const posterKeys = new Set([...posterOf.values()].filter((k) => !groups.get(k)?.videos.length));

    const imageFile = async (dir: string[], names: string[]): Promise<MediaImageFile | undefined> => {
      const name = [...names].sort((a, b) => IMAGE_PREFERENCE.indexOf(extOf(a)) - IMAGE_PREFERENCE.indexOf(extOf(b)))[0];
      const file = join(root, category, ...dir, name);
      const size = await imageSize(file);
      if (!size) {
        warn(`Skipped ${category}/${[...dir, name].join('/')}: not a readable image`);
        return undefined;
      }
      return {
        src: encodePublicPath([...base, category, ...dir, name]),
        ...size,
        thumb: { file, hash: hashFile(file), widths: thumbWidths(size.width) },
      };
    };

    /** Cover extracted from the video; on failure the card keeps its dark title frame. */
    const generatedCover = async (video: string, label: string): Promise<MediaImageFile | undefined> => {
      try {
        const cover = await extractCover(video, options.covers || {});
        const size = cover && (await imageSize(cover.file));
        if (!cover || !size) {
          warn(`${label}: could not extract a cover frame; showing the dark title card (upload a -poster image to set one)`);
          return undefined;
        }
        const thumb = { file: cover.file, hash: hashFile(cover.file), widths: thumbWidths(size.width) };
        return { src: thumbUrl(thumb, thumb.widths.at(-1)!), ...size, thumb, generated: true };
      } catch (e) {
        warn(`${label}: cover extraction failed (${(e as Error).message.split('\n')[0]}); showing the dark title card`);
        return undefined;
      }
    };

    const keys = [...groups.keys()].sort(byName);
    for (const key of keys) {
      if (posterKeys.has(key)) continue;
      const g = groups.get(key)!;
      const main = g.videos.length ? g.videos : g.images;
      const name = main[0];
      const path = [...g.dir, name].join('/');
      const title = titleFromFilename(g.stem);
      if (!title) {
        warn(`Skipped ${category}/${path}: the filename has no words to use as a title`);
        continue;
      }
      let id = slugify(`${category}-${[...g.dir, g.stem.replace(ORDER_PREFIX, '')].join('-')}`);
      if (ids.has(id)) id = `${id}-${createHash('sha1').update(`${category}/${key}`).digest('hex').slice(0, 6)}`;
      ids.set(id, key);

      if (g.videos.length) {
        const sources = [...g.videos]
          .sort((a, b) => VIDEO_PREFERENCE.indexOf(extOf(a)) - VIDEO_PREFERENCE.indexOf(extOf(b)))
          .map((v) => ({ src: encodePublicPath([...base, category, ...g.dir, v]), type: (extOf(v) === 'webm' ? 'video/webm' : 'video/mp4') as MediaVideoSource['type'] }));
        const pk = posterOf.get(key);
        let poster = pk ? await imageFile(groups.get(pk)!.dir, groups.get(pk)!.images) : undefined;
        if (!poster && options.covers !== false) poster = await generatedCover(join(root, category, ...g.dir, g.videos[0]), `${category}/${path}`);
        let size: Size | undefined;
        for (const v of g.videos) {
          const file = join(root, category, ...g.dir, v);
          size = extOf(v) === 'webm' ? webmSize(file) : mp4Size(file);
          if (size) break;
        }
        if (!size) {
          size = poster ? { width: poster.width, height: poster.height } : { width: 16, height: 9 };
          warn(`${category}/${path}: could not read the video size; using ${poster ? 'its poster' : '16:9'}`);
        }
        entries.push({ kind: 'video', id, title, category, path, ...size, sources, poster });
      } else {
        const image = await imageFile(g.dir, g.images);
        if (!image) continue;
        entries.push({ kind: 'image', id, title, category, path, width: image.width, height: image.height, image });
      }
    }
  }
  return { entries, oversized };
}

export function thumbWidths(width: number): number[] {
  const ws: number[] = THUMB_WIDTHS.filter((w) => w < width);
  if (ws.length < THUMB_WIDTHS.length) ws.push(Math.min(width, THUMB_WIDTHS[THUMB_WIDTHS.length - 1]));
  return [...new Set(ws)];
}

export const thumbName = (t: Thumb, w: number) => `${t.hash}-${w}.webp`;
export const thumbUrl = (t: Thumb, w: number) => `${THUMB_BASE}/${thumbName(t, w)}`;
export const thumbSrcset = (t: Thumb) => t.widths.map((w) => `${thumbUrl(t, w)} ${w}w`).join(', ');
