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

/**
 * A real project shown only as a name, type and external link in its discipline
 * section (Motion / Intelligence / Digital). No media and no detail page.
 * Use `Project` instead when there are images, a film or a write-up.
 */
export interface LinkProject {
  title: string;
  /** Short type label, e.g. "Website" or "Web app". */
  type: string;
  category: Dimension;
  /** Full https URL of the live project. */
  url: string;
  /** Visible link text, e.g. "Visit Website". An ↗ arrow is added automatically. */
  label: string;
  /**
   * Small label shown in Selected Work, e.g. "Development". When set, the project is also
   * listed in Selected Work (name, domain, this label and the link) under All and its category.
   */
  workLabel?: string;
  /** Also list it as a row in its discipline section (Motion / Intelligence / Digital). Default true. */
  showInSection?: boolean;
  published: boolean;
  /** Lower numbers appear first. */
  order: number;
}

export type ShowreelSource = FilmSource;

export interface ContactLinks {
  email?: string;
  instagram?: string;
  linkedin?: string;
  vimeo?: string;
  youtube?: string;
  /** WhatsApp numbers, one link each, in the order given. */
  whatsapp?: WhatsAppContact[];
}

export interface WhatsAppContact {
  /** Shown after "WhatsApp —", e.g. "India". */
  region: string;
  /** International format, digits only, e.g. "918086552536". Used for the wa.me link. */
  number: string;
  /** The number as displayed, e.g. "+91 80865 52536". Must contain the same digits. */
  display: string;
}

/**
 * Full-bleed background media used by the opening stages and the media-led
 * sections. Images are paths relative to `src/media/` (optimised at build
 * time); videos are public paths under `public/media/` (served as-is).
 */
export type BackgroundMedia =
  | {
      type: 'image';
      /** Path relative to `src/media/`, e.g. `backgrounds/motion.jpg`. */
      src: string;
      /** Optional portrait-oriented crop for phones (≤ 720px wide). */
      mobileSrc?: string;
      /** Describe the image if it carries meaning; leave '' for purely atmospheric images. */
      alt?: string;
      /** CSS object-position for desktop, e.g. '50% 30%'. Default '50% 50%'. */
      position?: string;
      /** CSS object-position for phones. Defaults to `position`. */
      mobilePosition?: string;
      /** Darkening overlay strength, 0–1. Default 0.45. */
      overlay?: number;
    }
  | {
      type: 'video';
      /** Public path, e.g. `/media/backgrounds/motion.mp4` (muted, looping, ≤ 10 MB recommended). */
      src: string;
      /** Optional lighter video for phones. Without it, phones show the poster only. */
      mobileSrc?: string;
      /** Required still (path relative to `src/media/`) shown before playback, on reduced motion and on failure. */
      poster: string;
      /** Optional phone-specific poster (path relative to `src/media/`). */
      mobilePoster?: string;
      position?: string;
      mobilePosition?: string;
      overlay?: number;
    };

export interface OpeningStage {
  id: Dimension;
  /** Large headline, e.g. 'Motion.' */
  headline: string;
  /** Supporting line, e.g. 'Filmmaking · Video Editing · Storytelling'. */
  supporting: string;
}

export interface FeatureCopy {
  id: Dimension;
  label: string;
  headline: string;
  copy: string;
}
