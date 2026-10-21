# Hero video jerk — verification recordings

Review-only branch for pull request "Fix hero video jerk". **Do not merge.**

Same 21-second sequence recorded side by side — left: `main` before the fix, right: the fix.
Load → scroll Motion → Intelligence → Digital → reverse → hold across loop seams.
The red badge shows the video's currentTime, loop count, active stage and poster/video state.

- `hero-jerk-desktop-before-vs-after.mp4` — 1440×900 viewports
- `hero-jerk-mobile-before-vs-after.mp4` — 390×844 viewports

Recorded in headless Chromium, which cannot decode H.264: both sides used frame-exact
VP9 copies of their own H.264 encodes. Real-browser H.264 playback still needs checking.
