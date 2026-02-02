# ⚠️ BINAIRES WINDOWS MANQUANTS - ACTION REQUISE

## Status
❌ **Les binaires Windows ne sont PAS présents dans ce dossier.**

## Impact
- ❌ L'application ne fonctionnera PAS sur Windows
- ❌ Les builds Windows vont échouer
- ❌ Story 1.5 incomplète

## Action requise

### Télécharger FFmpeg pour Windows x64

1. Aller sur https://github.com/BtbN/FFmpeg-Builds/releases
2. Télécharger **ffmpeg-master-latest-win64-gpl.zip**
3. Extraire le fichier ZIP
4. Copier les binaires avec les bons noms:

```bash
# Depuis le dossier extrait ffmpeg-master-latest-win64-gpl/bin/
cp bin/ffmpeg.exe /path/to/splice/apps/desktop/src-tauri/binaries/ffmpeg-x86_64-pc-windows-msvc.exe
cp bin/ffprobe.exe /path/to/splice/apps/desktop/src-tauri/binaries/ffprobe-x86_64-pc-windows-msvc.exe
```

### Vérifier après téléchargement

```bash
ls -la binaries/
# Devrait afficher:
# ffmpeg-aarch64-apple-darwin ✅
# ffprobe-aarch64-apple-darwin ✅
# ffmpeg-x86_64-pc-windows-msvc.exe ✅
# ffprobe-x86_64-pc-windows-msvc.exe ✅
```

## Référence
- Story 1.5 Task: "Télécharger binaires FFmpeg statiques pour Windows (x86_64)"
- AC: FFmpeg bundlé avec l'app et accessible (NFR33)

## Taille attendue
- ffmpeg.exe: ~130 MB
- ffprobe.exe: ~130 MB
