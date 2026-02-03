# Documentation des tests — Splice

> Derniere mise a jour : 2026-02-03

## Synthese

| Categorie | Passent | Echouent | Ignores | Total |
|-----------|---------|----------|---------|-------|
| Rust — unit tests (lib) | 146 | 0 | 11 | 157 |
| Rust — build config | 11 | 0 | 0 | 11 |
| Rust — integration SQLite | 6 | 0 | 0 | 6 |
| Rust — integration build config | 11 | 0 | 0 | 11 |
| Rust — integration transcription | 2 | 0 | 0 | 2 |
| **Rust total** | **176** | **0** | **11** | **187** |
| Frontend — vitest | 280 | 12 | 0 | 292 |
| **Total projet** | **456** | **12** | **11** | **479** |

## Lancer les tests

```bash
# Rust — tous les tests
cd apps/desktop/src-tauri && cargo test

# Rust — inclure les tests ignores (requiert fixtures + sidecars)
cargo test -- --ignored

# Frontend — tous les tests
cd apps/desktop && npx vitest run

# Frontend — un fichier specifique
npx vitest run src/stores/export-store.test.ts
```

---

## Backend Rust — Couverture detaillee

### Domain (entites, value objects, erreurs)

| Module | Tests | Statut |
|--------|-------|--------|
| `domain::entities::video` | 3 | OK |
| `domain::entities::transcription` | 2 | OK |
| `domain::entities::transcript_stored` | 2 | OK |
| `domain::entities::model_metadata` | 3 | OK |
| `domain::value_objects::timecode` | 6 | OK |
| `ts_rs` export bindings (Cut, Selection, etc.) | 16 | OK |

### Application — Use cases

| Module | Tests | Statut | Notes |
|--------|-------|--------|-------|
| `generate_cuts` | 6 | OK | Dont 1 perf test (100 selections < 1s) |
| `get_video_info` | 2 | OK | |
| `import_video` | 2 OK + 6 ignored | Partiel | 6 ignored : requierent fixtures video ou mock fs |
| `save_transcript` | 2 | OK | |
| `selection_use_cases` | 3 | OK | Save, Get, Clear |
| `segment_video` | 3 | OK | Dont cancellation |
| `validate_segments` | 2 | OK | |
| `prepare_preview` | 9 | OK | Hash, manifest, cache, cancel |
| `export_video` | 4 | OK | Delegation copy/reencode par qualite |

### Infrastructure — Adapters

| Module | Tests | Statut | Notes |
|--------|-------|--------|-------|
| `audio_extractor` | 1 | OK | Skip si fixture absente |
| `fluidaudio_transcription_service` | 5 | OK | Merge subword tokens (francais, espaces) |
| `proxy_generator` | 4 | OK | Skip proxy <=720p, cleanup |
| `segment_validator` | 6 | OK | Duration tolerance, compatibilite segments |
| `video_concatenator` | 4 | OK | Filelist, cancel, erreur FFmpeg |
| `video_exporter` | 14 | OK | Filelist, copy/reencode cancel+empty, progress parsing, encoding params, extract time/speed |
| `video_segmenter` | 6 | OK | Naming, cancel, progress callback, -t duration |
| `sqlite_video_repository` | — | Via integration | Teste dans tests/integration/ |
| `sqlite_transcript_repository` | 4 | OK | Save, retrieve, upsert, ordered words, perf (1000 mots) |
| `sqlite_selection_repository` | 6 | OK | CRUD, ordering, replace existing |
| `sqlite_cut_repository` | 4 | OK | CRUD, ordering, replace existing |
| `model_manager` | 4 | OK | Existence, partiel, dir path |

### Infrastructure — FFmpeg service

| Test | Statut | Notes |
|------|--------|-------|
| `test_ffmpeg_service_creation` | OK | |
| `test_probe_video_format_file_not_found` | OK | |
| `test_probe_video_format_h264_success` | **Ignore** | Requiert sidecar ffprobe dans Tauri mock runtime |
| `test_probe_video_format_h265_mov_success` | **Ignore** | Idem |
| `test_probe_video_format_h265_mp4_success` | **Ignore** | Idem |
| `test_probe_video_format_unsupported_codec_vp9` | **Ignore** | Idem |
| `test_probe_video_format_corrupted_file` | **Ignore** | Idem |

