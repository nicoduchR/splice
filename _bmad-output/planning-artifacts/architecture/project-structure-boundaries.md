# Project Structure & Boundaries

_Cette section définit la structure physique complète du projet et les frontières architecturales, mappant chaque requirement aux fichiers et répertoires spécifiques où ils seront implémentés._

## Requirements to Architecture Mapping

**Mapping des 8 Catégories FR vers l'Architecture:**

### 1. Video Import & Management (FR1-FR6)
**Fonctionnalités:** Drag & drop, validation codec/format, gestion fichiers 50GB, mono-projet MVP

**Implémentation:**
- **Domain Layer:** `src-tauri/src/domain/entities/video.rs`, `repositories/video_repository.rs`
- **Application Layer:** `src-tauri/src/application/use_cases/import_video.rs`
- **Infrastructure Layer:** `src-tauri/src/infrastructure/adapters/ffmpeg_adapter.rs`, `tauri_commands/video_commands.rs`
- **Frontend Components:** `apps/desktop/src/components/video-import/` (ImportButton, ImportDropzone, ImportProgress)
- **State Management:** `apps/desktop/src/stores/video-store.ts`
- **Database:** SQLite table `projects` dans `src-tauri/migrations/001_initial_schema.sql`

### 2. Transcription (FR7-FR13)
**Fonctionnalités:** Parakeet TDT téléchargement, transcription locale word-level timestamps, support vidéos 2h

**Implémentation:**
- **Domain Layer:** `src-tauri/src/domain/entities/transcript.rs`
- **Application Layer:** `src-tauri/src/application/use_cases/transcribe_video.rs`
- **Infrastructure Layer:** `src-tauri/src/infrastructure/adapters/parakeet_adapter.rs`, `tauri_commands/transcript_commands.rs`
- **Frontend Components:** `apps/desktop/src/components/transcript-editor/` (TranscriptEditor, WordHighlight, TranscriptToolbar)
- **State Management:** `apps/desktop/src/stores/transcript-store.ts`
- **Database:** SQLite tables `transcripts`, `transcript_words`

### 3. Content Editing (FR14-FR18)
**Fonctionnalités:** Surlignage texte, synchronisation bidirectionnelle texte ↔ timeline

**Implémentation:**
- **Domain Layer:** `src-tauri/src/domain/entities/selection.rs`, `value_objects/timecode.rs`
- **Application Layer:** `src-tauri/src/application/use_cases/add_selection.rs`
- **Frontend Components:**
  - `apps/desktop/src/components/transcript-editor/` (surlignage UI)
  - `apps/desktop/src/components/timeline/` (Timeline, TimelineSegment, PlayheadIndicator)
- **State Management:** `apps/desktop/src/stores/transcript-store.ts`, `timeline-store.ts`
- **Synchronisation:** `apps/desktop/src/hooks/use-bidirectional-sync.ts`
- **Database:** SQLite table `selections`

### 4. Video Processing (FR19-FR24)
**Fonctionnalités:** Génération cuts automatiques, marges 0.1s, streaming, précision word boundaries

**Implémentation:**
- **Application Layer:** `src-tauri/src/application/use_cases/generate_cuts.rs`
- **Infrastructure Layer:** `src-tauri/src/infrastructure/adapters/ffmpeg_adapter.rs`
- **Domain Logic:** `src-tauri/src/domain/entities/cut.rs`, `value_objects/duration.rs`
- **Tauri Commands:** `src-tauri/src/infrastructure/tauri_commands/cuts_commands.rs`

### 5. Preview & Validation (FR25-FR28)
**Fonctionnalités:** Lecteur preview play/pause/scrubbing

**Implémentation:**
- **Frontend Components:** `apps/desktop/src/components/video-player/` (VideoPlayer, VideoControls, ScrubBar)
- **State Management:** `apps/desktop/src/stores/timeline-store.ts`
- **Hooks:** `apps/desktop/src/hooks/use-video-player.ts`

### 6. Export (FR29-FR34)
**Fonctionnalités:** Export MP4 H.264, qualité préservée, compatible Premiere/DaVinci

**Implémentation:**
- **Application Layer:** `src-tauri/src/application/use_cases/export_video.rs`
- **Infrastructure Layer:** `src-tauri/src/infrastructure/adapters/ffmpeg_adapter.rs`, `tauri_commands/export_commands.rs`
- **Frontend Components:** `apps/desktop/src/components/export-modal/` (ExportModal, ExportSettings, ExportProgress)
- **State Management:** `apps/desktop/src/stores/export-store.ts`

### 7. Licensing & Monetization (FR35-FR42)
**Fonctionnalités:** Vérification licence démarrage, freemium 30min, grace period 7 jours

**Implémentation:**
- **Application Layer Desktop:** `src-tauri/src/application/use_cases/verify_license.rs`, `check_grace_period.rs`
- **Infrastructure Desktop:** `src-tauri/src/infrastructure/tauri_commands/license_commands.rs`, `adapters/http_client.rs`
- **Frontend Components:** `apps/desktop/src/components/license-modal/` (LicenseModal, ActivationForm, FreemiumBlocker)
- **State Management:** `apps/desktop/src/stores/license-store.ts`
- **Database Desktop:** SQLite table `license_cache`
- **Backend API:** `apps/backend-api/src/modules/license/` (controller, service, DTOs)
- **Database Backend:** PostgreSQL tables `users`, `licenses`, `subscriptions`
- **Stripe Integration:** `apps/backend-api/src/modules/stripe/`

