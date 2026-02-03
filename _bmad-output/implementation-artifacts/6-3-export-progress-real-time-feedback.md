# Story 6.3: Export Progress & Real-time Feedback

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to see detailed progress while my video exports,
so that I know how long to wait and can track completion.

## Acceptance Criteria

1. **Given** export processing, **when** FFmpeg is encoding, **then** progress modal displays:
   - Title: "Export en cours..."
   - Progress bar (0-100%)
   - Current frame / Total frames
   - Encoding speed: "2.5x realtime"
   - Time elapsed / Time remaining
   - File size growing: "145 MB / ~380 MB"

2. **Given** export in progress, **then** progress updates every 0.5-1 second (NFR6, real-time)

3. **Given** export in progress, **then** UI remains responsive (background export via `spawn_blocking`)

4. **Given** export in progress, **then** user can minimize app and continue other work

5. **Given** export in progress, **then** system notification sent on completion (optional, macOS native)

6. **Given** export in progress, **then** "Cancel Export" button available with confirmation dialog (AlertDialog)

7. **Given** user cancels export, **then** partial export file is deleted (already in 6.2 backend)

## Tasks / Subtasks

- [ ] Task 1 — Enrichir les events de progress backend (AC: #1, #2)
  - [ ] 1.1 Ajouter `current_frame`, `total_frames`, `speed`, `elapsed_secs`, `file_size_bytes`, `estimated_total_bytes` aux payloads `export:progress` dans `video_exporter.rs`
  - [ ] 1.2 Parser les infos FFmpeg stderr: `frame=`, `fps=`, `speed=`, `total_size=` en plus du `time=` déjà parsé
  - [ ] 1.3 Calculer ETA basé sur percent et elapsed time
  - [ ] 1.4 Émettre les events enrichis toutes les 500ms max (throttle côté Rust)

- [ ] Task 2 — Mettre à jour le type TypeScript `ExportProgress` (AC: #1)
  - [ ] 2.1 Mettre à jour l'interface dans `export-store.ts` pour inclure tous les nouveaux champs (currentFrame, totalFrames, speed, elapsedSecs, fileSizeBytes, estimatedTotalBytes, eta)
  - [ ] 2.2 Vérifier la cohérence avec le struct Rust via ts_rs si applicable

- [ ] Task 3 — Créer le composant `ExportProgress.tsx` (AC: #1, #2, #6)
  - [ ] 3.1 Créer `apps/desktop/src/components/export-modal/ExportProgress.tsx`
  - [ ] 3.2 Progress bar avec `bg-emerald-600 h-2 rounded-full` et `transition-all duration-300`
  - [ ] 3.3 Afficher: titre "Export en cours...", pourcentage, frames, speed, elapsed/remaining, file size
  - [ ] 3.4 Bouton "Annuler l'export" ouvrant un AlertDialog de confirmation
  - [ ] 3.5 ARIA: `role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100"`
  - [ ] 3.6 Screen reader announce percentage every 10% via `aria-live="polite"`

- [ ] Task 4 — Intégrer ExportProgress dans le flow export (AC: #3, #4)
  - [ ] 4.1 Modifier `ExportDialog.tsx` ou `App.tsx` pour afficher `ExportProgress` quand `isExporting === true`
  - [ ] 4.2 Le modal ExportProgress remplace/overlay le dialog de config pendant l'export
  - [ ] 4.3 S'assurer que le store `export-store` gère la transition config → progress → done/error

- [ ] Task 5 — Notification système à la fin (AC: #5)
  - [ ] 5.1 Utiliser `@tauri-apps/plugin-notification` ou l'API Tauri notification pour envoyer une notification native macOS à la fin de l'export
  - [ ] 5.2 Notification: titre "Export terminé", body "{filename} exporté avec succès"
  - [ ] 5.3 Conditionner à `document.hidden` (seulement si l'app n'est pas au premier plan)

- [ ] Task 6 — Tests frontend (AC: #1-#6)
  - [ ] 6.1 Tests ExportProgress: rendering avec données mock, progress bar width, affichage frames/speed/eta/filesize
  - [ ] 6.2 Tests cancel: click annuler → AlertDialog → confirmation → invoke cancel_export
  - [ ] 6.3 Tests store: mise à jour progress via events, transition states
  - [ ] 6.4 Tests accessibilité: ARIA attributes sur progress bar

- [ ] Task 7 — Tests backend (AC: #1, #2)
  - [ ] 7.1 Tests parsing enrichi FFmpeg stderr (frame, fps, speed, total_size)
  - [ ] 7.2 Tests throttling des events (pas plus d'un event toutes les 500ms)
  - [ ] 7.3 Tests calcul ETA

## Dev Notes

### Contexte critique de Story 6.2

La Story 6.2 a **déjà implémenté** :
- `VideoExporter` dans `apps/desktop/src-tauri/src/infrastructure/adapters/video_exporter.rs` avec FFmpeg stderr parsing basique (`time=HH:MM:SS`)
- Events Tauri : `export:progress`, `export:completed`, `export:error`
- Cancel via `Arc<AtomicBool>` dans `app_state.export_cancel_flags`
- `export-store.ts` avec listeners pour les events et état `isExporting`, `exportProgress`
- `export_commands.rs` avec `export_video` et `cancel_export` commands

**Ce qui MANQUE et doit être ajouté dans 6.3 :**
- Les payloads des events `export:progress` ne contiennent probablement que `percent` et `message` — il faut enrichir avec frame, speed, ETA, file size
- Le composant UI de progress n'existe pas encore (l'ExportDialog montre la config, pas le progress)
- Les notifications système ne sont pas implémentées

### Patterns architecturaux à suivre

**Event naming :** `export:progress` (déjà établi en 6.2, NE PAS changer)

**Progress bar UX (from UX spec) :**
- Container: `bg-gray-900 p-4 rounded-lg border border-gray-800`
- Bar: `bg-emerald-600 h-2 rounded-full`
- Label: `text-gray-300 text-sm`
- Percentage: `text-emerald-500 font-medium`
- Time: `text-gray-500 text-xs`
- Animation: `transition-all duration-300`

**Cancel pattern :** AlertDialog avec confirmation (pattern établi en 4.3 et 6.1)
- Utiliser `AlertDialog` de shadcn/ui
- Inclure `AlertDialogDescription` pour l'accessibilité
- Pattern : bouton "Annuler l'export" → AlertDialog "Êtes-vous sûr ?" → confirm → `invoke('cancel_export')`

**FFmpeg stderr parsing enrichi :**
```
frame=  120 fps= 60 q=28.0 size=    1024kB time=00:00:04.00 bitrate=2097.2kbits/s speed=2.00x
```
Parser avec regex : `frame=\s*(\d+)`, `fps=\s*([\d.]+)`, `speed=\s*([\d.]+)x`, `total_size=\s*(\d+)kB` ou `size=\s*(\d+)kB`

**Zustand store pattern :**
```typescript
// Dans export-store.ts, enrichir l'interface ExportProgress
interface ExportProgress {
  percent: number;
  message?: string;
  currentFrame?: number;
  totalFrames?: number;
  speed?: number;         // ex: 2.5 (= 2.5x realtime)
  elapsedSecs?: number;
  eta?: number;           // secondes restantes
  fileSizeBytes?: number;
  estimatedTotalBytes?: number;
}
```

**Notification pattern (Tauri) :**
```typescript
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
```

### Project Structure Notes

- Alignment avec la structure existante : composants export dans `src/components/export-modal/`
- `ExportProgress.tsx` est un nouveau composant dans ce dossier
- Le store `export-store.ts` existe déjà et sera modifié (pas recréé)
- Tests dans les fichiers `.test.ts(x)` adjacents

### Fichiers existants à connaître

| Fichier | Rôle |
|---------|------|
| `src-tauri/src/infrastructure/adapters/video_exporter.rs` | FFmpeg export + stderr parsing |
| `src-tauri/src/infrastructure/tauri_commands/export_commands.rs` | Tauri commands export_video, cancel_export |
| `src-tauri/src/infrastructure/config/app_state.rs` | Cancel flags storage |
| `src/stores/export-store.ts` | Zustand store export |
| `src/stores/export-store.test.ts` | Tests store existants |
| `src/components/export-modal/ExportDialog.tsx` | Dialog config export (6.1) |
| `src/components/segmentation/SegmentationProgress.tsx` | Référence pattern progress (4.3) |

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-6-professional-export.md#Story 6.3]
- [Source: _bmad-output/planning-artifacts/archive/architecture.md#Event System]
- [Source: _bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md#Progress Feedback]
- [Source: _bmad-output/planning-artifacts/archive/prd.md#FR32]
- [Source: _bmad-output/implementation-artifacts/6-2-ffmpeg-export-processing.md#Dev Notes]
- [Source: _bmad-output/implementation-artifacts/6-1-export-configuration-options.md#Dev Notes]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