### Infrastructure — Tauri commands

| Module | Tests | Statut | Notes |
|--------|-------|--------|-------|
| `export_commands` | 6 + 4 bindings | OK | compute_estimate pour chaque qualite |
| `preview_commands` | 3 + 3 bindings | OK | Segment boundaries |
| `segmentation_commands` | 1 binding | OK | |

### Integration tests (tests/)

| Fichier | Tests | Statut | Notes |
|---------|-------|--------|-------|
| `build_config_test.rs` | 11 | OK | Binaires FFmpeg/FFprobe, tauri.conf.json, icones |
| `integration/sqlite_repository_test.rs` | 6 | OK | CRUD projet, metadata, migration idempotence |
| `transcription_integration_test.rs` | 2 | OK | Extraction audio (fixture avec audio), transcription (skip si sidecar absent) |

---

## Frontend TypeScript — Couverture detaillee

### Stores (Zustand)

| Fichier | Tests | Statut |
|---------|-------|--------|
| `export-store.test.ts` | 12 | OK |
| `selection-store.test.ts` | ~ | OK |
| `transcription-store.test.ts` | ~ | OK |
| `video-store.test.ts` | ~ | OK |

### Components

| Fichier | Tests | Statut | Notes |
|---------|-------|--------|-------|
| `TranscriptionProgressDialog.test.tsx` | 11/13 | **2 echecs** | `onCancel` button query + file size formatting (3.9 GB vs 4.2 GB) |
| `SegmentationProgressDialog.test.tsx` | 2/7 | **5 echecs** | Titre, spinner, segment info — probleme de rendu dialog |
| `use-model-download.test.ts` | 1/6 | **5 echecs** | Timing/async issues dans les hooks |
| Tous les autres composants | 280 | OK | |

---

## Tests ignores (11 Rust)

Ces tests sont marques `#[ignore]` car ils requierent un environnement specifique :

### Requierent des fixtures video (6)

```
import_video::test_import_video_success_h264_mp4
import_video::test_import_video_success_h265_mov
import_video::test_import_video_unsupported_codec_vp9
import_video::test_import_video_corrupted_file
import_video::test_import_video_too_large
import_video::test_import_large_file_memory_usage
```

**Raison** : Ces tests appellent `ImportVideoUseCase::execute` qui utilise `FfmpegService::probe_video_format` via le sidecar `ffprobe`. Le mock runtime Tauri ne supporte pas les sidecars.

**Pour les executer** : `cargo test -- --ignored` avec les fixtures dans `test-assets/fixtures/` et un runtime Tauri complet.

### Requierent le sidecar FFprobe (5)

```
ffmpeg_service::test_probe_video_format_h264_success
ffmpeg_service::test_probe_video_format_h265_mov_success
ffmpeg_service::test_probe_video_format_h265_mp4_success
ffmpeg_service::test_probe_video_format_unsupported_codec_vp9
ffmpeg_service::test_probe_video_format_corrupted_file
```

**Raison** : `FfmpegService::probe_video_format` utilise `app.shell().sidecar("ffprobe")` qui necessite un runtime Tauri avec le plugin shell **et** la configuration `externalBin` resolue. Le mock runtime ne fournit pas de sidecar fonctionnel.

**Limitation connue** : Il n'existe pas de moyen simple de tester les commandes sidecar avec `tauri::test::mock_app()`. Ces tests doivent etre executes dans un contexte E2E ou via `tauri dev`.

---

## Tests frontend en echec (12 pre-existants)

### `TranscriptionProgressDialog.test.tsx` (2 echecs)

- **`should call onCancel when cancel button clicked`** : Le bouton "Annuler" n'est pas trouve par `getByRole('button')` dans le dialog rendu.
- **`should format file size correctly`** : Le test attend "4.2 GB" mais le composant affiche un format different.

### `SegmentationProgressDialog.test.tsx` (5 echecs)

- Tous les tests echouent car le contenu du dialog (`AlertDialog`) n'est pas rendu dans le DOM de test. Probleme probable : le portal du dialog Radix UI ne se monte pas dans l'environnement jsdom.

