# Core User Experience Definition

## Defining Experience

**L'interaction centrale: "Surligner du texte pour garder ces passages dans la vidéo finale"**

Splice se définit par une seule interaction centrale: l'utilisateur lit le transcript comme un article, surligne les passages à conserver, et le système traduit automatiquement ces sélections textuelles en segments vidéo à garder. Cette interaction, si parfaitement exécutée, rend tout le reste du produit évident et naturel.

**Ce que les utilisateurs diront:**
"Tu lis le transcript comme un article, tu surligne ce que tu veux garder, et ça génère les cuts automatiquement. J'ai fait 1h de rushes en 4 minutes."

**Pourquoi c'est l'expérience centrale:**
- **Simple à expliquer:** Une phrase suffit pour comprendre le concept
- **Intuitive:** Tout le monde sait surligner du texte
- **Magique:** La synchronisation texte → vidéo crée le moment "wow"
- **Différenciante:** Aucun concurrent ne propose cette approche de curation massive

Si le surlignage est fluide, la synchronisation instantanée, et le résultat précis → Splice réussit. Si c'est laggy, confus, ou imprécis → Splice échoue, peu importe les autres features.

## User Mental Model

**Modèle mental existant (ce que les utilisateurs connaissent):**

1. **Lecture de texte:** Les monteurs savent lire rapidement du texte (scripts, notes, sous-titres). Pattern ultra-familier.
2. **Surlignage:** Tout le monde surligne des passages importants dans des documents (PDF, articles, notes). Geste naturel.
3. **Timeline NLE:** Les monteurs pensent en "timeline horizontale" avec segments visuels. Pattern ancré depuis des années.

**Modèle mental nouveau (ce qu'on introduit):**

4. **Synchronisation bidirectionnelle:** Le lien texte ↔ timeline est nouveau pour la curation vidéo. Surligner texte = sélectionner segment vidéo. Ce pattern doit être **évident visuellement** sans explication verbale.

**Apprentissage intuitif:**
Le pattern novel (synchronisation) est appris par l'**affordance visuelle** immédiate: dès que l'utilisateur surligne le premier mot, la timeline s'illumine instantanément au même endroit. Le lien devient évident sans tutorial. "Ah, le texte et la timeline sont connectés."

**Mental model résultant:**
Après 30 secondes d'utilisation, l'utilisateur pense: "Le texte, c'est ma vidéo. Surligner, c'est garder. La timeline me montre ce que j'ai sélectionné." C'est simple, visuel, immédiat.

## Success Criteria

**L'interaction est réussie quand:**

1. **Vitesse perçue instantanée (<16ms):**
   - Surlignage texte → timeline update sans délai perceptible
   - Aucun lag entre action et feedback visuel
   - Sentiment de "réponse immédiate" = contrôle direct

2. **Feedback visuel clair et évident:**
   - Texte surligné = couleur distinctive (vert?)
   - Timeline segments sélectionnés = même couleur (vert)
   - Non-sélectionné = gris/neutre
   - Impossible de se tromper sur "qu'est-ce qui est sélectionné?"

3. **Synchronisation précise:**
   - Texte surligné correspond exactement aux segments timeline
   - Pas de décalage visuel
   - Hover texte = preview position timeline (optionnel mais renforce lien)

4. **Fluidité du geste:**
   - Surlignage massif rapide (80% du transcript en 2-3min)
   - Pas de ralentissement avec gros transcripts (60min+)
   - Sélection/dé-sélection intuitive

5. **Feedback durée totale:**
   - Compteur visible: "32min15s sélectionnés sur 60min00s"
   - Utilisateur sait toujours combien il a sélectionné
   - Aide à calibrer (trop? pas assez?)

**Indicateurs d'échec (ce qui tuerait l'expérience):**
- Lag >100ms entre surlignage et timeline update
- Confusion sur "qu'est-ce qui est sélectionné?"
- Synchronisation imprécise (texte ≠ timeline)
- Lenteur avec longs transcripts

## Novel UX Patterns

**Patterns établis (on adopte):**

1. **Surlignage de texte:** Pattern universel, zéro apprentissage. Utilisé dans Google Docs, PDF readers, navigateurs, notes apps.
2. **Timeline horizontale:** Pattern NLE universel, ancré chez monteurs. Utilisé dans Premiere, DaVinci, Final Cut, CapCut.
3. **Segmentation colorée:** Segments visuels distincts sur timeline = pattern standard NLE.

**Pattern novel (on innove):**