### 8. Platform & Distribution (FR43-FR54)
**Fonctionnalités:** macOS 13+, Windows 10+, auto-update, code signing

**Implémentation:**
- **Configuration:** `apps/desktop/src-tauri/tauri.conf.json`
- **Icons:** `apps/desktop/src-tauri/icons/` (icon.icns macOS, icon.ico Windows)
- **CI/CD:** `.github/workflows/build-desktop.yml`, `release.yml`
- **Scripts:** `scripts/code-sign.sh`, `bundle-ffmpeg.sh`

---

## Complete Project Directory Structure

```
splice/
├── README.md
├── LICENSE
├── .gitignore
├── .env.example
│
├── package.json                      # Root workspace package
├── pnpm-workspace.yaml               # pnpm workspaces config
├── turbo.json                        # Turbo build orchestration
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # CI tests (Rust + TypeScript)
│       ├── build-desktop.yml         # Build Tauri app (macOS + Windows)
│       ├── build-backend.yml         # Build backend API
│       └── release.yml               # Release automation + code signing
│
├── docs/
│   ├── architecture.md               # This document
│   ├── api-documentation.md          # Backend API docs
│   ├── development-setup.md          # Local dev setup
│   └── deployment.md                 # Deployment guide
│
├── apps/
│   ├── desktop/                      # Tauri Desktop Application
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── tsconfig.app.json
│   │   ├── tsconfig.node.json
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   ├── components.json           # shadcn/ui config
│   │   ├── .env.example
│   │   ├── .gitignore
│   │   │
│   │   ├── src/                      # React Frontend
│   │   │   ├── main.tsx              # App entry point
│   │   │   ├── App.tsx               # Root component
│   │   │   ├── index.css             # Global styles + Tailwind
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── ui/               # shadcn/ui components
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── dialog.tsx
│   │   │   │   │   ├── progress.tsx
│   │   │   │   │   ├── toast.tsx
│   │   │   │   │   ├── tooltip.tsx
│   │   │   │   │   └── ...
│   │   │   │   │
│   │   │   │   ├── transcript-editor/
│   │   │   │   │   ├── TranscriptEditor.tsx
│   │   │   │   │   ├── TranscriptEditor.test.tsx
│   │   │   │   │   ├── WordHighlight.tsx
│   │   │   │   │   ├── TranscriptToolbar.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── timeline/
│   │   │   │   │   ├── Timeline.tsx
│   │   │   │   │   ├── Timeline.test.tsx
│   │   │   │   │   ├── TimelineSegment.tsx
│   │   │   │   │   ├── PlayheadIndicator.tsx
│   │   │   │   │   ├── ZoomControls.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── video-player/
│   │   │   │   │   ├── VideoPlayer.tsx
│   │   │   │   │   ├── VideoPlayer.test.tsx
│   │   │   │   │   ├── VideoControls.tsx
│   │   │   │   │   ├── ScrubBar.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── video-import/
│   │   │   │   │   ├── ImportButton.tsx
│   │   │   │   │   ├── ImportDropzone.tsx
│   │   │   │   │   ├── ImportProgress.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── export-modal/
│   │   │   │   │   ├── ExportModal.tsx
│   │   │   │   │   ├── ExportSettings.tsx
│   │   │   │   │   ├── ExportProgress.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── license-modal/
│   │   │   │   │   ├── LicenseModal.tsx
│   │   │   │   │   ├── ActivationForm.tsx
│   │   │   │   │   ├── FreemiumBlocker.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── duration-counter/
│   │   │   │   │   ├── DurationCounter.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   └── layout/
│   │   │   │       ├── AppLayout.tsx
│   │   │   │       ├── Sidebar.tsx
│   │   │   │       ├── Topbar.tsx
│   │   │   │       └── index.ts
│   │   │   │
│   │   │   ├── stores/
│   │   │   │   ├── video-store.ts
│   │   │   │   ├── video-store.test.ts
│   │   │   │   ├── transcript-store.ts
│   │   │   │   ├── transcript-store.test.ts
│   │   │   │   ├── timeline-store.ts
│   │   │   │   ├── timeline-store.test.ts
│   │   │   │   ├── export-store.ts
│   │   │   │   ├── export-store.test.ts
│   │   │   │   ├── license-store.ts
│   │   │   │   └── license-store.test.ts
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── use-timeline-sync.ts
│   │   │   │   ├── use-timeline-sync.test.ts
│   │   │   │   ├── use-bidirectional-sync.ts
│   │   │   │   ├── use-keyboard-shortcuts.ts
│   │   │   │   └── use-video-player.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── video-service.ts
│   │   │   │   ├── transcript-service.ts
│   │   │   │   ├── export-service.ts
│   │   │   │   └── license-api.ts
│   │   │   │
│   │   │   ├── utils/
│   │   │   │   ├── cn.ts                 # shadcn/ui className util
│   │   │   │   └── constants.ts
│   │   │   │
│   │   │   ├── types/
│   │   │   │   └── window.d.ts           # Tauri window types
│   │   │   │
│   │   │   └── lib/
│   │   │       └── utils.ts
│   │   │
│   │   ├── src-tauri/                # Rust Backend
│   │   │   ├── Cargo.toml
│   │   │   ├── Cargo.lock
│   │   │   ├── build.rs
│   │   │   ├── tauri.conf.json       # Tauri app config
│   │   │   ├── .env.example
│   │   │   │
│   │   │   ├── src/
│   │   │   │   ├── main.rs           # Entry point + Tauri setup
│   │   │   │   ├── lib.rs            # Library exports
│   │   │   │   │
│   │   │   │   ├── domain/           # LAYER 1: Domain (Business Logic)
│   │   │   │   │   ├── mod.rs
│   │   │   │   │   │
│   │   │   │   │   ├── entities/
│   │   │   │   │   │   ├── mod.rs
│   │   │   │   │   │   ├── video.rs
│   │   │   │   │   │   ├── transcript.rs
│   │   │   │   │   │   ├── selection.rs
│   │   │   │   │   │   └── cut.rs
│   │   │   │   │   │
│   │   │   │   │   ├── value_objects/
│   │   │   │   │   │   ├── mod.rs
│   │   │   │   │   │   ├── timecode.rs
│   │   │   │   │   │   └── duration.rs
│   │   │   │   │   │
│   │   │   │   │   ├── repositories/     # Traits only
│   │   │   │   │   │   ├── mod.rs
│   │   │   │   │   │   ├── video_repository.rs
│   │   │   │   │   │   ├── transcript_repository.rs
│   │   │   │   │   │   └── selection_repository.rs
│   │   │   │   │   │
│   │   │   │   │   └── errors/
│   │   │   │   │       ├── mod.rs
│   │   │   │   │       └── domain_error.rs
│   │   │   │   │
│   │   │   │   ├── application/      # LAYER 2: Application (Use Cases)
│   │   │   │   │   ├── mod.rs
│   │   │   │   │   │
│   │   │   │   │   ├── use_cases/
│   │   │   │   │   │   ├── mod.rs
│   │   │   │   │   │   ├── import_video.rs
│   │   │   │   │   │   ├── transcribe_video.rs
│   │   │   │   │   │   ├── add_selection.rs
│   │   │   │   │   │   ├── generate_cuts.rs
│   │   │   │   │   │   ├── export_video.rs
│   │   │   │   │   │   ├── verify_license.rs
│   │   │   │   │   │   └── check_grace_period.rs
│   │   │   │   │   │
│   │   │   │   │   └── ports/            # Interfaces abstraites
│   │   │   │   │       ├── mod.rs
│   │   │   │   │       ├── video_processor.rs
│   │   │   │   │       └── transcription_engine.rs
│   │   │   │   │
│   │   │   │   └── infrastructure/   # LAYER 3: Infrastructure (Adapters)
│   │   │   │       ├── mod.rs
│   │   │   │       │
│   │   │   │       ├── adapters/
│   │   │   │       │   ├── mod.rs
│   │   │   │       │   ├── ffmpeg_adapter.rs
│   │   │   │       │   ├── parakeet_adapter.rs
│   │   │   │       │   ├── sqlite_repository.rs
│   │   │   │       │   └── http_client.rs
│   │   │   │       │
│   │   │   │       ├── tauri_commands/   # Tauri IPC exposure
│   │   │   │       │   ├── mod.rs
│   │   │   │       │   ├── video_commands.rs
│   │   │   │       │   ├── transcript_commands.rs
│   │   │   │       │   ├── selection_commands.rs
│   │   │   │       │   ├── cuts_commands.rs
│   │   │   │       │   ├── export_commands.rs
│   │   │   │       │   └── license_commands.rs
│   │   │   │       │
│   │   │   │       └── config/
│   │   │   │           ├── mod.rs
│   │   │   │           ├── app_config.rs
│   │   │   │           └── database.rs
│   │   │   │
│   │   │   ├── tests/                # Integration tests
│   │   │   │   ├── integration/
│   │   │   │   │   ├── transcription_flow.rs
│   │   │   │   │   ├── export_flow.rs
│   │   │   │   │   └── license_flow.rs
│   │   │   │   │
│   │   │   │   └── fixtures/
│   │   │   │       ├── sample_video.mp4
│   │   │   │       └── test_config.json
│   │   │   │
│   │   │   ├── icons/                # App icons
│   │   │   │   ├── 32x32.png
│   │   │   │   ├── 128x128.png
│   │   │   │   ├── 128x128@2x.png
│   │   │   │   ├── icon.icns         # macOS
│   │   │   │   └── icon.ico          # Windows
│   │   │   │
│   │   │   └── migrations/           # SQLite migrations
│   │   │       └── 001_initial_schema.sql
│   │   │
│   │   └── tests-e2e/                # Playwright E2E tests
│   │       ├── playwright.config.ts
│   │       ├── fixtures/
│   │       │   └── test-video.mp4
│   │       └── specs/
│   │           ├── happy-path.spec.ts
│   │           ├── freemium-blocker.spec.ts
│   │           └── license-activation.spec.ts
│   │
│   └── backend-api/                  # Backend API Server (NestJS)
│       ├── package.json
│       ├── nest-cli.json
│       ├── tsconfig.json
│       ├── tsconfig.build.json
│       ├── .env.example
│       ├── .gitignore
│       ├── README.md
│       │
│       ├── src/
│       │   ├── main.ts               # NestJS entry point
│       │   ├── app.module.ts
│       │   │
│       │   ├── modules/
│       │   │   ├── license/
│       │   │   │   ├── license.module.ts
│       │   │   │   ├── license.controller.ts
│       │   │   │   ├── license.controller.spec.ts
│       │   │   │   ├── license.service.ts
│       │   │   │   ├── license.service.spec.ts
│       │   │   │   └── dto/
│       │   │   │       ├── verify-license.dto.ts
│       │   │   │       └── activate-license.dto.ts
│       │   │   │
│       │   │   ├── stripe/
│       │   │   │   ├── stripe.module.ts
│       │   │   │   ├── stripe.controller.ts
│       │   │   │   ├── stripe.service.ts
│       │   │   │   └── dto/
│       │   │   │       └── stripe-webhook.dto.ts
│       │   │   │
│       │   │   ├── analytics/
│       │   │   │   ├── analytics.module.ts
│       │   │   │   ├── analytics.controller.ts
│       │   │   │   ├── analytics.service.ts
│       │   │   │   └── dto/
│       │   │   │       └── usage-event.dto.ts
│       │   │   │
│       │   │   └── users/
│       │   │       ├── users.module.ts
│       │   │       ├── users.service.ts
│       │   │       └── users.service.spec.ts
│       │   │
│       │   ├── config/
│       │   │   ├── configuration.ts
│       │   │   └── validation.ts
│       │   │
│       │   ├── guards/
│       │   │   └── api-key.guard.ts
│       │   │
│       │   └── interceptors/
│       │       └── logging.interceptor.ts
│       │
│       ├── prisma/
│       │   ├── schema.prisma         # PostgreSQL schema
│       │   ├── seed.ts
│       │   └── migrations/
│       │
│       ├── test/
│       │   ├── app.e2e-spec.ts
│       │   └── jest-e2e.json
│       │
│       └── docker-compose.yml        # Local PostgreSQL
│
├── packages/                         # Shared Packages
│   ├── ui/                           # Shared React Components
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── transcript-editor.tsx
│   │   │   ├── timeline.tsx
│   │   │   └── video-player.tsx
│   │   └── README.md
│   │
│   ├── types/                        # Shared TypeScript Types
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── generated/            # ts-rs generated types
│   │   │   │   ├── VideoProject.ts
│   │   │   │   ├── TranscriptWord.ts
│   │   │   │   ├── Selection.ts
│   │   │   │   └── Cut.ts
│   │   │   ├── stores.ts             # Store types
│   │   │   └── api.ts                # API types
│   │   └── README.md
│   │
│   ├── validation/                   # Zod Schemas
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── video-schema.ts
│   │   │   ├── selection-schema.ts
│   │   │   └── license-schema.ts
│   │   └── README.md
│   │
│   └── utils/                        # Shared Utilities
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── index.ts
│       │   ├── timecode.ts
│       │   ├── timecode.test.ts
│       │   ├── duration.ts
│       │   ├── duration.test.ts
│       │   ├── file-size.ts
│       │   └── date-format.ts
│       └── README.md
│
└── scripts/                          # Build & Development Scripts
    ├── setup.sh                      # Initial project setup
    ├── download-parakeet.sh          # Download Parakeet model
    ├── bundle-ffmpeg.sh              # Bundle FFmpeg binaries
    └── code-sign.sh                  # Code signing script
```

