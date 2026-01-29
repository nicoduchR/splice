# Patterns d'Implémentation & Règles de Cohérence

_Cette section définit les conventions strictes que tous les agents AI doivent suivre pour garantir la cohérence du code à travers le projet. Ces patterns préviennent les conflits et assurent que le code généré par différents agents s'intègre harmonieusement._

## 1. Naming Conventions (Conventions de Nommage)

**Objectif:** Éliminer ambiguïté entre Rust (snake_case), TypeScript (camelCase), SQL, et APIs.

### 1.1 Rust Backend

**Règle Générale:** `snake_case` partout (conformité Rust standard)

```rust
// ✅ CORRECT
pub struct VideoProject { }
pub fn import_video() { }
pub mod transcript_commands;
const MAX_VIDEO_DURATION: f64 = 7200.0;

// ❌ INCORRECT
pub struct videoProject { }
pub fn importVideo() { }
pub mod transcriptCommands;
const maxVideoDuration: f64 = 7200.0;
```

**Types & Structs:** `PascalCase`
```rust
pub struct TranscriptWord { }
pub enum ExportFormat { Mp4, Mov }
pub type Result<T> = std::result::Result<T, DomainError>;
```

**Fonctions & Méthodes:** `snake_case`
```rust
pub fn generate_cuts(selections: &[Selection]) -> Vec<Cut> { }
pub fn add_margin(&self, margin_seconds: f64) -> Timecode { }
```

**Modules:** `snake_case`
```rust
mod video_commands;
mod transcript_repository;
mod ffmpeg_adapter;
```

**Constantes:** `SCREAMING_SNAKE_CASE`
```rust
const DEFAULT_MARGIN_SECONDS: f64 = 0.1;
const MAX_GRACE_PERIOD_DAYS: i64 = 7;
```

### 1.2 TypeScript Frontend

**Règle Générale:** `camelCase` pour variables/fonctions, `PascalCase` pour types/composants

```typescript
// ✅ CORRECT
const currentProject: VideoProject | null = null;
function importVideo(filePath: string): Promise<void> { }
interface TranscriptEditorProps { }
type WordSelection = { startIndex: number; endIndex: number };

// ❌ INCORRECT
const CurrentProject: VideoProject | null = null;
function ImportVideo(file_path: string): Promise<void> { }
interface transcriptEditorProps { }
type word_selection = { start_index: number; end_index: number };
```

**Composants React:** `PascalCase` (fichiers ET noms composants)
```typescript
// Fichier: TranscriptEditor.tsx
export function TranscriptEditor() { }

// Fichier: VideoPlayer.tsx
export function VideoPlayer() { }
```

**Hooks Custom:** Préfixe `use` + `camelCase`
```typescript
export function useTranscriptSync() { }
export function useVideoPlayer() { }
export function useKeyboardShortcuts() { }
```

**Stores Zustand:** Suffixe `Store` + `camelCase`
```typescript
export const useVideoStore = create<VideoStore>(() => ({ }));
export const useTranscriptStore = create<TranscriptStore>(() => ({ }));
```

**Constantes:** `SCREAMING_SNAKE_CASE`
```typescript
const MAX_VIDEO_SIZE_GB = 50;
const DEFAULT_MARGIN_MS = 100;
const GRACE_PERIOD_DAYS = 7;
```

### 1.3 SQLite Database

**Règle Générale:** `snake_case` pour tables et colonnes (convention SQL standard)

```sql
-- ✅ CORRECT
CREATE TABLE video_projects (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE transcript_words (
  word_index INTEGER NOT NULL,
  start_time REAL NOT NULL
);

-- ❌ INCORRECT
CREATE TABLE VideoProjects (
  id TEXT PRIMARY KEY,
  filePath TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);
```

**Tables:** `snake_case` pluriel
```sql
projects, transcripts, transcript_words, selections, license_cache
```

**Colonnes:** `snake_case`
```sql
file_path, created_at, start_time, word_index, license_key
```

### 1.4 Backend API (NestJS + PostgreSQL)

**Endpoints REST:** `kebab-case`
```typescript
// ✅ CORRECT
@Get('/license-status')
@Post('/activate-license')
@Get('/usage-analytics')

// ❌ INCORRECT
@Get('/licenseStatus')
@Post('/activate_license')
```

**Tables PostgreSQL:** `snake_case` (cohérence avec SQLite)
```sql
users, licenses, subscriptions, usage_analytics
```

**Colonnes PostgreSQL:** `snake_case`
```sql
stripe_customer_id, current_period_end, created_at
```

### 1.5 Tauri Commands

**Règle:** `snake_case` côté Rust, mapping automatique `camelCase` côté TypeScript

