# Cross-Cutting Technical Strategies

_Cette section complète l'architecture avec des stratégies techniques transversales essentielles pour la production readiness et la maintenabilité long terme._

## Logging Strategy

**Objectif:** Debugging efficace développement + production, traçabilité opérations critiques, monitoring erreurs.

### Desktop App (Rust Backend)

**Framework:** `tracing` crate (standard Rust async)

**Configuration:**

```rust
// src-tauri/src/infrastructure/config/logging.rs
use tracing::{info, warn, error, debug};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub fn init_logging() -> Result<(), Box<dyn std::error::Error>> {
    let file_appender = tracing_appender::rolling::daily(
        get_log_dir(), // ~/.splice/logs/
        "splice.log"
    );

    let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "splice=debug,info".into()) // Dev: debug, Prod: info
        )
        .with(tracing_subscriber::fmt::layer().with_writer(non_blocking))
        .init();

    Ok(())
}
```

**Log Levels:**
- **ERROR:** Erreurs critiques (crash imminent, data loss, opérations échouées)
- **WARN:** Situations anormales non-bloquantes (retry réussi, fichier manquant non-critique)
- **INFO:** Opérations importantes (import vidéo, transcription start/end, export)
- **DEBUG:** Détails techniques (FFmpeg commands, SQL queries) - dev only
- **TRACE:** Verbose maximum - désactivé production

**Usage Exemples:**

```rust
// application/use_cases/import_video.rs
use tracing::{info, error, debug};

pub async fn execute(&self, file_path: &str) -> Result<VideoProject, DomainError> {
    info!(file_path = %file_path, "Starting video import");

    debug!("Validating file exists");
    if !Path::new(file_path).exists() {
        error!(file_path = %file_path, "File not found");
        return Err(DomainError::FileNotFound(file_path.to_string()));
    }

    let project = // ... import logic

    info!(
        project_id = %project.id,
        duration = project.duration_seconds,
        "Video import completed successfully"
    );

    Ok(project)
}
```

**Structured Logging (Production):**

```rust
// Log format JSON pour parsing facile
info!(
    event = "transcription_completed",
    project_id = %project_id,
    duration_seconds = 125.5,
    word_count = 1847,
    processing_time_ms = 3452,
);

// Output:
// {"timestamp":"2026-01-29T15:30:00Z","level":"INFO","event":"transcription_completed","project_id":"abc-123","duration_seconds":125.5,"word_count":1847,"processing_time_ms":3452}
```

**Log Rotation:**
- **Fichiers:** `~/.splice/logs/splice.log.YYYY-MM-DD`
- **Rotation:** Daily (nouveau fichier chaque jour)
- **Retention:** 30 jours (cleanup automatique vieux logs)
- **Taille max:** 100MB par fichier (compression si dépassé)

### Frontend (React + TypeScript)

**Framework:** Console natif (dev) + structured logging (prod)

**Configuration:**

```typescript
// apps/desktop/src/utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

class Logger {
  private isDev = import.meta.env.DEV;

  private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    if (this.isDev) {
      // Dev: console coloré
      console[level](message, context);
    } else {
      // Prod: structured logging vers fichier (via Tauri command)
      invoke('log_frontend_message', { entry });
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log('error', message, context);
  }
}

export const logger = new Logger();
```

**Usage:**

```typescript
// stores/video-store.ts
import { logger } from '@/utils/logger';

importVideo: async (filePath) => {
  logger.info('Starting video import', { filePath });

  try {
    const project = await invoke<VideoProject>('import_video', { filePath });
    logger.info('Video import successful', {
      projectId: project.id,
      duration: project.duration_seconds
    });
  } catch (error) {
    logger.error('Video import failed', {
      filePath,
      error: String(error)
    });
    throw error;
  }
}
```

### Backend API (NestJS)

**Framework:** Winston (standard NestJS)

**Configuration:**

