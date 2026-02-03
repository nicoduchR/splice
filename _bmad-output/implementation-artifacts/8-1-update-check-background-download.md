# Story 8.1: Update Check & Background Download

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want the app to check for updates automatically,
so that I always have the latest features and bug fixes without manual intervention.

## Acceptance Criteria

### AC1: Update Check on Startup

**Given** app launches (FR45)
**When** app initialization completes
**Then** update check runs automatically in background
**And** update server queried: `GET /api/v1/updates/latest?platform=macos&version={current_version}`
**And** check does not block app startup or user interaction
**And** check runs asynchronously with <500ms impact on startup time

### AC2: Update Server Response Handling

**Given** update check request sent
**When** server responds successfully
**Then** response parsed with schema:
```json
{
  "version": "1.1.0",
  "releaseDate": "2025-01-15",
  "platforms": {
    "darwin-aarch64": {
      "url": "https://updates.splice.app/v1.1.0/Splice-macos-aarch64.tar.gz",
      "signature": "..."
    },
    "darwin-x86_64": {
      "url": "https://updates.splice.app/v1.1.0/Splice-macos-x86_64.tar.gz",
      "signature": "..."
    }
  },
  "changelog": "- Feature X\n- Bug fix Y",
  "notes": "..."
}
```
**And** version comparison performed (semver)
**And** if `response.version > current_version`, update available flagged
**And** if `response.version <= current_version`, no action taken

### AC3: Background Download

**Given** new version available (FR46)
**When** update detected
**Then** download starts automatically in background
**And** download runs silently (no UI interruption)
**And** download progress tracked internally (for Story 8.2 notification)
**And** user can continue working without impact
**And** download uses temp directory: `{app_data_dir}/.splice/updates/pending/`

### AC4: Download Progress Tracking

**Given** download in progress
**When** bytes received
**Then** progress percentage calculated: `(downloaded / total) * 100`
**And** progress stored in application state
**And** Tauri event emitted: `update-download-progress` with `{ percent: number, downloaded: number, total: number }`
**And** on completion, event emitted: `update-download-complete` with `{ version: string, path: string }`

### AC5: Signature Verification (NFR19)

**Given** download completes
**When** update file saved
**Then** Ed25519 signature verified against public key
**And** if signature valid, update marked as ready to install
**And** if signature invalid:
  - Update file deleted
  - Error logged: "Update signature verification failed for v{version}"
  - Update rejected silently (no user error shown)
  - Next check scheduled normally

### AC6: Offline/Network Error Handling (NFR28)

**Given** app launches or periodic check runs
**When** network unavailable or server unreachable
**Then** update check fails gracefully (no error shown to user)
**And** error logged at DEBUG level: "Update check failed: {reason}"
**And** retry scheduled when connection restored (via network status listener)
**And** exponential backoff applied: 5s, 15s, 45s, 2min max

### AC7: Periodic Update Checks

**Given** app is running
**When** 6 hours elapsed since last check
**Then** new update check triggered automatically
**And** check interval configurable (default: 6 hours)
**And** check only runs if app is idle (no active transcription/export)

## Tasks / Subtasks

### Backend (NestJS) - Update Manifest Endpoint

