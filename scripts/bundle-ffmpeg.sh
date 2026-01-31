#!/bin/bash
# Script to bundle FFmpeg binaries for macOS Universal Binary
# Story 1.8 - macOS Universal Binary Build & Code Signing

set -e

echo "📦 Bundling FFmpeg binaries for macOS..."

# Navigate to binaries directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BINARIES_DIR="$SCRIPT_DIR/../apps/desktop/src-tauri/binaries"
cd "$BINARIES_DIR"

# Create temp directory
TEMP_DIR=$(mktemp -d)

echo "📥 Downloading FFmpeg static builds from eugeneware/ffmpeg-static..."

# Download Apple Silicon (arm64) binaries
echo "  → Downloading arm64 binaries..."
curl -L "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-darwin-arm64.gz" -o "$TEMP_DIR/ffmpeg-arm64.gz"
curl -L "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffprobe-darwin-arm64.gz" -o "$TEMP_DIR/ffprobe-arm64.gz"

# Download Intel (x86_64) binaries
echo "  → Downloading x64 binaries..."
curl -L "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-darwin-x64.gz" -o "$TEMP_DIR/ffmpeg-x64.gz"
curl -L "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffprobe-darwin-x64.gz" -o "$TEMP_DIR/ffprobe-x64.gz"

echo "📂 Extracting archives..."
cd "$TEMP_DIR"
gunzip ffmpeg-arm64.gz
gunzip ffprobe-arm64.gz
gunzip ffmpeg-x64.gz
gunzip ffprobe-x64.gz

echo "📋 Verifying architectures..."
lipo -info ffmpeg-arm64
lipo -info ffmpeg-x64

# Validate correct architectures
if ! lipo -info ffmpeg-arm64 | grep -q "arm64"; then
  echo "❌ Error: ffmpeg-arm64 is not arm64 architecture!"
  exit 1
fi

if ! lipo -info ffmpeg-x64 | grep -q "x86_64"; then
  echo "❌ Error: ffmpeg-x64 is not x86_64 architecture!"
  exit 1
fi

echo "✅ Architecture validation passed"

echo "🗑️  Removing old binaries..."
cd "$BINARIES_DIR"
rm -f ffmpeg-aarch64-apple-darwin ffprobe-aarch64-apple-darwin
rm -f ffmpeg-x86_64-apple-darwin ffprobe-x86_64-apple-darwin
rm -f ffmpeg-*-apple-darwin-* ffprobe-*-apple-darwin-*  # Remove any symlinks

echo "📥 Installing new binaries..."
mv "$TEMP_DIR/ffmpeg-arm64" ffmpeg-aarch64-apple-darwin
mv "$TEMP_DIR/ffprobe-arm64" ffprobe-aarch64-apple-darwin
mv "$TEMP_DIR/ffmpeg-x64" ffmpeg-x86_64-apple-darwin
mv "$TEMP_DIR/ffprobe-x64" ffprobe-x86_64-apple-darwin

echo "🔐 Making binaries executable..."
chmod +x ffmpeg-aarch64-apple-darwin ffprobe-aarch64-apple-darwin
chmod +x ffmpeg-x86_64-apple-darwin ffprobe-x86_64-apple-darwin

echo "✅ Verification..."
echo "  → arm64 FFmpeg:"
./ffmpeg-aarch64-apple-darwin -version | head -1
echo "  → x86_64 FFmpeg:"
./ffmpeg-x86_64-apple-darwin -version | head -1

echo ""
echo "🔨 Creating Universal Binaries (arm64 + x86_64)..."
lipo -create ffmpeg-aarch64-apple-darwin ffmpeg-x86_64-apple-darwin -output ffmpeg-universal-apple-darwin
lipo -create ffprobe-aarch64-apple-darwin ffprobe-x86_64-apple-darwin -output ffprobe-universal-apple-darwin
chmod +x ffmpeg-universal-apple-darwin ffprobe-universal-apple-darwin

echo "  → Verifying Universal Binaries:"
lipo -info ffmpeg-universal-apple-darwin
lipo -info ffprobe-universal-apple-darwin

echo ""
echo "✅ FFmpeg binaries bundled successfully!"
echo "📁 Location: $BINARIES_DIR"
echo ""
echo "📊 Files:"
ls -lh ffmpeg-* ffprobe-*

echo ""
echo "🧹 Cleaning up..."
rm -rf "$TEMP_DIR"

echo ""
echo "✨ Done! Ready for macOS Universal Binary build."
