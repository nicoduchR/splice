# Story 8.3: Rollback & Update Recovery

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to implement update rollback capability,
so that users can recover if an update causes issues.

## Acceptance Criteria

### AC1: Backup de la version précédente avant mise à jour

**Given** une mise à jour est prête à être installée
**When** l'utilisateur lance l'installation (Install Now ou Install on Quit)
**Then** la version précédente est sauvegardée avant l'application de la mise à jour
**And** le backup est stocké dans `{app_data_dir}/backups/v{version}/`
**And** seule 1 version précédente est conservée (pour économiser l'espace disque)
**And** le backup inclut le numéro de version dans un fichier metadata `backup-info.json`

### AC2: Rollback automatique sur crash au démarrage

**Given** la mise à jour a été appliquée
**When** la nouvelle version crash au démarrage (3+ crashes consécutifs)
**Then** un rollback automatique est déclenché
**And** la version précédente est restaurée depuis le backup
**And** l'utilisateur voit le message : "La mise à jour v{version} a causé des problèmes. Version précédente restaurée."
**And** le compteur de crashes est réinitialisé après un démarrage réussi

### AC3: Compteur de crashes et détection

**Given** l'application démarre
**When** le compteur de crashes consécutifs atteint 3
**Then** le système détecte un pattern de crash
**And** le flag `needs_rollback` est activé
**And** au prochain démarrage, le rollback s'exécute automatiquement

**Given** l'application démarre avec succès
**When** l'app reste ouverte > 30 secondes sans crash
**Then** le compteur de crashes consécutifs est réinitialisé à 0
**And** le "healthy" flag est activé

### AC4: Rapport de crash (opt-in)

**Given** un rollback automatique a été effectué
**When** l'utilisateur voit le message de rollback
**Then** une option "Envoyer le rapport de crash" est proposée (opt-in)
**And** si accepté, un rapport est envoyé au backend : `POST /api/v1/crashes/report`
**And** le rapport contient : version, platform, crash_count, previous_version, error_log (dernières 100 lignes du log)

### AC5: Rollback manuel depuis les paramètres

**Given** un backup de version précédente existe
**When** l'utilisateur navigue dans les paramètres → "Revenir à la version précédente"
**Then** un bouton "Revenir à v{previous_version}" est affiché
**And** une confirmation est demandée : "Voulez-vous revenir à la version v{previous_version} ?"
**And** si confirmé, l'application restaure la version précédente et redémarre
**And** si aucun backup n'existe, le bouton n'est pas affiché

### AC6: Gestion de l'espace disque

**Given** un backup existe
**When** un nouveau backup est créé (nouvelle mise à jour)
**Then** l'ancien backup est supprimé avant de créer le nouveau
**And** seul 1 backup est conservé à tout moment
**And** l'espace disque utilisé par le backup est visible dans les paramètres (optionnel)

## Tasks / Subtasks

### Backend (Rust) - Crash Counter & Detection

- [x] **Task 1: Créer le système de compteur de crashes** (AC: #2, #3)
  - [x] 1.1 Créer `src/domain/entities/crash_tracker.rs` avec la struct `CrashTracker`
    - Champs : `consecutive_crashes: u32`, `last_crash_timestamp: Option<i64>`, `needs_rollback: bool`, `previous_version: Option<String>`
  - [x] 1.2 Ajouter `CrashTrackerState` à `AppState` dans `app_state.rs`
  - [x] 1.3 Persister le compteur de crashes dans un fichier JSON : `{app_data_dir}/crash-tracker.json`
  - [x] 1.4 Implémenter la logique de détection de crash :
    - Au démarrage : incrémenter `consecutive_crashes` et sauvegarder
    - Après 30 secondes de fonctionnement : réinitialiser `consecutive_crashes = 0`, sauvegarder
    - Si `consecutive_crashes >= 3` : activer `needs_rollback = true`
  - [x] 1.5 Écrire tests inline (6+ tests)

### Backend (Rust) - Backup Manager

- [x] **Task 2: Créer le gestionnaire de backup** (AC: #1, #5, #6)
  - [x] 2.1 Créer `src/application/use_cases/backup_current_version.rs`
    - Utiliser `app_data_dir` Tauri pour déterminer le chemin
    - Créer le dossier `{app_data_dir}/backups/v{current_version}/`
    - Copier le binaire actuel (exécutable app) dans le dossier backup
    - Écrire `backup-info.json` : `{ "version": "1.0.0", "backup_date": "...", "app_path": "..." }`
  - [x] 2.2 Créer `src/application/use_cases/restore_backup.rs`
    - Lire `backup-info.json` pour vérifier le backup
    - Restaurer le binaire depuis le backup vers l'emplacement original
    - Supprimer le dossier backup après restauration réussie
    - Utiliser `app.restart()` après restauration
  - [x] 2.3 Créer `src/application/use_cases/cleanup_old_backups.rs`
    - Scanner le dossier `backups/`
    - Garder uniquement le backup le plus récent
    - Supprimer les backups plus anciens
  - [x] 2.4 Écrire tests inline (8+ tests)

### Backend (Rust) - Tauri Commands Rollback

- [x] **Task 3: Créer les commandes Tauri rollback** (AC: #2, #3, #5)
  - [x] 3.1 Créer `src/infrastructure/tauri_commands/rollback_commands.rs`
  - [x] 3.2 Commande `get_backup_info()` → retourne `Option<BackupInfo>` avec version, date, taille
  - [x] 3.3 Commande `manual_rollback()` → restaure la version précédente et redémarre
  - [x] 3.4 Commande `get_crash_count()` → retourne le compteur de crashes consécutifs
  - [x] 3.5 Commande `send_crash_report(include_logs: bool)` → envoie le rapport au backend
  - [x] 3.6 Enregistrer les commandes dans `main.rs`
  - [x] 3.7 Écrire tests inline (6+ tests)

### Backend (Rust) - Intégration Startup

- [x] **Task 4: Intégrer la détection de crash au démarrage** (AC: #2, #3)
  - [x] 4.1 Dans `main.rs` setup hook : charger le `crash-tracker.json`
  - [x] 4.2 Incrémenter le compteur de crashes au démarrage
  - [x] 4.3 Si `needs_rollback == true` : exécuter `restore_backup` automatiquement
  - [x] 4.4 Si rollback réussi : émettre event Tauri `rollback:completed` avec `{ previous_version, restored_version }`
  - [x] 4.5 Après 30 secondes : réinitialiser le compteur (tokio::spawn + sleep)
  - [x] 4.6 Avant installation update (modifier le flow existant) : appeler `backup_current_version`
  - [x] 4.7 Écrire tests inline (4+ tests)

### Backend (NestJS) - Crash Report Endpoint

- [x] **Task 5: Créer l'endpoint de rapport de crash** (AC: #4)
  - [x] 5.1 Créer `src/application/dto/crash-report.dto.ts`
    - Champs : `version: string`, `platform: string`, `crash_count: number`, `previous_version: string`, `error_log?: string`
  - [x] 5.2 Ajouter `POST /api/v1/crashes/report` dans `update.controller.ts`
  - [x] 5.3 Valider le DTO avec class-validator
  - [x] 5.4 Persister le rapport (table Prisma `CrashReport` ou log uniquement pour MVP)
  - [x] 5.5 Répondre avec `{ success: true }`
  - [x] 5.6 Écrire tests (4+ tests)

### Frontend - Composant RollbackNotification

- [x] **Task 6: Créer le composant RollbackNotification** (AC: #2, #4)
  - [x] 6.1 Créer `apps/desktop/src/components/update/RollbackNotification.tsx`
  - [x] 6.2 Afficher un dialogue modal lors d'un rollback automatique :
    - Titre : "Version précédente restaurée"
    - Message : "La mise à jour v{failed_version} a causé des problèmes. La version v{restored_version} a été restaurée."
    - Bouton "Envoyer le rapport de crash" (optionnel)
    - Bouton "OK" (fermer)
  - [x] 6.3 Écouter l'event `rollback:completed` pour afficher le dialogue
  - [x] 6.4 Intégrer dans `App.tsx`
  - [x] 6.5 Écrire tests (6+ tests Vitest)

### Frontend - Section Settings Rollback

- [x] **Task 7: Ajouter section rollback dans les paramètres** (AC: #5)
  - [x] 7.1 Identifier le composant Settings existant (ou créer si nécessaire)
  - [x] 7.2 Ajouter section "Mises à jour" avec :
    - Info version actuelle
    - Si backup disponible : bouton "Revenir à v{version}" avec confirmation AlertDialog
    - Si pas de backup : texte "Aucune version précédente disponible"
  - [x] 7.3 Appeler `manual_rollback()` sur confirmation
  - [x] 7.4 Écrire tests (5+ tests Vitest)

### Frontend - Extension du Update Store

- [x] **Task 8: Étendre le store pour rollback** (AC: #2, #5)
  - [x] 8.1 Ajouter état : `backupInfo: BackupInfo | null`, `rollbackCompleted: RollbackEvent | null`
  - [x] 8.2 Ajouter type `BackupInfo`: `{ version: string, backupDate: string, sizeMb: number }`
  - [x] 8.3 Ajouter type `RollbackEvent`: `{ previousVersion: string, restoredVersion: string }`
  - [x] 8.4 Ajouter action `fetchBackupInfo()` → invoke `get_backup_info`
  - [x] 8.5 Ajouter action `performManualRollback()` → invoke `manual_rollback`
  - [x] 8.6 Ajouter action `sendCrashReport(includeLogs: boolean)` → invoke `send_crash_report`
  - [x] 8.7 Ajouter action `clearRollbackNotification()`
  - [x] 8.8 Dans `initEventListeners()` : écouter `rollback:completed`
  - [x] 8.9 Écrire tests additionnels (8+ tests)

### Frontend - Update Service Extension

- [x] **Task 9: Étendre update-service.ts** (AC: #5)
  - [x] 9.1 Ajouter `getBackupInfo()` → `invoke('get_backup_info')`
  - [x] 9.2 Ajouter `manualRollback()` → `invoke('manual_rollback')`
  - [x] 9.3 Ajouter `getCrashCount()` → `invoke('get_crash_count')`
  - [x] 9.4 Ajouter `sendCrashReport(includeLogs: boolean)` → `invoke('send_crash_report', { includeLogs })`
  - [x] 9.5 Ajouter `onRollbackCompleted(callback)` → event listener `rollback:completed`
  - [x] 9.6 Écrire tests additionnels (6+ tests)

## Dev Notes

### Architecture Compliance

Cette story étend le système de mise à jour créé dans les Stories 8.1 et 8.2. Elle suit la **Clean Architecture** établie.

**Nouveaux fichiers Rust :**
```
apps/desktop/src-tauri/src/
├── domain/
│   └── entities/
│       └── crash_tracker.rs                (NOUVEAU)
├── application/
│   └── use_cases/
│       ├── backup_current_version.rs       (NOUVEAU)
│       ├── restore_backup.rs               (NOUVEAU)
│       └── cleanup_old_backups.rs          (NOUVEAU)
├── infrastructure/
│   ├── config/app_state.rs                 (MODIFIER: CrashTrackerState)
│   └── tauri_commands/
│       └── rollback_commands.rs            (NOUVEAU)
└── main.rs                                 (MODIFIER: crash detection, backup integration)
```

**Nouveaux fichiers Frontend :**
```
apps/desktop/src/
├── components/update/
│   └── RollbackNotification.tsx            (NOUVEAU)
├── stores/update-store.ts                  (MODIFIER: rollback state)
├── services/update-service.ts              (MODIFIER: rollback APIs)
```

**Backend (NestJS) :**
```
apps/backend-api/src/
├── application/dto/crash-report.dto.ts     (NOUVEAU)
├── infrastructure/controllers/update.controller.ts (MODIFIER: crash report endpoint)
```

### Patterns existants à suivre STRICTEMENT

**State Pattern (Mutex pour crash tracker) :**
```rust
// Comme UpdateState dans app_state.rs
pub struct CrashTrackerState {
    pub consecutive_crashes: u32,
    pub needs_rollback: bool,
    pub previous_version: Option<String>,
    pub last_updated_version: Option<String>,
}
```

**Fichier Persistance Pattern :**
```rust
// Persister dans {app_data_dir}/crash-tracker.json
use tauri::api::path::app_data_dir;

#[derive(Serialize, Deserialize)]
struct CrashTrackerFile {
    consecutive_crashes: u32,
    needs_rollback: bool,
    previous_version: Option<String>,
    last_updated_version: Option<String>,
}
```

**Tauri Command Pattern (comme update_commands.rs) :**
```rust
#[tauri::command]
pub async fn get_backup_info(
    app: tauri::AppHandle,
) -> Result<Option<BackupInfo>, String> {
    // ...
}
```

**AlertDialog Pattern (pour confirmation rollback, copier UpdateDialog) :**
```typescript
<AlertDialog open={showConfirm}>
  <AlertDialogContent className="max-w-[520px] p-0 gap-0 border-white/5 bg-card-dark">
    <AlertDialogHeader>
      <AlertDialogTitle>Revenir à la version précédente</AlertDialogTitle>
      <AlertDialogDescription>
        Voulez-vous revenir à la version v{backupInfo.version} ?
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Annuler</AlertDialogCancel>
      <AlertDialogAction onClick={handleRollback}>Revenir</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Event Pattern (comme update events) :**
```rust
// Émettre rollback event
app.emit("rollback:completed", RollbackCompletedEvent {
    previous_version: failed_version,
    restored_version: backup_version,
})?;
```

### Types existants à réutiliser (NE PAS RECRÉER)

**Rust — déjà existant :**
- `UpdateInfo` (update_info.rs) — version, release_date, etc.
- `UpdateStatus` (update_info.rs) — Idle, Checking, Available, etc.
- `AppVersion` (app_version.rs) — parsing et comparaison de versions
- `DomainError` (domain_error.rs) — erreurs avec `UpdateCheckFailed`, `UpdateDownloadFailed`

**TypeScript — déjà existant :**
- `UpdateInfo`, `UpdateStatus` (types/update.ts)
- `updateService` (services/update-service.ts) — toutes les fonctions invoke
- `useUpdateStore` (stores/update-store.ts) — store Zustand

**Commandes Tauri existantes (NE PAS MODIFIER leur signature) :**
- `check_for_update`, `download_update`, `cancel_update_download`
- `get_update_status`, `install_update`
- `set_install_on_quit`, `get_install_on_quit`

### Détails techniques importants

#### Backup Strategy — Tauri macOS

Sur macOS, le binaire de l'application est dans le `.app` bundle. Le backup doit copier le bundle complet :
```
/Applications/Splice.app/  →  {app_data_dir}/backups/v1.0.0/Splice.app/
```

**Utiliser `std::env::current_exe()` pour obtenir le chemin du binaire actuel.**
**Utiliser `tauri::api::path::app_data_dir()` pour le dossier de données.**

Le chemin du bundle macOS se calcule en remontant de l'exécutable :
```rust
let exe_path = std::env::current_exe()?;
// exe_path = /Applications/Splice.app/Contents/MacOS/Splice
// bundle_path = /Applications/Splice.app
let bundle_path = exe_path
    .parent()  // MacOS/
    .and_then(|p| p.parent())  // Contents/
    .and_then(|p| p.parent()); // Splice.app/
```

**ATTENTION :** `tauri-plugin-updater` sur macOS utilise un `.tar.gz` pour les mises à jour, et remplace le `.app` bundle directement. Le backup doit être fait AVANT `download_and_install()`.

#### Intégration avec le flow existant

Le flow de backup doit être injecté dans le flow d'installation existant :

1. **Avant `install_update`** (dans `update_commands.rs`) :
   - Appeler `backup_current_version`
   - Si backup échoue → loguer l'erreur mais NE PAS bloquer l'installation
   - Mettre à jour `crash-tracker.json` avec `previous_version`

2. **Avant `app.restart()`** (dans `on_window_event` pour install_on_quit) :
   - Même logique de backup

3. **Au startup dans `main.rs`** :
   - Charger `crash-tracker.json`
   - Si `needs_rollback == true` → restaurer le backup
   - Sinon → incrémenter `consecutive_crashes`
   - Après 30s → réinitialiser `consecutive_crashes = 0`

#### Crash Detection Timing

```
Démarrage app
  ├─ Charger crash-tracker.json
  ├─ Si needs_rollback → restore_backup() → restart
  ├─ Sinon → consecutive_crashes += 1
  │   ├─ Si consecutive_crashes >= 3 → needs_rollback = true → sauvegarder → exit
  │   └─ Sinon → sauvegarder
  └─ tokio::spawn(async {
       tokio::time::sleep(Duration::from_secs(30)).await;
       consecutive_crashes = 0;
       sauvegarder crash-tracker.json;
     })
```

#### DomainError — Nouveaux variants à ajouter

```rust
// Ajouter dans domain_error.rs
#[serde(rename = "BACKUP_FAILED")]
BackupFailed(String),

#[serde(rename = "RESTORE_FAILED")]
RestoreFailed(String),

#[serde(rename = "CRASH_REPORT_FAILED")]
CrashReportFailed(String),
```

**Aussi ajouter dans `packages/types/src/generated/DomainError.ts` le mapping TypeScript.**

#### Logs — Lecture pour rapport de crash

Pour le rapport de crash (AC4), lire les dernières 100 lignes du fichier log :
```rust
// Log file location: {app_data_dir}/logs/splice.log
// Utiliser read_to_string + split par lignes + take last 100
```

**ATTENTION :** Ne pas envoyer d'informations sensibles (paths absolus contenant le nom d'utilisateur). Nettoyer les paths avant envoi.

### Tauri Plugin Updater — Rollback Considerations

Le `tauri-plugin-updater` v2 ne fournit PAS de mécanisme de rollback natif. Il supporte `allowDowngrades` pour permettre l'installation de versions antérieures via le serveur de mises à jour, mais cela nécessite une action serveur-side.

Notre approche est **locale** : backup du binaire avant update, restauration si crash détecté. Cela est indépendant du plugin updater.

### Testing Strategy

**Rust Tests (inline) :**
- `crash_tracker.rs` : 6+ tests
  - Incrémentation/réinitialisation du compteur
  - Détection de 3 crashes consécutifs
  - Persistance JSON
  - Réinitialisation après démarrage sain
- `backup_current_version.rs` : 4+ tests
  - Création backup réussie
  - Cleanup ancien backup
  - Écriture backup-info.json
- `restore_backup.rs` : 4+ tests
  - Restauration réussie
  - Pas de backup disponible
  - Backup corrompu
- `rollback_commands.rs` : 6+ tests
  - get_backup_info avec/sans backup
  - manual_rollback success/failure
  - send_crash_report

**Frontend Tests (Vitest + React Testing Library) :**
- `RollbackNotification.test.tsx` : 6+ tests
  - Affiche le dialogue sur rollback:completed
  - Contient les bonnes versions
  - Bouton crash report appelle sendCrashReport
  - Bouton OK ferme le dialogue
- `update-store.test.ts` : 8+ tests additionnels
  - fetchBackupInfo charge les données
  - performManualRollback appelle la commande
  - rollbackCompleted event met à jour le state
  - clearRollbackNotification vide le state
- `update-service.test.ts` : 6+ tests additionnels
  - getBackupInfo, manualRollback, getCrashCount, sendCrashReport

**Backend Tests (NestJS) :**
- `update.controller.spec.ts` : 4+ tests additionnels
  - POST /crashes/report success
  - Validation DTO
  - Rate limiting

### Previous Story Intelligence

**De Story 8.2 (Completion Notes) :**
- Le `set_update_state()` doit préserver le flag `install_on_quit` — pattern à suivre pour le crash tracker
- Les commandes Tauri utilisent `Result<T, String>` — suivre ce pattern
- Le `on_window_event(CloseRequested)` handler est déjà dans `main.rs` — l'étendre pour le backup
- Le barrel export `index.ts` dans `components/update/` existe déjà — ajouter `RollbackNotification`
- Tests utilisent des mocks pour `@tauri-apps/api/core` invoke — réutiliser ce pattern

**De Story 8.1 (Completion Notes) :**
- Le plugin updater utilise `download_and_install()` qui prépare ET installe — le backup doit être fait AVANT cet appel
- Les événements Tauri suivent le pattern `domaine:action` — utiliser `rollback:completed`, `rollback:failed`
- `AppVersion::parse()` est disponible pour comparer les versions
- Le setup hook dans `main.rs` est le bon endroit pour la détection de crash

### Git Intelligence

**Commits récents pertinents :**
- `a8a333f` fix(updates): code review fixes — corrigé le bug de reset silencieux de `install_on_quit` dans `set_update_state`
- `9a856c9` feat(updates): implement automatic update check — pattern de setup hook et periodic check
- `70d30f8` feat(billing): add billing checks — pattern d'intégration dans startup

### Security Considerations

1. **Pas de données sensibles dans le rapport de crash** — nettoyer les paths (remplacer `/Users/username/` par `~/`)
2. **Le backup ne contient que le binaire** — pas de données utilisateur
3. **La restauration vérifie l'intégrité du backup** — vérifier que `backup-info.json` est valide avant restauration
4. **Rate limiting sur l'endpoint crash report** — limiter à 5 requêtes/minute/IP

### Project Structure Notes

- Le fichier `crash-tracker.json` est dans `app_data_dir` — pas dans le bundle app
- Le dossier `backups/` est dans `app_data_dir` — pas dans le dossier d'installation
- Les nouveaux fichiers suivent la convention `snake_case.rs` / `PascalCase.tsx`
- Les nouvelles commandes Tauri sont dans un fichier séparé `rollback_commands.rs`

### References

- [Source: epic-8-reliable-auto-updates.md#Story-8.3] - Requirements originaux
- [Source: 8-1-update-check-background-download.md] - Infrastructure update complète
- [Source: 8-2-update-notification-installation.md] - Notification et install-on-quit
- [Source: apps/desktop/src-tauri/src/infrastructure/config/app_state.rs] - AppState existant
- [Source: apps/desktop/src-tauri/src/infrastructure/tauri_commands/update_commands.rs] - Commandes Tauri existantes
- [Source: apps/desktop/src-tauri/src/main.rs] - Setup hook et window event handler
- [Source: apps/desktop/src-tauri/src/domain/entities/update_info.rs] - Types update existants
- [Source: apps/desktop/src-tauri/src/domain/value_objects/app_version.rs] - Version comparison
- [Source: apps/desktop/src/stores/update-store.ts] - Store existant
- [Source: apps/desktop/src/services/update-service.ts] - Service existant
- [Source: apps/desktop/src/components/update/] - Composants update existants
- [Source: tauri-plugin-updater v2 docs](https://v2.tauri.app/plugin/updater/) - Pas de rollback natif
- [Source: architecture/cross-cutting-technical-strategies.md] - Logging et error codes

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- **H2**: `send_crash_report` command now sends actual HTTP POST via reqwest to `SPLICE_API_URL/api/v1/crashes/report` (was TODO/logging only)
- **H4**: `cleanup_old_backups` moved to AFTER successful backup creation in `backup_current_version.rs` to prevent data loss if new backup fails
- **H5**: Automatic rollback now persists completion info to `crash-tracker.json` and calls `app.restart()` — notification emitted on next startup via `take_rollback_completed()`
- **M1**: Removed duplicate `copy_dir_recursive` from `restore_backup.rs`; now imports from `backup_current_version` (`pub(crate)`)
- **M2**: Fixed `sanitize_path` bug with multiple user paths per line (was referencing original `line` instead of mutated `result`)
- **M3**: `set_previous_version` no longer incorrectly sets `last_updated_version`
- **L1**: Fixed all French accent issues in `RollbackNotification.tsx` and `SettingsRollbackSection.tsx`
- **H3 (documented)**: `main.rs` startup logic (crash detection, rollback, event emission) requires Tauri integration test infrastructure; not unit-testable with inline `#[test]`
- **M5 (documented)**: `useIdleNotification.ts` is not part of Story 8.3 scope — it handles idle detection for notification scheduling (separate concern)
- **L2 (documented)**: `cleanup_old_backups.rs` standalone use case file is dead code; cleanup logic is inlined in `backup_current_version.rs`
- **L3 (documented)**: `DomainError` variants `BackupFailed`, `RestoreFailed`, `CrashReportFailed` are declared but unused — rollback commands use `Result<T, String>` pattern

### File List

#### Rust Backend (Modified)
- `apps/desktop/src-tauri/src/domain/entities/crash_tracker.rs` — Added rollback completion fields, `set_rollback_completed()`, `take_rollback_completed()`, fixed `set_previous_version`, 3 new tests
- `apps/desktop/src-tauri/src/application/use_cases/backup_current_version.rs` — Moved cleanup after backup (H4), `copy_dir_recursive` now `pub(crate)` (M1)
- `apps/desktop/src-tauri/src/application/use_cases/restore_backup.rs` — Removed duplicate `copy_dir_recursive`, imports from `backup_current_version` (M1)
- `apps/desktop/src-tauri/src/infrastructure/tauri_commands/rollback_commands.rs` — Implemented HTTP POST via reqwest (H2), fixed `sanitize_path` multi-path bug (M2), 2 new tests
- `apps/desktop/src-tauri/src/main.rs` — Added rollback completion persistence + restart after auto-rollback (H5), emit notification on next startup

#### Rust Backend (New)
- `apps/desktop/src-tauri/src/domain/entities/crash_tracker.rs` — CrashTracker entity with crash detection, rollback tracking, JSON persistence
- `apps/desktop/src-tauri/src/application/use_cases/backup_current_version.rs` — BackupCurrentVersionUseCase, BackupInfo, copy_dir_recursive, cleanup
- `apps/desktop/src-tauri/src/application/use_cases/restore_backup.rs` — RestoreBackupUseCase, get_backup_info, restore from backup
- `apps/desktop/src-tauri/src/application/use_cases/cleanup_old_backups.rs` — CleanupOldBackupsUseCase (standalone, unused — logic inlined in backup)
- `apps/desktop/src-tauri/src/infrastructure/tauri_commands/rollback_commands.rs` — get_backup_info, manual_rollback, get_crash_count, send_crash_report commands

#### Rust Backend (Modified — Pre-existing files)
- `apps/desktop/src-tauri/src/infrastructure/config/app_state.rs` — Added `crash_tracker: Mutex<CrashTracker>` to AppState
- `apps/desktop/src-tauri/src/domain/entities/mod.rs` — Added CrashTracker module export
- `apps/desktop/src-tauri/src/domain/errors/domain_error.rs` — Added BackupFailed, RestoreFailed, CrashReportFailed variants
- `apps/desktop/src-tauri/src/application/use_cases/mod.rs` — Added backup/restore/cleanup module exports
- `apps/desktop/src-tauri/src/infrastructure/tauri_commands/mod.rs` — Added rollback_commands module
- `apps/desktop/src-tauri/src/infrastructure/tauri_commands/update_commands.rs` — Backup integration before install_update

#### Frontend (New)
- `apps/desktop/src/components/update/RollbackNotification.tsx` — Rollback notification dialog with crash report opt-in
- `apps/desktop/src/components/update/SettingsRollbackSection.tsx` — Settings dialog for manual rollback
- `apps/desktop/src/components/update/RollbackNotification.test.tsx` — 6 tests for RollbackNotification
- `apps/desktop/src/components/update/SettingsRollbackSection.test.tsx` — 8 tests for SettingsRollbackSection

#### Frontend (Modified)
- `apps/desktop/src/App.tsx` — Integrated RollbackNotification, initUpdateEventListeners
- `apps/desktop/src/components/layout/TopBar.tsx` — Integrated SettingsRollbackSection
- `apps/desktop/src/services/update-service.ts` — Added getBackupInfo, manualRollback, getCrashCount, sendCrashReport, onRollbackCompleted
- `apps/desktop/src/services/update-service.test.ts` — Added rollback service tests
- `apps/desktop/src/stores/update-store.ts` — Added rollback state/actions, rollback:completed event listener
- `apps/desktop/src/stores/update-store.test.ts` — Added rollback store tests
- `apps/desktop/src/types/update.ts` — Added BackupInfo, RollbackCompletedEvent types
- `apps/desktop/src/components/update/index.ts` — Added RollbackNotification barrel export

#### Backend NestJS (New/Modified)
- `apps/backend-api/src/application/dto/crash-report.dto.ts` — CrashReportDto with class-validator
- `apps/backend-api/src/infrastructure/controllers/update.controller.ts` — Added POST /crashes/report endpoint
- `apps/backend-api/src/infrastructure/controllers/update.controller.spec.ts` — Added crash report controller tests
- `apps/backend-api/src/shared/errors/error-codes.ts` — Added CRASH_REPORT_FAILED error code

#### Generated
- `apps/packages/types/src/generated/DomainError.ts` — Updated with BackupFailed, RestoreFailed, CrashReportFailed