- [ ] **Task 1: Create Update Domain Entities** (AC: #2)
  - [ ] 1.1 Create `src/domain/entities/app-release.entity.ts`
    - Properties: `version`, `releaseDate`, `changelog`, `notes`, `platforms` (Map<string, PlatformRelease>)
    - PlatformRelease: `url`, `signature`, `size`
  - [ ] 1.2 Create `src/domain/value-objects/semver.vo.ts` for version comparison
  - [ ] 1.3 Create `src/domain/ports/release.repository.port.ts` interface

- [ ] **Task 2: Create Update DTOs** (AC: #2)
  - [ ] 2.1 Create `src/application/dto/check-update.dto.ts`
    - Query params: `platform: string`, `version: string`, `arch?: string`
  - [ ] 2.2 Create `src/application/dto/update-response.dto.ts`
    - Response: `version`, `releaseDate`, `platforms`, `changelog`, `notes`

- [ ] **Task 3: Create Get Latest Release Use Case** (AC: #2)
  - [ ] 3.1 Create `src/application/use-cases/get-latest-release.use-case.ts`
  - [ ] 3.2 Inject `IReleaseRepository`
  - [ ] 3.3 Implement version comparison logic (semver)
  - [ ] 3.4 Return `null` if no newer version available
  - [ ] 3.5 Write unit tests (min 6 test cases)

- [ ] **Task 4: Create Update Controller** (AC: #1, #2)
  - [ ] 4.1 Create `src/infrastructure/controllers/update.controller.ts`
  - [ ] 4.2 Add `GET /api/v1/updates/latest` endpoint
  - [ ] 4.3 Apply rate limiting: 10 requests/minute per IP
  - [ ] 4.4 Return 204 No Content if no update available
  - [ ] 4.5 Return 200 with update manifest if available
  - [ ] 4.6 Write controller tests (min 5 test cases)

- [ ] **Task 5: Create Release Repository Implementation** (AC: #2)
  - [ ] 5.1 Create `src/infrastructure/adapters/prisma/prisma-release.repository.ts`
  - [ ] 5.2 Add Prisma schema for `AppRelease` and `PlatformRelease` tables
  - [ ] 5.3 Run migration
  - [ ] 5.4 Create initial seed data for current version

### Desktop (Rust) - Updater Integration

- [ ] **Task 6: Add Tauri Updater Plugin** (AC: #1, #3, #5)
  - [ ] 6.1 Add `tauri-plugin-updater` to Cargo.toml dependencies
  - [ ] 6.2 Generate signing keys: `pnpm tauri signer generate -w ~/.tauri/splice.key`
  - [ ] 6.3 Add public key to `tauri.conf.json` plugins.updater.pubkey
  - [ ] 6.4 Configure endpoint in `tauri.conf.json`:
    ```json
    "plugins": {
      "updater": {
        "endpoints": ["https://api.splice.app/api/v1/updates/latest?platform={{target}}&version={{current_version}}"],
        "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6...",
        "windows": { "installMode": "passive" }
      }
    }
    ```
  - [ ] 6.5 Add `updater:default` permission to capabilities/default.json

- [ ] **Task 7: Create Update Domain Module** (AC: #1, #2, #3)
  - [ ] 7.1 Create `src/domain/entities/update_info.rs`
    - Struct: `UpdateInfo { version, release_date, download_url, signature, changelog }`
  - [ ] 7.2 Create `src/domain/value_objects/app_version.rs`
    - Implement `Ord` trait for semver comparison
  - [ ] 7.3 Create `src/domain/repositories/update_repository.rs` trait
    - `check_for_update()`, `get_download_progress()`, `get_pending_update()`

- [ ] **Task 8: Create Update Check Use Case** (AC: #1, #2, #6)
  - [ ] 8.1 Create `src/application/use_cases/check_for_update.rs`
  - [ ] 8.2 Use `tauri_plugin_updater::check()` API
  - [ ] 8.3 Handle network errors gracefully (return Ok(None))
  - [ ] 8.4 Parse and validate response
  - [ ] 8.5 Store update info in state if available
  - [ ] 8.6 Write unit tests with mocked updater

- [ ] **Task 9: Create Background Download Use Case** (AC: #3, #4, #5)
  - [ ] 9.1 Create `src/application/use_cases/download_update.rs`
  - [ ] 9.2 Use `update.download()` from tauri-plugin-updater
  - [ ] 9.3 Emit progress events via Tauri event system
  - [ ] 9.4 Handle download cancellation
  - [ ] 9.5 Verify signature on completion (built-in to plugin)
  - [ ] 9.6 Store download path in state
  - [ ] 9.7 Write unit tests

- [ ] **Task 10: Create Update Tauri Commands** (AC: #1, #3, #6, #7)
  - [ ] 10.1 Create `src/infrastructure/tauri_commands/update_commands.rs`
  - [ ] 10.2 Add `check_for_update` command (returns UpdateInfo | null)
  - [ ] 10.3 Add `download_update` command (starts background download)
  - [ ] 10.4 Add `get_update_status` command (returns current status)
  - [ ] 10.5 Register commands in main.rs

- [ ] **Task 11: Implement Startup Update Check** (AC: #1, #7)
  - [ ] 11.1 Add update check to app `setup` hook in main.rs
  - [ ] 11.2 Run check in background task (tokio::spawn)
  - [ ] 11.3 Implement 6-hour periodic check timer
  - [ ] 11.4 Add idle detection (skip if transcribing/exporting)
  - [ ] 11.5 Implement exponential backoff for retries

- [ ] **Task 12: Create Update State Management** (AC: #3, #4)
  - [ ] 12.1 Add UpdateState to AppState struct
    - `update_available: Option<UpdateInfo>`
    - `download_progress: Option<DownloadProgress>`
    - `is_downloading: bool`
    - `last_check: Option<DateTime>`
  - [ ] 12.2 Create state getters/setters with proper locking

### Frontend (TypeScript) - Update Service

- [ ] **Task 13: Create Update Types** (AC: #2, #4)
  - [ ] 13.1 Create `types/update.ts`:
    - `UpdateInfo`: version, releaseDate, changelog, downloadUrl
    - `DownloadProgress`: percent, downloaded, total
    - `UpdateStatus`: 'checking' | 'available' | 'downloading' | 'ready' | 'none'

- [ ] **Task 14: Create Update Service** (AC: #1, #3, #4)
  - [ ] 14.1 Create `services/update-service.ts`
  - [ ] 14.2 Add `checkForUpdate()`: invoke('check_for_update')
  - [ ] 14.3 Add `downloadUpdate()`: invoke('download_update')
  - [ ] 14.4 Add `getUpdateStatus()`: invoke('get_update_status')
  - [ ] 14.5 Write service tests (min 6 tests)

- [ ] **Task 15: Create Update Store** (AC: #3, #4)
  - [ ] 15.1 Create `stores/update-store.ts`
  - [ ] 15.2 Add state: `updateInfo`, `downloadProgress`, `status`, `error`
  - [ ] 15.3 Add actions: `checkForUpdate()`, `startDownload()`, `clearError()`
  - [ ] 15.4 Subscribe to Tauri events for progress updates
  - [ ] 15.5 Write store tests (min 8 tests)

- [ ] **Task 16: Initialize Update Check on App Start** (AC: #1, #7)
  - [ ] 16.1 Add `useEffect` in App.tsx to trigger update check on mount
  - [ ] 16.2 Subscribe to `update-download-progress` event
  - [ ] 16.3 Subscribe to `update-download-complete` event
  - [ ] 16.4 Handle errors silently (console.debug only)

## Dev Notes

### Architecture Compliance

Cette story suit la **Clean Architecture** établie dans le projet Splice:

**Backend (NestJS):**
```
apps/backend-api/src/
├── domain/
│   ├── entities/app-release.entity.ts       (NOUVEAU)
│   ├── value-objects/semver.vo.ts           (NOUVEAU)
│   └── ports/release.repository.port.ts     (NOUVEAU)
├── application/
│   ├── dto/check-update.dto.ts              (NOUVEAU)
│   ├── dto/update-response.dto.ts           (NOUVEAU)
│   └── use-cases/get-latest-release.use-case.ts (NOUVEAU)
├── infrastructure/
│   ├── controllers/update.controller.ts     (NOUVEAU)
│   └── adapters/prisma/prisma-release.repository.ts (NOUVEAU)
└── shared/errors/error-codes.ts             (ÉTENDRE avec UPDATE_* codes)
```

**Desktop (Rust):**
```
apps/desktop/src-tauri/src/
├── domain/
│   ├── entities/update_info.rs              (NOUVEAU)
│   ├── value_objects/app_version.rs         (NOUVEAU)
│   └── repositories/update_repository.rs    (NOUVEAU)
├── application/
│   └── use_cases/
│       ├── check_for_update.rs              (NOUVEAU)
│       └── download_update.rs               (NOUVEAU)
└── infrastructure/
    └── tauri_commands/update_commands.rs    (NOUVEAU)
```

**Frontend (TypeScript):**
```
apps/desktop/src/
├── services/update-service.ts               (NOUVEAU)
├── stores/update-store.ts                   (NOUVEAU)
└── types/update.ts                          (NOUVEAU)
```

### Tauri Plugin Updater Integration

**Important:** Cette story utilise `tauri-plugin-updater` v2 qui gère automatiquement:
- Téléchargement avec vérification de signature Ed25519
- Gestion du stockage temporaire
- Installation cross-platform (macOS, Windows)

**Configuration requise dans tauri.conf.json:**
```json
{
  "plugins": {
    "updater": {
      "endpoints": [
        "https://api.splice.app/api/v1/updates/latest?platform={{target}}&version={{current_version}}"
      ],
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1p...",
      "windows": {
        "installMode": "passive"
      }
    }
  },
  "bundle": {
    "createUpdaterArtifacts": true
  }
}
```

**Génération des clés de signature:**
```bash
# Générer la paire de clés (une seule fois, stocker en sécurité)
pnpm tauri signer generate -w ~/.tauri/splice.key

# La clé publique (*.key.pub) va dans tauri.conf.json
# La clé privée (*.key) est utilisée en CI pour signer les builds
```

**Variables d'environnement CI/CD:**
```bash
TAURI_SIGNING_PRIVATE_KEY="contenu de ~/.tauri/splice.key"
TAURI_SIGNING_PRIVATE_KEY_PASSWORD="mot_de_passe"
```

### Backend Update Manifest Format

Le backend doit retourner un format compatible avec tauri-plugin-updater:

```json
{
  "version": "1.1.0",
  "notes": "Changelog...",
  "pub_date": "2025-01-15T00:00:00Z",
  "platforms": {
    "darwin-aarch64": {
      "url": "https://updates.splice.app/v1.1.0/Splice.app.tar.gz",
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25..."
    },
    "darwin-x86_64": {
      "url": "https://updates.splice.app/v1.1.0/Splice-x86_64.app.tar.gz",
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25..."
    },
    "windows-x86_64": {
      "url": "https://updates.splice.app/v1.1.0/Splice-Setup.exe",
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25..."
    }
  }
}
```

### Existing Patterns to Follow

**Use Case Pattern (from license use cases):**
```rust
// src/application/use_cases/check_for_update.rs
pub struct CheckForUpdateUseCase {
    updater: UpdaterHandle,
}

impl CheckForUpdateUseCase {
    pub async fn execute(&self) -> Result<Option<UpdateInfo>, DomainError> {
        match self.updater.check().await {
            Ok(Some(update)) => Ok(Some(UpdateInfo::from(update))),
            Ok(None) => Ok(None),
            Err(e) => {
                tracing::debug!("Update check failed: {}", e);
                Ok(None)  // Fail silently
            }
        }
    }
}
```

**Tauri Command Pattern:**
```rust
// src/infrastructure/tauri_commands/update_commands.rs
#[tauri::command]
pub async fn check_for_update(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<Option<UpdateInfoDto>, String> {
    let updater = app.updater_builder().build()?;

    match updater.check().await {
        Ok(Some(update)) => {
            let info = UpdateInfoDto::from(&update);
            state.set_update_available(Some(info.clone()));
            Ok(Some(info))
        }
        Ok(None) => Ok(None),
        Err(e) => {
            tracing::debug!("Update check failed: {}", e);
            Ok(None)
        }
    }
}
```

**Event Emission Pattern:**
```rust
// Émettre l'événement de progression
app.emit("update-download-progress", DownloadProgress {
    percent: (downloaded as f64 / total as f64) * 100.0,
    downloaded,
    total,
})?;
```

**Zustand Store Pattern:**
```typescript
// stores/update-store.ts
interface UpdateStore {
  updateInfo: UpdateInfo | null;
  downloadProgress: DownloadProgress | null;
  status: UpdateStatus;
  error: string | null;

  checkForUpdate: () => Promise<void>;
  startDownload: () => Promise<void>;
  clearError: () => void;
}

export const useUpdateStore = create<UpdateStore>()(
  devtools((set, get) => ({
    updateInfo: null,
    downloadProgress: null,
    status: 'none',
    error: null,

    checkForUpdate: async () => {
      set({ status: 'checking' });
      try {
        const info = await updateService.checkForUpdate();
        set({
          updateInfo: info,
          status: info ? 'available' : 'none'
        });
      } catch (e) {
        console.debug('Update check failed:', e);
        set({ status: 'none' });
      }
    },
    // ...
  }))
);
```

### Testing Strategy

**Backend Tests:**
- `get-latest-release.use-case.spec.ts`: 6+ tests
  - Newer version available → return release
  - Same version → return null
  - Older version → return null
  - Platform filtering
  - Invalid version format handling
  - Repository error handling

- `update.controller.spec.ts`: 5+ tests
  - GET /updates/latest with newer version
  - GET /updates/latest with no update (204)
  - Invalid platform parameter
  - Rate limiting behavior
  - Error responses

**Rust Tests:**
- `check_for_update.rs`: Unit tests with mocked updater
- `download_update.rs`: Unit tests with mocked download
- `update_commands.rs`: Integration tests

**Frontend Tests:**
- `update-service.test.ts`: 6+ tests
  - Successful check
  - No update available
  - Network error handling
  - Download start
  - Progress events

- `update-store.test.ts`: 8+ tests
  - Initial state
  - Check updates flow
  - Download flow
  - Progress updates
  - Error handling
  - Event subscriptions

### Security Considerations

1. **Signature Verification:** La vérification Ed25519 est obligatoire et gérée par le plugin Tauri. Ne jamais la désactiver.

2. **HTTPS Only:** Toutes les URLs de mise à jour doivent être HTTPS.

3. **Rate Limiting:** Le backend limite à 10 requêtes/minute/IP pour éviter les abus.

4. **Clés de Signature:**
   - La clé privée ne doit JAMAIS être commitée
   - Utiliser les secrets GitHub Actions/CI
   - Stocker en sécurité (coffre-fort de mots de passe)

### Project Structure Notes

- **apps/backend-api/**: NestJS backend - nouveau module updates
- **apps/desktop/**: Tauri + React frontend
- **apps/desktop/src-tauri/**: Rust backend avec plugin updater
- Toutes les communications passent par HTTPS

### References

- [Source: epic-8-reliable-auto-updates.md#Story-8.1] - Requirements originaux
- [Source: 7-5-early-adopter-codes-lifetime-access.md] - Pattern story précédente
- [Source: architecture.md#Tauri-Commands] - Pattern commandes Tauri
- [Source: tauri-plugin-updater v2 docs](https://v2.tauri.app/plugin/updater/) - Documentation officielle
- [Source: Tauri signer docs](https://v2.tauri.app/reference/javascript/updater/) - API JavaScript

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

