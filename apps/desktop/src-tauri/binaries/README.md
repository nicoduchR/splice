# FFmpeg Binaries

Ce dossier contient les binaires FFmpeg et FFprobe nécessaires pour le sidecar Tauri.

## Téléchargement requis

### macOS (Universal Binary)
```bash
# Télécharger depuis evermeet.cx
curl -L https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip -o ffmpeg.zip
curl -L https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip -o ffprobe.zip

# Extraire
unzip ffmpeg.zip
unzip ffprobe.zip

# Copier avec le bon nom (ARM64/Apple Silicon)
cp ffmpeg ffmpeg-aarch64-apple-darwin
cp ffprobe ffprobe-aarch64-apple-darwin

# Rendre exécutable
chmod +x ffmpeg-aarch64-apple-darwin ffprobe-aarch64-apple-darwin
```

### Windows (x86_64)
```bash
# Télécharger depuis https://github.com/BtbN/FFmpeg-Builds/releases
# Dernière version: ffmpeg-master-latest-win64-gpl.zip

# Extraire et copier
# ffmpeg.exe -> ffmpeg-x86_64-pc-windows-msvc.exe
# ffprobe.exe -> ffprobe-x86_64-pc-windows-msvc.exe
```

## Fichiers attendus

- `ffmpeg-aarch64-apple-darwin` (macOS ARM64/Apple Silicon) ✅ Présent
- `ffprobe-aarch64-apple-darwin` (macOS ARM64/Apple Silicon) ✅ Présent
- `ffmpeg-x86_64-pc-windows-msvc.exe` (Windows x64) ❌ À télécharger
- `ffprobe-x86_64-pc-windows-msvc.exe` (Windows x64) ❌ À télécharger

**Note:** Pour supporter les Macs Intel (x86_64), télécharger aussi:
- `ffmpeg-x86_64-apple-darwin` (macOS Intel)
- `ffprobe-x86_64-apple-darwin` (macOS Intel)

## Note

Ces binaires sont des builds statiques qui ne nécessitent aucune dépendance système. Ils seront automatiquement bundlés dans l'application lors du build Tauri.
