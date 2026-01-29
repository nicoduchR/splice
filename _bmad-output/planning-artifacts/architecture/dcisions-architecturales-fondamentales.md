# Décisions Architecturales Fondamentales

## Analyse de Priorité des Décisions

**Décisions Critiques (Bloquent Implémentation):**

1. **Architecture en Couches:** Clean Architecture 3 layers (Domain, Application, Infrastructure)
2. **Stockage Données:** SQLite embedded (desktop) + PostgreSQL centralisé (backend API)
3. **Stack Backend API:** Node.js + NestJS + Prisma
4. **State Management Frontend:** Zustand avec sélecteurs optimisés
5. **Type Safety Rust ↔ TypeScript:** ts-rs pour génération automatique types
6. **Organisation Tauri Commands:** Par domaine métier (video, transcript, selection, cuts, export, license)

**Décisions Importantes (Façonnent Architecture):**

1. **Testing Strategy:** Tests unitaires + intégration + E2E pragmatiques
2. **Communication Frontend ↔ Backend:** Tauri IPC + HTTPS REST API
3. **Structure Monorepo:** apps/desktop + packages shared (ui, types, validation, utils)

**Décisions Différées (Post-MVP):**

1. Analytics détaillées (phase 2)
2. Crash reporting automatisé (Sentry - phase 2)
3. Tests UI exhaustifs (focus MVP sur tests critiques)

---

## Architecture Système Complète

**Vision d'Ensemble:**

```
┌─────────────────────────────────────────────────────────────┐
│                    SPLICE ECOSYSTEM                          │
├─────────────────────────────────┬───────────────────────────┤
│  Application Desktop (Client)   │   Backend API (Serveur)   │
│  Tauri + Rust + React            │   Node.js + NestJS        │
├─────────────────────────────────┼───────────────────────────┤
│                                  │                           │
│  ┌──────────────────────┐       │   ┌─────────────────┐    │
│  │  Frontend React      │       │   │  API REST       │    │
│  │  - Zustand state     │       │   │  - /license/*   │    │
│  │  - TranscriptEditor  │◄──────┼───┤  - /updates/*   │    │
│  │  - Timeline          │ HTTPS │   │  - /analytics/* │    │
│  │  - VideoPlayer       │       │   └─────────────────┘    │
│  └──────────────────────┘       │            │              │
│           ▲                      │            ▼              │
│           │ Tauri IPC            │   ┌─────────────────┐    │
│           ▼                      │   │  PostgreSQL     │    │
│  ┌──────────────────────┐       │   │  - Users        │    │
│  │  Backend Rust        │       │   │  - Licenses     │    │
│  │  - Use Cases         │       │   │  - Subscriptions│    │
│  │  - Domain Logic      │       │   │  - Analytics    │    │
│  │  - FFmpeg + Parakeet │       │   └─────────────────┘    │
│  └──────────────────────┘       │            │              │
│           ▲                      │            ▼              │
│           │                      │   ┌─────────────────┐    │
│  ┌──────────────────────┐       │   │  Stripe         │    │
│  │  SQLite Embedded     │       │   │  (Webhooks)     │    │
│  │  - Projets           │       │   └─────────────────┘    │
│  │  - Transcripts       │       │                           │
│  │  - Sélections        │       │   ┌─────────────────┐    │
│  │  - Cache licence     │       │   │  Admin Dashboard│    │
│  └──────────────────────┘       │   │  (Next.js)      │    │
│                                  │   └─────────────────┘    │
└─────────────────────────────────┴───────────────────────────┘
```

**Rationale Dualité Desktop + Backend:**

- **Desktop App (SQLite):** Données utilisateur 100% locales, offline-first, confidentialité maximale
- **Backend API (PostgreSQL):** Données métier centralisées (licences, subscriptions, analytics admin)
- **Communication:** HTTPS REST occasionnel (vérification licence, updates), grace period 7 jours offline

Cette séparation garantit confidentialité utilisateur (vidéos jamais upload) tout en permettant gestion licences SaaS et monitoring admin.

---

## Architecture Clean en 3 Couches (Rust Backend)

**Adaptation de votre Architecture tailored-friend pour Tauri + Rust:**

Votre diagramme tailored-friend montre une architecture 4-layer NestJS (API → Application → Domain → Infrastructure). Pour Splice, nous adaptons à **3 couches Clean Architecture** optimisée Rust:

```
┌─────────────────────────────────────────────────────────┐
│              src-tauri/src/                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │  1. DOMAIN LAYER (Business Logic)          │        │
│  │  - entities/ (Video, Transcript, Cut)      │        │
│  │  - value_objects/ (Timecode, Duration)     │        │
│  │  - repositories/ (traits only)             │        │
│  │  - errors/ (domain errors)                 │        │
│  └────────────────────────────────────────────┘        │
│                      ▲                                   │
│                      │                                   │
│  ┌────────────────────────────────────────────┐        │
│  │  2. APPLICATION LAYER (Use Cases)          │        │
│  │  - use_cases/                              │        │
│  │    - import_video.rs                       │        │
│  │    - transcribe_video.rs                   │        │
│  │    - generate_cuts.rs                      │        │
│  │    - export_video.rs                       │        │
│  │  - ports/ (interfaces abstraites)          │        │
│  └────────────────────────────────────────────┘        │
│                      ▲                                   │
│                      │                                   │
│  ┌────────────────────────────────────────────┐        │
│  │  3. INFRASTRUCTURE LAYER (Adapters)        │        │
│  │  - adapters/                               │        │
│  │    - ffmpeg_adapter.rs                     │        │
│  │    - parakeet_adapter.rs                   │        │
│  │    - sqlite_repository.rs                  │        │
│  │  - tauri_commands/ (expose to frontend)    │        │
│  │  - config/                                 │        │
│  └────────────────────────────────────────────┘        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Règles de Dépendances (Dependency Inversion):**
- Domain ne dépend de RIEN (zéro imports externes)
- Application dépend de Domain uniquement
- Infrastructure dépend de Domain + Application
- Frontend React communique uniquement via Infrastructure (tauri_commands)

**Rationale 3 Couches vs 4:**
- Pas de couche API séparée (Tauri commands = API layer intégré Infrastructure)
- Domain + Value Objects fusionnés (pas besoin séparation stricte en Rust grâce au type system)
- Plus pragmatique pour solo dev, maintient séparation concerns essentielle

---

## Stockage Données: Architecture Duale

**Décision: SQLite Embedded (Desktop) + PostgreSQL Centralisé (Backend API)**

**1. SQLite Embedded (Application Desktop)**

**Localisation:** `~/.splice/db/splice.db` (macOS), `%APPDATA%/splice/db/splice.db` (Windows)

**Schéma (Tables Principales):**
```sql
-- Projets vidéo locaux
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  duration_seconds REAL NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Transcriptions avec word-level timestamps
CREATE TABLE transcripts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  full_text TEXT NOT NULL,
  language TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Words individuels avec timestamps précis
CREATE TABLE transcript_words (
  id TEXT PRIMARY KEY,
  transcript_id TEXT NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  start_time REAL NOT NULL,
  end_time REAL NOT NULL,
  confidence REAL NOT NULL,
  word_index INTEGER NOT NULL,
  FOREIGN KEY (transcript_id) REFERENCES transcripts(id)
);

-- Sélections utilisateur (surlignage texte)
CREATE TABLE selections (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  start_word_index INTEGER NOT NULL,
  end_word_index INTEGER NOT NULL,
  start_time REAL NOT NULL,
  end_time REAL NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Cache licence (grace period offline)
CREATE TABLE license_cache (
  id INTEGER PRIMARY KEY CHECK (id = 1), -- Single row table
  license_key TEXT NOT NULL,
  plan TEXT NOT NULL, -- 'free' | 'pro'
  last_verified_at INTEGER NOT NULL,
  expires_at INTEGER,
  grace_period_ends_at INTEGER NOT NULL
);
```

**Rationale SQLite:**
- Données 100% locales (confidentialité maximale)
- Pas de serveur DB à gérer
- File-based portable (backup = copie fichier)
- Performance excellente projets solo (<1M words)
- Offline-first par nature

**2. PostgreSQL Centralisé (Backend API)**

**Localisation:** Serveur backend NestJS (hébergement à définir - Render/Railway/Fly.io)

**Schéma (Tables Principales):**
```sql
-- Utilisateurs (référence pour licences)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Licences actives
CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_key VARCHAR(64) UNIQUE NOT NULL,
  plan VARCHAR(20) NOT NULL CHECK (plan IN ('free', 'pro')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'expired', 'revoked')),
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions Stripe
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  plan VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analytics agrégées (admin monitoring)
CREATE TABLE usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key VARCHAR(64) NOT NULL REFERENCES licenses(license_key),
  event_type VARCHAR(50) NOT NULL, -- 'transcription', 'export', 'launch'
  event_data JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Rationale PostgreSQL Backend:**
- Gestion licences centralisée (vérification multi-devices)
- Stripe webhooks nécessitent persistence serveur
- Analytics admin (dashboards usage)
- Scalabilité future (multi-tenant)