```rust
// Rust: src-tauri/src/infrastructure/tauri_commands/video_commands.rs
#[tauri::command]
pub async fn import_video(file_path: String) -> Result<VideoProject, String> { }

#[tauri::command]
pub async fn get_video_info(project_id: String) -> Result<VideoProject, String> { }
```

```typescript
// TypeScript: apps/desktop/src/services/video-service.ts
// Tauri convertit automatiquement snake_case → camelCase
await invoke('import_video', { filePath });
await invoke('get_video_info', { projectId });
```

**Convention Paramètres:** Matching automatique
- Rust `file_path: String` ↔ TypeScript `{ filePath: string }`
- Rust `project_id: String` ↔ TypeScript `{ projectId: string }`

### 1.6 Fichiers & Dossiers

**Composants React:** `PascalCase.tsx`
```
TranscriptEditor.tsx
VideoPlayer.tsx
Timeline.tsx
DurationCounter.tsx
```

**Hooks/Services/Utils:** `kebab-case.ts`
```
use-transcript-sync.ts
video-service.ts
timecode-utils.ts
```

**Modules Rust:** `snake_case.rs`
```
video_commands.rs
transcript_repository.rs
ffmpeg_adapter.rs
```

**Dossiers:** `kebab-case`
```
transcript-editor/
video-player/
tauri-commands/
```

### 1.7 Variables d'Environnement

**Règle:** `SCREAMING_SNAKE_CASE`

```bash
# .env
VITE_API_BASE_URL=https://api.splice.app
VITE_STRIPE_PUBLIC_KEY=pk_test_...
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_test_...
```

---

## 2. Structure Patterns (Organisation du Code)

**Objectif:** Organisation prévisible pour navigation facile agents AI et développeurs.

### 2.1 Tests Rust

**Règle:** Tests unitaires dans même fichier, tests intégration dans `/tests`

```
src-tauri/
├── src/
│   ├── domain/
│   │   └── value_objects/
│   │       └── timecode.rs          # Tests unitaires inline
│   └── application/
│       └── use_cases/
│           └── import_video.rs      # Tests unitaires inline
└── tests/
    ├── integration/
    │   ├── transcription_flow.rs    # Tests intégration
    │   └── export_flow.rs
    └── fixtures/
        └── sample_video.mp4
```

**Tests Unitaires Inline:**
```rust
// src/domain/value_objects/timecode.rs
pub struct Timecode { }

impl Timecode {
    pub fn from_seconds(seconds: f64) -> Self { }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_from_seconds() {
        let tc = Timecode::from_seconds(125.5);
        assert_eq!(tc.to_string(), "00:02:05.500");
    }
}
```

**Tests Intégration Séparés:**
```rust
// tests/integration/transcription_flow.rs
use splice::application::use_cases::transcribe_video::TranscribeVideoUseCase;

#[tokio::test]
async fn test_full_transcription() {
    // Setup, execute, assert
}
```

### 2.2 Tests TypeScript

**Règle:** Tests côte à côte avec extension `.test.tsx` ou `.test.ts`

```
apps/desktop/src/
├── components/
│   ├── transcript-editor/
│   │   ├── TranscriptEditor.tsx
│   │   ├── TranscriptEditor.test.tsx     # ✅ Côte à côte
│   │   └── index.ts
│   └── video-player/
│       ├── VideoPlayer.tsx
│       └── VideoPlayer.test.tsx
├── stores/
│   ├── video-store.ts
│   └── video-store.test.ts
└── utils/
    ├── timecode-utils.ts
    └── timecode-utils.test.ts
```

**Pourquoi côte à côte (vs `__tests__/`):**
- Facilite découverte fichier test (même dossier)
- Import paths courts
- Refactoring plus simple (déplacer composant = déplacer test avec)

### 2.3 Organisation Composants React

**Règle:** Par feature (vs par type), avec barrel exports

```
apps/desktop/src/components/
├── transcript-editor/              # Feature: Édition transcript
│   ├── TranscriptEditor.tsx       # Composant principal
│   ├── WordHighlight.tsx          # Sous-composant
│   ├── TranscriptToolbar.tsx
│   ├── TranscriptEditor.test.tsx
│   ├── styles.css                 # Styles spécifiques (si nécessaire)
│   └── index.ts                   # Barrel export
├── timeline/                       # Feature: Timeline NLE
│   ├── Timeline.tsx
│   ├── TimelineSegment.tsx
│   ├── PlayheadIndicator.tsx
│   ├── Timeline.test.tsx
│   └── index.ts
├── video-player/                   # Feature: Lecteur vidéo
│   ├── VideoPlayer.tsx
│   ├── VideoControls.tsx
│   ├── VideoPlayer.test.tsx
│   └── index.ts
└── ui/                             # Composants shadcn/ui génériques
    ├── button.tsx
    ├── dialog.tsx
    └── progress.tsx
```

