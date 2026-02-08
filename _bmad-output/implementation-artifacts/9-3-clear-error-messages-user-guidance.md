# Story 9.3: Clear Error Messages & User Guidance

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to see clear, actionable error messages when something goes wrong,
so that I understand what happened and know how to fix it.

## Acceptance Criteria

1. **Given** une erreur survient dans l'application (FR51, FR54) **When** l'erreur est affichée à l'utilisateur **Then** le message est en français (NFR29) **And** le message est clair et actionnable, pas technique : ❌ "ENOENT: no such file or directory" → ✅ "Fichier vidéo introuvable. Il a peut-être été déplacé ou supprimé."

2. **Given** un message d'erreur est affiché **When** l'utilisateur le lit **Then** le message inclut des actions suggérées : "Vérifiez que le fichier existe toujours.", "Assurez-vous d'avoir au moins 5GB d'espace disque disponible.", "Redémarrez l'application et réessayez."

3. **Given** une erreur survient **When** l'erreur est affichée **Then** aucun stack trace technique n'est visible par l'utilisateur final (NFR30)

4. **Given** un dialog d'erreur est affiché **When** l'utilisateur le voit **Then** le dialog inclut : une icône (⚠️ warning ou ❌ error), un titre résumant le problème, une description avec détails, des actions suggérées (liste à puces), un bouton "Réessayer" si applicable, un bouton "Fermer", un bouton "Copier les détails" (pour les demandes de support)

5. **Given** une erreur survient dans l'application **When** l'erreur est traitée **Then** l'erreur est loggée dans un fichier local pour le debug (NFR21)

## Tasks / Subtasks

