# Epic 6: Professional Export

Les utilisateurs peuvent exporter leur vidéo cutée en qualité professionnelle compatible Premiere/Resolve.

## Story 6.1: Export Configuration & Options

As a user,
I want to configure export settings before finalizing my video,
So that I can ensure the output meets my quality and compatibility requirements.

**Acceptance Criteria:**

**Given** preview validated and user clicks "Export" (FR29)
**When** export dialog opens
**Then** export settings form displays:
  - Output format: MP4 (fixed for MVP) (FR29)
  - Codec: H.264 (High profile, fixed) (FR30, NFR36)
  - Quality: "Preserve Original" (default) or "High/Medium/Low" (FR31)
  - Output location: File picker to choose destination
  - Filename: Auto-suggested as `{original_name}_edited.mp4`
**And** estimated file size displayed based on selections
**And** estimated export time: "~5 minutes" (NFR10)
**And** "Export" button starts process
**And** "Cancel" button closes dialog
**And** settings saved as defaults for future exports

---

## Story 6.2: FFmpeg Export Processing

As a developer,
I want to implement high-quality video export using FFmpeg,
So that exported files are professional-grade and compatible with editing software.

**Acceptance Criteria:**

**Given** export started with user settings (FR30, FR31, FR34)
**When** backend processes export
**Then** FFmpeg concat demuxer merges segments into single MP4
**And** H.264 codec used with High profile (NFR36):
  - `-c:v libx264 -profile:v high -level 4.1`
**And** quality preserved from original (no unnecessary re-encoding) (NFR11)
**And** if source is H.264, codec copy used where possible (`-c copy`)
**And** if re-encoding needed, CRF 18-23 used for high quality
**And** audio codec: AAC at 192kbps (universal compatibility)
**And** metadata preserved (creation date, camera info if present)
**And** export file compatible with:
  - Adobe Premiere Pro CC 2020+ (NFR37)
  - DaVinci Resolve 17+ (NFR38)
  - Standard video players (VLC, QuickTime, Windows Media Player)
**And** export time ≤ 2x final video duration (NFR10)
**And** no quality degradation visible (PSNR/VMAF metrics high)

---

## Story 6.3: Export Progress & Real-time Feedback

As a user,
I want to see detailed progress while my video exports,
So that I know how long to wait and can track completion.

**Acceptance Criteria:**

**Given** export processing (FR32)
**When** FFmpeg is encoding
**Then** progress modal displays:
  - Title: "Export en cours..."
  - Progress bar (0-100%)
  - Current frame / Total frames
  - Encoding speed: "2.5x realtime"
  - Time elapsed / Time remaining
  - File size growing: "145 MB / ~380 MB"
**And** progress updates every 0.5-1 second (NFR6, real-time)
**And** UI remains responsive (background export)
**And** user can minimize app and continue other work
**And** system notifications sent on completion (optional)
**And** "Cancel Export" button available with confirmation dialog
**And** on cancel, partial export file deleted

---

## Story 6.4: Export Completion & File Access

As a user,
I want quick access to my exported video file after export completes,
So that I can immediately use it in my workflow.

**Acceptance Criteria:**

**Given** export completed successfully (FR33)
**When** processing finishes
**Then** success modal displays:
  - "Export terminé avec succès!"
  - File size: "385 MB"
  - Duration: "12:45"
  - Location: "/Users/name/Videos/project_edited.mp4"
**And** "Open File" button opens video in default player
**And** "Show in Finder/Explorer" button reveals file in file browser (FR33)
**And** "Export Another" button returns to preview
**And** "Done" button closes export flow
**And** success toast notification: "Vidéo exportée: project_edited.mp4"
**And** exported file plays correctly in Premiere Pro without errors (NFR37)
**And** exported file imports cleanly into DaVinci Resolve (NFR38)

---