---

## Architectural Boundaries

### API Boundaries

**1. Tauri IPC (Frontend ↔ Rust Backend)**

**Boundary:** `apps/desktop/src-tauri/src/infrastructure/tauri_commands/`

**Exposed Commands (par domaine):**

```rust
// Video Domain
invoke('import_video', { filePath: string }) -> VideoProject
invoke('get_video_info', { projectId: string }) -> VideoProject

// Transcript Domain
invoke('transcribe_video', { projectId: string }) -> Transcript
invoke('get_transcript', { projectId: string }) -> Transcript

// Selection Domain
invoke('add_selection', { projectId: string, startIndex: number, endIndex: number }) -> Selection
invoke('remove_selection', { selectionId: string }) -> void
invoke('get_selections', { projectId: string }) -> Selection[]

// Cuts Domain
invoke('generate_cuts', { projectId: string, selectionIds: string[] }) -> Cut[]
invoke('preview_cut', { cutId: string }) -> string

// Export Domain
invoke('export_video', { projectId: string, outputPath: string }) -> string
invoke('get_export_progress', { exportId: string }) -> ProgressUpdate

// License Domain
invoke('verify_license', { licenseKey: string }) -> LicenseStatus
invoke('activate_license', { licenseKey: string }) -> void
invoke('check_grace_period') -> boolean
```

