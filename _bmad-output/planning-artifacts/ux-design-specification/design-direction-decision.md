# Design Direction Decision

## Design Directions Explored

**Approche Pragmatique: Direction Unique et Focalisée**

Plutôt que d'explorer 6-8 variations complètes, nous avons défini collaborativement une direction de design claire et cohérente basée sur:
- Les besoins utilisateurs (monteurs professionnels)
- Les patterns mentaux existants (interface NLE familière)
- Les objectifs émotionnels (empowerment, rapidité, confiance)
- Les contraintes techniques (desktop app, Tauri, web frontend)

Cette approche focalisée est adaptée à un développement MVP solo où l'efficacité prime sur l'exploration exhaustive. La direction choisie intègre déjà tous les insights des étapes précédentes.

## Chosen Direction

**Direction: "NLE Professional Dark" - Interface Timeline Familière avec Innovation Textuelle**

**Layout Principal: 3-Zones Verticales + Timeline Bas**

```
┌─────────────────────────────────────────┐
│ Header (48px) - Actions, Status         │
├──────────────┬──────────────────────────┤
│              │                          │
│  Transcript  │      Video Preview       │
│   Editor     │      (Active State)      │
│  (30-35%)    │      (40-45%)           │
│              │                          │
│  - Scrollable│  - Play/Pause           │
│  - Highlight │  - Scrubbing            │
│  - Synced    │  - Frame controls       │
│              │                          │
├──────────────┴──────────────────────────┤
│  Timeline (120-150px)                   │
│  - Segments colorés (vert/gris)         │
│  - Synchronisation temps réel           │
└─────────────────────────────────────────┘
```

**Visual Identity:**
- **Theme:** Dark mode exclusif (fond `#0a0a0a`, surface `#171717`)
- **Brand Color:** Vert emerald `#10b981` pour sélections et actions primaires
- **Typography:** Inter/System UI, 16px body pour transcript, line-height 1.7
- **Spacing:** Compact mais respirable - focus sur contenu, minimal chrome UI
- **Aesthetic:** Professionnel NLE, sharp edges timeline, subtle borders

**Key Visual Features:**

1. **Synchronisation Texte-Timeline:**
   - Surlignage texte (vert clair) → segment timeline (vert foncé) simultané
   - Animation subtile (<16ms) renforce lien mental
   - Hover texte = preview position timeline (ligne verticale légère)

2. **Hiérarchie Visuelle Claire:**
   - Transcript = zone primaire (30-35% largeur, contraste élevé)
   - Preview = zone focus (40-45%, vidéo full quality)
   - Timeline = référence visuelle (120-150px bas, toujours visible)

3. **Feedback Informatif:**
   - Compteur durée: "32min15s sélectionnés / 60min00s" (header)
   - Progress bars transparents (%, temps estimé, annulation)
   - States clairs: Selected (vert), Unselected (gris), Hover (teal), Focus (bleu)

4. **Affordances Familières:**
   - Timeline controls = iconographie NLE standard (play triangle, stop square)
   - Raccourcis clavier mappés Premiere/DaVinci (espace, J/K/L, flèches)
   - Terminologie métier (Timeline, Playhead, In/Out points)

## Design Rationale

**Pourquoi cette direction unique fonctionne:**

**1. Familiarité Maximale + Innovation Ciblée**
L'interface reprend 100% les codes visuels des NLE professionnels que les monteurs connaissent par cœur (timeline en bas, preview centrale, dark mode). L'innovation (paradigme textuel de curation) vit **à l'intérieur** de cette familiarité, pas en opposition. Résultat: zéro courbe d'apprentissage structure + moment "wow" sur la nouveauté qui compte (synchronisation texte-vidéo).

**2. Alignement Objectifs Émotionnels**
- **Empowerment:** Layout donne contrôle total - transcript, timeline, preview visibles simultanément
- **Confiance:** Dark mode pro + feedback transparent = sérieux et fiable
- **Rapidité Viscérale:** Synchronisation <16ms texte-timeline renforce sentiment de vitesse
- **Flow:** Layout compact maximise espace contenu, minimise distractions chrome UI

**3. Contraintes Techniques Respectées**
- **Desktop-first:** Layout 3-zones optimisé pour écrans 15"+ (usage monteur typique)
- **Tauri + Web:** Composants Shadcn/ui (standards) + custom timeline/transcript (Tailwind)
- **Performance:** Dark mode réduit rendu couleurs, layout fixe évite reflows constants

**4. Scalabilité MVP → Post-MVP**
Direction permet évolutions naturelles sans refonte:
- Ajout multi-projets: sidebar gauche repliable
- Ajout précision mode: panel tools right collapsible
- Ajout collaboration: header comments/annotations
- Ajout dark/light toggle: palette déjà semantic, swap facile

**5. Différenciation Compétitive Visuelle**
- **vs Premiere/DaVinci:** Transcript central (pas sidebar hidden) = innovation visible immédiate
- **vs Descript:** Timeline NLE-like (pas waveform only) = sérieux pro, pas consumer app
- **vs Outils web génériques:** Dark mode sharp + vert emerald = identité brand forte

## Implementation Approach

**Phase 1: Structure Layout (Semaine 1)**
1. Définir CSS Grid 3-zones avec hauteurs/largeurs fixes
2. Implémenter header compact (48px) avec actions primaires
3. Tester responsive breakpoints (13" vs 15"+)
4. Valider navigation clavier entre zones (Tab, focus visible)

**Phase 2: Composants Standards (Semaine 1-2)**
1. Installer Shadcn/ui: Button, Dialog, Progress, Toast, Tooltip
2. Customiser thème dark avec palette définie
3. Créer boutons actions (Générer cuts, Exporter, Annuler)
4. Implémenter modals erreurs et blocage freemium

**Phase 3: Composants Custom Critiques (Semaine 2-4)**

**Transcript Editor:**
- Conteneur scrollable, max-width 65-75 caractères
- Surlignage texte natif avec event listeners
- Synchronisation état sélections → store global
- Hover events pour preview position timeline

**Timeline Component:**
- Rendu canvas ou SVG pour performance (segments nombreux)
- Colorisation temps réel (vert sélectionné, gris non-sélectionné)
- Scrubbing interaction (drag horizontal)
- Synchronisation store global sélections

**Video Preview Player:**
- Video element HTML5 avec controls custom
- Boutons play/pause/scrub style NLE
- Raccourcis clavier (espace, J/K/L, flèches)
- Synchronisation playhead avec transcript scroll

**Phase 4: Synchronisation & Polish (Semaine 4-5)**
1. Implémenter synchronisation bidirectionnelle texte ↔ timeline (<16ms)
2. Animations subtiles feedback (pulse sélection, transitions states)
3. Compteur durée sélectionnée temps réel
4. Tests accessibilité (contraste, keyboard nav, screen reader)

**Phase 5: États & Feedback (Semaine 5-6)**
1. Progress bars operations longues (transcription, cuts, export)
2. Messages d'erreur clairs avec retry facile
3. Toasts success/info discrètes
4. Auto-save silencieux + crash recovery

**Outils de Développement:**
- **Tailwind CSS:** Styling rapide avec classes utility
- **Shadcn/ui:** Composants accessibles pré-faits
- **Radix UI:** Primitives headless pour interactions complexes
- **Framer Motion (optionnel):** Animations synchronisation si besoin

**Validation Continue:**
- Tests utilisateurs pilotes (Orlan, Ayub) à chaque phase
- Ajustements densité/spacing basés sur feedback réel
- Performance profiling (gros transcripts 60min+, timeline segments nombreux)
