import { contactDestinations, site, type Project } from '../content';

const personId = `${site.url}/#person`;

/** Person + WebSite structured data, using only verified information. */
export function siteJsonLd(): Record<string, unknown>[] {
  const sameAs = contactDestinations.filter((d) => d.external && d.id !== 'whatsapp').map((d) => d.href);
  const person: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': personId,
    name: site.fullName,
    alternateName: site.name,
    jobTitle: site.role,
    url: `${site.url}/`,
    description: site.description,
    knowsAbout: ['AI filmmaking', 'Video editing', 'Visual storytelling', 'Website design', 'Website development', 'Web application development', 'Creative technology'],
  };
  if (sameAs.length) person.sameAs = sameAs;
  return [
    person,
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${site.url}/#website`,
      name: site.brand,
      url: `${site.url}/`,
      author: { '@id': personId },
      inLanguage: 'en',
    },
  ];
}

export function projectJsonLd(project: Project, imageUrl?: string): Record<string, unknown>[] {
  const url = `${site.url}/work/${project.slug}/`;
  const work: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.summary,
    url,
    creator: { '@type': 'Person', '@id': personId, name: site.fullName },
  };
  if (project.year) work.dateCreated = String(project.year);
  if (imageUrl) work.image = imageUrl;
  return [
    work,
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Work', item: `${site.url}/#work` },
        { '@type': 'ListItem', position: 2, name: project.title, item: url },
      ],
    },
  ];
}
