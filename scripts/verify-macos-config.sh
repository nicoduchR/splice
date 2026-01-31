#!/bin/bash
# Quick verification script for macOS build configuration
# Story 1.8 - macOS Universal Binary Build & Code Signing

set -e

echo "🔍 Verifying macOS Universal Binary configuration..."
echo ""

ERRORS=0
WARNINGS=0

# Navigate to project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

# Check Tauri config
echo "📋 Checking tauri.conf.json..."
CONFIG_FILE="apps/desktop/src-tauri/tauri.conf.json"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ ERROR: tauri.conf.json not found"
  ((ERRORS++))
else
  # Check product name
  if grep -q '"productName": "Splice"' "$CONFIG_FILE"; then
    echo "  ✅ Product name: Splice"
  else
    echo "  ❌ ERROR: Product name not set to 'Splice'"
    ((ERRORS++))
  fi

  # Check bundle identifier
  if grep -q '"identifier": "com.splice.app"' "$CONFIG_FILE"; then
    echo "  ✅ Bundle identifier: com.splice.app"
  else
    echo "  ❌ ERROR: Bundle identifier incorrect"
    ((ERRORS++))
  fi

  # Check macOS minimum version
  if grep -q '"minimumSystemVersion": "13.0"' "$CONFIG_FILE"; then
    echo "  ✅ Minimum macOS version: 13.0"
  else
    echo "  ❌ ERROR: minimumSystemVersion not set to 13.0"
    ((ERRORS++))
  fi

  # Check externalBin configuration (Tauri appends target triple automatically)
  if grep -q 'binaries/ffmpeg' "$CONFIG_FILE" && \
     grep -q 'binaries/ffprobe' "$CONFIG_FILE"; then
    echo "  ✅ External binaries configured (Tauri will append target triple)"
  else
    echo "  ❌ ERROR: External binaries not configured correctly"
    ((ERRORS++))
  fi

  # Check DMG target
  if grep -q '"dmg"' "$CONFIG_FILE"; then
    echo "  ✅ DMG bundle target configured"
  else
    echo "  ⚠️  WARNING: DMG target not found"
    ((WARNINGS++))
  fi
fi

echo ""
echo "📦 Checking FFmpeg binaries..."
BINARIES_DIR="apps/desktop/src-tauri/binaries"

# Check arm64 FFmpeg
if [ -f "$BINARIES_DIR/ffmpeg-aarch64-apple-darwin" ]; then
  echo "  ✅ ffmpeg-aarch64-apple-darwin found"
  if [ -x "$BINARIES_DIR/ffmpeg-aarch64-apple-darwin" ]; then
    echo "     ✅ Executable permission set"
  else
    echo "     ❌ ERROR: Not executable"
    ((ERRORS++))
  fi

  # Check architecture
  ARCH=$(lipo -info "$BINARIES_DIR/ffmpeg-aarch64-apple-darwin" 2>/dev/null | grep -o "arm64\|x86_64")
  if [ "$ARCH" = "arm64" ]; then
    echo "     ✅ Architecture: arm64"
  else
    echo "     ⚠️  WARNING: Architecture is $ARCH (expected arm64)"
    ((WARNINGS++))
  fi
else
  echo "  ❌ ERROR: ffmpeg-aarch64-apple-darwin not found"
  ((ERRORS++))
fi

# Check arm64 FFprobe
if [ -f "$BINARIES_DIR/ffprobe-aarch64-apple-darwin" ]; then
  echo "  ✅ ffprobe-aarch64-apple-darwin found"
  if [ -x "$BINARIES_DIR/ffprobe-aarch64-apple-darwin" ]; then
    echo "     ✅ Executable permission set"
  else
    echo "     ❌ ERROR: Not executable"
    ((ERRORS++))
  fi
else
  echo "  ❌ ERROR: ffprobe-aarch64-apple-darwin not found"
  ((ERRORS++))
fi

