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
    shared: undefined,
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
