# Story 7.2: License Verification on App Startup

Status: ready-for-dev

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

- [ ] Task 1: Add Secure Credential Storage Dependencies (AC: #1)
  - [ ] 1.1 Add `security-framework` crate for macOS Keychain
  - [ ] 1.2 Add `windows-credentials` (or `keyring` crate) for Windows Credential Manager
  - [ ] 1.3 Create cross-platform `SecureCredentialStore` trait in domain/ports
  - [ ] 1.4 Implement `MacOSCredentialStore` adapter
  - [ ] 1.5 Implement `WindowsCredentialStore` adapter
  - [ ] 1.6 Add feature flags for platform-specific compilation

- [ ] Task 2: Create License Cache SQLite Migration (AC: #2)
  - [ ] 2.1 Create migration `20260203000008_license_cache.sql`
  - [ ] 2.2 Define `license_cache` table schema (single-row pattern)
  - [ ] 2.3 Add unit tests for migration

- [ ] Task 3: Implement License Domain Entities (AC: #2, #3)
  - [ ] 3.1 Create `domain/entities/license_cache.rs` entity
  - [ ] 3.2 Create `domain/value_objects/license_plan.rs` enum (free/pro)
  - [ ] 3.3 Create `domain/repositories/license_repository.rs` port
  - [ ] 3.4 Implement `SqliteLicenseRepository` adapter

- [ ] Task 4: Implement HTTP Client for Backend API (AC: #2)
  - [ ] 4.1 Add `reqwest` crate with TLS support
  - [ ] 4.2 Create `domain/ports/license_api_client.rs` trait
  - [ ] 4.3 Implement `HttpLicenseApiClient` adapter with:
     - Base URL from environment variable
     - API key header
     - Retry logic (3 attempts, exponential backoff)
     - Timeout configuration (5s)
  - [ ] 4.4 Create response types matching backend DTOs

- [ ] Task 5: Implement License Verification Use Cases (AC: #2, #3, #4, #5)
  - [ ] 5.1 Create `application/use_cases/verify_license_online.rs`
  - [ ] 5.2 Create `application/use_cases/check_grace_period.rs`
  - [ ] 5.3 Create `application/use_cases/update_license_cache.rs`
  - [ ] 5.4 Create `application/use_cases/get_license_status.rs`
  - [ ] 5.5 Write unit tests for all use cases

- [ ] Task 6: Update Tauri License Commands (AC: #6)
  - [ ] 6.1 Rewrite `verify_license` command with real implementation
  - [ ] 6.2 Rewrite `check_grace_period` command with SQLite check
  - [ ] 6.3 Add `store_license_key` command (secure storage)
  - [ ] 6.4 Add `get_license_key` command (from secure storage)
  - [ ] 6.5 Add `get_license_status` command (returns full status)
  - [ ] 6.6 Add `update_license_cache` command
  - [ ] 6.7 Register new commands in main.rs

- [ ] Task 7: Frontend License Service & Store Updates (AC: #6)
  - [ ] 7.1 Create `services/license-api.ts` for backend communication
  - [ ] 7.2 Update `license-store.ts` with:
     - `verifyOnStartup()` action
     - `expiresAt` state
     - `gracePeriodEndsAt` state
     - `daysUntilGraceExpires` computed
     - `isInGracePeriod` computed
  - [ ] 7.3 Remove localStorage persistence (use secure Tauri storage)
  - [ ] 7.4 Add event listeners for `license:expired` Tauri event

- [ ] Task 8: Implement License Warning Modal UI (AC: #4)
  - [ ] 8.1 Create `components/license-modal/GracePeriodWarning.tsx`
  - [ ] 8.2 Add retry functionality with loading state
  - [ ] 8.3 Style with shadcn/ui AlertDialog
  - [ ] 8.4 Add French translations

- [ ] Task 9: Integrate Startup Verification (AC: #6)
  - [ ] 9.1 Add `useLicenseVerification` hook
  - [ ] 9.2 Call verification in App.tsx on mount
  - [ ] 9.3 Show GracePeriodWarning if grace expired
  - [ ] 9.4 Handle edge cases (no license key, first launch)

- [ ] Task 10: Write Integration Tests
  - [ ] 10.1 Test online verification flow
  - [ ] 10.2 Test offline with valid grace period
  - [ ] 10.3 Test offline with expired grace period
  - [ ] 10.4 Test keychain/credential manager storage

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

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

