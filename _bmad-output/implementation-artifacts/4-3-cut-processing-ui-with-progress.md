# Story 4.3: Cut Processing UI with Progress

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to see real-time progress while cuts are being generated,
So that I know the process is working and how long it will take.

## Acceptance Criteria

1. **Given** l'utilisateur clique sur le bouton "Générer les cuts" (FR22)
   **When** le traitement démarre
   **Then** un modal de progression s'affiche avec :
   - Titre : "Génération des cuts vidéo..."
   - Barre de progression affichant le pourcentage (0-100%)
   - Segment en cours : "Traitement du segment 5/23"
   - Temps restant estimé

2. **And** la progression se met à jour en temps réel (NFR6) via les événements Tauri `segmentation:progress`

3. **And** l'UI reste responsive (traitement en arrière-plan via les commandes Tauri existantes)

4. **And** l'utilisateur peut annuler l'opération en cours de traitement via un bouton "Annuler"

5. **And** en cas d'annulation, les fichiers temporaires sont nettoyés (backend déjà implémenté Story 4.2)

6. **And** à la complétion, un toast de succès s'affiche : "Cuts générés avec succès! {N} segments prêts."

7. **And** après la complétion, l'application transite automatiquement vers le mode preview (Epic 5 — pour le MVP, rester sur l'éditeur avec un message de succès)

8. **And** en cas d'erreur, un toast d'erreur s'affiche avec le message d'erreur du backend

## Tasks / Subtasks

