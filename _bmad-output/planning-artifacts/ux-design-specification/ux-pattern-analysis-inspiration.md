# UX Pattern Analysis & Inspiration

## Inspiring Products Analysis

**Professional NLE (Premiere Pro, DaVinci Resolve, CapCut)**

**Forces UX:**
- Timeline visuelle universelle: pattern mental ancré chez tous les monteurs, reconnaissance immédiate
- Raccourcis clavier standardisés: muscle memory préservée (espace = play/pause, J/K/L = scrub, flèches = frame-by-frame)
- Contrôle précis: ajustements frame par frame, marqueurs in/out, zoom timeline
- Presets réutilisables: configurations sauvegardées pour workflows répétitifs

**Leçons pour Splice:**
L'interface timeline n'est pas à réinventer - elle est **parfaite** pour ce qu'elle fait. Splice doit l'adopter intégralement pour exploiter la familiarité existante. L'innovation vient du paradigme textuel synchronisé avec cette timeline, pas de la timeline elle-même.

**Descript (édition vidéo via transcription)**

**Forces UX:**
- Synchronisation texte-vidéo bidirectionnelle: clic sur mot = jump to timestamp, édition texte = édition vidéo
- Transcription automatique rapide: pas de friction entre import et édition
- Édition textuelle familière: tout le monde sait éditer du texte

**Leçons pour Splice:**
Descript prouve que le paradigme textuel fonctionne pour la vidéo. MAIS leur focus est l'édition granulaire (supprimer mots, réorganiser phrases). Splice se différencie par la **curation rapide** (surligner massivement passages à garder) plutôt que l'édition fine. Le pattern de synchronisation est transférable, l'usage est différent.

**Applications rapides (Linear, Raycast, Superhuman)**

**Forces UX:**
- Vitesse viscérale: chaque interaction <100ms, sentiment de réponse instantanée
- Feedback visuel immédiat: animations subtiles confirment chaque action
- Raccourcis omniprésents: navigation complète au clavier sans souris
- Pas de friction: auto-save, pas de modals, workflow continu

**Leçons pour Splice:**
La rapidité doit être **ressentie**, pas juste mesurée. Synchronisation texte-timeline doit être temps réel (<16ms). Auto-save silencieux. Raccourcis clavier pour power users. Chaque interaction renforce "cet outil est rapide".

## Transferable UX Patterns

**Navigation Patterns:**

1. **Timeline universelle** (de tous les NLE)
   - Pattern: Représentation visuelle horizontale du temps, segments colorés, scrubbing direct
   - Transfert Splice: Timeline en bas montre sélections textuelles comme segments vidéo, synchronisation bidirectionnelle
   - Bénéfice: Reconnaissance immédiate, zéro courbe d'apprentissage structure

2. **Raccourcis clavier standards** (de Premiere/DaVinci)
   - Pattern: Espace (play/pause), J/K/L (scrub), Flèches (frame-by-frame), I/O (in/out)
   - Transfert Splice: Même mapping pour preview, navigation transcript au clavier, sélection rapide
   - Bénéfice: Muscle memory préservée, productivité immédiate

**Interaction Patterns:**

1. **Synchronisation bidirectionnelle** (de Descript)
   - Pattern: Clic texte → jump vidéo, édition texte → édition vidéo
   - Transfert Splice: Surlignage texte → sélection timeline, hover texte → preview position
   - Bénéfice: Bridge naturel entre paradigme textuel et visuel

2. **Feedback instantané** (de apps rapides)
   - Pattern: Réponse visuelle <100ms, animations subtiles, pas de délai perceptible
   - Transfert Splice: Synchronisation temps réel texte-timeline, preview seek instantané
   - Bénéfice: Sentiment de contrôle direct, flow non interrompu

3. **Drag & drop universel** (pattern OS)
   - Pattern: Déposer fichier = import immédiat, validation visuelle claire
   - Transfert Splice: Drop vidéo → transcription auto, validation format immédiate
   - Bénéfice: Friction minimale, workflow naturel

**Visual Patterns:**

1. **Segmentation colorée** (de timelines NLE)
   - Pattern: Segments visuellement distincts, couleurs pour catégories
   - Transfert Splice: Passages surlignés = segments verts sur timeline, non-surlignés = gris
   - Bénéfice: Compréhension visuelle immédiate de la sélection

