#!/bin/bash
# Code signing script for macOS and Windows
# Story 1.8 - macOS Universal Binary Build & Code Signing
# Story 1.9 - Windows Installer Build & Code Signing (future)

set -e

PLATFORM=$1  # "macos" or "windows"

if [ -z "$PLATFORM" ]; then
  echo "❌ Error: Platform argument required"
  echo "Usage: $0 <macos|windows>"
  exit 1
fi

if [ "$PLATFORM" = "macos" ]; then
  echo "🔐 Signing macOS app..."

  # Import certificate into temporary keychain (CI/CD only)
  if [ -n "$APPLE_CERTIFICATE" ]; then
    echo "📦 Importing Apple Developer certificate..."
    echo "$APPLE_CERTIFICATE" | base64 --decode > certificate.p12

    # Create temporary keychain
    security create-keychain -p actions temp.keychain
    security default-keychain -s temp.keychain
    security unlock-keychain -p actions temp.keychain

    # Import certificate
    security import certificate.p12 -k temp.keychain -P "$APPLE_CERTIFICATE_PASSWORD" -T /usr/bin/codesign

    # Allow codesign to access the certificate
    security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k actions temp.keychain

    # Clean up certificate file
    rm certificate.p12
    echo "✅ Certificate imported"
  else
    echo "ℹ️  No APPLE_CERTIFICATE env var - using local keychain"
  fi

  # Find app bundle
  APP_PATH="apps/desktop/src-tauri/target/release/bundle/macos/Splice.app"

  if [ ! -d "$APP_PATH" ]; then
    echo "❌ Error: App bundle not found at $APP_PATH"
    echo "Please build the app first with: pnpm tauri build"
    exit 1
  fi

  echo "🔏 Signing app bundle: $APP_PATH"

  # Sign the app bundle
  codesign --force --deep --sign "Developer ID Application" "$APP_PATH"

  echo "✅ Verifying signature..."
  # Verify signature
  codesign --verify --deep --strict "$APP_PATH"

  if [ $? -eq 0 ]; then
    echo "✅ App signed successfully"

    # Display signature info
    echo ""
    echo "📋 Signature details:"
    codesign -dv --verbose=4 "$APP_PATH" 2>&1 | head -20
  else
    echo "❌ Signature verification failed"
    exit 1
  fi

elif [ "$PLATFORM" = "windows" ]; then
  echo "🔐 Signing Windows app..."
  echo "⏭️  Windows signing not implemented yet (Story 1.9)"
  echo ""
  echo "Future implementation will use:"
  echo "  - signtool.exe for code signing"
  echo "  - Commercial code signing certificate (Sectigo/DigiCert)"
  echo "  - Windows Installer (.msi) signing"
  exit 0

else
  echo "❌ Error: Invalid platform '$PLATFORM'"
  echo "Usage: $0 <macos|windows>"
  exit 1
fi