**Barrel Export (index.ts):**
```typescript
// components/transcript-editor/index.ts
export { TranscriptEditor } from './TranscriptEditor';
export type { TranscriptEditorProps } from './TranscriptEditor';

// Import depuis autre fichier:
import { TranscriptEditor } from '@/components/transcript-editor';
```

### 2.4 Organisation Modules Rust (Clean Architecture)

**Règle:** Structure par layers puis par domaine

```
src-tauri/src/
├── main.rs
├── domain/                         # LAYER 1: Domain
│   ├── mod.rs
│   ├── entities/
│   │   ├── mod.rs
│   │   ├── video.rs               # VideoProject entity
│   │   ├── transcript.rs          # Transcript + TranscriptWord
│   │   └── selection.rs           # Selection entity
│   ├── value_objects/
│   │   ├── mod.rs
│   │   ├── timecode.rs            # Timecode value object
│   │   └── duration.rs
│   ├── repositories/               # Traits only (interfaces)
│   │   ├── mod.rs
│   │   ├── video_repository.rs
│   │   └── transcript_repository.rs
│   └── errors/
│       ├── mod.rs
│       └── domain_error.rs
├── application/                    # LAYER 2: Application (Use Cases)
│   ├── mod.rs
│   ├── use_cases/
│   │   ├── mod.rs
│   │   ├── import_video.rs        # ImportVideoUseCase
│   │   ├── transcribe_video.rs
│   │   ├── generate_cuts.rs
│   │   └── export_video.rs
│   └── ports/                      # Interfaces abstraites
│       ├── mod.rs
│       └── video_processor.rs
└── infrastructure/                 # LAYER 3: Infrastructure
    ├── mod.rs
    ├── adapters/
    │   ├── mod.rs
    │   ├── ffmpeg_adapter.rs      # FFmpeg implementation
    │   ├── parakeet_adapter.rs    # Parakeet ML
    │   └── sqlite_repository.rs   # Repository implémentation
    ├── tauri_commands/             # Tauri IPC exposure
    │   ├── mod.rs
    │   ├── video_commands.rs
    │   ├── transcript_commands.rs
    │   └── export_commands.rs
    └── config/
        ├── mod.rs
        └── app_config.rs
```

**Dependency Flow:**
- `domain/` → Imports: RIEN (zéro dépendances externes)
- `application/` → Imports: `domain/*`
- `infrastructure/` → Imports: `domain/*`, `application/*`, external crates

### 2.5 Organisation Stores Zustand

**Règle:** Un store par domaine, dans `stores/`, avec types inline

```
apps/desktop/src/stores/
├── video-store.ts          # Gestion projets vidéo
├── transcript-store.ts     # Gestion transcripts + sélections
├── timeline-store.ts       # État timeline (playback, temps)
├── export-store.ts         # État export + progress
└── license-store.ts        # État licence
```

**Structure Interne Store:**
```typescript
// stores/video-store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { VideoProject } from '@splice/types/generated';

// Types définis inline (proche du store)
interface VideoStore {
  // State
  currentProject: VideoProject | null;
  isImporting: boolean;
  importProgress: number;
  error: string | null;

  // Actions
  importVideo: (filePath: string) => Promise<void>;
  clearProject: () => void;
  setError: (error: string | null) => void;
}

export const useVideoStore = create<VideoStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentProject: null,
      isImporting: false,
      importProgress: 0,
      error: null,

      // Actions
      importVideo: async (filePath) => {
        set({ isImporting: true, importProgress: 0, error: null });
        try {
          const project = await invoke<VideoProject>('import_video', { filePath });
          set({ currentProject: project, isImporting: false, importProgress: 100 });
        } catch (e) {
          set({ error: String(e), isImporting: false });
        }
      },

      clearProject: () => set({ currentProject: null }),

      setError: (error) => set({ error }),
    }),
    { name: 'VideoStore' }
  )
);
```

### 2.6 Organisation Packages Monorepo

**Règle:** Packages shared organisés par responsabilité

```
packages/
├── ui/                             # Composants React custom
│   ├── src/
│   │   ├── transcript-editor.tsx  # Composants complexes
│   │   ├── timeline.tsx
│   │   ├── video-player.tsx
│   │   └── index.ts               # Barrel export
│   ├── package.json
│   └── tsconfig.json
├── types/                          # Types TypeScript
│   ├── src/
│   │   ├── generated/             # Types générés par ts-rs
│   │   │   ├── VideoProject.ts
│   │   │   └── TranscriptWord.ts
│   │   ├── stores.ts              # Types stores Zustand
│   │   ├── api.ts                 # Types API backend
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── validation/                     # Schémas Zod
│   ├── src/
│   │   ├── video-schema.ts
│   │   ├── selection-schema.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
└── utils/                          # Utilitaires partagés
    ├── src/
    │   ├── timecode.ts            # Conversion timecode
    │   ├── duration.ts            # Formatage durée
    │   ├── file-size.ts           # Formatage taille fichier
    │   └── index.ts
    ├── package.json
    └── tsconfig.json
```

