# Test Fixtures Setup

## Required Test Fixtures

Pour exécuter tous les tests d'intégration, vous devez créer les fixtures suivantes:

### 1. Vidéo de test (5 secondes)

**Chemin:** `tests/fixtures/test_video_5s.mp4`

**Spécifications:**
- Durée: 5 secondes
- Codec vidéo: H.264
- Audio: AAC ou PCM
- Résolution: 1280x720 ou supérieure
- Contenu audio: Parole claire en français (ex: "Bonjour le monde, ceci est un test")

**Comment créer:**
```bash
# Avec FFmpeg (générer une vidéo de test avec ton à 440Hz)
ffmpeg -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 \
       -f lavfi -i sine=frequency=440:duration=5 \
       -c:v libx264 -c:a aac \
       tests/fixtures/test_video_5s.mp4
```

**Alternative:** Enregistrer une vraie vidéo de 5s avec votre caméra/écran

### 2. Audio WAV de test (16kHz mono)

**Chemin:** `tests/fixtures/test_audio_16khz_mono.wav`

**Spécifications:**
- Sample rate: 16000 Hz
- Channels: 1 (mono)
- Format: PCM s16le (signed 16-bit little-endian)
- Durée: 3-10 secondes

**Comment créer:**
```bash
# À partir de la vidéo de test
ffmpeg -i tests/fixtures/test_video_5s.mp4 \
       -vn -acodec pcm_s16le -ac 1 -ar 16000 \
       tests/fixtures/test_audio_16khz_mono.wav
```

### 3. Vidéo H.264 pour tests d'intégration

**Chemin:** `test-assets/fixtures/sample-h264.mp4`

**Spécifications:**
- Durée: 10-30 secondes
- Codec: H.264 (obligatoire)
- Audio: avec parole claire
- Taille: <50 MB

**Comment créer:**
```bash
mkdir -p test-assets/fixtures
# Copier ou encoder votre vidéo
ffmpeg -i input_video.mp4 \
       -c:v libx264 -preset fast -crf 23 \
       -c:a aac -b:a 128k \
       -t 30 \
       test-assets/fixtures/sample-h264.mp4
```

## Fixtures Optionnelles (Recommandées)

### 4. Vidéo longue pour tests de performance

**Chemin:** `test-assets/fixtures/long-video-60min.mp4`

**Spécifications:**
- Durée: 60 minutes
- Pour tester NFR1: "60 minutes < 5 secondes de transcription"
- Codec: H.264
- Parole continue (podcast, conférence)

⚠️ **Note:** Ne pas commiter dans Git (trop volumineux). Ajouter au .gitignore.

## Vérification des Fixtures

Pour vérifier que vos fixtures sont correctes:

```bash
# Vérifier la vidéo
ffprobe tests/fixtures/test_video_5s.mp4

# Vérifier l'audio
ffprobe tests/fixtures/test_audio_16khz_mono.wav

# Exécuter les tests
cargo test --test transcription_integration_test
```

## Tests Sans Fixtures

Si les fixtures ne sont pas présentes, les tests seront **automatiquement skippés** avec un message:
```
⚠️  Skipping test: test video fixture not found
```

C'est normal en CI si les fixtures ne sont pas commitées.

## CI/CD Considerations

Pour exécuter les tests en CI:

1. **Option A:** Générer fixtures dans le pipeline CI
2. **Option B:** Utiliser des fixtures stockées en artifacts
3. **Option C:** Skip les tests en CI (tests locaux uniquement)

Configuration actuelle: **Option C** (tests skip si fixtures absentes)
