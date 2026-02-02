# Story 4.2: Cut Generation Frontend Wiring

Status: pending

## Story

En tant qu'utilisateur,
Je veux que le bouton "Générer les cuts" déclenche effectivement la génération backend et me donne un retour visuel,
Afin que je sache que mes sélections ont été converties en segments vidéo.

## Acceptance Criteria

1. **Given** l'utilisateur a des sélections surlignées et clique sur "Générer les cuts"
   **When** le bouton est cliqué
   **Then** la commande Tauri `generate_cuts` est invoquée avec le `project_id` courant

2. **And** pendant le traitement, le bouton affiche un état de chargement (disabled + spinner ou texte)

3. **And** en cas de succès, un toast de confirmation s'affiche avec le nombre de cuts générés (ex: "5 cuts générés avec succès")

4. **And** en cas d'erreur, un toast d'erreur s'affiche avec le message

5. **And** les cuts retournés sont stockés dans un state accessible (store ou state local)

6. **And** la commande `get_cuts` permet de recharger les cuts au retour sur l'éditeur

## Tasks / Subtasks

- [ ] Task 1: Connecter le callback `onGenerateCuts` dans `App.tsx` (AC: #1)
  - [ ] Remplacer le TODO par un appel `invoke('generate_cuts', { projectId })`
  - [ ] Gérer le state de chargement (loading boolean)
  - [ ] Passer le loading state au bouton TopBar pour le désactiver pendant le traitement

- [ ] Task 2: Feedback utilisateur — toast succès/erreur (AC: #2, #3, #4)
  - [ ] Toast succès avec nombre de cuts : `toast.success(\`${cuts.length} cuts générés\`)`
  - [ ] Toast erreur en cas d'échec : `toast.error(errorMessage)`
  - [ ] Bouton en état loading pendant l'appel

- [ ] Task 3: Stocker les cuts côté frontend (AC: #5)
  - [ ] Option A : state local dans App.tsx (`useState<Cut[]>`)
  - [ ] Option B : nouveau store zustand si les cuts doivent être partagés entre composants
  - [ ] Décision : state local suffit pour cette story, un store dédié viendra avec la story 4.3 (UI preview)

- [ ] Task 4: Charger les cuts existants au montage de l'éditeur (AC: #6)
  - [ ] Appeler `invoke('get_cuts', { projectId })` quand l'écran editor se monte
  - [ ] Stocker le résultat dans le même state que Task 3

## Dev Notes

### Ce qui existe déjà

- **Bouton** : `TopBar.tsx` — bouton "Générer les cuts" avec prop `onGenerateCuts` et `hasSelections`
- **Callback TODO** : `App.tsx:244` — `onGenerateCuts={() => { /* TODO: implement generate cuts */ }}`
- **Backend** : Commandes Tauri `generate_cuts`, `get_cuts`, `clear_cuts` enregistrées dans `main.rs`
- **Type TS** : `Cut` exporté depuis `@splice/types/generated`
- **Toast** : `sonner` déjà utilisé dans l'app (import `toast` dans `App.tsx`)
- **invoke** : `@tauri-apps/api/core` déjà utilisé dans les stores existants

### Pattern d'invocation Tauri (référence)

```typescript
import { invoke } from '@tauri-apps/api/core';
import type { Cut } from '@splice/types/generated';

const cuts = await invoke<Cut[]>('generate_cuts', { projectId: currentProject.id });
```

### Fichiers à modifier

- `apps/desktop/src/App.tsx` — connecter le callback, gérer loading + toast
- `apps/desktop/src/components/layout/TopBar.tsx` — ajouter prop `isGenerating` pour état loading du bouton

### Fichiers à ne PAS modifier

- Backend Rust (tout est déjà prêt depuis Story 4.1)
- `packages/types/` (type `Cut` déjà généré)
- Stores existants (transcript-store, timeline-store, video-store)

### Dépendances

- Story 4.1 (Cut Generation Backend Logic) — **DONE**

### Complexité

Petite story de wiring — pas de logique métier, juste connecter le frontend au backend existant.

### Références

- [Story 4.1: Cut Generation Backend Logic](_bmad-output/implementation-artifacts/4-1-cut-generation-backend-logic.md)
- `apps/desktop/src-tauri/src/infrastructure/tauri_commands/cut_commands.rs` — commandes backend
- `apps/desktop/src/components/layout/TopBar.tsx` — bouton existant
