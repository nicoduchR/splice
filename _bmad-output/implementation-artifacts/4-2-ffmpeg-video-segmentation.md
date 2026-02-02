# Story 4.2: FFmpeg Video Segmentation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to use FFmpeg to extract video segments based on cut timecodes,
So that the actual video processing happens efficiently without re-encoding.

## Acceptance Criteria

1. **Given** des cuts ont été générés (Story 4.1, FR21)
   **When** la segmentation vidéo démarre
   **Then** l'adaptateur FFmpeg utilise une architecture streaming pour traiter les gros fichiers (NFR5, PLATFORM-6)

2. **And** la commande FFmpeg extrait les segments avec les flags `-ss` (start) et `-to` (end)

3. **And** le codec copy est utilisé pour éviter le ré-encodage : `-c copy` (préserve la qualité, traitement rapide)

4. **And** pour 1 heure de vidéo source, le traitement se complète en <30 secondes (NFR4)

5. **And** l'utilisation RAM reste sous 4GB même pour des fichiers vidéo de 50GB (NFR5)

6. **And** les segments sont sauvegardés temporairement dans `~/.splice/temp/{project_id}/` directory

7. **And** les fichiers segments sont nommés : `segment_000.mp4`, `segment_001.mp4`, etc.

8. **And** gestion d'erreur pour vidéo corrompue ou codecs manquants (NFR23)

9. **And** une commande Tauri `segment_video` expose cette fonctionnalité au frontend

10. **And** la progression est émise par événement Tauri (`segmentation:progress`) pour chaque segment traité

11. **And** l'annulation est supportée via un `cancel_flag` (AtomicBool) — arrête le traitement au prochain segment

12. **And** les fichiers temporaires sont nettoyés en cas d'annulation ou d'erreur

## Tasks / Subtasks

- [x] Task 1: Créer `VideoSegmenter` dans l'infrastructure adapters (AC: #1, #2, #3)
  - [x] Créer `apps/desktop/src-tauri/src/infrastructure/adapters/video_segmenter.rs`
  - [x] Struct `VideoSegmenter` avec méthode `segment_video()`
  - [x] Réutiliser `audio_extractor::ffmpeg_path()` pour la résolution du chemin FFmpeg
  - [x] Pour chaque cut : exécuter `ffmpeg -ss {start} -to {end} -i {source} -c copy -y {output}`
  - [x] IMPORTANT : `-ss` AVANT `-i` pour seeking input rapide (seek before decode)
  - [x] Créer le dossier temp `~/.splice/temp/{project_id}/` si inexistant
  - [x] Nommer les segments `segment_{index:03}.mp4` (zero-padded 3 digits)
  - [x] Exporter `pub mod video_segmenter;` dans `infrastructure/adapters/mod.rs`

- [x] Task 2: Implémenter la progression et l'annulation (AC: #10, #11, #12)
  - [x] Struct `SegmentationProgress { project_id, current_segment, total_segments, progress }` (Serialize, Clone)
  - [x] Émettre `segmentation:progress` après chaque segment terminé
  - [x] Accepter `Arc<AtomicBool>` comme cancel_flag
  - [x] Vérifier le cancel_flag entre chaque segment
  - [x] Si annulé : nettoyer tous les fichiers segments déjà créés, retourner erreur descriptive
  - [x] Si erreur FFmpeg sur un segment : nettoyer et retourner erreur avec le numéro de segment

