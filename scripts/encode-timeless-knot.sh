#!/usr/bin/env bash
# Builds the web versions of the Digital section background from the untouched screen recording.
#
#   media-source/backgrounds/timeless-knot-hero.mp4  (H.264 + AAC, 1920×1080, 25 fps, 982 frames — never modified)
#     → public/media/backgrounds/timeless-knot-loop-1080.mp4  (H.264, desktop/tablet, 1920×920)
#     → public/media/backgrounds/timeless-knot-loop-720.mp4   (H.264, phones, 720×920 portrait crop)
#     → src/media/backgrounds/timeless-knot-poster.jpg         (exact first frame of the desktop encode)
#     → src/media/backgrounds/timeless-knot-poster-mobile.jpg  (exact first frame of the phone encode)
#
# Why each step exists (see docs/CONTENT.md → "Digital section video"):
#   * Crop: the recording has 80 px black bars above and below the page (cropdetect).
#   * Trim: frames before A show the site still loading (heading animating in, buttons
#     missing); frames after B hold the footer and then jump when a sticky header appears.
#     A is the first fully loaded frame of the Timeless Knot hero.
#   * Loop: the recording scrolls from hero to footer, so the last frame can never match the
#     first. Instead of a crossfade (which would ghost the footer over the hero), the footer
#     dips to the site's charcoal and the hero fades back up from it, ending on frame A.
#   * One keyframe, no scene-cut keyframes, mbtree=0: same reasons as scripts/encode-hero.sh
#     (no periodic quality "tick", no sharpness "pop" at the loop restart).
#   * Higher CRF than the hero: the section shows the video under a ~70% dark overlay.
#   * Posters = frame 0 of each encode (BT.709 limited range → full-range RGB), so the
#     poster-to-video handover is pixel-identical.
#
# Usage: scripts/encode-timeless-knot.sh   (requires ffmpeg with libx264)
set -euo pipefail
cd "$(dirname "$0")/.."

MASTER=media-source/backgrounds/timeless-knot-hero.mp4
OUT=public/media/backgrounds
POSTERS=src/media/backgrounds
A=30   # first kept frame (1.20 s, hero fully loaded)
B=954  # last kept frame (38.16 s, footer at rest)
F=10   # dip-to-charcoal fade-out length (frames)
T=12   # hero fade-in length after the dip (frames)
CHARCOAL=0x0A0A0B
MOBILE_X=420 # left edge of the 720 px wide phone crop (keeps the hero couple and headline)

FPS=25
KEPT=$((B - A + 1))

graph() { # $1 = crop filter
  echo "[0:v]$1,settb=1/$FPS,split[x][y];\
[x]trim=start_frame=$A:end_frame=$((B + 1)),setpts=PTS-STARTPTS,fade=t=out:start_frame=$((KEPT - F)):nb_frames=$F:color=$CHARCOAL[main];\
[y]trim=start_frame=$A:end_frame=$((A + 1)),setpts=PTS-STARTPTS,loop=loop=$((T - 1)):size=1:start=0,setpts=N/$FPS/TB,fade=t=in:nb_frames=$T:color=$CHARCOAL[tail];\
[main][tail]concat=n=2:v=1:a=0,format=yuv420p[v]"
}

X264=(-c:v libx264 -preset slow -tune film -profile:v high -pix_fmt yuv420p -r "$FPS"
  -g 2000 -keyint_min 2000 -x264-params scenecut=0:mbtree=0
  -an -movflags +faststart
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv)

ffmpeg -hide_banner -loglevel error -y -i "$MASTER" \
  -filter_complex "$(graph crop=1920:920:0:80)" -map "[v]" "${X264[@]}" -crf 27 -level 4.1 \
  "$OUT/timeless-knot-loop-1080.mp4"

ffmpeg -hide_banner -loglevel error -y -i "$MASTER" \
  -filter_complex "$(graph crop=720:920:$MOBILE_X:80)" -map "[v]" "${X264[@]}" -crf 27 -level 3.1 \
  "$OUT/timeless-knot-loop-720.mp4"

poster() { # $1 = video, $2 = jpg
  ffmpeg -hide_banner -loglevel error -y -i "$1" \
    -vf "select=eq(n\,0),scale=in_color_matrix=bt709:in_range=tv:out_range=pc,format=rgb24" \
    -frames:v 1 -q:v 1 "$2"
}
poster "$OUT/timeless-knot-loop-1080.mp4" "$POSTERS/timeless-knot-poster.jpg"
poster "$OUT/timeless-knot-loop-720.mp4" "$POSTERS/timeless-knot-poster-mobile.jpg"

echo "Encoded $((KEPT + T)) frames ($(awk "BEGIN { printf \"%.2f\", ($KEPT + $T) / $FPS }") s):"
ls -la "$OUT"/timeless-knot-loop-*.mp4 "$POSTERS"/timeless-knot-poster*.jpg
