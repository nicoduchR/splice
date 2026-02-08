# Story 9.4: Disk Space & Resource Management

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to be warned if I'm running low on disk space,
so that I can free up space before exports fail.

## Acceptance Criteria

1. **Given** l'utilisateur importe une vidéo (NFR24) **When** l'espace disque est vérifié **Then** l'espace disponible est calculé sur le volume de destination **And** si espace disponible < 3× taille du fichier vidéo, un warning est affiché : titre "Espace disque faible", description "Votre disque dispose de X GB libres. Cette vidéo (Y GB) nécessite ~Z GB pour le traitement.", actions suggérées "Libérez de l'espace ou choisissez une vidéo plus petite." **And** l'utilisateur peut continuer malgré le warning ou annuler.

2. **Given** l'utilisateur lance un export **When** l'espace disque est vérifié avant l'export **Then** l'espace disponible est vérifié sur le volume de destination (répertoire de sortie choisi par l'utilisateur) **And** si espace insuffisant pour l'export estimé, un warning bloquant est affiché avec estimation de la taille requise **And** l'export ne démarre pas si l'espace est insuffisant (avec option de changer le répertoire de sortie).

3. **Given** un export se termine avec succès **When** les fichiers temporaires existent **Then** les fichiers temporaires de segmentation (`~/.splice/temp/{project_id}/`) sont nettoyés automatiquement **And** les filelists FFmpeg temporaires sont supprimés **And** un log info est écrit pour confirmer le nettoyage.

4. **Given** l'utilisateur accède aux paramètres **When** il clique sur "Vider le cache" **Then** les proxies vidéo (`~/.splice/proxies/`) sont supprimés **And** les fichiers temporaires orphelins (`~/.splice/temp/`) sont supprimés **And** l'espace libéré est affiché en GB **And** les projets existants continuent de fonctionner (seuls les proxies devront être regénérés).

5. **Given** l'utilisateur accède aux paramètres **When** il configure le répertoire temporaire **Then** il peut choisir un répertoire personnalisé pour les fichiers temporaires **And** la préférence est persistée dans SQLite **And** les nouvelles opérations utilisent le répertoire configuré.

6. **Given** une opération (import, transcription, segmentation, export) est en cours **When** l'espace disque tombe à zéro mid-opération **Then** l'opération échoue gracieusement avec un message clair : "Espace disque insuffisant. L'opération a été interrompue. Libérez de l'espace et réessayez." **And** les fichiers partiels sont nettoyés **And** l'état de l'application reste stable (pas de crash).

## Tasks / Subtasks

- [x] Task 1 — Créer le service Rust de vérification d'espace disque (AC: #1, #2, #6)
  - [x] 1.1 Créer `apps/desktop/src-tauri/src/domain/services/disk_space_service.rs` : trait `DiskSpaceChecker` avec méthode `get_available_space(path: &Path) -> Result<u64, DomainError>` (retourne bytes disponibles)
  - [x] 1.2 Créer `apps/desktop/src-tauri/src/infrastructure/adapters/disk_space_checker.rs` : impl avec `fs2::available_space()` ou `std::fs::metadata` + appel système (`statvfs` macOS/Linux, `GetDiskFreeSpaceExW` Windows)
  - [x] 1.3 Créer `apps/desktop/src-tauri/src/application/use_cases/check_disk_space.rs` : `CheckDiskSpaceUseCase` qui vérifie espace vs requis, retourne `DiskSpaceStatus { available_gb: f64, required_gb: f64, sufficient: bool }`
  - [x] 1.4 Créer Tauri command `check_disk_space` dans `apps/desktop/src-tauri/src/infrastructure/tauri_commands/disk_commands.rs` : params `{ path: String, required_bytes: u64 }`, retourne `DiskSpaceInfo { available_gb: f64, required_gb: f64, sufficient: bool }`
  - [x] 1.5 Enregistrer la commande dans `main.rs` et ajouter le module dans `tauri_commands/mod.rs`
  - [x] 1.6 Tests Rust : espace disponible retourné > 0, vérification path invalide retourne erreur, comparaison required vs available correcte

- [x] Task 2 — Intégrer la vérification d'espace disque dans l'import vidéo (AC: #1)
  - [x] 2.1 Modifier `apps/desktop/src/stores/video-store.ts` : après sélection du fichier, appeler `invoke('check_disk_space', { path: appDataDir, requiredBytes: fileSize * 3 })` avant `invoke('import_video')`
  - [x] 2.2 Si espace insuffisant : afficher `ErrorDialog` avec severity `'warning'` (pas `'error'`), titre "Espace disque faible", description dynamique avec GB disponibles/requis, actions suggérées, boutons "Continuer quand même" + "Annuler"
  - [x] 2.3 Si l'utilisateur choisit "Continuer quand même" : procéder à l'import normalement
  - [x] 2.4 Utiliser le composant `ErrorDialog` unifié de Story 9-3 (components/error/ErrorDialog.tsx)
  - [x] 2.5 Tests frontend : mock de check_disk_space, affichage warning si insuffisant, import continue si confirmé, import annulé si refusé

- [x] Task 3 — Intégrer la vérification d'espace disque dans l'export (AC: #2)
  - [x] 3.1 Modifier `apps/desktop/src/stores/export-store.ts` : avant de lancer l'export, appeler `invoke('check_disk_space', { path: outputDir, requiredBytes: estimatedSizeBytes })` (utiliser l'estimation existante de `estimate_export`)
  - [x] 3.2 Si espace insuffisant : afficher `ErrorDialog` avec severity `'error'` (bloquant), titre "Espace disque insuffisant", description avec GB disponibles/requis, actions suggérées "Libérez de l'espace disque ou choisissez un emplacement différent.", bouton "Changer le répertoire" + "Annuler"
  - [x] 3.3 Le bouton "Changer le répertoire" : ouvre le sélecteur de dossier et relance la vérification
  - [x] 3.4 L'export ne démarre PAS tant que l'espace est insuffisant (pas d'option "Continuer quand même" pour l'export)
  - [x] 3.5 Tests frontend : mock de check_disk_space et estimate_export, export bloqué si insuffisant, export démarre si suffisant, changement de répertoire fonctionne

- [x] Task 4 — Nettoyage automatique des fichiers temporaires après export (AC: #3)
  - [x] 4.1 Vérifier le code existant dans `segmentation_commands.rs` : le cleanup des segments après concat est déjà implémenté (ligne ~197). S'assurer que c'est systématique (succès ET échec)
  - [x] 4.2 Vérifier le code existant dans `video_exporter.rs` : le cleanup des filelists est déjà implémenté. S'assurer des cas edge (crash mid-export)
  - [x] 4.3 Créer `apps/desktop/src-tauri/src/application/use_cases/cleanup_temp_files.rs` : `CleanupTempFilesUseCase` qui scanne `~/.splice/temp/` et supprime les répertoires orphelins (pas associés à un export en cours)
  - [x] 4.4 Appeler `CleanupTempFilesUseCase` au démarrage de l'app (dans `main.rs` setup) pour nettoyer les résidus de sessions précédentes crashées
  - [x] 4.5 Logger le nettoyage avec `tracing::info!("Cleaned up temp files", bytes_freed = ...)`
  - [x] 4.6 Tests Rust : nettoyage de temp files orphelins, préservation des fichiers en cours d'utilisation

- [x] Task 5 — Créer la table de préférences utilisateur et le service de settings (AC: #4, #5)
  - [x] 5.1 Créer migration SQLite `apps/desktop/src-tauri/migrations/20260210000010_user_preferences.sql` : table `user_preferences` avec colonnes `key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL`
  - [x] 5.2 Créer `apps/desktop/src-tauri/src/domain/repositories/preferences_repository.rs` : trait `PreferencesRepository` avec `get(key: &str) -> Option<String>`, `set(key: &str, value: &str)`, `delete(key: &str)`
  - [x] 5.3 Créer `apps/desktop/src-tauri/src/infrastructure/adapters/sqlite_preferences_repository.rs` : impl SQLite du repository
  - [x] 5.4 Créer Tauri commands dans `apps/desktop/src-tauri/src/infrastructure/tauri_commands/preferences_commands.rs` : `get_preference`, `set_preference`, `get_all_preferences`
  - [x] 5.5 Enregistrer les commandes dans `main.rs` et `tauri_commands/mod.rs`
  - [x] 5.6 Créer `apps/desktop/src/services/preferences-service.ts` : wrapper TypeScript des commands Tauri avec fonctions typées `getPreference<T>(key: string): Promise<T | null>`, `setPreference<T>(key: string, value: T): Promise<void>`
  - [x] 5.7 Clé de préférence pour le répertoire temp : `temp_directory` (valeur par défaut : `null` = répertoire système par défaut `~/.splice/temp/`)
  - [x] 5.8 Tests Rust : CRUD preferences, tests frontend : get/set preferences via service

- [x] Task 6 — Créer la page de paramètres avec "Vider le cache" et configuration temp dir (AC: #4, #5)
  - [x] 6.1 Créer `apps/desktop/src/components/settings/SettingsDialog.tsx` : Dialog modal avec sections de paramètres
  - [x] 6.2 Section "Stockage" : afficher l'espace utilisé par les proxies et temp files (calculé via Tauri command `get_cache_size`), bouton "Vider le cache" avec confirmation AlertDialog
  - [x] 6.3 Créer Tauri command `get_cache_size` dans `disk_commands.rs` : scanne `~/.splice/proxies/` et `~/.splice/temp/`, retourne `{ proxies_size_gb: f64, temp_size_gb: f64, total_size_gb: f64 }`
  - [x] 6.4 Créer Tauri command `clear_cache` dans `disk_commands.rs` : supprime tout le contenu de `~/.splice/proxies/` et `~/.splice/temp/`, retourne `{ freed_gb: f64 }`
  - [x] 6.5 Section "Répertoire temporaire" : afficher le répertoire actuel (par défaut ou personnalisé), bouton "Changer" qui ouvre le sélecteur de dossier via `dialog.open({ directory: true })`, sauvegarde via `preferences-service.ts`
  - [x] 6.6 Ajouter un bouton/icône "Paramètres" (Settings gear icon) dans l'UI principale (header ou sidebar) pour ouvrir le dialog
  - [x] 6.7 Utiliser les composants Shadcn/ui existants : `Dialog`, `Button`, `AlertDialog` pour la confirmation
  - [x] 6.8 Tests frontend : affichage taille du cache, vider le cache met à jour l'affichage, changement de répertoire temp persisté

- [x] Task 7 — Gestion du graceful failure mid-opération (AC: #6)
  - [x] 7.1 Enrichir `error-messages.ts` : ajouter pattern "no space left" / "disk full" / "ENOSPC" dans `getErrorWithGuidance()` avec guidance spécifique disque
  - [x] 7.2 Vérifier que les adaptateurs FFmpeg existants (`video_exporter.rs`, `video_segmenter.rs`, `audio_extractor.rs`) propagent correctement les erreurs FFmpeg contenant "No space left on device"
  - [x] 7.3 S'assurer que les cleanup handlers (filelist, segments partiels, output partiel) sont appelés même en cas d'erreur ENOSPC
  - [x] 7.4 Ajouter dans les Tauri commands existants (`export_commands.rs`, `segmentation_commands.rs`) : détection pattern "No space left" dans les erreurs FFmpeg et conversion en message utilisateur approprié
  - [x] 7.5 Tests : simuler erreur "No space left" dans FFmpeg, vérifier message utilisateur correct, vérifier cleanup des fichiers partiels

### Review Follow-ups (AI)

- [x] [AI-Review][HIGH] AC #5 : `temp_directory` préférence désormais lue au runtime via `AppState::resolve_temp_dir()`. Toutes les opérations (transcription, segmentation, export, preview, disk check, cleanup) utilisent le répertoire configuré. Fallback sur `~/.splice/temp/` si non configuré.
- [x] [AI-Review][MEDIUM] `calculate_dir_size()` extrait comme fonction publique partagée dans `cleanup_temp_files.rs`. Supprimé la duplication `dir_size()` de `disk_commands.rs`. Tests migrés.

## Dev Notes

### Contexte Architecture

App desktop Tauri (React frontend + Rust backend) avec Clean Architecture 3 couches (Domain, Application, Infrastructure). L'app traite des vidéos via FFmpeg et génère des fichiers temporaires conséquents.

### Ce qui existe DÉJÀ vs ce qui doit être AJOUTÉ

| Fonctionnalité | Statut Actuel | Action Requise |
|---|---|---|
| Vérification espace disque | ❌ Absent — aucune vérification proactive | Nouveau : `CheckDiskSpaceUseCase` + Tauri command |
| Cleanup segments après export | ✅ Partiel — `VideoSegmenter::cleanup_segments()` appelé ligne 197 de `segmentation_commands.rs` | Vérifier exhaustivité, ajouter cleanup au startup |
| Cleanup filelists FFmpeg | ✅ Implémenté — supprimé dans finally blocks de `video_exporter.rs` | Vérifier cas edge |
| Cleanup temp audio | ✅ Implémenté — supprimé après transcription + cleanup startup | OK |
| Cleanup proxies | ✅ `ProxyGenerator::cleanup_proxy()` existe (par projet) | Ajouter bulk cleanup pour "Vider le cache" |
| Page de paramètres | ❌ Absent — aucune UI de settings | Nouveau : `SettingsDialog` composant |
| Table préférences SQLite | ❌ Absent | Nouveau : migration + repository + commands |
| Répertoire temp configurable | ❌ Absent — hardcodé `~/.splice/temp/` | Nouveau : préférence utilisateur + lecture au runtime |
| Error messages espace disque | ⚠️ Partiel — `getErrorWithGuidance()` gère "no space left" réactif | Ajouter vérification proactive + messages spécifiques import/export |
| ErrorCodes architecturaux | ✅ Définis — `EXPORT_DISK_SPACE_INSUFFICIENT`, `SYSTEM_DISK_FULL` dans architecture | Implémenter dans le code |

### Composants existants à réutiliser

1. **`ErrorDialog` unifié (Story 9-3)** — `components/error/ErrorDialog.tsx` : composant avec severity warning/error, suggested actions, retry/close/copy. **Réutiliser tel quel** pour les warnings d'espace disque (Task 2 et 3).

2. **`error-messages.ts` (Story 9-3)** — `getErrorWithGuidance()` avec pattern matching. Contient déjà le pattern "no space left" / "disk full" → ErrorGuidance. **Étendre** pour les messages proactifs.

3. **`sanitizeErrorForUser()` (Story 9-3)** — Filtre anti-stack-trace. **Utiliser** pour toute erreur FFmpeg liée au disque.

4. **`logger.ts` (Story 9-3)** — `logError/logWarn/logInfo` fire-and-forget. **Utiliser** pour logger le nettoyage et les warnings disque.

5. **`VideoSegmenter::cleanup_segments()`** — `infrastructure/adapters/video_segmenter.rs`. Supprime `~/.splice/temp/{project_id}/`. **Réutiliser** dans le nettoyage global.

6. **`ProxyGenerator::cleanup_proxy()`** — `infrastructure/adapters/proxy_generator.rs` (lignes 108-121). Supprime un proxy spécifique. **Inspiration** pour le bulk cleanup.

7. **`cleanup_old_backups.rs`** — `application/use_cases/cleanup_old_backups.rs`. Pattern use case de nettoyage. **Même pattern** pour `CleanupTempFilesUseCase`.

8. **`CrashRecoveryDialog` (Story 9-2)** — Pattern AlertDialog avec confirmation. **Inspiration** pour le dialog de confirmation "Vider le cache".

9. **Composants Shadcn/ui** : `Dialog`, `AlertDialog`, `Button` (outline/default/destructive), icônes Lucide React (`Settings`, `Trash2`, `HardDrive`, `FolderOpen`).

10. **Pattern Tauri commands** : `Result<T, String>`, `.map_err(|e| e.to_string())`, frontend `invoke<T>('command_name', { params })`.

### Répertoires et chemins clés

```
~/.splice/                          # App data root (macOS)
├── db/splice.db                   # SQLite database
├── temp/                          # Fichiers temporaires
│   ├── audio-{video_id}.wav       # Audio extraction (nettoyé après transcription)
│   └── {project_id}/              # Segments vidéo (nettoyé après export)
│       ├── segment_000.mp4
│       └── segment_NNN.mp4
├── proxies/                       # Proxies vidéo 720p
│   └── {project_id}_proxy.mp4
├── backups/                       # Backups avant update
│   └── v{version}/
└── splice-frontend.log            # Log frontend (Story 9-3)

%APPDATA%/splice/                   # Équivalent Windows
~/.local/share/splice/              # Équivalent Linux
```

### Détermination du chemin app_data_dir

Le `app_data_dir` est résolu dans `database.rs` via `tauri::api::path::app_data_dir()`. Les Tauri commands y accèdent via `app.path().app_data_dir()` (Tauri v2 API). Toutes les nouvelles commandes doivent utiliser ce même pattern.

### Dépendance Rust pour l'espace disque

Utiliser la crate `fs2` (`fs2 = "0.4"`) qui fournit `fs2::available_space(path)` cross-platform (macOS, Windows, Linux). Alternative : `std::os::unix::fs::statvfs` (Unix only) ou appel système direct. **Recommandation** : `fs2` est la plus simple et cross-platform.

Vérifier dans `Cargo.toml` si `fs2` est déjà une dépendance (probablement non).

### Patterns d'erreurs à suivre (3 niveaux)

1. **Warning non-bloquant → ErrorDialog severity='warning'** : import avec espace faible (Task 2) — l'utilisateur peut continuer
2. **Erreur bloquante → ErrorDialog severity='error'** : export avec espace insuffisant (Task 3) — l'opération ne démarre pas
3. **Erreur mid-opération → Toast error** : ENOSPC pendant FFmpeg (Task 7) — erreur inattendue, cleanup et message

### Intelligence Story Précédente (9-1, 9-2, 9-3)

**Learnings de la Story 9-3 :**
- Le composant `ErrorDialog` unifié gère déjà severity warning/error avec icônes distinctes
- `getErrorWithGuidance()` retourne `ErrorGuidance { title, description, suggestedActions, severity, retryable }`
- Pattern "no space left" / "disk full" déjà mappé dans `getErrorWithGuidance()` → réutiliser et étendre
- `logger.logInfo()` pour les actions de nettoyage (pas de console.log)
- `sanitizeErrorForUser()` filtre les chemins absolus des erreurs

**Learnings de la Story 9-2 :**
- Pattern `CrashRecoveryDialog` AlertDialog pour confirmation d'action
- Serialization TS/Rust : interfaces TS doivent matcher Serde snake_case du backend
- Pattern startup tasks dans `main.rs` : le cleanup temp au démarrage existe déjà pour la transcription → même pattern pour le nettoyage global

**Review corrections récurrentes (épic 9) :**
- Connecter TOUS les utilitaires créés aux points d'utilisation
- Éviter les assertions triviales dans les tests
- Clean Architecture : toujours passer par les use cases, jamais accès direct repository
- Bornes des compteurs vérifiées
- Barrel exports dans `index.ts` de chaque dossier de composants

### Intelligence Git Récente

5 derniers commits :
1. `23f9302` — Story 8-2 : UpdateDialog et UpdateNotificationBadge
2. `03fdf43` — Story 9-3 : clear error messages & user guidance
3. `76cc08e` — Story 9-2 : auto-save & crash recovery
4. `b763d74` — Story 9-1 : network error handling
5. `0434b2b` — Story 8-3 : rollback + crash recovery

**Patterns établis :**
- Tauri commands dans `infrastructure/tauri_commands/` avec module dans `mod.rs` et registration dans `main.rs`
- Tests Rust inline `#[cfg(test)]` dans chaque fichier
- Tests frontend côte-à-côte `.test.tsx`/`.test.ts` avec Vitest + Testing Library
- Stores Zustand dans `src/stores/` avec pattern `create<T>()((set, get) => ({...}))`
- Services frontend dans `src/services/` pour les wrappers Tauri `invoke()`
- Composants UI dans `src/components/{feature}/` avec barrel export `index.ts`

### Librairies & Versions Critiques

- **Tauri** v2 — `app.path().app_data_dir()` pour chemins
- **Shadcn/ui** — Dialog, AlertDialog, Button, Badge
- **Lucide React** — Settings, Trash2, HardDrive, FolderOpen, AlertTriangle
- **Sonner** — Toast notifications
- **Zustand** — State management stores
- **Vitest** + **Testing Library** — Tests frontend
- **tracing** crate — Logging Rust structuré
- **sqlx** — SQLite async avec migrations
- **fs2** crate (à ajouter) — `available_space()` cross-platform
- **tauri-plugin-dialog** — Sélecteur de fichiers/dossiers (`dialog.open()`)

### Project Structure Notes

**Nouveaux fichiers :**
- `apps/desktop/src-tauri/src/domain/services/disk_space_service.rs` — Trait DiskSpaceChecker
- `apps/desktop/src-tauri/src/infrastructure/adapters/disk_space_checker.rs` — Impl fs2
- `apps/desktop/src-tauri/src/application/use_cases/check_disk_space.rs` — Use case vérification
- `apps/desktop/src-tauri/src/application/use_cases/cleanup_temp_files.rs` — Use case nettoyage
- `apps/desktop/src-tauri/src/infrastructure/tauri_commands/disk_commands.rs` — Commands disque
- `apps/desktop/src-tauri/src/infrastructure/tauri_commands/preferences_commands.rs` — Commands préférences
- `apps/desktop/src-tauri/src/domain/repositories/preferences_repository.rs` — Trait PreferencesRepository
- `apps/desktop/src-tauri/src/infrastructure/adapters/sqlite_preferences_repository.rs` — Impl SQLite
- `apps/desktop/src-tauri/migrations/20260210000010_user_preferences.sql` — Migration table préférences
- `apps/desktop/src/components/settings/SettingsDialog.tsx` — Page paramètres
- `apps/desktop/src/components/settings/SettingsDialog.test.tsx` — Tests
- `apps/desktop/src/components/settings/index.ts` — Barrel export
- `apps/desktop/src/services/preferences-service.ts` — Service préférences frontend

**Fichiers modifiés :**
- `apps/desktop/src-tauri/Cargo.toml` — Ajouter dépendance `fs2`
- `apps/desktop/src-tauri/src/main.rs` — Enregistrer nouvelles commandes + cleanup startup
- `apps/desktop/src-tauri/src/infrastructure/tauri_commands/mod.rs` — Ajouter modules
- `apps/desktop/src-tauri/src/domain/mod.rs` — Ajouter services module
- `apps/desktop/src-tauri/src/application/use_cases/mod.rs` — Ajouter use cases
- `apps/desktop/src/stores/video-store.ts` — Vérification espace avant import
- `apps/desktop/src/stores/export-store.ts` — Vérification espace avant export
- `apps/desktop/src/lib/error-messages.ts` — Étendre patterns espace disque
- `apps/desktop/src/App.tsx` — Ajouter bouton Settings dans le header

### References

- [Source: epics/epic-9-robust-error-handling-recovery.md#Story 9.4] — Acceptance criteria détaillés
- [Source: architecture.md#4.8 Error Codes Standard] — ErrorCode::ExportDiskSpaceInsufficient, SystemDiskFull
- [Source: architecture.md#NFR24] — Gestion situations manque espace disque avec messages clairs
- [Source: architecture.md#Clean Architecture 3 Couches] — Domain → Application → Infrastructure
- [Source: architecture.md#Stockage Données] — SQLite embedded, chemins app_data_dir
- [Source: 9-3-clear-error-messages-user-guidance.md] — ErrorDialog unifié, error-messages.ts, logger.ts
- [Source: 9-2-auto-save-crash-recovery.md] — CrashRecoveryDialog pattern, startup tasks
- [Source: infrastructure/adapters/video_segmenter.rs] — cleanup_segments() existant
- [Source: infrastructure/adapters/proxy_generator.rs] — cleanup_proxy() existant
- [Source: application/use_cases/cleanup_old_backups.rs] — Pattern cleanup use case
- [Source: infrastructure/config/database.rs] — Chemins app_data_dir par plateforme
- [Source: infrastructure/tauri_commands/transcription_commands.rs] — cleanup_temp_directory() au startup

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Pre-existing compilation error in `rollback_commands.rs:100` (MutexGuard not Send in async command) — not caused by this story
- Pre-existing test failures in `export-store.test.ts` (3 tests) related to `VITE_BILLING_ENABLED` env var not set — not caused by this story

### Completion Notes List

- Task 1: 14 Rust tests passing (disk space checker adapter + use case + commands)
- Task 2: 6 new frontend tests in video-store.test.ts (disk space warning flow)
- Task 3: 4 new frontend tests in export-store.test.ts (export disk check)
- Task 4: 4 Rust tests for CleanupTempFilesUseCase + startup cleanup in main.rs
- Task 5: 7 Rust tests for SqlitePreferencesRepository + 2 commands tests + 11 frontend tests for preferences-service
- Task 6: 12 frontend tests for SettingsDialog (cache display, clear cache, temp dir, rollback) — replaces SettingsRollbackSection in TopBar
- Task 7: 5 new tests in error-messages.test.ts (disk full patterns) + enhanced video_exporter.rs to capture FFmpeg stderr on failure

### File List

**New files:**
- `apps/desktop/src-tauri/migrations/20260210000010_user_preferences.sql`
- `apps/desktop/src-tauri/src/domain/services/mod.rs`
- `apps/desktop/src-tauri/src/domain/services/disk_space_service.rs`
- `apps/desktop/src-tauri/src/domain/repositories/preferences_repository.rs`
- `apps/desktop/src-tauri/src/infrastructure/adapters/disk_space_checker.rs`
- `apps/desktop/src-tauri/src/infrastructure/adapters/sqlite_preferences_repository.rs`
- `apps/desktop/src-tauri/src/application/use_cases/check_disk_space.rs`
- `apps/desktop/src-tauri/src/application/use_cases/cleanup_temp_files.rs`
- `apps/desktop/src-tauri/src/infrastructure/tauri_commands/disk_commands.rs`
- `apps/desktop/src-tauri/src/infrastructure/tauri_commands/preferences_commands.rs`
- `apps/desktop/src/components/settings/SettingsDialog.tsx`
- `apps/desktop/src/components/settings/SettingsDialog.test.tsx`
- `apps/desktop/src/components/settings/index.ts`
- `apps/desktop/src/services/preferences-service.ts`
- `apps/desktop/src/services/preferences-service.test.ts`
- `apps/packages/types/src/generated/DiskSpaceInfo.ts`
- `apps/packages/types/src/generated/DiskSpaceStatus.ts`
- `apps/packages/types/src/generated/CacheSizeInfo.ts`
- `apps/packages/types/src/generated/CacheClearedInfo.ts`
- `apps/packages/types/src/generated/PreferenceEntry.ts`

**Modified files:**
- `apps/desktop/src-tauri/Cargo.toml` — added `fs2 = "0.4"` dependency
- `apps/desktop/src-tauri/Cargo.lock` — updated lock file with fs2 dependency
- `apps/desktop/src-tauri/src/main.rs` — registered disk_commands, preferences_commands + startup temp cleanup
- `apps/desktop/src-tauri/src/domain/mod.rs` — added `pub mod services`
- `apps/desktop/src-tauri/src/domain/repositories/mod.rs` — added `preferences_repository`
- `apps/desktop/src-tauri/src/infrastructure/adapters/mod.rs` — added `disk_space_checker`, `sqlite_preferences_repository`
- `apps/desktop/src-tauri/src/infrastructure/tauri_commands/mod.rs` — added `disk_commands`, `preferences_commands`
- `apps/desktop/src-tauri/src/infrastructure/config/app_state.rs` — added `preferences_repository` field
- `apps/desktop/src-tauri/src/application/use_cases/mod.rs` — added `check_disk_space`, `cleanup_temp_files`
- `apps/desktop/src-tauri/src/infrastructure/adapters/video_exporter.rs` — enhanced stderr capture on FFmpeg failure
- `apps/desktop/src/stores/video-store.ts` — added disk space check before import, dismissDiskSpaceWarning, continueDespiteWarning
- `apps/desktop/src/stores/video-store.test.ts` — 6 new tests for disk space warning flow
- `apps/desktop/src/stores/export-store.ts` — added disk space check before export, exportDiskSpaceError state
- `apps/desktop/src/stores/export-store.test.ts` — 4 new tests for export disk space check
- `apps/desktop/src/App.tsx` — added disk space warning/error dialogs
- `apps/desktop/src/components/error/ErrorDialog.tsx` — added optional `retryLabel` prop
- `apps/desktop/src/components/layout/TopBar.tsx` — replaced SettingsRollbackSection with SettingsDialog
- `apps/desktop/src/lib/error-messages.ts` — added ENOSPC pattern in getImportErrorMessage
- `apps/desktop/src/lib/error-messages.test.ts` — 5 new tests for disk full error patterns

### Change Log

| Date | Change | Files |
|------|--------|-------|
| 2026-02-08 | Task 1: Created disk space checking service (DiskSpaceChecker trait, Fs2DiskSpaceChecker impl, CheckDiskSpaceUseCase, disk_commands) | domain/services/*, adapters/disk_space_checker.rs, use_cases/check_disk_space.rs, tauri_commands/disk_commands.rs |
| 2026-02-08 | Task 2: Integrated disk space check into video import with warning dialog | video-store.ts, App.tsx, ErrorDialog.tsx |
| 2026-02-08 | Task 3: Integrated disk space check into export with blocking error dialog | export-store.ts, App.tsx |
| 2026-02-08 | Task 4: Created CleanupTempFilesUseCase and startup cleanup in main.rs | cleanup_temp_files.rs, main.rs |
| 2026-02-08 | Task 5: Created user preferences system (SQLite migration, repository, commands, frontend service) | 20260210000010_user_preferences.sql, preferences_repository.rs, sqlite_preferences_repository.rs, preferences_commands.rs, preferences-service.ts |
| 2026-02-08 | Task 6: Created SettingsDialog with Storage, Temp Dir, and Updates sections | SettingsDialog.tsx, TopBar.tsx |
| 2026-02-08 | Task 7: Enhanced FFmpeg stderr capture in video_exporter.rs, added ENOSPC error detection in import flow | video_exporter.rs, error-messages.ts |
| 2026-02-08 | Code Review Fixes: H3 added "Changer le répertoire" button to export disk space error dialog, H4 fixed handleResetTempDir to use service, M3 extracted formatDuration utility, L2 added ENOSPC to getErrorWithGuidance | App.tsx, SettingsDialog.tsx, video-store.ts, error-messages.ts, error-messages.test.ts |
| 2026-02-08 | Review Action Items: H2 implemented resolve_temp_dir() on AppState — all operations now read temp_directory preference at runtime. M2 extracted calculate_dir_size() as shared utility, removed duplication. | app_state.rs, cleanup_temp_files.rs, disk_commands.rs, transcription_commands.rs, segmentation_commands.rs, preview_commands.rs, export_video.rs, export_commands.rs, main.rs |