**Imports Cross-Packages:**
```typescript
// apps/desktop/src/components/TranscriptEditor.tsx
import { TranscriptEditor } from '@splice/ui';
import type { TranscriptWord } from '@splice/types/generated';
import { validateSelection } from '@splice/validation';
import { formatTimecode } from '@splice/utils';
```

---

## 3. Format Patterns (Formats de Données)

**Objectif:** Structures de données cohérentes pour APIs, erreurs, dates, progress.

### 3.1 Réponses Tauri Commands

**Règle:** `Result<T, String>` côté Rust, conversion auto TypeScript

```rust
// Rust: Toujours retourner Result
#[tauri::command]
pub async fn import_video(file_path: String) -> Result<VideoProject, String> {
    match video_service.import(&file_path).await {
        Ok(project) => Ok(project),
        Err(e) => Err(e.to_string()) // Error → String pour sérialisation
    }
}
```

```typescript
// TypeScript: Gérer avec try-catch
try {
  const project = await invoke<VideoProject>('import_video', { filePath });
  // Succès
} catch (error) {
  // error est le String retourné par Rust
  console.error('Import failed:', error);
}
```

**Pourquoi `Result<T, String>` vs custom error types:**
- Sérialisation JSON simple (String toujours sérialisable)
- Évite complexité structurer erreurs multi-langues
- Frontend gère affichage messages i18n

### 3.2 Erreurs Structurées (Backend API)

**Règle:** Format cohérent pour API REST

```typescript
// Backend API Response (NestJS)
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;           // Error code machine-readable
    message: string;        // Human-readable message
    details?: unknown;      // Optional debug info
  };
}

// Exemple succès:
{
  "success": true,
  "data": {
    "license_key": "abc-123",
    "plan": "pro",
    "expires_at": "2026-12-31T23:59:59Z"
  }
}

// Exemple erreur:
{
  "success": false,
  "error": {
    "code": "LICENSE_EXPIRED",
    "message": "Your license has expired",
    "details": {
      "expired_at": "2026-01-15T00:00:00Z"
    }
  }
}
```

**Codes Erreur Standardisés:**
```typescript
// Types d'erreurs API
type ApiErrorCode =
  | 'LICENSE_EXPIRED'
  | 'LICENSE_INVALID'
  | 'LICENSE_NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'VALIDATION_ERROR';
```

### 3.3 Dates & Timestamps

**Règle:** ISO 8601 strings pour transport, timestamps Unix pour storage SQLite

**Storage SQLite:** Integer Unix timestamps (secondes)
```sql
CREATE TABLE projects (
  created_at INTEGER NOT NULL,  -- Unix timestamp (seconds)
  updated_at INTEGER NOT NULL
);
```

**Storage PostgreSQL:** `TIMESTAMPTZ` (timezone-aware)
```sql
CREATE TABLE licenses (
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
```

**Transport API (JSON):** ISO 8601 strings
```json
{
  "created_at": "2026-01-29T15:30:00Z",
  "expires_at": "2026-12-31T23:59:59Z"
}
```

**TypeScript Handling:**
```typescript
// Conversion Unix timestamp → Date object
const createdAt = new Date(project.created_at * 1000); // SQLite retourne secondes

// Conversion ISO string → Date object
const expiresAt = new Date(license.expires_at); // API retourne ISO string

// Affichage formaté
import { formatDistanceToNow } from 'date-fns';
const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });
```

**Rust Handling:**
```rust
use chrono::{DateTime, Utc};

// Storage → Unix timestamp
let created_at: i64 = Utc::now().timestamp();

// Parsing ISO string (API)
let expires_at = DateTime::parse_from_rfc3339("2026-12-31T23:59:59Z")?;
```

### 3.4 Progress Updates

**Règle:** Format uniforme pour toutes opérations async (transcription, export, etc.)

```typescript
// Type Progress standard
interface ProgressUpdate {
  current: number;      // Valeur actuelle
  total: number;        // Valeur totale
  percent: number;      // Pourcentage 0-100
  message?: string;     // Message optionnel
  eta?: number;         // ETA secondes (optionnel)
}

// Exemple transcription:
{
  "current": 45,
  "total": 120,
  "percent": 37.5,
  "message": "Transcribing audio...",
  "eta": 3
}

// Exemple export:
{
  "current": 30,
  "total": 60,
  "percent": 50.0,
  "message": "Encoding video...",
  "eta": 15
}
```