**Communication Desktop ↔ Backend:**
- Protocol: HTTPS REST API
- Endpoints: `/api/v1/license/verify`, `/api/v1/license/activate`
- Frequency: Démarrage app + refresh périodique (grace period 7 jours)
- Sécurité: API key + rate limiting + HTTPS obligatoire

---

## Stack Backend API Server

**Décision: Node.js + NestJS + Prisma**

**Rationale:**
- **Familiarité:** Stack que vous connaissez déjà (NestJS)
- **Prisma:** ORM type-safe, migrations simples, génération types auto
- **NestJS:** Architecture modulaire, DI container, testing intégré
- **Ecosystem:** Stripe SDK officiel excellent, nombreuses libs
- **Déploiement:** Compatible toutes plateformes cloud (Render, Railway, Fly.io)

**Structure Backend API (Minimale MVP):**
```
backend-api/
├── src/
│   ├── modules/
│   │   ├── license/
│   │   │   ├── license.controller.ts    # REST endpoints
│   │   │   ├── license.service.ts       # Business logic
│   │   │   └── license.module.ts
│   │   ├── stripe/
│   │   │   ├── stripe.controller.ts     # Webhooks
│   │   │   ├── stripe.service.ts
│   │   │   └── stripe.module.ts
│   │   └── analytics/
│   │       ├── analytics.controller.ts
│   │       ├── analytics.service.ts
│   │       └── analytics.module.ts
│   ├── prisma/
│   │   └── schema.prisma               # DB schema
│   ├── config/
│   │   └── configuration.ts            # Env vars
│   └── main.ts
├── test/
├── package.json
└── .env
```

**Endpoints Minimaux MVP:**
- `POST /api/v1/license/verify` - Vérifier validité licence
- `POST /api/v1/license/activate` - Activer nouvelle licence
- `POST /api/v1/stripe/webhook` - Recevoir événements Stripe
- `GET /api/v1/analytics/dashboard` - Stats admin (Phase 2)

---

## State Management Frontend

**Décision: Zustand avec Sélecteurs Optimisés**

**Rationale:**
- Simplicité (courbe apprentissage faible vs Redux)
- Performance (re-renders minimaux via sélecteurs)
- TypeScript natif
- DevTools disponibles
- Pas de boilerplate (actions/reducers/sagas)

**Architecture Store:**

**Option Retenue: Multiple Stores par Domaine**

```typescript
// stores/video-store.ts
interface VideoStore {
  currentProject: VideoProject | null;
  isImporting: boolean;
  importProgress: number;

  importVideo: (filePath: string) => Promise<void>;
  clearProject: () => void;
}

export const useVideoStore = create<VideoStore>((set, get) => ({
  currentProject: null,
  isImporting: false,
  importProgress: 0,

  importVideo: async (filePath) => {
    set({ isImporting: true, importProgress: 0 });
    // Tauri command call
  },

  clearProject: () => set({ currentProject: null })
}));

// stores/transcript-store.ts
interface TranscriptStore {
  transcript: Transcript | null;
  selectedWords: WordSelection[];

  setTranscript: (transcript: Transcript) => void;
  toggleWordSelection: (wordIndex: number) => void;
  clearSelection: () => void;
}

export const useTranscriptStore = create<TranscriptStore>((set) => ({
  // ...
}));

// stores/timeline-store.ts (synchronisation temps réel)
interface TimelineStore {
  currentTime: number;
  isPlaying: boolean;
  segments: TimelineSegment[];

  setCurrentTime: (time: number) => void;
  togglePlayback: () => void;
}

export const useTimelineStore = create<TimelineStore>((set) => ({
  // ...
}));
```

**Synchronisation Cross-Store:**
```typescript
// hooks/use-sync-timeline.ts
export function useSyncTimeline() {
  const currentTime = useTimelineStore(s => s.currentTime);
  const setCurrentTime = useTimelineStore(s => s.setCurrentTime);
  const transcript = useTranscriptStore(s => s.transcript);

  // Synchronisation bidirectionnelle
  useEffect(() => {
    // Timeline change → scroll transcript
    // Transcript selection → update timeline
  }, [currentTime, transcript]);
}
```

**Alternative Considérée: Redux Toolkit**
- ❌ Boilerplate plus lourd (slices, thunks)
- ✅ DevTools plus riches
- ❌ Overhead mental pour solo dev MVP

---

## Type Safety Rust ↔ TypeScript

**Décision: ts-rs pour Génération Automatique Types**

**Rationale:**
- Types TypeScript générés depuis structs Rust (single source of truth)
- Synchronisation automatique (pas de drift)
- Compile-time safety des deux côtés
- Zéro maintenance manuelle

