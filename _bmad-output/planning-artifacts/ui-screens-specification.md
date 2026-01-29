# Splice - UI Screens Specification
**Pour génération avec Google Stitch**

**Date:** 2026-01-29
**Projet:** Splice - Application Desktop de Découpage Vidéo par Transcription
**Objectif:** Spécifications détaillées de tous les écrans avec prompts pour génération UI

---

## Table des Matières

1. [Design System](#design-system)
2. [Flow 1: First Launch & Onboarding](#flow-1-first-launch--onboarding)
3. [Flow 2: Main Workflow](#flow-2-main-workflow)
4. [Flow 3: Freemium Conversion](#flow-3-freemium-conversion)
5. [Flow 4: Settings](#flow-4-settings)
6. [Flow 5: Error States](#flow-5-error-states)

---

## Design System

### Palette de Couleurs

**Thème sombre professionnel (inspiré Premiere Pro / DaVinci Resolve)**

```
Primary Colors:
- Primary Blue: #0D7EFF (actions principales, liens, focus)
- Primary Blue Hover: #0A66CC
- Primary Blue Disabled: #0D7EFF40 (40% opacity)

Background Colors:
- BG Primary: #1A1A1F (fond principal)
- BG Secondary: #25252D (cartes, panneaux)
- BG Tertiary: #2F2F38 (éléments surélévés)
- BG Hover: #35353F (survol)

Text Colors:
- Text Primary: #FFFFFF (titres, texte principal)
- Text Secondary: #B4B4C0 (texte secondaire, labels)
- Text Tertiary: #7D7D8A (placeholder, texte désactivé)

Border Colors:
- Border Default: #35353F
- Border Focus: #0D7EFF
- Border Error: #FF4D4F

Semantic Colors:
- Success Green: #52C41A
- Success Green BG: #52C41A20 (20% opacity background)
- Error Red: #FF4D4F
- Error Red BG: #FF4D4F20 (20% opacity background)
- Warning Orange: #FAAD14
- Warning Orange BG: #FAAD1420 (20% opacity background)

Highlight (surlignage transcript):
- Highlight Yellow: #FFD93D
- Highlight Yellow BG: #FFD93D30 (30% opacity pour surlignage)
```

### Typographie

```
Font Family:
- Primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- Monospace (timestamps): 'SF Mono', 'Monaco', 'Courier New', monospace

Font Sizes:
- Heading 1: 28px / Bold / Line-height 36px
- Heading 2: 22px / Semibold / Line-height 30px
- Heading 3: 18px / Semibold / Line-height 26px
- Body Large: 16px / Regular / Line-height 24px
- Body: 14px / Regular / Line-height 22px
- Body Small: 12px / Regular / Line-height 18px
- Caption: 11px / Medium / Line-height 16px

Font Weights:
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700
```

### Composants de Base

#### Button Component
```
Primary Button:
- Background: Primary Blue (#0D7EFF)
- Text: White (#FFFFFF) / 14px Medium
- Padding: 12px 24px
- Border-radius: 8px
- Hover: Primary Blue Hover (#0A66CC)
- Disabled: Primary Blue Disabled (#0D7EFF40)
- Height: 44px

Secondary Button:
- Background: BG Tertiary (#2F2F38)
- Text: Text Primary (#FFFFFF) / 14px Medium
- Border: 1px solid Border Default (#35353F)
- Padding: 12px 24px
- Border-radius: 8px
- Hover: BG Hover (#35353F)
- Height: 44px

Ghost Button:
- Background: Transparent
- Text: Primary Blue (#0D7EFF) / 14px Medium
- Padding: 12px 24px
- Border-radius: 8px
- Hover: Primary Blue (#0D7EFF) 10% opacity background
- Height: 44px
```

#### Input Component
```
Text Input:
- Background: BG Tertiary (#2F2F38)
- Border: 1px solid Border Default (#35353F)
- Text: Text Primary (#FFFFFF) / 14px Regular
- Placeholder: Text Tertiary (#7D7D8A) / 14px Regular
- Padding: 12px 16px
- Border-radius: 8px
- Height: 44px
- Focus: Border Focus (#0D7EFF), 2px border
- Error: Border Error (#FF4D4F), 2px border
```

#### Card Component
```
Card:
- Background: BG Secondary (#25252D)
- Border: 1px solid Border Default (#35353F)
- Border-radius: 12px
- Padding: 24px
- Shadow: 0 4px 12px rgba(0,0,0,0.15)
```

#### Progress Bar Component
```
Progress Bar:
- Container: BG Tertiary (#2F2F38)
- Fill: Primary Blue (#0D7EFF)
- Height: 8px
- Border-radius: 4px
- Animation: smooth fill transition

Progress Bar with Label:
- Label above: Text Secondary (#B4B4C0) / 12px Medium
- Percentage: Text Primary (#FFFFFF) / 14px Semibold (right aligned)
```

#### Modal Component
```
Modal:
- Overlay: rgba(0,0,0,0.75)
- Container: BG Secondary (#25252D)
- Border-radius: 16px
- Padding: 32px
- Max-width: 560px
- Shadow: 0 8px 32px rgba(0,0,0,0.4)
- Close button: Ghost button top-right
```

#### Toast/Notification Component
```
Toast:
- Background: BG Tertiary (#2F2F38)
- Border: 1px solid Border Default (#35353F)
- Border-radius: 8px
- Padding: 16px
- Shadow: 0 4px 16px rgba(0,0,0,0.25)
- Icon: 20x20px (left aligned)
- Text: Body / 14px Regular
- Duration: 5s auto-dismiss

Success Toast: Left border 3px Success Green (#52C41A)
Error Toast: Left border 3px Error Red (#FF4D4F)
Warning Toast: Left border 3px Warning Orange (#FAAD14)
```

### Spacing & Layout

```
Spacing Scale:
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px

Window Padding: 24px all sides
Component Gap: 16px vertical spacing between elements
```

### Iconographie

```
Icon Library: Lucide Icons ou Heroicons (outline style)
Icon Sizes:
- Small: 16x16px
- Medium: 20x20px
- Large: 24x24px

Icon Colors:
- Default: Text Secondary (#B4B4C0)
- Active: Text Primary (#FFFFFF)
- Disabled: Text Tertiary (#7D7D8A)
```

### Layout Global (Header + Content)

```
Application Layout:
- Header: Fixed top, height 64px, BG Secondary (#25252D), border-bottom 1px Border Default (#35353F)
- Content Area: Full height minus header, BG Primary (#1A1A1F), padding 24px

Header Content:
- Left: Logo "Splice" + icon (24x24px) - Text Primary (#FFFFFF) / 18px Semibold
- Center: Current step indicator ou breadcrumb (si applicable)
- Right: Settings icon button (ghost) + License status badge
```

---

## Flow 0: Landing Page (Web)

### Écran 0.1: Landing Page - Download

**Objectif:** Présenter Splice et inciter au téléchargement de l'application desktop

**Layout:**
- Header: Logo Splice + Navigation (Features, Pricing)
- Hero Section: Value proposition + Download CTA
- Features Section: Bénéfices clés
- Footer: Liens légaux

**États:**
- Default: Présentation statique

---

#### PROMPT POUR GOOGLE STITCH - ÉCRAN 0.1 (LANDING PAGE)

```
Create a modern landing page for a desktop video editing application called Splice with dark professional theme.

DESIGN SYSTEM:
- Background: Dark primary (#1A1A1F)
- Card background: Dark secondary (#25252D) with 1px border (#35353F)
- Primary blue: #0D7EFF
- Success green: #52C41A
- Text primary: #FFFFFF
- Text secondary: #B4B4C0
- Font: Inter, sans-serif

LAYOUT (single page, vertically scrollable):

1. HEADER (fixed top, 72px height, dark secondary #25252D with 80% opacity backdrop blur, 1px bottom border #35353F):
   - Left: Logo "Splice" with video icon (20px semibold white text)
   - Right: Navigation links (14px medium, text secondary, 32px gap):
     - "Fonctionnalités" (hoverable, turns white)
     - "Tarifs" (hoverable, turns white)
     - Ghost button: "Télécharger" (primary blue text, 8px border-radius, 10px vertical padding, 20px horizontal padding)

2. HERO SECTION (centered, max-width 1200px, 120px top padding, 80px bottom padding):
   - Badge: "Early Access • macOS & Windows" (12px medium, text secondary, light background #2F2F38, 6px border-radius, 8px horizontal padding, 4px vertical padding, centered, 24px bottom margin)

   - Main headline: "Découpez vos vidéos en sélectionnant du texte" (56px bold, white #FFFFFF, centered, 24px bottom margin, max-width 800px)

   - Subheadline: "Pas de coupe automatique aveugle. Surlignez les passages que vous voulez garder dans le transcript, Splice génère les cuts vidéo correspondants. Contrôle créatif total." (20px regular, text secondary #B4B4C0, centered, 40px bottom margin, max-width 720px)

   - CTA buttons (horizontal centered, 16px gap):
     - Primary button: "Télécharger Splice" (primary blue #0D7EFF background, white text, 56px height, 16px vertical padding, 40px horizontal padding, 12px border-radius, 18px medium font)
     - Ghost button: "Voir la démo" (transparent, primary blue text, same size)

   - Trust badge below (24px top margin): "✓ Gratuit pendant l'Early Access • ✓ Aucune carte requise" (12px regular, text tertiary #7D7D8A, centered)

3. HERO VISUAL (48px top margin, centered):
   - Screenshot/mockup of Splice app interface (16:9 aspect ratio, max-width 1000px, 16px border-radius, 1px border #35353F, subtle shadow 0 8px 32px rgba(0,0,0,0.4))
   - Show the transcript editor screen with highlighting to demonstrate the product

4. DIFFERENTIATION SECTION (64px top padding, 64px bottom padding, centered, max-width 900px):
   - Container: dark tertiary #2F2F38, 1px border #35353F, 12px border-radius, 32px padding
   - Heading: "Splice n'est pas un énième outil de coupe automatique" (28px bold, white #FFFFFF, centered, 24px bottom margin)
   - Two-column comparison (horizontal, 24px gap, divider line 1px #35353F between):

     LEFT COLUMN:
     - Label: "Les autres outils" (14px medium, text tertiary #7D7D8A, 12px bottom margin)
     - List (vertical, 12px gaps):
       - "❌ Détection automatique de silences" (14px regular, text secondary)
       - "❌ Coupes aveugles sans contexte" (14px regular, text secondary)
       - "❌ Vous devez vérifier et corriger" (14px regular, text secondary)
       - "❌ Perte de contrôle créatif" (14px regular, text secondary)

     RIGHT COLUMN:
     - Label: "Splice" (14px medium, primary blue #0D7EFF, 12px bottom margin)
     - List (vertical, 12px gaps):
       - "✓ Vous lisez le transcript" (14px regular, white #FFFFFF)
       - "✓ Vous surlignez ce qui compte" (14px regular, white #FFFFFF)
       - "✓ Splice génère les cuts parfaits" (14px regular, white #FFFFFF)
       - "✓ Contrôle total, exécution automatique" (14px regular, white #FFFFFF)

5. FEATURES SECTION (80px top padding, 80px bottom padding, centered, max-width 1200px):
   - Section heading: "Comment ça marche" (36px bold, white #FFFFFF, centered, 48px bottom margin)

   - Feature grid (3 columns, 32px gap):

     Feature Card 1 (HERO FEATURE - spans full width or emphasized):
     - Container: dark secondary #25252D, 1px border primary blue #0D7EFF (2px), 16px border-radius, 32px padding
     - Icon: Text cursor/highlighter (56x56px, primary blue #0D7EFF)
     - Title: "Sélectionnez du texte, obtenez des cuts vidéo" (24px semibold, white, 16px top margin)
     - Description: "Pas comme les outils de coupe automatique. Vous lisez le transcript, vous surlignez ce que VOUS voulez garder. Splice découpe la vidéo exactement là où vous l'avez décidé. Contrôle créatif total." (16px regular, text secondary, 12px top margin, line-height 24px)
     - Visual hint: Small animated GIF or illustration showing text selection → video cuts

     Feature Card 2:
     - Container: dark secondary #25252D, 1px border #35353F, 16px border-radius, 32px padding
     - Icon: Lightning bolt (48x48px, primary blue #0D7EFF)
     - Title: "Transcription ultra-rapide" (20px semibold, white, 16px top margin)
     - Description: "60 minutes de vidéo transcrites en ~2 secondes. Parakeet TDT tourne localement sur votre machine." (14px regular, text secondary, 12px top margin, line-height 22px)

     Feature Card 3:
     - Icon: Lock/shield (48x48px, success green #52C41A)
     - Title: "100% local et privé"
     - Description: "Aucune donnée n'est envoyée en ligne. Vos rushs restent sur votre disque dur. Conformité RGPD garantie."

     Feature Card 4:
     - Icon: Brain/intelligence (48x48px, primary blue #0D7EFF)
     - Title: "Pas d'IA qui décide pour vous"
     - Description: "Oubliez les coupes automatiques de silences qui ratent la moitié. Vous êtes le monteur, vous choisissez ce qui compte."

     Feature Card 5:
     - Icon: Target/precision (48x48px, primary blue #0D7EFF)
     - Title: "Précision word-level"
     - Description: "Timestamps au niveau du mot pour des cuts frame-perfect. Compatible avec vos workflows Premiere Pro et DaVinci."

     Feature Card 6:
     - Icon: Gauge/speed (48x48px, success green #52C41A)
     - Title: "1h15 → 3 minutes"
     - Description: "Transformez le dérushage fastidieux en lecture rapide. Concentrez-vous sur la créativité, pas sur le tri manuel."

6. FINAL CTA SECTION (80px top padding, 80px bottom padding, centered):
   - Container: dark secondary #25252D, 1px border #35353F, 16px border-radius, 48px padding, max-width 800px
   - Heading: "Reprenez le contrôle de votre dérushage" (32px bold, white #FFFFFF, centered, 24px bottom margin)
   - Description: "Lisez, sélectionnez, exportez. Aussi simple que ça." (16px regular, text secondary, centered, 32px bottom margin)
   - Primary button: "Télécharger Splice gratuitement" (primary blue #0D7EFF, white text, 56px height, 16px vertical padding, 40px horizontal padding, 12px border-radius, centered)
   - Info text: "macOS 11+ • Windows 10+ • ~500MB" (12px regular, text tertiary, centered, 16px top margin)

7. FOOTER (40px top padding, 40px bottom padding, 1px top border #35353F):
   - Left: "© 2026 Splice • Fait pour les monteurs" (12px regular, text tertiary)
   - Right: Links (12px regular, text secondary, 24px gap, hoverable to white):
     - "Confidentialité"
     - "Conditions"
     - "Contact"

The landing page should feel professional, trustworthy, and clearly communicate the value proposition to video editors.
```

---

## Flow 1: First Launch & Onboarding

### Écran 1.1: Welcome / License Activation

**Objectif:** Première ouverture de l'app - activation de la licence ou code early adopter

**Layout:**
- Header: Logo Splice centré, pas d'actions
- Content: Card centrée verticalement et horizontalement sur fond BG Primary

**États:**
- Default: Formulaire d'activation
- Loading: Vérification en cours
- Success: Transition vers téléchargement Parakeet
- Error: Code invalide ou connexion échouée

---

#### PROMPT POUR GOOGLE STITCH - ÉCRAN 1.1 (DEFAULT STATE)

```
Create a desktop application welcome screen with a dark professional theme inspired by video editing software like Premiere Pro.

DESIGN SYSTEM:
- Background: Dark primary (#1A1A1F)
- Card background: Dark secondary (#25252D) with 1px border (#35353F), 12px border-radius, 24px padding
- Primary blue: #0D7EFF
- Text primary: #FFFFFF
- Text secondary: #B4B4C0
- Font: Inter, sans-serif

LAYOUT:
- Fixed header at top (64px height, dark secondary background #25252D, 1px bottom border #35353F)
  - Logo "Splice" with small video icon on the left (18px semibold white text)
- Main content area: centered card (max-width 480px) vertically and horizontally on dark primary background (#1A1A1F)

CARD CONTENT (vertically stacked, 24px gaps):
1. Icon: Large welcome icon (48x48px, primary blue #0D7EFF) - video editing symbol
2. Heading: "Bienvenue sur Splice" (28px bold, white #FFFFFF, centered)
3. Description text: "Transformez 1h15 de dérushage en 3 minutes. Commencez par activer votre licence." (14px regular, text secondary #B4B4C0, centered, max-width 360px)
4. Text input field:
   - Label above: "Code de licence ou Early Adopter" (12px medium, text secondary #B4B4C0)
   - Input: Dark tertiary background (#2F2F38), 1px border (#35353F), 8px border-radius, 12px vertical padding, 16px horizontal padding, 44px height
   - Placeholder: "Entrez votre code" (text tertiary #7D7D8A)
   - White text (#FFFFFF) when typing
5. Primary button: "Activer" (primary blue #0D7EFF background, white text, 44px height, 12px vertical padding, 24px horizontal padding, 8px border-radius, 14px medium font, full width)
6. Footer text: "Pas encore de compte ?" with blue link "Obtenir une licence" (12px regular, text secondary with primary blue link)

The design should feel modern, minimal, and professional - familiar to video editors.
```

---

#### PROMPT POUR GOOGLE STITCH - ÉCRAN 1.1 (LOADING STATE)

```
Create the same welcome screen as described above with these modifications for loading state:

DESIGN SYSTEM (SAME AS DEFAULT):
- Background: Dark primary (#1A1A1F)
- Card background: Dark secondary (#25252D)
- Primary blue: #0D7EFF
- Text colors: White (#FFFFFF), secondary (#B4B4C0)
- Font: Inter

CHANGES FOR LOADING STATE:
- Input field: DISABLED state with 40% opacity
- Primary button: DISABLED with text "Vérification..." and spinner icon (16x16px) on the left side of text
  - Button background: primary blue with 40% opacity (#0D7EFF40)
  - Spinner: white rotating icon
- Footer link: DISABLED with 40% opacity

Everything else remains identical to default state. The user should clearly see the app is processing their license code.
```

---

#### PROMPT POUR GOOGLE STITCH - ÉCRAN 1.1 (ERROR STATE)

```
Create the same welcome screen with error state modifications:

DESIGN SYSTEM (SAME AS DEFAULT):
- Background: Dark primary (#1A1A1F)
- Card background: Dark secondary (#25252D)
- Error red: #FF4D4F
- Text colors: White (#FFFFFF), secondary (#B4B4C0)
- Font: Inter

CHANGES FOR ERROR STATE:
- Input field: Red border (2px, #FF4D4F) indicating error
- Error message below input: "Code invalide ou connexion impossible. Veuillez réessayer." (12px regular, error red #FF4D4F)
- Primary button: Back to enabled state (primary blue #0D7EFF, white text)
- Optional: Small error icon (16x16px, error red) to the left of error message

Everything else remains identical to default state. The error should be clearly visible but not overwhelming.
```

---

### Écran 1.2: Parakeet Download Progress

**Objectif:** Téléchargement du modèle de transcription (~500MB) - premier lancement uniquement

**Layout:**
- Header: Logo Splice
- Content: Card centrée avec progression

**États:**
- Downloading: Barre de progression avec pourcentage et vitesse
- Success: Transition automatique vers écran Ready
- Error: Échec téléchargement avec retry

---

#### PROMPT POUR GOOGLE STITCH - ÉCRAN 1.2 (DOWNLOADING STATE)

```
Create a download progress screen for a desktop video editing application with dark professional theme.

DESIGN SYSTEM:
- Background: Dark primary (#1A1A1F)
- Card background: Dark secondary (#25252D) with 1px border (#35353F), 12px border-radius, 24px padding
- Primary blue: #0D7EFF
- Text primary: #FFFFFF
- Text secondary: #B4B4C0
- Font: Inter, sans-serif

LAYOUT:
- Fixed header at top (64px height, dark secondary background #25252D, 1px bottom border #35353F)
  - Logo "Splice" with icon on left
- Main content: centered card (max-width 520px)

CARD CONTENT (vertically stacked, 24px gaps):
1. Icon: Download cloud icon (48x48px, primary blue #0D7EFF)
2. Heading: "Téléchargement du moteur de transcription" (22px semibold, white #FFFFFF, centered)
3. Description: "Parakeet TDT 0.6B (~500 MB) - Nécessaire pour la transcription locale" (14px regular, text secondary #B4B4C0, centered)
4. Progress bar:
   - Label above: "Téléchargement en cours..." (12px medium, text secondary #B4B4C0, left aligned)
   - Percentage: "47%" (14px semibold, white #FFFFFF, right aligned on same line as label)
   - Progress bar: 8px height, 4px border-radius
     - Container: dark tertiary (#2F2F38)
     - Fill: primary blue (#0D7EFF) at 47% width with smooth animation
   - Speed indicator below: "12.5 MB/s" (12px regular, text secondary #B4B4C0, right aligned)
5. Info text: "Temps restant estimé: ~30 secondes" (12px regular, text secondary #B4B4C0, centered)
6. Secondary button: "Annuler" (dark tertiary background #2F2F38, white text, 1px border #35353F, 8px border-radius, centered, 140px width)

The design should communicate clear progress and estimated completion time.
```

---

#### PROMPT POUR GOOGLE STITCH - ÉCRAN 1.2 (ERROR STATE)

```
Create the same download progress screen with error state:

DESIGN SYSTEM (SAME AS DOWNLOADING):
- Background: Dark primary (#1A1A1F)
- Card background: Dark secondary (#25252D)
- Error red: #FF4D4F
- Error red background: #FF4D4F20 (20% opacity)
- Text colors: White (#FFFFFF), secondary (#B4B4C0)
- Font: Inter

CHANGES FOR ERROR STATE:
1. Icon: Error/alert icon (48x48px, error red #FF4D4F)
2. Heading: "Échec du téléchargement" (22px semibold, white #FFFFFF)
3. Error message box:
   - Background: error red background (#FF4D4F20)
   - Border: 1px error red (#FF4D4F)
   - Border-radius: 8px
   - Padding: 16px
   - Text: "La connexion a été interrompue. Vérifiez votre connexion internet et réessayez." (14px regular, white #FFFFFF)
4. Progress bar: HIDDEN or grayed out at failed percentage
5. Action buttons (horizontal, 16px gap, centered):
   - Primary button: "Réessayer" (primary blue #0D7EFF, white text)
   - Secondary button: "Annuler" (dark tertiary #2F2F38, white text)

The error should be clear but offer immediate recovery action.
```

---

### Écran 1.3: Ready to Start

**Objectif:** Confirmation que l'app est prête - transition vers workflow principal

**Layout:**
- Header: Logo Splice
- Content: Card centrée avec message de succès

**États:**
- Success uniquement (pas d'états alternatifs)

---

#### PROMPT POUR GOOGLE STITCH - ÉCRAN 1.3 (SUCCESS STATE)

```
Create a success/ready screen for desktop video editing application with dark professional theme.

DESIGN SYSTEM:
- Background: Dark primary (#1A1A1F)
- Card background: Dark secondary (#25252D) with 1px border (#35353F), 12px border-radius, 24px padding
- Primary blue: #0D7EFF
- Success green: #52C41A
- Success green background: #52C41A20 (20% opacity)
- Text primary: #FFFFFF
- Text secondary: #B4B4C0
- Font: Inter, sans-serif

LAYOUT:
- Fixed header at top (64px height, dark secondary #25252D, 1px bottom border #35353F)
  - Logo "Splice" with icon
- Main content: centered card (max-width 480px)

CARD CONTENT (vertically stacked, 24px gaps):
1. Icon: Success checkmark in circle (64x64px, success green #52C41A)
2. Heading: "Tout est prêt !" (28px bold, white #FFFFFF, centered)
3. Success message box:
   - Background: success green background (#52C41A20)
   - Border: 1px success green (#52C41A)
   - Border-radius: 8px
   - Padding: 16px
   - Text: "Splice est activé et prêt à transformer vos rushs. Transcription locale à ultra-rapide." (14px regular, white #FFFFFF, centered)
4. Feature checklist (left-aligned, 12px gaps between items):
   - Each item: small checkmark icon (16x16px, success green) + text (14px regular, text secondary #B4B4C0)
   - Items:
     - "Transcription locale Parakeet installée"
     - "Licence activée"
     - "Import vidéo jusqu'à 50GB"
5. Primary button: "Commencer" (primary blue #0D7EFF, white text, 44px height, full width, 8px border-radius)

The design should feel celebratory but professional, ready to start working.
```

---

## Flow 2: Main Workflow

### Écran 2.1: Empty State / Import

**Objectif:** État initial - aucune vidéo importée, incite à drag & drop

**Layout:**
- Header: Logo Splice + Settings button (icône)
- Content: Zone de drop centrée avec instructions

**États:**
- Empty: Attente import
- Drag Over: Feedback visuel quand fichier survolé
- Validating: Vérification format après drop
- Error: Fichier non supporté

---

#### PROMPT POUR GOOGLE STITCH - ÉCRAN 2.1 (EMPTY STATE)

```
Create an empty state import screen for desktop video editing application with dark professional theme.

DESIGN SYSTEM:
- Background: Dark primary (#1A1A1F)
- Card background: Dark secondary (#25252D) with 1px border (#35353F)
- Primary blue: #0D7EFF
- Text primary: #FFFFFF
- Text secondary: #B4B4C0
- Border dashed: #35353F
- Font: Inter, sans-serif

LAYOUT:
- Fixed header at top (64px height, dark secondary #25252D, 1px bottom border #35353F)
  - Left: Logo "Splice" with icon (18px semibold white)
  - Right: Settings icon button (20x20px ghost button, text secondary color)
- Main content: Full height content area with 24px padding

CONTENT (centered vertically and horizontally):
- Large dashed border drop zone (border: 2px dashed #35353F, border-radius: 16px, padding: 64px vertical, 48px horizontal, max-width: 640px)

DROP ZONE CONTENT (vertically stacked, 24px gaps, all centered):
1. Icon: Large upload/video icon (64x64px, primary blue #0D7EFF)
2. Heading: "Importez votre première vidéo" (22px semibold, white #FFFFFF)
3. Description: "Glissez-déposez un fichier vidéo ici ou cliquez pour sélectionner" (14px regular, text secondary #B4B4C0)
4. Supported formats badge: "MP4 • MOV • AVI • Jusqu'à 50GB" (12px medium, text tertiary #7D7D8A, light background #2F2F38, 6px border-radius, 8px horizontal padding, 4px vertical padding)
5. Ghost button: "Parcourir les fichiers" (primary blue text #0D7EFF, 8px border-radius, 12px vertical padding, 24px horizontal padding)

The drop zone should feel inviting and make it obvious where to drag files.
```

---

#### PROMPT POUR GOOGLE STITCH - ÉCRAN 2.1 (DRAG OVER STATE)

```
Create the same import screen with visual feedback during file drag-over:

DESIGN SYSTEM (SAME AS EMPTY):
- Background: Dark primary (#1A1A1F)
- Primary blue: #0D7EFF
- Text colors: White (#FFFFFF), secondary (#B4B4C0)
- Font: Inter

CHANGES FOR DRAG OVER STATE:
- Drop zone border: 2px SOLID primary blue (#0D7EFF) instead of dashed - visually highlighted
- Drop zone background: primary blue with 10% opacity (#0D7EFF1A)
- Icon: Slightly larger (72x72px) with subtle pulse animation, primary blue
- Heading text changes to: "Déposez le fichier ici" (22px semibold, white)
- Description: HIDDEN or faded
- Supported formats badge: HIDDEN
- Ghost button: HIDDEN

Everything else identical. The user should clearly see the drop zone is active and ready to receive the file.
```

---

#### PROMPT POUR GOOGLE STITCH - ÉCRAN 2.1 (VALIDATING STATE)

```
Create the same import screen showing file validation:

DESIGN SYSTEM (SAME):
- Background: Dark primary (#1A1A1F)
- Card background: Dark secondary (#25252D)
- Primary blue: #0D7EFF
- Font: Inter

CHANGES FOR VALIDATING STATE:
- Drop zone: Now shows a card instead of dashed border (dark secondary #25252D, 1px border #35353F, 12px border-radius, 32px padding)

CARD CONTENT (vertically stacked, 16px gaps, centered):
1. Spinner icon: Rotating loading spinner (32x32px, primary blue #0D7EFF)
2. File name: "interview-client-final.mp4" (16px semibold, white #FFFFFF)
3. File info: "2.4 GB • MP4 • 01:23:45" (12px regular, text secondary #B4B4C0)
4. Status text: "Vérification du format..." (14px regular, text secondary #B4B4C0)
5. Small progress bar: indeterminate/animated (width: 200px, 4px height, primary blue)

The validation should feel quick but communicate that work is happening.
```

---

#### PROMPT POUR GOOGLE STITCH - ÉCRAN 2.1 (ERROR - FILE NOT SUPPORTED)

```
Create the same import screen showing file validation error:

DESIGN SYSTEM (SAME):
- Background: Dark primary (#1A1A1F)
- Card background: Dark secondary (#25252D)
- Error red: #FF4D4F
- Error red background: #FF4D4F20
- Font: Inter

CHANGES FOR ERROR STATE:
- Drop zone shows error card (dark secondary #25252D, 1px border #35353F, 12px border-radius, 32px padding)

ERROR CARD CONTENT (vertically stacked, 16px gaps, centered):
1. Error icon: Alert/X icon in circle (48x48px, error red #FF4D4F)
2. File name: "video-unknown.mkv" (16px semibold, white #FFFFFF)
3. Error message box:
   - Background: error red background (#FF4D4F20)
   - Border: 1px error red (#FF4D4F)
   - Border-radius: 8px
   - Padding: 16px
   - Text: "Format MKV non supporté. Utilisez MP4, MOV ou AVI." (14px regular, white #FFFFFF)
4. Primary button: "Choisir un autre fichier" (primary blue #0D7EFF, white text, 8px border-radius)

Below the error card, show the original empty drop zone again (dashed border, faded) so user can immediately try another file.
```

---

### Écran 2.2: Transcription Progress

**Objectif:** Afficher progression de la transcription (très rapide - 1-2s pour 60min)

**Layout:**
- Header: Logo Splice + Settings
- Content: Card centrée avec info vidéo + progression

**États:**
- Transcribing: Barre de progression
- Success: Transition automatique vers Transcript Editor

---

#### PROMPT POUR GOOGLE STITCH - ÉCRAN 2.2 (TRANSCRIBING STATE)

```
Create a transcription progress screen for desktop video editing application with dark professional theme.

DESIGN SYSTEM:
- Background: Dark primary (#1A1A1F)
- Card background: Dark secondary (#25252D) with 1px border (#35353F), 12px border-radius, 32px padding
- Primary blue: #0D7EFF
- Text primary: #FFFFFF
- Text secondary: #B4B4C0
- Font: Inter, sans-serif

LAYOUT:
- Fixed header (64px, dark secondary #25252D, 1px bottom border #35353F)
  - Left: Logo "Splice"
  - Right: Settings icon button (ghost)
- Main content: centered card (max-width: 580px)

CARD CONTENT (vertically stacked, 24px gaps):
1. Video thumbnail: 16:9 aspect ratio thumbnail preview (100% width, 12px border-radius, 1px border #35353F)
   - Overlay: dark gradient at bottom
   - Duration badge bottom-right: "01:23:45" (12px medium, white text, dark background rgba(0,0,0,0.75), 6px border-radius, 8px padding)

2. File info section (horizontal layout):
   - Left: File icon (24x24px, primary blue #0D7EFF)
   - Right (vertical stack, 4px gap):
     - File name: "interview-client-final.mp4" (16px semibold, white #FFFFFF)
     - File details: "2.4 GB • 1920x1080 • H.264" (12px regular, text secondary #B4B4C0)

3. Divider line: 1px solid border default (#35353F)

4. Progress section:
   - Status icon: AI/brain icon (24x24px, primary blue #0D7EFF) + text "Transcription en cours..." (14px medium, text secondary #B4B4C0)
   - Progress bar (same style as before):
     - Container: dark tertiary (#2F2F38), 8px height, 4px border-radius
     - Fill: primary blue (#0D7EFF), smooth animation
     - Percentage: "78%" (14px semibold, white, right aligned above bar)
   - Speed indicator: "Parakeet TDT • CPU • ~2 secondes restantes" (12px regular, text secondary #B4B4C0, centered below bar)

5. Info callout (optional):
   - Light background (#2F2F38), 8px border-radius, 12px padding
   - Icon: Info icon (16x16px, primary blue)
   - Text: "La transcription s'effectue localement sur votre machine. Aucune donnée n'est envoyée en ligne." (12px regular, text secondary #B4B4C0)

The screen should communicate fast, local, secure processing.
```

---

### Écran 2.3: Transcript Editor (Surlignage)

**Objectif:** Interface principale - lecture du transcript + surlignage des passages à garder

**Layout:**
- Header: Logo Splice + File name + Actions (Settings, Process Cuts button)
- Content: 2 colonnes - Transcript (gauche, 60%) + Video Preview (droite, 40%)

**États:**
- Default: Transcript affiché, pas de surlignage
- Highlighting: Utilisateur surligne du texte
- Ready to Process: Au moins un passage surligné, bouton "Générer les cuts" actif

---

#### PROMPT POUR GOOGLE STITCH - ÉCRAN 2.3 (DEFAULT STATE)

```
Create a transcript editor screen for desktop video editing application with dark professional theme. This is the MAIN working screen.

DESIGN SYSTEM:
- Background: Dark primary (#1A1A1F)
- Card background: Dark secondary (#25252D)
- Primary blue: #0D7EFF
- Highlight yellow: #FFD93D with 30% opacity background (#FFD93D30) for selected text
- Text primary: #FFFFFF
- Text secondary: #B4B4C0
- Monospace font for timestamps: 'SF Mono', Monaco, monospace
- Font: Inter, sans-serif

LAYOUT:
- Fixed header (64px height, dark secondary #25252D, 1px bottom border #35353F):
  - Left: Logo "Splice" + separator + file name "interview-client-final.mp4" (14px regular, text secondary)
  - Right: Ghost settings icon button + Primary button "Générer les cuts" (DISABLED state initially - 40% opacity)

- Main content: Two-column layout (24px gap, 24px padding):
  - LEFT COLUMN (60% width): Transcript editor
  - RIGHT COLUMN (40% width): Video preview (sticky)

LEFT COLUMN - TRANSCRIPT EDITOR:
- Container: dark secondary background (#25252D), 1px border (#35353F), 12px border-radius, 24px padding
- Toolbar at top (horizontal, 12px gap, 12px padding bottom, 1px bottom border #35353F):
  - Small text: "Surlignez les passages à conserver" (12px medium, text secondary #B4B4C0)
  - Info icon with tooltip trigger (16x16px, text secondary)
- Scrollable transcript area:
  - Each line/segment format:
    - Timestamp: "[00:00:42]" (12px regular, monospace, text tertiary #7D7D8A, clickable)
    - Space (8px)
    - Text: "Bonjour et bienvenue dans cette interview. Aujourd'hui nous allons parler de..." (16px regular, Inter, white #FFFFFF, line-height 28px, selectable text)
  - Spacing between segments: 16px
  - Show ~10 segments visible, rest scrollable

RIGHT COLUMN - VIDEO PREVIEW:
- Container: dark secondary background (#25252D), 1px border (#35353F), 12px border-radius, 16px padding
- Video player:
  - 16:9 aspect ratio
  - Thumbnail/poster frame of video (12px border-radius, 1px border #35353F)
  - Play button overlay center (48x48px circle, primary blue #0D7EFF with white play icon)
- Video controls below (24px gap):
  - Timeline scrubber: thin progress bar (4px height, dark tertiary #2F2F38 container, primary blue fill)
  - Time indicator: "00:00:42 / 01:23:45" (12px regular, monospace, text secondary, centered)
  - Control buttons (horizontal centered, 16px gap):
    - Play/Pause button (32x32px, primary blue background, white icon)
    - Volume button (24x24px, ghost, text secondary icon)

The editor should feel spacious, readable, and focused on text selection workflow.
```

---

#### PROMPT POUR GOOGLE STITCH - ÉCRAN 2.3 (HIGHLIGHTING STATE)

```
Create the same transcript editor screen with text highlighting active:

DESIGN SYSTEM (SAME AS DEFAULT):
- Background: Dark primary (#1A1A1F)
- Card background: Dark secondary (#25252D)
- Highlight yellow background: #FFD93D30 (30% opacity)
- Highlight yellow border: #FFD93D
- Text colors: White (#FFFFFF), secondary (#B4B4C0)
- Font: Inter

CHANGES FOR HIGHLIGHTING STATE:
- LEFT COLUMN - Transcript segments with highlighting:
  - Some text segments now have highlighted portions:
    - Highlighted text: yellow background (#FFD93D30), subtle yellow left border (3px solid #FFD93D)
    - Example:
      "[00:01:15] Le problème principal c'est que [HIGHLIGHTED TEXT: les monteurs passent 75% de leur temps à dérrusher au lieu de monter créativement. C'est un gaspillage énorme de talent.] Et donc..."
  - Multiple non-contiguous highlights can exist
  - Small badge at top of transcript showing: "3 passages surlignés • 12min 30s" (12px medium, text secondary, light background #2F2F38, 6px border-radius, 8px padding)

- HEADER:
  - Primary button "Générer les cuts": NOW ENABLED (full opacity, primary blue #0D7EFF, clickable)

The highlighted text should be visually distinct but not overwhelming - readable and elegant.
```

---

### Écran 2.4: Processing Cuts

**Objectif:** Génération automatique des cuts basés sur les passages surlignés

**Layout:**
- Header: Logo Splice + File name
- Content: Card centrée avec progression

**États:**
- Processing: Barre de progression
- Success: Transition automatique vers Preview

---

#### PROMPT POUR GOOGLE STITCH - ÉCRAN 2.4 (PROCESSING STATE)

```
Create a video processing/cutting screen for desktop video editing application with dark professional theme.

DESIGN SYSTEM:
- Background: Dark primary (#1A1A1F)
- Card background: Dark secondary (#25252D) with 1px border (#35353F), 12px border-radius, 32px padding
- Primary blue: #0D7EFF
- Text primary: #FFFFFF
- Text secondary: #B4B4C0
- Font: Inter, sans-serif

LAYOUT:
- Fixed header (64px, dark secondary #25252D, 1px bottom border #35353F)
  - Left: Logo "Splice" + separator + file name "interview-client-final.mp4"
- Main content: centered card (max-width: 580px)

CARD CONTENT (vertically stacked, 24px gaps):
1. Icon: Scissors/cut icon with animation (48x48px, primary blue #0D7EFF) - subtle cutting animation
2. Heading: "Génération des cuts" (22px semibold, white #FFFFFF, centered)
3. Stats box (horizontal layout, 16px gap, light background #2F2F38, 12px border-radius, 16px padding):
   - Stat 1: "3 segments" (14px semibold white) + "à conserver" (12px regular text secondary) - vertical stack
   - Divider: 1px vertical line (#35353F)
   - Stat 2: "12min 30s" (14px semibold white) + "durée finale" (12px regular text secondary)
   - Divider: 1px vertical line
   - Stat 3: "85%" (14px semibold white) + "réduction" (12px regular text secondary)

4. Progress bar section:
   - Label: "Traitement en cours..." (12px medium, text secondary, left aligned)
   - Percentage: "64%" (14px semibold, white, right aligned, same line as label)
   - Progress bar: 8px height, 4px border-radius, dark tertiary container (#2F2F38), primary blue fill (#0D7EFF), smooth animation
   - Technical detail below: "FFmpeg • Découpage précis • Word-level timestamps" (12px regular, text secondary, centered)

5. Estimated time: "Temps restant: ~8 secondes" (12px regular, text secondary, centered)

6. Info callout (light background #2F2F38, 8px border-radius, 12px padding):
   - Icon: Magic wand icon (16x16px, primary blue)
   - Text: "Marges automatiques de 0.1s appliquées pour transitions naturelles" (12px regular, text secondary)

The screen should communicate precision, speed, and intelligent processing.
```

---

### Écran 2.5: Preview

**Objectif:** Prévisualiser la vidéo cutée avant export - validation qualité

**Layout:**
- Header: Logo Splice + File name + Actions
- Content: Lecteur vidéo centré + Controls + Actions (Export, Retour)

**États:**
- Default: Vidéo prête à être prévisualisée
- Playing: Lecture en cours
- Paused: Lecture en pause

---

#### PROMPT POUR GOOGLE STITCH - ÉCRAN 2.5 (DEFAULT STATE)

```
Create a video preview screen for desktop video editing application with dark professional theme.

DESIGN SYSTEM:
- Background: Dark primary (#1A1A1F)
- Card background: Dark secondary (#25252D) with 1px border (#35353F)
- Primary blue: #0D7EFF
- Success green: #52C41A
- Text primary: #FFFFFF
- Text secondary: #B4B4C0
- Font: Inter, sans-serif

LAYOUT:
- Fixed header (64px, dark secondary #25252D, 1px bottom border #35353F):
  - Left: Logo "Splice" + separator + file name "interview-client-final.mp4"
  - Right: Ghost back button "← Retour au transcript" + Primary button "Exporter"

- Main content (centered, max-width: 960px, 24px padding):

1. Success banner at top (full width, success green background #52C41A20, 1px border success green #52C41A, 8px border-radius, 16px padding, 16px bottom margin):
   - Icon: Checkmark (20x20px, success green) + Text: "Vidéo cutée avec succès • 12min 30s de contenu final" (14px medium, white)

2. Video player container (dark secondary #25252D, 1px border #35353F, 16px border-radius, 24px padding):
   - Video display area:
     - 16:9 aspect ratio (full width)
     - Video poster/thumbnail (12px border-radius)
     - Large centered play button overlay (64x64px circle, primary blue #0D7EFF background, white play icon)
     - Duration badge bottom-right: "12:30" (12px medium, white text, dark background rgba(0,0,0,0.85), 6px border-radius, 8px padding)

   - Timeline scrubber below video (16px top margin):
     - Thin progress bar (6px height, dark tertiary #2F2F38 container, primary blue #0D7EFF fill, 3px border-radius)
     - Draggable handle on progress (12px circle, white, with shadow)

   - Time display: "00:00 / 12:30" (14px regular, monospace, text secondary, centered, 12px top margin)

   - Playback controls (horizontal centered, 16px gap, 24px top margin):
     - Skip back 10s button (32x32px, ghost, text secondary icon)
     - Play/Pause button (48x48px, primary blue #0D7EFF background, white icon)
     - Skip forward 10s button (32x32px, ghost, text secondary icon)
     - Divider: 1px vertical line (#35353F)
     - Volume button (32x32px, ghost, text secondary icon)
     - Volume slider (100px width, 4px height)
     - Divider
     - Fullscreen button (32x32px, ghost, text secondary icon)

3. Stats panel below player (24px top margin, horizontal layout, 16px gap):
   - Stat card 1 (flex-1, dark secondary #25252D, 1px border #35353F, 12px border-radius, 16px padding, centered):
     - Icon: Scissors (20x20px, primary blue)
     - Value: "3 segments" (18px semibold, white)
     - Label: "Passages conservés" (12px regular, text secondary)

   - Stat card 2 (same style):
     - Icon: Clock (20x20px, success green)
     - Value: "85%" (18px semibold, white)
     - Label: "Temps gagné" (12px regular, text secondary)

   - Stat card 3 (same style):
     - Icon: Target/precision (20x20px, primary blue)
     - Value: "100%" (18px semibold, white)
     - Label: "Précision cuts" (12px regular, text secondary)

The preview screen should feel professional, giving confidence in the result before export.
```

---

#### PROMPT POUR GOOGLE STITCH - ÉCRAN 2.5 (PLAYING STATE)

```
Create the same video preview screen with video playing:

DESIGN SYSTEM (SAME AS DEFAULT):
- Background: Dark primary (#1A1A1F)
- Card background: Dark secondary (#25252D)
- Primary blue: #0D7EFF
- Font: Inter

CHANGES FOR PLAYING STATE:
- Video display area:
  - Play button overlay: HIDDEN (video is playing)
  - Video frame visible
  - Duration badge remains visible: "12:30"

- Timeline scrubber:
  - Progress fill: animating/moving forward (e.g., at 45% = "05:37 / 12:30")
  - Handle position: moving with progress

- Time display: "05:37 / 12:30" (updating in real-time)

- Playback controls:
  - Play button: NOW SHOWS PAUSE ICON (primary blue background, white pause icon)

Everything else identical. The playing state should be obvious from the pause button and moving timeline.
```

---

### Écran 2.6: Export Success

**Objectif:** Confirmation que l'export est terminé + accès au fichier

**Layout:**
- Header: Logo Splice
- Content: Card centrée avec message de succès + actions

**États:**
- Success uniquement

---

#### PROMPT POUR GOOGLE STITCH - ÉCRAN 2.6 (SUCCESS STATE)

```
Create an export success screen for desktop video editing application with dark professional theme.

DESIGN SYSTEM:
- Background: Dark primary (#1A1A1F)
- Card background: Dark secondary (#25252D) with 1px border (#35353F), 12px border-radius, 32px padding
- Primary blue: #0D7EFF
- Success green: #52C41A
- Success green background: #52C41A20
- Text primary: #FFFFFF
- Text secondary: #B4B4C0
- Font: Inter, sans-serif

LAYOUT:
- Fixed header (64px, dark secondary #25252D, 1px bottom border #35353F)
  - Left: Logo "Splice"
- Main content: centered card (max-width: 540px)

CARD CONTENT (vertically stacked, 24px gaps):
1. Icon: Large success checkmark in circle (64x64px, success green #52C41A)
2. Heading: "Export terminé !" (28px bold, white #FFFFFF, centered)
3. Success message box:
   - Background: success green background (#52C41A20)
   - Border: 1px success green (#52C41A)
   - Border-radius: 8px
   - Padding: 16px
   - Text: "Votre vidéo cutée est prête à être importée dans Premiere Pro ou DaVinci Resolve." (14px regular, white, centered)

4. File info card (dark tertiary #2F2F38, 12px border-radius, 16px padding):
   - Row 1 (horizontal, space-between):
     - Left: File icon (24x24px, primary blue) + file name "interview-client-final_edited.mp4" (14px semibold, white)
     - Right: File size "487 MB" (12px regular, text secondary)
   - Row 2 (12px top margin, horizontal, 16px gap):
     - Info: "12min 30s • 1920x1080 • H.264" (12px regular, text secondary)

5. Saved location:
   - Label: "Emplacement:" (12px medium, text secondary)
   - Path: "/Users/username/Videos/Splice/interview-client-final_edited.mp4" (12px regular, monospace, text tertiary #7D7D8A, truncated with ellipsis if too long)
   - Copy path button inline (ghost, small, "Copier" text)

6. Action buttons (horizontal, 16px gap, full width):
   - Secondary button: "Afficher dans le Finder" (flex-1, dark tertiary #2F2F38, white text, 1px border #35353F)
   - Primary button: "Nouvelle vidéo" (flex-1, primary blue #0D7EFF, white text)

7. Stats summary (light background #2F2F38, 8px border-radius, 12px padding, horizontal layout, centered):
   - Icon: Sparkles (16x16px, success green)
   - Text: "Temps gagné: 1h 10min • 95% plus rapide qu'un dérushage manuel" (12px regular, text secondary)

The screen should feel celebratory and provide immediate next actions.
```

---

## Flow 3: Freemium Conversion

### Écran 3.1: Export Blocked (Freemium)

**Objectif:** Bloquer l'export pour utilisateurs gratuits après preview - inciter à souscrire

**Layout:**
- Modal overlay sur écran Preview
- Card centrée avec message de conversion

**États:**
- Blocked uniquement

---

#### PROMPT POUR GOOGLE STITCH - ÉCRAN 3.1 (BLOCKED STATE)

```
Create an export blocked modal for freemium conversion in desktop video editing application with dark professional theme.

DESIGN SYSTEM:
- Modal overlay: rgba(0,0,0,0.85) (darker overlay for focus)
- Modal container: Dark secondary (#25252D) with 1px border (#35353F), 16px border-radius, 32px padding
- Primary blue: #0D7EFF
- Warning orange: #FAAD14
- Warning orange background: #FAAD1420
- Text primary: #FFFFFF
- Text secondary: #B4B4C0
- Font: Inter, sans-serif

LAYOUT:
- Full-screen overlay with centered modal (max-width: 520px)

MODAL CONTENT (vertically stacked, 24px gaps):
1. Close button: Top-right ghost X button (24x24px, text secondary, hoverable)

2. Icon: Lock icon inside warning circle (56x56px, warning orange #FAAD14)

3. Heading: "Débloquez l'export" (24px bold, white #FFFFFF, centered)

4. Description: "Vous avez créé votre vidéo parfaitement cutée en quelques minutes. Souscrivez à Splice Pro pour exporter et gagner des heures chaque semaine." (14px regular, text secondary #B4B4C0, centered, max-width 420px)

5. Value proposition cards (vertical stack, 12px gap):
   - Card format: light background (#2F2F38), 8px border-radius, 12px padding

   - Card 1:
     - Icon: Checkmark (16x16px, success green #52C41A) + Text: "Export illimité en MP4 haute qualité" (14px regular, white)

   - Card 2:
     - Icon: Checkmark + Text: "Vidéos de toutes durées (pas de limite 30min)"

   - Card 3:
     - Icon: Checkmark + Text: "Transcription locale ultra-rapide (60min → 2s)"

   - Card 4:
     - Icon: Checkmark + Text: "Confidentialité totale - aucune donnée envoyée en ligne"

6. Pricing (centered):
   - Price: "15€ /mois" (32px bold, white #FFFFFF)
   - Subtext: "Annulable à tout moment" (12px regular, text secondary)

7. Primary button: "Souscrire à Splice Pro" (primary blue #0D7EFF, white text, 48px height, full width, 8px border-radius)

8. Secondary link below: "Continuer sans exporter" (12px medium, text secondary, centered, clickable)

The modal should feel persuasive but not aggressive - showcasing value clearly.
```

---

### Écran 3.2: Subscription Flow (External)

**Note:** Le flux de paiement sera géré par Stripe (externe à l'app). Pas besoin de design ici.

---

## Flow 4: Settings

### Écran 4.1: Settings Panel

**Objectif:** Paramètres de l'app - licence, préférences de base, à propos

**Layout:**
- Header: Logo Splice + Close button
- Content: Settings panel (sidebar + content)

**États:**
- Default: Affichage des paramètres

---

#### PROMPT POUR GOOGLE STITCH - ÉCRAN 4.1 (DEFAULT STATE)

```
Create a settings screen for desktop video editing application with dark professional theme.

DESIGN SYSTEM:
- Background: Dark primary (#1A1A1F)
- Card background: Dark secondary (#25252D) with 1px border (#35353F)
- Primary blue: #0D7EFF
- Success green: #52C41A
- Text primary: #FFFFFF
- Text secondary: #B4B4C0
- Font: Inter, sans-serif

LAYOUT:
- Fixed header (64px, dark secondary #25252D, 1px bottom border #35353F):
  - Left: Logo "Splice" + separator + "Paramètres" (14px regular, text secondary)
  - Right: Close button (ghost, "✕" icon or "Fermer" text)

- Main content: Two-column layout (24px gap, 24px padding):
  - LEFT SIDEBAR (240px fixed width): Navigation menu
  - RIGHT CONTENT (flex-1): Settings panels

LEFT SIDEBAR - NAVIGATION:
- Menu items (vertical stack, 4px gap):
  - Each item: 32px height, 12px horizontal padding, 6px border-radius, hoverable
  - Active item: light background (#2F2F38), white text, primary blue left border (3px)
  - Inactive item: transparent background, text secondary, no border

  - Menu structure:
    - "Licence" (active)
    - "Général"
    - "Parakeet"
    - "À propos"

RIGHT CONTENT - LICENCE PANEL:
1. Section heading: "Licence" (22px semibold, white #FFFFFF, 24px bottom margin)

2. License status card (dark secondary #25252D, 1px border #35353F, 12px border-radius, 24px padding):
   - Row 1 (horizontal, space-between, align-center):
     - Left: Status badge (success green background #52C41A20, success green text, 6px border-radius, 8px horizontal padding, 4px vertical padding, 12px medium): "✓ Splice Pro Actif"
     - Right: "Gérer l'abonnement" link (12px medium, primary blue, clickable)

   - Divider: 1px line (#35353F), 16px vertical margin

   - Row 2 (info list, vertical, 12px gaps):
     - Label: "Email" (12px medium, text secondary) + Value: "nicolas@example.com" (14px regular, white)
     - Label: "Plan" (12px medium, text secondary) + Value: "Splice Pro - Mensuel" (14px regular, white)
     - Label: "Prochaine facturation" (12px medium, text secondary) + Value: "28 février 2026" (14px regular, white)

   - Divider: 1px line, 16px vertical margin

   - Danger zone:
     - Secondary button (full width): "Se déconnecter" (dark tertiary #2F2F38, white text, 1px border #35353F, 8px border-radius)

3. Offline mode info (24px top margin, light background #2F2F38, 8px border-radius, 16px padding):
   - Icon: Info icon (20x20px, primary blue)
   - Text: "Grace period: 7 jours sans connexion • Dernière vérification: il y a 2 heures" (12px regular, text secondary)

The settings should feel organized, professional, and provide clear account information.
```

---

## Flow 5: Error States

### Écran 5.1: File Not Supported

**(Déjà couvert dans Écran 2.1 - Error State)**

---

### Écran 5.2: No Internet Connection (During First Launch)

**Objectif:** Gérer l'absence de connexion lors du premier lancement (téléchargement Parakeet impossible)

**Layout:**
- Header: Logo Splice
- Content: Card centrée avec message d'erreur

**États:**
- Error uniquement

---

#### PROMPT POUR GOOGLE STITCH - ÉCRAN 5.2 (NO INTERNET ERROR)

```
Create a no internet connection error screen for desktop video editing application with dark professional theme.

DESIGN SYSTEM:
- Background: Dark primary (#1A1A1F)
- Card background: Dark secondary (#25252D) with 1px border (#35353F), 12px border-radius, 32px padding
- Error red: #FF4D4F
- Error red background: #FF4D4F20
- Text primary: #FFFFFF
- Text secondary: #B4B4C0
- Font: Inter, sans-serif

LAYOUT:
- Fixed header (64px, dark secondary #25252D, 1px bottom border #35353F)
  - Logo "Splice" centered
- Main content: centered card (max-width: 480px)

CARD CONTENT (vertically stacked, 24px gaps):
1. Icon: Wifi-off/disconnected icon (56x56px, error red #FF4D4F)

2. Heading: "Connexion requise" (24px bold, white #FFFFFF, centered)

3. Error message box:
   - Background: error red background (#FF4D4F20)
   - Border: 1px error red (#FF4D4F)
   - Border-radius: 8px
   - Padding: 16px
   - Text: "Impossible de télécharger le moteur de transcription Parakeet. Vérifiez votre connexion internet et réessayez." (14px regular, white, centered)

4. Requirements list (light background #2F2F38, 8px border-radius, 16px padding, left-aligned):
   - Title: "Pour le premier lancement, vous avez besoin de:" (12px medium, text secondary, 12px bottom margin)
   - Checklist (vertical, 8px gaps):
     - Icon: Checkmark outline (16x16px, text secondary) + Text: "Connexion internet stable" (14px regular, text secondary)
     - Icon: Checkmark outline + Text: "~500 MB d'espace disque disponible"
     - Icon: Checkmark outline + Text: "Téléchargement du modèle Parakeet (~2-5 minutes)"

5. Info callout (12px regular, text secondary, centered, max-width 400px):
   "Une fois installé, Splice fonctionnera entièrement hors-ligne pour la transcription."

6. Primary button: "Réessayer" (primary blue #0D7EFF, white text, 44px height, full width, 8px border-radius)

7. Secondary button: "Quitter" (transparent, text secondary, 40px height, centered)

The error should be clear but encouraging - emphasizing that offline will work after first setup.
```

---

### Écran 5.3: Processing Failed

**Objectif:** Échec du traitement des cuts (erreur FFmpeg, fichier corrompu, etc.)

**Layout:**
- Header: Logo Splice + File name
- Content: Card centrée avec message d'erreur

**États:**
- Error uniquement

---

#### PROMPT POUR GOOGLE STITCH - ÉCRAN 5.3 (PROCESSING FAILED)

```
Create a video processing failure error screen for desktop video editing application with dark professional theme.

DESIGN SYSTEM:
- Background: Dark primary (#1A1A1F)
- Card background: Dark secondary (#25252D) with 1px border (#35353F), 12px border-radius, 32px padding
- Error red: #FF4D4F
- Error red background: #FF4D4F20
- Text primary: #FFFFFF
- Text secondary: #B4B4C0
- Font: Inter, sans-serif

LAYOUT:
- Fixed header (64px, dark secondary #25252D, 1px bottom border #35353F)
  - Left: Logo "Splice" + separator + file name "interview-client-final.mp4"
- Main content: centered card (max-width: 520px)

CARD CONTENT (vertically stacked, 24px gaps):
1. Icon: Alert/error icon (56x56px, error red #FF4D4F)

2. Heading: "Échec du traitement" (24px bold, white #FFFFFF, centered)

3. Error message box:
   - Background: error red background (#FF4D4F20)
   - Border: 1px error red (#FF4D4F)
   - Border-radius: 8px
   - Padding: 16px
   - Text: "Une erreur est survenue lors de la génération des cuts. Le fichier vidéo est peut-être corrompu ou un codec n'est pas supporté." (14px regular, white, centered)

4. Technical details (collapsible accordion, optional):
   - Header: "Détails techniques" (12px medium, text secondary, clickable, chevron icon)
   - Content (when expanded):
     - Dark tertiary background (#2F2F38), 8px border-radius, 12px padding
     - Monospace text: "FFmpeg error code 1: Invalid codec parameters..." (11px regular, monospace, text tertiary #7D7D8A, max 3 lines, scrollable)

5. Suggested actions (light background #2F2F38, 8px border-radius, 16px padding):
   - Title: "Suggestions:" (12px medium, text secondary, 8px bottom margin)
   - List (vertical, 8px gaps):
     - "• Vérifiez que le fichier n'est pas corrompu"
     - "• Essayez de ré-encoder la vidéo avec Handbrake"
     - "• Contactez le support avec les détails techniques"

6. Action buttons (horizontal, 16px gap, full width):
   - Secondary button: "Choisir un autre fichier" (flex-1, dark tertiary #2F2F38, white text, 1px border #35353F)
   - Primary button: "Réessayer" (flex-1, primary blue #0D7EFF, white text)

7. Support link: "Contacter le support" (12px medium, primary blue, centered, clickable)

The error should provide actionable information and recovery options.
```

---

### Écran 5.4: License Grace Period Expiring

**Objectif:** Avertir l'utilisateur qu'il doit se reconnecter pour vérifier la licence (après 5-7 jours offline)

**Layout:**
- Modal overlay sur l'écran actuel
- Card centrée avec avertissement

**États:**
- Warning uniquement

---

#### PROMPT POUR GOOGLE STITCH - ÉCRAN 5.4 (LICENSE WARNING)

```
Create a license grace period warning modal for desktop video editing application with dark professional theme.

DESIGN SYSTEM:
- Modal overlay: rgba(0,0,0,0.75)
- Modal container: Dark secondary (#25252D) with 1px border (#35353F), 16px border-radius, 32px padding
- Warning orange: #FAAD14
- Warning orange background: #FAAD1420
- Primary blue: #0D7EFF
- Text primary: #FFFFFF
- Text secondary: #B4B4C0
- Font: Inter, sans-serif

LAYOUT:
- Full-screen overlay with centered modal (max-width: 480px)

MODAL CONTENT (vertically stacked, 24px gaps):
1. Close button: Top-right ghost X button (24x24px, text secondary)

2. Icon: Warning triangle (56x56px, warning orange #FAAD14)

3. Heading: "Vérification de licence requise" (24px bold, white #FFFFFF, centered)

4. Warning message box:
   - Background: warning orange background (#FAAD1420)
   - Border: 1px warning orange (#FAAD14)
   - Border-radius: 8px
   - Padding: 16px
   - Text: "Vous êtes hors-ligne depuis 6 jours. Connectez-vous à internet pour vérifier votre licence Splice Pro." (14px regular, white, centered)

5. Grace period info (light background #2F2F38, 8px border-radius, 12px padding):
   - Label: "Grace period:" (12px medium, text secondary)
   - Progress bar (8px top margin):
     - Container: dark tertiary (#2F2F38), 6px height, 3px border-radius
     - Fill: warning orange (#FAAD14) at 85% width (6 days / 7 days)
   - Text below: "6 jours écoulés sur 7 jours autorisés" (12px regular, text secondary, 8px top margin)

6. Info text: "Vos projets et paramètres sont sauvegardés. Vous pourrez continuer à travailler normalement après vérification." (12px regular, text secondary, centered, max-width 400px)

7. Primary button: "Vérifier maintenant" (primary blue #0D7EFF, white text, 44px height, full width, 8px border-radius)

8. Secondary link: "Me rappeler plus tard" (12px medium, text secondary, centered, clickable)

The warning should be informative but not alarming - clearly explaining what's needed.
```

---

## Fin du Document

**Total écrans documentés: 20+ variantes**

**Flows couverts:**
- ✅ First Launch & Onboarding (3 écrans)
- ✅ Main Workflow (6 écrans)
- ✅ Freemium Conversion (1 écran)
- ✅ Settings (1 écran)
- ✅ Error States (4 écrans)

**Instructions d'utilisation:**
1. Copiez chaque prompt "POUR GOOGLE STITCH" individuellement dans Stitch
2. Stitch générera l'interface basée sur les spécifications détaillées
3. Les prompts répètent le design system pour garantir la cohérence
4. Tous les états (default, loading, error, success) sont documentés séparément

**Notes importantes:**
- Le design system est cohérent à travers tous les écrans
- Le thème sombre professionnel s'inspire de Premiere Pro / DaVinci Resolve
- Toutes les interactions et composants sont spécifiés
- Les prompts sont autonomes (répètent les specs) pour éviter les incohérences

---

**Prochaines étapes recommandées:**
1. Générer les écrans principaux d'abord (Flow 2: Main Workflow)
2. Valider le design system avec les premiers écrans
3. Ajuster la palette si nécessaire avant de générer tous les écrans
4. Générer les états d'erreur en dernier

**Contact:** Pour questions ou ajustements, référez-vous au PRD complet: `/Users/nicoduch/Documents/Dev/splice/_bmad-output/planning-artifacts/prd.md`
