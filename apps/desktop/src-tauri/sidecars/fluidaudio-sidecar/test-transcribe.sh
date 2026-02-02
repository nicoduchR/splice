#!/bin/bash
set -euo pipefail

# =============================================================================
# test-transcribe.sh — Script standalone de test FluidAudio
#
# Usage:
#   ./test-transcribe.sh <video.mp4> [output.json]
#
# Ce script :
#   1. Extrait l'audio de la vidéo (16kHz mono WAV) via ffmpeg
#   2. Lance le sidecar FluidAudio pour transcrire
#   3. Écrit le transcript JSON sur le disque
#
# Pré-requis :
#   - ffmpeg installé (brew install ffmpeg ou dans le PATH)
#   - Le sidecar compilé (./build.sh d'abord)
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SIDECAR_DIR="$SCRIPT_DIR"
BINARIES_DIR="$SCRIPT_DIR/../../binaries"

# --- Arguments ---
if [ $# -lt 1 ]; then
    echo "Usage: $0 <video-path> [output.json]"
    echo ""
    echo "Exemples:"
    echo "  $0 ~/Videos/interview.mp4"
    echo "  $0 ~/Videos/interview.mp4 ~/Desktop/transcript.json"
    exit 1
fi

VIDEO_PATH="$1"
OUTPUT_PATH="${2:-$(dirname "$VIDEO_PATH")/$(basename "${VIDEO_PATH%.*}")-transcript.json}"

if [ ! -f "$VIDEO_PATH" ]; then
    echo "ERREUR: Fichier vidéo introuvable: $VIDEO_PATH"
    exit 1
fi

# --- Trouver le sidecar ---
SIDECAR=""

# Option 1: binaire compilé dans binaries/
if [ -f "$BINARIES_DIR/fluidaudio-sidecar-aarch64-apple-darwin" ]; then
    SIDECAR="$BINARIES_DIR/fluidaudio-sidecar-aarch64-apple-darwin"
fi

# Option 2: swift run (build à la volée si nécessaire)
if [ -z "$SIDECAR" ]; then
    echo "Binaire compilé non trouvé. Utilisation de 'swift run'..."
    echo "(Pour de meilleures performances, exécutez d'abord: ./build.sh)"
    echo ""
    USE_SWIFT_RUN=true
fi

# --- Trouver ffmpeg ---
FFMPEG=""
if [ -f "$BINARIES_DIR/ffmpeg-aarch64-apple-darwin" ]; then
    FFMPEG="$BINARIES_DIR/ffmpeg-aarch64-apple-darwin"
elif command -v ffmpeg &>/dev/null; then
    FFMPEG="ffmpeg"
else
    echo "ERREUR: ffmpeg introuvable. Installez-le avec: brew install ffmpeg"
    exit 1
fi

# --- Extraction audio ---
TEMP_WAV=$(mktemp /tmp/fluidaudio-test-XXXXXX.wav)
trap "rm -f '$TEMP_WAV'" EXIT

echo "=== Étape 1/3 : Extraction audio ==="
echo "  Vidéo:  $VIDEO_PATH"
echo "  Audio:  $TEMP_WAV"
echo ""

"$FFMPEG" -i "$VIDEO_PATH" -vn -acodec pcm_s16le -ac 1 -ar 16000 -y "$TEMP_WAV" 2>/dev/null

WAV_SIZE=$(du -h "$TEMP_WAV" | cut -f1)
echo "  Audio extrait ($WAV_SIZE)"
echo ""

# --- Transcription ---
echo "=== Étape 2/3 : Transcription FluidAudio (CoreML) ==="
echo "  (Le premier lancement télécharge le modèle CoreML, ~500 MB)"
echo ""

START_TIME=$(date +%s)

# Fichier temporaire pour capturer stderr (progress du sidecar)
STDERR_LOG=$(mktemp /tmp/fluidaudio-stderr-XXXXXX.log)
trap "rm -f '$TEMP_WAV' '$STDERR_LOG'" EXIT

if [ "${USE_SWIFT_RUN:-false}" = "true" ]; then
    # Build + run via Swift Package Manager
    # stderr contient les logs de build Swift + progress du sidecar
    echo "  Compilation et exécution via 'swift run'..."
    TRANSCRIPT_JSON=$(cd "$SIDECAR_DIR" && swift run -c release fluidaudio-sidecar transcribe "$TEMP_WAV" --output json 2>"$STDERR_LOG") || {
        echo ""
        echo "ERREUR: Le sidecar a échoué. Stderr:"
        cat "$STDERR_LOG"
        exit 1
    }
else
    TRANSCRIPT_JSON=$("$SIDECAR" transcribe "$TEMP_WAV" --output json 2>"$STDERR_LOG") || {
        echo ""
        echo "ERREUR: Le sidecar a échoué. Stderr:"
        cat "$STDERR_LOG"
        exit 1
    }
fi

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo "  Transcription terminée en ${ELAPSED}s"
echo ""

# --- Écriture sur disque ---
echo "=== Étape 3/3 : Écriture du transcript ==="
echo "$TRANSCRIPT_JSON" | python3 -m json.tool > "$OUTPUT_PATH" 2>/dev/null || \
    echo "$TRANSCRIPT_JSON" > "$OUTPUT_PATH"

echo "  Transcript écrit: $OUTPUT_PATH"
echo ""

# --- Résumé ---
WORD_COUNT=$(echo "$TRANSCRIPT_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('words',[])))" 2>/dev/null || echo "?")
DURATION=$(echo "$TRANSCRIPT_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"{d.get('duration_seconds',0):.1f}\")" 2>/dev/null || echo "?")
TEXT_PREVIEW=$(echo "$TRANSCRIPT_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); t=d.get('text',''); print(t[:200]+'...' if len(t)>200 else t)" 2>/dev/null || echo "")

echo "=== Résumé ==="
echo "  Mots:     $WORD_COUNT"
echo "  Durée:    ${DURATION}s"
echo "  Temps:    ${ELAPSED}s"
echo "  Output:   $OUTPUT_PATH"
echo ""
echo "  Aperçu:"
echo "  $TEXT_PREVIEW"
