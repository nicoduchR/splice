# Epic 1: Application Foundation & Video Import

Les utilisateurs peuvent installer Splice et importer leur première vidéo professionnelle.

## Story 1.1: Project Foundation Setup with Monorepo

As a developer,
I want to initialize the project with the recommended starter template and monorepo structure,
So that I have a solid foundation with Tauri, React, TypeScript, and shared packages ready for development.

**Acceptance Criteria:**

**Given** starting a new greenfield project
**When** following the architecture starter template setup (ARCH-1, ARCH-2, ARCH-3, ARCH-12)
**Then** monorepo structure is created with:
  - Root `package.json` with pnpm workspaces
  - `pnpm-workspace.yaml` configured
  - `turbo.json` for build orchestration
  - `apps/desktop/` directory with Tauri 2.x app (created via `pnpm create tauri-app`)
  - `packages/ui/`, `packages/types/`, `packages/validation/`, `packages/utils/` directories
**And** Tauri app includes React + TypeScript + Vite configuration
**And** Tailwind CSS v4 installed and configured with `@tailwindcss/vite` plugin
**And** `vite.config.ts` includes path aliases for `@/` and `@splice/*` packages
**And** `tsconfig.json` includes path mappings for monorepo packages
**And** shadcn/ui initialized with `npx shadcn@latest init` (base color: Slate, CSS variables: yes)
**And** all dependencies install successfully with `pnpm install`
**And** dev server starts with `pnpm dev` and displays default Tauri app
**And** application starts in less than 3 seconds (NFR9)

---

## Story 1.2: Clean Architecture Foundation & Type Safety

As a developer,
I want to implement Clean Architecture layers and automatic type generation,
So that the codebase is maintainable, testable, and type-safe across Rust and TypeScript.

**Acceptance Criteria:**

**Given** the project foundation is setup
**When** implementing Clean Architecture structure (ARCH-4, ARCH-9)
**Then** Rust backend organized in 3 layers:
  - `src-tauri/src/domain/` - entities, value_objects, repository traits, domain errors
  - `src-tauri/src/application/` - use_cases, ports (abstract interfaces)
  - `src-tauri/src/infrastructure/` - adapters, tauri_commands, config
**And** ts-rs crate added to `Cargo.toml` dependencies
**And** example domain entity created with `#[derive(TS)]` and `#[ts(export, export_to = "../../../packages/types/src/generated/")]`
**And** cargo build generates TypeScript types in `packages/types/src/generated/`
**And** TypeScript can import generated types with `import type { EntityName } from '@splice/types/generated'`
**And** Dependency Inversion principle enforced: Domain → Application → Infrastructure
**And** example demonstrates no circular dependencies

---

## Story 1.3: State Management & Local Storage Setup

As a developer,
I want to configure Zustand state management and SQLite embedded storage,
So that the app can manage state efficiently and persist projects locally.

**Acceptance Criteria:**

**Given** architecture foundation is in place
**When** setting up state management and storage (ARCH-5, ARCH-8)
**Then** Zustand installed in `apps/desktop` dependencies
**And** multiple store files created in `apps/desktop/src/stores/`:
  - `video-store.ts` - manages current project, import state
  - `transcript-store.ts` - manages transcript data and selections
  - `timeline-store.ts` - manages playback state and timeline
  - `license-store.ts` - manages license verification state
**And** SQLite configured in Rust backend with `rusqlite` crate
**And** database file location configured: `~/.splice/db/splice.db` (macOS), `%APPDATA%/splice/db/splice.db` (Windows)
**And** `projects` table created with migration:
  ```sql
  CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    duration_seconds REAL NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  ```
**And** SQLite repository trait defined in domain layer
**And** SQLite adapter implementation in infrastructure layer
**And** example Zustand store demonstrates updating state and triggering re-renders

---

## Story 1.4: Video Import UI with Drag & Drop

As a user,
I want to import video files by dragging them into the application window,
So that I can quickly start working on my video without navigating file dialogs.

**Acceptance Criteria:**

**Given** the application is running
**When** user drags a video file over the app window (FR1)
**Then** drop zone highlights with visual feedback (border glow or overlay)
**And** supported formats indicated: "Drop MP4, MOV, or AVI files here" (FR2)
**And** on drop, file path is captured
**And** import process initiates automatically
**And** alternative "Select File" button available for users who prefer file picker
**And** only one project can be imported at a time (mono-projet MVP) (FR6)
**And** if a project already exists, user is prompted: "Replace current project?"
**And** UI is responsive and handles drag events without lag (<100ms response) (NFR7)

---

## Story 1.5: Video Format Validation & Error Handling

As a user,
I want the system to validate my video file format before processing,
So that I get clear error messages if my file isn't supported.

**Acceptance Criteria:**

