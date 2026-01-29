# Design System Foundation

## Design System Choice

**Choix: Tailwind CSS + Shadcn/ui**

Splice utilisera une approche hybride combinant flexibilité et rapidité de développement:
- **Tailwind CSS** comme foundation utility-first pour styling custom
- **Shadcn/ui** pour composants UI standards (boutons, modals, inputs, progress bars)
- **Custom components** en Tailwind pur pour interfaces spécifiques NLE (timeline, transcript editor)

Cette stack moderne offre le meilleur équilibre entre rapidité de développement (composants prêts) et flexibilité totale (design custom) pour une application desktop professionnelle.

## Rationale for Selection

**Vitesse de développement:**
Solo développeur avec timeline MVP 2-4 mois. Shadcn/ui fournit composants standards prêts à l'emploi (boutons, modals, inputs, progress bars) = gain de temps significatif. Pas besoin de réinventer les roues pour UI basique.

**Flexibilité maximale pour composants critiques:**
L'interface centrale de Splice (timeline NLE-like + transcript editor synchronisé) est unique et ne peut pas utiliser de composants génériques. Tailwind permet de construire ces interfaces custom avec contrôle pixel-perfect et performance optimale.

**Look professionnel NLE:**
Shadcn/ui est headless (basé Radix UI) = pas de style imposé type "Material Design" ou "Bootstrap". Contrôle total sur l'apparence pour créer un look professionnel cohérent avec outils NLE (Premiere, DaVinci) plutôt qu'une "web app générique".

**Expertise existante:**
Stack déjà maîtrisée (Tailwind + Shadcn/ui) = zéro courbe d'apprentissage, productivité immédiate, focus sur fonctionnalités plutôt qu'apprentissage framework.

**Performance desktop:**
Tailwind génère CSS optimisé minimal. Radix UI (base de Shadcn/ui) = composants React légers et accessibles. Parfait pour application desktop Tauri nécessitant réactivité et fluidité.

**Accessibilité built-in:**
Radix UI fournit accessibilité clavier et ARIA par défaut = navigation clavier professionnelle (critique pour monteurs power users) sans effort supplémentaire.

## Implementation Approach

**Phase 1: Setup et Configuration**
1. Installer Tailwind CSS dans le frontend web du projet Tauri
2. Intégrer Shadcn/ui avec configuration custom theme
3. Définir palette couleurs (dark mode probable pour outil pro)
4. Configurer design tokens (spacing, typography, colors, shadows)

**Phase 2: Composants Standards (Shadcn/ui)**
Installer et customiser les composants Shadcn/ui nécessaires au MVP:
- **Button** - Actions principales (Générer cuts, Exporter, Annuler)
- **Dialog/Modal** - Messages erreur, confirmation export, blocage freemium
- **Progress** - Transcription, génération cuts, export (avec % et temps estimé)
- **Input** - Formulaires si nécessaire (licence, settings post-MVP)
- **Toast** - Notifications success/error discrètes
- **Tooltip** - Explications raccourcis clavier
- **DropZone** (ou custom) - Import vidéo drag & drop

**Phase 3: Composants Custom (Tailwind)**
Construire from scratch les interfaces uniques à Splice:
- **Timeline Component** - Représentation visuelle NLE-like avec segments sélections, scrubbing, synchronisation texte
- **Transcript Editor** - Éditeur texte avec surlignage, word-level highlighting, sync vidéo
- **Video Preview Player** - Lecteur vidéo intégré avec contrôles NLE standards (play/pause, scrub, frame-by-frame)
- **Sync Indicators** - Visuels montrant lien texte ↔ timeline (highlight, animations subtiles)

**Phase 4: Theming et Polish**
- Définir thème cohérent (probablement dark mode pour monteurs pros)
- Affiner animations synchronisation (subtiles, <16ms, renforce rapidité viscérale)
- Tester accessibilité clavier complète (espace, J/K/L, flèches)
- Optimiser performance (lazy loading, virtualization si nécessaire pour longs transcripts)

## Customization Strategy

**Adaptation Shadcn/ui au look NLE professionnel:**

1. **Palette couleurs:**
   - Probablement dark mode par défaut (standard outils pros montage)
   - Couleurs primaires cohérentes avec brand Splice (à définir)
   - Contraste élevé pour lisibilité transcript
   - États hover/active discrets mais clairs

2. **Typography:**
   - Système lisible pour transcript (font-size confortable lecture rapide)
   - Monospace partiel pour timestamps dans transcript?
   - Hiérarchie claire (titres, body, captions)

3. **Borders et Radius:**
   - NLE ont tendance à être "sharper" que web apps consumer
   - Réduire border-radius par défaut Shadcn/ui pour look plus pro?
   - Borders subtils pour délimitation zones (transcript / timeline / preview)

4. **Animations:**
   - Synchronisation texte-timeline: instantanée (<16ms) avec feedback visuel subtil
   - Transitions modals/toasts: rapides (150-200ms) pas lentes (300ms+)
   - Feedback actions: confirmation visuelle immédiate (progress bars, state changes)

5. **Layout responsif:**
   - Optimisé pour écrans 15"+ (usage monteur typique)
   - Support minimum 13" MacBook (layout adaptatif)
   - Focus desktop, pas mobile (hors scope MVP)

**Composants custom alignés avec patterns NLE:**
- Timeline utilise codes couleurs familiers (vert = sélectionné, gris = non-sélectionné)
- Contrôles vidéo reprennent iconographie standard NLE (triangles play, carrés stop, etc.)
- Raccourcis clavier mappés standards Premiere/DaVinci (espace, J/K/L, flèches)
- Terminologie interface cohérente avec NLE (In/Out points, Timeline, Playhead, etc.)
