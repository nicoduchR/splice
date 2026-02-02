# Story 4.4: Cut Validation & Quality Checks

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to validate generated cuts for quality and integrity,
So that users don't get corrupted or invalid video segments.

## Acceptance Criteria

1. **Given** des cuts ont été traités par FFmpeg (Story 4.2)
   **When** la validation s'exécute automatiquement après la segmentation
   **Then** chaque segment est vérifié :
   - Le fichier existe et est lisible
   - La durée correspond à la longueur attendue du cut (±0.5s de tolérance)
   - Le codec vidéo est valide (H.264/H.265)
   - Aucune corruption détectée (FFprobe retourne des métadonnées valides)

2. **And** les segments sont vérifiés comme concaténables (codecs, résolution, frame rate compatibles)

3. **And** si un segment échoue la validation, une erreur est rapportée : "Segment X invalide, régénération..."

4. **And** les segments échoués sont automatiquement régénérés (logique de retry, max 2 tentatives)

5. **And** toute la validation se termine avant que le preview soit disponible

6. **And** la validation est loguée pour le debugging (NFR21 — logs sans données sensibles)

## Tasks / Subtasks

- [x] Task 1: Créer le module de validation `segment_validator.rs` (AC: #1, #2, #6)
  - [x] Créer `apps/desktop/src-tauri/src/infrastructure/adapters/segment_validator.rs`
  - [x] Implémenter `validate_segment(segment_path, expected_duration) -> Result<SegmentValidation, DomainError>`
  - [x] Utiliser FFprobe (`ffprobe -v error -show_format -show_streams -of json <path>`) pour extraire les métadonnées
  - [x] Vérifier : fichier existe, durée ±0.5s, codec vidéo H.264/H.265, pas d'erreur FFprobe
  - [x] Implémenter `validate_segments_compatible(segments: &[SegmentValidation]) -> Result<(), DomainError>` pour vérifier la compatibilité de concaténation (résolution, codec, frame rate identiques)
  - [x] Ajouter tracing (info/warn/error) pour chaque étape de validation

- [x] Task 2: Créer l'entité `SegmentValidation` et les erreurs de domaine (AC: #1, #3)
  - [x] Créer `SegmentValidation` struct dans le domaine : `{ path, duration, codec, width, height, frame_rate, is_valid, error_message }`
  - [x] Ajouter les variants d'erreur dans `DomainError` : `SegmentValidationFailed { segment_index: usize, reason: String }`, `SegmentRegenerationFailed { segment_index: usize, attempts: usize }`
  - [x] Exporter les types vers TypeScript via `ts_rs`

- [x] Task 3: Créer le use case `validate_segments.rs` (AC: #1, #2, #3, #4, #5)
  - [x] Créer `apps/desktop/src-tauri/src/application/use_cases/validate_segments.rs`
  - [x] Logique : pour chaque segment, valider → si échec, régénérer (max 2 retries) → revalider
  - [x] Régénération : réutiliser `VideoSegmenter::segment_single(source_path, cut, output_path, cancel_flag)` (nouvelle méthode helper)
  - [x] Vérification de compatibilité entre tous les segments validés
  - [x] Retourner `Result<Vec<SegmentValidation>, DomainError>` avec le résultat de chaque segment

- [x] Task 4: Intégrer la validation dans le flux de segmentation (AC: #5)
  - [x] Modifier `segment_video` dans `segmentation_commands.rs` pour appeler la validation après la segmentation
  - [x] Émettre un nouvel événement `segmentation:validating` avec progression (segment en cours de validation)
  - [x] Si validation échoue après retries, émettre `segmentation:error` avec détails du segment échoué
  - [x] Si validation réussit, émettre `segmentation:completed` comme actuellement

- [x] Task 5: Mettre à jour le frontend pour la phase de validation (AC: #3, #5)
  - [x] Mettre à jour `useSegmentationStore` : ajouter état `isValidating`, `validationProgress`
  - [x] Mettre à jour `SegmentationProgressDialog` : afficher "Validation des segments..." après la segmentation
  - [x] Écouter `segmentation:validating` dans `App.tsx`
  - [x] Afficher les erreurs de validation dans le toast si la régénération échoue

- [x] Task 6: Tests unitaires Rust (AC: #1, #2, #3, #4, #6)
  - [x] Test `validate_segment` : fichier valide → `is_valid: true`
  - [x] Test `validate_segment` : fichier inexistant → erreur `FileNotFound`
  - [x] Test `validate_segment` : durée hors tolérance → `is_valid: false` avec raison
  - [x] Test `validate_segments_compatible` : segments compatibles → Ok
  - [x] Test `validate_segments_compatible` : résolutions différentes → erreur
  - [x] Test use case : retry logic → segment régénéré après premier échec
  - [x] Test use case : max retries dépassé → erreur `SegmentRegenerationFailed`

- [ ] Task 7: Tests unitaires TypeScript (AC: #3, #5)
  - [x] Test store : `isValidating` passe à true pendant validation
  - [x] Test store : progression validation mise à jour
  - [x] Test composant : affichage "Validation des segments..." dans le dialog

## Dev Notes

### Ce qui existe déjà (backend Story 4.2 — base pour la validation)

**VideoSegmenter** (`infrastructure/adapters/video_segmenter.rs`) :
- `segment_video()` retourne `Vec<PathBuf>` avec les chemins des segments créés
- FFmpeg utilise `-c copy` (stream copy) — les segments gardent le codec original
- Les segments sont dans `~/.splice/temp/{project_id}/segment_NNN.mp4`
- Nettoyage automatique en cas d'erreur via `cleanup_segments()`

**FFmpeg/FFprobe :**
- FFmpeg est bundlé comme sidecar Tauri dans `binaries/`
- FFprobe est dans le même répertoire que FFmpeg (même binary set)
- Résolution du chemin via `ffmpeg_path()` dans `audio_extractor.rs` — réutiliser le pattern pour `ffprobe_path()`
- FFprobe n'est PAS encore dans le projet — vérifier s'il est bundlé, sinon utiliser `ffmpeg -i` comme fallback pour les métadonnées

**Commande FFprobe pour validation :**
```bash
ffprobe -v error -show_format -show_streams -of json segment_001.mp4
```
Retourne JSON avec : `format.duration`, `streams[0].codec_name`, `streams[0].width`, `streams[0].height`, `streams[0].r_frame_rate`

**Alternative si FFprobe absent — utiliser FFmpeg :**
```bash
ffmpeg -i segment_001.mp4 -f null -
```
Retourne les infos de base dans stderr et détecte les erreurs de corruption.

**Cut entity** (`domain/entities/cut.rs`) :
```rust
pub struct Cut {
    pub id: String,
    pub project_id: String,
    pub segment_index: i64,
    pub start_time: f64,
    pub end_time: f64,
    pub created_at: i64,
}
```
La durée attendue = `end_time - start_time` pour comparer avec la durée réelle du segment.

**Événements Tauri pattern :**
- `segmentation:progress` — `{ project_id, current_segment, total_segments, progress }`
- `segmentation:completed` — émis à la fin
- `segmentation:error` — émis en cas d'erreur
- NOUVEAU : `segmentation:validating` — `{ project_id, current_segment, total_segments }`

### Pattern de la segmentation actuelle (`segmentation_commands.rs`)

Le flux actuel dans la commande `segment_video` :
1. Valider project_id
2. Récupérer le projet et les cuts
3. Créer le cancel flag
4. Créer le répertoire output
5. Émettre progression initiale
6. Spawner la segmentation en `spawn_blocking`
7. Nettoyer le cancel flag
8. Émettre completed/error

**Point d'insertion de la validation :** Entre l'étape 6 (segmentation terminée) et l'étape 8 (emit completed). Après le retour des segments, lancer la validation avant d'émettre `segmentation:completed`.

### Méthode helper pour régénération d'un seul segment

Actuellement `VideoSegmenter::segment_video()` traite tous les cuts. Pour le retry, il faut extraire une méthode :
```rust
pub fn segment_single(
    source_path: &str,
    cut: &Cut,
    output_path: &Path,
    cancel_flag: &Arc<AtomicBool>,
) -> Result<PathBuf, DomainError>
```
Qui réutilise la même logique FFmpeg mais pour un seul segment.

### Conventions de code Rust

- Clean Architecture : `domain/` → `application/use_cases/` → `infrastructure/adapters/`
- Errors : `DomainError` enum avec variants spécifiques, sérialisé via `serde` + `ts_rs`
- Tests : `#[cfg(test)] mod tests` en bas de fichier, `#[test]` synchrone, `#[tokio::test]` async
- Tracing : `tracing::info!()`, `tracing::warn!()`, `tracing::error!()`
- Pas de données sensibles dans les logs (NFR21)

### Conventions TypeScript/React

- Store Zustand : `create<T>()` avec `devtools()` middleware
- Events Tauri : `listen<T>('domain:action', callback)` avec cleanup
- Toast : `toast.success()` / `toast.error()` via sonner
- Tests : `.test.ts` / `.test.tsx` côte à côte

### Apprentissages des Stories précédentes

**Story 4.2 (FFmpeg Segmentation) :**
- CRITICAL : FFmpeg utilise `-t` (durée) et NON `-to` (position absolue) — bug corrigé en code review
- `-ss` avant `-i` pour fast seeking (demux level, pas decode level)
- `-avoid_negative_ts make_zero` pour fixer les problèmes de timestamps
- `-c copy` preserve la qualité et accélère le traitement (pas de re-encoding)

**Story 4.3 (UI Progress) :**
- Le dialog de progression est déjà en place — il suffit d'ajouter l'état de validation
- Le store `useSegmentationStore` a déjà `isSegmenting`, `segmentationProgress`, `error`
- Les events sont écoutés dans `App.tsx` avec cleanup

**Code Review 4.2 :**
- La commande Tauri utilise maintenant `VideoSegmenter::segment_video()` au lieu de dupliquer la logique
- Events `segmentation:completed` et `segmentation:error` ajoutés

### Git Intelligence

Derniers commits pertinents :
- `2aa0fd1` feat: add cut generation backend logic (Story 4.1) — schema cuts, repository, use case
- `43ed1c5` feat: add video proxy generation with code review fixes (Story 4.0) — FFmpeg pattern
- Pattern commits : `feat:` / `fix:` / `chore:` prefixes

### FFprobe Availability

**IMPORTANT :** Vérifier si `ffprobe` est bundlé avec FFmpeg dans `binaries/`. Si non :
- Option A : Bundler ffprobe comme sidecar additionnel
- Option B : Utiliser `ffmpeg -i <file> 2>&1` pour extraire les métadonnées (moins précis mais fonctionne)
- Option C : Vérifier simplement que le fichier existe et a une taille > 0 (validation minimale)

**Recommandation :** Option B comme fallback si ffprobe n'est pas disponible, car FFmpeg est déjà bundlé.

### Project Structure Notes

- `segment_validator.rs` dans `infrastructure/adapters/` — cohérent avec `video_segmenter.rs`, `audio_extractor.rs`
- `validate_segments.rs` dans `application/use_cases/` — cohérent avec `segment_video.rs`, `generate_cuts.rs`
- Les nouveaux types dans `domain/` — cohérent avec l'architecture clean existante
- Pas de nouveau module `domain/repositories/` nécessaire — la validation opère sur les fichiers, pas sur la DB

### References

- [Epic 4: Story 4.4](_bmad-output/planning-artifacts/epics/epic-4-intelligent-video-cutting.md) — AC complets
- [Story 4.2: FFmpeg Segmentation](_bmad-output/implementation-artifacts/4-2-ffmpeg-video-segmentation.md) — Backend segmentation, VideoSegmenter
- [Story 4.3: Cut Processing UI](_bmad-output/implementation-artifacts/4-3-cut-processing-ui-with-progress.md) — UI pattern, store, events
- [Architecture: Clean Architecture Layers](_bmad-output/planning-artifacts/architecture/summary-complete-architecture-foundation.md) — 3 layers Rust
- [PRD: NFR21](_bmad-output/planning-artifacts/prd) — Logs sans données sensibles
- `apps/desktop/src-tauri/src/infrastructure/adapters/video_segmenter.rs` — VideoSegmenter existant
- `apps/desktop/src-tauri/src/infrastructure/adapters/audio_extractor.rs:7-40` — FFmpeg path resolution pattern
- `apps/desktop/src-tauri/src/infrastructure/tauri_commands/segmentation_commands.rs` — Commandes Tauri existantes
- `apps/desktop/src-tauri/src/domain/errors/domain_error.rs` — Error types existants
- `apps/desktop/src-tauri/src/domain/entities/cut.rs` — Cut entity
- `apps/desktop/src/stores/segmentation-store.ts` — Store frontend existant
- `apps/desktop/src/components/segmentation/SegmentationProgressDialog.tsx` — Dialog existant

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Task 1: Créé `segment_validator.rs` avec `validate_segment()` (FFprobe) et `validate_segments_compatible()`. FFprobe bundlé confirmé. 5 tests unitaires.
- Task 2: Créé entité `SegmentValidation` avec ts_rs export. Ajouté variants `SegmentValidationFailed` et `SegmentRegenerationFailed` dans DomainError.
- Task 3: Créé use case `validate_segments.rs` avec retry logic (max 2 tentatives) via `VideoSegmenter::segment_single()`. 2 tests unitaires.
- Task 4: Intégré validation dans `segmentation_commands.rs` — après segmentation, émet `segmentation:validating` puis valide avant `segmentation:completed`.
- Task 5: Ajouté `isValidating`/`validationProgress` au store, écouteur `segmentation:validating` dans App.tsx, affichage validation dans le dialog.
- Task 6: 5 tests Rust dans segment_validator (file_not_found, valid_file, duration_tolerance, compatible, different_resolution), 2 tests dans validate_segments use case.
- Task 7: 3 nouveaux tests store (isValidating, validationProgress, initial state) + 2 tests composant (validation title, segmentation title). 17/17 tests segmentation passent.

### Change Log

- 2026-02-02: Implémentation Story 4.4 — Validation des segments vidéo avec FFprobe, retry logic, UI validation phase.
- 2026-02-02: Code Review — 8 issues corrigées (4 HIGH, 4 MEDIUM): fix double move closure, fix event payload mismatch frontend/backend, ajout guard segments==cuts, fix non-UTF8 path, déduplication ValidationProgress interface, fix ETA pendant validation, tests fixture CI-aware, ajout cancel_flag dans validation loop.

### File List

**Nouveaux fichiers:**
- apps/desktop/src-tauri/src/domain/entities/segment_validation.rs
- apps/desktop/src-tauri/src/infrastructure/adapters/segment_validator.rs
- apps/desktop/src-tauri/src/application/use_cases/validate_segments.rs
- packages/types/src/generated/SegmentValidation.ts
- packages/types/src/generated/SegmentationProgress.ts

**Fichiers modifiés:**
- apps/desktop/src-tauri/src/domain/entities/mod.rs
- apps/desktop/src-tauri/src/domain/errors/domain_error.rs
- apps/desktop/src-tauri/src/infrastructure/adapters/mod.rs
- apps/desktop/src-tauri/src/infrastructure/adapters/video_segmenter.rs
- apps/desktop/src-tauri/src/application/use_cases/mod.rs
- apps/desktop/src-tauri/src/infrastructure/tauri_commands/segmentation_commands.rs
- apps/desktop/src/stores/segmentation-store.ts
- apps/desktop/src/stores/segmentation-store.test.ts
- apps/desktop/src/components/segmentation/SegmentationProgressDialog.tsx
- apps/desktop/src/components/segmentation/SegmentationProgressDialog.test.tsx
- apps/desktop/src/App.tsx
- packages/types/src/generated/DomainError.ts
- packages/types/src/generated/index.ts
