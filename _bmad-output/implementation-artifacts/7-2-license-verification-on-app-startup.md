# Story 7.2: License Verification on App Startup

Status: done

## Story

As a user,
I want my license verified automatically when I launch the app,
So that I can access features according to my subscription plan.

## Acceptance Criteria

1. **AC1: Secure License Storage**
   - Given app needs to store license key securely (NFR13, PLATFORM-8)
   - When license is stored
   - Then license stored securely in:
     - macOS: Keychain via `security-framework` crate
     - Windows: Credential Manager via `windows-credentials` crate
   - And license key never stored in plain text in SQLite or localStorage

2. **AC2: Online License Verification**
   - Given app has network connectivity
   - When app launches and license key exists in secure storage
   - Then license verified via backend API: `POST /api/v1/license/verify { licenseKey }`
   - And API returns: `{ success: true, data: { licenseKey, plan, status, isValid, expiresAt } }`
   - And license cache updated in SQLite `license_cache` table with:
     - `plan` (free/pro)
     - `last_verified_at` (current timestamp)
     - `expires_at` (from API response)
     - `grace_period_ends_at` (last_verified_at + 7 days)

3. **AC3: Offline Grace Period (FR40, NFR32)**
   - Given app is offline (network request fails after 3 retries)
   - When license verification cannot complete
   - Then `license_cache.last_verified_at` checked from SQLite
   - And if less than 7 days since last verification → app functions normally
   - And grace period countdown displayed subtly in UI (optional indicator)

4. **AC4: Expired Grace Period Warning (FR41)**
   - Given grace period has expired (>7 days offline)
   - When app launches
   - Then warning modal displayed:
     - Title: "Connexion requise pour vérifier la licence"
     - Message: "Dernière vérification: il y a X jours"
     - "Connectez-vous à Internet pour continuer."
     - "Retry" button to attempt verification
   - And app functionality blocked until successful verification

5. **AC5: Grace Period Reset (FR42)**
   - Given successful online license verification
   - When verification completes
   - Then `grace_period_ends_at` reset to current_time + 7 days
   - And license store updated with current plan and expiry

6. **AC6: Startup Verification Flow**
   - Given app starts
   - When main window is ready
   - Then verification runs automatically (non-blocking for UI)
   - And verification status reflected in license store
   - And if verification fails and grace period valid → silent fallback
   - And if verification fails and grace period expired → blocking modal

## Tasks / Subtasks

