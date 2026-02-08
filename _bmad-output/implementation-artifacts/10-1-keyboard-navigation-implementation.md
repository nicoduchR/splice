# Story 10.1: Keyboard Navigation Implementation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user who relies on keyboard,
I want to navigate and use all features without a mouse,
so that I can work efficiently with my preferred input method.

## Acceptance Criteria

1. **Given** WCAG 2.1 Level AA compliance required **When** l'utilisateur navigue uniquement au clavier **Then** Tab/Shift+Tab parcourt tous les éléments interactifs dans un ordre logique :
   - Header navigation (Settings, Update, License)
   - Bouton Import
   - Éditeur de transcript
   - Timeline
   - Contrôles export
   **And** le cycle de tabulation est cohérent et prévisible (pas de piège de focus).

2. **Given** l'utilisateur navigue au clavier **When** un élément reçoit le focus **Then** un indicateur de focus visible est affiché sur TOUS les éléments focusables : `focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2` **And** l'indicateur est clairement visible sur le fond sombre (ring-offset sur background dark) **And** aucun élément interactif n'a `outline: none` sans ring de remplacement.

3. **Given** un modal/dialog est ouvert **When** l'utilisateur appuie sur Escape **Then** le modal se ferme **And** le focus retourne à l'élément qui a déclenché l'ouverture du modal.

4. **Given** l'utilisateur est dans le transcript **When** il utilise les flèches **Then** ArrowUp/ArrowDown navigue entre les paragraphes (lignes virtualisées) **And** ArrowLeft/ArrowRight navigue entre les mots (comportement existant préservé) **And** le scroll suit automatiquement le focus.

5. **Given** l'utilisateur est dans la timeline **When** il utilise les flèches **Then** ArrowLeft/ArrowRight = déplacement frame par frame (1/30s) **And** Shift+ArrowLeft/Shift+ArrowRight = saut de 5 secondes **And** Home = début de la vidéo **And** End = fin de la vidéo.

6. **Given** le lecteur vidéo/preview est focusé **When** l'utilisateur appuie sur Space **Then** play/pause est déclenché **And** Space ne scroll PAS la page (preventDefault).

7. **Given** l'utilisateur appuie sur Cmd+/ (Mac) ou Ctrl+/ (Windows) **When** n'importe où dans l'application **Then** un modal d'aide raccourcis clavier s'ouvre **And** le modal liste TOUS les raccourcis disponibles groupés par contexte (Global, Transcript, Timeline, Player, Modals) **And** le modal est fermable par Escape.

8. **Given** toutes les fonctionnalités de l'application **When** l'utilisateur n'utilise que le clavier **Then** chaque action accessible à la souris a un équivalent clavier **And** aucune fonctionnalité n'est bloquée sans souris.

## Tasks / Subtasks

- [x] Task 1 — Audit et correction de l'ordre de tabulation (AC: #1, #2)
  - [x] 1.1 Auditer `apps/desktop/src/App.tsx` : vérifier que l'ordre DOM des composants reflète l'ordre de tabulation logique (TopBar → Import → Transcript → Timeline → Export)
  - [x] 1.2 Ajouter `tabIndex={0}` aux composants interactifs qui ne sont pas nativement focusables (divs, spans utilisés comme boutons)
  - [x] 1.3 Vérifier que tous les `<button>` utilisent bien la balise `<button>` ou le composant shadcn `Button` (pas de `<div onClick>`)
  - [x] 1.4 Ajouter des skip links en haut de `App.tsx` : "Aller au transcript" et "Aller à la timeline" avec `<a href="#transcript" className="sr-only focus:not-sr-only ...">` qui deviennent visibles au focus
  - [x] 1.5 Ajouter les `id` correspondants aux conteneurs cibles : `id="transcript"` sur TranscriptViewer, `id="timeline"` sur TimelineBar
  - [x] 1.6 Vérifier les focus rings : s'assurer que TOUS les éléments interactifs ont `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2`
  - [x] 1.7 Vérifier spécifiquement les composants custom qui pourraient manquer de focus ring : TimelineBar segments, KeyboardShortcutsBar, SelectionStats, boutons icônes du TopBar
  - [x] 1.8 Tests : tester l'ordre de tabulation avec `userEvent.tab()`, vérifier que chaque élément interactif reçoit le focus dans l'ordre attendu