**Tauri Events Progress:**
```rust
// Rust: Émettre event progress
#[tauri::command]
pub async fn export_video(
    app: tauri::AppHandle,
    project_id: String
) -> Result<String, String> {
    // Pendant export, émettre progress events
    app.emit_all("export-progress", ProgressUpdate {
        current: 30,
        total: 60,
        percent: 50.0,
        message: Some("Encoding video...".to_string()),
        eta: Some(15),
    })?;

    Ok(output_path)
}
```

```typescript
// TypeScript: Écouter progress events
import { listen } from '@tauri-apps/api/event';

const unlisten = await listen<ProgressUpdate>('export-progress', (event) => {
  const { current, total, percent, message } = event.payload;
  updateProgressBar(percent);
  setStatusMessage(message);
});
```

### 3.5 Timecode Format

**Règle:** `HH:MM:SS.mmm` format uniforme partout

```typescript
// TypeScript utility
export function formatTimecode(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

// Exemples:
formatTimecode(0)       // "00:00:00.000"
formatTimecode(65.5)    // "00:01:05.500"
formatTimecode(3725.123) // "01:02:05.123"
```

```rust
// Rust value object
pub struct Timecode {
    seconds: f64,
}

impl Timecode {
    pub fn to_string(&self) -> String {
        let hours = (self.seconds / 3600.0).floor() as u32;
        let minutes = ((self.seconds % 3600.0) / 60.0).floor() as u32;
        let secs = (self.seconds % 60.0).floor() as u32;
        let ms = ((self.seconds % 1.0) * 1000.0).floor() as u32;

        format!("{:02}:{:02}:{:02}.{:03}", hours, minutes, secs, ms)
    }
}
```

---

## 4. Communication Patterns (IPC, Events, State)

**Objectif:** Cohérence communication Frontend ↔ Rust, synchronisation state.

### 4.1 Naming Tauri Events

**Règle:** `domain:action` format kebab-case

```rust
// Rust: Émettre events
app.emit_all("transcript:updated", transcript)?;
app.emit_all("export:progress", progress)?;
app.emit_all("license:expired", license_info)?;
app.emit_all("video:imported", project)?;
```

```typescript
// TypeScript: Écouter events (même naming)
await listen('transcript:updated', handler);
await listen('export:progress', handler);
await listen('license:expired', handler);
await listen('video:imported', handler);
```

**Domaines Standards:**
- `video:*` - Import, métadonnées vidéo
- `transcript:*` - Transcription, mises à jour
- `export:*` - Export, progress
- `license:*` - Vérification licence
- `app:*` - Événements application globaux

**Actions Standards:**
```
:imported, :updated, :deleted, :progress, :completed, :failed, :expired
```

### 4.2 State Updates Zustand

**Règle:** Actions nommées explicitement (vs setters génériques)

```typescript
// ✅ CORRECT: Actions métier explicites
interface VideoStore {
  importVideo: (filePath: string) => Promise<void>;
  clearProject: () => void;
  updateProgress: (progress: number) => void;
}

// ❌ INCORRECT: Setters génériques
interface VideoStore {
  setState: (state: Partial<VideoStore>) => void;
  set: (fn: (state: VideoStore) => VideoStore) => void;
}
```

**Rationale:** Actions nommées documentent intent, facilitent debugging.

**Pattern Update Optimisé:**
```typescript
export const useTranscriptStore = create<TranscriptStore>((set, get) => ({
  transcript: null,
  selectedWordIndices: [],

  // ✅ Action spécifique avec logique métier
  toggleWordSelection: (wordIndex: number) => {
    const { selectedWordIndices } = get();
    const isSelected = selectedWordIndices.includes(wordIndex);

    set({
      selectedWordIndices: isSelected
        ? selectedWordIndices.filter(i => i !== wordIndex)
        : [...selectedWordIndices, wordIndex].sort((a, b) => a - b)
    });
  },

  // ✅ Bulk update avec validation
  setSelection: (startIndex: number, endIndex: number) => {
    if (startIndex > endIndex) {
      throw new Error('Invalid selection range');
    }

    const indices = Array.from(
      { length: endIndex - startIndex + 1 },
      (_, i) => startIndex + i
    );

    set({ selectedWordIndices: indices });
  },
}));
```

### 4.3 Error Propagation Rust → TypeScript

**Règle:** Result<T, E> Rust → try-catch TypeScript

```rust
// Rust: Use Cases retournent Result
pub async fn import_video(&self, file_path: &str) -> Result<VideoProject, DomainError> {
    // Validation
    if !Path::new(file_path).exists() {
        return Err(DomainError::FileNotFound(file_path.to_string()));
    }

    // Import logic
    let project = // ...

    Ok(project)
}

// Tauri command wrappe en String pour sérialisation
#[tauri::command]
pub async fn import_video(file_path: String) -> Result<VideoProject, String> {
    use_case.import_video(&file_path)
        .await
        .map_err(|e| e.to_string()) // DomainError → String
}
```

