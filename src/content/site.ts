import type { ContactLinks, FeatureCopy, OpeningStage, ShowreelSource } from './types';

/**
 * Site-wide copy and configuration. Edit this file to change text, contact
 * links and the showreel. Background images/videos live in `backgrounds.ts`.
 * See docs/CONTENT.md.
 */

export const site = {
  brand: 'Wizard Fingers',
  /** Text wordmark shown top-left. */
  wordmark: { name: 'wizardfingers', tld: '.com' },
  /** Display name used throughout the site. */
  name: 'Pranav',
  /** Name used in structured data. */
  fullName: 'Pranav A',
  role: 'Creative Technologist',
  url: 'https://wizardfingers.com',
  locale: 'en',
  title: 'Pranav — Creative Technologist, AI Filmmaker & Developer | Wizard Fingers',
  description:
    'Pranav is a Creative Technologist working across AI filmmaking, video editing, website design and web application development — turning ideas into cinematic stories and digital experiences.',
  /** Default social sharing image (public path, 1200×630). */
  ogImage: '/og/default.png',
  ogImageAlt: 'Wizard Fingers — Pranav, Creative Technologist',

  /**
   * Showreel. A "Watch showreel" button appears in the opening only when this is set.
   * Examples:
   *   { provider: 'vimeo', id: '123456789', title: 'Wizard Fingers showreel' }
   *   { provider: 'youtube', id: 'VIDEO_ID', title: 'Wizard Fingers showreel' }
   *   { provider: 'file', src: '/media/showreel/showreel.mp4', title: 'Wizard Fingers showreel' }
   */
  showreel: undefined as ShowreelSource | undefined,

  /**
   * Contact destinations. Only valid, filled-in values are shown.
   * Use full https URLs for social profiles.
   */
  contact: {
    email: '',
    instagram: '',
    linkedin: '',
    vimeo: '',
    youtube: '',
    whatsapp: '',
  } satisfies ContactLinks as ContactLinks,
} as const;

/** Primary navigation (homepage anchors). */
export const navigation = [
  { href: '#work', label: 'Work' },
  { href: '#motion', label: 'Motion' },
  { href: '#intelligence', label: 'Intelligence' },
  { href: '#digital', label: 'Digital' },
  { href: '#about', label: 'About' },
];

/** The three scroll stages of the opening. Backgrounds: see `backgrounds.ts`. */
export const opening: { identity: { name: string; role: string }; scrollCue: string; stages: OpeningStage[] } = {
  identity: { name: 'Pranav', role: 'Creative Technologist' },
  scrollCue: 'Scroll',
  stages: [
    { id: 'motion', headline: 'Motion.', supporting: 'Filmmaking · Video Editing · Storytelling' },
    { id: 'intelligence', headline: 'Intelligence.', supporting: 'AI Filmmaking · Creative Experiments' },
    { id: 'digital', headline: 'Digital.', supporting: 'Websites · Web Applications' },
  ],
};

/** Media-led discipline sections that follow Selected Work. */
export const features: FeatureCopy[] = [
  {
    id: 'motion',
    label: 'Motion',
    headline: 'Stories, shaped in motion.',
    copy: 'Films and edits built around rhythm, emotion and visual storytelling.',
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    headline: 'Imagination, expanded.',
    copy: 'AI filmmaking and creative experiments that turn unexpected ideas into visual worlds.',
  },
  {
    id: 'digital',
    label: 'Digital',
    headline: 'Ideas, made interactive.',
    copy: 'Websites and web applications that bring design, storytelling and functionality together.',
  },
];

export const work = {
  label: 'Selected Work',
  headline: 'Selected Work',
  intro: 'Films, AI studies and digital builds.',
  emptyTitle: 'New work is on its way.',
  emptyText: 'Films, AI studies and digital builds will appear here as they are published.',
};

export const about = {
  label: 'About',
  headline: 'Curiosity is the starting point.',
  body: 'I’m Pranav, a Creative Technologist working across filmmaking, AI and digital development. Since 2016, I’ve explored video production, content creation and visual storytelling—bringing that same curiosity into websites, web applications and emerging creative tools.',
};

export const experimentsCopy = {
  label: 'Experiments',
  headline: 'Lab notes',
  intro: 'AI film studies, motion tests, interactive prototypes and creative technology explorations.',
};

export const contact = {
  label: 'Contact',
  headline: 'What shall we bring to life?',
  intro: 'Have a film, a website or an idea in mind? Let’s talk.',
  unavailable: 'Contact details will be published here soon.',
};
