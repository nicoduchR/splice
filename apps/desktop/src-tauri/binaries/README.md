# FFmpeg Binaries

Ce dossier contient les binaires FFmpeg et FFprobe nécessaires pour le sidecar Tauri.

## Installation automatique (Recommandé)

Pour télécharger et installer tous les binaires macOS nécessaires, utilisez le script:

```bash
# Depuis la racine du projet
./scripts/bundle-ffmpeg.sh
```

Ce script télécharge automatiquement les binaries statiques pour:
- Apple Silicon (arm64/aarch64)
- Intel (x86_64)

## Installation manuelle

### macOS (Apple Silicon + Intel)

Les binaires sont téléchargés depuis [eugeneware/ffmpeg-static](https://github.com/eugeneware/ffmpeg-static) qui fournit des builds statiques pour les deux architectures.

```bash
# Apple Silicon (arm64)
curl -L "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-darwin-arm64.gz" -o ffmpeg-arm64.gz
curl -L "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffprobe-darwin-arm64.gz" -o ffprobe-arm64.gz

gunzip ffmpeg-arm64.gz
gunzip ffprobe-arm64.gz

mv ffmpeg-arm64 ffmpeg-aarch64-apple-darwin
mv ffprobe-arm64 ffprobe-aarch64-apple-darwin

# Intel (x86_64)
curl -L "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-darwin-x64.gz" -o ffmpeg-x64.gz
curl -L "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffprobe-darwin-x64.gz" -o ffprobe-x64.gz

gunzip ffmpeg-x64.gz
gunzip ffprobe-x64.gz

mv ffmpeg-x64 ffmpeg-x86_64-apple-darwin
mv ffprobe-x64 ffprobe-x86_64-apple-darwin

# Rendre exécutable
chmod +x ffmpeg-* ffprobe-*
```

### Windows (x86_64)

À implémenter dans Story 1.9.

```bash
# Télécharger depuis https://github.com/BtbN/FFmpeg-Builds/releases
# Dernière version: ffmpeg-master-latest-win64-gpl.zip

# Extraire et copier
# ffmpeg.exe -> ffmpeg-x86_64-pc-windows-msvc.exe
# ffprobe.exe -> ffprobe-x86_64-pc-windows-msvc.exe
```

## Fichiers requis

### macOS (Story 1.8)
- ✅ `ffmpeg-aarch64-apple-darwin` (macOS Apple Silicon)
- ✅ `ffprobe-aarch64-apple-darwin` (macOS Apple Silicon)
- ✅ `ffmpeg-x86_64-apple-darwin` (macOS Intel)
- ✅ `ffprobe-x86_64-apple-darwin` (macOS Intel)

### Windows (Story 1.9 - À venir)
- ❌ `ffmpeg-x86_64-pc-windows-msvc.exe` (Windows x64)
- ❌ `ffprobe-x86_64-pc-windows-msvc.exe` (Windows x64)

## Vérification

Pour vérifier les architectures des binaires installés:

```bash
lipo -info ffmpeg-aarch64-apple-darwin
# Output attendu: Non-fat file: ffmpeg-aarch64-apple-darwin is architecture: arm64

lipo -info ffmpeg-x86_64-apple-darwin
# Output attendu: Non-fat file: ffmpeg-x86_64-apple-darwin is architecture: x86_64
```

Pour tester l'exécution:

```bash
./ffmpeg-aarch64-apple-darwin -version | head -1
./ffmpeg-x86_64-apple-darwin -version | head -1
```

## Note

Ces binaries sont des builds statiques qui ne nécessitent aucune dépendance système. Ils seront automatiquement bundlés dans l'application lors du build Tauri via la configuration `externalBin` dans `tauri.conf.json`.

Tauri détecte automatiquement l'architecture au runtime et charge le binary approprié.
