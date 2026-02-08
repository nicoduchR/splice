# Story 8.2: Update Notification & Installation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to be notified when an update is ready,
so that I can choose when to apply it without disrupting my work.

## Acceptance Criteria

### AC1: Badge de notification discret

**Given** mise à jour téléchargée avec succès (FR47)
**When** l'utilisateur travaille dans l'app
**Then** un badge vert discret apparaît dans la TopBar (côté droit, avant le bouton Settings)
**And** tooltip au survol : "Mise à jour disponible (v{version})"
**And** le badge n'apparaît PAS si l'utilisateur est en cours de transcription, export ou segmentation (attente idle)
**And** le badge disparaît uniquement quand l'utilisateur interagit avec le dialogue de mise à jour

### AC2: Dialogue de détails de la mise à jour

**Given** badge de notification visible
**When** l'utilisateur clique sur le badge
**Then** un dialogue modal s'ouvre avec :
  - Version : `{version}` (ex: 1.1.0)
  - Date de sortie : `{release_date}` formatée en français (ex: 15 janvier 2025)
  - Changelog : `{release_notes}` formaté et lisible (markdown rendu)
  - Bouton "Installer maintenant"
  - Bouton "Installer à la fermeture" (défaut, mis en avant)
  - Bouton "Rappeler plus tard"
**And** le dialogue respecte le design system existant (couleurs dark, border-white/5, bg-card-dark)

### AC3: Installer maintenant

**Given** dialogue de mise à jour ouvert
**When** l'utilisateur clique "Installer maintenant"
**Then** confirmation demandée : "L'application va redémarrer. Voulez-vous continuer ?"
**And** si confirmé, l'application redémarre et applique la mise à jour (via `install_update`)
**And** si annulé, retour au dialogue

### AC4: Installer à la fermeture (FR48)

**Given** dialogue de mise à jour ouvert
**When** l'utilisateur clique "Installer à la fermeture"
**Then** un flag `install_on_quit` est persisté
**And** le badge change d'état pour indiquer "installation programmée" (icône check au lieu du point vert)
**And** le dialogue se ferme
**And** à la prochaine fermeture de l'application, la mise à jour s'applique automatiquement

### AC5: Rappeler plus tard

**Given** dialogue de mise à jour ouvert
**When** l'utilisateur clique "Rappeler plus tard"
**Then** la notification est masquée pendant 24 heures
**And** un timestamp `remind_later_until` est persisté en localStorage
**And** après 24h, le badge réapparaît automatiquement
**And** si une NOUVELLE version est détectée (version différente), le timer est réinitialisé et le badge s'affiche immédiatement

### AC6: Aucune interruption du travail actif

**Given** une mise à jour est prête
**When** l'utilisateur est en train de transcrire, exporter ou segmenter
**Then** le badge de notification N'apparaît PAS
**And** aucun dialogue ne s'affiche
**And** la notification est mise en file d'attente et s'affiche quand l'utilisateur devient idle

### AC7: Notification différée si occupé

**Given** une mise à jour est détectée pendant que l'utilisateur est occupé
**When** la transcription/export/segmentation se termine
**Then** le badge apparaît automatiquement
**And** un toast discret s'affiche : "Mise à jour v{version} disponible"

## Tasks / Subtasks

### Frontend - Composant UpdateNotificationBadge

