import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { experiments as allExperiments } from './experiments';
import { linkProjects as allLinkProjects } from './link-projects';
import { projects as allProjects } from './projects';
import { sampleExperiments, sampleProjects } from './samples';
import { backgrounds } from './backgrounds';
import { site } from './site';
import type { BackgroundMedia, ContactLinks, Dimension, Experiment, FilmSource, LinkProject, MediaImage, Project } from './types';
import { imageExists } from '../lib/media';
import { discoverProjectMedia, MAX_FILE_BYTES, type MediaEntry } from '../lib/project-media';

export * from './site';
export { backgrounds } from './backgrounds';
export type * from './types';

/** Samples load only on the dev server with WF_SAMPLES=1. Never in builds. */
export const samplesEnabled = import.meta.env.DEV && process.env.WF_SAMPLES === '1';

const DIMENSIONS: Dimension[] = ['motion', 'intelligence', 'digital'];
export const dimensionLabels: Record<Dimension, string> = {
  motion: 'Motion',
  intelligence: 'Intelligence',
  digital: 'Digital',
};

// ---------------------------------------------------------------------------
// Validation — runs whenever content is loaded (dev server and build).
// Errors fail the production build; in development they are logged.
// ---------------------------------------------------------------------------

const problems: string[] = [];
const fail = (msg: string) => problems.push(msg);

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const publicFileExists = (p: string) => existsSync(join(process.cwd(), 'public', p.replace(/^\/+/, '')));

function checkImage(where: string, img: MediaImage | undefined, required = false) {
  if (!img) {
    if (required) fail(`${where}: image is required`);
    return;
  }
  if (!img.src) fail(`${where}: image src is empty`);
  else if (!imageExists(img.src)) fail(`${where}: image not found at src/media/${img.src}`);
  if (typeof img.alt !== 'string') fail(`${where}: alt text is required (use "" only for decorative images)`);
  if (img.focal && (img.focal.x < 0 || img.focal.x > 100 || img.focal.y < 0 || img.focal.y > 100)) {
    fail(`${where}: focal point must be 0–100`);
  }
}

function checkPublic(where: string, p: string | undefined) {
  if (!p) return;
  if (!p.startsWith('/')) fail(`${where}: public paths must start with "/" (got "${p}")`);
  else if (!publicFileExists(p)) fail(`${where}: file not found at public${p}`);
}

function checkHttpUrl(where: string, url: string | undefined) {
  if (!url) return;
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') fail(`${where}: must be an http(s) URL`);
  } catch {
    fail(`${where}: invalid URL "${url}"`);
  }
}

function checkFilm(where: string, source: FilmSource) {
  if (!source.title) fail(`${where}: title is required for accessibility`);
  if (source.provider === 'youtube' && !/^[\w-]{6,20}$/.test(source.id)) fail(`${where}: invalid YouTube id`);
  if (source.provider === 'vimeo' && !/^\d+$/.test(source.id)) fail(`${where}: invalid Vimeo id`);
  if (source.provider === 'file') {
    checkPublic(where, source.src);
    checkPublic(`${where} captions`, source.captions);
  }
}

function validateProjects(list: Project[]) {
  const seen = new Set<string>();
  for (const p of list) {
    const where = `project "${p.slug || p.title}"`;
    if (!SLUG.test(p.slug)) fail(`${where}: slug must be lowercase-with-hyphens`);
    if (seen.has(p.slug)) fail(`${where}: duplicate slug`);
    seen.add(p.slug);
    if (!p.title?.trim()) fail(`${where}: title is required`);
    if (!DIMENSIONS.includes(p.category)) fail(`${where}: category must be one of ${DIMENSIONS.join(', ')}`);
    if (!p.summary?.trim()) fail(`${where}: summary is required`);
    if (!p.role?.trim()) fail(`${where}: role is required`);
    if (typeof p.order !== 'number') fail(`${where}: order must be a number`);
    if (p.year !== undefined && (!Number.isInteger(p.year) || p.year < 1990 || p.year > 2100)) fail(`${where}: invalid year`);
    if (!p.published) continue; // drafts may be incomplete
    checkImage(`${where} cover`, p.cover, true);
    p.gallery?.forEach((g, i) => checkImage(`${where} gallery[${i}]`, g, true));
    if (p.preview) {
      checkPublic(`${where} preview`, p.preview.src);
      if (p.preview.poster && !imageExists(p.preview.poster)) fail(`${where}: preview poster not found`);
    }
    if (p.film) {
      checkFilm(`${where} film`, p.film.source);
      if (p.film.poster && !imageExists(p.film.poster)) fail(`${where}: film poster not found`);
    }
    checkHttpUrl(`${where} website`, p.website?.url);
    if (!p.sample && (p.title.toLowerCase().startsWith('sample') || p.slug.startsWith('sample-'))) {
      fail(`${where}: looks like sample content but is not marked as a sample`);
    }
  }
}

