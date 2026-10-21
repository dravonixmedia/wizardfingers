import type { BackgroundMedia, Dimension } from './types';

/**
 * Background images and videos for the opening stages and the media-led
 * sections. Everything is optional: until media is configured, each slot shows
 * a neutral charcoal "studio" backdrop. See docs/CONTENT.md → Background media.
 *
 * Image  → put the file in `src/media/backgrounds/` and reference it relative to `src/media/`.
 * Video  → put the file in `public/media/backgrounds/` and reference its public path,
 *          plus a poster image in `src/media/backgrounds/`.
 *
 * Examples:
 *   { type: 'image', src: 'backgrounds/motion.jpg', mobileSrc: 'backgrounds/motion-mobile.jpg',
 *     position: '50% 30%', mobilePosition: '60% 25%', overlay: 0.45 }
 *
 *   { type: 'video', src: '/media/backgrounds/motion.mp4', mobileSrc: '/media/backgrounds/motion-mobile.mp4',
 *     poster: 'backgrounds/motion-poster.jpg', position: '50% 40%', overlay: 0.5 }
 */
export const backgrounds: {
  opening: {
    /** One background shared by all three stages. When set, it is used instead of `stages`. */
    shared?: BackgroundMedia;
    /** A different background per stage. Missing stages fall back to the studio backdrop. */
    stages: Partial<Record<Dimension, BackgroundMedia>>;
  };
  sections: Partial<Record<Dimension | 'about' | 'contact', BackgroundMedia>>;
} = {
  opening: {
    // Profile portrait of Pranav, shared by all three stages (one continuous video).
    // Source master (not deployed): media-source/backgrounds/hero.mp4 (HEVC 10-bit, 1920×1080, 10 s).
    // Web versions are built by scripts/encode-hero.sh: H.264, trimmed and crossfaded into a
    // seamless 7.9 s loop; the poster is the exact first frame of the 1080p encode.
    // The face sits right of centre, in the top ~40% of the frame; the lower-centre text
    // area falls on the dark shirt and backdrop.
    shared: {
      type: 'video',
      src: '/media/backgrounds/hero-loop-1080.mp4',
      mobileSrc: '/media/backgrounds/hero-loop-720.mp4',
      poster: 'backgrounds/hero-poster.jpg',
      position: '60% 8%',
      mobilePosition: '62% 0%',
      overlay: 0.3,
    },
    stages: {
      motion: undefined,
      intelligence: undefined,
      digital: undefined,
    },
  },
  sections: {
    motion: undefined,
    intelligence: undefined,
    digital: undefined,
    about: undefined,
    contact: undefined,
  },
};
