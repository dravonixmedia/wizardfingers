# Source media (masters — not deployed)

Original, unmodified media files kept as masters for future re-encodes.
Nothing in this folder is part of the site: Astro only builds `src/` and copies
`public/`, and Cloudflare only uploads `dist/`.

| File | What it is | Web versions in use |
| --- | --- | --- |
| `backgrounds/hero.mp4` | Opening hero video as delivered: HEVC (H.265) Main 10, 1920×1080, 24 fps, 10.04 s, no audio. SHA-256 `cf16ae7176ba53b0f5b1f0d865044a5ca5d13fe9ec15ebcb578a3dc13c1b2a10` | `public/media/backgrounds/hero-1080.mp4`, `hero-720.mp4` (H.264), poster `src/media/backgrounds/hero-poster.jpg` |

HEVC isn't playable in Firefox and many Chrome installs, so the site serves H.264
encodes made from the master. To regenerate them, see docs/CONTENT.md → Background media.