**Exemple Workflow:**

**1. Définir Types Rust avec Annotations ts-rs**

```rust
// src/domain/entities/video.rs
use serde::{Serialize, Deserialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../packages/types/src/generated/")]
pub struct VideoProject {
    pub id: String,
    pub file_path: String,
    pub file_name: String,
    pub duration_seconds: f64,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../../packages/types/src/generated/")]
pub struct TranscriptWord {
    pub id: String,
    pub word: String,
    pub start_time: f64,
    pub end_time: f64,
    pub confidence: f64,
    pub word_index: u32,
}
```

**2. Build Process Auto-Génère Types TypeScript**

```bash
# Cargo build exécute ts-rs
cargo build
# Génère automatiquement: packages/types/src/generated/VideoProject.ts
```

**3. Import Types dans Frontend**

```typescript
// apps/desktop/src/components/video-player.tsx
import type { VideoProject, TranscriptWord } from '@splice/types/generated';

interface VideoPlayerProps {
  project: VideoProject;
  words: TranscriptWord[];
}

export function VideoPlayer({ project, words }: VideoPlayerProps) {
  // Types garantis synchronisés avec Rust backend
}
```

**Bénéfices:**
- Changement struct Rust → types TypeScript mis à jour automatiquement
- Erreurs TypeScript si backend change format sans update frontend
- Packages shared (`@splice/types`) peuvent être utilisés par desktop + tests + future web app

---

## Organisation Tauri Commands par Domaine

**Décision: Commandes Groupées par Domaine Métier**

**Rationale:**
- Cohésion logique (video, transcript, cuts, export, license)
- Facilite navigation code pour AI agents
- Évite fichiers monolithiques (main.rs 1000+ lignes)
- Mapping clair avec use cases

**Structure:**

```
src-tauri/src/
├── main.rs                          # Entry point, command registration
├── domain/                          # Layer 1: Domain
├── application/                     # Layer 2: Application (use cases)
└── infrastructure/
    ├── tauri_commands/              # Layer 3: Tauri IPC exposure
    │   ├── mod.rs                   # Re-exports
    │   ├── video_commands.rs        # import_video, get_video_info
    │   ├── transcript_commands.rs   # transcribe, get_transcript
    │   ├── selection_commands.rs    # add_selection, remove_selection
    │   ├── cuts_commands.rs         # generate_cuts, preview_cut
    │   ├── export_commands.rs       # export_video, get_export_progress
    │   └── license_commands.rs      # verify_license, activate_license
    ├── adapters/                    # FFmpeg, Parakeet, SQLite
    └── config/
```

**Exemple: video_commands.rs**

```rust
// infrastructure/tauri_commands/video_commands.rs
use crate::application::use_cases::import_video::ImportVideoUseCase;
use crate::domain::entities::video::VideoProject;

#[tauri::command]
pub async fn import_video(
    file_path: String,
    state: tauri::State<'_, AppState>
) -> Result<VideoProject, String> {
    let use_case = ImportVideoUseCase::new(state.video_repository.clone());
    use_case.execute(file_path)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_video_info(
    project_id: String,
    state: tauri::State<'_, AppState>
) -> Result<VideoProject, String> {
    // ...
}
```

**Registration dans main.rs:**

```rust
// main.rs
mod infrastructure;
use infrastructure::tauri_commands::*;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // Video domain
            video_commands::import_video,
            video_commands::get_video_info,

            // Transcript domain
            transcript_commands::transcribe,
            transcript_commands::get_transcript,

            // Selection domain
            selection_commands::add_selection,
            selection_commands::remove_selection,

            // Cuts domain
            cuts_commands::generate_cuts,
            cuts_commands::preview_cut,

            // Export domain
            export_commands::export_video,
            export_commands::get_export_progress,

            // License domain
            license_commands::verify_license,
            license_commands::activate_license,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Appel depuis Frontend:**

```typescript
// apps/desktop/src/services/video-service.ts
import { invoke } from '@tauri-apps/api/core';
import type { VideoProject } from '@splice/types/generated';

export async function importVideo(filePath: string): Promise<VideoProject> {
  return await invoke<VideoProject>('import_video', { filePath });
}

