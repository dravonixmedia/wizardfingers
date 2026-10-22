import type { LinkProject } from './types';

/**
 * Real projects listed by name and external link only (no media, no detail page). They open in a
 * new tab. `workLabel` lists a project in Selected Work; `showInSection: false` keeps it out of its
 * discipline section. See docs/CONTENT.md → "Add a link-only project".
 */
export const linkProjects: LinkProject[] = [
  {
    title: 'Dravonix Media',
    type: 'Website',
    category: 'digital',
    url: 'https://dravonixmedia.com/',
    label: 'Visit Website',
    workLabel: 'Development',
    showInSection: false,
    published: true,
    order: 10,
  },
  {
    title: 'Abodoo Properties',
    type: 'Website',
    category: 'digital',
    url: 'https://abodooproperties.co.uk/',
    label: 'Visit Website',
    workLabel: 'Development',
    showInSection: false,
    published: true,
    order: 20,
  },
  {
    title: 'AR Hydraulics Solutions',
    type: 'Website',
    category: 'digital',
    url: 'https://arhydraulicssolutions.com/',
    label: 'Visit Website',
    workLabel: 'Development',
    showInSection: false,
    published: true,
    order: 30,
  },
  {
    title: 'Dravonix Project Estimator',
    type: 'Web app',
    category: 'digital',
    url: 'https://estimate.dravonix.dev/',
    label: 'Visit Website',
    workLabel: 'Development',
    showInSection: false,
    published: true,
    order: 40,
  },
  {
    // Its site is the Digital section's background video; listed in Selected Work only.
    title: 'Timeless Knot',
    type: 'Website',
    category: 'digital',
    url: 'https://timelessknot.in/',
    label: 'Visit Website',
    workLabel: 'Development',
    showInSection: false,
    published: true,
    order: 50,
  },
  {
    title: 'DTS Gulf',
    type: 'Website',
    category: 'digital',
    url: 'https://dtsgulf.com/',
    label: 'Visit Website',
    workLabel: 'Development',
    showInSection: false,
    published: true,
    order: 60,
  },
  {
    title: 'Ranco',
    type: 'Website',
    category: 'digital',
    url: 'https://ranco.in/',
    label: 'Visit Website',
    workLabel: 'Development',
    showInSection: false,
    published: true,
    order: 70,
  },
];