```typescript
// TypeScript: Gérer erreurs avec try-catch
async function handleImportVideo(filePath: string) {
  const { setError, importVideo } = useVideoStore.getState();

  try {
    await importVideo(filePath);
    // Succès
  } catch (error) {
    // error est le String de Rust
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Parser erreurs structurées (optionnel)
    if (errorMessage.includes('File not found')) {
      toast.error('Video file not found');
    } else if (errorMessage.includes('Unsupported format')) {
      toast.error('Video format not supported');
    } else {
      toast.error('Failed to import video');
    }

    setError(errorMessage);
  }
}
```

### 4.4 Synchronisation Cross-Store (Timeline ↔ Transcript)

**Règle:** Hooks custom pour orchestrer synchronisation

```typescript
// hooks/use-timeline-sync.ts
export function useTimelineSync() {
  const currentTime = useTimelineStore(s => s.currentTime);
  const transcript = useTranscriptStore(s => s.transcript);
  const scrollToWord = useTranscriptStore(s => s.scrollToWord);

  // Timeline change → Scroll transcript to matching word
  useEffect(() => {
    if (!transcript) return;

    const wordAtTime = transcript.words.find(
      w => w.start_time <= currentTime && w.end_time >= currentTime
    );

    if (wordAtTime) {
      scrollToWord(wordAtTime.word_index);
    }
  }, [currentTime, transcript, scrollToWord]);
}

// Utilisation dans composant principal
function App() {
  useTimelineSync(); // Active synchronisation

  return (
    <>
      <TranscriptEditor />
      <Timeline />
    </>
  );
}
```

**Pattern Bidirectionnel:**
```typescript
// hooks/use-bidirectional-sync.ts
export function useBidirectionalSync() {
  const currentTime = useTimelineStore(s => s.currentTime);
  const setCurrentTime = useTimelineStore(s => s.setCurrentTime);
  const selectedWordIndices = useTranscriptStore(s => s.selectedWordIndices);
  const transcript = useTranscriptStore(s => s.transcript);

  // Timeline → Transcript (déjà implémenté ci-dessus)

  // Transcript selection → Update timeline (highlight segments)
  useEffect(() => {
    if (!transcript || selectedWordIndices.length === 0) return;

    const firstWord = transcript.words[selectedWordIndices[0]];
    const lastWord = transcript.words[selectedWordIndices[selectedWordIndices.length - 1]];

    // Option: Seek to start of selection
    setCurrentTime(firstWord.start_time);
  }, [selectedWordIndices, transcript, setCurrentTime]);
}
```

### 4.5 Communication Desktop ↔ Backend API

**Règle:** HTTPS REST avec retry logic + grace period

```typescript
// services/license-api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface LicenseVerifyRequest {
  license_key: string;
}

interface LicenseVerifyResponse {
  success: boolean;
  data?: {
    plan: 'free' | 'pro';
    expires_at: string | null;
    grace_period_ends_at: string;
  };
  error?: { code: string; message: string };
}

// Retry logic avec exponential backoff
async function verifyLicenseWithRetry(
  licenseKey: string,
  maxRetries = 3
): Promise<LicenseVerifyResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.post<LicenseVerifyResponse>(
        `${API_BASE_URL}/api/v1/license/verify`,
        { license_key: licenseKey },
        {
          timeout: 5000, // 5s timeout
          headers: { 'Content-Type': 'application/json' }
        }
      );

      return response.data;
    } catch (error) {
      lastError = error as Error;

      // Ne pas retry sur erreurs 4xx (client errors)
      if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
        throw error;
      }

      // Exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Échec après tous les retries → Utiliser grace period
  throw new Error(`License verification failed after ${maxRetries} attempts: ${lastError?.message}`);
}

// Grace period fallback
export async function verifyLicense(licenseKey: string): Promise<boolean> {
  try {
    const response = await verifyLicenseWithRetry(licenseKey);

    if (response.success && response.data) {
      // Mettre à jour cache local
      await invoke('update_license_cache', {
        licenseKey,
        plan: response.data.plan,
        expiresAt: response.data.expires_at,
      });
      return true;
    }

    return false;
  } catch (error) {
    console.warn('License verification failed, using grace period:', error);

    // Vérifier grace period local
    const gracePeriodValid = await invoke<boolean>('check_grace_period');
    return gracePeriodValid;
  }
}
```

---

## 5. Process Patterns (Gestion Async, Erreurs, Loading)

**Objectif:** Patterns cohérents pour opérations asynchrones, états loading, error handling.

### 5.1 Loading States

