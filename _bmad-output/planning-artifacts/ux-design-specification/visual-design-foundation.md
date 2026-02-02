# Visual Design Foundation

## Color System

**Theme Strategy: Dark Mode par Défaut**

Splice adopte un thème sombre (dark mode) comme configuration par défaut, aligné avec les outils professionnels de montage vidéo (Premiere Pro, DaVinci Resolve, Final Cut Pro). Ce choix réduit la fatigue visuelle lors de sessions de travail longues et met en avant le contenu (transcript, timeline, preview vidéo) plutôt que l'interface elle-même.

**Palette Principale:**

**Brand Primary - Vert Moderne:**
- **Primary Green:** `#10b981` (Emerald 500 - type Tailwind)
- **Usage:** Segments sélectionnés sur timeline, texte surligné, boutons actions principales
- **Connotation:** "Validation", "Go", "Gardé" - sentiment positif universel
- **Contraste:** Excellent contraste sur fond sombre, visible instantanément

**Neutrals - Échelle de Gris:**
- **Background:** `#0a0a0a` (Noir profond, quasi noir pur)
- **Surface:** `#171717` (Gris très sombre pour panels, cards)
- **Border:** `#262626` (Gris sombre pour délimitations subtiles)
- **Text Primary:** `#fafafa` (Blanc cassé pour texte principal)
- **Text Secondary:** `#a3a3a3` (Gris moyen pour texte secondaire)
- **Text Disabled:** `#525252` (Gris sombre pour états désactivés)

**Semantic Colors:**
- **Success:** `#10b981` (Vert primary - réutilisé)
- **Warning:** `#f59e0b` (Orange/Amber pour avertissements)
- **Error:** `#ef4444` (Rouge pour erreurs critiques)
- **Info:** `#3b82f6` (Bleu pour informations neutres)

**Functional Colors:**
- **Selected:** `#10b981` (Vert - segments timeline sélectionnés)
- **Unselected:** `#404040` (Gris neutre - segments non-sélectionnés)
- **Hover:** `#14b8a6` (Teal léger - états hover interactifs)
- **Focus:** `#3b82f6` (Bleu - focus clavier pour accessibilité)

**Accessibility Compliance:**
- Tous les ratios de contraste texte/fond respectent WCAG AA minimum (4.5:1 pour texte normal, 3:1 pour texte large)
- Vert primary `#10b981` sur fond sombre `#0a0a0a` = contraste >7:1 (AAA)
- Texte primary `#fafafa` sur fond `#0a0a0a` = contraste >21:1 (AAA)

## Typography System

**Typeface Strategy:**

**Primary Font - Inter (ou System UI fallback):**
- **Rationale:** Inter est optimisé pour lisibilité écran, moderne, clean, excellent hinting. Alternatives system UI (San Francisco sur macOS, Segoe UI sur Windows) garantissent performance native.
- **Usage:** Transcript, UI labels, boutons, tous textes interface
- **Weights:** Regular (400), Medium (500), Semibold (600) pour hiérarchie

**Monospace Font - JetBrains Mono (optionnel pour timestamps):**
- **Rationale:** Si on affiche timestamps dans transcript (ex: `[00:32:15]`), monospace améliore scan visuel
- **Usage:** Timestamps uniquement
- **Weight:** Regular (400)

**Type Scale:**

Basé sur échelle modulaire 1.25 (Major Third) avec base 16px:

- **H1 (Titres principaux):** 32px / 2rem - Line height 1.2 - Weight 600
- **H2 (Sous-titres):** 24px / 1.5rem - Line height 1.3 - Weight 600
- **H3 (Sections):** 20px / 1.25rem - Line height 1.4 - Weight 600
- **Body (Transcript, texte principal):** 16px / 1rem - Line height 1.6 - Weight 400
- **Body Small (Labels, captions):** 14px / 0.875rem - Line height 1.5 - Weight 400
- **Caption (Timestamps, metadata):** 12px / 0.75rem - Line height 1.4 - Weight 400

**Transcript-Specific Settings:**
- **Font-size:** 16px (confortable pour lecture longue)
- **Line-height:** 1.7 (aéré, facilite scan visuel)
- **Letter-spacing:** 0.01em (légèrement espacé pour clarté)
- **Max-width:** 65-75 caractères par ligne (optimal pour lisibilité)

**Hierarchy Principles:**
- Titres utilisent weights plus lourds (600) pour différenciation claire
- Body text reste Regular (400) pour lecture confortable
- Pas d'italique dans transcript (préserve lisibilité)
- Couleurs texte suivent échelle neutrals (Primary/Secondary/Disabled)

## Spacing & Layout Foundation

**Spacing Unit System:**

