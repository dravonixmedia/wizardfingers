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

### Digital section video (Timeless Knot)

`sections.digital` plays a screen recording of the Timeless Knot website. The untouched
recording is `media-source/backgrounds/timeless-knot-hero.mp4`; **`scripts/encode-timeless-knot.sh`**
builds the web versions from it:

| Output | Purpose |
| --- | --- |
| `public/media/backgrounds/timeless-knot-loop-1080.mp4` | desktop and tablet, 1920×920 (≈4.9 MB) |
| `public/media/backgrounds/timeless-knot-loop-720.mp4` | phones, 720×920 portrait crop at full sharpness (≈1.8 MB) |
| `src/media/backgrounds/timeless-knot-poster.jpg` / `-poster-mobile.jpg` | exact first frame of each encode |

- **Crop** removes the recording's 80 px black bars; **trim** drops the first 1.2 s (site still
  loading) and the static tail where a sticky header jumps in.
- **Loop**: the recording scrolls hero → footer, so the ends can never match. Instead of a
  crossfade (which would ghost the footer over the hero) the footer dips to charcoal and the
  hero fades back up from it: a clean 37.5 s loop.
- Shown under a 0.7 overlay, with a stronger scrim behind the text column, so the CRF is higher
  than the hero's. To change the phone framing, edit `MOBILE_X` in the script.

### Section videos (Motion and Intelligence)

`sections.motion` and `sections.intelligence` play short films built by
**`scripts/encode-section-backgrounds.sh`** from the untouched masters
`media-source/backgrounds/motion-hero.mp4` and `media-source/backgrounds/Intelligence-hero.mp4`:

