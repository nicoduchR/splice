#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BINARY_NAME="fluidaudio-sidecar"
OUTPUT_DIR="$SCRIPT_DIR/../../binaries"

echo "=== Building FluidAudio Sidecar ==="
echo "Source: $SCRIPT_DIR"
echo "Output: $OUTPUT_DIR"

cd "$SCRIPT_DIR"

# Build release binary for arm64 (Apple Silicon)
echo "Building for arm64..."
swift build -c release --arch arm64

# Find the built binary
BUILD_DIR=$(swift build -c release --arch arm64 --show-bin-path)
BUILT_BINARY="$BUILD_DIR/$BINARY_NAME"

if [ ! -f "$BUILT_BINARY" ]; then
    echo "ERROR: Built binary not found at $BUILT_BINARY"
    exit 1
fi

# Copy to binaries directory with Tauri sidecar naming convention
# Tauri expects: <name>-<target-triple>
mkdir -p "$OUTPUT_DIR"

TARGET_BINARY="$OUTPUT_DIR/${BINARY_NAME}-aarch64-apple-darwin"
cp "$BUILT_BINARY" "$TARGET_BINARY"
chmod +x "$TARGET_BINARY"

echo "=== Build complete ==="
echo "Binary: $TARGET_BINARY"
echo "Size: $(du -h "$TARGET_BINARY" | cut -f1)"
