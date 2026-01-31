# Test Assets - Fichiers vidéo pour tests

Ce dossier contient des fichiers vidéo de test pour valider la fonctionnalité de validation FFmpeg.

## Fichiers nécessaires

Pour exécuter les tests complets, vous devez créer les fichiers vidéo suivants :

### 1. sample-h264.mp4 (Codec supporté)
Vidéo H.264 MP4 valide pour tester l'import réussi.

**Créer avec FFmpeg :**
```bash
ffmpeg -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 \
  -c:v libx264 -pix_fmt yuv420p \
  sample-h264.mp4
```

### 2. sample-h265.mov (Codec supporté)
Vidéo H.265/HEVC MOV valide.

**Créer avec FFmpeg :**
```bash
ffmpeg -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 \
  -c:v libx265 -pix_fmt yuv420p \
  sample-h265.mov
```

### 3. sample-vp9.webm (Codec non supporté)
Vidéo VP9 WebM pour tester le rejet de codec non supporté.

**Créer avec FFmpeg :**
```bash
ffmpeg -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 \
  -c:v libvpx-vp9 -pix_fmt yuv420p \
  sample-vp9.webm
```

### 4. sample-av1.mp4 (Codec non supporté)
Vidéo AV1 MP4 pour tester le rejet de codec non supporté.

**Créer avec FFmpeg :**
```bash
ffmpeg -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 \
  -c:v libaom-av1 -pix_fmt yuv420p \
  sample-av1.mp4
```

### 5. corrupted.mp4 (Fichier corrompu)
Fichier MP4 corrompu pour tester la détection d'erreur.

**Créer un fichier corrompu :**
```bash
# Créer un fichier valide
ffmpeg -f lavfi -i testsrc=duration=2:size=640x480:rate=30 \
  -c:v libx264 -pix_fmt yuv420p \
  temp.mp4

# Corrompre le fichier (supprimer des octets au milieu)
dd if=temp.mp4 of=corrupted.mp4 bs=1024 count=10
rm temp.mp4
```

## Script de génération automatique

Utilisez ce script bash pour générer tous les fichiers de test :

```bash
#!/bin/bash
# generate-test-videos.sh

echo "Génération des fichiers vidéo de test..."

# H.264 MP4
ffmpeg -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 \
  -c:v libx264 -pix_fmt yuv420p -y \
  sample-h264.mp4

# H.265 MOV
ffmpeg -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 \
  -c:v libx265 -pix_fmt yuv420p -y \
  sample-h265.mov

# VP9 WebM
ffmpeg -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 \
  -c:v libvpx-vp9 -pix_fmt yuv420p -y \
  sample-vp9.webm

# AV1 MP4 (si disponible)
if ffmpeg -codecs 2>&1 | grep -q "libaom-av1"; then
  ffmpeg -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 \
    -c:v libaom-av1 -pix_fmt yuv420p -y \
    sample-av1.mp4
fi

# Fichier corrompu
ffmpeg -f lavfi -i testsrc=duration=2:size=640x480:rate=30 \
  -c:v libx264 -pix_fmt yuv420p -y \
  temp.mp4
dd if=temp.mp4 of=corrupted.mp4 bs=1024 count=10 2>/dev/null
rm temp.mp4

echo "✅ Fichiers vidéo de test générés avec succès !"
ls -lh *.mp4 *.mov *.webm 2>/dev/null
```

## Exécuter les tests

Une fois les fichiers créés :

```bash
# Tests Rust
cd apps/desktop/src-tauri
cargo test --bin splice

# Tests frontend
cd apps/desktop
pnpm test
```

## Note

Ces fichiers de test sont générés localement et ne doivent **PAS** être committés dans Git (ajoutés au .gitignore). Chaque développeur doit les générer localement en exécutant le script de génération.