### `use-model-download.test.ts` (5 echecs)

- Problemes de timing asynchrone dans les hooks de telechargement. Les mocks `invoke` ne resolvent pas dans l'ordre attendu par les `waitFor()`.

---

## Ce qui manque / a ameliorer

### Priorite haute

1. **Tests sidecar FFprobe** : Impossible avec `mock_app()`. Options :
   - Refactorer `FfmpegService` pour injecter un trait `FfprobeRunner` mockable
   - Utiliser `tauri-driver` pour les tests E2E
   - Tester la logique de parsing ffprobe separement du sidecar

2. **Tests sidecar FluidAudio** : Meme probleme. Le test d'integration skip gracieusement si le sidecar est absent.

3. **Corriger les 12 tests frontend en echec** :
   - Dialog rendering : wraper les tests avec un portail Radix compatible jsdom
   - Timing hooks : revoir les mocks async dans `use-model-download`

### Priorite moyenne

4. **Tests Tauri commands** : Les commandes `export_video`, `cancel_export`, `segment_video`, `transcribe_video` etc. ne sont pas testees unitairement car elles requierent `State<AppState>` et `AppHandle<R>`. Seule la logique pure (`compute_estimate`) est testee.

5. **Tests d'integration export** : Pas de test qui execute reellement FFmpeg pour verifier un export copy/reencode de bout en bout. Les tests unitaires verifient la construction des arguments et le parsing stderr mais pas l'execution reelle.

6. **Couverture de code** : Pas de mesure de couverture configuree. Ajouter `cargo-llvm-cov` pour Rust et `vitest --coverage` pour le frontend.

### Priorite basse

7. **Tests `import_video` avec mock** : 6 tests ignores pourraient etre rendus fonctionnels en mockant `FfmpegService` via un trait injectable.

8. **Tests de performance** : Un seul test de perf (`generate_cuts` 100 selections < 1s). Pas de benchmark pour les operations FFmpeg, SQLite, ou le rendering frontend.

9. **Tests Windows** : Aucun test ne couvre le build Windows (Story 1-9 skip).

---

## Fixtures de test

### Backend (`test-assets/fixtures/`)

| Fichier | Description |
|---------|-------------|
| `sample-h264.mp4` | Video H.264 320x240 2s, **sans audio** |
| `sample-h264-audio.mp4` | Video H.264 320x240 2s, **avec audio** 440Hz sine |
| `sample-h265.mov` | Video H.265/HEVC MOV |
| `sample-h265.mp4` | Video H.265/HEVC MP4 |
| `sample-vp9.webm` | Video VP9 WebM (codec non supporte) |
| `corrupted.mp4` | Fichier MP4 corrompu |

### Binaires sidecar (`binaries/`)

| Fichier | Description |
|---------|-------------|
| `ffmpeg-aarch64-apple-darwin` | FFmpeg ARM64 macOS |
| `ffmpeg-x86_64-apple-darwin` | FFmpeg x86_64 macOS |
| `ffprobe-aarch64-apple-darwin` | FFprobe ARM64 macOS |
| `ffprobe-x86_64-apple-darwin` | FFprobe x86_64 macOS |

---

## Architecture de test

```
apps/desktop/
  src-tauri/
    src/                          # Tests unitaires inline (#[cfg(test)])
      domain/                     # Entites, value objects
      application/use_cases/      # Use cases avec repositories mockes
      infrastructure/
        adapters/                 # SQLite repos (in-memory), FFmpeg logic
        ffmpeg/                   # FfmpegService (sidecar-dependent)
        tauri_commands/           # Commandes (logique pure testee)
    tests/                        # Tests d'integration
      build_config_test.rs        # Verification tauri.conf.json + binaires
      integration/
        sqlite_repository_test.rs # SQLite in-memory CRUD
      transcription_integration_test.rs  # Pipeline audio + transcription
    test-assets/fixtures/         # Fixtures video
  src/
    stores/*.test.ts              # Tests stores Zustand (vitest)
    components/**/*.test.tsx      # Tests composants React (vitest + testing-library)
    hooks/*.test.ts               # Tests hooks custom
```
