# Epic 5: Preview & Validation

Les utilisateurs peuvent prévisualiser et valider la vidéo cutée avant l'export final.

## Story 5.1: Video Preview Player Component

As a user,
I want to preview my edited video with all cuts applied,
So that I can validate the result before exporting.

**Acceptance Criteria:**

**Given** cuts have been generated (FR25)
**When** preview mode opens
**Then** video player component displays with:
  - Video canvas showing concatenated segments
  - Play/Pause button (FR26)
  - Seek bar for scrubbing (FR27)
  - Current time / Total duration display
  - Volume control
  - Fullscreen toggle
**And** segments play in order seamlessly (no gaps)
**And** preview starts playing automatically after <2 seconds load time (NFR8)
**And** scrubbing responsive (click anywhere on seek bar jumps to that time) (FR27)
**And** playback controls use standard keyboard shortcuts:
  - Space: Play/Pause
  - Arrow Left/Right: Skip 5s back/forward
  - Arrow Up/Down: Volume up/down
  - F: Fullscreen
**And** player accessible via keyboard (WCAG AA) (UX-4)

---

## Story 5.2: Preview Playback Backend

As a developer,
I want to implement efficient preview playback of concatenated segments,
So that users can preview without waiting for full export.

**Acceptance Criteria:**

**Given** segments exist in temp directory
**When** preview requested
**Then** backend creates temporary concatenation list for FFmpeg
**And** FFmpeg concat demuxer used to stream segments: `-f concat -safe 0 -i concat_list.txt`
**And** preview pipe streams to frontend without creating full export file
**And** playback starts in <2 seconds (NFR8)
**And** seeking works smoothly (no lag)
**And** segments transition seamlessly (no black frames or audio glitches)
**And** memory efficient (doesn't load entire video in RAM)

---

## Story 5.3: Preview Validation & Editing Controls

As a user,
I want to validate that cuts meet my expectations and make adjustments if needed,
So that I can ensure quality before exporting.

**Acceptance Criteria:**

**Given** preview is playing (FR28)
**When** user reviews cuts
**Then** "Back to Edit" button available to return to transcript editor
**And** "Looks Good - Export" button available to proceed to export
**And** segment boundaries visible on preview timeline (markers show where cuts happen)
**And** clicking segment boundary jumps to that transition point
**And** user can identify any issues:
  - Cut too early/late
  - Awkward transitions
  - Missing content
**And** validation checklist displayed:
  - ☐ All important content included
  - ☐ Transitions feel natural
  - ☐ No awkward cuts mid-sentence
  - ☐ Audio levels consistent
**And** if user finds issues, they can return to edit without losing progress

---