**Tauri Events (Rust → Frontend):**

```typescript
// Progress events
listen('transcript:progress', handler) // ProgressUpdate
listen('export:progress', handler)      // ProgressUpdate
listen('cuts:progress', handler)        // ProgressUpdate

// Status events
listen('transcript:completed', handler) // Transcript
listen('export:completed', handler)     // { outputPath: string }
listen('license:expired', handler)      // { message: string }
listen('app:error', handler)            // { code: string, message: string }
```

**2. Backend REST API (Desktop ↔ Backend Server)**

**Base URL:** `https://api.splice.app/api/v1` (production), `http://localhost:3000/api/v1` (dev)

**Authentication:** API Key header `X-API-Key: <desktop_app_key>`

**Endpoints:**

```typescript
// License Management
POST   /license/verify
Request: { license_key: string }
Response: {
  success: boolean,
  data?: {
    plan: 'free' | 'pro',
    expires_at: string | null,
    grace_period_ends_at: string
  },
  error?: { code: string, message: string }
}

POST   /license/activate
Request: { license_key: string, email: string }
Response: { success: boolean, data?: { activated_at: string } }

// Stripe Webhooks (server-side only)
POST   /stripe/webhook
Headers: { stripe-signature: string }

// Analytics (Phase 2)
POST   /analytics/usage
Request: { license_key: string, event_type: string, event_data: object }
Response: { success: boolean }
```

