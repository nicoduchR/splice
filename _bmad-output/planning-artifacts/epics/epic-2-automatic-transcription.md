# Epic 2: Automatic Transcription

Les utilisateurs peuvent générer automatiquement un transcript précis avec timestamps par mot.

## Story 2.1: Parakeet Model Download Infrastructure

As a user,
I want the Parakeet transcription model to download automatically on first launch,
So that I can start transcribing videos without manual setup.

**Acceptance Criteria:**

**Given** app is launched for the first time (FR7)
**When** no Parakeet model detected locally
**Then** app checks model location: `~/.splice/models/parakeet-tdt-0.6b-v3/` (macOS), `%APPDATA%/splice/models/` (Windows)
**And** if model missing, download dialog appears: "Première utilisation: Téléchargement du modèle de transcription Parakeet (≈500MB)"
**And** download starts from model repository (URL configured in backend)
**And** progress bar shows download percentage and speed (FR8, NFR2)
**And** download uses streaming to disk (not all in memory)
**And** on download failure, retry automatically with exponential backoff (NFR28, FR53)
**And** after 3 failed attempts, show error with manual retry button
**And** downloaded model validated (checksum verification) (NFR39)
**And** on successful download, model marked as ready in local config
**And** user can click "Cancel" to quit app and download later

---

## Story 2.2: Transcription Backend Integration

As a developer,
I want to integrate Parakeet TDT 0.6B v3 model into the Rust backend,
So that transcription runs locally on the user's CPU without requiring GPU.

**Acceptance Criteria:**

**Given** Parakeet model downloaded and ready (FR10, NFR40)
**When** integrating model into Rust backend
**Then** Parakeet TDT Rust crate or bindings added to `Cargo.toml`
**And** model loaded on-demand (not at app startup to reduce memory)
**And** transcription runs on CPU-only without CUDA/GPU dependencies (NFR40)
**And** model processes audio extracted from video file
**And** transcription use case created in `application/use_cases/transcribe_video.rs`
**And** transcription adapter in `infrastructure/adapters/parakeet_adapter.rs`
**And** word-level timestamps generated for each word (FR11)
**And** confidence scores calculated for each word
**And** 60 minutes of video transcribed in less than 5 seconds on modern CPU (Intel i7/Ryzen 7, Apple Silicon M1+) (NFR1)
**And** transcription runs in background thread without blocking UI (NFR3)

---

## Story 2.3: Transcript Data Storage

As a developer,
I want to store transcripts with word-level timestamps in SQLite,
So that transcripts persist and can be retrieved efficiently.

**Acceptance Criteria:**

**Given** transcription completes successfully
**When** storing transcript data
**Then** two SQLite tables created via migration:
  ```sql
  CREATE TABLE transcripts (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    full_text TEXT NOT NULL,
    language TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE transcript_words (
    id TEXT PRIMARY KEY,
    transcript_id TEXT NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    start_time REAL NOT NULL,
    end_time REAL NOT NULL,
    confidence REAL NOT NULL,
    word_index INTEGER NOT NULL
  );
  ```
**And** transcript saved with full text concatenation
**And** each word saved individually with precise start/end timestamps
**And** language detected and stored (default: French)
**And** transcript linked to project via foreign key
**And** auto-save triggered every 30 seconds during long transcriptions (NFR25)
**And** if app crashes mid-transcription, partial transcript recovered on restart (NFR26)

---

## Story 2.4: Transcription UI & Progress Tracking

As a user,
I want to see transcription progress in real-time,
So that I know the process is working and how long it will take.

**Acceptance Criteria:**

**Given** video imported successfully (FR9)
**When** user clicks "Générer le transcript" button
**Then** transcription starts in backend
**And** progress modal appears with:
  - Animated loading indicator
  - Progress bar showing percentage (0-100%)
  - Status text: "Transcription en cours... 45%" (FR8, NFR2)
  - Estimated time remaining (optional)
**And** for videos >10 minutes, progress updates every 2-3 seconds (NFR2)
**And** for videos <10 minutes, simple spinner without percentage
**And** UI remains responsive during transcription (no blocking) (NFR3)
**And** user can cancel transcription mid-process
**And** on completion, success toast: "Transcript généré avec succès! X mots détectés."
**And** transcript automatically displays in editor

---

## Story 2.5: Transcript Display & Editor Component

As a user,
I want to read the generated transcript in a clean, readable interface,
So that I can easily review and select text for editing.

**Acceptance Criteria:**

**Given** transcription completed (FR12, FR14)
**When** transcript displays in editor
**Then** transcript rendered as readable text with proper formatting:
  - Paragraphs separated by pauses/silences
  - Font size 16px (1rem) for readability (UX-9)
  - Line height 1.7 for comfortable reading
  - Dark theme with high contrast text (WCAG AA) (UX-1)
**And** each word is individually selectable
**And** timestamps hidden by default (cleaner view)
**And** optional "Show timestamps" toggle displays time codes
**And** transcript scrollable with smooth scrolling
**And** search functionality: Cmd+F / Ctrl+F highlights matching words
**And** transcript supports videos up to 2 hours (FR13)
**And** large transcripts (>10,000 words) render efficiently with virtualization
**And** keyboard navigation: Arrow keys move between words (UX-4)

---
