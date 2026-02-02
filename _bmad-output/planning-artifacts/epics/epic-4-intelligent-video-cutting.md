# Epic 4: Intelligent Video Cutting

Les utilisateurs peuvent générer automatiquement des cuts vidéo basés sur leur sélection textuelle.

## Story 4.1: Cut Generation Backend Logic

As a developer,
I want to implement the core cut generation algorithm,
So that selected text passages are accurately converted to video segments with proper timing.

**Acceptance Criteria:**

**Given** user has highlighted text selections (FR19)
**When** "Generate Cuts" is triggered
**Then** backend use case `generate_cuts` retrieves selections from SQLite
**And** for each selection:
  - Start time = first word start_time - 0.1s margin (FR20)
  - End time = last word end_time + 0.1s margin (FR20)
  - Margins ensure natural transitions
**And** cuts never split in middle of a word (use word boundaries) (FR23)
**And** segments assembled in chronological order (FR24)
**And** cut list stored as JSON or in `cuts` table:
  ```sql
  CREATE TABLE cuts (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    segment_index INTEGER NOT NULL,
    start_time REAL NOT NULL,
    end_time REAL NOT NULL,
    created_at INTEGER NOT NULL
  );
  ```
**And** cut generation completes in less than 1 second for typical edits

---

## Story 4.2: FFmpeg Video Segmentation

As a developer,
I want to use FFmpeg to extract video segments based on cut timecodes,
So that the actual video processing happens efficiently without re-encoding.

**Acceptance Criteria:**

**Given** cuts have been generated (FR21)
**When** video segmentation starts
**Then** FFmpeg adapter uses streaming architecture to process large files (NFR5, PLATFORM-6)
**And** FFmpeg command extracts segments with `-ss` (start) and `-to` (end) flags
**And** copy codec used to avoid re-encoding: `-c copy` (preserves quality, fast processing)
**And** for 1 hour of source video, processing completes in <30 seconds (NFR4)
**And** RAM usage stays under 4GB even for 50GB video files (NFR5)
**And** segments saved temporarily in `~/.splice/temp/` directory
**And** segment files named: `segment_001.mp4`, `segment_002.mp4`, etc.
**And** error handling for corrupted video or missing codecs (NFR23)

---

## Story 4.3: Cut Processing UI with Progress

As a user,
I want to see real-time progress while cuts are being generated,
So that I know the process is working and how long it will take.

**Acceptance Criteria:**

**Given** user clicks "Generate Cuts" button (FR22)
**When** processing starts
**Then** progress modal displays:
  - Title: "Génération des cuts vidéo..."
  - Progress bar showing percentage (0-100%)
  - Current segment: "Traitement du segment 5/23"
  - Estimated time remaining
**And** progress updates in real-time (NFR6)
**And** UI remains responsive (background processing)
**And** user can cancel operation mid-process
**And** on cancel, temp files cleaned up
**And** on completion, success toast: "Cuts générés avec succès! 23 segments prêts."
**And** automatically transitions to preview mode

---

## Story 4.4: Cut Validation & Quality Checks

As a developer,
I want to validate generated cuts for quality and integrity,
So that users don't get corrupted or invalid video segments.

**Acceptance Criteria:**

**Given** cuts have been processed
**When** validation runs
**Then** each segment verified:
  - File exists and is readable
  - Duration matches expected cut length (±0.5s tolerance)
  - Video codec is valid (H.264/H.265)
  - No corruption detected
**And** segments concatenable (compatible codecs, resolution, frame rate)
**And** if any segment fails validation, error reported: "Segment X invalide, régénération..."
**And** failed segments automatically regenerated (retry logic)
**And** all validation completes before preview available
**And** validation logged for debugging (NFR21 - logs without sensitive data)

---