**Given** user has dropped or selected a video file
**When** file validation runs (FR3, FR4)
**Then** FFmpeg bundled with app and accessible (NFR33)
**And** system checks file extension is MP4, MOV, or AVI (FR2)
**And** system probes video codec using FFmpeg
**And** supported codecs: H.264, H.265/HEVC (NFR34)
**And** if format unsupported, clear error dialog displays: "Format non supporté. Splice accepte uniquement MP4, MOV et AVI avec codec H.264 ou H.265." (FR4, NFR35)
**And** if codec unsupported, error specifies: "Ce fichier utilise un codec non supporté. Veuillez convertir en H.264 ou H.265."
**And** if file corrupted, error displays: "Ce fichier vidéo semble corrompu. Impossible de le lire." (NFR23)
**And** error messages are in French (NFR29)
**And** error dialog includes "Retry" button and "Cancel" button

---

## Story 1.6: Video Import Backend Processing & Storage

As a user,
I want my imported video to be processed and saved efficiently,
So that I can work with large files up to 50GB without the app crashing or running out of memory.

**Acceptance Criteria:**

**Given** video file has passed validation
**When** import processing starts (FR5, FR6)
**Then** Tauri command `import_video` is called from frontend with file path
**And** Rust backend extracts video metadata: duration, resolution, codec, file size
**And** streaming architecture used to avoid loading entire file in memory (NFR5, PLATFORM-6)
**And** video file stays in original location (not copied)
**And** project record created in SQLite `projects` table with:
  - Unique project ID (UUID)
  - Original file path
  - File name
  - Duration in seconds
  - Created/updated timestamps
**And** frontend receives project object with type safety via ts-rs generated types
**And** video store updated with current project
**And** files up to 50GB handled without crash or memory saturation (<4GB RAM usage) (FR5, NFR5)
**And** import completes successfully and user sees confirmation toast: "Vidéo importée avec succès"

---

## Story 1.7: Design System Foundation with Shadcn/ui

As a developer,
I want essential UI components installed and configured,
So that the app has a consistent, accessible, and professional design system.

**Acceptance Criteria:**

**Given** shadcn/ui is initialized
**When** installing base components (UX-11, UX-12)
**Then** following shadcn/ui components added with `npx shadcn@latest add`:
  - `button` - Primary, secondary, destructive variants
  - `dialog` - Modals and confirmations
  - `progress` - Progress bars for transcription, cuts, export
  - `toast` - Success/error notifications
  - `tooltip` - Contextual help
**And** Tailwind config extended with custom breakpoints (UX-3):
  ```js
  theme: {
    extend: {
      screens: {
        'desktop': '1280px',
        'comfortable': '1920px',
        'spacious': '2560px',
        'ultra': '3840px',
      }
    }
  }
  ```
**And** color system configured with emerald primary: `colors: { primary: '#10b981' }`
**And** spacing scale uses rem units for scalability (UX-9)
**And** components follow WCAG AA contrast requirements (UX-1)
**And** all buttons have minimum 44x44px touch targets (UX-6)
**And** focus indicators visible with `focus:ring-2 focus:ring-emerald-500` (UX-10)
**And** example page demonstrates all components rendering correctly

---

## Story 1.8: macOS Universal Binary Build & Code Signing

As a developer,
I want to build and sign a macOS Universal Binary,
So that users on both Intel and Apple Silicon Macs can install and run Splice without security warnings.

**Acceptance Criteria:**

**Given** development is ready for distribution (FR43, PLATFORM-1, PLATFORM-3)
**When** building for macOS production
**Then** `tauri build` configured for Universal Binary (x86_64 + aarch64)
**And** `tauri.conf.json` includes macOS bundle settings:
  - App name: "Splice"
  - Bundle identifier: "com.splice.app"
  - Minimum OS version: macOS 13.0 Ventura
**And** Apple Developer certificate configured for code signing (NFR17)
**And** app is signed with Developer ID Application certificate
**And** app is notarized via Apple notarization service
**And** resulting `.dmg` file installable without Gatekeeper warnings
**And** app runs on both Intel and Apple Silicon Macs
**And** builds stored in `src-tauri/target/release/bundle/dmg/`

---

## Story 1.9: Windows Installer Build & Code Signing

As a developer,
I want to build and sign a Windows installer,
So that users on Windows 10/11 can install Splice without SmartScreen warnings.

**Acceptance Criteria:**

**Given** development is ready for distribution (FR44, PLATFORM-2, PLATFORM-4)
**When** building for Windows production
**Then** `tauri build` configured for Windows x86_64
**And** `tauri.conf.json` includes Windows bundle settings:
  - App name: "Splice"
  - Minimum OS version: Windows 10 22H2, Windows 11
**And** Windows code signing certificate configured (NFR18)
**And** installer signed with certificate to avoid SmartScreen warnings
**And** `.msi` or `.exe` installer created
**And** installer includes option to add desktop shortcut
**And** app uninstalls cleanly (removes data in `%APPDATA%/splice/`)
**And** builds stored in `src-tauri/target/release/bundle/msi/` or `/nsis/`

---
