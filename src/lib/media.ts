import type { ImageMetadata } from 'astro';
import type { FocalPoint } from '../content/types';

/**
 * Resolves image paths (relative to `src/media/`) to Astro image metadata so
 * they can be optimised into responsive AVIF/WebP at build time.
 */
const images = import.meta.glob<{ default: ImageMetadata }>(
  ['/src/media/**/*.{jpg,jpeg,png,webp,avif}', '!/src/media/_samples/**'],
  { eager: true },
);

// Development-only sample images. `import.meta.env.DEV` is statically false in
// production builds; the lazy glob below is then dead code and the files are
// never emitted. (An eager glob would be hoisted into static imports.)
const sampleImages: Record<string, { default: ImageMetadata }> = import.meta.env.DEV
  ? Object.fromEntries(
      await Promise.all(
        Object.entries(import.meta.glob<{ default: ImageMetadata }>('/src/media/_samples/*.{jpg,jpeg,png,webp,avif}')).map(
          async ([key, load]) => [key, await load()] as const,
        ),
      ),
    )
  : {};

export function resolveImage(src: string | undefined): ImageMetadata | undefined {
  if (!src) return undefined;
  const key = `/src/media/${src.replace(/^\/+/, '')}`;
  return (images[key] ?? sampleImages[key])?.default;
}

export function imageExists(src: string): boolean {
  return resolveImage(src) !== undefined;
}

export function objectPosition(focal?: FocalPoint): string {
  if (!focal) return '50% 50%';
  const clamp = (n: number) => Math.min(100, Math.max(0, n));
  return `${clamp(focal.x)}% ${clamp(focal.y)}%`;
}
