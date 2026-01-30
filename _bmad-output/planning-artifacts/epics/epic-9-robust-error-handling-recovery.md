# Epic 9: Robust Error Handling & Recovery

Les utilisateurs peuvent récupérer de toute erreur sans perdre leur travail.

## Story 9.1: Graceful Network Error Handling

As a user,
I want the app to handle network failures gracefully,
So that I can continue working even when offline.

**Acceptance Criteria:**

**Given** network operations fail (FR52)
**When** Parakeet model download fails, license verification fails, or update check fails
**Then** app continues functioning without crashing
**And** for model download failure:
  - Retry automatically with exponential backoff (1s, 2s, 4s, 8s) (NFR28, FR53)
  - After 3 attempts, show error: "Échec du téléchargement. Vérifiez votre connexion."
  - "Retry" and "Cancel" buttons available
**And** for license verification failure:
  - Use cached license (grace period)
  - No error shown to user if within grace period
  - Retry silently in background
**And** for update check failure:
  - Fail silently (no popup)
  - Retry on next app launch
**And** user can continue working offline with all core features
**And** no stack traces shown to users (NFR30)

---

## Story 9.2: Auto-Save & Crash Recovery

As a user,
I want my work auto-saved frequently,
So that I don't lose progress if the app crashes or closes unexpectedly.

**Acceptance Criteria:**

**Given** user is working on a project (NFR25, NFR26, NFR27)
**When** edits are made
**Then** transcript selections auto-saved to SQLite every 30 seconds
**And** cut configurations auto-saved
**And** project state auto-saved (current position, zoom level, etc.)
**And** if app crashes, on restart:
  - Recovery dialog appears: "Splice s'est fermé de manière inattendue. Récupérer le projet en cours?"
  - "Recover Project" button (default)
  - "Start Fresh" button
**And** clicking "Recover" restores:
  - Last imported video
  - Complete transcript
  - All selections (highlighted text)
  - Generated cuts
  - Timeline position
**And** unsaved exports not lost (cuts still available for re-export)
**And** crash rate kept under 1% of sessions (NFR22)

---

## Story 9.3: Clear Error Messages & User Guidance

As a user,
I want to see clear, actionable error messages when something goes wrong,
So that I understand what happened and know how to fix it.

**Acceptance Criteria:**

**Given** an error occurs (FR51, FR54, NFR29, NFR30)
**When** displaying error to user
**Then** error messages are in French (NFR29)
**And** messages are clear and actionable, not technical:
  - ❌ Bad: "ENOENT: no such file or directory"
  - ✅ Good: "Fichier vidéo introuvable. Il a peut-être été déplacé ou supprimé."
**And** messages include suggested actions:
  - "Vérifiez que le fichier existe toujours."
  - "Assurez-vous d'avoir au moins 5GB d'espace disque disponible."
  - "Redémarrez l'application et réessayez."
**And** no stack traces shown to end users (NFR30)
**And** error dialog includes:
  - Icon (⚠️ warning or ❌ error)
  - Title summarizing issue
  - Description with details
  - Suggested actions (bullet list)
  - "Retry" button if applicable
  - "Close" button
  - "Copy Error Details" button (for support requests)
**And** all errors logged to local file for debugging (NFR21)

---

## Story 9.4: Disk Space & Resource Management

As a user,
I want to be warned if I'm running low on disk space,
So that I can free up space before exports fail.

**Acceptance Criteria:**

**Given** user is working with large video files (NFR24)
**When** disk space checked
**Then** before import, available space verified
**And** if available space < 3x video file size, warning shown:
  - "Espace disque faible"
  - "Votre disque dispose de 8 GB libres."
  - "Cette vidéo (15 GB) nécessite ~45 GB pour le traitement."
  - "Libérez de l'espace ou choisissez une vidéo plus petite."
**And** before export, space checked again
**And** temp files cleaned up after successful export
**And** "Clear Cache" option in settings removes old temp files
**And** user can configure temp directory location
**And** if app runs out of space mid-operation, graceful failure with clear message

---
