# Epic 8: Reliable Auto-Updates

Les utilisateurs reçoivent automatiquement les mises à jour sans interruption de leur workflow.

## Story 8.1: Update Check & Background Download

As a user,
I want the app to check for updates automatically,
So that I always have the latest features and bug fixes without manual intervention.

**Acceptance Criteria:**

**Given** app launches or runs (FR45)
**When** update check runs
**Then** update server queried on startup: `GET /api/updates/latest?platform=macos&version=1.0.0`
**And** server responds with latest version info:
  ```json
  {
    "version": "1.1.0",
    "releaseDate": "2025-01-15",
    "downloadUrl": "https://updates.splice.app/v1.1.0/Splice-macos.dmg",
    "signature": "...",
    "changelog": "- Feature X\n- Bug fix Y"
  }
  ```
**And** if new version available, download starts in background silently (FR46)
**And** download progress tracked but doesn't block user
**And** downloaded update stored in temp directory
**And** signature verified before installation (NFR19)
**And** if signature invalid, update rejected and error logged
**And** update check fails gracefully if offline (no error shown)
**And** retry automatically when connection restored (NFR28)

---

## Story 8.2: Update Notification & Installation

As a user,
I want to be notified when an update is ready,
So that I can choose when to apply it without disrupting my work.

**Acceptance Criteria:**

**Given** update downloaded successfully (FR47)
**When** user is working
**Then** discrete notification badge appears in app:
  - Small green dot on app icon or menu
  - Tooltip: "Mise à jour disponible (v1.1.0)"
**And** clicking notification shows update details:
  - Version: 1.1.0
  - Release date: 15 janvier 2025
  - Changelog (formatted, readable)
  - "Install Now" button
  - "Install on Quit" button (default)
  - "Remind Me Later" button
**And** "Install Now" restarts app immediately and applies update
**And** "Install on Quit" applies update next time app closes (FR48)
**And** "Remind Me Later" dismisses for 24 hours
**And** update never interrupts active work (no forced restart)
**And** if user is exporting or transcribing, notification waits until idle

---

## Story 8.3: Rollback & Update Recovery

As a developer,
I want to implement update rollback capability,
So that users can recover if an update causes issues.

**Acceptance Criteria:**

**Given** update installed
**When** user launches updated version
**Then** previous version backed up before update applied
**And** backup stored in `~/.splice/backups/v1.0.0/`
**And** if new version crashes on startup (3+ consecutive crashes), automatic rollback triggered
**And** rollback restores previous version
**And** user sees message: "La mise à jour v1.1.0 a causé des problèmes. Version précédente restaurée."
**And** crash report sent to developers (opt-in)
**And** manual rollback option in settings: "Revert to previous version"
**And** only 1 previous version kept (to save disk space)

---