- [x] Task 1: Add Secure Credential Storage Dependencies (AC: #1)
  - [x] 1.1 Add `security-framework` crate for macOS Keychain
  - [x] 1.2 Add `windows-credentials` (or `keyring` crate) for Windows Credential Manager
  - [x] 1.3 Create cross-platform `SecureCredentialStore` trait in domain/ports
  - [x] 1.4 Implement `MacOSCredentialStore` adapter
  - [x] 1.5 Implement `WindowsCredentialStore` adapter
  - [x] 1.6 Add feature flags for platform-specific compilation

- [x] Task 2: Create License Cache SQLite Migration (AC: #2)
  - [x] 2.1 Create migration `20260203000008_license_cache.sql`
  - [x] 2.2 Define `license_cache` table schema (single-row pattern)
  - [x] 2.3 Add unit tests for migration

- [x] Task 3: Implement License Domain Entities (AC: #2, #3)
  - [x] 3.1 Create `domain/entities/license_cache.rs` entity
  - [x] 3.2 Create `domain/value_objects/license_plan.rs` enum (free/pro)
  - [x] 3.3 Create `domain/repositories/license_repository.rs` port
  - [x] 3.4 Implement `SqliteLicenseRepository` adapter

- [x] Task 4: Implement HTTP Client for Backend API (AC: #2)
  - [x] 4.1 Add `reqwest` crate with TLS support
  - [x] 4.2 Create `domain/ports/license_api_client.rs` trait
  - [x] 4.3 Implement `HttpLicenseApiClient` adapter with:
     - Base URL from environment variable
     - API key header
     - Retry logic (3 attempts, exponential backoff)
     - Timeout configuration (5s)
  - [x] 4.4 Create response types matching backend DTOs

- [x] Task 5: Implement License Verification Use Cases (AC: #2, #3, #4, #5)
  - [x] 5.1 Create `application/use_cases/verify_license_online.rs`
  - [x] 5.2 Create `application/use_cases/check_grace_period.rs`
  - [x] 5.3 Create `application/use_cases/update_license_cache.rs`
  - [x] 5.4 Create `application/use_cases/get_license_status.rs`
  - [x] 5.5 Write unit tests for all use cases

- [x] Task 6: Update Tauri License Commands (AC: #6)
  - [x] 6.1 Rewrite `verify_license` command with real implementation
  - [x] 6.2 Rewrite `check_grace_period` command with SQLite check
  - [x] 6.3 Add `store_license_key` command (secure storage)
  - [x] 6.4 Add `get_license_key` command (from secure storage)
  - [x] 6.5 Add `get_license_status` command (returns full status)
  - [x] 6.6 Add `update_license_cache` command
  - [x] 6.7 Register new commands in main.rs

- [x] Task 7: Frontend License Service & Store Updates (AC: #6)
  - [x] 7.1 Create `services/license-api.ts` for backend communication
  - [x] 7.2 Update `license-store.ts` with:
     - `verifyOnStartup()` action
     - `expiresAt` state
     - `gracePeriodEndsAt` state
     - `daysUntilGraceExpires` computed
     - `isInGracePeriod` computed
  - [x] 7.3 Remove localStorage persistence (use secure Tauri storage)
  - [x] 7.4 Add event listeners for `license:expired` Tauri event

- [x] Task 8: Implement License Warning Modal UI (AC: #4)
  - [x] 8.1 Create `components/license-modal/GracePeriodWarning.tsx`
  - [x] 8.2 Add retry functionality with loading state
  - [x] 8.3 Style with shadcn/ui AlertDialog
  - [x] 8.4 Add French translations

- [x] Task 9: Integrate Startup Verification (AC: #6)
  - [x] 9.1 Add `useLicenseVerification` hook
  - [x] 9.2 Call verification in App.tsx on mount
  - [x] 9.3 Show GracePeriodWarning if grace expired
  - [x] 9.4 Handle edge cases (no license key, first launch)

- [x] Task 10: Write Integration Tests
  - [x] 10.1 Test online verification flow
  - [x] 10.2 Test offline with valid grace period
  - [x] 10.3 Test offline with expired grace period
  - [x] 10.4 Test keychain/credential manager storage

## Dev Notes

### Architecture Compliance

Cette story implémente la vérification de licence côté **Desktop App (Tauri/Rust)** en utilisant le backend API créé dans Story 7.1.

**🏗️ CLEAN ARCHITECTURE - 3 Layers Desktop:**

```
┌─────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE                            │
│  Tauri Commands, SQLite Adapter, HTTP Client, Credential    │
│  Stores (Keychain/Credential Manager)                       │
├─────────────────────────────────────────────────────────────┤
│                     APPLICATION                              │
│  Use Cases: verify_license_online, check_grace_period,      │
│  update_license_cache, get_license_status                   │
├─────────────────────────────────────────────────────────────┤
│                       DOMAIN                                 │
│  Entities: LicenseCache, Ports: LicenseRepository,          │
│  LicenseApiClient, SecureCredentialStore                    │
└─────────────────────────────────────────────────────────────┘
```

### Secure Storage Implementation

**macOS Keychain:**
```rust
// Using security-framework crate
use security_framework::keychain::SecClass;
use security_framework::keychain_item::KeychainItem;

// Service name: "com.splice.license"
// Account name: "license_key"
```

**Windows Credential Manager:**
```rust
// Using windows-credentials or keyring crate
// Target: "splice/license_key"
```

**Cross-Platform Abstraction:**
```rust
// domain/ports/secure_credential_store.rs
pub trait SecureCredentialStore: Send + Sync {
    fn store(&self, key: &str, value: &str) -> Result<(), CredentialError>;
    fn retrieve(&self, key: &str) -> Result<Option<String>, CredentialError>;
    fn delete(&self, key: &str) -> Result<(), CredentialError>;
}
```

### SQLite License Cache Schema

```sql
-- migrations/20260203000008_license_cache.sql
CREATE TABLE IF NOT EXISTS license_cache (
    id INTEGER PRIMARY KEY CHECK (id = 1),  -- Single row table
    plan TEXT NOT NULL DEFAULT 'free',      -- 'free' | 'pro'
    last_verified_at INTEGER NOT NULL,      -- Unix timestamp
    expires_at INTEGER,                      -- Unix timestamp (null for lifetime)
    grace_period_ends_at INTEGER NOT NULL   -- Unix timestamp
);

-- Insert default row
INSERT OR IGNORE INTO license_cache (id, plan, last_verified_at, grace_period_ends_at)
VALUES (1, 'free', 0, 0);
```

### HTTP Client Configuration

```rust
// Environment variables
SPLICE_API_URL=https://api.splice.app (production)
SPLICE_API_URL=http://localhost:3001 (development)
SPLICE_API_KEY=your-api-key

// Request configuration
const TIMEOUT: Duration = Duration::from_secs(5);
const MAX_RETRIES: u32 = 3;
const INITIAL_BACKOFF: Duration = Duration::from_millis(500);
```

### Grace Period Logic

```rust
const GRACE_PERIOD_DAYS: i64 = 7;

fn check_grace_period(last_verified_at: i64) -> bool {
    let now = chrono::Utc::now().timestamp();
    let grace_ends = last_verified_at + (GRACE_PERIOD_DAYS * 24 * 60 * 60);
    now < grace_ends
}

fn calculate_grace_period_ends_at(last_verified_at: i64) -> i64 {
    last_verified_at + (GRACE_PERIOD_DAYS * 24 * 60 * 60)
}
```

### Backend API Contract

**Endpoint:** `POST /api/v1/license/verify`

**Request:**
```json
{
  "licenseKey": "SPLICE-XXXX-XXXX-XXXX"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "licenseKey": "SPLICE-XXXX-XXXX-XXXX",
    "plan": "pro",
    "status": "active",
    "isValid": true,
    "activatedAt": "2026-01-15T10:00:00.000Z",
    "expiresAt": "2027-01-15T10:00:00.000Z"
  }
}
```

**Error Response (401/404):**
```json
{
  "success": false,
  "error": {
    "code": "LICENSE_NOT_FOUND",
    "message": "License key does not exist"
  }
}
```

### Tauri Events

```rust
// Emit on grace period about to expire (3 days warning)
app.emit_all("license:grace_warning", LicenseWarning {
    days_remaining: 3,
    message: "Connexion requise dans 3 jours pour vérifier la licence"
})?;

// Emit on grace period expired
app.emit_all("license:expired", LicenseExpired {
    message: "Grace period expired, verification required"
})?;

// Emit on successful verification
app.emit_all("license:verified", LicenseVerified {
    plan: "pro",
    expires_at: Some("2027-01-15T10:00:00.000Z")
})?;
```

### Frontend Store Updates

```typescript
// license-store.ts updates
interface LicenseStore {
  // Existing state
  licenseKey: string | null;
  plan: LicensePlan;
  isVerified: boolean;
  lastVerifiedAt: number | null;
  gracePeriodEndsAt: number | null;
  error: string | null;

  // New state
  expiresAt: number | null;
  isVerifying: boolean;
  isInGracePeriod: boolean;

  // New actions
  verifyOnStartup: () => Promise<void>;
  storeLicenseKey: (key: string) => Promise<void>;
  getLicenseStatus: () => Promise<LicenseStatus>;
}
```

### Error Codes

| Code | Description | User Action |
|------|-------------|-------------|
| `NETWORK_ERROR` | Cannot reach backend API | Check internet connection |
| `LICENSE_NOT_FOUND` | License key doesn't exist | Contact support |
| `LICENSE_EXPIRED` | Subscription expired | Renew subscription |
| `LICENSE_REVOKED` | License was revoked | Contact support |
| `GRACE_PERIOD_EXPIRED` | >7 days offline | Connect to internet |

### Project Structure Notes

**New Files to Create:**

```
apps/desktop/src-tauri/
├── migrations/
│   └── 20260203000008_license_cache.sql
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   └── license_cache.rs (NEW)
│   │   ├── value_objects/
│   │   │   └── license_plan.rs (NEW)
│   │   ├── repositories/
│   │   │   └── license_repository.rs (NEW)
│   │   └── ports/
│   │       ├── license_api_client.rs (NEW)
│   │       └── secure_credential_store.rs (NEW)
│   ├── application/
│   │   └── use_cases/
│   │       ├── verify_license_online.rs (NEW)
│   │       ├── check_grace_period.rs (NEW)
│   │       ├── update_license_cache.rs (NEW)
│   │       └── get_license_status.rs (NEW)
│   └── infrastructure/
│       ├── adapters/
│       │   ├── sqlite_license_repository.rs (NEW)
│       │   ├── http_license_api_client.rs (NEW)
│       │   ├── macos_credential_store.rs (NEW)
│       │   └── windows_credential_store.rs (NEW)
│       └── tauri_commands/
│           └── license_commands.rs (UPDATE)

apps/desktop/src/
├── stores/
│   └── license-store.ts (UPDATE)
├── services/
│   └── license-api.ts (NEW)
├── components/
│   └── license-modal/
│       ├── GracePeriodWarning.tsx (NEW)
│       └── index.ts (NEW)
└── hooks/
    └── use-license-verification.ts (NEW)
```

### Dependencies to Add

**Cargo.toml:**
```toml
[dependencies]
reqwest = { version = "0.12", features = ["json", "rustls-tls"] }
chrono = { version = "0.4", features = ["serde"] }

[target.'cfg(target_os = "macos")'.dependencies]
security-framework = "3.0"

[target.'cfg(target_os = "windows")'.dependencies]
keyring = "3.5"  # Cross-platform but uses Credential Manager on Windows
```

### Testing Strategy

**Unit Tests (Rust):**
- `verify_license_online_use_case.rs` - Mock HTTP client
- `check_grace_period_use_case.rs` - Test time calculations
- `sqlite_license_repository.rs` - In-memory SQLite

**Unit Tests (TypeScript):**
- `license-store.test.ts` - Mock Tauri invoke
- `GracePeriodWarning.test.tsx` - Component tests

**Integration Tests:**
- Test full flow with mock backend
- Test keychain storage on macOS CI
- Test credential manager on Windows CI

### References

- [Source: epic-7-license-management-monetization.md#Story-7.2] - Acceptance criteria
- [Source: architecture.md#Sécurité] - NFR13, PLATFORM-8 secure storage
- [Source: architecture.md#license_cache] - SQLite schema
- [Source: 7-1-backend-api-license-service-setup.md] - Backend API contract
- [Source: architecture.md#grace_period] - 7-day offline grace period logic
- [Source: Tauri Secure Storage](https://v2.tauri.app/plugin/store/) - Tauri storage plugin (alternative)
- [Source: security-framework crate](https://docs.rs/security-framework) - macOS Keychain
- [Source: keyring crate](https://docs.rs/keyring) - Cross-platform credential storage

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All 209 Rust unit tests passing
- All 17 frontend license tests passing
- macOS Keychain integration tests passing (4 tests)

### Completion Notes List

- ✅ Implemented cross-platform secure credential storage (macOS Keychain via security-framework, Windows Credential Manager via keyring crate)
- ✅ Created SQLite license_cache table with single-row pattern for offline grace period support
- ✅ Implemented Clean Architecture: Domain entities (LicenseCache, LicensePlan), ports (SecureCredentialStore, LicenseApiClient, LicenseRepository), use cases (VerifyLicenseOnline, CheckGracePeriod, UpdateLicenseCache, GetLicenseStatus)
- ✅ HTTP client with 4 attempts (1 initial + 3 retries per AC3), exponential backoff, 5s timeout, TLS support
- ✅ 7 new Tauri commands: verify_license, check_grace_period, store_license_key, get_license_key, get_license_status, update_license_cache, clear_license
- ✅ Frontend license-api.ts service with Tauri event listeners
- ✅ Zustand store updated with verifyOnStartup(), grace period state, blocked state (localStorage persistence removed)
- ✅ GracePeriodWarning modal with French translations, shadcn/ui AlertDialog, retry button
- ✅ useLicenseVerification hook integrated in App.tsx on mount
- ✅ Tauri events: license:verified, license:expired, license:grace_warning

### Code Review Fixes (2026-02-03)

- ✅ **HIGH-1 Fixed**: Added X-API-Key header support to HttpLicenseApiClient (reads from SPLICE_API_KEY env var)
- ✅ **HIGH-4 Fixed**: Added license key format validation (SPLICE-XXXX-XXXX-XXXX) in store_license_key command
- ✅ **MEDIUM-1 Fixed**: Added subtle GracePeriodIndicator component in TopBar (shows days remaining when offline)
- ✅ **MEDIUM-2 Fixed**: Added warning logs when SPLICE_API_URL or SPLICE_API_KEY not set
- ✅ **MEDIUM-4 Fixed**: Masked license key in debug logs (only shows first 6 chars)
- ✅ **MEDIUM-5 Fixed**: Corrected retry logic to MAX_ATTEMPTS=4 (1 initial + 3 retries per AC3 "after 3 retries")
- ✅ **LOW-1 Fixed**: Removed unused AlertDialogAction import
- ✅ **File List Updated**: Added Cargo.lock, bindings/, GracePeriodIndicator.tsx, TopBar.tsx

### File List

**Backend (Rust):**
- apps/desktop/src-tauri/Cargo.toml (modified)
- apps/desktop/src-tauri/Cargo.lock (modified)
- apps/desktop/src-tauri/migrations/20260203000008_license_cache.sql (new)
- apps/desktop/src-tauri/bindings/ (generated TypeScript types)
- apps/desktop/src-tauri/src/domain/mod.rs (modified)
- apps/desktop/src-tauri/src/domain/ports/mod.rs (new)
- apps/desktop/src-tauri/src/domain/ports/secure_credential_store.rs (new)
- apps/desktop/src-tauri/src/domain/ports/license_api_client.rs (new)
- apps/desktop/src-tauri/src/domain/entities/mod.rs (modified)
- apps/desktop/src-tauri/src/domain/entities/license_cache.rs (new)
- apps/desktop/src-tauri/src/domain/value_objects/mod.rs (modified)
- apps/desktop/src-tauri/src/domain/value_objects/license_plan.rs (new)
- apps/desktop/src-tauri/src/domain/repositories/mod.rs (modified)
- apps/desktop/src-tauri/src/domain/repositories/license_repository.rs (new)
- apps/desktop/src-tauri/src/application/use_cases/mod.rs (modified)
- apps/desktop/src-tauri/src/application/use_cases/verify_license_online.rs (new)
- apps/desktop/src-tauri/src/application/use_cases/check_grace_period.rs (new)
- apps/desktop/src-tauri/src/application/use_cases/update_license_cache.rs (new)
- apps/desktop/src-tauri/src/application/use_cases/get_license_status.rs (new)
- apps/desktop/src-tauri/src/infrastructure/adapters/mod.rs (modified)
- apps/desktop/src-tauri/src/infrastructure/adapters/macos_credential_store.rs (new)
- apps/desktop/src-tauri/src/infrastructure/adapters/windows_credential_store.rs (new)
- apps/desktop/src-tauri/src/infrastructure/adapters/sqlite_license_repository.rs (new)
- apps/desktop/src-tauri/src/infrastructure/adapters/http_license_api_client.rs (new)
- apps/desktop/src-tauri/src/infrastructure/tauri_commands/license_commands.rs (modified)
- apps/desktop/src-tauri/src/main.rs (modified)

**Frontend (TypeScript/React):**
- apps/desktop/src/services/license-api.ts (new)
- apps/desktop/src/stores/license-store.ts (modified)
- apps/desktop/src/stores/license-store.test.ts (new)
- apps/desktop/src/components/license-modal/GracePeriodWarning.tsx (new)
- apps/desktop/src/components/license-modal/GracePeriodWarning.test.tsx (new)
- apps/desktop/src/components/license-modal/GracePeriodIndicator.tsx (new) - AC3 subtle indicator
- apps/desktop/src/components/license-modal/index.ts (modified)
- apps/desktop/src/components/layout/TopBar.tsx (modified) - Added GracePeriodIndicator
- apps/desktop/src/hooks/use-license-verification.ts (new)
- apps/desktop/src/App.tsx (modified)

**Config:**
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified)