**Communication Pattern:**
- **Frequency:** Démarrage app + refresh périodique (toutes les 24h)
- **Retry Logic:** 3 tentatives avec exponential backoff (1s, 2s, 4s)
- **Fallback:** Grace period 7 jours si échec réseau
- **Timeout:** 5 secondes par requête

---

### Component Boundaries

**1. Frontend React Components**

**Boundary Type:** Props-based isolation, aucun import direct entre features

**Communication Pattern:**
- **Props drilling** pour composants parents → enfants
- **Zustand stores** pour communication cross-composants
- **Custom hooks** pour logique réutilisable

**Example Boundary:**

```typescript
// ✅ CORRECT: Communication via props
<TranscriptEditor
  words={transcript.words}
  selectedIndices={selectedWordIndices}
  onWordSelect={handleWordSelect}
/>

// ✅ CORRECT: Communication via store
const { selectedWordIndices } = useTranscriptStore();
const { setCurrentTime } = useTimelineStore();

// ❌ INCORRECT: Import direct composant d'une autre feature
import { Timeline } from '../timeline/Timeline'; // NON
```

**Component Hierarchy:**

```
AppLayout (root)
├── Sidebar
│   └── ProjectInfo
├── Topbar
│   ├── DurationCounter
│   └── ExportButton
└── MainContent
    ├── TranscriptEditor (Feature 1)
    │   ├── TranscriptToolbar
    │   └── WordHighlight
    ├── VideoPlayer (Feature 2)
    │   ├── VideoControls
    │   └── ScrubBar
    └── Timeline (Feature 3)
        ├── TimelineSegment
        ├── PlayheadIndicator
        └── ZoomControls
```

**2. Zustand Stores Boundaries**

**Isolation:** Chaque store gère un domaine, évite accès cross-store direct

**Communication Cross-Store:** Via custom hooks uniquement

```typescript
// ❌ INCORRECT: Accès direct cross-store
function MyComponent() {
  const videoStore = useVideoStore();
  const transcriptStore = useTranscriptStore();

  // Logic mélangée
  if (videoStore.currentProject) {
    transcriptStore.setTranscript(...);
  }
}

// ✅ CORRECT: Hook dédié pour orchestration
function useSyncVideoTranscript() {
  const currentProject = useVideoStore(s => s.currentProject);
  const setTranscript = useTranscriptStore(s => s.setTranscript);

  useEffect(() => {
    if (currentProject?.transcriptId) {
      // Fetch and sync
    }
  }, [currentProject]);
}
```

**3. Rust Module Boundaries (Clean Architecture)**

**Strict Dependency Rules:**

```
Domain (Layer 1)
  ↑ PEUT importer: RIEN (zéro deps externes)
  ↓ EST importé par: Application, Infrastructure

Application (Layer 2)
  ↑ PEUT importer: Domain uniquement
  ↓ EST importé par: Infrastructure

Infrastructure (Layer 3)
  ↑ PEUT importer: Domain, Application, external crates
  ↓ EST importé par: main.rs
```

**Example:**

```rust
// ✅ CORRECT: Application use case importe Domain
// application/use_cases/import_video.rs
use crate::domain::entities::video::VideoProject;
use crate::domain::repositories::video_repository::VideoRepository;
use crate::domain::errors::DomainError;

// ✅ CORRECT: Infrastructure adapter importe Domain + Application
// infrastructure/adapters/ffmpeg_adapter.rs
use crate::domain::value_objects::timecode::Timecode;
use crate::application::ports::video_processor::VideoProcessor;

// ❌ INCORRECT: Domain importe Infrastructure
// domain/entities/video.rs
use crate::infrastructure::adapters::ffmpeg_adapter::FFmpegAdapter; // NON!
```

---

### Service Boundaries

**Desktop App Services:**

**Location:** `apps/desktop/src/services/`

**Purpose:** Wrapper Tauri commands avec error handling + type safety

```typescript
// video-service.ts
import { invoke } from '@tauri-apps/api/core';
import type { VideoProject } from '@splice/types/generated';

export class VideoService {
  static async importVideo(filePath: string): Promise<VideoProject> {
    try {
      return await invoke<VideoProject>('import_video', { filePath });
    } catch (error) {
      console.error('Import failed:', error);
      throw new Error(`Failed to import video: ${error}`);
    }
  }

  static async getVideoInfo(projectId: string): Promise<VideoProject> {
    return await invoke<VideoProject>('get_video_info', { projectId });
  }
}
```

**Backend API Services (NestJS):**

**Location:** `apps/backend-api/src/modules/{domain}/{domain}.service.ts`

**Purpose:** Business logic, database access via Prisma

```typescript
// license.service.ts
@Injectable()
export class LicenseService {
  constructor(private prisma: PrismaService) {}

  async verifyLicense(licenseKey: string): Promise<LicenseVerifyResponse> {
    const license = await this.prisma.license.findUnique({
      where: { license_key: licenseKey },
      include: { user: true }
    });

    if (!license || license.status !== 'active') {
      return {
        success: false,
        error: { code: 'LICENSE_INVALID', message: 'Invalid license' }
      };
    }

    return {
      success: true,
      data: {
        plan: license.plan,
        expires_at: license.expires_at?.toISOString() || null,
        grace_period_ends_at: // calculate...
      }
    };
  }
}
```

---

### Data Boundaries

**1. SQLite Local Database (Desktop)**