export async function getVideoInfo(projectId: string): Promise<VideoProject> {
  return await invoke<VideoProject>('get_video_info', { projectId });
}
```

---

## Testing Strategy: Approche Pragmatique

**Décision: Tests Unitaires + Intégration + E2E Critiques**

**Philosophy MVP:**
- Tester critical paths (transcription, cuts, export)
- Éviter over-testing (pas 100% coverage obligatoire)
- Focus ROI: tests qui capturent vraies régressions
- Automatisation CI pour blocage merges défaillants

**1. Tests Unitaires Rust (Domain + Application)**

**Framework:** Tests intégrés Cargo + mocks

```rust
// src/domain/value_objects/timecode.rs
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_timecode_from_seconds() {
        let tc = Timecode::from_seconds(125.5);
        assert_eq!(tc.to_string(), "00:02:05.500");
    }

    #[test]
    fn test_timecode_add_margin() {
        let tc = Timecode::from_seconds(10.0);
        let with_margin = tc.add_margin(0.1);
        assert_eq!(with_margin.to_seconds(), 10.1);
    }
}
```

**Priorité Tests Rust:**
- ✅ Domain value objects (Timecode, Duration)
- ✅ Use cases critiques (import_video, generate_cuts)
- ✅ Business logic (sélection contiguë, marges auto 0.1s)
- ❌ Adapters simples (wrapping FFmpeg/Parakeet - tester en intégration)

**2. Tests Intégration Rust (Use Cases + Adapters)**

```rust
// tests/integration/transcription_flow.rs
#[tokio::test]
async fn test_full_transcription_flow() {
    // Setup: Fichier vidéo test
    let test_video = PathBuf::from("tests/fixtures/sample_30s.mp4");

    // Execute: Transcription complète
    let use_case = TranscribeVideoUseCase::new(/* ... */);
    let result = use_case.execute(test_video).await;

    // Assert: Transcript valide avec word timestamps
    assert!(result.is_ok());
    let transcript = result.unwrap();
    assert!(!transcript.words.is_empty());
    assert!(transcript.words[0].start_time >= 0.0);
}
```

**Priorité Tests Intégration:**
- ✅ Transcription end-to-end (Parakeet)
- ✅ Génération cuts (FFmpeg)
- ✅ Persistence SQLite (CRUD projets/transcripts)
- ❌ Export complet (trop lent pour CI - tester manuellement)

**3. Tests Frontend (React Components)**

**Framework:** Vitest + React Testing Library

```typescript
// apps/desktop/src/components/transcript-editor.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TranscriptEditor } from './transcript-editor';

describe('TranscriptEditor', () => {
  it('highlights selected words', () => {
    const words = [
      { id: '1', word: 'Hello', start_time: 0, end_time: 0.5, confidence: 0.9, word_index: 0 },
      { id: '2', word: 'world', start_time: 0.5, end_time: 1.0, confidence: 0.95, word_index: 1 },
    ];

    render(<TranscriptEditor words={words} selectedIndices={[0]} />);

    const firstWord = screen.getByText('Hello');
    expect(firstWord).toHaveClass('bg-primary'); // Highlighted
  });
});
```

**Priorité Tests Frontend:**
- ✅ TranscriptEditor (surlignage, sélection)
- ✅ Timeline (sync temps réel)
- ✅ Zustand stores (actions, selectors)
- ❌ Composants simples shadcn/ui (déjà testés par library)

**4. Tests E2E (Playwright)**

```typescript
// tests/e2e/happy-path.spec.ts
import { test, expect } from '@playwright/test';

test('complete workflow: import → transcribe → select → export', async ({ page }) => {
  // Launch Tauri app
  await page.goto('tauri://localhost');

  // Import video
  await page.click('button:has-text("Import Video")');
  // Note: File picker needs mocking Tauri APIs

  // Wait transcription
  await expect(page.locator('.transcript-text')).toBeVisible({ timeout: 10000 });

  // Select text
  const firstWord = page.locator('.transcript-word').first();
  await firstWord.click();

  // Verify timeline updated
  await expect(page.locator('.timeline-segment')).toBeVisible();

  // Export
  await page.click('button:has-text("Export")');
  await expect(page.locator('.export-success')).toBeVisible({ timeout: 30000 });
});
```

**Priorité Tests E2E:**
- ✅ Happy path complet (import → export)
- ✅ Freemium blocker (limite 30min)
- ✅ Licence activation flow
- ❌ Edge cases (gérer en tests unitaires/intégration)

**5. CI/CD Pipeline Tests**

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test-rust:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    steps:
      - uses: actions/checkout@v4
      - name: Run Rust tests
        run: |
          cd apps/desktop/src-tauri
          cargo test

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - name: Run frontend tests
        run: pnpm test

  test-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run E2E tests
        run: pnpm test:e2e
```

**Tests Différés Phase 2:**
- Performance benchmarks (transcription <5s, export <2x durée)
- Accessibilité automatisée (jest-axe)
- Visual regression (Percy/Chromatic)
- Load testing backend API

---
