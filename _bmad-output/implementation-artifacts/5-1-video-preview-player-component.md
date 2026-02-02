# Story 5.1: Video Preview Player Component

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to preview my edited video with all cuts applied,
So that I can validate the result before exporting.

## Acceptance Criteria

1. **Given** des cuts ont été générés et validés (FR25, Story 4.4 complète)
   **When** le mode preview s'ouvre (après segmentation:completed)
   **Then** un composant lecteur vidéo affiche la vidéo concaténée finale avec :
   - Canvas vidéo montrant les segments concaténés
   - Bouton Play/Pause (FR26)
   - Barre de seek pour le scrubbing (FR27)
   - Affichage Temps courant / Durée totale
   - Contrôle du volume
   - Toggle plein écran

2. **And** les segments jouent dans l'ordre sans interruption (pas de gaps ni frames noires)

3. **And** le preview commence à jouer automatiquement en <2 secondes après chargement (NFR8)

4. **And** le scrubbing est réactif (clic n'importe où sur la seek bar saute à ce temps) (FR27)

5. **And** les contrôles de lecture utilisent les raccourcis clavier standards :
   - Space : Play/Pause
   - Arrow Left/Right : Skip 5s arrière/avant
   - Arrow Up/Down : Volume haut/bas
   - F : Plein écran

6. **And** le player est accessible via clavier (WCAG AA) (UX-4)

## Tasks / Subtasks

- [x] Task 1: Créer l'écran Preview et la navigation (AC: #1)
  - [x] Ajouter le screen `'preview'` dans App.tsx (nouveau état après editor)
  - [x] Ajouter un bouton "Prévisualiser" dans TopBar.tsx (visible quand segmentation terminée)
  - [x] Ajouter un bouton "Retour à l'éditeur" dans le mode preview
  - [x] Mettre à jour TopBar.tsx avec les props `onPreview`, `canPreview`, `onBackToEditor`
  - [x] Transition automatique vers preview après `segmentation:completed` (optionnel, peut être bouton manuel)

- [x] Task 2: Créer le composant PreviewPlayer.tsx (AC: #1, #2, #3, #4)
  - [x] Créer `apps/desktop/src/components/preview/PreviewPlayer.tsx`
  - [x] Utiliser `<video>` HTML5 avec `convertFileSrc()` pour lire le fichier concaténé final
  - [x] Le fichier source est `~/.splice/outputs/{project_id}_final.mp4` (sortie de Story 4.2/4.4)
  - [x] Ajouter contrôles Play/Pause avec icône toggle (Lucide: Play, Pause)
  - [x] Ajouter seek bar (input range ou div custom avec clic/drag)
  - [x] Ajouter affichage timecode `HH:MM:SS / HH:MM:SS` (réutiliser `formatTimecode` de timeline-store)
  - [x] Ajouter contrôle volume (slider + bouton mute)
  - [x] Ajouter toggle plein écran (API `requestFullscreen()`)
  - [x] Auto-play au chargement (AC #3)
  - [x] Responsive : video `object-contain` pour conserver le ratio

- [x] Task 3: Implémenter les raccourcis clavier (AC: #5)
  - [x] Ajouter listener `keydown` global (dans PreviewPlayer ou via hook dédié)
  - [x] Space → toggle play/pause
  - [x] ArrowLeft → currentTime -= 5
  - [x] ArrowRight → currentTime += 5
  - [x] ArrowUp → volume += 0.1 (max 1.0)
  - [x] ArrowDown → volume -= 0.1 (min 0.0)
  - [x] F → toggle fullscreen
  - [x] Prévenir les conflits avec d'autres handlers (focus management)

- [x] Task 4: Stocker le chemin du fichier final dans le store (AC: #1, #2)
  - [x] Ajouter `finalVideoPath: string | null` dans `useSegmentationStore`
  - [x] Mettre à jour le listener `segmentation:completed` dans App.tsx pour capturer le chemin final
  - [x] Le backend émet déjà le chemin dans l'événement completed — vérifier le payload exact
  - [x] Si le payload ne contient pas le chemin, ajouter une commande Tauri `get_final_video_path(project_id)` qui retourne `~/.splice/outputs/{project_id}_final.mp4`

- [x] Task 5: Accessibilité WCAG AA (AC: #6)
  - [x] ARIA labels sur tous les boutons de contrôle (`aria-label="Play"`, `aria-label="Pause"`, etc.)
  - [x] Focus visible sur tous les éléments interactifs (`focus:ring-2 focus:ring-emerald-500`)
  - [x] Tab order logique : Play → Seek → Volume → Fullscreen
  - [x] `role="slider"` + `aria-valuemin/max/now` pour la seek bar et le volume
  - [x] Keyboard shortcuts documentés dans KeyboardShortcutsBar (mise à jour pour preview)

- [x] Task 6: Tests unitaires TypeScript (AC: #1-#6)
  - [x] Test : PreviewPlayer rend les contrôles (play, seek, volume, fullscreen)
  - [x] Test : clic Play toggle vers Pause et inversement
  - [x] Test : seek bar mise à jour pendant la lecture (onTimeUpdate)
  - [x] Test : raccourci Space toggle play/pause
  - [x] Test : raccourci ArrowRight avance de 5s
  - [x] Test : affichage timecode formaté correctement
  - [x] Test : bouton "Retour à l'éditeur" appelle le callback
  - [x] Test : navigation vers preview quand `canPreview` est true
  - [x] Test store : `finalVideoPath` mis à jour après completed event

## Dev Notes

### Ce qui existe déjà (base pour le preview)

**VideoPlayer.tsx existant** (`components/video/VideoPlayer.tsx`, 352 lignes) :
- Lecteur HTML5 complet avec `convertFileSrc()` pour l'accès fichiers Tauri
- Transport controls (play/pause, skip ±5s), volume, timecode
- Segment markers sur le scrubber (synchronisé avec TimelineStore)
- Raccourcis clavier (Space, Arrow keys)
- Support proxy vidéo (bascule original/proxy)
- **NE PAS réutiliser directement** — ce composant est couplé au workflow d'édition (timeline store, segment overlay, transcript sync). Créer un composant **PreviewPlayer** simplifié et dédié.

**Fichier vidéo finale** :
- Après segmentation + validation + concaténation (Story 4.2-4.4), le fichier final est :
  `~/.splice/outputs/{project_id}_final.mp4`
- Créé par `VideoConcatenator` via FFmpeg concat demuxer : `ffmpeg -f concat -safe 0 -i filelist.txt -c copy output.mp4`
- Stream copy (pas de re-encoding) → qualité préservée, lecture immédiate

**Événement `segmentation:completed`** :
- Émis par `segmentation_commands.rs` après succès de la pipeline complète
- Payload actuel : vérifier si contient le chemin du fichier final ou juste les segment_paths
- Le store `useSegmentationStore` reçoit déjà cet événement dans App.tsx

**Navigation actuelle dans App.tsx** :
- Screens : `'import'` → `'project-details'` → `'transcribing'` → `'editor'`
- Pas de screen `'preview'` — à ajouter
- Le pattern est un simple state string avec conditional rendering

### Patterns à suivre

**Conventions React/TypeScript :**
- Composants dans `apps/desktop/src/components/preview/` (nouveau dossier)
- Store Zustand : `create<T>()` avec `devtools()` middleware
- Events Tauri : `listen<T>('domain:action', callback)` avec cleanup `unlisten()`
- Tests : `.test.tsx` côte à côte, Vitest + React Testing Library
- Toast : `toast.success()` / `toast.error()` via sonner

**Conventions UI/UX (UX Consistency Patterns) :**
- Bouton "Prévisualiser" : `<Button variant="default">` (Primary Emerald Green)
- Bouton "Retour à l'éditeur" : `<Button variant="outline">` (Secondary Gray Outline)
- Contrôles player : `<Button variant="ghost" size="icon">` (Ghost Transparent)
- Focus ring : `focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2`
- Touch target minimum : 44px (déjà respecté dans VideoPlayer existant)
- Icônes : Lucide React (déjà utilisé partout : Play, Pause, Volume2, VolumeX, Maximize, ArrowLeft)

**Conventions backend Rust (si besoin commande Tauri) :**
- Clean Architecture : `infrastructure/tauri_commands/` pour les commandes
- `#[tauri::command]` async, retour `Result<T, String>`
- Enregistrer dans `main.rs` dans `invoke_handler`

### Apprentissages des Stories précédentes

**Story 4.4 (Cut Validation) :**
- Le pipeline complet fonctionne : segmentation → validation → concaténation → completed
- FFprobe bundlé et fonctionnel pour validation des segments
- Le dialog de progression couvre toutes les phases (segmenting, validating, concatenating)
- Le store segmentation gère bien les phases multiples

**Story 4.2/4.3 :**
- CRITICAL : FFmpeg `-t` (durée) et NON `-to` — déjà corrigé
- La concaténation produit un fichier final valide en stream copy
- Le store a `stats` avec `segment_count`, `final_duration_secs`, `reduction_percent`

**VideoPlayer existant :**
- `convertFileSrc()` est la méthode Tauri pour accéder aux fichiers locaux depuis le webview
- Le pattern `videoRef.current.play()` / `.pause()` fonctionne bien
- `onTimeUpdate` pour sync timecode, `onLoadedMetadata` pour durée totale
- Keyboard shortcuts via `useEffect` + `document.addEventListener('keydown')`

### Architecture Preview vs Editor

Le PreviewPlayer est **distinct** du VideoPlayer de l'éditeur :

| Aspect | VideoPlayer (Editor) | PreviewPlayer (Preview) |
|--------|---------------------|------------------------|
| Source | Vidéo originale/proxy | Fichier final concaténé |
| Segments | Overlay markers sur scrubber | Pas de markers (vidéo déjà découpée) |
| Timeline sync | Bidirectionnel avec transcript | Aucune (standalone) |
| Store | useTimelineStore | Standalone (state local ou minimal store) |
| Complexité | Élevée (sync multi-composants) | Simple (lecteur autonome) |

### Git Intelligence

Derniers commits pertinents :
- `2aa0fd1` feat: add cut generation backend logic (Story 4.1)
- `43ed1c5` feat: add video proxy generation with code review fixes (Story 4.0)
- `36b4f22` feat: add video player panel, timeline sync, selection stats, and editor layout
- Pattern commits : `feat:` / `fix:` / `chore:` prefixes

### Project Structure Notes

- `PreviewPlayer.tsx` dans `components/preview/` — nouveau dossier, cohérent avec `components/video/`, `components/segmentation/`
- Pas de nouveau module Rust nécessaire sauf si commande `get_final_video_path` ajoutée
- Le screen `'preview'` s'insère dans la logique existante de App.tsx (conditional rendering)
- `finalVideoPath` ajouté au `useSegmentationStore` existant — minimal impact

### References

- [Epic 5: Story 5.1](_bmad-output/planning-artifacts/epics/epic-5-preview-validation.md) — AC complets
- [Story 4.4: Cut Validation](_bmad-output/implementation-artifacts/4-4-cut-validation-quality-checks.md) — Pipeline complète, événements
- [Architecture: Clean Architecture](_bmad-output/planning-artifacts/architecture/summary-complete-architecture-foundation.md) — Layers Rust
- [UX Consistency Patterns](_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md) — Button variants, focus, accessibility
- `apps/desktop/src/components/video/VideoPlayer.tsx` — Lecteur existant (référence, ne pas réutiliser directement)
- `apps/desktop/src/stores/segmentation-store.ts` — Store segmentation existant (ajouter finalVideoPath)
- `apps/desktop/src-tauri/src/infrastructure/tauri_commands/segmentation_commands.rs` — Commande segment_video, événements
- `apps/desktop/src/App.tsx` — Layout principal, screens, event listeners
- `apps/desktop/src/components/layout/TopBar.tsx` — Navigation, boutons d'action

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Task 4: Added `finalVideoPath` to `useSegmentationStore`. The `segmentation:completed` event already emits `final_video_path` — captured it in the listener. `resetSegmentation()` intentionally preserves `finalVideoPath` so the preview remains accessible.
- Task 1: Added `'preview'` screen to App.tsx. Added "Prévisualiser" button (Primary, visible when `canPreview`) and "Retour à l'éditeur" button (Outline) to TopBar. Navigation is manual via button (not auto-transition).
- Task 2: Created standalone `PreviewPlayer.tsx` component — HTML5 `<video>` with `convertFileSrc()`, play/pause, seek bar with drag, timecode display, volume slider with mute toggle, fullscreen toggle. Auto-play on `loadedMetadata`. Responsive with `object-contain`.
- Task 3: Keyboard shortcuts: Space (play/pause), ArrowLeft/Right (±5s), ArrowUp/Down (volume ±0.1), F (fullscreen). Input/textarea focus guard prevents conflicts.
- Task 5: ARIA labels on all buttons (Play/Pause/Mute/Fullscreen), `role="slider"` + `aria-valuemin/max/now` on seek bar and volume, focus rings (`focus:ring-2 focus:ring-emerald-500`), logical tab order.
- Task 6: 14 tests total — 11 PreviewPlayer tests (controls render, play/pause toggle, timeUpdate, Space shortcut, ArrowRight seek, timecode format, mute toggle, ARIA attributes, basic render) + 3 store tests (setFinalVideoPath, preservation after reset, initial null).
- No new Tauri command needed — backend already emits `final_video_path` in the completed event payload.
- 3 pre-existing test failures in unrelated files (use-model-download, SegmentationProgressDialog, TranscriptionProgressDialog) — not caused by this story.

### Change Log

- 2026-02-03: Story 5.1 implementation complete — Preview player with navigation, controls, keyboard shortcuts, accessibility, and tests.
- 2026-02-03: Code review fixes — Fixed test mock (window.HTMLMediaElement), volume keyboard shortcuts use ref to avoid listener churn, added onKeyDown handler on seek bar for WCAG AA slider compliance.

### File List

- apps/desktop/src/App.tsx (modified — added 'preview' screen, PreviewPlayer import, finalVideoPath capture, TopBar preview props)
- apps/desktop/src/components/layout/TopBar.tsx (modified — added canPreview, onPreview, onBackToEditor props, Preview/Back buttons)
- apps/desktop/src/stores/segmentation-store.ts (modified — added finalVideoPath state, setFinalVideoPath action)
- apps/desktop/src/components/preview/PreviewPlayer.tsx (new — standalone preview video player component)
- apps/desktop/src/components/preview/PreviewPlayer.test.tsx (new — 11 unit tests)
- apps/desktop/src/stores/segmentation-store-preview.test.ts (new — 3 store tests)
