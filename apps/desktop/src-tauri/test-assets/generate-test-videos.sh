#!/bin/bash
# Script de génération des fichiers vidéo de test pour Story 1.5

set -e

echo "📹 Génération des fichiers vidéo de test..."
echo ""

cd "$(dirname "$0")"

# Vérifier que FFmpeg est disponible
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ Erreur: FFmpeg n'est pas installé ou pas dans le PATH"
    echo "   Installez FFmpeg: brew install ffmpeg (macOS) ou apt-get install ffmpeg (Linux)"
    exit 1
fi

echo "✅ FFmpeg trouvé: $(ffmpeg -version | head -1)"
echo ""

# 1. H.264 MP4 (codec supporté)
echo "📦 Génération de sample-h264.mp4..."
ffmpeg -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 \
  -c:v libx264 -pix_fmt yuv420p -y \
  sample-h264.mp4 \
  -loglevel error

echo "   ✓ sample-h264.mp4 créé ($(du -h sample-h264.mp4 | cut -f1))"

# 2. H.265 MOV (codec supporté)
echo "📦 Génération de sample-h265.mov..."
ffmpeg -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 \
  -c:v libx265 -pix_fmt yuv420p -y \
  sample-h265.mov \
  -loglevel error

echo "   ✓ sample-h265.mov créé ($(du -h sample-h265.mov | cut -f1))"

# 3. VP9 WebM (codec non supporté)
echo "📦 Génération de sample-vp9.webm..."
ffmpeg -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 \
  -c:v libvpx-vp9 -pix_fmt yuv420p -y \
  sample-vp9.webm \
  -loglevel error

echo "   ✓ sample-vp9.webm créé ($(du -h sample-vp9.webm | cut -f1))"

# 4. AV1 MP4 (codec non supporté, si disponible)
if ffmpeg -codecs 2>&1 | grep -q "libaom-av1"; then
    echo "📦 Génération de sample-av1.mp4..."
    ffmpeg -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 \
      -c:v libaom-av1 -pix_fmt yuv420p -strict experimental -y \
      sample-av1.mp4 \
      -loglevel error
    echo "   ✓ sample-av1.mp4 créé ($(du -h sample-av1.mp4 | cut -f1))"
else
    echo "   ⚠️  AV1 encoder non disponible, sample-av1.mp4 ignoré"
fi

# 5. Fichier corrompu
echo "📦 Génération de corrupted.mp4..."
ffmpeg -f lavfi -i testsrc=duration=2:size=640x480:rate=30 \
  -c:v libx264 -pix_fmt yuv420p -y \
  temp.mp4 \
  -loglevel error

dd if=temp.mp4 of=corrupted.mp4 bs=1024 count=10 2>/dev/null
rm temp.mp4

echo "   ✓ corrupted.mp4 créé ($(du -h corrupted.mp4 | cut -f1))"

echo ""
echo "✅ Tous les fichiers vidéo de test ont été générés avec succès !"
echo ""
echo "📂 Fichiers créés :"
ls -lh *.mp4 *.mov *.webm 2>/dev/null | awk '{print "   - " $9 " (" $5 ")"}'

echo ""
echo "🧪 Pour exécuter les tests :"
echo "   cd ../.. && cargo test --bin splice"
echo ""
