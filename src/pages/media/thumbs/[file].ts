import type { APIRoute, GetStaticPaths } from 'astro';
import sharp from 'sharp';
import { mediaProjects } from '../../../content';
import { thumbName, type Thumb } from '../../../lib/project-media';

/**
 * WebP thumbnails for folder-published work (images and video posters), generated at build time
 * so the grid never downloads the uploaded originals. Names carry a content hash.
 */
export const getStaticPaths = (() => {
  const thumbs = new Map<string, { thumb: Thumb; width: number }>();
  for (const e of mediaProjects) {
    const t = e.kind === 'image' ? e.image.thumb : e.poster?.thumb;
    if (t) for (const width of t.widths) thumbs.set(thumbName(t, width), { thumb: t, width });
  }
  return [...thumbs].map(([file, props]) => ({ params: { file }, props }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { thumb, width } = props as { thumb: Thumb; width: number };
  const body = await sharp(thumb.file).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
  return new Response(new Uint8Array(body), { headers: { 'Content-Type': 'image/webp' } });
};