- [x] **Task 1: Créer le composant UpdateNotificationBadge** (AC: #1, #6, #7)
  - [x] 1.1 Créer `apps/desktop/src/components/update/UpdateNotificationBadge.tsx`
  - [x] 1.2 Afficher un point vert animé (pulse) quand `status === 'ready'`
  - [x] 1.3 Afficher une icône check quand `installOnQuit === true`
  - [x] 1.4 Ajouter tooltip avec `<Tooltip>` : "Mise à jour disponible (v{version})"
  - [x] 1.5 Masquer si `isTranscribing || isExporting || isSegmenting` (utiliser les stores existants)
  - [x] 1.6 onClick → ouvrir le UpdateDialog
  - [x] 1.7 Écrire tests (8+ tests Vitest)

### Frontend - Composant UpdateDialog

- [x] **Task 2: Créer le composant UpdateDialog** (AC: #2, #3, #4, #5)
  - [x] 2.1 Créer `apps/desktop/src/components/update/UpdateDialog.tsx`
  - [x] 2.2 Utiliser `<Dialog>` de shadcn (pas AlertDialog — on veut pouvoir fermer)
  - [x] 2.3 Afficher version, date formatée (`Intl.DateTimeFormat('fr-FR')`), changelog
  - [x] 2.4 Rendre le changelog markdown avec un rendu basique (gras, listes, titres)
  - [x] 2.5 Trois boutons : "Installer maintenant", "Installer à la fermeture" (primary), "Rappeler plus tard"
  - [x] 2.6 "Installer maintenant" → ouvrir AlertDialog de confirmation puis `installUpdate()`
  - [x] 2.7 "Installer à la fermeture" → appeler `setInstallOnQuit(true)` et fermer
  - [x] 2.8 "Rappeler plus tard" → appeler `remindLater()` et fermer
  - [x] 2.9 Écrire tests (10+ tests Vitest)

### Frontend - Extension du Update Store

- [x] **Task 3: Étendre le store update-store.ts** (AC: #4, #5, #6, #7)
  - [x] 3.1 Ajouter état : `installOnQuit: boolean`, `remindLaterUntil: number | null`, `showNotification: boolean`
  - [x] 3.2 Ajouter action `setInstallOnQuit(value: boolean)` → invoke `set_install_on_quit` + persister en localStorage
  - [x] 3.3 Ajouter action `remindLater()` → calculer `Date.now() + 24 * 60 * 60 * 1000`, persister en localStorage
  - [x] 3.4 Ajouter action `shouldShowNotification()` → logique combinée : status === 'ready' && !isReminded && !isBusy
  - [x] 3.5 Au `initEventListeners`, charger `remindLaterUntil` depuis localStorage au démarrage
  - [x] 3.6 Sur event `update:available` avec nouvelle version → réinitialiser `remindLaterUntil`
  - [x] 3.7 Écrire tests additionnels (8+ tests)

### Frontend - Intégration TopBar

- [x] **Task 4: Intégrer dans TopBar.tsx** (AC: #1)
  - [x] 4.1 Importer et placer `<UpdateNotificationBadge />` dans la section droite de la TopBar, avant le bouton Settings
  - [x] 4.2 Gérer l'état d'ouverture du dialog via un state local `isUpdateDialogOpen`
  - [x] 4.3 Écrire tests d'intégration (3+ tests)

### Frontend - Détection d'état idle et notification différée

- [x] **Task 5: Implémenter la logique de notification idle** (AC: #6, #7)
  - [x] 5.1 Créer un hook `useIdleNotification()` dans `apps/desktop/src/hooks/useIdleNotification.ts`
  - [x] 5.2 Surveiller les stores `transcription`, `segmentation`, `export` pour détecter la fin des opérations
  - [x] 5.3 Quand transition busy→idle ET mise à jour disponible → afficher toast "Mise à jour v{version} disponible"
  - [x] 5.4 Utiliser `toast.info()` de sonner pour le toast discret
  - [x] 5.5 Écrire tests (5+ tests)

### Backend (Rust) - Install on Quit

- [x] **Task 6: Implémenter install_on_quit côté Rust** (AC: #4)
  - [x] 6.1 Ajouter `install_on_quit: bool` à `UpdateState` dans `app_state.rs`
  - [x] 6.2 Ajouter commande Tauri `set_install_on_quit(value: bool)` dans `update_commands.rs`
  - [x] 6.3 Ajouter commande Tauri `get_install_on_quit()` dans `update_commands.rs`
  - [x] 6.4 Enregistrer les nouvelles commandes dans `main.rs`
  - [x] 6.5 Ajouter handler `on_window_event` : sur `CloseRequested`, si `install_on_quit == true`, appeler `app.restart()` pour appliquer la mise à jour
  - [x] 6.6 Tests inline Rust (4+ tests)

### Frontend - Update Service Extension

- [x] **Task 7: Étendre update-service.ts** (AC: #4)
  - [x] 7.1 Ajouter `setInstallOnQuit(value: boolean)` → `invoke('set_install_on_quit', { value })`
  - [x] 7.2 Ajouter `getInstallOnQuit()` → `invoke('get_install_on_quit')`
  - [x] 7.3 Écrire tests additionnels (4+ tests)

## Dev Notes

### Architecture Compliance

Cette story étend l'infrastructure de mise à jour créée dans la Story 8.1. Elle suit la **Clean Architecture** établie.

**Nouveaux fichiers Frontend :**
```
apps/desktop/src/
├── components/update/
│   ├── UpdateNotificationBadge.tsx    (NOUVEAU)
│   └── UpdateDialog.tsx               (NOUVEAU)
├── hooks/
│   └── useIdleNotification.ts         (NOUVEAU)
├── stores/update-store.ts             (MODIFIER)
├── services/update-service.ts         (MODIFIER)
└── components/layout/TopBar.tsx       (MODIFIER)
```

**Fichiers Rust modifiés :**
```
apps/desktop/src-tauri/src/
├── infrastructure/
│   ├── config/app_state.rs            (MODIFIER: install_on_quit)
│   └── tauri_commands/update_commands.rs (MODIFIER: 2 nouvelles commandes)
└── main.rs                            (MODIFIER: on_window_event handler, enregistrement commandes)
```

### Patterns existants à suivre STRICTEMENT

**Dialog Pattern (copier ExportDialog) :**
```typescript
<Dialog open={isOpen} onOpenChange={handleClose}>
  <DialogContent className="bg-gray-950 border-gray-800 sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle className="text-white">Titre</DialogTitle>
      <DialogDescription className="text-gray-500">Description</DialogDescription>
    </DialogHeader>
    <div className="space-y-6 py-4">
      {/* Contenu */}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>Annuler</Button>
      <Button onClick={onConfirm}>Confirmer</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**AlertDialog Pattern (pour confirmation Install Now, copier ModelDownloadDialog) :**
```typescript
<AlertDialog open={showConfirm}>
  <AlertDialogContent className="max-w-[520px] p-0 gap-0 border-white/5 bg-card-dark">
    <AlertDialogHeader>
      <AlertDialogTitle>Confirmer le redémarrage</AlertDialogTitle>
      <AlertDialogDescription>L'application va redémarrer...</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel onClick={cancelConfirm}>Annuler</AlertDialogCancel>
      <AlertDialogAction onClick={doInstall}>Redémarrer</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Badge/Dot Pattern :**
```typescript
// Point vert animé (pulse) — pas de composant Badge existant pour ça
<button className="relative" onClick={onClick}>
  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
  <Download className="w-5 h-5 text-muted-foreground" />
</button>
```

**Toast Pattern (sonner) :**
```typescript
import { toast } from 'sonner';
toast.info('Mise à jour v1.1.0 disponible', {
  description: 'Cliquez sur l\'icône de mise à jour pour plus de détails.',
  duration: 5000,
});
```

**Zustand Store Pattern (copier update-store existant) :**
```typescript
export const useUpdateStore = create<UpdateStore>()(
  devtools((set, get) => ({
    // État...
    // Actions...
  }), { name: 'update-store' })
);
```

### Types existants à réutiliser (NE PAS RECRÉER)

**Rust — déjà dans `domain/entities/update_info.rs` :**
- `UpdateInfo { version, release_date, release_notes, download_url, is_mandatory }`
- `UpdateStatus { Idle, Checking, Available, Downloading, Ready, UpToDate, Error }`
- `DownloadProgress { percent, downloaded_bytes, total_bytes }`

**Rust — déjà dans `tauri_commands/update_commands.rs` :**
- `UpdateStatusResponse { status, update_info, download_progress, error }`
- `UpdateAvailableEvent { version, release_notes, is_mandatory }`
- `UpdateDownloadCompleteEvent { version }`

**TypeScript — déjà dans `types/update.ts` :**
- `UpdateInfo`, `DownloadProgress`, `UpdateStatus`, `UpdateStatusResponse`
- `UpdateAvailableEvent`, `UpdateDownloadProgressEvent`, `UpdateDownloadCompleteEvent`

**Commandes Tauri existantes :**
- `check_for_update` → `UpdateStatusResponse`
- `download_update` → `UpdateStatusResponse`
- `cancel_update_download` → `void`
- `get_update_status` → `UpdateStatusResponse`
- `install_update` → `void` (appelle `app.restart()`)

### Stores existants pour détecter l'état "occupé"

**Vérifier ces stores pour la logique idle :**
- Store de transcription : chercher un flag `isTranscribing` ou équivalent
- Store d'export : chercher `isExporting`
- Store de segmentation : chercher `isSegmenting` ou `isProcessing`

**Pattern de détection idle dans main.rs (à suivre côté frontend) :**
```rust
// Existant dans main.rs pour les checks périodiques
let is_busy = {
    let state = state_for_check.inner();
    let transcription = state.is_transcribing.lock().unwrap();
    let segmentation = state.is_segmenting.lock().unwrap();
    let export = state.is_exporting.lock().unwrap();
    *transcription || *segmentation || *export
};
```

### Formatage du Changelog

Le `release_notes` du serveur arrive en format texte simple (ex: "- Feature X\n- Bug fix Y"). Pour le rendu :

1. **NE PAS ajouter de dépendance markdown** — le changelog est simple
2. Utiliser un rendu basique : split par `\n`, détecter `- ` pour listes, `## ` pour titres
3. Composant `<ChangelogRenderer notes={releaseNotes} />` simple

### Gestion du "Install on Quit"

**Flow complet :**
1. User clique "Installer à la fermeture" → frontend appelle `invoke('set_install_on_quit', { value: true })`
2. Rust stocke `install_on_quit = true` dans AppState
3. À la fermeture de la fenêtre → `on_window_event(CloseRequested)` vérifie le flag
4. Si `true` → appelle `app.restart()` qui applique la mise à jour téléchargée par le plugin updater
5. Le plugin tauri-updater gère l'application de la mise à jour au restart

**Important :** `tauri-plugin-updater` appelle `download_and_install()` qui prépare la mise à jour. Le `app.restart()` l'applique. La mise à jour est déjà prête après le download de la Story 8.1.

### Persistance localStorage

**Clés localStorage :**
- `splice_remind_later_until` : timestamp Unix (nombre) — quand la notification peut réapparaître
- `splice_remind_later_version` : version concernée — pour réinitialiser si nouvelle version

**NE PAS utiliser localStorage pour `install_on_quit`** — ce flag doit être côté Rust car c'est le backend qui gère la fermeture.

### Permissions Tauri

Vérifier que `capabilities/default.json` inclut les permissions nécessaires. Les commandes Tauri existantes sont déjà enregistrées. Les nouvelles commandes (`set_install_on_quit`, `get_install_on_quit`) n'ont pas besoin de permissions spéciales car elles sont des commandes custom.

### Testing Strategy

**Frontend Tests (Vitest + React Testing Library) :**
- `UpdateNotificationBadge.test.tsx` : 8+ tests
  - Affiche badge quand status === 'ready'
  - Masque badge quand status !== 'ready'
  - Masque badge quand occupé (transcription/export/segmentation)
  - Affiche tooltip avec version
  - Affiche icône check quand installOnQuit
  - onClick ouvre le dialog
  - Masque badge quand remindLater actif
  - Réaffiche badge quand remindLater expire
- `UpdateDialog.test.tsx` : 10+ tests
  - Affiche version, date, changelog
  - Date formatée en français
  - Bouton Install Now déclenche confirmation
  - Confirmation Install Now appelle installUpdate
  - Annulation confirmation revient au dialog
  - Bouton Install on Quit appelle setInstallOnQuit
  - Bouton Remind Later appelle remindLater et ferme
  - Dialog respecte le design system
  - Gère l'absence de release_notes
  - Boutons désactivés pendant l'installation
- `update-store.test.ts` : 8+ tests additionnels
  - setInstallOnQuit persiste le flag
  - remindLater calcule le bon timestamp
  - shouldShowNotification logique combinée
  - Nouvelle version réinitialise remindLater
  - initEventListeners charge remindLater depuis localStorage
- `useIdleNotification.test.ts` : 5+ tests
  - Affiche toast quand transition busy→idle
  - N'affiche pas toast si pas de mise à jour
  - N'affiche pas toast si remindLater actif
  - Affiche toast une seule fois par session idle

**Rust Tests (inline) :**
- `set_install_on_quit` : set/get roundtrip
- `on_window_event` handler : vérifie que restart est appelé si flag true
- `on_window_event` handler : vérifie que rien ne se passe si flag false

### Security Considerations

1. **Pas de données sensibles en localStorage** — seuls des timestamps et versions y sont stockés
2. **Le flag install_on_quit est côté Rust** — pas manipulable depuis le JavaScript directement
3. **La vérification de signature est déjà gérée par Story 8.1** — ne pas la contourner

### Project Structure Notes

- Nouveau dossier `components/update/` — groupe les composants UI de mise à jour
- Le hook `useIdleNotification` est dans `hooks/` — pattern existant dans le projet
- Modification minimale de TopBar.tsx — juste l'ajout du composant badge

### References

- [Source: epic-8-reliable-auto-updates.md#Story-8.2] - Requirements originaux
- [Source: 8-1-update-check-background-download.md] - Story précédente avec tous les patterns
- [Source: apps/desktop/src/components/layout/TopBar.tsx] - TopBar pour intégration badge
- [Source: apps/desktop/src/components/export/ExportDialog.tsx] - Pattern Dialog à suivre
- [Source: apps/desktop/src/components/transcription/ModelDownloadDialog.tsx] - Pattern AlertDialog
- [Source: apps/desktop/src/stores/update-store.ts] - Store existant à étendre
- [Source: apps/desktop/src/services/update-service.ts] - Service existant à étendre
- [Source: apps/desktop/src-tauri/src/infrastructure/tauri_commands/update_commands.rs] - Commandes Tauri existantes
- [Source: apps/desktop/src-tauri/src/infrastructure/config/app_state.rs] - AppState à modifier
- [Source: apps/desktop/src-tauri/src/main.rs] - Handler fermeture fenêtre

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Task 6 (Rust backend): Added `install_on_quit: bool` to `UpdateState`, created `set_install_on_quit` and `get_install_on_quit` Tauri commands, registered in `main.rs`, added `on_window_event(CloseRequested)` handler that calls `app.restart()` when flag is true. 4 new Rust tests + 1 existing test updated. 13 Rust tests passing.
- Task 7 (Update service): Added `setInstallOnQuit()` and `getInstallOnQuit()` functions wrapping Tauri invoke calls. 4 new tests passing.
- Task 3 (Update store): Extended with `installOnQuit`, `remindLaterUntil`, `remindLaterVersion`, `showNotification` state. Added `setInstallOnQuit()` (calls Rust backend), `remindLater()` (localStorage persistence with 24h timer), `shouldShowNotification()` (combined logic). `initEventListeners` loads remindLater from localStorage and resets on new version. 10 new tests passing.
- Task 1 (UpdateNotificationBadge): Created component with green pulsing dot for ready state, check icon for installOnQuit, tooltip with version, busy state masking via stores, and onClick handler. 10 tests passing.
- Task 2 (UpdateDialog): Created modal dialog with version, formatted date (fr-FR), changelog renderer, 3 action buttons (Install Now with AlertDialog confirmation, Install on Quit, Remind Later). 11 tests passing.
- Task 4 (TopBar integration): Added `UpdateNotificationBadge` and `UpdateDialog` to TopBar, placed before Settings button. Dialog state managed via local `isUpdateDialogOpen`. 5 TopBar tests passing (including pre-existing).
- Task 5 (useIdleNotification hook): Created hook that watches busy stores for busy→idle transitions and shows toast notification via sonner. Toast shown once per version per session. 5 tests passing.

### File List

- apps/desktop/src/components/update/UpdateNotificationBadge.tsx (NEW)
- apps/desktop/src/components/update/UpdateNotificationBadge.test.tsx (NEW)
- apps/desktop/src/components/update/UpdateDialog.tsx (NEW)
- apps/desktop/src/components/update/UpdateDialog.test.tsx (NEW)
- apps/desktop/src/components/update/index.ts (NEW)
- apps/desktop/src/hooks/useIdleNotification.ts (NEW)
- apps/desktop/src/hooks/useIdleNotification.test.ts (NEW)
- apps/desktop/src/stores/update-store.ts (MODIFIED)
- apps/desktop/src/stores/update-store.test.ts (MODIFIED)
- apps/desktop/src/services/update-service.ts (MODIFIED)
- apps/desktop/src/services/update-service.test.ts (MODIFIED)
- apps/desktop/src/components/layout/TopBar.tsx (MODIFIED)
- apps/desktop/src-tauri/src/infrastructure/config/app_state.rs (MODIFIED)
- apps/desktop/src-tauri/src/infrastructure/tauri_commands/update_commands.rs (MODIFIED)
- apps/desktop/src-tauri/src/main.rs (MODIFIED)

## Change Log

- 2026-02-08: Story 8.2 implementation complete — Update notification badge, dialog, install-on-quit backend, idle notification hook, store extensions, service extensions. 81 frontend tests + 13 Rust tests passing.
- 2026-02-08: Code review fixes — H1: Fixed set_update_state() preserving install_on_quit flag to prevent silent reset. H2: Added error handling in handleConfirmInstall to prevent permanently disabled buttons. M1: Aligned Dialog styling to design system (bg-card-dark, border-white/5). M2: Removed shouldShowNotification mocks from badge tests to exercise real store logic. M3: Added barrel export index.ts for components/update/ and updated TopBar imports. 76 frontend tests + 258 Rust tests passing.