**Location:** `~/.splice/db/splice.db` (macOS), `%APPDATA%/splice/db/splice.db` (Windows)

**Access Layer:** `src-tauri/src/infrastructure/adapters/sqlite_repository.rs`

**Schema Definition:** `src-tauri/migrations/001_initial_schema.sql`

**Tables:**
- `projects` - Video projects métadonnées
- `transcripts` - Transcriptions complètes
- `transcript_words` - Words individuels avec timestamps
- `selections` - Sélections utilisateur
- `license_cache` - Cache licence pour grace period

**Access Pattern:**

```rust
// Repository implementation (Infrastructure layer)
pub struct SqliteVideoRepository {
    pool: SqlitePool,
}

impl VideoRepository for SqliteVideoRepository {
    async fn save(&self, project: &VideoProject) -> Result<(), DomainError> {
        sqlx::query!(
            "INSERT INTO projects (id, file_path, file_name, duration_seconds, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)",
            project.id,
            project.file_path,
            project.file_name,
            project.duration_seconds,
            project.created_at,
            project.updated_at
        )
        .execute(&self.pool)
        .await
        .map_err(|e| DomainError::DatabaseError(e.to_string()))?;

        Ok(())
    }
}
```

**2. PostgreSQL Central Database (Backend API)**

**Location:** Hébergement cloud (Render/Railway/Supabase)

**Access Layer:** Prisma ORM (`apps/backend-api/prisma/schema.prisma`)

**Tables:**
- `users` - Utilisateurs
- `licenses` - Licences actives
- `subscriptions` - Abonnements Stripe
- `usage_analytics` - Analytics agrégées

**Access Pattern:**

```typescript
// Prisma access via service
async findActiveLicense(licenseKey: string): Promise<License | null> {
  return this.prisma.license.findUnique({
    where: {
      license_key: licenseKey,
      status: 'active'
    },
    include: {
      user: true,
      subscription: true
    }
  });
}
```

**3. Caching Boundaries**

**Desktop Cache:**
- **Transcript Cache:** En mémoire (Zustand store) pendant session
- **License Cache:** SQLite table `license_cache` (grace period)
- **Video Metadata Cache:** En mémoire après import

**Backend Cache:** Phase 2 (Redis pour rate limiting)

---

## Integration Points

### Internal Communication (Desktop App)

**Frontend → Rust Communication:**

```
React Component
  ↓ (invoke Tauri command)
Service Layer (video-service.ts)
  ↓ (Tauri IPC)
Tauri Command (video_commands.rs)
  ↓ (call use case)
Use Case (import_video.rs)
  ↓ (domain logic)
Domain Entities + Repositories
  ↓ (adapter implementation)
Infrastructure Adapter (sqlite_repository.rs)
  ↓ (SQLite)
Database
```

**Bidirectional Sync (Transcript ↔ Timeline):**

```
User selects text in TranscriptEditor
  ↓
TranscriptEditor calls onWordSelect(indices)
  ↓
Updates transcript-store (selectedWordIndices)
  ↓
useBidirectionalSync hook detects change
  ↓
Calculates time range from word timestamps
  ↓
Updates timeline-store (currentTime, highlightSegments)
  ↓
Timeline component re-renders with highlights
```

**Event Flow (Transcription Progress):**

```
User clicks "Transcribe" button
  ↓
Frontend calls invoke('transcribe_video')
  ↓
Rust starts async transcription
  ↓ (periodic events)
Rust emits 'transcript:progress' events
  ↓
Frontend listen() handler receives events
  ↓
Updates transcript-store (progress)
  ↓
ProgressBar component re-renders
  ↓ (completion)
Rust returns final Transcript
  ↓
Frontend updates transcript-store (transcript)
  ↓
TranscriptEditor displays full transcript
```

---

### External Integrations

**1. Backend API Integration (License Verification)**

```
Desktop App startup
  ↓
license-service.ts calls verifyLicense(key)
  ↓ (HTTPS POST)
Backend API /license/verify endpoint
  ↓
LicenseService queries PostgreSQL
  ↓
Returns license status + expiry
  ↓
Desktop updates license_cache SQLite table
  ↓
Stores last_verified_at timestamp
  ↓
If expired → show LicenseModal
```

**Grace Period Fallback:**

```
Desktop startup
  ↓
Attempt license verification
  ↓ (network error)
3 retries with exponential backoff fail
  ↓
Check license_cache.last_verified_at
  ↓
If < 7 days ago → Allow usage
  ↓
If > 7 days → Block with offline warning
```

**2. Stripe Integration (Backend Only)**

```
User purchases on website
  ↓
Stripe Checkout creates subscription
  ↓ (webhook)
POST /stripe/webhook (signature verified)
  ↓
StripeService handles event
  ↓
Creates/updates license in PostgreSQL
  ↓
Sends license key email to user
```

**3. FFmpeg Integration (Bundled)**

```
Desktop app contains bundled FFmpeg binary
  ↓
FFmpegAdapter spawns process
  ↓
Parses CLI output for progress
  ↓
Emits progress events to frontend
```

**4. Parakeet ML Integration (Downloaded Runtime)**

```
First app launch
  ↓
Check if model exists (~/.splice/models/parakeet.onnx)
  ↓
If not → Download from CDN (~500MB)
  ↓
Show download progress modal
  ↓
ParakeetAdapter loads model
  ↓
Inference runs CPU-only (ONNX runtime)
```

---

### Data Flow

**Complete User Workflow Data Flow:**