- [x] Task 1: Créer le store `useSegmentationStore` (AC: #1, #2, #3, #4)
  - [x] Créer `apps/desktop/src/stores/segmentation-store.ts`
  - [x] State : `isSegmenting`, `segmentationProgress` (current_segment, total_segments, progress%), `error`
  - [x] Actions : `startSegmentation(projectId)`, `cancelSegmentation(projectId)`, `resetSegmentation()`
  - [x] `startSegmentation` invoque `invoke('segment_video', { projectId })` (commande Tauri existante Story 4.2)
  - [x] `cancelSegmentation` invoque `invoke('cancel_segmentation', { projectId })` (commande Tauri existante Story 4.2)
  - [x] Pattern : `create<T>()` avec `devtools()` middleware (cohérent avec video-store, transcript-store)

- [x] Task 2: Créer le composant `SegmentationProgressDialog` (AC: #1, #2, #4)
  - [x] Créer `apps/desktop/src/components/segmentation/SegmentationProgressDialog.tsx`
  - [x] Utiliser `AlertDialog` de shadcn/ui (pattern identique à `TranscriptionProgressDialog`)
  - [x] Afficher : titre "Génération des cuts vidéo...", barre de progression (composant `Progress`), segment en cours "Traitement du segment X/Y", estimation temps restant
  - [x] Bouton "Annuler" qui appelle `cancelSegmentation(projectId)`
  - [x] Historique de progression pour calcul ETA (pattern existant dans `TranscriptionProgressDialog` avec last 10 samples)
  - [x] Pour vidéos avec beaucoup de segments (>10) : afficher barre de progression ; sinon : spinner

- [x] Task 3: Intégrer les event listeners Tauri dans App.tsx (AC: #2, #6, #8)
  - [x] Ajouter `listen<SegmentationProgress>('segmentation:progress', ...)` dans le `useEffect` existant d'App.tsx
  - [x] Ajouter `listen('segmentation:completed', ...)` — afficher toast succès via `toast.success()`
  - [x] Ajouter `listen('segmentation:error', ...)` — afficher toast erreur via `toast.error()`
  - [x] Cleanup des listeners dans le return du useEffect
  - [x] Mettre à jour le store `useSegmentationStore` à chaque événement de progression

- [x] Task 4: Connecter le bouton "Générer les cuts" dans TopBar (AC: #1, #3)
  - [x] Remplacer le placeholder `onGenerateCuts={() => { /* TODO */ }}` dans App.tsx
  - [x] Implémenter la logique : appeler `useSegmentationStore.startSegmentation(projectId)`
  - [x] Le bouton est déjà conditionné à `hasSelections` (désactivé si aucune sélection)
  - [x] Désactiver le bouton pendant `isSegmenting` pour éviter double-clic
  - [x] Ouvrir le `SegmentationProgressDialog` quand `isSegmenting` passe à true

- [x] Task 5: Tests unitaires TypeScript (AC: #1, #2, #4, #6, #8)
  - [x] Test store : `startSegmentation` met `isSegmenting` à true
  - [x] Test store : `cancelSegmentation` reset l'état
  - [x] Test store : `resetSegmentation` nettoie tout
  - [x] Test composant : `SegmentationProgressDialog` affiche le segment en cours
  - [x] Test composant : `SegmentationProgressDialog` affiche la barre de progression
  - [x] Test composant : bouton Annuler appelle `cancelSegmentation`
  - [x] Test composant : toast succès affiché après complétion
  - [x] Pattern : tests côte à côte `.test.ts` / `.test.tsx` (cohérent avec le projet)

## Dev Notes

### Ce qui existe déjà (backend Story 4.2 — TOUT est prêt)

**Commandes Tauri disponibles :**
- `segment_video(projectId)` — lance la segmentation FFmpeg, retourne `Result<Vec<String>, String>`
- `cancel_segmentation(projectId)` — active le cancel_flag AtomicBool
- `cleanup_segments(projectId)` — supprime les fichiers temp

**Événements Tauri émis par le backend :**
- `segmentation:progress` — payload : `{ project_id: string, current_segment: number, total_segments: number, progress: number }`
- `segmentation:completed` — émis quand tous les segments sont traités
- `segmentation:error` — émis en cas d'erreur FFmpeg

**Type TS existant :**
- `SegmentationProgress` dans `packages/types/src/generated/SegmentationProgress.ts` — déjà exporté depuis `index.ts`

**Cancel flags :**
- `segmentation_cancel_flags` dans `AppState` — `Arc<Mutex<HashMap<String, Arc<AtomicBool>>>>`
- Le cleanup du flag se fait automatiquement après `spawn_blocking` (success ou failure)

### Pattern UI à suivre EXACTEMENT

**`TranscriptionProgressDialog.tsx`** est le modèle de référence :
- `AlertDialog` avec `AlertDialogContent` (pas de `AlertDialogClose` — pas de X pour fermer)
- Barre de progression avec `Progress` de shadcn/ui
- Calcul ETA basé sur historique des 10 derniers samples de progression
- Condition adaptative : barre de progression vs spinner selon la durée estimée
- `AlertDialogAction` pour le bouton Annuler (style destructive)

**Pattern Event Listener** (dans `App.tsx` lignes 136-204) :
```typescript
const unlistenProgress = await listen<SegmentationProgress>(
  'segmentation:progress',
  (event) => {
    const { payload } = event;
    useSegmentationStore.getState().updateProgress(payload);
  }
);

// Cleanup
return () => {
  if (unlistenProgress) unlistenProgress();
};
```

**Pattern Toast** (dans `App.tsx` et `video-store.ts`) :
```typescript
// Succès
toast.success('Cuts générés avec succès!', {
  description: `${totalSegments} segments prêts`,
  duration: 5000,
});

// Erreur
toast.error('Erreur lors de la génération des cuts', {
  description: errorMessage,
});
```

**Pattern Store Zustand** (dans `video-store.ts`, `transcript-store.ts`) :
```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';

interface SegmentationStore {
  isSegmenting: boolean;
  segmentationProgress: SegmentationProgress | null;
  error: string | null;

  startSegmentation: (projectId: string) => Promise<void>;
  cancelSegmentation: (projectId: string) => Promise<void>;
  updateProgress: (progress: SegmentationProgress) => void;
  resetSegmentation: () => void;
}
```

### Conventions de code

**TypeScript/React :**
- `camelCase` pour variables/fonctions, `PascalCase` pour composants et types
- Fichiers composants : `PascalCase.tsx` (ex: `SegmentationProgressDialog.tsx`)
- Fichiers stores : `kebab-case.ts` (ex: `segmentation-store.ts`)
- Tests : côte à côte `.test.ts` / `.test.tsx`
- Imports types : `import type { SegmentationProgress } from '@splice/types/generated'`
- Invoke Tauri : `invoke('snake_case_command', { camelCaseParams })`

**Événements Tauri :**
- Format : `domain:action` (ex: `segmentation:progress`, `segmentation:completed`)
- Import : `import { listen } from '@tauri-apps/api/event'`
- Cleanup obligatoire dans le return du useEffect

**UI shadcn/ui :**
- `AlertDialog` pour les modaux bloquants
- `Progress` pour les barres de progression
- `Button` avec variantes : `default`, `destructive`, `outline`
- `toast` de `sonner` pour les notifications

### Apprentissages des Stories précédentes

**Story 4.2 (FFmpeg Video Segmentation) :**
- Les événements `segmentation:progress` émettent `current_segment` et `total_segments` (pas un pourcentage global)
- Le pourcentage se calcule côté frontend : `(current_segment / total_segments) * 100`
- L'annulation est inter-segment (pas mid-segment) — le cancel_flag est vérifié entre chaque segment
- Les fichiers segments sont dans `~/.splice/temp/{project_id}/`
- Le backend retourne `Vec<String>` avec les chemins des segments créés

**Story 4.0 (Video Proxy Generation) :**
- Le pattern `isGeneratingProxy` dans `video-store.ts` montre comment tracker un état binaire de processing
- `initProxyListener()` dans le store montre comment écouter les événements depuis un store Zustand
- Proxy events : `proxy:completed` avec `{ project_id, proxy_path }` — même pattern pour segmentation

**TranscriptionProgressDialog.tsx :**
- Calcul ETA : historique des 10 derniers `{ timestamp, progress }` samples
- `const eta = remainingProgress / averageSpeed` (en secondes)
- Affichage adaptatif : si >10 segments → barre de progression, sinon → spinner (l'opération est trop rapide pour un barre)

**Code Review 4.2 :**
- CRITICAL : `-to` remplacé par `-t` dans FFmpeg (bug corrigé)
- Tauri command utilise maintenant `VideoSegmenter::segment_video()` au lieu de dupliquer la logique
- Events `segmentation:completed` et `segmentation:error` ajoutés (pas seulement progress)

### Git Intelligence

Derniers commits pertinents :
- `2aa0fd1` feat: add cut generation backend logic (Story 4.1)
- `43ed1c5` feat: add video proxy generation with code review fixes (Story 4.0)
- `36b4f22` feat: add video player panel, timeline sync, selection stats, and editor layout
- Pattern commits : `feat:` / `fix:` / `chore:` prefixes

### Structure des fichiers existants (contexte layout)

```
apps/desktop/src/
├── App.tsx                           # Orchestration principale, event listeners
├── components/
│   ├── layout/
│   │   └── TopBar.tsx                # Bouton "Générer les cuts" (déjà wired)
│   ├── transcription/
│   │   ├── TranscriptionProgressDialog.tsx  # MODÈLE DE RÉFÉRENCE pour le dialog
│   │   ├── TranscriptionScreen.tsx
│   │   └── TranscriptionErrorDialog.tsx
│   ├── segmentation/                 # ← NOUVEAU DOSSIER À CRÉER
│   │   └── SegmentationProgressDialog.tsx
│   ├── timeline/
│   │   └── TimelineBar.tsx
│   ├── video/
│   │   └── VideoPlayer.tsx
│   └── ui/
│       ├── alert-dialog.tsx          # Primitive AlertDialog (Radix)
│       ├── progress.tsx              # Barre de progression
│       ├── button.tsx
│       └── sonner.tsx                # Toast (sonner)
├── stores/
│   ├── video-store.ts                # Pattern référence (proxy listener)
│   ├── transcript-store.ts           # Pattern référence (progress tracking)
│   ├── timeline-store.ts
│   ├── segmentation-store.ts         # ← NOUVEAU FICHIER À CRÉER
│   └── license-store.ts
└── hooks/
    └── use-model-download.ts         # Pattern référence (event listeners)
```

### Project Structure Notes

- `SegmentationProgressDialog.tsx` dans `components/segmentation/` — cohérent avec `components/transcription/`
- `segmentation-store.ts` dans `stores/` — cohérent avec `video-store.ts`, `transcript-store.ts`
- Store séparé (pas dans transcript-store) car la segmentation est un domaine distinct
- Event listeners dans `App.tsx` centralisés — cohérent avec transcription/proxy listeners

### Fichiers à créer

- `apps/desktop/src/stores/segmentation-store.ts`
- `apps/desktop/src/components/segmentation/SegmentationProgressDialog.tsx`
- `apps/desktop/src/stores/segmentation-store.test.ts`
- `apps/desktop/src/components/segmentation/SegmentationProgressDialog.test.tsx`

### Fichiers à modifier

- `apps/desktop/src/App.tsx` — ajouter event listeners segmentation, connecter onGenerateCuts, rendre SegmentationProgressDialog
- `apps/desktop/src/components/layout/TopBar.tsx` — éventuellement ajouter état `isSegmenting` pour désactiver le bouton

### Fichiers à ne PAS modifier

- Tout fichier Rust backend — tout est déjà implémenté (Story 4.2)
- `packages/types/src/generated/SegmentationProgress.ts` — déjà créé
- `apps/desktop/src/stores/transcript-store.ts` — pas impacté
- `apps/desktop/src/stores/video-store.ts` — pas impacté
- `apps/desktop/src/stores/timeline-store.ts` — pas impacté

### References

- [Epic 4: Intelligent Video Cutting](_bmad-output/planning-artifacts/epics/epic-4-intelligent-video-cutting.md) — Story 4.3 AC complets
- [PRD: FR22](_bmad-output/planning-artifacts/prd/functional-requirements.md) — Barre de progression pendant cuts
- [PRD: NFR6](_bmad-output/planning-artifacts/prd/non-functional-requirements.md) — Updates temps réel
- [UX: Journey 1 - ProgressCuts](_bmad-output/planning-artifacts/ux-design-specification/user-journey-flows.md) — "Progress: Génération Cuts, 10-30s pour 1h vidéo, %, temps estimé"
- [Architecture: Progress Updates Pattern](_bmad-output/planning-artifacts/architecture/patterns-dimplmentation-rgles-de-cohrence.md#34-progress-updates) — Format ProgressUpdate standard
- [Architecture: Tauri Events Naming](_bmad-output/planning-artifacts/architecture/patterns-dimplmentation-rgles-de-cohrence.md#41-naming-tauri-events) — `domain:action` format
- [Architecture: Loading States](_bmad-output/planning-artifacts/architecture/patterns-dimplmentation-rgles-de-cohrence.md#51-loading-states) — Pattern isLoading + error
- [Story 4.2: FFmpeg Video Segmentation](_bmad-output/implementation-artifacts/4-2-ffmpeg-video-segmentation.md) — Backend complet, events et commandes Tauri
- [Story 4.0: Video Proxy Generation](_bmad-output/implementation-artifacts/4-0-video-proxy-generation.md) — Pattern proxy listener dans store
- `apps/desktop/src/components/transcription/TranscriptionProgressDialog.tsx` — Modèle de référence UI
- `apps/desktop/src/stores/video-store.ts` — Pattern store avec event listener
- `apps/desktop/src/App.tsx` — Point d'intégration event listeners + layout

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Créé `useSegmentationStore` avec Zustand + devtools, suivant le pattern exact de video-store/transcript-store
- Créé `SegmentationProgressDialog` avec AlertDialog (shadcn/ui), barre de progression adaptative (>10 segments: barre, sinon: spinner), calcul ETA basé sur historique 10 samples
- Intégré les event listeners `segmentation:progress`, `segmentation:completed`, `segmentation:error` dans App.tsx avec cleanup
- Connecté le bouton "Générer les cuts" dans TopBar — désactivé pendant segmentation, déclenche `startSegmentation(projectId)`
- Dialog s'ouvre automatiquement quand `isSegmenting` est true
- Toast succès/erreur via sonner à la complétion/erreur
- 12 tests passent (7 store + 5 composant). 7 tests pré-existants échouent (TranscriptionProgressDialog, use-model-download) — non liés à cette story.

### Change Log

- 2026-02-02: Implémentation complète de la Story 4.3 — UI de progression pour la segmentation vidéo
- 2026-02-02: Code review — 6 correctifs appliqués: test startSegmentation renforcé (vérifie isSegmenting), cancelSegmentation gère erreur invoke, segmentation:error stocke l'erreur dans le store, AlertDialog onOpenChange ajouté (Escape fonctionne), AlertDialogCancel + AlertDialogDescription ajoutés (accessibilité Radix), nouveau test cancelSegmentation échec

### File List

- apps/desktop/src/stores/segmentation-store.ts (nouveau)
- apps/desktop/src/stores/segmentation-store.test.ts (nouveau)
- apps/desktop/src/components/segmentation/SegmentationProgressDialog.tsx (nouveau)
- apps/desktop/src/components/segmentation/SegmentationProgressDialog.test.tsx (nouveau)
- apps/desktop/src/components/segmentation/index.ts (nouveau)
- apps/desktop/src/App.tsx (modifié — imports, segmentation state, event listeners, dialog render, onGenerateCuts)
- apps/desktop/src/components/layout/TopBar.tsx (modifié — ajout prop isSegmenting, désactivation bouton)
