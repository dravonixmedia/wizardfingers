import type { Experiment } from './types';

/**
 * Experiments: AI film studies, motion tests, interactive prototypes and
 * creative technology explorations. The Experiments section is hidden until at
 * least one entry is published. Images go in `src/media/experiments/`.
 *
 * Example:
 * {
 *   slug: 'latent-weather',
 *   title: 'Latent Weather',
 *   kind: 'AI film study',
 *   description: 'Short study exploring …',
 *   image: { src: 'experiments/latent-weather.jpg', alt: '…' },
 *   video: '/media/experiments/latent-weather.mp4',
 *   link: { url: 'https://vimeo.com/…', label: 'Watch study' },
 *   year: 2026,
 *   published: true,
 *   order: 10,
 * },
 */
export const experiments: Experiment[] = [];
