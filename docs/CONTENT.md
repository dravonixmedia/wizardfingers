# Editing content

All copy and media configuration lives in `src/content/`. Content is validated
whenever the dev server starts or the site builds: problems are printed as
warnings in development and **fail the production build**, so broken links,
missing images or missing alt text never reach the live site.

| What | Where |
| --- | --- |
| Biography, hero copy, expertise, contact, portrait, showreel | `src/content/site.ts` |
| Projects | `src/content/projects.ts` |
| Experiments | `src/content/experiments.ts` |
| Images (optimised automatically) | `src/media/…` |
| Videos and other large files (served as-is) | `public/media/…` |

Image paths in content are **relative to `src/media/`** (e.g. `projects/night-signal/cover.jpg`).
Video paths are **absolute public paths** (e.g. `/media/projects/night-signal/preview.mp4`).

Run `npm run dev` while editing — the page reloads on save.

---

## Add the portrait

1. Put a high-resolution photo (at least 2000 px tall, JPG/PNG/WebP) in
   `src/media/portrait/`, e.g. `src/media/portrait/pranav.jpg`.
   The site renders it in monochrome; supply the original colour file.
2. In `src/content/site.ts` set:

   ```ts
   portrait: {
     src: 'portrait/pranav.jpg',
     alt: 'Black-and-white portrait of Pranav',
     focal: { x: 50, y: 35 },      // where the face is, in % from top-left
   },
   ```

3. Optional, for layered depth: a transparent PNG/WebP cut-out of just the
   subject, **exactly the same size and framing** as the photo, e.g.
   `portrait/pranav-cutout.png`, then add `cutout: 'portrait/pranav-cutout.png'`.
   With a cut-out, the name sits between background and subject. Without one,
   the layout keeps type clear of the face.

The same portrait also appears in the About section. Without a portrait the
hero stays typographic — nothing else needs to change.

## Add a showreel

The **Watch Showreel** button appears only when a showreel is configured.
In `src/content/site.ts`:

```ts
showreel: { provider: 'vimeo', id: '123456789', title: 'Wizard Fingers showreel' },
// or
showreel: { provider: 'youtube', id: 'VIDEO_ID', title: 'Wizard Fingers showreel' },
// or a self-hosted file in public/media/showreel/
showreel: { provider: 'file', src: '/media/showreel/showreel.mp4', title: 'Wizard Fingers showreel' },
```

The player opens in an accessible dialog and only loads when clicked
(YouTube uses the privacy-enhanced `youtube-nocookie.com` domain; Vimeo uses `dnt=1`).
For private Vimeo links add `hash: 'abc123'` (the part after the ID in the share URL).

Self-hosted video tips: H.264 MP4, ≤ 1080p, `-movflags +faststart`.
Workers static assets are limited to 25 MiB per file — host longer films on Vimeo/YouTube.

## Add and publish a project

1. Create `src/media/projects/<slug>/` and add a cover image (landscape, ≥ 2400 px wide
   works best) plus any gallery images. `<slug>` is lowercase-with-hyphens and becomes
   the URL: `/work/<slug>/`.
2. Optional hover preview: a short (3–8 s), muted, small (≤ 3 MB) MP4 in
   `public/media/projects/<slug>/preview.mp4`.
3. Add an entry to the array in `src/content/projects.ts` (the commented example
   in that file lists every field):

   ```ts
   {
     slug: 'night-signal',
     title: 'Night Signal',
     category: 'intelligence',          // 'motion' | 'intelligence' | 'digital'
     summary: 'One or two sentences about the work.',
     role: 'Director, AI imagery & edit',
     year: 2026,                        // optional
     cover: { src: 'projects/night-signal/cover.jpg', alt: 'Describe the image', focal: { x: 50, y: 40 } },
     preview: { src: '/media/projects/night-signal/preview.mp4' },          // optional
     film: { source: { provider: 'vimeo', id: '123456789', title: 'Night Signal' }, aspect: 2.39 }, // optional
     website: { url: 'https://example.com', label: 'Visit website' },      // optional
     gallery: [{ src: 'projects/night-signal/still-01.jpg', alt: '…', caption: '…' }], // optional
     overview: ['Paragraph…'],          // optional
     contribution: ['Paragraph…'],      // optional — Pranav's part in the work
     approach: ['Paragraph…'],          // optional
     featured: true,
     published: true,
     order: 10,
   },
   ```

4. Check it at `http://localhost:4321/work/night-signal/`.

Notes:

- Only sections with data are rendered. Projects with a `film` show the film first.
- Gallery images keep their original aspect ratio; covers are cropped using `focal`.
- `published: false` keeps a draft out of the site, sitemap and routes entirely.
- Only add real work, with accurate roles and descriptions.

## Change order and featured status

- `order`: lower numbers come first in **Selected Work** and in "Next project" links.
  Leave gaps (10, 20, 30…) so you can insert work later.
- `featured: true`: the first featured project in each dimension (by `order`) is the
  preview shown in the hero's **Motion / Intelligence / Digital** selector. If none is
  featured, the first project in that dimension is used.
- The editorial layout (wide, offset, portrait crops…) is assigned automatically from
  the order, so reordering also changes each project's composition.

## Add experiments

Add entries to `src/content/experiments.ts` (example in the file). Images go in
`src/media/experiments/`, optional short loops in `public/media/experiments/`.
The Experiments section appears automatically once at least one entry has
`published: true`, and hides again when none do.

## Update contact links

In `src/content/site.ts` fill in any of:

```ts
contact: {
  email: 'hello@example.com',
  instagram: 'https://www.instagram.com/<handle>/',
  linkedin: 'https://www.linkedin.com/in/<handle>/',
  vimeo: 'https://vimeo.com/<handle>',
  youtube: 'https://www.youtube.com/@<handle>',
  whatsapp: '441234567890',   // international format, digits only — optional
},
```

Empty values are hidden. Invalid values (malformed email, non-https URL, wrong
domain) are rejected by validation rather than rendered as broken links. With no
contact details the section shows a neutral note and no buttons. Configured
social profiles are also added to the Person structured data (`sameAs`).

## Biography and other copy

Hero, About, Expertise, Contact and section copy are in `src/content/site.ts`.
The default sharing image is `public/og/default.png` (1200×630); regenerate it with
`node scripts/generate-brand-assets.mjs` after changing the brand, or replace the file.
Each project page uses its own cover as its sharing image.

## Development-only samples

`npm run dev:samples` loads placeholder projects/experiments from
`src/content/samples.ts` (images in `src/media/_samples/`) to preview layouts.
They are labelled "Sample", are `noindex`, and are **never** included in a
production build, project routes, the sitemap or structured data.