```
1. Import Video
   User drops file → ImportDropzone
     ↓
   invoke('import_video', { filePath })
     ↓
   FFmpegAdapter extracts metadata
     ↓
   SqliteRepository saves to projects table
     ↓
   Returns VideoProject to frontend
     ↓
   video-store updates currentProject
     ↓
   UI shows video info

2. Transcribe
   User clicks Transcribe button
     ↓
   invoke('transcribe_video', { projectId })
     ↓
   FFmpegAdapter extracts audio WAV
     ↓
   ParakeetAdapter runs inference
     ↓
   Emits 'transcript:progress' events (0-100%)
     ↓
   SqliteRepository saves transcript + words
     ↓
   Returns Transcript to frontend
     ↓
   transcript-store updates transcript
     ↓
   TranscriptEditor displays text

3. Select & Edit
   User highlights text in TranscriptEditor
     ↓
   Component calls onWordSelect(startIndex, endIndex)
     ↓
   transcript-store updates selectedWordIndices
     ↓
   useBidirectionalSync hook triggers
     ↓
   Calculates time range from words[startIndex].start_time to words[endIndex].end_time
     ↓
   timeline-store updates highlightedSegments
     ↓
   Timeline component shows colored segments
     ↓
   invoke('add_selection', { startIndex, endIndex })
     ↓
   SqliteRepository saves to selections table

4. Preview
   User clicks segment in Timeline
     ↓
   timeline-store updates currentTime
     ↓
   VideoPlayer seeks to currentTime
     ↓
   TranscriptEditor scrolls to matching word
     ↓
   User plays/pauses with keyboard shortcuts

5. Export
   User clicks Export button
     ↓
   invoke('export_video', { projectId, outputPath })
     ↓
   GenerateCutsUseCase reads selections
     ↓
   Calculates cut points with 0.1s margins
     ↓
   FFmpegAdapter generates filter_complex command
     ↓
   Streams video processing (no full load in RAM)
     ↓
   Emits 'export:progress' events
     ↓
   Writes final MP4 to outputPath
     ↓
   Returns outputPath to frontend
     ↓
   Shows success toast with file location
```

---

## File Organization Patterns

### Configuration Files

**Root Level:**
- `package.json` - Workspace root, scripts orchestration
- `pnpm-workspace.yaml` - Monorepo packages definition
- `turbo.json` - Build pipeline caching config
- `.gitignore` - Global ignore patterns
- `.env.example` - Example environment variables

**Desktop App:**
- `apps/desktop/package.json` - Frontend dependencies
- `apps/desktop/vite.config.ts` - Vite build config + path aliases
- `apps/desktop/tsconfig.json` - TypeScript root config
- `apps/desktop/tsconfig.app.json` - App-specific TS config
- `apps/desktop/tailwind.config.js` - Tailwind CSS configuration
- `apps/desktop/components.json` - shadcn/ui configuration
- `apps/desktop/src-tauri/tauri.conf.json` - Tauri app config (permissions, window, build)
- `apps/desktop/src-tauri/Cargo.toml` - Rust dependencies

**Backend API:**
- `apps/backend-api/package.json` - NestJS dependencies
- `apps/backend-api/nest-cli.json` - NestJS CLI config
- `apps/backend-api/tsconfig.json` - TypeScript config
- `apps/backend-api/prisma/schema.prisma` - Database schema
- `apps/backend-api/docker-compose.yml` - Local PostgreSQL

**Shared Packages:**
- `packages/*/package.json` - Per-package dependencies
- `packages/*/tsconfig.json` - Per-package TypeScript config

---

### Source Organization

**Frontend (React):**
```
src/
├── main.tsx              # Entry point
├── App.tsx               # Root component
├── index.css             # Global styles
├── components/           # Organized by feature
│   ├── ui/              # Generic shadcn/ui
│   ├── transcript-editor/  # Feature-specific
│   ├── timeline/
│   └── video-player/
├── stores/              # Zustand stores (1 per domain)
├── hooks/               # Custom hooks
├── services/            # Tauri command wrappers
├── utils/               # Utilities
├── types/               # Type definitions
└── lib/                 # Third-party lib configs
```

**Backend Rust (Clean Architecture):**
```
src/
├── main.rs              # Entry point
├── lib.rs               # Library exports
├── domain/              # Layer 1: Pure business logic
│   ├── entities/
│   ├── value_objects/
│   ├── repositories/    # Traits only
│   └── errors/
├── application/         # Layer 2: Use cases
│   ├── use_cases/
│   └── ports/           # Abstract interfaces
└── infrastructure/      # Layer 3: External adapters
    ├── adapters/
    ├── tauri_commands/
    └── config/
```

**Backend API (NestJS):**
```
src/
├── main.ts              # Entry point
├── app.module.ts        # Root module
├── modules/             # Feature modules
│   ├── license/
│   ├── stripe/
│   └── analytics/
├── config/              # Configuration
├── guards/              # Auth guards
└── interceptors/        # Logging, etc.
```

---

### Test Organization

**Frontend Tests:**
```
src/
├── components/
│   └── transcript-editor/
│       ├── TranscriptEditor.tsx
│       └── TranscriptEditor.test.tsx    # Côte-à-côte
├── stores/
│   ├── video-store.ts
│   └── video-store.test.ts              # Côte-à-côte
└── hooks/
    ├── use-timeline-sync.ts
    └── use-timeline-sync.test.ts        # Côte-à-côte
```

