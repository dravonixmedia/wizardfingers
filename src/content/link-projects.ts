import type { LinkProject } from './types';

/**
 * Real projects listed by name, type and external link only, inside their
 * discipline section. They open in a new tab and have no detail page.
 * See docs/CONTENT.md → "Add a link-only project".
 */
export const linkProjects: LinkProject[] = [
  {
    title: 'Timeless Knot',
    type: 'Website',
    category: 'digital',
    url: 'https://timelessknot.in/',
    label: 'Visit Website',
    published: true,
    order: 10,
  },
];