# Check x86_64 FFmpeg
if [ -f "$BINARIES_DIR/ffmpeg-x86_64-apple-darwin" ]; then
  echo "  ✅ ffmpeg-x86_64-apple-darwin found"
  if [ -x "$BINARIES_DIR/ffmpeg-x86_64-apple-darwin" ]; then
    echo "     ✅ Executable permission set"
  else
    echo "     ❌ ERROR: Not executable"
    ((ERRORS++))
  fi

  # Check architecture
  ARCH=$(lipo -info "$BINARIES_DIR/ffmpeg-x86_64-apple-darwin" 2>/dev/null | grep -o "arm64\|x86_64")
  if [ "$ARCH" = "x86_64" ]; then
    echo "     ✅ Architecture: x86_64"
  else
    echo "     ⚠️  WARNING: Architecture is $ARCH (expected x86_64)"
    ((WARNINGS++))
  fi
else
  echo "  ❌ ERROR: ffmpeg-x86_64-apple-darwin not found"
  ((ERRORS++))
fi

# Check x86_64 FFprobe
if [ -f "$BINARIES_DIR/ffprobe-x86_64-apple-darwin" ]; then
  echo "  ✅ ffprobe-x86_64-apple-darwin found"
  if [ -x "$BINARIES_DIR/ffprobe-x86_64-apple-darwin" ]; then
    echo "     ✅ Executable permission set"
  else
    echo "     ❌ ERROR: Not executable"
    ((ERRORS++))
  fi
else
  echo "  ❌ ERROR: ffprobe-x86_64-apple-darwin not found"
  ((ERRORS++))
fi

echo ""
echo "🔧 Checking build scripts..."

if [ -x "scripts/bundle-ffmpeg.sh" ]; then
  echo "  ✅ scripts/bundle-ffmpeg.sh (executable)"
else
  echo "  ❌ ERROR: scripts/bundle-ffmpeg.sh not found or not executable"
  ((ERRORS++))
fi

if [ -x "scripts/code-sign.sh" ]; then
  echo "  ✅ scripts/code-sign.sh (executable)"
else
  echo "  ❌ ERROR: scripts/code-sign.sh not found or not executable"
  ((ERRORS++))
fi

if [ -x "scripts/build-macos.sh" ]; then
  echo "  ✅ scripts/build-macos.sh (executable)"
else
  echo "  ❌ ERROR: scripts/build-macos.sh not found or not executable"
  ((ERRORS++))
fi

echo ""
echo "⚙️  Checking CI/CD workflow..."

if [ -f ".github/workflows/build-macos.yml" ]; then
  echo "  ✅ .github/workflows/build-macos.yml found"
else
  echo "  ❌ ERROR: GitHub Actions workflow not found"
  ((ERRORS++))
fi

echo ""
echo "📚 Checking documentation..."

if [ -f "docs/MACOS_BUILD_CODESIGN.md" ]; then
  echo "  ✅ docs/MACOS_BUILD_CODESIGN.md found"
else
  echo "  ⚠️  WARNING: Build documentation not found"
  ((WARNINGS++))
fi

if [ -f "$BINARIES_DIR/README.md" ]; then
  echo "  ✅ Binaries README.md found"
else
  echo "  ⚠️  WARNING: Binaries README not found"
  ((WARNINGS++))
fi

echo ""
echo "🎯 Checking icon files..."

ICON_FILE="apps/desktop/src-tauri/icons/icon.icns"
if [ -f "$ICON_FILE" ]; then
  echo "  ✅ macOS icon (icon.icns) found"
else
  echo "  ❌ ERROR: icon.icns not found"
  ((ERRORS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "✅ All checks passed!"
  echo ""
  echo "🚀 Ready to build macOS Universal Binary:"
  echo "   ./scripts/build-macos.sh"
  echo ""
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo "⚠️  Configuration OK with $WARNINGS warnings"
  echo ""
  echo "🚀 Ready to build, but review warnings above"
  echo ""
  exit 0
else
  echo "❌ Configuration has $ERRORS errors and $WARNINGS warnings"
  echo ""
  echo "Please fix errors before building"
  echo ""
  exit 1
fi