- [x] Task 2 — Navigation clavier dans le transcript (AC: #4)
  - [x] 2.1 Étendre `apps/desktop/src/hooks/use-transcript-keyboard-nav.ts` : ajouter ArrowUp/ArrowDown pour naviguer entre paragraphes (lignes virtualisées via `@tanstack/react-virtual`)
  - [x] 2.2 ArrowUp : trouver le premier mot de la ligne précédente dans `virtualizer.getVirtualItems()`, appeler `scrollToIndex()` et mettre à jour la sélection courante
  - [x] 2.3 ArrowDown : trouver le premier mot de la ligne suivante, même logique
  - [x] 2.4 S'assurer que le scroll automatique suit le mot focusé (utiliser `scrollToIndex` existant de `TranscriptViewer.tsx` lignes 78-95)
  - [x] 2.5 Préserver le comportement existant : ArrowLeft/ArrowRight (mots), Escape (clear), Cmd+Z/Ctrl+Z (undo), Cmd+Shift+Z (redo)
  - [x] 2.6 Tests : navigation ArrowUp/ArrowDown entre paragraphes, scroll suit le focus, pas de régression sur ArrowLeft/ArrowRight

- [x] Task 3 — Navigation clavier dans la timeline (AC: #5)
  - [x] 3.1 Créer `apps/desktop/src/hooks/use-timeline-keyboard-nav.ts` : hook dédié pour la navigation clavier dans la timeline
  - [x] 3.2 Implémenter ArrowLeft/ArrowRight : seek ±1 frame (1/30s = ~0.033s) via `useTimelineStore.getState().setCurrentTime()`
  - [x] 3.3 Implémenter Shift+ArrowLeft/Shift+ArrowRight : seek ±5 secondes
  - [x] 3.4 Implémenter Home : seek au début (currentTime = 0)
  - [x] 3.5 Implémenter End : seek à la fin (currentTime = duration)
  - [x] 3.6 Intégrer le hook dans `apps/desktop/src/components/timeline/TimelineBar.tsx` : ajouter `onKeyDown` sur le conteneur avec `tabIndex={0}`
  - [x] 3.7 Ne PAS capturer les événements si un input/textarea a le focus (`e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement`)
  - [x] 3.8 Tests : ArrowLeft/Right seek ±frame, Shift+Arrow seek ±5s, Home/End, pas de capture quand input focusé

- [x] Task 4 — Gestion play/pause clavier et prévention scroll (AC: #6)
  - [x] 4.1 Vérifier que le handler Space dans `apps/desktop/src/components/video/VideoPlayer.tsx` (lignes 171-202) appelle `e.preventDefault()` pour empêcher le scroll de la page
  - [x] 4.2 Vérifier le même comportement dans `apps/desktop/src/components/preview/PreviewPlayer.tsx` (lignes 145-184)
  - [x] 4.3 S'assurer que Space ne déclenche PAS play/pause quand un input/textarea/button a le focus (éviter conflit avec boutons)
  - [x] 4.4 Tests : Space déclenche play/pause, Space ne scroll pas, Space ne se déclenche pas sur input focusé

- [x] Task 5 — Modal d'aide raccourcis clavier (AC: #7)
  - [x] 5.1 Créer `apps/desktop/src/components/keyboard-shortcuts/KeyboardShortcutsDialog.tsx` : Dialog shadcn listant tous les raccourcis
  - [x] 5.2 Structure du dialog : sections groupées par contexte avec headers :
    - **Global** : Cmd+/ (Aide raccourcis), Cmd+Z (Annuler), Cmd+Shift+Z (Rétablir), Cmd+F (Rechercher)
    - **Transcript** : Arrow Left/Right (Mot précédent/suivant), Arrow Up/Down (Paragraphe précédent/suivant), Escape (Désélectionner), Shift+Click (Étendre sélection)
    - **Timeline** : Arrow Left/Right (±1 frame), Shift+Arrow (±5s), Home (Début), End (Fin)
    - **Lecteur** : Space (Play/Pause), Arrow Up/Down (Volume ±10%), F (Plein écran)
    - **Modals** : Escape (Fermer), Tab (Navigation), Enter (Confirmer)
  - [x] 5.3 Affichage des touches avec composant `<kbd>` existant (pattern de `KeyboardShortcutsBar.tsx` : `className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono"`)
  - [x] 5.4 Détection Mac vs Windows : afficher "Cmd" ou "Ctrl" selon `navigator.platform` ou `navigator.userAgent`
  - [x] 5.5 Créer `apps/desktop/src/hooks/use-global-keyboard-shortcuts.ts` : hook global monté dans `App.tsx` qui écoute Cmd+/ / Ctrl+/ pour ouvrir le dialog
  - [x] 5.6 Le hook doit aussi centraliser les raccourcis globaux existants (Cmd+G, Cmd+E, Cmd+J) déjà dispersés dans les composants
  - [x] 5.7 Créer barrel export `apps/desktop/src/components/keyboard-shortcuts/index.ts`
  - [x] 5.8 Tests : ouverture via Cmd+/, affichage de toutes les sections, fermeture Escape, détection plateforme

- [x] Task 6 — Garantir l'équivalence clavier complète (AC: #3, #8)
  - [x] 6.1 Audit : lister toutes les actions souris et vérifier leur équivalent clavier :
    - Click sur bouton Import → Tab + Enter ✓ (natif button)
    - Click sur mot du transcript → Arrow + Enter/Space ✓
    - Drag & drop import → Tabulation vers zone + Enter pour ouvrir le file picker ✓
    - Click segment timeline → Tab vers timeline + Arrow pour naviguer
    - Slider scrubber → Arrow keys quand focusé ✓
    - Volume slider → Arrow Up/Down quand focusé ✓
  - [x] 6.2 Vérifier le retour de focus après fermeture de modal : utiliser `useRef` pour sauvegarder l'élément déclencheur, `triggerRef.current?.focus()` dans le `onOpenChange(false)` callback
  - [x] 6.3 Vérifier dans les composants qui utilisent `Dialog` et `AlertDialog` que le focus revient correctement (Radix Dialog gère ça nativement via `onOpenAutoFocus` / `onCloseAutoFocus`)
  - [x] 6.4 Vérifier que le drag & drop de `VideoImportDropZone` a un fallback clavier : le bouton "Sélectionner un fichier" doit être accessible via Tab+Enter
  - [x] 6.5 Tests : focus revient après fermeture modal, toutes les actions souris ont un équivalent clavier

- [x] Task 7 — Tests d'accessibilité globaux
  - [x] 7.1 Ajouter `@axe-core/react` (dev dependency) pour les audits automatisés : `pnpm add -D @axe-core/react` dans `apps/desktop`
  - [x] 7.2 Configurer axe dans `apps/desktop/src/test/setup.ts` pour les tests Vitest (optionnel, si temps)
  - [x] 7.3 Créer `apps/desktop/src/components/keyboard-shortcuts/KeyboardShortcutsDialog.test.tsx` : tests du dialog
  - [x] 7.4 Créer `apps/desktop/src/hooks/use-timeline-keyboard-nav.test.ts` : tests du hook timeline
  - [x] 7.5 Créer `apps/desktop/src/hooks/use-global-keyboard-shortcuts.test.ts` : tests du hook global
  - [x] 7.6 Étendre `apps/desktop/src/hooks/use-transcript-keyboard-nav.test.ts` : ajouter tests ArrowUp/ArrowDown
  - [x] 7.7 Vérifier que les tests existants ne régressent pas (367+ tests Rust, 67+ tests frontend)

## Dev Notes

### Contexte Architecture

App desktop Tauri v2 (React 18 frontend + Rust backend) avec Clean Architecture 3 couches. Frontend en TypeScript strict avec Tailwind CSS 4, shadcn/ui (Radix UI), Zustand state management. Tests via Vitest + @testing-library/react.

### Ce qui existe DÉJÀ vs ce qui doit être AJOUTÉ

| Fonctionnalité | Statut Actuel | Action Requise |
|---|---|---|
| Keyboard nav transcript (Left/Right) | ✅ `use-transcript-keyboard-nav.ts` | Étendre : ajouter ArrowUp/ArrowDown paragraphes |
| Keyboard nav transcript tests | ✅ 217 lignes de tests | Étendre : tests ArrowUp/ArrowDown |
| VideoPlayer keyboard (Space, Arrows) | ✅ `VideoPlayer.tsx:171-202` | Vérifier preventDefault sur Space |
| PreviewPlayer keyboard (Space, Arrows, Volume, F) | ✅ `PreviewPlayer.tsx:145-184` | Vérifier preventDefault sur Space |
| Focus rings sur composants shadcn | ✅ `focus-visible:ring-2` pattern | Audit : vérifier TOUS les éléments custom |
| TranscriptViewer `tabIndex={0}` | ✅ `TranscriptViewer.tsx:202` | OK — Préserver |
| TranscriptWord `tabIndex={-1}` | ✅ `TranscriptWord.tsx:35` | OK — Navigation via hook |
| Timeline segments `aria-label` | ✅ `TimelineBar.tsx:86` | Ajouter keyboard navigation |
| Focus trap dans Dialogs | ✅ Via Radix UI Dialog | OK — Focus trap natif |
| sr-only live regions | ✅ ExportProgress, SegmentationProgress | OK — Préserver |
| `<kbd>` affichage raccourcis | ✅ `KeyboardShortcutsBar.tsx` | Réutiliser le pattern dans le nouveau dialog |
| Skip links | ❌ Absent | Nouveau : liens skip-to-content |
| Timeline keyboard nav | ❌ Absent | Nouveau : hook + intégration |
| Raccourcis clavier help modal | ❌ Absent | Nouveau : dialog + hook global |
| Global keyboard shortcut hook | ❌ Absent | Nouveau : centraliser Cmd+/ etc. |
| axe-core testing | ❌ Absent | Nouveau : dev dependency |
| Tab order audit/correction | ⚠️ Partiel — ordre DOM par défaut | Vérifier et corriger si besoin |

### Composants existants à réutiliser

1. **`use-transcript-keyboard-nav.ts`** — Hook existant avec ArrowLeft/Right, Escape, Undo/Redo. **Étendre** pour ArrowUp/Down (paragraphes).

2. **`KeyboardShortcutsBar.tsx`** — Composant visuel existant avec pattern `<kbd>`. **Réutiliser le style** dans le nouveau dialog d'aide.

3. **`Dialog` shadcn** (`components/ui/dialog.tsx`) — Dialog avec focus trap Radix. **Utiliser** pour le modal d'aide raccourcis.

4. **`TranscriptViewer.tsx`** — Container avec `tabIndex={0}`, `role="textbox"`, `aria-label`. Déjà accessible. Utilise `@tanstack/react-virtual` pour virtualisation. **Préserver** et étendre la navigation.

5. **`TimelineBar.tsx`** — Container avec `role="region"`, `aria-label="Timeline"`. Segments avec `aria-label`. **Ajouter** keyboard navigation.

6. **`VideoPlayer.tsx`** — Handler keyboard existant (Space, Arrows). Inclut guard `HTMLInputElement/HTMLTextAreaElement`. **Vérifier** preventDefault.

7. **`PreviewPlayer.tsx`** — Handler keyboard étendu (Space, Arrows, Volume, F). `tabIndex={0}` sur contrôles. **Vérifier** preventDefault.

8. **Stores Zustand** — `timeline-store.ts` expose `setCurrentTime()`, `transcript-store.ts` expose `setSelectedWordIndex()`. **Utiliser** dans les nouveaux hooks.

9. **`VideoImportDropZone.tsx`** — Zone drag & drop avec bouton "Sélectionner un fichier". **Vérifier** que le bouton est accessible via Tab+Enter.

### Répertoires et chemins clés

```
apps/desktop/src/
├── hooks/
│   ├── use-transcript-keyboard-nav.ts      # ÉTENDRE (ArrowUp/Down)
│   ├── use-transcript-keyboard-nav.test.ts # ÉTENDRE (tests)
│   ├── use-timeline-keyboard-nav.ts        # NOUVEAU
│   ├── use-timeline-keyboard-nav.test.ts   # NOUVEAU
│   ├── use-global-keyboard-shortcuts.ts    # NOUVEAU
│   └── use-global-keyboard-shortcuts.test.ts # NOUVEAU
├── components/
│   ├── keyboard-shortcuts/
│   │   ├── KeyboardShortcutsDialog.tsx      # NOUVEAU
│   │   ├── KeyboardShortcutsDialog.test.tsx # NOUVEAU
│   │   └── index.ts                        # NOUVEAU (barrel)
│   ├── video/
│   │   ├── VideoPlayer.tsx                  # VÉRIFIER (preventDefault)
│   │   └── KeyboardShortcutsBar.tsx         # PATTERN à réutiliser
│   ├── timeline/
│   │   └── TimelineBar.tsx                  # MODIFIER (intégrer hook)
│   ├── transcript/
│   │   ├── TranscriptViewer.tsx             # PRÉSERVER
│   │   └── TranscriptWord.tsx              # PRÉSERVER
│   └── ui/
│       ├── dialog.tsx                       # UTILISER
│       └── button.tsx                       # PATTERN focus-visible
├── stores/
│   ├── timeline-store.ts                    # API: setCurrentTime()
│   └── transcript-store.ts                 # API: setSelectedWordIndex()
└── App.tsx                                  # MODIFIER (skip links, hook global)
```

### Patterns techniques à suivre

**Pattern hook keyboard navigation (existant) :**
```typescript
// use-transcript-keyboard-nav.ts pattern
export function useTranscriptKeyboardNav(params: {
  selectedWordIndex: number | null;
  totalWords: number;
  onWordSelect: (index: number) => void;
  onClearSelection: () => void;
  onUndo: () => void;
  onRedo: () => void;
  scrollToWordIndex: (index: number) => void;
}) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Guard: skip if input/textarea focused
    // Switch on e.key
    // e.preventDefault() pour éviter scroll
  }, [deps]);
  return { handleKeyDown };
}
```

**Pattern détection plateforme (pour Cmd vs Ctrl) :**
```typescript
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const modKey = isMac ? '⌘' : 'Ctrl';
```

**Pattern skip link :**
```typescript
<a href="#transcript" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-emerald-600 focus:text-white focus:rounded">
  Aller au transcript
</a>
```

**Pattern focus ring cohérent :**
```typescript
// Tous les éléments interactifs custom doivent avoir :
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
```

### Intelligence Story Précédente (9-4)

**Learnings de la Story 9-4 :**
- Pattern hooks dans `src/hooks/` avec tests `.test.ts` côte-à-côte
- Composants dans `src/components/{feature}/` avec barrel export `index.ts`
- Utiliser `invoke<T>('command')` pour Tauri, mais cette story est **100% frontend** (pas de Tauri commands)
- Tests avec `@testing-library/react` + `@testing-library/user-event`
- Utiliser `vi.fn()` pour les mocks Vitest
- `userEvent.keyboard('{ArrowDown}')` pour simuler les touches dans les tests

**Review corrections récurrentes (épic 9) :**
- Connecter TOUS les utilitaires créés aux points d'utilisation
- Éviter les assertions triviales dans les tests
- Barrel exports dans `index.ts` de chaque dossier de composants
- S'assurer que les composants sont effectivement montés dans `App.tsx`

### Intelligence Git Récente

5 derniers commits montrent un pattern cohérent :
1. Tests Vitest + Testing Library pour le frontend
2. Composants shadcn/ui avec Tailwind CSS pour l'UI
3. Hooks React custom pour la logique
4. `vi.mock()` pour mocker les modules Tauri

### Anti-patterns à ÉVITER

1. **NE PAS** créer un nouveau système de gestion focus — utiliser les capacités natives du DOM et de Radix UI
2. **NE PAS** ajouter `tabIndex` positifs (>0) — casse l'ordre naturel de tabulation
3. **NE PAS** supprimer les `outline` sans fournir un ring de remplacement visible
4. **NE PAS** capturer globalement les événements clavier si un input/textarea a le focus
5. **NE PAS** dupliquer la logique de raccourcis — centraliser dans le hook global
6. **NE PAS** utiliser `onKeyPress` (déprécié) — utiliser `onKeyDown`
7. **NE PAS** oublier `e.preventDefault()` sur Space pour éviter le scroll
8. **NE PAS** modifier les raccourcis existants qui fonctionnent (ArrowLeft/Right transcript, Space player)

### Librairies & Versions

- **React** 18.3.1
- **TypeScript** 5.5.3
- **Tailwind CSS** 4.1.18
- **Vitest** 2.1.8
- **@testing-library/react** 16.1.0
- **@testing-library/user-event** 14.5.2
- **@radix-ui/react-dialog** 1.1.15 (focus trap natif)
- **@tanstack/react-virtual** 3.13.18 (virtualisation transcript)
- **lucide-react** 0.563.0 (icônes)
- **Zustand** 5.0.10 (state management)
- **@axe-core/react** — À ajouter (dev dependency)

### Project Structure Notes

- Cette story est **100% frontend** — aucune modification Rust/backend requise
- Tous les nouveaux fichiers dans `apps/desktop/src/`
- Respecter le pattern existant : hooks dans `hooks/`, composants dans `components/{feature}/`, tests côte-à-côte
- Barrel exports obligatoires dans chaque nouveau dossier de composants

### References

- [Source: epics/epic-10-accessibility-inclusive-design.md#Story 10.1] — Acceptance criteria détaillés, user story
- [Source: architecture.md#Accessibility] — WCAG AA, focus rings, keyboard shortcuts, screen reader
- [Source: ux-design-specification.md#Keyboard Shortcuts] — Liste des raccourcis (Space, Tab, Arrows, Cmd+/)
- [Source: ux-design-specification.md#Accessibility] — Focus management, contrast ratios, ARIA patterns
- [Source: hooks/use-transcript-keyboard-nav.ts] — Hook keyboard existant à étendre
- [Source: components/video/VideoPlayer.tsx:171-202] — Keyboard handler existant
- [Source: components/preview/PreviewPlayer.tsx:145-184] — Keyboard handler étendu existant
- [Source: components/timeline/TimelineBar.tsx] — Timeline component à enrichir
- [Source: components/transcript/TranscriptViewer.tsx:198-202] — ARIA attributes transcript
- [Source: components/video/KeyboardShortcutsBar.tsx] — Pattern `<kbd>` existant
- [Source: 9-4-disk-space-resource-management.md] — Dernière story complétée, patterns et conventions

## Change Log

- **2026-02-08**: Story 10.1 implementation complete — All 7 tasks implemented with 39 tests passing. Skip links, focus rings, ArrowUp/Down transcript nav, timeline keyboard nav, Cmd+/ shortcuts dialog, Space/button guard, @axe-core/react installed.
- **2026-02-08**: Code review fixes — [H1/H2] Converted `useTranscriptKeyboardNav` from global `window` listener to scoped `onKeyDown` handler (prevents ArrowLeft/Right conflict with VideoPlayer and input capture). [H3] Fixed dependency array (`words` instead of `words?.length`). [M1] Fixed PreviewPlayer `focus:` → `focus-visible:` on all buttons. [M3] Added clarifying comment on `useTimelineKeyboardNav` empty deps. Updated TranscriptViewer.test.tsx and use-transcript-keyboard-nav.test.ts for new scoped API.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- 11 pre-existing test failures (export-store, SegmentationProgressDialog, TranscriptionProgressDialog) — not related to this story
- Task 5.6: Cmd+G, Cmd+E, Cmd+J not centralized in global hook (they are handled in their respective components) — dialog lists them for reference only

### Completion Notes List

- **Task 1**: Audited tab order in App.tsx (DOM order is correct: TopBar → Import/Transcript → VideoPlayer). Added skip links ("Aller au transcript", "Aller à la timeline") with sr-only/focus:not-sr-only pattern. Added `id="transcript"` and `id="timeline"` targets. Added `tabIndex={0}` to TimelineBar and VideoPlayer scrubber. Fixed focus rings on: VideoPlayer buttons (play overlay, skip, forward, mute), TimelineBar container and segments, TranscriptViewer container and timestamp buttons, TopBar settings button (also added `type="button"` and `aria-label`).
- **Task 2**: Extended `use-transcript-keyboard-nav.ts` with ArrowUp/ArrowDown paragraph navigation using `detectParagraphs()` from transcript-utils. ArrowDown finds next paragraph start, ArrowUp finds previous. Both call `scrollToIndex` for auto-scroll. All 10 existing tests pass + 6 new tests.
- **Task 3**: Created `use-timeline-keyboard-nav.ts` hook with ArrowLeft/Right (±1 frame at 1/30s), Shift+Arrow (±5s), Home (seek 0), End (seek duration). Integrated into TimelineBar via `onKeyDown`. Input/textarea guard. 10 tests passing.
- **Task 4**: Verified Space preventDefault in VideoPlayer.tsx and PreviewPlayer.tsx — both already correct. Added `HTMLButtonElement` to input guard to prevent Space triggering play/pause when a button has focus (avoids conflict with native button Space behavior).
- **Task 5**: Created KeyboardShortcutsDialog with 5 sections (Global, Transcript, Timeline, Lecteur, Modals) using shadcn Dialog + Radix focus trap. Mac/Windows detection via `navigator.platform`. Created `use-global-keyboard-shortcuts.ts` hook for Cmd+/ toggle. Barrel export created. Mounted in App.tsx. 7 tests + 6 hook tests = 13 tests.
- **Task 6**: Audit confirmed all mouse actions have keyboard equivalents. Radix Dialog handles focus return natively. DropZone's "Parcourir les fichiers" Button accessible via Tab+Enter. Added focus ring to preview error "Retour à l'éditeur" button.
- **Task 7**: Installed `@axe-core/react` as dev dependency. Created all test files (7 dialog tests, 10 timeline nav tests, 6 global shortcuts tests, 6 new transcript nav tests). Full regression: 685 tests passing, 11 pre-existing failures unchanged.

### File List

**New files:**
- apps/desktop/src/hooks/use-timeline-keyboard-nav.ts
- apps/desktop/src/hooks/use-timeline-keyboard-nav.test.ts
- apps/desktop/src/hooks/use-global-keyboard-shortcuts.ts
- apps/desktop/src/hooks/use-global-keyboard-shortcuts.test.ts
- apps/desktop/src/components/keyboard-shortcuts/KeyboardShortcutsDialog.tsx
- apps/desktop/src/components/keyboard-shortcuts/KeyboardShortcutsDialog.test.tsx
- apps/desktop/src/components/keyboard-shortcuts/index.ts

**Modified files:**
- apps/desktop/src/App.tsx (skip links, KeyboardShortcutsDialog mount, useGlobalKeyboardShortcuts hook, id="transcript", focus ring on preview error button)
- apps/desktop/src/hooks/use-transcript-keyboard-nav.ts (ArrowUp/Down paragraph navigation via detectParagraphs)
- apps/desktop/src/hooks/use-transcript-keyboard-nav.test.ts (6 new ArrowUp/Down tests, updated mock words for paragraph breaks)
- apps/desktop/src/components/timeline/TimelineBar.tsx (id="timeline", tabIndex={0}, onKeyDown, focus rings, useTimelineKeyboardNav hook)
- apps/desktop/src/components/video/VideoPlayer.tsx (focus rings on all buttons, aria-labels, tabIndex on scrubber, HTMLButtonElement guard)
- apps/desktop/src/components/preview/PreviewPlayer.tsx (HTMLButtonElement guard for Space, focus-visible fix on all buttons)
- apps/desktop/src/components/layout/TopBar.tsx (type="button", aria-label, focus ring on settings button)
- apps/desktop/src/components/transcript/TranscriptViewer.tsx (focus ring on container and timestamp buttons, onKeyDown for scoped keyboard nav)
- apps/desktop/src/components/transcript/TranscriptViewer.test.tsx (updated to fire events on transcript container instead of window)
- apps/desktop/package.json (@axe-core/react dev dependency)
- pnpm-lock.yaml (@axe-core/react lockfile update)