**Règle:** Pattern uniforme `isLoading` + `error` pour toutes opérations async

```typescript
// ✅ CORRECT: Pattern standard
interface VideoStore {
  // Data
  currentProject: VideoProject | null;

  // Loading state
  isImporting: boolean;
  importProgress: number;

  // Error state
  error: string | null;

  // Actions
  importVideo: (filePath: string) => Promise<void>;
}

export const useVideoStore = create<VideoStore>((set) => ({
  currentProject: null,
  isImporting: false,
  importProgress: 0,
  error: null,

  importVideo: async (filePath) => {
    // 1. Start loading
    set({ isImporting: true, importProgress: 0, error: null });

    try {
      // 2. Execute operation
      const project = await invoke<VideoProject>('import_video', { filePath });

      // 3. Success
      set({
        currentProject: project,
        isImporting: false,
        importProgress: 100,
      });
    } catch (e) {
      // 4. Error
      set({
        error: String(e),
        isImporting: false,
      });
    }
  },
}));
```

**Naming Convention Loading States:**
- Single operation: `isLoading`
- Specific operation: `isImporting`, `isExporting`, `isTranscribing`
- Progress disponible: `progress` (0-100)

**UI Usage:**
```typescript
function ImportButton() {
  const { isImporting, importProgress, error, importVideo } = useVideoStore();

  return (
    <div>
      <Button
        onClick={() => importVideo(selectedFile)}
        disabled={isImporting}
      >
        {isImporting ? `Importing... ${importProgress}%` : 'Import Video'}
      </Button>

      {error && <Alert variant="destructive">{error}</Alert>}
    </div>
  );
}
```

### 5.2 Error Handling Frontend

**Règle:** Error Boundaries React + try-catch async + toast notifications

**1. Error Boundary Global:**
```typescript
// components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // TODO Phase 2: Send to Sentry
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <Button onClick={() => window.location.reload()}>
            Reload App
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage in App.tsx
function App() {
  return (
    <ErrorBoundary>
      <Router>
        {/* app content */}
      </Router>
    </ErrorBoundary>
  );
}
```

**2. Try-Catch Async Operations:**
```typescript
// Toujours wrapper appels Tauri avec try-catch
async function handleExport() {
  try {
    const outputPath = await invoke<string>('export_video', {
      projectId: currentProject.id
    });

    toast.success(`Video exported to ${outputPath}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    toast.error(`Export failed: ${message}`);
    console.error('Export error:', error);
  }
}
```

**3. Toast Notifications (shadcn/ui):**
```typescript
import { toast } from 'sonner'; // ou autre toast library

// Success
toast.success('Video imported successfully');

// Error
toast.error('Failed to import video');

// Loading (progress)
toast.loading('Transcribing video...', { id: 'transcribe' });
// Update later:
toast.success('Transcription complete', { id: 'transcribe' });
```

### 5.3 Error Handling Rust

**Règle:** Result<T, E> partout, Domain errors custom, map to String pour Tauri

**1. Domain Errors:**
```rust
// domain/errors/domain_error.rs
use thiserror::Error;

#[derive(Debug, Error)]
pub enum DomainError {
    #[error("File not found: {0}")]
    FileNotFound(String),

    #[error("Unsupported video format: {0}")]
    UnsupportedFormat(String),

    #[error("Video too large: {size_gb}GB (max {max_gb}GB)")]
    VideoTooLarge { size_gb: f64, max_gb: f64 },

    #[error("Transcription failed: {0}")]
    TranscriptionFailed(String),

    #[error("Export failed: {0}")]
    ExportFailed(String),

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("License error: {0}")]
    LicenseError(String),
}
```

**2. Use Case Error Handling:**
```rust
// application/use_cases/import_video.rs
use crate::domain::errors::DomainError;

pub struct ImportVideoUseCase {
    video_repository: Arc<dyn VideoRepository>,
}

