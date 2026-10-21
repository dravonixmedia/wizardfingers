import type { ContactLinks, DimensionCopy, ExpertiseItem, Portrait, ShowreelSource } from './types';

/**
 * Site-wide copy and configuration. Edit this file to change biography text,
 * contact links, the portrait and the showreel. See docs/CONTENT.md.
 */

export const site = {
  brand: 'Wizard Fingers',
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
   * Portrait of Pranav. Leave as `undefined` until a real photograph is added
   * to `src/media/portrait/`. The hero switches to a typographic layout without it.
   *
   * Example:
   * portrait: {
   *   src: 'portrait/pranav.jpg',
   *   alt: 'Black-and-white portrait of Pranav',
   *   focal: { x: 50, y: 35 },
   *   cutout: 'portrait/pranav-cutout.png',
   * },
   */
  portrait: undefined as Portrait | undefined,

  /**
   * Showreel. The "Watch Showreel" button only appears when this is set.
   * Examples:
   *   { provider: 'vimeo', id: '123456789', title: 'Wizard Fingers showreel' }
   *   { provider: 'youtube', id: 'dQw4w9WgXcQ', title: 'Wizard Fingers showreel' }
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

export const hero = {
  eyebrow: 'Creative Technologist · Since 2016',
  headline: ['Imagination in motion.', 'Ideas made real.'],
  professionalLine: 'Creative Technologist. Filmmaker. Developer.',
  supporting:
    'I turn ideas into cinematic stories and digital experiences through creativity, AI, and code.',
  concept: 'One Mind. Multiple Dimensions.',
  primaryAction: 'Explore My Work',
  showreelAction: 'Watch Showreel',
};

export const dimensions: DimensionCopy[] = [
  {
    id: 'motion',
    label: 'Motion',
    disciplines: 'Video editing · Films · Visual storytelling',
    description:
      'Footage shaped into stories — rhythm, pacing and image working together so every cut carries meaning.',
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    disciplines: 'AI filmmaking · Creative experiments',
    description:
      'AI tools used like a new kind of camera — to explore ideas, worlds and images, guided by a filmmaker’s eye.',
  },
  {
    id: 'digital',
    label: 'Digital',
    disciplines: 'Websites · Web applications · Interactive experiences',
    description:
      'Websites and web applications designed with a storyteller’s sense of flow and built with modern web technologies.',
  },
];

export const about = {
  label: 'About',
  headline: 'Curiosity is the starting point.',
  lead: 'I’m Pranav — a Creative Technologist, AI Filmmaker, Video Editor, Website Developer and Web Application Developer.',
  paragraphs: [
    'It began in 2016 with video production, content creation and visual storytelling. That curiosity never settled into a single discipline.',
    'Today my work connects filmmaking, AI and web development. I combine creativity, AI tools and modern web technologies to produce cinematic films, engaging content, visually compelling websites and functional web applications.',
    'Experimentation drives everything: trying emerging technologies, designing creative solutions, and transforming ideas into meaningful visual stories and digital experiences.',
  ],
  threads: [
    { label: 'Film', text: 'Stories told in frames, cuts and rhythm.' },
    { label: 'AI', text: 'New tools explored as creative collaborators.' },
    { label: 'Code', text: 'Ideas turned into experiences people can use.' },
  ],
};

export const expertise: ExpertiseItem[] = [
  {
    title: 'AI Filmmaking',
    description:
      'Films and visual studies that combine generative AI tools with a filmmaker’s sense of framing, pacing and narrative.',
    tags: ['Concept', 'Image development', 'AI video', 'Edit'],
  },
  {
    title: 'Video Editing & Storytelling',
    description:
      'Shaping footage into stories with clear structure and rhythm — from short-form content to longer cinematic pieces.',
    tags: ['Editing', 'Pacing', 'Colour', 'Content'],
  },
  {
    title: 'Website Design & Development',
    description:
      'Visually compelling, responsive websites designed and built end to end, where typography and motion carry the story.',
    tags: ['Art direction', 'UI design', 'Front-end', 'Motion'],
  },
  {
    title: 'Web Application Development',
    description:
      'Functional web applications built with modern web technologies, focused on clarity, usability and dependable performance.',
    tags: ['Product thinking', 'Interfaces', 'TypeScript', 'APIs'],
  },
];

export const signature = {
  label: 'Frame → Interface',
  filmLine: 'Every story starts as a frame.',
  codeLine: 'Some of them become interfaces.',
  caption: 'The same eye for composition, rhythm and story — on screen and in the browser.',
};

export const work = {
  label: 'Selected Work',
  headline: 'Selected Work',
  intro: 'Films, AI studies and digital builds — across every dimension of the practice.',
  emptyTitle: 'The reel is being cut.',
  emptyText:
    'New films, AI studies and digital builds are being prepared for this space. They will appear here as they are published.',
};

export const experimentsCopy = {
  label: 'Experiments',
  headline: 'Lab notes',
  intro: 'AI film studies, motion tests, interactive prototypes and creative technology explorations.',
};

export const contact = {
  label: 'Contact',
  headline: 'What shall we bring to life?',
  intro: 'Have a film, a website or an idea that needs a little magic? Let’s talk.',
  unavailable: 'Contact details will be published here soon.',
};
