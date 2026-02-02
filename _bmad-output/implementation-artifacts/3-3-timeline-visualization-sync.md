# Story 3.3: Timeline Visualization & Sync

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'utilisateur,
Je veux voir mes passages de texte sélectionnés visualisés sur une timeline,
Afin de comprendre la structure de ma vidéo éditée en un coup d'oeil.

## Acceptance Criteria

1. **Given** des sélections de texte ont été faites (FR18)
   **When** le composant timeline se rend
   **Then** la timeline affiche la durée totale de la vidéo comme barre horizontale

2. **And** les segments sélectionnés sont affichés comme blocs vert émeraude sur la timeline

3. **And** les segments non-sélectionnés sont affichés en gris ou transparents

4. **And** le survol d'un segment affiche un tooltip avec :
   - Timecodes début/fin
   - Durée du segment
   - Aperçu du texte (50 premiers caractères)

5. **And** cliquer sur un segment de la timeline fait défiler le transcript jusqu'au texte correspondant

6. **And** la timeline est synchronisée avec l'éditeur de transcript (les changements se reflètent immédiatement)

7. **And** la timeline utilise le store Zustand `useTimelineStore` pour la gestion d'état

8. **And** un indicateur de tête de lecture montre la position actuelle (si lecture en cours)

9. **And** la timeline s'adapte de manière responsive à la largeur de la fenêtre (UX-2, UX-3)

## Tasks / Subtasks

