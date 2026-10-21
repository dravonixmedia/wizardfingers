#!/usr/bin/env bash
# Builds the web versions of the Motion and Intelligence section backgrounds from the
# untouched masters in media-source/backgrounds/ (never modified):
#
#   Intelligence-hero.mp4  (H.264 + AAC, 1920×1080, 25 fps, 445 frames)
#     → public/media/backgrounds/intelligence-loop-1080.mp4   (desktop/tablet, 1920×1080)
#     → public/media/backgrounds/intelligence-loop-720.mp4    (phones, 720×900 portrait crop)
#     → src/media/backgrounds/intelligence-poster.jpg, intelligence-poster-mobile.jpg
#
#   motion-hero.mp4        (H.264 + AAC, 1276×718, 25 fps, 1976 frames)
#     → public/media/backgrounds/motion-loop-720p.mp4         (desktop/tablet, 1280×720 — the master's own resolution)
#     → public/media/backgrounds/motion-loop-mobile.mp4       (phones, 576×720 portrait crop)
#     → src/media/backgrounds/motion-poster.jpg, motion-poster-mobile.jpg
#
# Why each step exists (see docs/CONTENT.md → "Section videos"):
#   * Trim (frames A..B are kept):
#       Intelligence: frames 0–8 are a fade-up from a darker exposure; the clip ends on a steady shot.
#       Motion: frames 0–220 hold two black frames, the "Stories from …" title card, a black dip,
#       a fade-in and a white flash transition; after frame 1780 the film fades to black and
#       ends on a black-and-white outro. Only the first 29 s of the colour footage are used
#       (B = the frame before the cut at 38.04 s): the full 62 s was 8–15 MB, too heavy for
#       a section background. Raise B (up to 1780) to use more of the film.
#   * Motion starts on the couple's smiling close-up (frame R) rather than on the soft-focus
#     grass shot at A: frames R..B play first, then A..R-1, so the loop restart (R-1 → R) is
#     the film's own original cut and the only added cut (B → A) is a cut between two shots.
#   * Loop: both are edited films that already cut every 2–4 s, so the restart is a clean cut
#     between two full-colour shots (no fade, no crossfade ghosting).
#   * Phones get a portrait crop at the master's native sharpness (centre of the action).
#   * No audio. One keyframe, no scene-cut keyframes, mbtree=0: same reasons as
#     scripts/encode-hero.sh (no quality "tick", no sharpness "pop" at the loop restart).
#   * Posters = frame 0 of each encode (BT.709 limited range → full-range RGB), so the
#     poster-to-video handover is pixel-identical.
#
# Usage: scripts/encode-section-backgrounds.sh   (requires ffmpeg with libx264)
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=media-source/backgrounds
OUT=public/media/backgrounds
POSTERS=src/media/backgrounds
FPS=25

X264=(-c:v libx264 -preset slow -tune film -profile:v high -pix_fmt yuv420p -r "$FPS"
  -g 5000 -keyint_min 5000 -x264-params scenecut=0:mbtree=0
  -an -movflags +faststart
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv)

# encode MASTER A B FILTER CRF LEVEL OUTPUT
encode() {
  ffmpeg -hide_banner -loglevel error -y -i "$1" \
    -vf "trim=start_frame=$2:end_frame=$(($3 + 1)),setpts=PTS-STARTPTS,$4,format=yuv420p" \
    "${X264[@]}" -crf "$5" -level "$6" "$7"
}

poster() { # $1 = video, $2 = jpg
  ffmpeg -hide_banner -loglevel error -y -i "$1" \
    -vf "select=eq(n\,0),scale=in_color_matrix=bt709:in_range=tv:out_range=pc,format=rgb24" \
    -frames:v 1 -q:v 1 "$2"
}

# Intelligence: frames 9..444 (17.4 s).
encode "$SRC/Intelligence-hero.mp4" 9 444 "null" 25 4.1 "$OUT/intelligence-loop-1080.mp4"
encode "$SRC/Intelligence-hero.mp4" 9 444 "crop=864:1080:328:0,scale=720:900:flags=lanczos" 25 3.1 "$OUT/intelligence-loop-720.mp4"
poster "$OUT/intelligence-loop-1080.mp4" "$POSTERS/intelligence-poster.jpg"
poster "$OUT/intelligence-loop-720.mp4" "$POSTERS/intelligence-poster-mobile.jpg"

# Motion: frames 221..950 (29.2 s), played from R = 887.
motion() { # FILTER CRF OUTPUT
  ffmpeg -hide_banner -loglevel error -y -i "$SRC/motion-hero.mp4" -filter_complex \
    "[0:v]settb=1/$FPS,split[x][y];[x]trim=start_frame=887:end_frame=951,setpts=PTS-STARTPTS[a];\
[y]trim=start_frame=221:end_frame=887,setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0,$1,format=yuv420p[v]" \
    -map "[v]" "${X264[@]}" -crf "$2" -level 3.1 "$3"
}
motion "scale=1280:720:flags=lanczos" 27 "$OUT/motion-loop-720p.mp4"
motion "crop=574:718:351:0,scale=576:720:flags=lanczos" 28 "$OUT/motion-loop-mobile.mp4"
poster "$OUT/motion-loop-720p.mp4" "$POSTERS/motion-poster.jpg"
poster "$OUT/motion-loop-mobile.mp4" "$POSTERS/motion-poster-mobile.jpg"

ls -la "$OUT"/intelligence-loop-*.mp4 "$OUT"/motion-loop-*.mp4 "$POSTERS"/intelligence-poster*.jpg "$POSTERS"/motion-poster*.jpg
