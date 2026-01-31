#!/bin/bash
# Script de téléchargement des binaires FFmpeg/FFprobe pour macOS
# Story 1.5 - Video Format Validation

set -e

echo "📥 Téléchargement des binaires FFmpeg pour macOS..."

# Créer un dossier temporaire
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

echo "📦 Téléchargement de FFmpeg..."
curl -L "https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip" -o ffmpeg.zip

echo "📦 Téléchargement de FFprobe..."
curl -L "https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip" -o ffprobe.zip

echo "📂 Extraction des archives..."
unzip -q ffmpeg.zip
unzip -q ffprobe.zip

echo "📋 Vérification des binaires..."
./ffmpeg -version | head -1
./ffprobe -version | head -1

# Retourner au dossier binaries
BINARIES_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$BINARIES_DIR"

echo "🗑️  Suppression des anciens stubs..."
rm -f ffmpeg-aarch64-apple-darwin
rm -f ffprobe-aarch64-apple-darwin

echo "📥 Copie des nouveaux binaires..."
cp "$TEMP_DIR/ffmpeg" ffmpeg-aarch64-apple-darwin
cp "$TEMP_DIR/ffprobe" ffprobe-aarch64-apple-darwin

echo "🔐 Rendre les binaires exécutables..."
chmod +x ffmpeg-aarch64-apple-darwin
chmod +x ffprobe-aarch64-apple-darwin

echo "✅ Vérification finale..."
./ffmpeg-aarch64-apple-darwin -version | head -1
./ffprobe-aarch64-apple-darwin -version | head -1

echo ""
echo "✅ Binaires FFmpeg téléchargés et installés avec succès !"
echo "📁 Emplacement: $BINARIES_DIR"
echo ""
echo "🧹 Nettoyage..."
rm -rf "$TEMP_DIR"

echo "✨ Terminé ! Tu peux maintenant tester la validation vidéo."