function validateExperiments(list: Experiment[]) {
  const seen = new Set<string>();
  for (const e of list) {
    const where = `experiment "${e.slug || e.title}"`;
    if (!SLUG.test(e.slug)) fail(`${where}: slug must be lowercase-with-hyphens`);
    if (seen.has(e.slug)) fail(`${where}: duplicate slug`);
    seen.add(e.slug);
    if (!e.title?.trim() || !e.kind?.trim() || !e.description?.trim()) fail(`${where}: title, kind and description are required`);
    if (!e.published) continue;
    checkImage(`${where} image`, e.image);
    checkPublic(`${where} video`, e.video);
    checkHttpUrl(`${where} link`, e.link?.url);
  }
}

const POSITION = /^(?:-?\d+(?:\.\d+)?%|left|center|right|top|bottom)(?:\s+(?:-?\d+(?:\.\d+)?%|left|center|right|top|bottom))?$/;

function checkBackground(where: string, m: BackgroundMedia | undefined) {
  if (!m) return;
  if (m.type === 'image') {
    if (!imageExists(m.src)) fail(`${where}: image not found at src/media/${m.src}`);
    if (m.mobileSrc && !imageExists(m.mobileSrc)) fail(`${where}: mobile image not found at src/media/${m.mobileSrc}`);
  } else if (m.type === 'video') {
    checkPublic(`${where} video`, m.src);
    checkPublic(`${where} mobile video`, m.mobileSrc);
    if (!m.poster) fail(`${where}: videos need a poster image`);
    else if (!imageExists(m.poster)) fail(`${where}: poster not found at src/media/${m.poster}`);
    if (m.mobilePoster && !imageExists(m.mobilePoster)) fail(`${where}: mobile poster not found at src/media/${m.mobilePoster}`);
  } else {
    fail(`${where}: type must be 'image' or 'video'`);
  }
  for (const [k, v] of [['position', m.position], ['mobilePosition', m.mobilePosition]] as const) {
    if (v !== undefined && !POSITION.test(v.trim())) fail(`${where}: ${k} must look like '50% 30%'`);
  }
  if (m.overlay !== undefined && (m.overlay < 0 || m.overlay > 1)) fail(`${where}: overlay must be between 0 and 1`);
}

function validateLinkProjects(list: LinkProject[]) {
  for (const l of list) {
    const where = `link project "${l.title}"`;
    if (!l.title?.trim() || !l.type?.trim() || !l.label?.trim()) fail(`${where}: title, type and label are required`);
    if (!DIMENSIONS.includes(l.category)) fail(`${where}: category must be one of ${DIMENSIONS.join(', ')}`);
    if (typeof l.order !== 'number') fail(`${where}: order must be a number`);
    if (l.workLabel !== undefined && !l.workLabel.trim()) fail(`${where}: workLabel must not be empty`);
    try {
      if (new URL(l.url).protocol !== 'https:') fail(`${where}: url must use https`);
    } catch {
      fail(`${where}: invalid url "${l.url}"`);
    }
  }
}

function validateSite() {
  if (site.showreel) checkFilm('site.showreel', site.showreel);
  checkBackground('backgrounds.opening.shared', backgrounds.opening.shared);
  for (const [k, v] of Object.entries(backgrounds.opening.stages)) checkBackground(`backgrounds.opening.stages.${k}`, v);
  for (const [k, v] of Object.entries(backgrounds.sections)) checkBackground(`backgrounds.sections.${k}`, v);
}

const sourceProjects = samplesEnabled ? [...allProjects, ...sampleProjects] : allProjects;
const sourceExperiments = samplesEnabled ? [...allExperiments, ...sampleExperiments] : allExperiments;

validateProjects(sourceProjects);
validateExperiments(sourceExperiments);
validateLinkProjects(allLinkProjects);
validateSite();

// Folder-based work: every supported file in public/media/projects/<motion|intelligence>/.
const discovered = await discoverProjectMedia({
  warn: (m) => console.warn(`[wizardfingers] ${m}`),
});
for (const f of discovered.oversized) {
  fail(`public/media/projects/${f} is larger than ${MAX_FILE_BYTES / 1024 / 1024} MiB (the hosting limit per file): compress or shorten it`);
}