| Output | Purpose |
| --- | --- |
| `public/media/backgrounds/motion-loop-720p.mp4` | desktop and tablet, 1280×720 (the master's resolution, ≈5.1 MB) |
| `public/media/backgrounds/motion-loop-mobile.mp4` | phones, 576×720 portrait crop (≈2.2 MB) |
| `public/media/backgrounds/intelligence-loop-1080.mp4` | desktop and tablet, 1920×1080 (≈5.1 MB) |
| `public/media/backgrounds/intelligence-loop-720.mp4` | phones, 720×900 portrait crop (≈1.4 MB) |
| `src/media/backgrounds/{motion,intelligence}-poster.jpg` / `-poster-mobile.jpg` | exact first frame of each encode |

- **Audio** is removed. **Trim**: Intelligence drops a 0.36 s fade-up at the start. Motion drops
  the black frames, title card and flash transitions at the start, and the fade to black and
  black-and-white outro at the end.
- **Motion length**: a 29 s excerpt of the colour footage (the full 62 s was 8–15 MB). It starts on
  the couple's close-up so the poster is recognisable; raise `B` in the script to use more.
- **Loop**: both are edited films that cut every few seconds, so each loop restarts on a clean cut.
- Overlays: Motion 0.5 (text bottom-left), Intelligence 0.6 (bright footage, text on the right).

### About portrait

`sections.about` uses the approved black-and-white portrait. The original
`media-source/backgrounds/about-hero.png` (1672×941) is untouched; `src/media/backgrounds/about-hero.png`
is an exact copy for the responsive image pipeline (AVIF/WebP/JPG, never upscaled), and
`about-hero-mobile.png` is an 820×941 crop of the same file (x 650–1470) around his face for phones.

- Overlay `0.05`: the portrait's own low-key lighting is kept. The About scrim darkens only the
  text column on the left and fades out before his face.
- Below 1024px there is no room beside his face, so the portrait sits above the biography at its
  natural proportions (phones: the portrait crop) and fades into the page.
- When replacing it, keep the face right of centre, or adjust `position` and the crop.

Recommended video: 1920×1080 (mobile 1080×1920 or 720×1280), 6–15 s seamless loop,
H.264 MP4 with `-movflags +faststart`, no audio track, ≤ 8 MB (mobile ≤ 3 MB).
Workers static assets are limited to 25 MiB per file.

### Shared vs separate opening backgrounds

- **One shared background**: set `opening.shared` and leave the stages empty.
  Only the headline and supporting line change while scrolling.
- **Separate backgrounds**: leave `opening.shared` as `undefined` and fill
  `opening.stages.*`. Stages crossfade as visitors scroll.
  A missing stage falls back to the studio backdrop.

### Section transitions (Motion → Intelligence → Digital)

Homepage order: opening → Motion → Intelligence → Digital → Selected Work → About → Contact.
The opening's Scroll cue leads to Motion.

With JavaScript on and motion allowed, `src/scripts/chapters.ts` turns these consecutive
sections into curtain chapters (plain CSS `position: sticky`, native scrolling, no timers or
snapping):

- Each section stays whole — background, overlay, text and Pause/Play together — as an opaque
  full-screen panel. The next one rises from the bottom and covers it like a curtain while it
  stays pinned underneath. Scrolling back reverses it exactly.
- Each chapter is about 1.9 viewport heights of scroll: one to rise, then a reading hold
  (`HOLD = 0.9` in the script). Panels taller than the screen (e.g. on short phones) scroll
  through all their content first, then pin by their bottom edge.
- The backgrounds drift very slightly (`PARALLAX`, ±1.8%) with a matching scale so no edge is
  ever exposed.
- Only videos that are visible play: a section is paused once the next one fully covers it.
- After Digital's hold the pinned run releases and Selected Work, About and Contact scroll as
  ordinary sections. Nav links and deep links (`/#digital`) land at the start of a chapter's hold.
- Only consecutive sections join: a section placed between them ends the run there.
- Reduced motion or no JavaScript: ordinary stacked sections.

### Focal points and text-safe areas

- In the opening, the identity, headline and supporting line sit as one centred group at the
  **bottom centre**, just above the controls. Frame subjects so faces are in the **upper half**
  (e.g. `position: '50% 25%'`).
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

## Publish work by uploading files (Selected Work)

Videos and images placed in a category folder appear in **Selected Work** automatically. No code
or project entry is needed.

| Folder | For |
| --- | --- |
| `public/media/projects/motion/` | Edited videos, filmmaking and related images |
| `public/media/projects/intelligence/` | AI videos and AI-generated creative images |

Digital stays as the seven website/app links in `src/content/link-projects.ts`.

### Upload workflow

1. On GitHub, open the category folder (e.g. `public/media/projects/motion/`).
2. **Add file → Upload files**, and upload media with a descriptive filename, e.g.
   `halo-villa-film.mp4`.
3. Optional, for videos: also upload a matching poster image, e.g. `halo-villa-film-poster.jpg`.
4. Commit to `main`.
5. Wait for the Cloudflare production deployment to finish successfully.
6. The item appears in Selected Work, in its filter, with the counts updated.

Deleting a file (and committing) removes its entry after the next deployment. Renaming a file
renames its entry.

### Rules

- **Supported:** MP4, WebM (video); JPG, JPEG, PNG, WebP, AVIF (image). Other files are ignored,
  as are hidden files (`.DS_Store`, `.gitkeep`).
- **Maximum 25 MiB per file** (Cloudflare's limit). A larger file fails the build with a message
  naming it, and the live site stays as it was. Compress or shorten the video, or link longer
  films from YouTube/Vimeo instead.
- **Titles come from filenames.** Hyphens, underscores and spaces become spaces and words are
  capitalised: `halo-villa-film.mp4` → "Halo Villa Film". Acronyms such as AI, UAE, CGI, VFX and
  3D stay in capitals: `ai-dubai-reel.mp4` → "AI Dubai Reel". Spaces in filenames are fine.
- **Order:** alphabetical within each category, Motion first. To set the order, start filenames
  with a number: `01-halo-villa-film.mp4`, `02-…`. The number is not shown in the title.
- **Subfolders** are allowed (e.g. `motion/weddings/…`). The category always comes from the
  top-level folder.
- **Covers:** every video gets a cover image, in this order:
  1. **An uploaded poster.** `<video name>-poster.<jpg|jpeg|png|webp|avif>` in the same folder,
     e.g. `ai-dubai-reel-poster.jpg` next to `ai-dubai-reel.mp4`. An image with exactly the
     video's name (`ai-dubai-reel.jpg`) works too. Posters are never listed separately. Adding or
     replacing one updates the cover on the next deployment.
  2. **A frame from the video**, picked automatically during the build. It is taken from the
     first seconds (around 1 s) and skips black or blank opening frames. Orientation and
     proportions follow the video. To choose a different frame, upload a poster.
  3. If no frame can be read (an unusual codec or a damaged file), the build logs a warning and
     the card shows a dark title card with a play button. The deployment still succeeds.
- Extracted covers are cached by video content, so unchanged videos are not processed again.
  On Cloudflare the cache is kept between builds when **Settings → Build → Build cache** is
  enabled for the Worker. Without it, covers are simply re-extracted on each build (about a second
  per video).
- The same name in two formats (`film.webm` + `film.mp4`) is one entry; browsers pick the format
  they support.
- Media keeps its own proportions (portrait, square or landscape). Nothing is cropped.
- Thumbnails (WebP) are generated during the build from the poster or extracted frame. Visitors
  download a video only when they open it. Videos start muted, with sound available from the player controls.
- Only the `motion` and `intelligence` folders are scanned. Media for detailed projects (below)
  lives in other folders.

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

## Add a link-only project

For real work you want to list without images or a detail page (e.g. a live website),
add an entry to `src/content/link-projects.ts`:

```ts
{
  title: 'Timeless Knot',
  type: 'Website',                 // short type label shown in its discipline section
  category: 'digital',             // 'motion' | 'intelligence' | 'digital'
  url: 'https://timelessknot.in/', // must be https
  label: 'Visit Website',          // link text; an ↗ arrow is added automatically
  workLabel: 'Development',        // optional: also list it in Selected Work with this label
  showInSection: false,            // optional: keep it out of its discipline section (default true)
  published: true,
  order: 10,
},
```

- **Selected Work:** entries with a `workLabel` appear as a compact list (name, domain, label and
  "Visit Website ↗") under **All** and their category filter, after any full projects. The
  empty-state message disappears once anything is listed.
- **Discipline section:** entries appear as a name / type / link row in their section (e.g.
  Timeless Knot in Digital) unless `showInSection: false`.
- Links open in a new tab (`rel="noopener noreferrer"`). Link-only projects don't create a page
  and aren't added to the sitemap. To give a project a full page later, move it to
  `projects.ts` with a cover image.

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