impl ImportVideoUseCase {
    pub async fn execute(&self, file_path: &str) -> Result<VideoProject, DomainError> {
        // Validation
        let path = Path::new(file_path);
        if !path.exists() {
            return Err(DomainError::FileNotFound(file_path.to_string()));
        }

        // Check file size
        let metadata = fs::metadata(path)
            .map_err(|e| DomainError::DatabaseError(e.to_string()))?;
        let size_gb = metadata.len() as f64 / 1_000_000_000.0;

        if size_gb > 50.0 {
            return Err(DomainError::VideoTooLarge {
                size_gb,
                max_gb: 50.0,
            });
        }

        // Check format
        let extension = path.extension()
            .and_then(|e| e.to_str())
            .ok_or_else(|| DomainError::UnsupportedFormat("No extension".to_string()))?;

        if !["mp4", "mov", "avi"].contains(&extension.to_lowercase().as_str()) {
            return Err(DomainError::UnsupportedFormat(extension.to_string()));
        }

        // Import
        let project = // ... create project

        Ok(project)
    }
}
```

**3. Tauri Command Error Mapping:**
```rust
// infrastructure/tauri_commands/video_commands.rs
#[tauri::command]
pub async fn import_video(
    file_path: String,
    state: tauri::State<'_, AppState>
) -> Result<VideoProject, String> {
    let use_case = ImportVideoUseCase::new(state.video_repository.clone());

    use_case.execute(&file_path)
        .await
        .map_err(|e| e.to_string()) // DomainError → String pour JSON
}
```

### 5.4 Async Operations Pattern

**Règle:** async/await partout, éviter callbacks

```typescript
// ✅ CORRECT: async/await
async function handleImportAndTranscribe(filePath: string) {
  const { importVideo } = useVideoStore.getState();
  const { transcribeVideo } = useTranscriptStore.getState();

  // Sequential operations
  const project = await importVideo(filePath);
  const transcript = await transcribeVideo(project.id);

  toast.success('Ready to edit!');
}

// ❌ INCORRECT: Callbacks
function handleImportAndTranscribe(filePath: string, callback: () => void) {
  importVideo(filePath, (project) => {
    transcribeVideo(project.id, (transcript) => {
      callback();
    });
  });
}
```

**Pattern Progress Streaming (Long Operations):**
```rust
// Rust: Émettre progress pendant opération
#[tauri::command]
pub async fn transcribe_video(
    app: tauri::AppHandle,
    project_id: String
) -> Result<Transcript, String> {
    let total_duration = // get video duration

    // Start transcription
    for chunk_progress in transcription_chunks {
        // Émettre progress périodiquement
        app.emit_all("transcript:progress", ProgressUpdate {
            current: chunk_progress.processed_seconds as i32,
            total: total_duration as i32,
            percent: (chunk_progress.processed_seconds / total_duration * 100.0) as i32,
            message: Some("Transcribing...".to_string()),
            eta: None,
        })?;
    }

    Ok(final_transcript)
}
```

```typescript
// TypeScript: Listen progress + update UI
async function handleTranscribe(projectId: string) {
  const { setProgress, setTranscript } = useTranscriptStore.getState();

  // Setup progress listener
  const unlisten = await listen<ProgressUpdate>('transcript:progress', (event) => {
    setProgress(event.payload.percent);
  });

  try {
    // Start async operation
    const transcript = await invoke<Transcript>('transcribe_video', { projectId });
    setTranscript(transcript);
    toast.success('Transcription complete!');
  } catch (error) {
    toast.error(`Transcription failed: ${error}`);
  } finally {
    // Cleanup listener
    unlisten();
    setProgress(0);
  }
}
```

### 5.5 File Operations Pattern

**Règle:** Streaming pour gros fichiers, validation upfront

```rust
// ✅ CORRECT: Streaming read (évite OOM sur fichiers 50GB)
use tokio::fs::File;
use tokio::io::{AsyncReadExt, BufReader};

pub async fn process_large_video(file_path: &Path) -> Result<(), DomainError> {
    let file = File::open(file_path).await
        .map_err(|e| DomainError::FileNotFound(e.to_string()))?;

    let mut reader = BufReader::new(file);
    let mut buffer = vec![0u8; 8192]; // 8KB chunks

    loop {
        let n = reader.read(&mut buffer).await
            .map_err(|e| DomainError::DatabaseError(e.to_string()))?;

        if n == 0 { break; } // EOF

        // Process chunk
        process_chunk(&buffer[..n])?;
    }

    Ok(())
}

// ❌ INCORRECT: Read entire file in memory
pub async fn process_large_video_bad(file_path: &Path) -> Result<(), DomainError> {
    let contents = fs::read(file_path).await?; // 50GB en RAM!
    process_all(&contents)?;
    Ok(())
}
```

**FFmpeg Streaming:**
```rust
// Utiliser FFmpeg pour streaming processing (pas de chargement complet)
pub async fn extract_audio_stream(video_path: &Path, output_path: &Path) -> Result<(), DomainError> {
    let output = Command::new("ffmpeg")
        .args([
            "-i", video_path.to_str().unwrap(),
            "-vn",                    // No video
            "-acodec", "pcm_s16le",   // PCM audio
            "-ar", "16000",           // 16kHz sample rate
            "-ac", "1",               // Mono
            "-f", "wav",              // WAV format
            output_path.to_str().unwrap(),
        ])
        .output()
        .await
        .map_err(|e| DomainError::ExportFailed(e.to_string()))?;

    if !output.status.success() {
        return Err(DomainError::ExportFailed(
            String::from_utf8_lossy(&output.stderr).to_string()
        ));
    }

    Ok(())
}
```

---