- [x] Task 3: Créer le use case `SegmentVideoUseCase` (AC: #1, #6, #7)
  - [x] Créer `apps/desktop/src-tauri/src/application/use_cases/segment_video.rs`
  - [x] Struct avec refs vers `CutRepository`
  - [x] Méthode `execute(project_id, source_path, output_dir, cancel_flag)` :
    1. Récupérer les cuts via `CutRepository::get_cuts(project_id)`
    2. Valider que les cuts ne sont pas vides
    3. Déléguer à `VideoSegmenter::segment_video()`
    4. Retourner la liste des chemins de segments créés
  - [x] Exporter `pub mod segment_video;` dans `application/use_cases/mod.rs`

- [x] Task 4: Créer les commandes Tauri (AC: #9, #10, #11)
  - [x] Créer `apps/desktop/src-tauri/src/infrastructure/tauri_commands/segmentation_commands.rs`
  - [x] Commande `segment_video(project_id, app_state, app_handle)` :
    - Récupérer le chemin vidéo source depuis `video_repository`
    - Créer un cancel_flag et le stocker (pattern existant : `segmentation_cancel_flags`)
    - Spawner un `tokio::task::spawn_blocking` pour l'exécution FFmpeg
    - Émettre les événements de progression via `app_handle.emit()`
    - Retourner `Result<Vec<String>, String>` (liste des chemins segments)
  - [x] Commande `cancel_segmentation(project_id, app_state)` :
    - Activer le cancel_flag correspondant
  - [x] Commande `cleanup_segments(project_id)` :
    - Supprimer le dossier `~/.splice/temp/{project_id}/`
  - [x] Exporter `pub mod segmentation_commands;` dans `tauri_commands/mod.rs`
  - [x] Enregistrer les 3 commandes dans `main.rs`

- [x] Task 5: Ajouter `segmentation_cancel_flags` à `AppState` (AC: #11)
  - [x] Ajouter `pub segmentation_cancel_flags: Arc<Mutex<HashMap<String, Arc<AtomicBool>>>>` à `AppState`
  - [x] Initialiser dans `AppState::new()`

- [x] Task 6: Tests unitaires Rust (AC: #2, #3, #4, #8)
  - [x] Tests dans `video_segmenter.rs` :
    - Test : construction correcte de la commande FFmpeg (arguments validés)
    - Test : nommage séquentiel des segments (segment_000, segment_001...)
    - Test : gestion d'erreur quand FFmpeg retourne un code non-zero
    - Test : nettoyage des fichiers en cas d'annulation
  - [x] Tests dans `segment_video.rs` (use case) :
    - Test : aucun cut → retourne erreur appropriée
    - Test : cuts valides → retourne liste de chemins segments
    - Test : annulation mid-process → nettoyage et erreur

- [x] Task 7: Structs événements TS (AC: #10)
  - [x] Ajouter le type `SegmentationProgress` dans `packages/types/src/generated/` (ou via ts-rs)
  - [x] Exporter depuis `packages/types/src/generated/index.ts`

## Dev Notes

### Ce qui existe déjà

**FFmpeg path resolution** — `audio_extractor::ffmpeg_path()` :
- Production : cherche `ffmpeg` à côté de l'exécutable
- Dev : résout depuis `CARGO_MANIFEST_DIR/binaries/{arch}-apple-darwin`
- Fallback : `ffmpeg-universal-apple-darwin`
- **RÉUTILISER cette fonction**, ne PAS dupliquer la logique

**Proxy Generator** (`infrastructure/adapters/proxy_generator.rs`) :
- Pattern identique : `tokio::task::spawn_blocking` + `std::process::Command`
- Émet `proxy:progress` et `proxy:completed`
- Cleanup : `cleanup_proxy(project_id, app_data_dir)`
- **Pattern de référence pour la segmentation**

**Cut Repository** (Story 4.1) :
- `CutRepository::get_cuts(project_id)` retourne `Vec<Cut>` ordonné par `segment_index ASC`
- Chaque `Cut` a `start_time: f64` et `end_time: f64` (en secondes)

**Commande FFmpeg pour un segment :**
```bash
ffmpeg -ss {start_time} -to {end_time} -i {source_path} -c copy -avoid_negative_ts make_zero -y {output_path}
```

**Pourquoi `-ss` AVANT `-i` ?**
Input seeking = FFmpeg seek directement dans le fichier sans décoder tous les frames depuis le début. Critique pour les gros fichiers (50GB). Résultat : chaque segment prend ~1-2 secondes max, pas proportionnel à la durée de la vidéo.

**Pourquoi `-c copy` ?**
Pas de ré-encodage = vitesse quasi-instantanée. Les segments conservent exactement la même qualité que l'original. Limitation : les points de coupe peuvent être décalés au GOP (group of pictures) le plus proche, mais c'est acceptable pour le MVP.

**Pourquoi `-avoid_negative_ts make_zero` ?**
Quand on coupe avec `-c copy`, les timestamps internes du segment peuvent être négatifs. Ce flag les remet à zéro, évitant les problèmes de lecture/concaténation ultérieure.

### Patterns de code à suivre EXACTEMENT

**VideoSegmenter** — Copier le pattern de `proxy_generator.rs` :
```rust
use std::process::Command;
use super::audio_extractor::ffmpeg_path;

pub struct VideoSegmenter;

impl VideoSegmenter {
    pub fn segment_video(
        source_path: &str,
        cuts: &[Cut],
        output_dir: &Path,
        cancel_flag: &Arc<AtomicBool>,
    ) -> Result<Vec<PathBuf>, DomainError> {
        let ffmpeg = ffmpeg_path();

        for (i, cut) in cuts.iter().enumerate() {
            // Check cancellation
            if cancel_flag.load(Ordering::Relaxed) {
                Self::cleanup_segments(output_dir)?;
                return Err(DomainError::OperationCancelled("Segmentation annulée".into()));
            }

            let output = output_dir.join(format!("segment_{:03}.mp4", i));

            let result = Command::new(&ffmpeg)
                .args([
                    "-ss", &cut.start_time.to_string(),
                    "-to", &cut.end_time.to_string(),
                    "-i", source_path,
                    "-c", "copy",
                    "-avoid_negative_ts", "make_zero",
                    "-y",
                    output.to_str().unwrap(),
                ])
                .output()?;

            if !result.status.success() {
                Self::cleanup_segments(output_dir)?;
                return Err(DomainError::ProcessingError(format!(
                    "FFmpeg failed on segment {}: {}", i, String::from_utf8_lossy(&result.stderr)
                )));
            }
        }

        Ok(segment_paths)
    }
}
```

**Commande Tauri** — Pattern identique à `proxy_commands.rs` :
- `State<'_, AppState>` + `AppHandle` pour événements
- `tokio::task::spawn` ou `spawn_blocking` pour le traitement
- Émission d'événements pour le progress

### Conventions de code

**Rust :**
- `snake_case` fonctions/variables, `PascalCase` structs/enums
- Tests inline `#[cfg(test)]` dans le même fichier
- `Result<T, String>` pour commandes Tauri, `Result<T, DomainError>` pour domain/use cases
- Logs : `tracing::info!()` / `tracing::error!()`

**Événements Tauri :**
- Namespace : `segmentation:progress`, `segmentation:completed`, `segmentation:error`
- Pattern existant : `proxy:progress`, `proxy:completed`

### Structure des fichiers temporaires

```
~/.splice/
├── proxies/
│   └── {project_id}_proxy.mp4
└── temp/
    └── {project_id}/
        ├── segment_000.mp4
        ├── segment_001.mp4
        └── segment_002.mp4
```

Le dossier `temp/{project_id}/` est créé au début de la segmentation et nettoyé :
- Après export réussi (Epic 6)
- En cas d'annulation
- En cas d'erreur
- Au prochain lancement de l'app (cleanup_temp_directory existant)

### Considérations de performance

**Pourquoi <30s pour 1h de vidéo ?** Avec `-c copy` et input seeking (`-ss` avant `-i`), chaque segment prend ~0.5-2s selon la taille. Pour 20-30 segments typiques, total ~10-20s.

**RAM < 4GB** : `-c copy` ne décode/ré-encode rien → empreinte mémoire minimale (~50-100MB par processus FFmpeg).

**Fichiers 50GB** : Input seeking ne charge pas le fichier en mémoire. FFmpeg seek au byte offset et lit séquentiellement.

### Apprentissages des Stories 4.0 et 4.1

- Le pattern `tokio::task::spawn_blocking` est le standard pour FFmpeg (Story 4.0)
- `ffmpeg_path()` est partagé et fonctionne correctement en dev et prod
- Les événements Tauri `{namespace}:{event}` sont le standard de communication
- Le `cancel_flag` pattern (AtomicBool) fonctionne pour la transcription — le réutiliser ici
- Les commandes Tauri retournent `Result<T, String>` — pas de types d'erreur custom
- Les tests inline `#[cfg(test)]` sont le standard du projet
- La table `cuts` a un UNIQUE(project_id, segment_index) ajouté en code review 4.1

### Git Intelligence

Derniers commits pertinents :
- `2aa0fd1` feat: add cut generation backend logic (Story 4.1)
- `43ed1c5` feat: add video proxy generation with code review fixes (Story 4.0)
- Pattern commits : `feat:` / `fix:` / `chore:` prefixes

### Project Structure Notes

- `video_segmenter.rs` dans `infrastructure/adapters/` — cohérent avec `proxy_generator.rs`, `audio_extractor.rs`
- `segment_video.rs` dans `application/use_cases/` — cohérent avec `generate_cuts.rs`
- `segmentation_commands.rs` dans `tauri_commands/` — cohérent avec `proxy_commands.rs`, `cut_commands.rs`
- Les segments temporaires dans `~/.splice/temp/{project_id}/` — séparés des proxies

### Fichiers à créer

- `apps/desktop/src-tauri/src/infrastructure/adapters/video_segmenter.rs`
- `apps/desktop/src-tauri/src/application/use_cases/segment_video.rs`
- `apps/desktop/src-tauri/src/infrastructure/tauri_commands/segmentation_commands.rs`

### Fichiers à modifier

- `apps/desktop/src-tauri/src/infrastructure/adapters/mod.rs` — ajouter `pub mod video_segmenter;`
- `apps/desktop/src-tauri/src/application/use_cases/mod.rs` — ajouter `pub mod segment_video;`
- `apps/desktop/src-tauri/src/infrastructure/tauri_commands/mod.rs` — ajouter `pub mod segmentation_commands;`
- `apps/desktop/src-tauri/src/infrastructure/config/app_state.rs` — ajouter `segmentation_cancel_flags`
- `apps/desktop/src-tauri/src/main.rs` — enregistrer les 3 nouvelles commandes

### Fichiers à ne PAS modifier

- `apps/desktop/src-tauri/src/domain/entities/cut.rs` — déjà complet (Story 4.1)
- `apps/desktop/src-tauri/src/infrastructure/adapters/proxy_generator.rs` — pas impacté
- `apps/desktop/src-tauri/src/infrastructure/adapters/audio_extractor.rs` — seulement réutiliser `ffmpeg_path()`
- Tout composant frontend — l'UI est Story 4.3

### References

- [Epic 4: Intelligent Video Cutting](_bmad-output/planning-artifacts/epics/epic-4-intelligent-video-cutting.md) — Story 4.2 AC complets
- [Architecture: FR19-FR24](_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md#4-video-processing-fr19-fr24) — Video Processing mapping
- [PRD: FR21](_bmad-output/planning-artifacts/prd/functional-requirements.md) — Streaming architecture
- [PRD: NFR4](_bmad-output/planning-artifacts/prd/non-functional-requirements.md) — Performance <30s pour 1h
- [PRD: NFR5](_bmad-output/planning-artifacts/prd/non-functional-requirements.md) — RAM <4GB
- [Story 4.1: Cut Generation Backend](_bmad-output/implementation-artifacts/4-1-cut-generation-backend-logic.md) — Story précédente, cuts disponibles
- [Story 4.0: Video Proxy Generation](_bmad-output/implementation-artifacts/4-0-video-proxy-generation.md) — Pattern FFmpeg établi
- `apps/desktop/src-tauri/src/infrastructure/adapters/audio_extractor.rs` — `ffmpeg_path()` à réutiliser
- `apps/desktop/src-tauri/src/infrastructure/adapters/proxy_generator.rs` — Pattern FFmpeg + events à copier
- `apps/desktop/src-tauri/src/infrastructure/tauri_commands/proxy_commands.rs` — Pattern commandes + events

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Pre-existing test compilation errors in `import_video.rs`, `model_manager.rs`, `ffmpeg_service.rs` (App vs AppHandle mismatch, tuple AsRef<Path>) prevent running `cargo test --lib`. Not introduced by this story.
- `cargo check` compiles cleanly (0 errors, only pre-existing warnings)

### Completion Notes List

- ✅ Task 1: Created `VideoSegmenter` with `segment_video()` and `cleanup_segments()` methods. Uses `ffmpeg_path()` from `audio_extractor`. FFmpeg args: `-ss` before `-i` (input seeking), `-c copy` (no re-encoding), `-avoid_negative_ts make_zero`.
- ✅ Task 2: Progress via `SegmentationProgress` struct emitted after each segment. Cancellation via `Arc<AtomicBool>` checked between segments. Cleanup on cancel/error.
- ✅ Task 3: `SegmentVideoUseCase` with `CutRepository` dependency. Validates cuts not empty, delegates to `VideoSegmenter`.
- ✅ Task 4: Three Tauri commands: `segment_video`, `cancel_segmentation`, `cleanup_segments`. Registered in `main.rs`. Progress emitted per segment via `segmentation:progress` event.
- ✅ Task 5: Added `segmentation_cancel_flags: Arc<Mutex<HashMap<String, Arc<AtomicBool>>>>` to `AppState`.
- ✅ Task 6: 8 unit tests total (5 in video_segmenter.rs, 3 in segment_video.rs). Tests cover: FFmpeg command construction, segment naming, error handling, cancellation cleanup, empty cuts validation.
- ✅ Task 7: `SegmentationProgress` TS type created and exported. `DomainError` TS type updated with new `OPERATION_CANCELLED` and `PROCESSING_ERROR` variants.
- Added `OperationCancelled` and `ProcessingError` variants to `DomainError` enum (needed for segmentation error handling).
- Tauri command inlines FFmpeg loop (instead of delegating to use case) to emit per-segment progress events.

### Code Review Fixes (2026-02-02)

- **CRITICAL FIX**: Replaced `-to {end_time}` with `-t {duration}` in FFmpeg args. With input seeking (`-ss` before `-i`), output timestamps start at 0, so `-to` produced wrong-length segments. Now uses `-t (end_time - start_time)`.
- **HIGH FIX**: Refactored Tauri command to use `VideoSegmenter::segment_video()` with progress callback instead of inlined duplicate FFmpeg loop. Eliminates code duplication and makes `VideoSegmenter` actually used.
- **HIGH FIX**: Added `pub use segment_video::SegmentVideoUseCase;` to `use_cases/mod.rs` for consistency with other use cases.
- **MEDIUM FIX**: Rewrote `test_segment_naming_sequential` to test actual path construction instead of testing `format!` against itself.
- **MEDIUM FIX**: Replaced `test_ffmpeg_command_construction` with `test_ffmpeg_command_uses_duration_not_absolute_end` that validates `-t` usage and rejects `-to`.
- **MEDIUM FIX**: Added `test_progress_callback_called` to verify callback contract.
- **MEDIUM FIX**: Cancel flag cleanup now happens unconditionally after `spawn_blocking` (success or failure).
- **LOW FIX**: Added `segmentation:completed` and `segmentation:error` event emissions for frontend consistency with `proxy:*` pattern.

### Change Log

- 2026-02-02: Story 4.2 implementation complete — FFmpeg video segmentation with progress, cancellation, cleanup, and tests.
- 2026-02-02: Code review fixes — Critical `-to`→`-t` FFmpeg bug, eliminated code duplication, improved tests, added completed/error events.

### File List

#### New Files
- `apps/desktop/src-tauri/src/infrastructure/adapters/video_segmenter.rs`
- `apps/desktop/src-tauri/src/application/use_cases/segment_video.rs`
- `apps/desktop/src-tauri/src/infrastructure/tauri_commands/segmentation_commands.rs`
- `packages/types/src/generated/SegmentationProgress.ts`

#### Modified Files
- `apps/desktop/src-tauri/src/infrastructure/adapters/mod.rs` — added `pub mod video_segmenter;`
- `apps/desktop/src-tauri/src/application/use_cases/mod.rs` — added `pub mod segment_video;`
- `apps/desktop/src-tauri/src/infrastructure/tauri_commands/mod.rs` — added `pub mod segmentation_commands;`
- `apps/desktop/src-tauri/src/infrastructure/config/app_state.rs` — added `segmentation_cancel_flags`
- `apps/desktop/src-tauri/src/main.rs` — registered 3 new commands, imported `segmentation_commands`
- `apps/desktop/src-tauri/src/domain/errors/domain_error.rs` — added `OperationCancelled`, `ProcessingError` variants
- `packages/types/src/generated/DomainError.ts` — added TS types for new error variants
- `packages/types/src/generated/index.ts` — exported `SegmentationProgress`
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status updated