**Rust Tests:**
```
src/
├── domain/
│   └── value_objects/
│       └── timecode.rs                  # Tests inline #[cfg(test)]
└── application/
    └── use_cases/
        └── import_video.rs              # Tests inline

tests/                                    # Integration tests séparés
└── integration/
    ├── transcription_flow.rs
    └── export_flow.rs
```

**E2E Tests:**
```
tests-e2e/
├── playwright.config.ts
├── fixtures/
│   └── test-video.mp4
└── specs/
    ├── happy-path.spec.ts
    ├── freemium-blocker.spec.ts
    └── license-activation.spec.ts
```

**Backend API Tests:**
```
src/modules/license/
├── license.controller.ts
├── license.controller.spec.ts           # Côte-à-côte unit tests
├── license.service.ts
└── license.service.spec.ts

test/
└── app.e2e-spec.ts                      # E2E tests séparés
```

---

### Asset Organization

**Static Assets:**
```
apps/desktop/src-tauri/icons/
├── 32x32.png
├── 128x128.png
├── 128x128@2x.png
├── icon.icns           # macOS app icon
└── icon.ico            # Windows app icon

apps/desktop/public/    # (if needed for web assets)
└── assets/
    └── placeholder-video.png
```

**Test Fixtures:**
```
apps/desktop/src-tauri/tests/fixtures/
├── sample_video.mp4
├── test_config.json
└── mock_transcript.json

apps/desktop/tests-e2e/fixtures/
└── test-video.mp4
```

**Downloaded Runtime Assets:**
```
~/.splice/
├── db/
│   └── splice.db                        # SQLite database
├── models/
│   └── parakeet.onnx                    # ML model (~500MB)
└── logs/
    └── app.log                          # Application logs
```

---

## Development Workflow Integration

### Development Server Structure

**Commandes de Développement:**

```bash
# Root workspace
pnpm dev                 # Turbo runs dev in all packages

# Desktop app only
cd apps/desktop
pnpm tauri dev           # Starts Vite + Rust dev server

# Backend API only
cd apps/backend-api
pnpm start:dev           # NestJS dev mode with hot reload

# Packages (no dev server, consumed by apps)
cd packages/ui
pnpm build               # Build shared components
```

**Hot Reload:**
- **Frontend React:** Vite HMR (instant updates)
- **Rust Backend:** Tauri recompiles on save (slower, ~2-5s)
- **NestJS Backend:** Nodemon hot reload

**Development URLs:**
- Desktop app: `tauri://localhost` (Tauri window)
- Backend API: `http://localhost:3000`
- Backend API docs: `http://localhost:3000/api` (Swagger)

---

### Build Process Structure

**Build Commands:**

```bash
# Build all (monorepo)
pnpm build

# Desktop app build (per platform)
cd apps/desktop
pnpm tauri build --target aarch64-apple-darwin    # macOS Apple Silicon
pnpm tauri build --target x86_64-apple-darwin     # macOS Intel
pnpm tauri build --target x86_64-pc-windows-msvc  # Windows

# Backend API build
cd apps/backend-api
pnpm build                # Compiles to dist/

# Packages build
pnpm --filter @splice/ui build
pnpm --filter @splice/types build
```

**Build Outputs:**

```
apps/desktop/src-tauri/target/release/
├── bundle/
│   ├── dmg/                           # macOS installer
│   │   └── splice_1.0.0_aarch64.dmg
│   ├── msi/                           # Windows installer
│   │   └── splice_1.0.0_x64_en-US.msi
│   └── macos/
│       └── splice.app

apps/backend-api/dist/                  # NestJS compiled
├── main.js
└── ...

packages/*/dist/                        # Shared packages compiled
```

**Build Optimizations (Turbo):**
- Caches build outputs
- Runs parallel builds when possible
- Skips unchanged packages

---

### Deployment Structure

**Desktop App Distribution:**

```
Release Artifacts (GitHub Releases)
├── splice-1.0.0-darwin-aarch64.dmg    # macOS Apple Silicon
├── splice-1.0.0-darwin-x64.dmg        # macOS Intel
├── splice-1.0.0-windows-x64.msi       # Windows installer
├── latest.json                         # Tauri auto-update manifest
└── RELEASE_NOTES.md
```

**Code Signing (CI/CD):**
```yaml
# .github/workflows/release.yml
- name: Sign macOS app
  env:
    APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
    APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
  run: ./scripts/code-sign.sh macos

- name: Sign Windows app
  env:
    WINDOWS_CERTIFICATE: ${{ secrets.WINDOWS_CERTIFICATE }}
  run: ./scripts/code-sign.sh windows
```

**Backend API Deployment (Render/Railway):**

```
Backend API Hosting
├── Environment: Node.js 18+
├── Build Command: pnpm install && pnpm build
├── Start Command: node dist/main.js
├── Environment Variables:
│   ├── DATABASE_URL
│   ├── STRIPE_SECRET_KEY
│   ├── API_KEY
│   └── NODE_ENV=production
└── PostgreSQL Database (managed)
```

**Auto-Update Server (Tauri):**
```
Tauri Update Endpoint: https://api.splice.app/updates/latest.json
{
  "version": "1.0.0",
  "platforms": {
    "darwin-aarch64": {
      "url": "https://releases.splice.app/splice-1.0.0-darwin-aarch64.dmg",
      "signature": "..."
    },
    "windows-x86_64": {
      "url": "https://releases.splice.app/splice-1.0.0-windows-x64.msi",
      "signature": "..."
    }
  }
}
```

---