- [x] Task 1: Synchroniser le timeline store avec les sélections du transcript store (AC: #6, #7)
  - [x] Créer un hook `useTimelineSync` qui observe `selections` et `transcript` du transcript-store
  - [x] Convertir les `SelectionRange[]` en `TimelineSegment[]` pour le timeline-store
  - [x] Calculer et appeler `setDuration()` depuis la durée totale du transcript (dernier mot `end_time`)
  - [x] Mettre à jour les segments du timeline-store à chaque changement de sélections (<16ms latence)
  - [x] S'assurer que la synchronisation est immédiate (pas de debounce pour les changements visuels)

- [x] Task 2: Créer le composant `TimelineBar` (AC: #1, #2, #3, #9)
  - [x] Créer `apps/desktop/src/components/timeline/TimelineBar.tsx`
  - [x] Barre horizontale pleine largeur, hauteur 48-64px, fond `bg-muted` (gris sombre)
  - [x] Segments sélectionnés : blocs `bg-emerald-600` positionnés proportionnellement (startTime/duration * 100%)
  - [x] Segments non-sélectionnés : fond gris/transparent par défaut
  - [x] Border-radius 3-4px sur les segments
  - [x] Responsive : utiliser `useRef` + `ResizeObserver` ou `%` CSS pour adapter à la largeur
  - [x] Transitions douces : `transition-all duration-200` sur les segments

- [x] Task 3: Implémenter les tooltips de survol (AC: #4)
  - [x] Au survol d'un segment vert, afficher un tooltip positionné au-dessus
  - [x] Contenu tooltip : timecodes début/fin (format MM:SS), durée du segment, aperçu texte (50 premiers caractères des mots du segment)
  - [x] Utiliser le composant `Tooltip` de shadcn/ui (déjà installé)
  - [x] Extraire le texte des mots correspondants depuis le transcript-store (plage startWordIndex → endWordIndex)
  - [x] Formater les timecodes avec une fonction utilitaire `formatTimecode(seconds: number): string`

- [x] Task 4: Implémenter le clic segment → scroll transcript (AC: #5)
  - [x] Au clic sur un segment de la timeline, identifier le `startWordIndex` du segment
  - [x] Appeler une callback `onSegmentClick(startWordIndex: number)` passée au composant
  - [x] Dans `TranscriptViewer`, implémenter `scrollToWord(wordIndex: number)` en utilisant le virtualizer
  - [x] Scroll smooth vers le paragraphe contenant le mot ciblé
  - [x] Optionnel : flash highlight temporaire du mot ciblé pour confirmation visuelle

- [x] Task 5: Implémenter l'indicateur de tête de lecture (AC: #8)
  - [x] Ligne verticale fine (2px) blanche/claire positionnée à `currentTime/duration * 100%`
  - [x] Positionnement absolu sur la TimelineBar
  - [x] Utiliser `currentTime` du timeline-store
  - [x] Petit cercle/handle en haut (12px, blanc avec ombre) pour drag futur (Phase 4)
  - [x] Animation smooth : `transition-left duration-100` pour éviter saccades
  - [x] Masquer si `duration === 0` (pas de vidéo chargée)

- [x] Task 6: Intégrer la timeline dans App.tsx (AC: #1, #6)
  - [x] Ajouter le composant `TimelineBar` dans le layout éditeur de App.tsx
  - [x] Positionner sous le `TranscriptViewer` (layout flex-col, timeline en bas)
  - [x] Initialiser `useTimelineSync` dans App.tsx ou dans un composant wrapper
  - [x] Passer la callback `onSegmentClick` pour le scroll vers le transcript
  - [x] Créer barrel export `apps/desktop/src/components/timeline/index.ts`

- [x] Task 7: Tests unitaires du hook useTimelineSync (AC: #6, #7)
  - [x] Test : sélections vides → segments vides dans timeline-store
  - [x] Test : 1 sélection → 1 segment vert dans timeline-store
  - [x] Test : 3 sélections → 3 segments avec positions correctes
  - [x] Test : changement de sélection → segments mis à jour immédiatement
  - [x] Test : durée calculée correctement depuis le dernier mot du transcript
  - [x] Test : pas de crash si transcript est null

- [x] Task 8: Tests composant TimelineBar (AC: #1, #2, #3, #4, #5, #8, #9)
  - [x] Test : rendu barre horizontale avec durée totale
  - [x] Test : segments verts positionnés correctement (calcul %)
  - [x] Test : tooltip affiché au survol avec contenu correct
  - [x] Test : clic sur segment déclenche callback avec bon wordIndex
  - [x] Test : tête de lecture positionnée selon currentTime
  - [x] Test : tête de lecture masquée si duration === 0
  - [x] Test : responsive (resize n'entraîne pas de crash)

## Dev Notes

### Ce qui existe déjà

**Timeline Store** (`apps/desktop/src/stores/timeline-store.ts`) :
- Store Zustand fonctionnel avec : `currentTime`, `duration`, `isPlaying`, `segments`
- Actions : `setCurrentTime`, `setDuration`, `togglePlayback`, `setSegments`, `addSegment`
- Validation intégrée (clamp time, reject negative duration)
- Devtools middleware activé

**Transcript Store** (`apps/desktop/src/stores/transcript-store.ts`) :
- `selections: SelectionRange[]` — ranges contigus avec timestamps (startTime, endTime, startWordIndex, endWordIndex)
- `selectedWordIndices: number[]` — indices des mots sélectionnés
- `transcript: Transcript | null` — contient les `words: TranscriptWord[]` avec `start_time`, `end_time`, `text`
- Undo/redo, auto-save 30s, persistance SQLite
- Fonction utilitaire `indicesToSelections()` pour conversion indices → ranges

**Composant Tooltip shadcn/ui** : déjà installé et disponible (`@/components/ui/tooltip`)

**TranscriptViewer** (`apps/desktop/src/components/transcript/TranscriptViewer.tsx`) :
- Virtualisation avec `@tanstack/react-virtual`
- Organise les mots en paragraphes via `detectParagraphs()`
- Ref vers le virtualizer accessible pour scroll programmatique

### Ce qui doit être créé dans cette story

1. **Hook `useTimelineSync`** (NOUVEAU) : Pont entre transcript-store et timeline-store
2. **Composant `TimelineBar`** (NOUVEAU) : Visualisation horizontale des segments
3. **Fonction utilitaire `formatTimecode`** (NOUVEAU) : Formatage MM:SS
4. **Intégration App.tsx** (MODIFICATION) : Ajout timeline dans le layout éditeur
5. **Méthode scroll dans TranscriptViewer** (MODIFICATION) : `scrollToWord` via ref exposée ou callback

### Architecture du hook useTimelineSync

```typescript
// apps/desktop/src/hooks/use-timeline-sync.ts
import { useEffect } from 'react';
import { useTranscriptStore } from '@/stores/transcript-store';
import { useTimelineStore } from '@/stores/timeline-store';

export function useTimelineSync() {
  const selections = useTranscriptStore((s) => s.selections);
  const transcript = useTranscriptStore((s) => s.transcript);
  const setSegments = useTimelineStore((s) => s.setSegments);
  const setDuration = useTimelineStore((s) => s.setDuration);

  useEffect(() => {
    if (!transcript?.words?.length) {
      setSegments([]);
      setDuration(0);
      return;
    }

    // Durée totale = end_time du dernier mot
    const lastWord = transcript.words[transcript.words.length - 1];
    setDuration(lastWord.end_time);

    // Convertir SelectionRange[] → TimelineSegment[]
    const segments = selections.map((sel) => ({
      id: sel.id,
      startTime: sel.startTime,
      endTime: sel.endTime,
      selected: true,
    }));

    setSegments(segments);
  }, [selections, transcript, setSegments, setDuration]);
}
```

### Data Flow — Timeline Sync

```
TRANSCRIPT STORE (source de vérité)
  selections: SelectionRange[] ←→ auto-save SQLite 30s
  transcript.words: TranscriptWord[]
        ↓ (useTimelineSync observe via useEffect)
TIMELINE STORE (dérivé)
  segments: TimelineSegment[] (copie transformée des selections)
  duration: number (end_time du dernier mot)
  currentTime: number (position lecture, Story 5.x)
        ↓
TIMELINE BAR (composant visuel)
  Segments verts positionnés en % de la durée
  Tooltip au survol
  Clic → callback → scroll transcript
```

### Calcul de positionnement des segments

```typescript
// Pour chaque segment dans TimelineBar :
const leftPercent = (segment.startTime / duration) * 100;
const widthPercent = ((segment.endTime - segment.startTime) / duration) * 100;

// Style : position absolute, left: leftPercent%, width: widthPercent%
```

### Scroll vers le transcript

Le `TranscriptViewer` utilise `@tanstack/react-virtual`. Pour scroller vers un mot :

```typescript
// Option 1: Exposer via ref (useImperativeHandle)
// Option 2: Callback passée en prop

// Le virtualizer a une méthode scrollToIndex()
// Il faut trouver l'index du paragraphe contenant le mot ciblé
// puis appeler virtualizer.scrollToIndex(paragraphIndex)
```

**Approche recommandée** : Ajouter une prop `scrollToWordIndex` au TranscriptViewer. Quand cette prop change, le composant calcule le paragraphe correspondant et scroll.

### Conventions de code

- TypeScript : `camelCase` fonctions/variables, `PascalCase` composants/types
- Stores Zustand : suffixe `Store`, pattern `create<Interface>()(devtools(...))`
- Tests co-localisés : `*.test.ts` / `*.test.tsx` dans le même répertoire
- Hooks custom : préfixe `use` + `camelCase`
- Composants React : `PascalCase` (fichiers ET noms)
- Couleur sélection : `bg-emerald-500/30` (mots), `bg-emerald-600` (segments timeline)

### Couleurs et visuels (UX Consistency Patterns)

- Segments sélectionnés : `bg-emerald-600` (timeline), `bg-emerald-500/30` (mots transcript)
- Fond timeline : `bg-muted` ou fond sombre tertiaire
- Tête de lecture : ligne blanche 2px, handle blanc 12px avec ombre
- Hover segment : lighten background, tooltip au-dessus
- Transitions : `transition-all duration-200`

### Fichiers à créer

- `apps/desktop/src/components/timeline/TimelineBar.tsx` — Composant principal
- `apps/desktop/src/components/timeline/TimelineBar.test.tsx` — Tests composant
- `apps/desktop/src/components/timeline/index.ts` — Barrel export
- `apps/desktop/src/hooks/use-timeline-sync.ts` — Hook de synchronisation
- `apps/desktop/src/hooks/use-timeline-sync.test.ts` — Tests hook
- `apps/desktop/src/lib/format-timecode.ts` — Utilitaire formatage (si pas déjà existant)

### Fichiers à modifier

- `apps/desktop/src/App.tsx` — Ajouter TimelineBar dans le layout éditeur + initialiser useTimelineSync
- `apps/desktop/src/components/transcript/TranscriptViewer.tsx` — Ajouter capacité scrollToWord (prop ou ref)

### Fichiers à ne PAS modifier

- `apps/desktop/src/stores/timeline-store.ts` — Déjà fonctionnel, l'interface suffit
- `apps/desktop/src/stores/transcript-store.ts` — Source de vérité, pas de changement
- Backend Rust — Aucune modification requise
- Migration SQL — Aucun changement de schéma

### Project Structure Notes

- Nouveau dossier `components/timeline/` cohérent avec `components/transcript/`
- Hook `use-timeline-sync.ts` dans `hooks/` (pattern établi avec `use-transcript-keyboard-nav.ts`)
- Barrel export `index.ts` dans le dossier timeline (pattern établi `components/transcript/index.ts`)
- Pas de nouveau store nécessaire (timeline-store existe déjà)

### References

- [Epic 3: Content Selection & Editing](_bmad-output/planning-artifacts/epics/epic-3-content-selection-editing.md) — Story 3.3 AC complets
- [Story 3.2: De-Selection & Selection Management](_bmad-output/implementation-artifacts/3-2-de-selection-selection-management.md) — Contexte sélections, undo/redo, patterns établis
- [Story 3.1: Text Selection & Highlighting](_bmad-output/implementation-artifacts/3-1-text-selection-highlighting.md) — Infrastructure sélection existante
- [Architecture: Patterns d'Implémentation](_bmad-output/planning-artifacts/architecture/patterns-dimplmentation-rgles-de-cohrence.md) — Conventions naming, structure tests
- [UX Consistency Patterns](_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md) — Timeline interactions, tooltip, hover states, couleurs
- `apps/desktop/src/stores/timeline-store.ts` — Store timeline existant
- `apps/desktop/src/stores/transcript-store.ts` — Store transcript (source de vérité sélections)
- `apps/desktop/src/components/transcript/TranscriptViewer.tsx` — Virtualisation, scroll programmatique
- `apps/desktop/src/components/ui/tooltip.tsx` — Composant Tooltip shadcn/ui

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- ✅ Task 1: Created `useTimelineSync` hook — syncs transcript selections to timeline segments via useEffect, no debounce, immediate updates
- ✅ Task 2: Created `TimelineBar` component — 48px horizontal bar, emerald segments positioned with CSS %, responsive via percentage layout, transitions 200ms
- ✅ Task 3: Tooltips implemented using shadcn/ui Tooltip — shows start/end timecodes (MM:SS), segment duration, 50-char text preview
- ✅ Task 4: Segment click → scroll transcript via `scrollToWordIndex` prop on TranscriptViewer, uses existing virtualizer.scrollToIndex with smooth scroll
- ✅ Task 5: Playhead indicator — 2px white line + 12px circle handle, positioned at currentTime/duration %, hidden when duration=0 or currentTime=0
- ✅ Task 6: Integrated TimelineBar below TranscriptViewer in App.tsx editor screen, initialized useTimelineSync, barrel export created
- ✅ Task 7: 6 unit tests for useTimelineSync — all passing (empty selections, 1 selection, 3 selections, immediate update, duration calculation, null transcript)
- ✅ Task 8: 7 component tests for TimelineBar — all passing (render, segment positioning, click callback, playhead position, playhead hidden states, no segments)
- ℹ️ Pre-existing test failures in use-model-download.test.ts (5) and TranscriptionProgressDialog.test.tsx (2) — not related to this story

### Change Log

- 2026-02-02: Implemented Story 3.3 — Timeline Visualization & Sync. 13 new tests, all passing. No regressions introduced.
- 2026-02-02: Code review fixes — H1: scrollToWordIndex reset for repeated clicks, H2: memoized getTextPreview, H3: tooltip content test added, M2: formatTimecode supports HH:MM:SS for videos >60min, M3: 7 formatTimecode unit tests added. Total: 21 tests passing.

### File List

**New Files:**
- `apps/desktop/src/hooks/use-timeline-sync.ts` — Hook synchronizing transcript selections to timeline store
- `apps/desktop/src/hooks/use-timeline-sync.test.ts` — 6 unit tests for the sync hook
- `apps/desktop/src/components/timeline/TimelineBar.tsx` — Timeline visualization component with segments, tooltips, playhead
- `apps/desktop/src/components/timeline/TimelineBar.test.tsx` — 8 component tests (incl. tooltip content verification)
- `apps/desktop/src/components/timeline/index.ts` — Barrel export
- `apps/desktop/src/lib/format-timecode.ts` — MM:SS/HH:MM:SS timecode formatter utility
- `apps/desktop/src/lib/format-timecode.test.ts` — 7 unit tests for formatTimecode

**Modified Files:**
- `apps/desktop/src/App.tsx` — Added TimelineBar, useTimelineSync, scrollToWordIndex state in editor screen
- `apps/desktop/src/components/transcript/TranscriptViewer.tsx` — Added scrollToWordIndex prop + useEffect for external scroll trigger
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Story status updated
