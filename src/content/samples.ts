import type { Experiment, Project } from './types';

/**
 * DEVELOPMENT-ONLY placeholder content.
 *
 * Loaded only by `npm run dev:samples` (WF_SAMPLES=1 with the dev server).
 * Production builds never include these entries: they are excluded from
 * pages, project routes, the sitemap and structured data.
 * Every entry is marked `sample: true` and rendered with a visible "Sample" label.
 */

const lorem = 'Placeholder copy for layout development. Replace with a real project before publishing.';

export const sampleProjects: Project[] = [
  {
    slug: 'sample-motion-film',
    title: 'Sample Film',
    category: 'motion',
    summary: 'Placeholder for a short film or edit. Used only to preview the layout.',
    role: 'Sample role',
    year: 2026,
    cover: { src: '_samples/cover-a.jpg', alt: 'Abstract placeholder frame with a blue light streak', focal: { x: 62, y: 50 } },
    gallery: [
      { src: '_samples/still-wide.jpg', alt: 'Wide abstract placeholder still', caption: 'Sample still — wide' },
      { src: '_samples/still-tall.jpg', alt: 'Tall abstract placeholder still', caption: 'Sample still — tall' },
      { src: '_samples/still-square.jpg', alt: 'Square abstract placeholder still' },
    ],
    overview: [lorem, lorem],
    contribution: [lorem],
    approach: [lorem],
    featured: true,
    published: true,
    order: 1,
    sample: true,
  },
  {
    slug: 'sample-ai-study',
    title: 'Sample AI Study',
    category: 'intelligence',
    summary: 'Placeholder for an AI filmmaking project. Used only to preview the layout.',
    role: 'Sample role',
    year: 2026,
    cover: { src: '_samples/cover-b.jpg', alt: 'Abstract placeholder with a particle field', focal: { x: 40, y: 45 } },
    overview: [lorem],
    approach: [lorem, lorem],
    gallery: [{ src: '_samples/still-wide.jpg', alt: 'Wide abstract placeholder still' }],
    featured: true,
    published: true,
    order: 2,
    sample: true,
  },
  {
    slug: 'sample-website',
    title: 'Sample Website',
    category: 'digital',
    summary: 'Placeholder for a website design and development project.',
    role: 'Sample role',
    cover: { src: '_samples/cover-c.jpg', alt: 'Abstract placeholder with a browser-like grid', focal: { x: 50, y: 30 } },
    website: { url: 'https://example.com', label: 'Visit sample website' },
    overview: [lorem],
    contribution: [lorem],
    featured: true,
    published: true,
    order: 3,
    sample: true,
  },
  {
    slug: 'sample-edit',
    title: 'Sample Edit',
    category: 'motion',
    summary: 'Second placeholder for the Motion dimension.',
    role: 'Sample role',
    year: 2025,
    cover: { src: '_samples/cover-d.jpg', alt: 'Tall abstract placeholder frame' },
    overview: [lorem],
    published: true,
    order: 4,
    sample: true,
  },
  {
    slug: 'sample-web-app',
    title: 'Sample Web App',
    category: 'digital',
    summary: 'Placeholder for a web application project.',
    role: 'Sample role',
    cover: { src: '_samples/cover-e.jpg', alt: 'Abstract placeholder interface composition' },
    overview: [lorem],
    contribution: [lorem],
    published: true,
    order: 5,
    sample: true,
  },
  {
    slug: 'sample-draft',
    title: 'Sample Draft (unpublished)',
    category: 'intelligence',
    summary: 'Unpublished drafts never render — this entry proves it.',
    role: 'Sample role',
    cover: { src: '_samples/cover-a.jpg', alt: 'Placeholder' },
    published: false,
    order: 6,
    sample: true,
  },
];

export const sampleExperiments: Experiment[] = [
  { slug: 'sample-exp-1', title: 'Sample Study', kind: 'AI film study', description: 'Placeholder experiment.', image: { src: '_samples/still-square.jpg', alt: 'Square abstract placeholder' }, published: true, order: 1, sample: true },
  { slug: 'sample-exp-2', title: 'Sample Motion Test', kind: 'Motion test', description: 'Placeholder experiment.', image: { src: '_samples/still-tall.jpg', alt: 'Tall abstract placeholder' }, published: true, order: 2, sample: true },
  { slug: 'sample-exp-3', title: 'Sample Prototype', kind: 'Interactive prototype', description: 'Placeholder experiment without an image.', published: true, order: 3, sample: true },
  { slug: 'sample-exp-4', title: 'Sample Exploration', kind: 'Creative technology', description: 'Placeholder experiment.', image: { src: '_samples/still-wide.jpg', alt: 'Wide abstract placeholder' }, published: true, order: 4, sample: true },
];
