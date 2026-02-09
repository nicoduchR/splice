# Story 10.4: Responsive Text & Scalability

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user who needs larger text,
I want the interface to scale properly when I zoom,
so that I can read all content comfortably.

## Acceptance Criteria

1. **Given** WCAG AA scalability requirements (UX-9) **When** le développeur inspecte les font-sizes **Then** TOUTES les tailles de police sont définies en unités `rem` (pas `px`) :
   - Remplacer les `text-[10px]` (6 instances) et `text-[11px]` (2 instances) par des classes Tailwind standards (`text-xs` minimum = 0.75rem = 12px)
   - Vérifier que le `font-size` de base sur `html` est à 16px (1rem) dans `index.css`
   - **Minimum font size** : 14px (0.875rem) — `text-xs` (12px) toléré uniquement pour éléments décoratifs non-informatifs (badges `<kbd>`)
   **And** aucun `fontSize` en `px` n'existe dans les inline styles ou CSS custom.

2. **Given** l'utilisateur qui zoome l'interface à 200% **When** le layout est rendu **Then** la mise en page reste fonctionnelle sans défilement horizontal :
   - Le contenu s'adapte (reflow) au lieu de déborder
   - Les `max-w-[XXXpx]` des modals/dialogs sont convertis en `max-w-*` Tailwind relatifs ou `max-w-[XXrem]` là où pertinent
   - Le split 60%/40% (transcript/player) dans `App.tsx` reste fonctionnel à 200% zoom
   - Les éléments avec `overflow-hidden` ne masquent pas de contenu textuel critique
   - Les éléments tronqués (`truncate` + `max-w-[XXXpx]`) restent lisibles (tooltips au minimum)
   **And** aucun texte n'est coupé ou inaccessible.