- [x] Task 1 — Créer le composant ErrorDialog unifié avec actions suggérées (AC: #1, #2, #4)
  - [x] 1.1 Créer `apps/desktop/src/components/error/ErrorDialog.tsx` : composant réutilisable avec props `{ isOpen, severity: 'warning' | 'error', title, description, suggestedActions: string[], onRetry?, onClose, errorDetails?: string }`
  - [x] 1.2 Design : icône AlertTriangle (warning) ou XCircle (error) dans cercle coloré, titre en gras, description, liste à puces des actions suggérées, boutons "Fermer" + optionnel "Réessayer" + "Copier les détails"
  - [x] 1.3 Bouton "Copier les détails" : copie dans le presse-papiers un bloc structuré (app version, OS, error code, timestamp, description technique) via `navigator.clipboard.writeText()` — pour les demandes de support utilisateur
  - [x] 1.4 Utiliser les composants Shadcn/ui existants : `AlertDialog`, `Button`
  - [x] 1.5 Créer `apps/desktop/src/components/error/index.ts` barrel export
  - [x] 1.6 Tests : `ErrorDialog.test.tsx` — rendu avec severity warning/error, affichage des actions suggérées, bouton copier détails fonctionne, bouton réessayer conditionnel, pas de stack trace visible

- [x] Task 2 — Créer le catalogue centralisé de messages d'erreur avec actions suggérées (AC: #1, #2, #3)
  - [x] 2.1 Étendre `apps/desktop/src/lib/error-messages.ts` avec une fonction `getErrorWithGuidance(error: string): ErrorGuidance` qui retourne `{ title: string, description: string, suggestedActions: string[], severity: 'warning' | 'error', retryable: boolean }`
  - [x] 2.2 Couvrir toutes les catégories d'erreurs existantes avec actions suggérées :
    - **Import vidéo** : fichier introuvable → "Vérifiez que le fichier existe toujours." ; format non supporté → "Convertissez en MP4 (H.264)." ; fichier trop volumineux → "Choisissez une vidéo de moins de 50GB."
    - **Transcription** : modèle non disponible → "Téléchargez le modèle dans les paramètres." ; erreur de traitement → "Réessayez. Si le problème persiste, réimportez la vidéo."
    - **Export** : espace disque insuffisant → "Libérez de l'espace disque ou choisissez un emplacement différent." ; fichier en cours d'utilisation → "Fermez les autres applications utilisant ce fichier."
    - **Segmentation/Cuts** : erreur de découpe → "Vérifiez vos sélections et réessayez."
    - **Réseau** : connexion échouée → "Vérifiez votre connexion internet." (déjà dans `getNetworkErrorMessage`)
    - **Général** : erreur inattendue → "Redémarrez l'application. Si le problème persiste, contactez le support."
  - [x] 2.3 Ajouter filtre anti-stack-trace : fonction `sanitizeErrorForUser(error: string): string` qui supprime les patterns techniques (chemins de fichiers, numéros de ligne, stack traces, messages Rust internes)
  - [x] 2.4 Tests : `error-messages.test.ts` — chaque catégorie retourne le bon `ErrorGuidance`, sanitization supprime les stack traces, tous les messages sont en français

- [x] Task 3 — Migrer les dialogs d'erreur existants vers le nouveau composant (AC: #4)
  - [x] 3.1 Refactorer `ErrorDialog.tsx` (video-import) : utiliser le nouveau composant `error/ErrorDialog` avec `getErrorWithGuidance()` pour les erreurs d'import
  - [x] 3.2 Refactorer `TranscriptionErrorDialog.tsx` : utiliser le nouveau composant avec guidance pour les erreurs de transcription
  - [x] 3.3 Mettre à jour les toasts d'erreur dans `App.tsx` : pour les erreurs critiques (segmentation, export), utiliser `getErrorWithGuidance()` dans la `description` du toast pour ajouter les actions suggérées
  - [x] 3.4 Mettre à jour `video-store.ts` et `segmentation-store.ts` : passer les erreurs par `sanitizeErrorForUser()` avant affichage
  - [x] 3.5 Tests : vérifier que les dialogs existants utilisent le nouveau composant, messages conformes NFR29/NFR30

- [x] Task 4 — Créer le React ErrorBoundary global (AC: #3, #5)
  - [x] 4.1 Créer `apps/desktop/src/components/error/ErrorBoundary.tsx` : class component React avec `componentDidCatch()` et `getDerivedStateFromError()`
  - [x] 4.2 Fallback UI : afficher le `ErrorDialog` unifié avec severity='error', titre "Erreur inattendue", description "Une erreur inattendue s'est produite.", actions suggérées ["Redémarrez l'application.", "Si le problème persiste, utilisez 'Copier les détails' et contactez le support."], bouton "Recharger" (`window.location.reload()`)
  - [x] 4.3 Logger l'erreur complète (stack trace + componentStack) vers le système de logging local (Task 5)
  - [x] 4.4 Wrapper `<App />` dans `main.tsx` avec `<ErrorBoundary>`
  - [x] 4.5 Tests : `ErrorBoundary.test.tsx` — capture d'erreur React, affichage du fallback, pas de stack trace dans l'UI, erreur loggée

- [x] Task 5 — Implémenter le logging frontend vers fichier local (AC: #5)
  - [x] 5.1 Créer une Tauri command Rust `log_frontend_error` dans `apps/desktop/src-tauri/src/infrastructure/tauri_commands/` : écrit dans un fichier `splice-frontend.log` dans le répertoire app data (`app_data_dir`), format `[TIMESTAMP] [LEVEL] message`, rotation automatique si > 5MB (tronquer les anciennes entrées)
  - [x] 5.2 Créer `apps/desktop/src/lib/logger.ts` : service de logging frontend avec fonctions `logError(context: string, error: unknown)`, `logWarn(context: string, message: string)`, `logInfo(context: string, message: string)` — chaque appel invoque `log_frontend_error` en arrière-plan (fire-and-forget)
  - [x] 5.3 Intégrer le logger dans les points d'erreur critiques : `ErrorBoundary.componentDidCatch()`, toasts d'erreur dans les stores, catch blocks dans les hooks
  - [x] 5.4 S'assurer que les logs ne contiennent PAS de données sensibles (pas de clés de licence, pas de chemins absolus utilisateur au-delà du répertoire app)
  - [x] 5.5 Tests Rust : écriture de log, rotation, format
  - [x] 5.6 Tests Frontend : `logger.test.ts` — appel correct de la commande Tauri, format des messages

- [x] Task 6 — Audit complet et couverture de toutes les erreurs non-gérées (AC: #1, #2, #3)
  - [x] 6.1 Audit de tous les `catch` blocks dans le frontend : vérifier que chaque erreur utilise `sanitizeErrorForUser()` ou `getErrorWithGuidance()` avant affichage
  - [x] 6.2 Audit de tous les `.to_string()` dans les Tauri commands Rust : vérifier qu'aucun stack trace ou chemin système ne fuit vers le frontend
  - [x] 6.3 Remplacer les `console.error` isolés par des appels à `logger.logError()` pour persistance
  - [x] 6.4 Vérifier que les erreurs silencieuses (auto-save, export estimation) sont au minimum loggées via `logger.logWarn()`
  - [x] 6.5 Tests d'intégration : simuler chaque type d'erreur → vérifier message FR, pas de stack trace, actions suggérées

## Dev Notes

### Contexte Architecture

Ce projet est une app desktop Tauri (React frontend + Rust backend) avec architecture Clean en 3 couches (Domain, Application, Infrastructure). L'app utilise :
- **Shadcn/ui** pour les composants UI (AlertDialog, Button, Dialog)
- **Sonner** (toast) pour les notifications non-bloquantes
- **Zustand** pour le state management frontend
- **tracing** crate pour le logging structuré Rust

### Ce qui existe DÉJÀ vs ce qui doit être AJOUTÉ

| Fonctionnalité | Statut Actuel | Action Requise |
|---|---|---|
| Messages d'erreur FR | ✅ `error-messages.ts` avec `getImportErrorMessage()` et `getNetworkErrorMessage()` | Étendre avec `getErrorWithGuidance()` pour toutes catégories |
| ErrorDialog import | ✅ `components/video-import/ErrorDialog.tsx` (icône, titre, retry/cancel) | Migrer vers composant unifié avec actions suggérées |
| TranscriptionErrorDialog | ✅ `components/transcription/TranscriptionErrorDialog.tsx` | Migrer vers composant unifié |
| Toasts d'erreur | ✅ ~11 toasts d'erreur en français dans stores/hooks/composants | Ajouter actions suggérées dans descriptions |
| Anti-stack-trace | ⚠️ Partiel — `getNetworkErrorMessage()` filtre, mais pas global | Ajouter `sanitizeErrorForUser()` global |
| Bouton "Copier détails" | ❌ Absent | Nouveau dans ErrorDialog unifié |
| Actions suggérées | ❌ Absent | Nouveau dans `getErrorWithGuidance()` |
| ErrorBoundary React | ❌ Absent (documenté dans architecture, non implémenté) | Nouveau composant |
| Logging frontend vers fichier | ❌ Absent (uniquement `console.error`) | Nouveau : Tauri command + `logger.ts` |
| Logging Rust backend | ✅ `tracing` crate (debug/info/warn/error) écrit en stdout | Déjà fonctionnel |

### Composants existants à réutiliser

1. **`error-messages.ts`** — Fonctions de mapping d'erreurs existantes :
   - `getImportErrorMessage(error: string)` : 7 mappings d'erreurs d'import → messages FR
   - `getNetworkErrorMessage(error: string)` : 6 mappings d'erreurs réseau → messages FR
   - Pattern établi : switch sur `error.includes('KEYWORD')`, fallback message par défaut

2. **`ErrorDialog.tsx` (video-import)** — Pattern existant :
   - AlertTriangle icône dans cercle `destructive/10`
   - Titre : "Erreur d'importation"
   - Message body + boutons "Annuler" / "Réessayer"
   - Props : `isOpen, errorMessage, onRetry, onCancel`

3. **`TranscriptionErrorDialog.tsx`** — Pattern similaire :
   - AlertTriangle icône, titre "Erreur de transcription"
   - Bouton "Réessayer" optionnel (conditionnel sur `onRetry` prop)
   - Bouton "Fermer"

4. **`CrashRecoveryDialog.tsx`** (Story 9-2) — Pattern AlertDialog Shadcn/ui :
   - Titre + description + 2 boutons d'action
   - Pattern `AlertDialogAction` / `AlertDialogCancel`

5. **Composants UI Shadcn/ui disponibles** :
   - `alert-dialog.tsx` (AlertDialog, Content, Header, Title, Description, Footer, Action, Cancel)
   - `button.tsx` (variants : default, outline, ghost, destructive)
   - `dialog.tsx`, `badge.tsx`, `progress.tsx`, `tooltip.tsx`
   - `sonner.tsx` (Toaster wrapper configuré avec thème)

6. **Pattern toast existant** :
   - `toast.error('Titre', { description: 'Détails', duration: 5000 })`
   - `toast.success('Message', { description: 'Info supplémentaire' })`

7. **Tauri commands pattern** :
   - `Result<T, String>` return type
   - `.map_err(|e| e.to_string())` pour sérialisation
   - Frontend : `await invoke<T>('command_name', { params })` dans try/catch

### Patterns d'erreurs actuels dans l'app (3 niveaux)

1. **Erreurs critiques → AlertDialog modal** : import vidéo, transcription, model download, crash recovery
2. **Erreurs non-critiques → Toast notification** : échec ouverture fichier, chargement projets, export, segmentation
3. **Erreurs silencieuses → console.error uniquement** : auto-save, estimation export, vérifications background

### Patterns à suivre strictement

- **Composants UI** : Shadcn/ui `AlertDialog` avec icônes Lucide React (`AlertTriangle`, `XCircle`, `Copy`, `RefreshCw`)
- **Messages utilisateur** : Toujours en français (NFR29), jamais de stack traces (NFR30)
- **Tauri Commands** : `Result<T, String>` return type, `.map_err(|e| e.to_string())`
- **Tests Frontend** : fichiers côte-à-côte `.test.tsx`/`.test.ts`, Vitest + Testing Library
- **Tests Rust** : inline `#[cfg(test)]` dans même fichier
- **Clean Architecture Rust** : trait dans `domain/`, impl dans `infrastructure/`
- **Logging Rust** : `tracing` crate (debug/info/warn/error)
- **Event Pattern** : `domain:action` kebab-case

### Intelligence Story Précédente (9-1 et 9-2)

**Learnings de la Story 9-1 :**
- Le pattern `getNetworkErrorMessage()` dans `error-messages.ts` fonctionne bien — même structure pour `getErrorWithGuidance()`
- Les erreurs réseau sont sanitisées via pattern matching `error.includes()` — même approche pour toutes les catégories
- Review correction : toujours connecter les utilitaires créés aux composants qui les utilisent (ex: `getNetworkErrorMessage` avait été oublié dans le hook)
- Stale closure attention dans les hooks avec `useEffect` cleanup

**Learnings de la Story 9-2 :**
- Le `CrashRecoveryDialog` utilise AlertDialog Shadcn/ui — même pattern pour le ErrorDialog unifié
- Serialization : les interfaces TS doivent matcher le format Serde du backend (snake_case)
- Race conditions : attention aux cleanups React et Rust concurrents
- Pattern `ResetCleanShutdownUseCase` : toujours utiliser la couche use case plutôt qu'accès direct au repository

**Review corrections récurrentes (9-1 + 9-2) :**
- Vérifier les bornes des compteurs (`MAX + 1` vs `MAX`)
- Connecter TOUS les utilitaires créés aux points d'utilisation
- Éviter les assertions triviales dans les tests
- Respecter la Clean Architecture : toujours passer par les use cases

### Intelligence Git Récente

Les 5 derniers commits :
1. `76cc08e` — Story 9-2 : auto-save & crash recovery
2. `b763d74` — Story 9-1 : network error handling
3. `0434b2b` — Story 8-3 : rollback + crash recovery
4. `a8a333f` — Story 8-2 : code review fixes, signing keys
5. `b47d4cf` — Excalidraw diagram update system

**Patterns récents pertinents :**
- `CrashRecoveryDialog.tsx` : AlertDialog pattern à réutiliser pour ErrorDialog unifié
- `error-messages.ts` : pattern `getXErrorMessage()` à étendre avec `getErrorWithGuidance()`
- `crash_tracker.rs` : logging file-based JSON → modèle pour logging frontend vers fichier
- `main.rs` : `app_data_dir` pour emplacement des fichiers locaux (logs)
- Pattern barrel exports : `index.ts` dans chaque dossier de composants

### Librairies & Versions Critiques

- **Tauri** v2 avec `tauri-plugin-fs` pour accès filesystem
- **Shadcn/ui** basé sur Radix UI (AlertDialog, Button, Dialog)
- **Sonner** pour toast notifications (intégré au thème)
- **Lucide React** pour icônes (AlertTriangle, XCircle, Copy, RefreshCw, etc.)
- **Zustand** pour state management frontend (avec devtools)
- **Vitest** + **Testing Library** pour tests frontend
- **tracing** crate pour logging Rust

### Project Structure Notes

- **Nouveau composant** : `apps/desktop/src/components/error/ErrorDialog.tsx` — dossier `error/` à créer
- **Nouveau composant** : `apps/desktop/src/components/error/ErrorBoundary.tsx`
- **Nouveau service** : `apps/desktop/src/lib/logger.ts`
- **Nouvelle Tauri command** : `apps/desktop/src-tauri/src/infrastructure/tauri_commands/logging_commands.rs`
- **Extension existante** : `apps/desktop/src/lib/error-messages.ts`
- **Migration existants** : `apps/desktop/src/components/video-import/ErrorDialog.tsx` → utiliser nouveau composant
- **Migration existants** : `apps/desktop/src/components/transcription/TranscriptionErrorDialog.tsx` → utiliser nouveau composant

### References

- [Source: epics/epic-9-robust-error-handling-recovery.md#Story 9.3] — Acceptance criteria détaillés
- [Source: architecture.md#5.2 Error Handling Frontend] — Error Boundary pattern, try-catch async, toast notifications
- [Source: architecture.md#5.3 Error Handling Rust] — DomainError, Result<T, String> Tauri mapping
- [Source: architecture.md#4.8 Error Codes Standard] — ErrorCode enum, `to_user_message()`, frontend i18n
- [Source: architecture.md#NFR29] — Messages d'erreur en français
- [Source: architecture.md#NFR30] — Pas de stack traces pour les utilisateurs
- [Source: architecture.md#NFR21] — Logging local sans données sensibles
- [Source: 9-1-graceful-network-error-handling.md] — Patterns error-messages.ts, sanitization, review learnings
- [Source: 9-2-auto-save-crash-recovery.md] — CrashRecoveryDialog pattern, AlertDialog usage, Clean Architecture learnings
- [Source: error-messages.ts] — Fonctions existantes getImportErrorMessage, getNetworkErrorMessage
- [Source: components/video-import/ErrorDialog.tsx] — Pattern dialog d'erreur actuel
- [Source: components/transcription/TranscriptionErrorDialog.tsx] — Pattern dialog transcription
- [Source: domain/errors/domain_error.rs] — DomainError enum complet (22 variants)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Pre-existing test failures (11): SegmentationProgressDialog (5), TranscriptionProgressDialog (2), ExportBlockedDialog/export-store (4) — all unrelated to this story

### Completion Notes List

- Task 1: Created unified `ErrorDialog` component with severity-based icons (XCircle/AlertTriangle), suggested actions list, conditional retry button, and "Copier les détails" clipboard support. 12 tests passing.
- Task 2: Extended `error-messages.ts` with `getErrorWithGuidance()` covering 10+ error categories (import, transcription, export, segmentation, network, generic) all in French. Added `sanitizeErrorForUser()` to strip stack traces, file paths, and Rust internals. 19 new tests (39 total).
- Task 3: Migrated `VideoImport` and `TranscriptionErrorDialog` usage to unified ErrorDialog with guidance. Updated segmentation error toasts in `App.tsx` to use `getErrorWithGuidance()`. Sanitized error strings in stores before user display.
- Task 4: Created `ErrorBoundary` class component wrapping `<App />` in `main.tsx`. Shows unified ErrorDialog fallback with reload action. Logs errors via logger. 6 tests passing.
- Task 5: Created Rust `log_frontend_error` Tauri command writing to `splice-frontend.log` in `app_data_dir` with `[TIMESTAMP] [LEVEL] [context] message` format and 5MB auto-rotation. Created `logger.ts` frontend service with `logError/logWarn/logInfo` (fire-and-forget). License keys sanitized from logs (NFR21). 5 Rust + 6 TS tests passing.
- Task 6: Comprehensive audit replaced `console.error` with `logError`/`logWarn` in App.tsx, VideoImport, segmentation-store, transcript-store. Sanitized all error strings stored in state with `sanitizeErrorForUser()`. Identified remaining low-priority items in license-api.ts and model-service.ts (out of scope for this story).

### Change Log

- 2026-02-08: Story 9.3 implementation — Unified ErrorDialog, error guidance catalog, ErrorBoundary, frontend logging, audit (6 tasks)
- 2026-02-08: Code review fixes — H1/H2: transcript-store loadTranscript now uses sanitizeErrorForUser(String(error)) instead of error.toString(); H3: video-store importVideo stores sanitized error in state; M2: removed dead TranscriptionErrorDialog from barrel export; M4: ErrorBoundary errorDetails now sanitized via sanitizeErrorForUser()

### File List

**New files:**
- `apps/desktop/src/components/error/ErrorDialog.tsx` — Unified error dialog component
- `apps/desktop/src/components/error/ErrorDialog.test.tsx` — 12 tests
- `apps/desktop/src/components/error/ErrorBoundary.tsx` — React error boundary
- `apps/desktop/src/components/error/ErrorBoundary.test.tsx` — 6 tests
- `apps/desktop/src/components/error/index.ts` — Barrel export
- `apps/desktop/src/lib/logger.ts` — Frontend logging service
- `apps/desktop/src/lib/logger.test.ts` — 6 tests
- `apps/desktop/src-tauri/src/infrastructure/tauri_commands/logging_commands.rs` — Rust logging Tauri command (5 tests)

**Modified files:**
- `apps/desktop/src/lib/error-messages.ts` — Added `ErrorGuidance` interface, `getErrorWithGuidance()`, `sanitizeErrorForUser()`
- `apps/desktop/src/lib/error-messages.test.ts` — Added 19 tests for new functions
- `apps/desktop/src/App.tsx` — Replaced TranscriptionErrorDialog with unified ErrorDialog, added logError, sanitized toast errors
- `apps/desktop/src/main.tsx` — Wrapped App with ErrorBoundary
- `apps/desktop/src/components/video-import/VideoImport.tsx` — Migrated to unified ErrorDialog with getErrorWithGuidance()
- `apps/desktop/src/stores/video-store.ts` — Added sanitizeErrorForUser import
- `apps/desktop/src/stores/segmentation-store.ts` — Added sanitizeErrorForUser, getErrorWithGuidance, logError
- `apps/desktop/src/stores/transcript-store.ts` — Replaced console.error with logError/logWarn, sanitized error strings; **[review fix]** loadTranscript catch uses sanitizeErrorForUser
- `apps/desktop/src/components/transcription/index.ts` — **[review fix]** Removed dead TranscriptionErrorDialog export
- `apps/desktop/src-tauri/src/infrastructure/tauri_commands/mod.rs` — Added logging_commands module
- `apps/desktop/src-tauri/src/main.rs` — Registered log_frontend_error command
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Status updated to review
