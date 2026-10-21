# Wizard Fingers

Portfolio of **Pranav** — Creative Technologist working across AI filmmaking,
video editing, website design & development and web application development.

Live domain: <https://wizardfingers.com>

## Stack

| Layer | Choice |
| --- | --- |
| Site | [Astro](https://astro.build) 7, static output, TypeScript |
| Motion | GSAP 3 + ScrollTrigger (loaded only when reduced motion is off) |
| Fonts | Self-hosted via Fontsource (all SIL OFL): Anton, Inter, JetBrains Mono, Instrument Serif |
| Images | `astro:assets` → responsive AVIF/WebP with explicit dimensions |
| Hosting | Cloudflare Workers Static Assets, Worker `wizardfingers` (`worker/index.ts`) |

No database, CMS, auth or backend. All editable content lives in typed modules
under `src/content/` and is validated on every dev start and build.

## Local development

Requires Node 22.12+ (`.node-version` pins 22.22.0).

```sh
npm install
npm run dev            # http://localhost:4321 — real content only
npm run dev:samples    # same, plus clearly-labelled development-only sample content
npm run preview        # production build served by the real Workers runtime (wrangler dev)
```

| Script | What it does |
| --- | --- |
| `npm run check` | `astro check` + type-check of the Worker |
| `npm run build` | Static build into `dist/` (fails on invalid content) |
| `npm test` | Worker tests (www → apex redirect, headers, 404 passthrough) |
| `npm run verify` | check + build + test |
| `npm run deploy` | verify, then `wrangler deploy` — **production; see docs/DEPLOYMENT.md first** |

Visual QA helper (needs a Chromium binary, `CHROMIUM_PATH`):

```sh
node scripts/screenshots.mjs http://localhost:4321 screenshots / /work/<slug>/
```

## Project structure

```
src/
  content/        site.ts (copy, contact, portrait, showreel), projects.ts,
                  experiments.ts, samples.ts (dev only), types.ts, index.ts (validation)
  media/          images optimised at build time (portrait/, projects/<slug>/, experiments/)
  components/     Hero (+ dimension selector), Work, ProjectCard, About,
                  FrameToInterface, Expertise, Experiments, Contact, FilmPlayer, ShowreelDialog…
  pages/          index, work/[slug] (one page per published project), 404, sitemap.xml, robots.txt
  scripts/        client-side behaviour (menu, selector, filters, media, motion)
public/           favicons, og/default.png, media/ (videos — served as-is)
worker/           Cloudflare Worker entry (redirect + headers) and helpers
docs/             CONTENT.md, DEPLOYMENT.md
```

- Editing content: **[docs/CONTENT.md](docs/CONTENT.md)**
- Cloudflare deployment: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**