if (problems.length) {
  const message = `Content validation failed:\n  - ${problems.join('\n  - ')}`;
  if (import.meta.env.DEV) console.warn(`\n[wizardfingers] ${message}\n`);
  else throw new Error(message);
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

const byOrder = <T extends { order: number; title: string }>(a: T, b: T) =>
  a.order - b.order || a.title.localeCompare(b.title);

/** Published projects, sorted by `order`. Samples never appear in production. */
export const publishedProjects: Project[] = sourceProjects
  .filter((p) => p.published && (samplesEnabled || !p.sample))
  .filter((p) => !import.meta.env.DEV || imageExists(p.cover.src))
  .sort(byOrder);

export const publishedExperiments: Experiment[] = sourceExperiments
  .filter((e) => e.published && (samplesEnabled || !e.sample))
  .sort(byOrder);

export function getProject(slug: string) {
  return publishedProjects.find((p) => p.slug === slug);
}

export function nextProject(slug: string) {
  const i = publishedProjects.findIndex((p) => p.slug === slug);
  if (i < 0 || publishedProjects.length < 2) return undefined;
  return publishedProjects[(i + 1) % publishedProjects.length];
}

/** Media published by upload (public/media/projects/<category>/), by category, then filename. */
export const mediaProjects: MediaEntry[] = discovered.entries;

/** Published link-only projects in a dimension, by order. */
const byOrderTitle = (a: LinkProject, b: LinkProject) => a.order - b.order || a.title.localeCompare(b.title);

/** Link-only projects shown as rows in a discipline section. */
export function linkProjectsFor(dimension: Dimension): LinkProject[] {
  return allLinkProjects.filter((l) => l.published && l.category === dimension && l.showInSection !== false).sort(byOrderTitle);
}

/** Link-only projects listed in Selected Work (those with a `workLabel`). */
export const workLinkProjects: LinkProject[] = allLinkProjects.filter((l) => l.published && l.workLabel).sort(byOrderTitle);

/** Published projects in a dimension, featured first, then by order. */
export function projectsFor(dimension: Dimension) {
  const inDim = publishedProjects.filter((p) => p.category === dimension);
  return [...inDim.filter((p) => p.featured), ...inDim.filter((p) => !p.featured)];
}

// ---------------------------------------------------------------------------
// Contact links — only valid values are exposed.
// ---------------------------------------------------------------------------

export interface ContactDestination {
  id: keyof ContactLinks;
  label: string;
  href: string;
  display: string;
  external: boolean;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const socialHosts: Record<string, string[]> = {
  instagram: ['instagram.com', 'www.instagram.com'],
  linkedin: ['linkedin.com', 'www.linkedin.com'],
  vimeo: ['vimeo.com', 'www.vimeo.com'],
  youtube: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'],
};
const socialLabels: Record<string, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  vimeo: 'Vimeo',
  youtube: 'YouTube',
};

function validSocial(id: string, value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const u = new URL(value.trim());
    if (u.protocol !== 'https:' || !socialHosts[id]?.includes(u.hostname)) throw new Error();
    if (u.pathname === '/' || u.pathname === '') throw new Error();
    return u.toString();
  } catch {
    fail(`site.contact.${id}: must be a full https profile URL on ${socialHosts[id]?.[0]}`);
    if (import.meta.env.DEV) console.warn(`[wizardfingers] Ignoring invalid contact.${id}: "${value}"`);
    return undefined;
  }
}

function buildContact(c: ContactLinks): ContactDestination[] {
  const out: ContactDestination[] = [];
  const email = c.email?.trim();
  if (email) {
    if (EMAIL.test(email)) out.push({ id: 'email', label: 'Email', href: `mailto:${email}`, display: email, external: false });
    else if (import.meta.env.DEV) console.warn(`[wizardfingers] Ignoring invalid contact.email: "${email}"`);
    else throw new Error(`site.contact.email is not a valid address: "${email}"`);
  }
  for (const id of ['instagram', 'linkedin', 'vimeo', 'youtube'] as const) {
    const href = validSocial(id, c[id]);
    if (href) {
      const u = new URL(href);
      out.push({ id, label: socialLabels[id], href, display: `${u.hostname.replace(/^www\./, '')}${u.pathname.replace(/\/$/, '')}`, external: true });
    }
  }
  const wa = c.whatsapp?.replace(/[^\d]/g, '');
  if (wa) {
    if (wa.length >= 8 && wa.length <= 15) out.push({ id: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/${wa}`, display: 'Message on WhatsApp', external: true });
    else if (!import.meta.env.DEV) throw new Error('site.contact.whatsapp must be 8–15 digits in international format');
  }
  if (problems.length && !import.meta.env.DEV) throw new Error(problems.join('\n'));
  return out;
}

export const contactDestinations = buildContact(site.contact);