```typescript
// apps/backend-api/src/config/logger.config.ts
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const loggerConfig = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
          return `${timestamp} [${context}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.json(),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.json(),
    }),
  ],
});
```

**Usage:**

```typescript
// modules/license/license.service.ts
import { Logger } from '@nestjs/common';

@Injectable()
export class LicenseService {
  private readonly logger = new Logger(LicenseService.name);

  async verifyLicense(licenseKey: string): Promise<LicenseVerifyResponse> {
    this.logger.log(`Verifying license: ${licenseKey.substring(0, 8)}...`);

    try {
      const license = await this.prisma.license.findUnique({
        where: { license_key: licenseKey }
      });

      if (!license) {
        this.logger.warn(`License not found: ${licenseKey}`);
        return { success: false, error: { code: 'LICENSE_NOT_FOUND', message: 'License not found' } };
      }

      this.logger.log(`License verified successfully: ${licenseKey}`);
      return { success: true, data: { plan: license.plan, ... } };
    } catch (error) {
      this.logger.error(`License verification error: ${error.message}`, error.stack);
      throw error;
    }
  }
}
```

**Log Aggregation (Phase 2):**
- Production: Logs envoyés vers service centralisé (Datadog, Logtail, Papertrail)
- Recherche full-text, alertes erreurs critiques
- Dashboards métriques (imports/jour, erreurs transcription, etc.)

---

## Error Codes Standard

**Objectif:** Messages erreur cohérents, i18n-ready, debugging facilité, analytics erreurs.

### Desktop App Error Codes (Rust)

**Enum Complet:**

```rust
// src-tauri/src/domain/errors/error_codes.rs
use serde::{Serialize, Deserialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../packages/types/src/generated/")]
#[serde(tag = "code", content = "details")]
pub enum ErrorCode {
    // VIDEO (1xxx)
    #[serde(rename = "VIDEO_FILE_NOT_FOUND")]
    VideoFileNotFound { path: String },

    #[serde(rename = "VIDEO_UNSUPPORTED_FORMAT")]
    VideoUnsupportedFormat { extension: String, supported: Vec<String> },

    #[serde(rename = "VIDEO_TOO_LARGE")]
    VideoTooLarge { size_gb: f64, max_gb: f64 },

    #[serde(rename = "VIDEO_CORRUPTED")]
    VideoCorrupted { path: String },

    #[serde(rename = "VIDEO_CODEC_NOT_SUPPORTED")]
    VideoCodecNotSupported { codec: String },

    // TRANSCRIPTION (2xxx)
    #[serde(rename = "TRANSCRIPTION_MODEL_NOT_FOUND")]
    TranscriptionModelNotFound,

    #[serde(rename = "TRANSCRIPTION_FAILED")]
    TranscriptionFailed { reason: String },

    #[serde(rename = "TRANSCRIPTION_AUDIO_EXTRACTION_FAILED")]
    TranscriptionAudioExtractionFailed,

    #[serde(rename = "TRANSCRIPTION_TIMEOUT")]
    TranscriptionTimeout { duration_seconds: u64 },

    // EXPORT (3xxx)
    #[serde(rename = "EXPORT_FAILED")]
    ExportFailed { reason: String },

    #[serde(rename = "EXPORT_DISK_SPACE_INSUFFICIENT")]
    ExportDiskSpaceInsufficient { required_gb: f64, available_gb: f64 },

    #[serde(rename = "EXPORT_PATH_NOT_WRITABLE")]
    ExportPathNotWritable { path: String },

    #[serde(rename = "EXPORT_FFMPEG_ERROR")]
    ExportFfmpegError { stderr: String },

    // LICENSE (4xxx)
    #[serde(rename = "LICENSE_INVALID")]
    LicenseInvalid,

    #[serde(rename = "LICENSE_EXPIRED")]
    LicenseExpired { expired_at: String },

    #[serde(rename = "LICENSE_GRACE_PERIOD_ENDED")]
    LicenseGracePeriodEnded,

    #[serde(rename = "LICENSE_NETWORK_ERROR")]
    LicenseNetworkError { message: String },

    #[serde(rename = "LICENSE_SERVER_ERROR")]
    LicenseServerError,

    // DATABASE (5xxx)
    #[serde(rename = "DATABASE_ERROR")]
    DatabaseError { message: String },

    #[serde(rename = "DATABASE_MIGRATION_FAILED")]
    DatabaseMigrationFailed { version: String },

    #[serde(rename = "DATABASE_CORRUPTED")]
    DatabaseCorrupted,

    // SYSTEM (9xxx)
    #[serde(rename = "SYSTEM_PERMISSION_DENIED")]
    SystemPermissionDenied { operation: String },

    #[serde(rename = "SYSTEM_OUT_OF_MEMORY")]
    SystemOutOfMemory,

    #[serde(rename = "SYSTEM_DISK_FULL")]
    SystemDiskFull,

    #[serde(rename = "SYSTEM_UNKNOWN_ERROR")]
    SystemUnknownError { message: String },
}

impl ErrorCode {
    pub fn to_user_message(&self) -> String {
        match self {
            ErrorCode::VideoFileNotFound { path } =>
                format!("Video file not found: {}", path),
            ErrorCode::VideoUnsupportedFormat { extension, supported } =>
                format!("Unsupported format '{}'. Supported: {}", extension, supported.join(", ")),
            ErrorCode::VideoTooLarge { size_gb, max_gb } =>
                format!("Video too large ({:.1}GB). Maximum: {:.1}GB", size_gb, max_gb),
            ErrorCode::LicenseExpired { expired_at } =>
                format!("License expired on {}", expired_at),
            ErrorCode::ExportDiskSpaceInsufficient { required_gb, available_gb } =>
                format!("Insufficient disk space. Required: {:.1}GB, Available: {:.1}GB", required_gb, available_gb),
            // ... autres messages
            _ => format!("{:?}", self),
        }
    }

    pub fn http_status_hint(&self) -> u16 {
        match self {
            ErrorCode::VideoFileNotFound { .. } => 404,
            ErrorCode::LicenseInvalid => 401,
            ErrorCode::SystemPermissionDenied { .. } => 403,
            ErrorCode::LicenseServerError => 503,
            _ => 500,
        }
    }
}
```

**Usage dans Domain Errors:**

```rust
// domain/errors/domain_error.rs
use crate::domain::errors::error_codes::ErrorCode;

#[derive(Debug, Error)]
pub struct DomainError {
    pub code: ErrorCode,
}

impl DomainError {
    pub fn new(code: ErrorCode) -> Self {
        Self { code }
    }

    pub fn to_string(&self) -> String {
        self.code.to_user_message()
    }
}

// Usage
return Err(DomainError::new(ErrorCode::VideoTooLarge {
    size_gb: 52.3,
    max_gb: 50.0,
}));
```

### Frontend Error Handling

**Types Générés (ts-rs):**

```typescript
// packages/types/src/generated/ErrorCode.ts (auto-generated)
export type ErrorCode =
  | { code: "VIDEO_FILE_NOT_FOUND"; details: { path: string } }
  | { code: "VIDEO_UNSUPPORTED_FORMAT"; details: { extension: string; supported: string[] } }
  | { code: "VIDEO_TOO_LARGE"; details: { size_gb: number; max_gb: number } }
  | { code: "LICENSE_EXPIRED"; details: { expired_at: string } }
  // ... autres variants
```

**Error Messages i18n-Ready:**

```typescript
// apps/desktop/src/utils/error-messages.ts
import type { ErrorCode } from '@splice/types/generated';

export function getErrorMessage(errorCode: ErrorCode): string {
  switch (errorCode.code) {
    case 'VIDEO_FILE_NOT_FOUND':
      return `Fichier vidéo introuvable: ${errorCode.details.path}`;

    case 'VIDEO_UNSUPPORTED_FORMAT':
      return `Format '${errorCode.details.extension}' non supporté. Formats acceptés: ${errorCode.details.supported.join(', ')}`;

    case 'VIDEO_TOO_LARGE':
      return `Vidéo trop volumineuse (${errorCode.details.size_gb.toFixed(1)}GB). Maximum: ${errorCode.details.max_gb.toFixed(1)}GB`;

    case 'LICENSE_EXPIRED':
      return `Votre licence a expiré le ${new Date(errorCode.details.expired_at).toLocaleDateString()}`;

    case 'EXPORT_DISK_SPACE_INSUFFICIENT':
      return `Espace disque insuffisant. Requis: ${errorCode.details.required_gb.toFixed(1)}GB, Disponible: ${errorCode.details.available_gb.toFixed(1)}GB`;

    default:
      return 'Une erreur est survenue';
  }
}

// Usage dans composants
try {
  await importVideo(filePath);
} catch (error) {
  const errorCode = JSON.parse(error) as ErrorCode;
  toast.error(getErrorMessage(errorCode));
}
```

**Phase 2 - i18n Complet:**

```typescript
// Utiliser i18next pour multi-langue
import i18n from 'i18next';

export function getErrorMessage(errorCode: ErrorCode, locale = 'fr'): string {
  return i18n.t(`errors.${errorCode.code}`, {
    lng: locale,
    ...errorCode.details
  });
}

// en.json
{
  "errors": {
    "VIDEO_TOO_LARGE": "Video too large ({{size_gb}}GB). Maximum: {{max_gb}}GB",
    "LICENSE_EXPIRED": "Your license expired on {{expired_at}}"
  }
}

// fr.json
{
  "errors": {
    "VIDEO_TOO_LARGE": "Vidéo trop volumineuse ({{size_gb}}GB). Maximum: {{max_gb}}GB",
    "LICENSE_EXPIRED": "Votre licence a expiré le {{expired_at}}"
  }
}
```

### Backend API Error Codes

**Standard HTTP + Custom Codes:**

```typescript
// apps/backend-api/src/common/errors/error-codes.ts
export enum ApiErrorCode {
  // License errors (4xxx)
  LICENSE_NOT_FOUND = 'LICENSE_NOT_FOUND',
  LICENSE_INVALID = 'LICENSE_INVALID',
  LICENSE_EXPIRED = 'LICENSE_EXPIRED',
  LICENSE_ALREADY_ACTIVATED = 'LICENSE_ALREADY_ACTIVATED',

  // Stripe errors (5xxx)
  STRIPE_WEBHOOK_INVALID = 'STRIPE_WEBHOOK_INVALID',
  STRIPE_SUBSCRIPTION_FAILED = 'STRIPE_SUBSCRIPTION_FAILED',

  // System errors (9xxx)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
}
```

**Exception Filter (NestJS):**

```typescript
// apps/backend-api/src/common/filters/api-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : 500;

    const errorResponse = {
      success: false,
      error: {
        code: this.getErrorCode(exception),
        message: this.getErrorMessage(exception),
        details: this.getErrorDetails(exception),
      },
    };

    response.status(status).json(errorResponse);
  }

  private getErrorCode(exception: unknown): string {
    if (exception instanceof CustomApiError) {
      return exception.code;
    }
    return 'INTERNAL_SERVER_ERROR';
  }
}
```

---

## Database Migration Strategy

**Objectif:** Schema evolution safe, rollback possible, migrations versionnées, zero data loss.

### SQLite Migrations (Desktop App)

**Framework:** SQLx migrations (embedded in Rust)

**Structure:**

```
apps/desktop/src-tauri/migrations/
├── 20260129_000001_initial_schema.sql
├── 20260205_000002_add_transcript_confidence.sql
├── 20260212_000003_add_license_cache_version.sql
└── README.md
```

**Migration Naming Convention:**
- Format: `YYYYMMDD_NNNNNN_description.sql`
- `YYYYMMDD`: Date création
- `NNNNNN`: Séquence (000001, 000002, etc.)
- `description`: snake_case descriptif

**Initial Schema (001):**

```sql
-- migrations/20260129_000001_initial_schema.sql
-- Initial database schema for Splice MVP

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    duration_seconds REAL NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    full_text TEXT NOT NULL,
    language TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Transcript words table
