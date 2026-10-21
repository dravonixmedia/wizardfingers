# Editing content

All copy and media configuration lives in `src/content/`. Content is validated
whenever the dev server starts or the site builds: problems are printed as
warnings in development and **fail the production build**, so broken links,
missing images or missing alt text never reach the live site.

| What | Where |
| --- | --- |
| Opening stages, section copy, About, contact, showreel | `src/content/site.ts` |
| Projects | `src/content/projects.ts` |
| Experiments | `src/content/experiments.ts` |
| Images (optimised automatically) | `src/media/…` |
| Videos and other large files (served as-is) | `public/media/…` |

| Background images/videos (opening + sections) | `src/content/backgrounds.ts` |

Image paths in content are **relative to `src/media/`** (e.g. `projects/night-signal/cover.jpg`).
Video paths are **absolute public paths** (e.g. `/media/projects/night-signal/preview.mp4`).

Run `npm run dev` while editing — the page reloads on save.

---

## Background media (opening stages and sections)

All background images and videos are configured in **`src/content/backgrounds.ts`**.
Every slot is optional. Until a slot is filled, the site shows a neutral charcoal
"studio" backdrop, never a broken or empty frame.

| Slot | Where it appears |
| --- | --- |
| `opening.shared` | One background behind all three opening stages (overrides `opening.stages`) |
| `opening.stages.motion` / `.intelligence` / `.digital` | A different background per opening stage |
| `sections.motion` / `.intelligence` / `.digital` | Behind the three discipline sections |
| `sections.about` | Behind About (e.g. a genuine portrait of Pranav) |
| `sections.contact` | Behind Contact |

### Where to upload

| File | Folder | How to reference it |
| --- | --- | --- |
| Images and video posters (JPG/PNG/WebP) | `src/media/backgrounds/` | relative to `src/media/` → `'backgrounds/motion.jpg'` |
| Videos (MP4, H.264) | `public/media/backgrounds/` | public path → `'/media/backgrounds/motion.mp4'` |
| Original masters (any format, never deployed) | `media-source/` | not referenced by the site |

Suggested names: `opening-motion.jpg`, `opening-intelligence.mp4`, `opening-intelligence-poster.jpg`,
`opening-digital.jpg`, `section-motion.mp4`, `section-motion-poster.jpg`, `about.jpg`, `contact.jpg`,
plus `-mobile` variants where needed.

### Image

```ts
motion: {
  type: 'image',
  src: 'backgrounds/opening-motion.jpg',          // ≥ 2560 px wide, landscape
  mobileSrc: 'backgrounds/opening-motion-mobile.jpg', // optional portrait crop for phones
  position: '50% 30%',        // desktop focal point (object-position)
  mobilePosition: '62% 25%',  // optional phone focal point
  overlay: 0.45,              // 0 = no darkening … 1 = black. Default 0.45
  alt: '',                    // describe only if the image carries meaning
},
```

### Video

```ts
intelligence: {
  type: 'video',
  src: '/media/backgrounds/opening-intelligence.mp4',
  mobileSrc: '/media/backgrounds/opening-intelligence-mobile.mp4', // optional
  poster: 'backgrounds/opening-intelligence-poster.jpg',           // required
  mobilePoster: 'backgrounds/opening-intelligence-poster-mobile.jpg', // optional
  position: '50% 40%',
  overlay: 0.5,
},
```

Video behaviour: always muted, looping and inline, never with sound. Nothing
downloads until the video is about to be shown. It plays only while visible (in
the opening, only for the active stage), and a visible **Pause/Play** control
appears. Phones play the video only when `mobileSrc` is set, otherwise they show
the poster. Reduced motion, Data Saver and blocked autoplay also show the poster.

