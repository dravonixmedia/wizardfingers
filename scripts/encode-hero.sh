#!/usr/bin/env bash
# Builds the web versions of the opening hero video from the untouched master.
#
#   media-source/backgrounds/hero.mp4  (HEVC Main 10, 1920×1080, 24 fps, 241 frames — never modified)
#     → public/media/backgrounds/hero-loop-1080.mp4   (H.264, desktop)
#     → public/media/backgrounds/hero-loop-720.mp4    (H.264, phones)
#     → src/media/backgrounds/hero-poster.jpg         (exact first frame of the 1080p encode)
#
# Why each step exists (see docs/CONTENT.md → "Hero video"):
#   * Trim: the master's first frames contain an abrupt settle (frame 0→1 is 3× the normal
#     motion) and its last frame does not match its first (a 2 px jump at every loop).
#     Frames A..B are kept.
#   * Crossfade loop: the final L frames dissolve into the L frames just before the loop
#     start, so the last frame flows straight into the first (seamless `loop`).
#   * One keyframe, no scene-cut keyframes: periodic keyframes caused a visible quality
#     "tick" every 2 s.
#   * mbtree=0: x264's MB-tree lowers quality of the last frames (nothing references them),
#     which made the loop restart visibly sharper ("pop").
#   * Poster = frame 0 of the final encode, converted with the video's own BT.709 /
#     limited-range settings, so the poster-to-video handover is pixel-identical.
#
# Usage: scripts/encode-hero.sh   (requires ffmpeg with libx264)
set -euo pipefail
cd "$(dirname "$0")/.."

MASTER=media-source/backgrounds/hero.mp4
OUT=public/media/backgrounds
A=4    # first kept frame
B=218  # last kept frame
L=25   # crossfade length in frames (≈1 s at 24 fps)

FPS=24
MAIN=$((B - A + 1 - L))
DUR=$(awk "BEGIN { print $L / $FPS }")
OFFSET=$(awk "BEGIN { print ($MAIN - $L) / $FPS }")

GRAPH="[0:v]trim=start_frame=$A:end_frame=$((B + 1)),setpts=PTS-STARTPTS,settb=1/$FPS,split[x][y];\
[y]trim=end_frame=$L,setpts=PTS-STARTPTS[head];\
[x]trim=start_frame=$L,setpts=PTS-STARTPTS[main];\
[main][head]xfade=transition=fade:duration=$DUR:offset=$OFFSET"

X264=(-c:v libx264 -preset slow -tune film -profile:v high -pix_fmt yuv420p -r "$FPS"
  -g 1000 -keyint_min 1000 -x264-params scenecut=0:mbtree=0
  -an -movflags +faststart
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv)

ffmpeg -hide_banner -loglevel error -y -i "$MASTER" \
  -filter_complex "$GRAPH,format=yuv420p[v]" -map "[v]" "${X264[@]}" -crf 20 -level 4.1 \
  "$OUT/hero-loop-1080.mp4"

ffmpeg -hide_banner -loglevel error -y -i "$MASTER" \
  -filter_complex "$GRAPH,scale=1280:720:flags=lanczos,format=yuv420p[v]" -map "[v]" "${X264[@]}" -crf 20 -level 3.1 \
  "$OUT/hero-loop-720.mp4"

# Poster: exact first frame of the desktop encode, BT.709 limited range → full-range RGB.
ffmpeg -hide_banner -loglevel error -y -i "$OUT/hero-loop-1080.mp4" \
  -vf "select=eq(n\,0),scale=in_color_matrix=bt709:in_range=tv:out_range=pc,format=rgb24" \
  -frames:v 1 -q:v 1 src/media/backgrounds/hero-poster.jpg

echo "Encoded $MAIN frames ($(awk "BEGIN { printf \"%.2f\", $MAIN / $FPS }") s):"
ls -la "$OUT"/hero-loop-*.mp4 src/media/backgrounds/hero-poster.jpg
