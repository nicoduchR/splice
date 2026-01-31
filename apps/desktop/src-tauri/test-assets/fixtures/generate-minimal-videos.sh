#!/bin/bash
# Generate minimal test video fixtures for FFmpeg validation tests
# These videos are TINY (<500KB each) but valid for codec testing

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🎬 Generating minimal test video fixtures..."
echo ""

# Check if FFmpeg is available
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ERROR: FFmpeg not found. Please install FFmpeg first."
    echo "   macOS: brew install ffmpeg"
    echo "   Windows: Download from https://ffmpeg.org/"
    exit 1
fi

echo "✅ FFmpeg found: $(ffmpeg -version | head -n1)"
echo ""

# Clean up old fixtures
echo "🧹 Cleaning old fixtures..."
rm -f sample-h264.mp4 sample-h265.mov sample-h265.mp4 sample-vp9.webm corrupted.mp4
echo ""

# 1. H.264 MP4 - Valid codec (2 seconds, 320x240, ~150KB)
echo "📹 Generating H.264 MP4 (valid codec)..."
ffmpeg -hide_banner -loglevel error \
  -f lavfi -i testsrc=duration=2:size=320x240:rate=30 \
  -c:v libx264 -preset ultrafast -crf 40 -pix_fmt yuv420p \
  -movflags +faststart \
  sample-h264.mp4

SIZE_H264=$(du -h sample-h264.mp4 | cut -f1)
echo "   ✅ Created: sample-h264.mp4 ($SIZE_H264)"
echo ""

# 2. H.265/HEVC MOV - Valid codec (1 second, 320x240, ~100KB)
echo "📹 Generating H.265 MOV (valid codec)..."
ffmpeg -hide_banner -loglevel error \
  -f lavfi -i testsrc=duration=1:size=320x240:rate=30 \
  -c:v libx265 -preset ultrafast -crf 40 -pix_fmt yuv420p \
  -tag:v hvc1 \
  sample-h265.mov

SIZE_H265_MOV=$(du -h sample-h265.mov | cut -f1)
echo "   ✅ Created: sample-h265.mov ($SIZE_H265_MOV)"
echo ""

# 3. H.265/HEVC MP4 - Valid codec (1 second, 320x240, ~100KB)
echo "📹 Generating H.265 MP4 (valid codec)..."
ffmpeg -hide_banner -loglevel error \
  -f lavfi -i testsrc=duration=1:size=320x240:rate=30 \
  -c:v libx265 -preset ultrafast -crf 40 -pix_fmt yuv420p \
  -tag:v hvc1 -movflags +faststart \
  sample-h265.mp4

SIZE_H265_MP4=$(du -h sample-h265.mp4 | cut -f1)
echo "   ✅ Created: sample-h265.mp4 ($SIZE_H265_MP4)"
echo ""

# 4. VP9 WebM - UNSUPPORTED codec (1 second, 320x240, ~50KB)
echo "📹 Generating VP9 WebM (unsupported codec - should be rejected)..."
ffmpeg -hide_banner -loglevel error \
  -f lavfi -i testsrc=duration=1:size=320x240:rate=30 \
  -c:v libvpx-vp9 -b:v 100k \
  sample-vp9.webm

SIZE_VP9=$(du -h sample-vp9.webm | cut -f1)
echo "   ✅ Created: sample-vp9.webm ($SIZE_VP9)"
echo ""

# 5. Corrupted MP4 - Invalid file (should trigger VideoCorrupted error)
echo "📹 Generating corrupted.mp4 (fake data - should be rejected)..."
echo "FAKE VIDEO FILE - NOT A REAL MP4 - THIS WILL TRIGGER CORRUPTED ERROR" > corrupted.mp4
SIZE_CORRUPTED=$(du -h corrupted.mp4 | cut -f1)
echo "   ✅ Created: corrupted.mp4 ($SIZE_CORRUPTED)"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ALL TEST FIXTURES GENERATED SUCCESSFULLY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 File Summary:"
ls -lh sample-*.mp4 sample-*.mov sample-*.webm corrupted.mp4 2>/dev/null | awk '{print "   " $9 " - " $5}'
echo ""

TOTAL_SIZE=$(du -ch sample-*.mp4 sample-*.mov sample-*.webm corrupted.mp4 2>/dev/null | tail -n1 | cut -f1)
echo "📦 Total size: $TOTAL_SIZE"
echo ""
echo "🎯 These fixtures can be safely committed to Git (very small)."
echo "   Use them in Rust tests with: test-assets/fixtures/sample-h264.mp4"
echo ""
