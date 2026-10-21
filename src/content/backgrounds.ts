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
    // Pre-wedding film: a couple in a tea estate. Source master (not deployed):
    // media-source/backgrounds/motion-hero.mp4 (1276×718, 79 s, with audio).
    // Web versions are built by scripts/encode-section-backgrounds.sh: title card, black/white
    // transitions and the faded black-and-white outro trimmed; a 29 s colour excerpt that
    // starts on the couple's close-up. Text sits bottom-left; faces sit in the upper half.
    motion: {
      type: 'video',
      src: '/media/backgrounds/motion-loop-720p.mp4',
      mobileSrc: '/media/backgrounds/motion-loop-mobile.mp4',
      poster: 'backgrounds/motion-poster.jpg',
      mobilePoster: 'backgrounds/motion-poster-mobile.jpg',
      position: '50% 30%',
      mobilePosition: '50% 20%',
      overlay: 0.5,
    },
    // Short film of a bright, wood-panelled interior. Source master (not deployed):
    // media-source/backgrounds/Intelligence-hero.mp4 (1920×1080, 17.8 s, with audio).
    // Web versions are built by scripts/encode-section-backgrounds.sh: opening fade-up trimmed,
    // a 17.4 s loop that restarts on a clean cut. The footage is bright, so the overlay is
    // stronger; the text sits on the right (bottom on phones).
    intelligence: {
      type: 'video',
      src: '/media/backgrounds/intelligence-loop-1080.mp4',
      mobileSrc: '/media/backgrounds/intelligence-loop-720.mp4',
      poster: 'backgrounds/intelligence-poster.jpg',
      mobilePoster: 'backgrounds/intelligence-poster-mobile.jpg',
      position: '50% 40%',
      mobilePosition: '50% 30%',
      overlay: 0.6,
    },
    // Screen recording of the Timeless Knot website (a real Digital project), scrolling from its
    // hero to its footer. Source master (not deployed): media-source/backgrounds/timeless-knot-hero.mp4.
    // Web versions are built by scripts/encode-timeless-knot.sh: loading frames trimmed, black
    // bars cropped, the footer dips to charcoal and fades back to the hero for a clean 37.5 s loop.
    // Phones get a 720×920 portrait crop of the same recording (the hero couple and headline).
    digital: {
      type: 'video',
      src: '/media/backgrounds/timeless-knot-loop-1080.mp4',
      mobileSrc: '/media/backgrounds/timeless-knot-loop-720.mp4',
      poster: 'backgrounds/timeless-knot-poster.jpg',
      mobilePoster: 'backgrounds/timeless-knot-poster-mobile.jpg',
      position: '50% 50%',
      mobilePosition: '50% 50%',
      overlay: 0.7,
    },
    // Approved black-and-white portrait of Pranav. Original (not deployed):
    // media-source/backgrounds/about-hero.png (1672×941). about-hero.png is an exact copy for the
    // responsive pipeline (AVIF/WebP/JPG, never upscaled); about-hero-mobile.png is an 820×941
    // crop of the same file around his face for phones. His face sits right of centre; the
    // biography is on the left. The overlay is minimal to keep the original low-key lighting:
    // About.astro's scrim darkens only the text column.
    about: {
      type: 'image',
      src: 'backgrounds/about-hero.png',
      mobileSrc: 'backgrounds/about-hero-mobile.png',
      alt: '',
      position: '35% 30%',
      mobilePosition: '50% 30%',
      overlay: 0.05,
    },
    contact: undefined,
  },
};
