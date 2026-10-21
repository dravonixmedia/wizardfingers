/**
 * Content types for the Wizard Fingers portfolio.
 *
 * Image `src` values are paths relative to `src/media/` (for example
 * `projects/my-film/cover.jpg`). They are optimised at build time.
 *
 * Video and other large files live in `public/media/` and are referenced with
 * an absolute public path (for example `/media/projects/my-film/preview.mp4`).
 */

export type Dimension = 'motion' | 'intelligence' | 'digital';

/** Focal point as percentages from the top-left corner (0–100). */
export interface FocalPoint {
  x: number;
  y: number;
}

export interface MediaImage {
  /** Path relative to `src/media/`, e.g. `projects/my-film/cover.jpg`. */
  src: string;
  /** Meaningful description. Use an empty string only for purely decorative images. */
  alt: string;
  /** Where preview crops should centre. Defaults to the image centre. */
  focal?: FocalPoint;
  /** Optional caption shown in galleries. */
  caption?: string;
}

export interface VideoPreview {
  /** Public path to a short, muted, looping MP4/WebM, e.g. `/media/projects/slug/preview.mp4`. */
  src: string;
  /** MIME type. Defaults to `video/mp4`. */
  type?: string;
  /** Poster image (path relative to `src/media/`). Defaults to the project cover. */
  poster?: string;
}

export type FilmSource =
  | { provider: 'youtube'; id: string; title: string }
  | { provider: 'vimeo'; id: string; title: string; hash?: string }
  | { provider: 'file'; src: string; title: string; type?: string; captions?: string };

export interface Film {
  source: FilmSource;
  /** Width / height, e.g. 16/9 or 2.39. Defaults to 16/9. */
  aspect?: number;
  /** Poster image (path relative to `src/media/`). Defaults to the project cover. */
  poster?: string;
}

export interface ExternalLink {
  url: string;
  /** Visible label, e.g. "Visit website". */
  label?: string;
}

export interface Project {
  /** URL segment: lowercase letters, numbers and hyphens. Page lives at /work/<slug>/. */
  slug: string;
  title: string;
  category: Dimension;
  /** One or two sentences used on cards, meta descriptions and the project intro. */
  summary: string;
  /** Pranav's role, e.g. "Director & Editor". */
  role: string;
  year?: number;
  cover: MediaImage;
  preview?: VideoPreview;
  film?: Film;
  website?: ExternalLink;
  gallery?: MediaImage[];
  /** Paragraphs. */
  overview?: string[];
  /** Paragraphs describing Pranav's contribution. */
  contribution?: string[];
  /** Paragraphs describing the approach / process. */
  approach?: string[];
  featured?: boolean;
  published: boolean;
  /** Lower numbers appear first. */
  order: number;
  /** Internal: marks development-only sample content. Never set this on real work. */
  sample?: boolean;
}

export interface Experiment {
  slug: string;
  title: string;
  /** e.g. "AI film study", "Motion test", "Interactive prototype". */
  kind: string;
  description: string;
  image?: MediaImage;
  /** Optional public path to a short muted loop. */
  video?: string;
  link?: ExternalLink;
  year?: number;
  published: boolean;
  order: number;
  sample?: boolean;
}

export type ShowreelSource = FilmSource;

export interface Portrait {
  /** Full photograph (path relative to `src/media/`). */
  src: string;
  alt: string;
  focal?: FocalPoint;
  /**
   * Optional transparent PNG/WebP cut-out of the subject, aligned 1:1 with `src`.
   * When present the hero places the name between photo and subject for depth.
   */
  cutout?: string;
}

export interface ContactLinks {
  email?: string;
  instagram?: string;
  linkedin?: string;
  vimeo?: string;
  youtube?: string;
  /** International format digits, e.g. "441234567890" (no + or spaces needed). */
  whatsapp?: string;
}

export interface DimensionCopy {
  id: Dimension;
  label: string;
  /** Short line under the label. */
  disciplines: string;
  description: string;
}

export interface ExpertiseItem {
  title: string;
  description: string;
  tags: string[];
}
