#!/bin/bash
# Local macOS build script
# Story 1.8 - macOS Universal Binary Build & Code Signing

set -e

echo "🚀 Building Splice for macOS..."
echo ""

# Parse arguments
SIGN=false
NOTARIZE=false
TARGET="universal-apple-darwin"

while [[ $# -gt 0 ]]; do
  case $1 in
    --sign)
      SIGN=true
      shift
      ;;
    --notarize)
      NOTARIZE=true
      SIGN=true  # Notarization requires signing
      shift
      ;;
    --target)
      TARGET="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --sign              Sign the app bundle with Developer ID"
      echo "  --notarize          Sign and notarize the app (requires Apple Developer credentials)"
      echo "  --target TARGET     Build target (default: universal-apple-darwin)"
      echo "                      Options: universal-apple-darwin, aarch64-apple-darwin, x86_64-apple-darwin"
      echo "  --help              Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0                          # Build without signing"
      echo "  $0 --sign                   # Build and sign"
      echo "  $0 --notarize               # Build, sign, and notarize"
      echo "  $0 --target aarch64-apple-darwin  # Build for Apple Silicon only"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Navigate to project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

STEP=1

echo "📦 Step $STEP: Bundle FFmpeg binaries..."
./scripts/bundle-ffmpeg.sh

STEP=$((STEP + 1))
echo ""
echo "🔨 Step $STEP: Building Tauri app for target: $TARGET"
pnpm --filter @splice/desktop tauri build --target "$TARGET"

APP_PATH="apps/desktop/src-tauri/target/release/bundle/macos/Splice.app"
DMG_PATH="apps/desktop/src-tauri/target/release/bundle/dmg"

if [ ! -d "$APP_PATH" ]; then
  echo "❌ Error: App bundle not found at $APP_PATH"
  exit 1
fi

echo "✅ Build successful: $APP_PATH"

if [ "$SIGN" = true ]; then
  STEP=$((STEP + 1))
  echo ""
  echo "🔏 Step $STEP: Signing app bundle..."

  # Check if Developer ID certificate is available
  if ! security find-identity -v -p codesigning | grep -q "Developer ID Application"; then
    echo "❌ Error: No Developer ID Application certificate found in keychain"
    echo ""
    echo "To sign the app, you need:"
    echo "  1. Apple Developer Program membership"
    echo "  2. Developer ID Application certificate installed in Keychain"
    echo ""
    echo "See: https://developer.apple.com/developer-id/"
    exit 1
  fi

  codesign --force --deep --sign "Developer ID Application" "$APP_PATH"

  echo "✅ Verifying signature..."
  codesign --verify --deep --strict "$APP_PATH"

  if [ $? -eq 0 ]; then
    echo "✅ App signed successfully"
    echo ""
    echo "📋 Signature details:"
    codesign -dv --verbose=4 "$APP_PATH" 2>&1 | grep -E "Authority|TeamIdentifier|Identifier"
  else
    echo "❌ Signature verification failed"
    exit 1
  fi
fi

if [ "$NOTARIZE" = true ]; then
  STEP=$((STEP + 1))
  echo ""
  echo "📝 Step $STEP: Notarizing app with Apple..."

  # Check for required environment variables
  if [ -z "$APPLE_ID" ] || [ -z "$APPLE_APP_PASSWORD" ] || [ -z "$APPLE_TEAM_ID" ]; then
    echo "❌ Error: Notarization requires environment variables:"
    echo "  APPLE_ID              - Your Apple ID email"
    echo "  APPLE_APP_PASSWORD    - App-specific password"
    echo "  APPLE_TEAM_ID         - Your Apple Developer Team ID"
    echo ""
    echo "Generate an app-specific password at: https://appleid.apple.com/account/manage"
    echo ""
    echo "Example:"
    echo "  export APPLE_ID='your@email.com'"
    echo "  export APPLE_APP_PASSWORD='xxxx-xxxx-xxxx-xxxx'"
    echo "  export APPLE_TEAM_ID='ABCD123456'"
    echo "  $0 --notarize"
    exit 1
  fi

  # Create ZIP for notarization
  echo "📦 Creating ZIP for notarization..."
  cd "apps/desktop/src-tauri/target/release/bundle/macos"
  ditto -c -k --keepParent Splice.app Splice.zip

  # Submit for notarization
  echo "⏳ Submitting to Apple (this may take 5-15 minutes)..."
  xcrun notarytool submit Splice.zip \
    --apple-id "$APPLE_ID" \
    --password "$APPLE_APP_PASSWORD" \
    --team-id "$APPLE_TEAM_ID" \
    --wait

  if [ $? -eq 0 ]; then
    echo "✅ Notarization successful"

    # Staple notarization ticket
    echo "📎 Stapling notarization ticket..."
    xcrun stapler staple Splice.app

    # Verify notarization
    echo "✅ Verifying notarization..."
    spctl --assess --verbose Splice.app

    echo "✅ App notarized and stapled successfully"

    # Clean up ZIP
    rm Splice.zip
  else
    echo "❌ Notarization failed"
    echo "Check notarization logs with:"
    echo "  xcrun notarytool log <submission-id> --apple-id \$APPLE_ID --password \$APPLE_APP_PASSWORD --team-id \$APPLE_TEAM_ID"
    exit 1
  fi

  cd "$SCRIPT_DIR/.."
fi

echo ""
echo "✨ Build complete!"
echo ""
echo "📁 Output files:"
echo "  App bundle: $APP_PATH"
echo "  DMG installer: $DMG_PATH"
echo ""

if [ "$SIGN" = false ]; then
  echo "💡 Tip: Use --sign to code sign the app"
  echo "💡 Tip: Use --notarize to code sign and notarize the app"
fi

echo "🎉 Done!"