CREATE TABLE IF NOT EXISTS transcript_words (
    id TEXT PRIMARY KEY,
    transcript_id TEXT NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    start_time REAL NOT NULL,
    end_time REAL NOT NULL,
    confidence REAL NOT NULL,
    word_index INTEGER NOT NULL,
    FOREIGN KEY (transcript_id) REFERENCES transcripts(id)
);

CREATE INDEX idx_transcript_words_transcript_id ON transcript_words(transcript_id);
CREATE INDEX idx_transcript_words_word_index ON transcript_words(word_index);

-- Selections table
CREATE TABLE IF NOT EXISTS selections (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    start_word_index INTEGER NOT NULL,
    end_word_index INTEGER NOT NULL,
    start_time REAL NOT NULL,
    end_time REAL NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- License cache table
CREATE TABLE IF NOT EXISTS license_cache (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Single row table
    license_key TEXT NOT NULL,
    plan TEXT NOT NULL,
    last_verified_at INTEGER NOT NULL,
    expires_at INTEGER,
    grace_period_ends_at INTEGER NOT NULL
);

-- Schema version tracking
CREATE TABLE IF NOT EXISTS _sqlx_migrations (
    version BIGINT PRIMARY KEY,
    description TEXT NOT NULL,
    installed_on INTEGER NOT NULL,
    success BOOLEAN NOT NULL,
    checksum BLOB NOT NULL,
    execution_time INTEGER NOT NULL
);
```

**Example Migration (002):**

```sql
-- migrations/20260205_000002_add_transcript_confidence.sql
-- Add average confidence tracking to transcripts

ALTER TABLE transcripts ADD COLUMN average_confidence REAL DEFAULT 0.0;

-- Backfill existing data
UPDATE transcripts
SET average_confidence = (
    SELECT AVG(confidence)
    FROM transcript_words
    WHERE transcript_words.transcript_id = transcripts.id
);
```

**Migration Runner (Rust):**

```rust
// src-tauri/src/infrastructure/config/database.rs
use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use sqlx::migrate::Migrator;

static MIGRATOR: Migrator = sqlx::migrate!("./migrations");

pub async fn init_database() -> Result<SqlitePool, Box<dyn std::error::Error>> {
    let db_path = get_db_path(); // ~/.splice/db/splice.db

    // Create parent directory if needed
    if let Some(parent) = db_path.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&format!("sqlite:{}", db_path.display()))
        .await?;

    // Run migrations
    info!("Running database migrations");
    MIGRATOR.run(&pool).await?;
    info!("Database migrations completed");

    Ok(pool)
}
```

**Startup Migration Check:**

```rust
// src-tauri/src/main.rs
#[tokio::main]
async fn main() {
    init_logging().expect("Failed to initialize logging");

    info!("Starting Splice application");

    // Initialize database with migrations
    let db_pool = init_database().await.expect("Failed to initialize database");

    tauri::Builder::default()
        .manage(AppState { db_pool })
        .invoke_handler(tauri::generate_handler![...])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Rollback Strategy:**

```sql
-- migrations/20260205_000002_add_transcript_confidence.down.sql (optionnel)
-- Rollback: Remove average_confidence column

ALTER TABLE transcripts DROP COLUMN average_confidence;
```

**Migration Testing:**

```rust
// tests/integration/migrations_test.rs
#[tokio::test]
async fn test_migrations_run_successfully() {
    let pool = SqlitePoolOptions::new()
        .connect("sqlite::memory:")
        .await
        .unwrap();

    // Run all migrations
    MIGRATOR.run(&pool).await.unwrap();

    // Verify schema
    let result = sqlx::query("SELECT name FROM sqlite_master WHERE type='table'")
        .fetch_all(&pool)
        .await
        .unwrap();

    assert!(result.len() > 0);
}
```

**User Data Backup (Safety Net):**

```rust
// Before migrations, backup database
pub async fn backup_database() -> Result<(), Box<dyn std::error::Error>> {
    let db_path = get_db_path();
    let backup_path = db_path.with_extension(format!("db.backup.{}", Utc::now().timestamp()));

    tokio::fs::copy(&db_path, &backup_path).await?;
    info!("Database backed up to: {:?}", backup_path);

    Ok(())
}
```

### PostgreSQL Migrations (Backend API)

**Framework:** Prisma Migrate

**Workflow:**

```bash
# 1. Modifier schema Prisma
# apps/backend-api/prisma/schema.prisma
model License {
  id              String   @id @default(uuid())
  license_key     String   @unique
  plan            String
  status          String
  activated_at    DateTime?
  expires_at      DateTime?
  // Nouvelle colonne
  max_devices     Int      @default(1) // ← Ajouté
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
}

# 2. Générer migration
cd apps/backend-api
npx prisma migrate dev --name add_max_devices_to_license

# 3. Prisma génère automatiquement:
# prisma/migrations/20260129123456_add_max_devices_to_license/migration.sql
```

**Migration Générée:**

```sql
-- prisma/migrations/20260129123456_add_max_devices_to_license/migration.sql
-- AlterTable
ALTER TABLE "licenses" ADD COLUMN "max_devices" INTEGER NOT NULL DEFAULT 1;
```

**Production Deployment:**

```bash
# Apply migrations en production (non-destructif)
npx prisma migrate deploy
```

**Rollback Strategy (Prisma):**

```bash
# Prisma n'a pas de rollback auto, utiliser migration manuelle
# Créer migration inverse si nécessaire
npx prisma migrate dev --name remove_max_devices --create-only

# Éditer migration.sql manuellement:
ALTER TABLE "licenses" DROP COLUMN "max_devices";

# Appliquer
npx prisma migrate deploy
```

**Schema Version Tracking:**

```sql
-- Prisma crée automatiquement table _prisma_migrations
CREATE TABLE "_prisma_migrations" (
  "id"                    VARCHAR(36) PRIMARY KEY,
  "checksum"              VARCHAR(64) NOT NULL,
  "finished_at"           TIMESTAMPTZ,
  "migration_name"        VARCHAR(255) NOT NULL,
  "logs"                  TEXT,
  "rolled_back_at"        TIMESTAMPTZ,
  "started_at"            TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count"   INTEGER NOT NULL DEFAULT 0
);
```

**CI/CD Migration Check:**

```yaml
# .github/workflows/build-backend.yml
- name: Check pending migrations
  run: |
    cd apps/backend-api
    npx prisma migrate status
    if [ $? -ne 0 ]; then
      echo "⚠️ Pending migrations detected!"
      exit 1
    fi
```

**Data Migration (Complex Changes):**

```typescript
// prisma/seed-migrations/20260129_migrate_old_license_format.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateOldLicenses() {
  // Exemple: Migrer anciens formats de license_key
  const oldLicenses = await prisma.license.findMany({
    where: {
      license_key: { contains: 'OLD-' }
    }
  });

  for (const license of oldLicenses) {
    const newKey = license.license_key.replace('OLD-', 'NEW-');
    await prisma.license.update({
      where: { id: license.id },
      data: { license_key: newKey }
    });
  }

  console.log(`Migrated ${oldLicenses.length} licenses`);
}

migrateOldLicenses()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Production Safety Checklist:**

✅ Toujours backup database avant migrations majeures
✅ Tester migrations sur staging avant production
✅ Migrations doivent être idempotentes (safe à re-run)
✅ Éviter DROP COLUMN en production (peut causer data loss)
✅ Utiliser migrations multi-étapes pour changements breaking:
  1. Ajouter nouvelle colonne (nullable)
  2. Backfill data
  3. Rendre NOT NULL
  4. Supprimer ancienne colonne (migration séparée ultérieure)

---

---
