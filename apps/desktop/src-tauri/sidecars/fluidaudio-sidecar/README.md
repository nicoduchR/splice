# FluidAudio Sidecar

Sidecar Swift CLI qui utilise [FluidAudio](https://github.com/FluidInference/FluidAudio) (Parakeet TDT CoreML) pour transcrire de l'audio sur le Apple Neural Engine. ~110x temps réel → 30 min de vidéo en ~15 secondes.

## Architecture

```
┌─────────────────────────────────────┐
│  Tauri App (Rust)                   │
│                                     │
│  1. FFmpeg: vidéo → WAV 16kHz mono  │
│  2. Spawn sidecar (ce binaire)      │
│  3. Parse JSON stdout               │
└──────────┬──────────────────────────┘
           │ process stdin/stdout/stderr
           ▼
┌─────────────────────────────────────┐
│  fluidaudio-sidecar (Swift)         │
│                                     │
│  AsrModels.downloadAndLoad(.v3)     │
│    → modèle CoreML (~500 MB, 1x)   │
│                                     │
│  AsrManager.transcribe(url)         │
│    → inference sur Neural Engine    │
│    → ASRResult:                     │
│        .text         "hello..."     │
│        .tokenTimings  [token,       │
│                        startTime,   │
│                        endTime,     │
│                        confidence]  │
│                                     │
│  stdout → JSON                      │
│  stderr → progress (JSON/ligne)     │
└─────────────────────────────────────┘
```

### Format de sortie (stdout)

```json
{
  "text": "full transcript text...",
  "words": [
    {"text": "hello", "start": 0.0, "end": 0.48, "confidence": 0.95},
    {"text": "world", "start": 0.48, "end": 0.92, "confidence": 0.98}
  ],
  "duration_seconds": 1800.0,
  "language": "en"
}
```

### Progress (stderr, une ligne JSON par événement)

```json
{"stage": "loading_model", "progress": 0.1, "message": "Downloading/loading CoreML model..."}
{"stage": "transcribing", "progress": 0.4, "message": "Transcribing audio..."}
{"stage": "completed", "progress": 1.0, "message": "Transcription complete"}
```

---

## Prérequis

### macOS

- **macOS 13.0+** (Ventura ou ultérieur)
- **Apple Silicon** (M1/M2/M3/M4) — requis pour le Neural Engine
- **Xcode** (pas juste CommandLineTools) — requis pour compiler du Swift avec CoreML/AVFoundation

### Installer Xcode

> **Important :** Les CommandLineTools (`xcode-select --install`) ne suffisent PAS.
> SPM + CoreML + AVFoundation nécessitent le SDK complet de Xcode.

#### Option A : Mac App Store (simple, ~30 GB)

1. Ouvrir le Mac App Store
2. Chercher "Xcode"
3. Installer (le téléchargement fait ~7 GB, décompressé ~30 GB)
4. Lancer Xcode une première fois pour accepter la licence et installer les composants
5. Configurer le toolchain :

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

#### Option B : `xcodes` CLI (plus rapide, permet plusieurs versions)

```bash
# Installer xcodes
brew install xcodesorg/made/xcodes

# Lister les versions disponibles
xcodes list

# Installer (ex: 16.2) — télécharge depuis Apple Developer
xcodes install 16.2

# Le path sera /Applications/Xcode-16.2.app
sudo xcode-select -s /Applications/Xcode-16.2.app/Contents/Developer
```

> **Note :** `xcodes` nécessite un Apple ID pour télécharger. Il va demander
> les credentials au premier lancement.

#### Option C : Téléchargement direct depuis Apple Developer

1. Aller sur https://developer.apple.com/download/all/
2. Se connecter avec un Apple ID (gratuit)
3. Chercher "Xcode 16" et télécharger le .xip
4. Double-cliquer le .xip pour décompresser → Xcode.app
5. Déplacer dans /Applications/
6. `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`

### Vérifier l'installation

```bash
# Doit pointer vers Xcode, PAS CommandLineTools
xcode-select -p
# Attendu: /Applications/Xcode.app/Contents/Developer

# Vérifier Swift
swift --version
# Attendu: Apple Swift version 6.x

# Vérifier que SPM fonctionne avec des frameworks Apple
swift package init --type executable
# Ne doit pas donner d'erreur de linker
```

### FFmpeg

Nécessaire pour extraire l'audio des vidéos.

```bash
# Option 1: Homebrew
brew install ffmpeg

# Option 2: Le binaire est déjà bundlé dans le projet Tauri
# → apps/desktop/src-tauri/binaries/ffmpeg-aarch64-apple-darwin
```

---

## Build

### Compiler le sidecar

```bash
cd apps/desktop/src-tauri/sidecars/fluidaudio-sidecar

# Résoudre les dépendances (première fois, télécharge FluidAudio ~1 min)
swift package resolve

# Compiler en release pour arm64
./build.sh
```

Le script `build.sh` fait :

1. `swift build -c release --arch arm64` — compile en mode release
2. Trouve le binaire compilé dans `.build/release/`
3. Le copie vers `../../binaries/fluidaudio-sidecar-aarch64-apple-darwin`
   (convention Tauri : `<nom>-<target-triple>`)

### Vérifier le build

```bash
# Le binaire doit exister
ls -la ../../binaries/fluidaudio-sidecar-aarch64-apple-darwin

# Tester qu'il se lance
../../binaries/fluidaudio-sidecar-aarch64-apple-darwin transcribe --help
```

---

## Test standalone

Le script `test-transcribe.sh` permet de tester la transcription sans lancer l'app Tauri.

```bash
# Usage
./test-transcribe.sh <video.mp4> [output.json]

# Exemples
./test-transcribe.sh ~/Videos/interview.mp4
# → crée ~/Videos/interview-transcript.json

./test-transcribe.sh ~/Videos/interview.mp4 ~/Desktop/transcript.json
# → crée ~/Desktop/transcript.json
```

### Ce que fait le script

1. **Extraction audio** : FFmpeg convertit la vidéo en WAV 16kHz mono (fichier temp)
2. **Transcription** : Lance le sidecar FluidAudio (ou `swift run` si pas compilé)
3. **Écriture** : Sauvegarde le JSON formaté sur disque
4. **Résumé** : Affiche nombre de mots, durée, temps de transcription, aperçu texte

### Premier lancement

Au premier lancement, FluidAudio télécharge le modèle CoreML Parakeet v3 (~500 MB)
depuis HuggingFace. C'est automatique et le modèle est mis en cache pour les fois
suivantes. Le téléchargement peut prendre 1-5 min selon la connexion.

---

## Intégration Tauri

Le sidecar est intégré dans l'app Tauri comme binaire externe (comme FFmpeg).

### Configuration (`tauri.conf.json`)

```json
{
  "bundle": {
    "externalBin": [
      "binaries/ffmpeg",
      "binaries/ffprobe",
      "binaries/fluidaudio-sidecar"
    ]
  }
}
```

### Côté Rust

Le service `FluidAudioTranscriptionService` (dans `src/infrastructure/adapters/`) :

1. Résout le chemin du binaire sidecar (prod: à côté de l'exe, dev: `binaries/`)
2. Spawn le process : `fluidaudio-sidecar transcribe <audio.wav> --output json`
3. Lit stderr en background (progress logging)
4. Attend la fin du process, parse le JSON stdout
5. Convertit en `TranscriptionResult` (entité du domaine)

### Pipeline simplifié

Avant (Parakeet ONNX CPU) :
```
Vidéo → FFmpeg → WAV → Charger en mémoire → Découper en chunks 5min → Transcrire chunk par chunk → Fusionner
```

Après (FluidAudio CoreML) :
```
Vidéo → FFmpeg → WAV → Transcrire (une seule passe) → Done
```

---

## Fichiers

```
sidecars/fluidaudio-sidecar/
├── Package.swift                          # SPM manifest (dépendance FluidAudio >= 0.7.9)
├── Sources/FluidAudioSidecar/main.swift   # CLI principal
├── build.sh                               # Script de compilation
├── test-transcribe.sh                     # Script de test standalone
└── README.md                              # Ce fichier
```

---

## Troubleshooting

### `error: invalid developer directory`

Xcode n'est pas installé ou le path est incorrect.

```bash
# Vérifier
xcode-select -p

# Si ça dit /Library/Developer/CommandLineTools → installer Xcode (voir Prérequis)
```

### `Undefined symbols for architecture arm64` lors de `swift package resolve`

Même problème : utilise CommandLineTools au lieu de Xcode.

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

### Le sidecar ne trouve pas le modèle / téléchargement bloqué

FluidAudio télécharge le modèle depuis HuggingFace. En cas de proxy ou firewall :

```bash
export https_proxy=http://proxy:port
```

### `Transcription terminée en 0s` avec output vide

Le sidecar a crashé silencieusement. Relancer avec stderr visible :

```bash
./binaries/fluidaudio-sidecar-aarch64-apple-darwin transcribe /path/to/audio.wav --output json
```

---

## Performance attendue

| Durée vidéo | Temps transcription | RTF   |
|-------------|---------------------|-------|
| 1 min       | ~0.5s               | ~120x |
| 10 min      | ~5s                 | ~120x |
| 30 min      | ~15s                | ~120x |
| 60 min      | ~30s                | ~120x |

Benchmarks sur M4 Pro. Performance similaire sur M1/M2/M3 (le Neural Engine
est comparable entre générations).
