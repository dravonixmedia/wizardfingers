import type { Project } from './types';

/**
 * Published portfolio projects.
 *
 * Add real work only. Each project needs a cover image in
 * `src/media/projects/<slug>/` — see docs/CONTENT.md for the full guide.
 *
 * Example (copy, then edit):
 *
 * {
 *   slug: 'night-signal',
 *   title: 'Night Signal',
 *   category: 'intelligence',            // 'motion' | 'intelligence' | 'digital'
 *   summary: 'A short AI film about …',
 *   role: 'Director, AI imagery & edit',
 *   year: 2026,
 *   cover: {
 *     src: 'projects/night-signal/cover.jpg',
 *     alt: 'A lone figure under a streetlight in heavy rain',
 *     focal: { x: 50, y: 40 },
 *   },
 *   preview: { src: '/media/projects/night-signal/preview.mp4' },
 *   film: { source: { provider: 'vimeo', id: '123456789', title: 'Night Signal' }, aspect: 2.39 },
 *   website: { url: 'https://example.com', label: 'Visit website' },
 *   gallery: [{ src: 'projects/night-signal/still-01.jpg', alt: '…' }],
 *   overview: ['…'],
 *   contribution: ['…'],
 *   approach: ['…'],
 *   featured: true,
 *   published: true,
 *   order: 10,
 * },
 */
export const projects: Project[] = [];