2. **Progression transparente** (de apps modernes)
   - Pattern: Barre de progression, pourcentage précis, temps estimé, annulation visible
   - Transfert Splice: Transcription, génération cuts, export avec feedback complet
   - Bénéfice: Réassurance, confiance, contrôle

## Anti-Patterns to Avoid

**1. Import complexe et opaque**
- **Problème observé:** File pickers lents, formats supportés non documentés, crashes sur gros fichiers sans warning
- **Impact:** Anxiété utilisateur, abandons précoces, première impression négative
- **Solution Splice:** Drag & drop direct, validation format immédiate avec message clair, architecture streaming pour 50GB

**2. Feedback vague ou mensonger**
- **Problème observé:** "Processing..." indéfini, estimations temps optimistes (5min → 30min réel), pas d'annulation
- **Impact:** Frustration, perte de confiance, anxiété ("est-ce que ça a planté?")
- **Solution Splice:** Pourcentage précis, estimation temps honnête, annulation toujours disponible

**3. Perte de travail**
- **Problème observé:** Crashes perdent session, "Voulez-vous sauvegarder?" oubliable, pas de recovery
- **Impact:** Rage quit, perte confiance totale, abandon outil
- **Solution Splice:** Auto-save silencieux 30s, crash recovery automatique au redémarrage

**4. Innovation déroutante**
- **Problème observé:** Interface "révolutionnaire" mais non-standard, patterns inventés, terminologie nouvelle
- **Impact:** Courbe d'apprentissage inutile, friction cognitive, rejet par pros
- **Solution Splice:** Timeline familière, raccourcis standards, terminologie NLE connue. L'innovation (paradigme textuel) vient **dans** la familiarité, pas **contre** elle.

**5. Feature bloat prématuré**
- **Problème observé:** Options partout, menus profonds, features avancées en avant, complexité imposée
- **Impact:** Paralysie décisionnelle, workflow ralenti, sentiment "trop compliqué pour moi"
- **Solution Splice:** Workflow principal ultra-simple (surlignage → cuts), features avancées accessibles mais pas imposées (ajustements précis disponibles, pas obligatoires)

## Design Inspiration Strategy

**What to Adopt (utiliser tel quel):**

1. **Timeline visuelle en bas** - Pattern NLE universel, reconnaissance immédiate, zéro courbe d'apprentissage
2. **Raccourcis clavier standards** - Espace, J/K/L, flèches = muscle memory préservée
3. **Feedback transparent** - Pourcentages précis, temps estimé honnête, annulation visible = confiance
4. **Drag & drop import** - Pattern OS universel, friction minimale

**What to Adapt (modifier pour Splice):**

1. **Synchronisation texte-vidéo** (inspiré Descript) - Adapté pour curation massive (surlignage rapide) plutôt qu'édition granulaire
2. **Auto-save silencieux** (pattern apps modernes) - Appliqué au contexte montage vidéo (sauvegarde projet toutes les 30s)
3. **Vitesse viscérale** (apps rapides) - Appliqué à transcription ML (1-2s pour 60min) et synchronisation temps réel
4. **Presets réutilisables** (NLE pros) - Post-MVP: marges personnalisées, patterns sélection courants

**What to Avoid (rejeter explicitement):**

1. **Import complexe** - Pas de file picker lent, pas de formats obscurs, pas de crash gros fichiers
2. **Feedback vague** - Jamais de "Processing..." indéfini, jamais d'estimations optimistes mensongères
3. **Perte de travail** - Jamais de session perdue, jamais de "oups j'ai oublié de sauvegarder"
4. **Interface non-standard** - Pas d'innovation gratuite qui désoriente les pros
5. **Complexité prématurée** - MVP simple, features avancées post-MVP uniquement

**Guiding Principle:**
L'innovation de Splice (paradigme textuel pour curation vidéo) doit vivre **à l'intérieur** d'une interface familière (timeline NLE), pas **à la place**. Les monteurs doivent dire "c'est comme Premiere, mais avec de la magie textuelle" - pas "c'est un outil bizarre qui fait du montage différemment".