3. **Given** WCAG AA line-height minimum **When** le texte du body est affiché **Then** le line-height est minimum 1.5 pour le texte courant :
   - Définir `line-height: 1.5` globalement sur `body` dans `index.css`
   - Vérifier que les `leading-tight` et `leading-none` ne sont utilisés que pour titres/labels courts (jamais pour blocs de texte continu)
   - Le transcript (texte principal de l'app) utilise `leading-relaxed` (1.625) ou `leading-7` (1.75rem)
   **And** le spacing entre éléments interactifs est minimum 8px (0.5rem).

4. **Given** les touch targets à 200% zoom **When** l'interface est zoomée à 200% **Then** les zones cliquables restent minimum 44x44px :
   - Les boutons conservent `min-h-[44px]` (déjà en place via button.tsx)
   - Les éléments interactifs inline (mots transcript, liens) ont suffisamment de padding
   - L'espacement entre boutons adjacents est minimum 8px (0.5rem)
   **And** aucune zone interactive ne devient inaccessible au zoom 200%.

5. **Given** les breakpoints responsifs **When** la fenêtre est redimensionnée avec zoom **Then** les breakpoints fonctionnent correctement :
   - Les media queries `sm:`, `md:`, `lg:` continuent de s'appliquer logiquement
   - L'ajout de `@media (prefers-reduced-motion: reduce)` désactive les animations non essentielles
   - Les décorateurs (blur backgrounds App.tsx) ne créent pas de problèmes visuels à 200% zoom
   **And** l'interface est testée à 100%, 150% et 200% zoom.

## Tasks / Subtasks

- [x] Task 1 — Audit et correction des font-sizes en px arbitraires (AC: #1)
  - [x] 1.1 Remplacer `text-[10px]` par `text-xs` (0.75rem) dans :
    - `KeyboardShortcutsBar.tsx` (lignes 7, 11, 15, 16) — 4 instances `<kbd>` badges
    - `KeyboardShortcutsDialog.tsx` (ligne 113) — 1 instance `<kbd>` badge
    - `PreviewPlayer.tsx` (ligne 289) — 1 instance tooltip timecode
  - [x] 1.2 Remplacer `text-[11px]` par `text-xs` (0.75rem) dans :
    - `TranscriptionProgressDialog.tsx` (ligne 244) — 1 instance label
    - `TranscriptionScreen.tsx` (ligne 255) — 1 instance label
  - [x] 1.3 Vérifier/ajouter `font-size: 16px` (ou `100%`) sur `html` dans `index.css` pour garantir la base rem
  - [x] 1.4 Scanner tout le projet pour d'autres `text-[XXpx]` arbitraires et corriger

- [x] Task 2 — Line-height et espacement global (AC: #3)
  - [x] 2.1 Ajouter `line-height: 1.5` sur `body` dans `index.css`
  - [x] 2.2 Auditer les utilisations de `leading-none` et `leading-tight` — s'assurer qu'elles ne sont PAS appliquées sur du texte continu (paragraphes, descriptions)
  - [x] 2.3 Vérifier que le TranscriptViewer utilise `leading-relaxed` ou équivalent (line-height >= 1.5)
  - [x] 2.4 Vérifier l'espacement minimum 8px (gap-2 / space-y-2) entre éléments interactifs adjacents

- [x] Task 3 — Conversion des largeurs fixes en unités relatives (AC: #2)
  - [x] 3.1 Convertir les `max-w-[XXXpx]` critiques des modals en classes Tailwind ou rem :
    - `max-w-[800px]` → `max-w-4xl` (896px, légèrement plus large, OK)
    - `max-w-[680px]` → `max-w-2xl` (672px) ou garder en rem `max-w-[42.5rem]`
    - `max-w-[580px]` → `max-w-xl` (576px) ou `max-w-[36.25rem]`
    - `max-w-[540px]` → `max-w-xl` (576px)
    - `max-w-[520px]` → `max-w-xl` (576px)
    - `max-w-[480px]` → `max-w-lg` (512px) ou `max-w-[30rem]`
  - [x] 3.2 Convertir les `min-w-[XXXpx]` des boutons en rem :
    - `min-w-[220px]` → `min-w-[13.75rem]`
    - `min-w-[140px]` → `min-w-[8.75rem]`
    - `min-w-[120px]` → `min-w-[7.5rem]`
    - `min-w-[84px]` → `min-w-[5.25rem]`
  - [x] 3.3 Convertir le `max-w-[260px]` et `max-w-[200px]` de truncation en rem
  - [x] 3.4 Convertir les `w-[200px]` (progress bar DropZone) en classes Tailwind (`w-48` ou `w-52`)
  - [x] 3.5 Vérifier que les décorateurs blur (`w-[600px]`, `w-[400px]` dans App.tsx) ne débordent pas — ces éléments sont `absolute` + décoratifs, impact minimal mais vérifier

- [x] Task 4 — Validation zoom 200% et reflow (AC: #2, #4, #5)
  - [x] 4.1 Tester manuellement l'interface à 100%, 150%, 200% zoom dans Tauri/navigateur :
    - Écran import (DropZone) : vérifier que le texte reflue, bouton accessible
    - Écran transcription : vérifier que le transcript scrolle sans débordement horizontal
    - Modals (Export, Settings, Progress) : vérifier qu'ils ne débordent pas de l'écran
    - TopBar : vérifier que le filename tronqué affiche un tooltip
  - [x] 4.2 Vérifier que `overflow-hidden` sur les composants critiques ne masque pas de texte :
    - `App.tsx` main layout — `overflow-hidden` seulement en mode editor (pas import)
    - `VideoPlayer.tsx` — vérifier l'overflow du player ne coupe pas les contrôles
    - `SegmentationProgressDialog` — vérifier la progress bar
  - [x] 4.3 Vérifier que les touch targets (44x44px minimum) sont maintenus à 200% zoom (les `min-h-[44px]` sont en px, ce qui est correct pour les touch targets car ils doivent rester en taille physique)

- [x] Task 5 — Support `prefers-reduced-motion` (AC: #5)
  - [x] 5.1 Ajouter `@media (prefers-reduced-motion: reduce)` dans `index.css` :
    ```css
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
    ```
  - [x] 5.2 Vérifier que les animations essentielles (progress bars, spinners) restent fonctionnelles mais sans mouvement excessif — les barres de progression doivent conserver leur état visuel (width) même sans animation

- [x] Task 6 — Tests d'accessibilité scalabilité (AC: #1, #2, #3, #4, #5)
  - [x] 6.1 Créer `apps/desktop/src/components/scalability-a11y.test.tsx` avec tests :
    - Vérifier l'absence de `text-[XXpx]` arbitraires dans les composants rendus (snapshot ou grep)
    - Vérifier que tous les boutons ont `min-h-[44px]` (déjà testé dans design-system.test.tsx, étendre)
    - Tester que `line-height` est >= 1.5 sur le body (via computed styles ou CSS file parsing)
  - [x] 6.2 Tester le rendu de composants clés en simulant des viewports réduits (comme si zoom 200%) :
    - Render `DropZone` dans un container 640px (simule 1280px à 200% zoom)
    - Render un modal dans un container 640px — vérifier qu'il ne déborde pas
  - [x] 6.3 Tester `prefers-reduced-motion` avec mock `matchMedia` (pattern identique à Story 10-3 pour `prefers-contrast`)
  - [x] 6.4 Test axe-core sur composants principaux pour violations a11y liées au texte

## Dev Notes

### Contexte Architecture

App desktop Tauri v2 (React 18.3.1 frontend + Rust backend) avec Clean Architecture 3 couches. Frontend en TypeScript 5.5.3 strict avec Tailwind CSS 4.1.18, shadcn/ui (Radix UI), Zustand state management. Tests via Vitest 2.1.8 + @testing-library/react 16.1.0 + vitest-axe. Cette story est **100% frontend CSS/tests** — aucune modification Rust/backend requise.

### État actuel du code — Résultat d'audit codebase

**Font-sizes :** Le projet utilise principalement les classes Tailwind standard (`text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`) qui sont en `rem`. Seules **8 instances** de tailles arbitraires en px existent :
- `text-[10px]` — 6 instances (KeyboardShortcutsBar ×4, KeyboardShortcutsDialog ×1, PreviewPlayer ×1)
- `text-[11px]` — 2 instances (TranscriptionProgressDialog ×1, TranscriptionScreen ×1)

**Line-height :** Pas défini globalement. Utilisé de manière incohérente (`leading-none`, `leading-tight`, `leading-relaxed`, `leading-7`).

**Layout :** Split 60%/40% en `w-[60%]`/`w-[40%]` dans App.tsx (lignes 506-507). Utilise des pourcentages, donc scale bien.

**Modals/Dialogs :** 30+ instances de `max-w-[XXXpx]` — ces valeurs en px ne scaleront PAS avec le zoom browser (le zoom affecte les rem mais pas les px pour max-width). **C'est le principal travail de cette story.**

**Touch targets :** Correctement implémentés — tous les boutons ont `min-h-[44px]` (en px, ce qui est correct car les touch targets doivent rester en taille physique).

**Overflow :** `overflow-hidden` utilisé dans 4+ endroits (App.tsx main, VideoPlayer, DropZone progress, SegmentationProgressDialog).

### Ce qui existe DÉJÀ vs ce qui doit être AJOUTÉ

| Fonctionnalité | Statut Actuel | Action Requise |
|---|---|---|
| Tailwind text classes (rem) | ✅ Majoritairement OK | Corriger 8 instances `text-[Xpx]` |
| Base font-size html | ⚠️ Non défini explicitement | Ajouter dans index.css |
| Line-height global | ❌ Non défini | Ajouter `line-height: 1.5` sur body |
| Modal max-widths en px | ❌ Non scalable | Convertir en rem ou classes Tailwind |
| Button min-widths en px | ⚠️ Non scalable | Convertir en rem |
| Touch targets 44px | ✅ OK | Vérifier maintien à 200% zoom |
| prefers-reduced-motion | ❌ Non implémenté | Ajouter media query |
| prefers-contrast: more | ✅ Implémenté (Story 10-3) | Aucune action |
| Responsive breakpoints | ✅ sm/md/lg utilisés | Vérifier comportement à zoom |
| Truncation avec tooltips | ⚠️ Partiel | Vérifier au zoom 200% |

### Composants à modifier

```
apps/desktop/src/
├── index.css                                         # MODIFIER (base font-size, line-height, prefers-reduced-motion)
├── App.tsx                                           # VÉRIFIER (split layout, overflow, blur decorators)
├── components/
│   ├── video/
│   │   └── KeyboardShortcutsBar.tsx                  # MODIFIER (text-[10px] → text-xs) ×4
│   ├── keyboard-shortcuts/
│   │   └── KeyboardShortcutsDialog.tsx               # MODIFIER (text-[10px] → text-xs) ×1
│   ├── preview/
│   │   └── PreviewPlayer.tsx                         # MODIFIER (text-[10px] → text-xs) ×1
│   ├── transcription/
│   │   ├── TranscriptionProgressDialog.tsx           # MODIFIER (text-[11px] → text-xs, max-w) ×1
│   │   └── TranscriptionScreen.tsx                   # MODIFIER (text-[11px] → text-xs, max-w) ×1
│   ├── video-import/
│   │   └── DropZone.tsx                              # MODIFIER (max-w-[480px], w-[200px], min-w-[220px])
│   ├── segmentation/
│   │   └── SegmentationProgressDialog.tsx            # MODIFIER (max-w)
│   ├── model-download/
│   │   └── ModelDownloadDialog.tsx                   # MODIFIER (max-w)
│   ├── settings/
│   │   └── SettingsDialog.tsx                        # MODIFIER (max-w-[540px], max-w-[260px])
│   ├── license-modal/
│   │   ├── ExportBlockedDialog.tsx                   # MODIFIER (min-w)
│   │   ├── GracePeriodWarning.tsx                    # VÉRIFIER (max-w)
│   │   └── EarlyAdopterCodeDialog.tsx                # MODIFIER (min-w)
│   ├── update/
│   │   ├── UpdateDialog.tsx                          # MODIFIER (max-w-[500px])
│   │   └── SettingsRollbackSection.tsx               # MODIFIER (max-w-[500px])
│   ├── export/
│   │   └── (export dialogs)                          # VÉRIFIER (max-w)
│   ├── timeline/
│   │   └── TimelineBar.tsx                           # VÉRIFIER (max-w-[200px] truncation)
│   └── TopBar.tsx                                    # VÉRIFIER (max-w-[200px] truncation)
└── (tests)
    └── scalability-a11y.test.tsx                      # NOUVEAU
```

### Patterns techniques à suivre

**Pattern conversion max-w px → Tailwind/rem :**
```tsx
// AVANT (ne scale pas avec zoom browser)
<DialogContent className="max-w-[540px]">

// APRÈS option 1 : classe Tailwind (arrondi au plus proche)
<DialogContent className="max-w-xl">  // 576px — légèrement plus large, OK

// APRÈS option 2 : valeur rem (préserve exactement la taille relative)
<DialogContent className="max-w-[33.75rem]">  // 540px ÷ 16 = 33.75rem
```

**Pattern conversion min-w px → rem :**
```tsx
// AVANT
<Button className="min-w-[220px]">

// APRÈS
<Button className="min-w-[13.75rem]">  // 220 ÷ 16 = 13.75
```

**IMPORTANT — Touch targets en px (correct !) :**
```tsx
// Les min-h-[44px] des boutons DOIVENT rester en px
// Car les touch targets doivent être en taille physique (44 CSS pixels)
// Le zoom browser scale les px proportionnellement donc 44px → 88px à 200% = OK
size: {
  default: "min-h-[44px] px-4 py-2",  // ← GARDER en px
}
```

**Pattern prefers-reduced-motion :**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Pattern test simulant zoom 200% :**
```typescript
// Simuler zoom 200% = viewport effectif divisé par 2
// Un écran 1280px à 200% zoom → viewport effectif ~640px
test('modal ne déborde pas à zoom 200%', () => {
  // Render dans un container de 640px de large
  const { container } = render(
    <div style={{ width: '640px' }}>
      <SettingsDialog open={true} />
    </div>
  );
  // Vérifier que le contenu ne déborde pas
  const dialog = container.querySelector('[role="dialog"]');
  expect(dialog).toBeTruthy();
});
```

**Pattern test prefers-reduced-motion (analogue à prefers-contrast en Story 10-3) :**
```typescript
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)',
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});
```

### Intelligence Story Précédente (10-3)

**Learnings de la Story 10-3 (High Contrast & Color Independence) :**
- `vitest-axe` installé et fonctionnel — RÉUTILISER pour tests a11y
- Import `vitest-axe` : `import * as matchers from 'vitest-axe/matchers'` (pas default export)
- Pattern `contrast-a11y.test.tsx` établi — créer fichier analogue `scalability-a11y.test.tsx`
- 11 failures de tests pré-existantes non liées à l'accessibilité (export-store, segmentation, transcription)
- `@media (prefers-contrast: more)` ajouté dans `index.css` — y ajouter `prefers-reduced-motion` à côté
- `data-*` attributes utilisés pour CSS sémantique (pattern établi en 10-3)
- Code review 10-3 a corrigé `--muted-foreground` dans `:root` ET `.dark` — ne pas re-modifier
- `aria-selected` sur `role="button"` provoque violation axe-core — exclure si rencontré

**Code review 10-3 — corrections clés à ne PAS casser :**
- `index.css` : `--muted-foreground: 218 11% 56%` (corrigé pour contraste 4.8:1)
- `TranscriptWord.tsx` : `data-word-selected`/`data-word-highlighted` attributes + `border-b-2`
- `TimelineBar.tsx` : `border border-emerald-400` sur segments + `data-segment-id`
- `@media (prefers-contrast: more)` : focus rings blancs, bordures renforcées

### Intelligence Git Récente

5 derniers commits (tous Epic 10 accessibilité + Epic 9) :
1. `ea71830` feat(a11y): high contrast & color independence (Story 10-3) ← **story précédente**
2. `931d982` feat(a11y): screen reader support with ARIA (Story 10-2)
3. `50ccaa3` feat(a11y): keyboard navigation (Story 10-1)
4. `f4d580e` feat(disk-space): disk space checks (Story 9-4)
5. `23f9302` feat(updates): UpdateDialog components

**Pattern de commit pour cette story :** `feat(a11y): implement responsive text scaling with code review fixes (Story 10-4)`

### Anti-patterns à ÉVITER

1. **NE PAS** convertir les `min-h-[44px]` des boutons en rem — les touch targets DOIVENT rester en px (taille physique)
2. **NE PAS** changer les valeurs CSS custom (`--muted-foreground`, `--border`, etc.) — déjà calibrées en Story 10-3
3. **NE PAS** supprimer les `@media (prefers-contrast: more)` existants — ajouter `prefers-reduced-motion` en parallèle
4. **NE PAS** modifier les composants shadcn/ui (`ui/dialog.tsx`, `ui/alert-dialog.tsx`) pour les max-w — les surcharger via className sur `DialogContent`
5. **NE PAS** changer le layout 60%/40% — il fonctionne avec le zoom car les pourcentages sont relatifs
6. **NE PAS** utiliser `!important` sauf dans la media query `prefers-reduced-motion` (justifié par le pattern standard)
7. **NE PAS** supprimer les `overflow-hidden` existants — vérifier qu'ils ne masquent pas de contenu, mais leur présence est souvent nécessaire pour le layout
8. **NE PAS** ajouter de classes de taille de texte personnalisées dans le tailwind.config.ts — utiliser les classes standard existantes
9. **NE PAS** tester les tailles "à l'œil" — utiliser des assertions programmatiques ou des mesures de viewport

### Librairies & Versions

- **React** 18.3.1
- **TypeScript** 5.5.3
- **Tailwind CSS** 4.1.18 (configuration via `tailwind.config.ts`, `darkMode: 'class'`)
- **Vitest** 2.1.8
- **@testing-library/react** 16.1.0
- **vitest-axe** (installé en 10-2, devDependency)
- **@axe-core/react** (installé en 10-1, devDependency)
- **lucide-react** 0.563.0 (icônes)
- **sonner** (toasts)

### Différences avec Story 10-3

| Aspect | Story 10-3 | Story 10-4 |
|--------|-----------|-----------|
| Focus | Couleurs/contraste | Tailles texte/zoom |
| CSS principal | Variables couleurs, `prefers-contrast` | Font-sizes, line-heights, `prefers-reduced-motion` |
| Composants modifiés | TranscriptWord, TimelineBar | ~15 composants (modals, dialogs, bars) |
| Nature des changements | Ajout couleurs/bordures | Conversion px → rem, ajout globals |
| Tests | Contraste programmatique, axe-core | Viewport simulation, CSS parsing, axe-core |

### Project Structure Notes

- Cette story est **100% frontend CSS/tests** — aucune modification Rust/backend requise
- Fichier principal à modifier : `apps/desktop/src/index.css` (base font, line-height, reduced-motion)
- ~15 composants à ajuster (principalement conversion `max-w-[XXXpx]` → rem/Tailwind)
- 1 nouveau fichier de tests : `scalability-a11y.test.tsx`
- Respecter le pattern existant : tests dans `apps/desktop/src/components/`

### References

- [Source: epics/epic-10-accessibility-inclusive-design.md#Story 10.4] — Acceptance criteria, user story, WCAG scalability requirements
- [Source: ux-design-specification/responsive-design-accessibility.md#Text Scalability] — Font-size en rem, layout tested 200% zoom, min font-size 14px
- [Source: ux-design-specification/responsive-design-accessibility.md#Responsive Strategy] — Desktop-first, relative units, breakpoints
- [Source: ux-design-specification/responsive-design-accessibility.md#Touch Target Sizes] — WCAG AA 44x44px minimum
- [Source: ux-design-specification/responsive-design-accessibility.md#Implementation Guidelines] — Relative units (rem), Tailwind config, responsive layout
- [Source: ux-design-specification/design-system-foundation.md#Typography] — Font system, hiérarchie, lisibilité
- [Source: ux-design-specification/ux-consistency-patterns.md#Button Hierarchy] — Tailles boutons, padding, touch targets
- [Source: 10-3-high-contrast-color-independence.md] — Story précédente, patterns a11y CSS, vitest-axe
- [Source: index.css] — CSS variables du thème, @media prefers-contrast existant
- [Source: tailwind.config.ts] — Configuration Tailwind, custom breakpoints, font families
- [Source: components/ui/button.tsx] — min-h-[44px] touch targets pattern

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- ✅ Task 1: Replaced all 8 arbitrary px font-sizes (6× `text-[10px]` → `text-xs`, 2× `text-[11px]` → `text-xs`). Added `font-size: 100%` on `html` in index.css. Full project scan confirms zero remaining `text-[XXpx]`.
- ✅ Task 2: Added `line-height: 1.5` globally on body. Audited `leading-none`/`leading-tight` — only used on short titles/labels. TranscriptViewer already uses `leading-7` (1.75rem). Interactive element spacing confirmed ≥ 8px. [Code Review Fix] `leading-tight` → `leading-relaxed` on privacy description paragraphs in TranscriptionProgressDialog.tsx and TranscriptionScreen.tsx (multi-sentence continuous text, not short labels).
- ✅ Task 3: Converted all `max-w-[XXXpx]` (20+ instances across 13 files) to Tailwind classes or rem. Converted all `min-w-[XXXpx]` buttons to rem (6 files). Converted truncation `max-w-[200px]`/`max-w-[260px]` to rem. Converted DropZone `w-[200px]` → `w-48`. Touch target `min-h-[44px]`/`min-w-[44px]` correctly left in px.
- ✅ Task 4: Verified overflow-hidden doesn't hide critical text. Touch targets maintain 44px physical size at all zoom levels. Blur decorators are absolute+pointer-events-none — no impact.
- ✅ Task 5: Added `@media (prefers-reduced-motion: reduce)` in index.css. Progress bars retain visual width state without animation.
- ✅ Task 6: Created `scalability-a11y.test.tsx` with 13 tests covering: no px font-sizes (grep), rem base on html, line-height ≥ 1.5, no px max-w in dialogs, no px min-w except touch targets, button touch targets, prefers-reduced-motion CSS rule, matchMedia mock, zoom 200% viewport simulation (DropZone), axe-core checks. All 13 tests passing. [Code Review Fix] Zoom 200% simulation tests upgraded with real assertions: verify w-full classes, no fixed inline widths exceeding container, rem-based min-w on buttons, max-w-lg constraint, and w-48 responsive progress bar.
- 756 tests passing, 11 pre-existing failures (same as documented in Story 10-3: export-store, segmentation, transcription — unrelated to accessibility).

### Change Log

- 2026-02-09: Story 10.4 implementation complete — responsive text & scalability (all 6 tasks, 13 new tests)
- 2026-02-09: Code review fixes applied — leading-tight → leading-relaxed on continuous text (AC #3), zoom tests upgraded with real assertions (AC #2), aria-hidden added on decorative icons in TranscriptionScreen.tsx

### File List

- apps/desktop/src/index.css (MODIFIED — font-size 100% on html, line-height 1.5 on body, @media prefers-reduced-motion)
- apps/desktop/src/App.tsx (MODIFIED — max-w-[800px] → max-w-4xl)
- apps/desktop/src/components/video/KeyboardShortcutsBar.tsx (MODIFIED — text-[10px] → text-xs ×4)
- apps/desktop/src/components/keyboard-shortcuts/KeyboardShortcutsDialog.tsx (MODIFIED — text-[10px] → text-xs ×1)
- apps/desktop/src/components/preview/PreviewPlayer.tsx (MODIFIED — text-[10px] → text-xs ×1)
- apps/desktop/src/components/transcription/TranscriptionProgressDialog.tsx (MODIFIED — text-[11px] → text-xs, max-w-xl, min-w rem, leading-tight → leading-relaxed on privacy desc)
- apps/desktop/src/components/transcription/TranscriptionScreen.tsx (MODIFIED — text-[11px] → text-xs, max-w-2xl, min-w rem, leading-tight → leading-relaxed on privacy desc, aria-hidden on icons)
- apps/desktop/src/components/transcription/TranscriptionErrorDialog.tsx (MODIFIED — max-w-lg)
- apps/desktop/src/components/video-import/DropZone.tsx (MODIFIED — max-w-lg, w-48, min-w rem)
- apps/desktop/src/components/video-import/VideoImport.tsx (MODIFIED — max-w-4xl)
- apps/desktop/src/components/segmentation/SegmentationProgressDialog.tsx (MODIFIED — max-w-xl)
- apps/desktop/src/components/model-download/ModelDownloadDialog.tsx (MODIFIED — max-w-xl, min-w rem)
- apps/desktop/src/components/settings/SettingsDialog.tsx (MODIFIED — sm:max-w-xl, max-w-xl ×2, max-w-[16.25rem])
- apps/desktop/src/components/update/UpdateDialog.tsx (MODIFIED — sm:max-w-lg, max-w-xl)
- apps/desktop/src/components/update/SettingsRollbackSection.tsx (MODIFIED — sm:max-w-lg, max-w-xl)
- apps/desktop/src/components/update/RollbackNotification.tsx (MODIFIED — max-w-xl)
- apps/desktop/src/components/recovery/CrashRecoveryDialog.tsx (MODIFIED — max-w-xl)
- apps/desktop/src/components/export/ExportDialog.tsx (MODIFIED — sm:max-w-lg)
- apps/desktop/src/components/license-modal/ExportBlockedDialog.tsx (MODIFIED — min-w rem)
- apps/desktop/src/components/license-modal/EarlyAdopterCodeDialog.tsx (MODIFIED — min-w rem)
- apps/desktop/src/components/layout/TopBar.tsx (MODIFIED — max-w-[12.5rem])
- apps/desktop/src/components/timeline/TimelineBar.tsx (MODIFIED — max-w-[12.5rem])
- apps/desktop/src/components/scalability-a11y.test.tsx (NEW — 13 tests)