**Use H.264 MP4, not HEVC/H.265.** Firefox and many Chrome installs cannot decode HEVC
(especially 10-bit "Main 10"), so those visitors would only see the poster. The current hero
was delivered as HEVC. The untouched master lives in `media-source/backgrounds/hero.mp4`, outside
`public/`, so it is never deployed. The site serves H.264 encodes built from it by
**`scripts/encode-hero.sh`** (requires ffmpeg with libx264):

| Output | Purpose |
| --- | --- |
| `public/media/backgrounds/hero-loop-1080.mp4` | desktop (≈1.3 MB) |
| `public/media/backgrounds/hero-loop-720.mp4` | phones (≈0.5 MB) |
| `src/media/backgrounds/hero-poster.jpg` | exact first frame of the 1080p encode |

The script also makes the clip loop smoothly. Each step fixes a measured problem:

- **Trim + 1 s crossfade loop.** The master's first frames contain an abrupt settle and its
  last frame doesn't match its first (a 2 px jump at every loop). Frames 4–218 are kept and
  the final second dissolves into the frames just before the loop start, so the last frame
  flows into the first. Result: 7.9 s loop with no visible seam.
- **One keyframe, `scenecut=0`.** Periodic keyframes produced a quality "tick" every 2 s.
- **`mbtree=0`.** Otherwise x264 lowers the quality of the final frames and the loop restart
  looks like a sharpness "pop".
- **Poster = frame 0**, converted with the video's BT.709 limited-range settings, so the
  poster → video handover is pixel-identical (the page reveals the video only after its
  first frame has been presented).

When replacing the hero video: put the new master in `media-source/backgrounds/`, adjust
`MASTER`, `A`, `B` and `L` in the script if needed, run it, and use new output file names
(e.g. `hero-loop-v2-1080.mp4`) so browsers holding the old cached file can't pair it with the
new poster. Don't animate the background's scale or position in entrance animations.

Recommended video: 1920×1080 (mobile 1080×1920 or 720×1280), 6–15 s seamless loop,
H.264 MP4 with `-movflags +faststart`, no audio track, ≤ 8 MB (mobile ≤ 3 MB).
Workers static assets are limited to 25 MiB per file.

### Shared vs separate opening backgrounds

- **One shared background**: set `opening.shared` and leave the stages empty.
  Only the headline and supporting line change while scrolling.
- **Separate backgrounds**: leave `opening.shared` as `undefined` and fill
  `opening.stages.*`. Stages crossfade as visitors scroll.
  A missing stage falls back to the studio backdrop.

### Focal points and text-safe areas

- In the opening, the identity and headline sit in the **lower centre**. Frame
  subjects so faces are in the **upper half** (e.g. `position: '50% 25%'`).
- Motion section text sits **bottom-left**, Intelligence **right**, Digital
  **top-left**, About **left**. Keep faces and important detail away from those areas,
  or move them with `position`.
- Raise `overlay` if the headline loses contrast on a bright image.

Use only genuine photography or footage. Do not use stock people or generated
likenesses of Pranav.

## Add a showreel

A **Showreel** button appears in the opening's control bar only when a showreel is configured.
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
- `featured: true`: featured projects are listed first (up to three) in their discipline
  section (Motion / Intelligence / Digital), with a link that filters Selected Work.
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

## Hide a project

Set `published: false`. The project disappears from the homepage, its page, the sitemap
and the discipline sections; nothing else needs changing.

## Biography and other copy

Opening stages (`opening`), discipline sections (`features`), Work, About and Contact
copy are in `src/content/site.ts`. The navigation is `navigation` in the same file.
The default sharing image is `public/og/default.png` (1200×630); regenerate it with
`node scripts/generate-brand-assets.mjs` after changing the brand, or replace the file.
Each project page uses its own cover as its sharing image.

## Development-only samples

`npm run dev:samples` loads placeholder projects/experiments from
`src/content/samples.ts` (images in `src/media/_samples/`) to preview layouts.
They are labelled "Sample", are `noindex`, and are **never** included in a
production build, project routes, the sitemap or structured data.
