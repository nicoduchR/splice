# Story 3.4: Selection Statistics & Feedback

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'utilisateur,
Je veux voir les statistiques de mes sélections,
Afin de savoir combien de contenu je conserve et la durée finale estimée de la vidéo.

## Acceptance Criteria

1. **Given** l'utilisateur a fait des sélections
   **When** les sélections changent
   **Then** le panneau de statistiques affiche :
   - Durée totale de la vidéo originale : "45:30"
   - Durée totale sélectionnée : "12:45"
   - Pourcentage de réduction : "71% réduction"
   - Nombre de segments : "23 segments"
   - Durée estimée de la vidéo finale

2. **And** les statistiques se mettent à jour en temps réel quand les sélections changent

3. **And** code couleur appliqué :
   - Vert (`text-emerald-400`) si >50% réduction
   - Jaune (`text-yellow-400`) si 20-50% réduction
   - Gris (`text-muted-foreground`) si <20% réduction

4. **And** les statistiques aident l'utilisateur à évaluer sa progression d'édition

5. **And** le bouton "Générer les cuts" est désactivé si aucune sélection n'a été faite

## Tasks / Subtasks

- [x] Task 1: Créer le composant `SelectionStats` (AC: #1, #2, #3)
  - [x] Créer `apps/desktop/src/components/transcript/SelectionStats.tsx`
  - [x] Lire `segments` et `duration` depuis `useTimelineStore`
  - [x] Calculer : durée sélectionnée (somme endTime - startTime de chaque segment), % réduction, nombre de segments
  - [x] Afficher les stats avec `formatTimecode` existant (`apps/desktop/src/lib/format-timecode.ts`)
  - [x] Appliquer le code couleur conditionnel sur le % réduction
  - [x] Mémoriser les calculs avec `useMemo` pour éviter recalculs inutiles
  - [x] Afficher un état vide discret quand aucune sélection ("Aucune sélection")

- [x] Task 2: Remplacer le "selection pill" existant dans la toolbar (AC: #1, #2, #4)
  - [x] Dans `TranscriptViewerToolbar.tsx`, remplacer le `selectionInfo` pill (lignes 49-58, 85-89) par le composant `SelectionStats`
  - [x] S'assurer que le composant s'intègre visuellement dans la toolbar existante (même hauteur, même espacement)
  - [x] Supprimer le code `selectionInfo` useMemo devenu inutile

- [x] Task 3: Implémenter le bouton "Générer les cuts" conditionnel (AC: #5)
  - [x] Dans `TopBar.tsx`, le callback `onGenerateCuts` est déjà câblé depuis `App.tsx`
  - [x] Passer un prop `hasSelections` au `TopBar` pour activer/désactiver le bouton
  - [x] Le bouton doit être `disabled` quand `hasSelections === false`
  - [x] Visual feedback : apparence grisée quand désactivé

- [x] Task 4: Tests unitaires du composant SelectionStats (AC: #1, #2, #3)
  - [x] Test : aucune sélection → affiche état vide
  - [x] Test : 1 segment → affiche stats correctes (durée, %, nombre)
  - [x] Test : >50% réduction → classe couleur vert emerald
  - [x] Test : 20-50% réduction → classe couleur jaune
  - [x] Test : <20% réduction → classe couleur gris
  - [x] Test : mise à jour quand segments changent (re-render)
  - [x] Test : durée formatée correctement (utilise formatTimecode)

## Dev Notes

### Ce qui existe déjà

**Timeline Store** (`apps/desktop/src/stores/timeline-store.ts`) :
- `segments: TimelineSegment[]` — segments synchronisés depuis les sélections du transcript (via `useTimelineSync`)
- `duration: number` — durée totale de la vidéo (en secondes)
- Ces données sont la source dérivée pour calculer toutes les statistiques

**Selection pill existant** dans `TranscriptViewerToolbar.tsx` (lignes 49-58, 85-89) :
- Calcule déjà `segments.length` et la durée totale sélectionnée
- Affiche un pill `{count} passage(s) • {mins}min {secs}s`
- Ce code sera remplacé par le composant `SelectionStats` plus complet

**`formatTimecode`** (`apps/desktop/src/lib/format-timecode.ts`) :
- Déjà créé en Story 3.3
- Supporte MM:SS et HH:MM:SS (pour vidéos >60min)
- 7 tests existants

**TopBar** (`apps/desktop/src/components/layout/TopBar.tsx`) :
- Reçoit déjà `onGenerateCuts` callback (actuellement TODO)
- Le bouton "Générer les cuts" existe déjà visuellement (à vérifier dans TopBar)

**Transcript Store** (`apps/desktop/src/stores/transcript-store.ts`) :
- `selections: SelectionRange[]` avec `startTime`, `endTime`
- Peut aussi être utilisé directement comme alternative au timeline store

### Logique de calcul des statistiques

```typescript
// Toutes les données viennent du timeline store (déjà synchronisé)
const segments = useTimelineStore((s) => s.segments);
const duration = useTimelineStore((s) => s.duration);

// Calculs
const selectedDuration = segments.reduce(
  (sum, seg) => sum + (seg.endTime - seg.startTime), 0
);
const reductionPercent = duration > 0
  ? Math.round(((duration - selectedDuration) / duration) * 100)
  : 0;
const segmentCount = segments.length;
const estimatedFinalDuration = selectedDuration; // La durée sélectionnée EST la durée finale
```

### Code couleur

```typescript
function getReductionColor(percent: number): string {
  if (percent > 50) return 'text-emerald-400';
  if (percent >= 20) return 'text-yellow-400';
  return 'text-muted-foreground';
}
```

### Placement dans le layout

Le composant `SelectionStats` remplace le pill existant dans la toolbar. Il doit rester compact (une ligne) pour ne pas perturber le layout toolbar. Format suggéré :

```
[icône] 23 segments • 12:45 sélectionné sur 45:30 • 71% réduction
```

Ou en version compacte si l'espace est limité :
```
23 seg • 12:45 / 45:30 • 71% ↓
```

### Conventions de code

- TypeScript : `camelCase` fonctions/variables, `PascalCase` composants/types
- Composants React : `PascalCase` (fichiers ET noms)
- Tests co-localisés : `*.test.tsx` dans le même répertoire
- Couleur sélection : cohérence avec `text-emerald-400` / `bg-emerald-500/30` établis
- Utiliser `React.memo` si le composant re-render fréquemment sans changement

### Fichiers à créer

- `apps/desktop/src/components/transcript/SelectionStats.tsx` — Composant statistiques
- `apps/desktop/src/components/transcript/SelectionStats.test.tsx` — Tests composant

### Fichiers à modifier

- `apps/desktop/src/components/transcript/TranscriptViewerToolbar.tsx` — Remplacer le pill par SelectionStats
- `apps/desktop/src/components/transcript/index.ts` — Ajouter export SelectionStats (si nécessaire)
- `apps/desktop/src/components/layout/TopBar.tsx` — Ajouter prop `hasSelections` pour désactiver bouton cuts
- `apps/desktop/src/App.tsx` — Passer `hasSelections` au TopBar

### Fichiers à ne PAS modifier

- `apps/desktop/src/stores/timeline-store.ts` — Source de données, pas de changement
- `apps/desktop/src/stores/transcript-store.ts` — Source de vérité, pas de changement
- `apps/desktop/src/hooks/use-timeline-sync.ts` — Synchronisation existante, pas de changement
- `apps/desktop/src/lib/format-timecode.ts` — Utilitaire existant, réutiliser tel quel
- Backend Rust — Aucune modification requise

### Project Structure Notes

- `SelectionStats.tsx` dans `components/transcript/` car fait partie de l'expérience éditeur/transcript
- Pattern cohérent avec les composants existants dans ce dossier (TranscriptViewer, TranscriptViewerToolbar)
- Pas de nouveau store nécessaire — toutes les données existent déjà

### Apprentissages de la Story 3.3

- Le timeline store est déjà synchronisé via `useTimelineSync` — pas besoin de recalculer depuis le transcript store
- `formatTimecode` supporte HH:MM:SS pour vidéos longues — l'utiliser pour les durées
- Le pattern `React.memo` + `useMemo` est établi dans la toolbar — le suivre
- Les tests de composants utilisent vitest + @testing-library/react

### Git Intelligence

Derniers commits pertinents :
- `1353b34` feat: implement undo/redo functionality in transcript store
- `d5165b0` feat: text selection & highlighting with persistence (Story 3.1)
- Pattern : commits avec préfixe `feat:` / `fix:` / `chore:`

### References

- [Epic 3: Content Selection & Editing](_bmad-output/planning-artifacts/epics/epic-3-content-selection-editing.md) — Story 3.4 AC complets
- [Story 3.3: Timeline Visualization & Sync](_bmad-output/implementation-artifacts/3-3-timeline-visualization-sync.md) — Infrastructure timeline, formatTimecode, patterns établis
- [Architecture: Patterns d'Implémentation](_bmad-output/planning-artifacts/architecture/patterns-dimplmentation-rgles-de-cohrence.md) — Conventions naming, structure tests
- [UX: Core User Experience](_bmad-output/planning-artifacts/ux-design-specification/core-user-experience.md) — Synchronisation temps réel, feedback instantané
- `apps/desktop/src/stores/timeline-store.ts` — Store timeline (source segments + duration)
- `apps/desktop/src/components/transcript/TranscriptViewerToolbar.tsx` — Toolbar existante avec pill à remplacer
- `apps/desktop/src/lib/format-timecode.ts` — Utilitaire formatage timecodes

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

Aucun problème de debug rencontré.

### Completion Notes List

- Task 1+4: Créé `SelectionStats.tsx` avec `React.memo` + `useMemo`, lecture du timeline store, calcul stats (durée sélectionnée, % réduction, nombre segments), code couleur conditionnel (emerald >50%, yellow 20-50%, grey <20%), état vide "Aucune sélection". 7 tests unitaires passent.
- Task 2: Remplacé le pill `selectionInfo` dans `TranscriptViewerToolbar.tsx` par `<SelectionStats />`. Supprimé le `useMemo` selectionInfo et les imports inutiles (`useMemo`, `useTimelineStore`).
- Task 3: Ajouté prop `hasSelections` au `TopBar`, passé depuis `App.tsx` via `useTimelineStore.segments.length > 0`. Bouton "Générer les cuts" désactivé quand aucune sélection.
- 44 tests passent dans les composants modifiés, aucune régression introduite.
- 2 fichiers de tests pré-existants en échec (`use-model-download.test.ts`, `TranscriptionProgressDialog.test.tsx`) — non liés à cette story.
- **[Code Review Fix]** Ajout affichage "durée estimée vidéo finale" (AC #1 manquant). Ajout test boundary `duration === 0`. Ajout test durée finale. Suppression variable `rerender` inutilisée. 9 tests passent.

### Change Log

- 2026-02-02: Implémentation complète Story 3.4 — SelectionStats, intégration toolbar, bouton cuts conditionnel, 7 tests
- 2026-02-02: Code review fix — ajout durée finale estimée (AC #1), test duration=0, test durée finale, cleanup rerender inutilisé. 9 tests.

### File List

- `apps/desktop/src/components/transcript/SelectionStats.tsx` — Nouveau composant statistiques sélection
- `apps/desktop/src/components/transcript/SelectionStats.test.tsx` — Tests unitaires (9 tests)
- `apps/desktop/src/components/transcript/TranscriptViewerToolbar.tsx` — Modifié: remplacé pill par SelectionStats
- `apps/desktop/src/components/transcript/index.ts` — Modifié: ajout export SelectionStats
- `apps/desktop/src/components/layout/TopBar.tsx` — Modifié: ajout prop hasSelections, bouton disabled
- `apps/desktop/src/App.tsx` — Modifié: lecture segments timeline, passage hasSelections au TopBar