**Base unit: 4px (0.25rem)**

Échelle Tailwind standard pour cohérence:
- **0.5** = 2px (bordures ultra-fines)
- **1** = 4px (espaces minimaux)
- **2** = 8px (espaces serrés)
- **3** = 12px (espaces standards petits)
- **4** = 16px (espaces standards moyens)
- **6** = 24px (espaces standards larges)
- **8** = 32px (espaces sections)
- **12** = 48px (espaces majeurs)
- **16** = 64px (marges layout)

**Layout Strategy: Compact mais Organisé**

**Rationale:** Splice doit afficher simultanément transcript (gauche), timeline (bas), preview (centre/droite). Maximiser l'espace utile pour contenu, minimiser le chrome UI inutile.

**Grid System:**
- **Layout principal:** CSS Grid 3-zones
  - Zone gauche: Transcript (30-35% largeur)
  - Zone centre/droite: Preview vidéo (40-45% largeur)
  - Zone bas: Timeline (hauteur fixe 120-150px)
- **Responsive breakpoints:**
  - 13" MacBook (1440x900): Layout compact, preview réduit
  - 15"+ (1920x1080+): Layout optimal, tous éléments confortables

**Component Spacing:**
- **Internal padding (buttons, inputs):** px-4 py-2 (16px horizontal, 8px vertical)
- **Card/Panel padding:** p-4 ou p-6 (16px ou 24px selon densité)
- **Section spacing:** mb-8 ou mb-12 (32px ou 48px entre sections majeures)
- **Element spacing:** gap-2 ou gap-4 (8px ou 16px entre éléments groupés)

**Density Principles:**
1. **Maximize content area:** Transcript, timeline, preview occupent 90%+ de viewport
2. **Minimize chrome:** Toolbars, headers compacts (40-48px hauteur)
3. **Breathable groups:** Espaces suffisants entre groupes fonctionnels distincts
4. **Dense within groups:** Éléments liés restent proches (ex: transcript lines serrées mais lisibles)

**Layout Zones:**
```
┌─────────────────────────────────────────┐
│ Header (compact, 48px)                  │
├──────────────┬──────────────────────────┤
│              │                          │
│  Transcript  │      Video Preview       │
│  (30-35%)    │      (40-45%)           │
│              │                          │
│              │                          │
├──────────────┴──────────────────────────┤
│  Timeline (120-150px hauteur)           │
└─────────────────────────────────────────┘
```

**Borders & Dividers:**
- **Border width:** 1px standard
- **Border color:** `#262626` (subtil, délimite sans agressivité)
- **Border radius:** 4px ou 6px (légèrement arrondi, pas trop "web app")
- **Timeline/Preview:** Sharp corners (0px radius) pour look NLE pro

## Accessibility Considerations

**Contrast Compliance:**
- Tous les textes respectent WCAG AA minimum (4.5:1)
- Texte principal sur fond sombre: contraste >21:1 (AAA)
- Couleur primary (vert) sur fond sombre: contraste >7:1 (AAA)
- États interactifs (hover, focus) maintiennent contraste suffisant

**Keyboard Navigation:**
- **Focus visible:** Outline bleu `#3b82f6` avec 2px offset pour clarté
- **Tab order logique:** Transcript → Boutons actions → Timeline → Preview controls
- **Raccourcis clavier:** Documentés et standards NLE (espace, J/K/L, flèches)
- **Skip links:** Permettre de sauter entre zones principales (transcript, timeline, preview)

**Screen Reader Support:**
- Composants Radix UI (via Shadcn/ui) fournissent ARIA par défaut
- Labels clairs pour tous contrôles interactifs
- Status updates annoncés (ex: "Transcription terminée", "Cuts générés")
- Timeline segments ont labels textuels (pas que visuels)

**Motion & Animations:**
- **Respect prefers-reduced-motion:** Désactiver animations non-essentielles si préférence système
- **Animations essentielles maintenues:** Synchronisation texte-timeline (feedback critique)
- **Durées courtes:** 150-200ms max pour transitions UI
- **Pas d'animations distrayantes:** Focus sur feedback utile uniquement

**Text Scalability:**
- **Unités relatives:** Utiliser rem/em plutôt que px pour texte (respect zoom navigateur)
- **Min font-size:** 14px minimum pour texte secondaire (lisibilité)
- **Line-height adéquat:** 1.5-1.7 pour texte corps (confort lecture)

**Color Independence:**
- **Pas que couleur pour états:** Segments sélectionnés = vert + label textuel "Sélectionné"
- **Iconographie redondante:** Boutons critiques ont icône + texte
- **Patterns visuels:** Timeline utilise hauteur/position en plus de couleur