**Synchronisation bidirectionnelle texte ↔ timeline pour curation:**
- **Nouveau:** Aucun NLE ne permet de "surligner du texte pour sélectionner vidéo"
- **Descript fait édition granulaire** (supprimer mots), pas curation massive
- **Splice fait curation rapide** (garder blocs entiers en 2-3min)

**Comment on enseigne ce pattern novel:**

1. **Affordance visuelle immédiate:** Dès le premier surlignage, timeline s'illumine au même endroit. Lien évident sans mots.
2. **Tooltip subtil (premier lancement):** Message discret "Surlignez le texte pour sélectionner les passages à garder" puis disparaît après première interaction.
3. **Feedback renforcé:** Animations subtiles lors synchronisation (pulse léger? highlight temporaire?) renforcent le lien mental.

**Notre twist unique:**
On combine pattern familier (timeline) + pattern familier (surlignage) dans un usage nouveau (curation vidéo massive). L'innovation vit **à l'intérieur** de la familiarité.

## Experience Mechanics

**Flow détaillé de l'interaction centrale:**

### 1. Initiation

**Trigger:**
- Vidéo importée (drag & drop)
- Transcription terminée (1-2s)
- Interface principale s'affiche

**État initial:**
- **Transcript (gauche):** Texte complet visible, rien de surligné, scrollable
- **Timeline (bas):** Toute la vidéo en gris (= non-sélectionné par défaut)
- **Preview (droite ou centre):** Vidéo à la première frame, contrôles play/pause
- **Message d'invitation:** Tooltip subtil "Surlignez le texte pour sélectionner les passages à garder" (disparaît après première interaction)

**Affordance:**
- Curseur texte devient sélectionnable (cursor: text)
- Timeline inactive visuellement (gris neutre)

### 2. Interaction

**Action utilisateur:**
- Utilisateur clique-glisse souris sur texte (surlignage classique)
- Ou utilise raccourcis clavier pour sélectionner (shift + flèches)

**Réponse système (temps réel <16ms):**
- Texte surligné devient **vert** (ou couleur principale brand)
- Timeline montre **segment correspondant en vert** simultanément
- Animation subtile (pulse léger?) renforce synchronisation
- Compteur durée update: "0min32s sélectionnés sur 60min00s"

**Continuation:**
- Utilisateur surligne d'autres passages
- Chaque nouveau passage = nouveau segment vert sur timeline
- Passages multiples = segments multiples (discontinus OK)
- Dé-sélection: clic sur texte surligné = retire sélection, segment timeline redevient gris

**Interactions secondaires:**
- **Hover texte:** Timeline montre position correspondante (ligne verticale légère?)
- **Clic texte non-surligné:** Jump to timestamp dans preview (feedback exploration)
- **Scroll transcript:** Timeline reste synchronisée (indicateur viewport visible sur timeline?)

### 3. Feedback

**Feedback visuel primaire:**
- Texte surligné = **vert clair** (lisible, clairement distinct du non-surligné)
- Timeline segments = **vert foncé** (même palette, visuellement cohérent)
- Non-sélectionné = **gris neutre** (effacé, clairement "pas gardé")

**Feedback informationnel:**
- **Compteur durée:** "32min15s sélectionnés sur 60min00s" (visible en permanence)
- **Pourcentage optionnel:** "54% de la vidéo sélectionné"
- **Nombre de segments:** "12 segments sélectionnés" (utile pour comprendre fragmentation?)

**Feedback d'erreur:**
- Aucune sélection: Bouton "Générer les cuts" désactivé (grisé) avec tooltip "Surlignez au moins un passage"
- Sélection complète (100%): Message info "Toute la vidéo est sélectionnée" (utilisateur a peut-être inversé sa logique?)

**Feedback de contrôle:**
- Annulation: Ctrl+Z déselectionne dernier passage
- Tout sélectionner: Ctrl+A surligne tout (raccourci standard)
- Tout désélectionner: Bouton "Clear selection" visible

### 4. Completion

**Critère de complétion:**
- Utilisateur a surligné tous les passages désirés
- Compteur durée finale satisfaisante
- Bouton "Générer les cuts" activé et visible

**Action finale:**
- Utilisateur clique "Générer les cuts"
- Transition vers étape suivante (génération cuts + preview)

**État de sortie:**
- Sélections sauvegardées automatiquement (auto-save)
- Possibilité de revenir modifier sélections après preview
- Workflow continu sans blocage

**Moment de succès:**
L'utilisateur réalise: "J'ai parcouru 60 minutes de contenu et sélectionné les passages clés en 3 minutes. C'est fait." Sentiment d'accomplissement disproportionné par rapport au temps investi.
