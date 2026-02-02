# Core User Experience

## Defining Experience

**L'action centrale:** Le cœur de Splice est le **surlignage intelligent de texte** dans le transcript. L'utilisateur lit le contenu parlé comme un article, surligne les passages à conserver, et le système traduit automatiquement ces sélections textuelles en cuts vidéo précis.

**Workflow en deux phases:**
1. **Phase rapide (80% du travail):** Surlignage massif en 2-3 minutes - l'utilisateur parcourt le transcript rapidement, sélectionne les blocs pertinents sans se soucier de la précision frame-par-frame
2. **Phase précision (20% optionnel):** Ajustements fins pour les passages critiques - navigation frame par frame avec flèches clavier, ajout/retrait de frames, contrôle marges avant/après

**L'interaction make-or-break:** La synchronisation temps réel entre texte surligné et timeline visuelle. Quand l'utilisateur surligne un mot, la timeline doit **immédiatement** refléter la sélection visuellement. C'est cette synchronisation instantanée qui crée le sentiment de contrôle et de magie.

## Platform Strategy

**Plateforme principale:** Application desktop native cross-platform (Tauri)
- macOS 13 Ventura+ (Intel et Apple Silicon)
- Windows 10 22H2+ / Windows 11

**Modalité d'interaction:** Clavier et souris principalement
- Raccourcis clavier pour productivité (espace pour play/pause, flèches pour navigation frame-par-frame, etc.)
- Drag & drop pour import fichiers
- Sélection texte à la souris ou trackpad

**Offline-first après installation:**
- Transcription 100% locale (Parakeet on-device)
- Fonctionnement complet sans connexion internet après téléchargement initial du modèle
- Grace period 7 jours pour vérification licence

**Considérations écran:**
- Optimisé pour écrans 15"+ (usage monteur typique)
- Support multi-écran post-MVP (détachement preview)
- Layout responsive pour s'adapter à 13" MacBook (minimum viable)

## Effortless Interactions

**Automatisations sans friction:**

1. **Transcription automatique** - Pas de bouton "Transcrire". Dès l'import validé, la transcription se lance automatiquement en arrière-plan
2. **Validation format silencieuse** - Détection codec/format au drop, rejet immédiat avec message clair si non supporté
3. **Synchronisation temps réel** - Texte surligné ↔ timeline visuellement synchronisés sans délai perceptible
4. **Auto-save transparent** - Sauvegarde automatique toutes les 30s sans interrompre le workflow
5. **Génération cuts en un clic** - Un seul bouton "Générer les cuts", pas de configuration complexe
6. **Preview intégrée** - Lecture vidéo cutée directement dans l'app, pas d'export temporaire nécessaire

**Réduction de friction:**
- Import par drag & drop (pas de file picker modal si possible)
- Raccourcis clavier standards NLE (espace = play/pause, J/K/L = scrub, etc.)
- Annulation possible pour toutes opérations longues (transcription, génération cuts, export)
- Retry automatique avec backoff pour échecs réseau (téléchargement Parakeet, vérification licence)

## Critical Success Moments

**Moment 1: Le "wow" initial (2s après import)**
L'utilisateur drop une vidéo de 60 minutes. Le transcript complet apparaît en 1-2 secondes. C'est le premier choc - "ça marche vraiment aussi vite?". Ce moment valide immédiatement la promesse de rapidité.

**Moment 2: La synchronisation magique (première sélection)**
L'utilisateur surligne son premier passage de texte. La timeline s'illumine instantanément pour montrer visuellement la sélection. Le lien texte ↔ vidéo devient évident. Pattern mental nouveau mais ancré dans familiarité timeline.

**Moment 3: La preview parfaite (validation qualité)**
Après génération des cuts, l'utilisateur appuie sur play dans la preview. Les transitions sont fluides, aucune coupe mid-word, les marges sont naturelles. Il réalise: "je n'ai pas besoin de retoucher dans Premiere". Confiance établie.

**Moment 4: Le blocage conversion (frustration → achat)**
L'utilisateur clique sur "Exporter". Écran de blocage: "Vous venez de créer en 5 minutes ce qui prend normalement 1h15. Débloquez l'export maintenant pour €X/mois." L'utilisateur a la vidéo cutée sous les yeux, a ressenti le gain de temps. Conversion naturelle.

**Moment 5: Le premier ajustement précis (crédibilité pro)**
L'utilisateur utilise les flèches pour ajuster un cut frame par frame. La réponse est instantanée, le contrôle est total. Signal de crédibilité: "ce n'est pas un jouet, c'est un outil pro qui respecte mon expertise".

## Experience Principles

**Principe 1: Familiarité Immédiate**
L'interface reprend les codes visuels des NLE professionnels (timeline en bas, contrôles lecture standard, terminologie métier). Un monteur qui ouvre Splice pour la première fois doit reconnaître instantanément les patterns qu'il utilise dans Premiere/DaVinci. Zéro courbe d'apprentissage pour la structure de base.

**Principe 2: Rapidité Viscérale**
La vitesse n'est pas qu'une métrique technique - elle doit être **ressentie**. Transcription en 1-2s (pas 5-10s), synchronisation temps réel (pas de délai perceptible), génération cuts en 10-30s. Chaque interaction doit renforcer le sentiment de "cet outil est magiquement rapide".

**Principe 3: Précision Professionnelle**
Interface "rapide par défaut, précise quand nécessaire". Le workflow principal favorise la vitesse (surlignage massif en 3min) MAIS le contrôle frame-par-frame est toujours accessible. Deux modes cohabitent: Quick Mode (80% des cas) et Precision Mode (20% des retouches). Respect de l'expertise des monteurs professionnels.

**Principe 4: Confiance par la Transparence**
Jamais de "boîte noire". Feedback clair à chaque étape: pourcentage précis, temps estimé affiché, possibilité d'annuler visible, retry facile en cas d'échec. L'utilisateur doit toujours savoir exactement ce qui se passe et avoir le contrôle.

**Principe 5: Conversion par la Preuve**
Le modèle freemium n'est pas une limitation frustrante - c'est un **démonstrateur de valeur**. L'utilisateur doit voir, toucher, valider la vidéo cutée parfaite AVANT de payer. Le blocage export arrive après que la valeur soit irréfutable. La conversion n'est pas une vente - c'est une conclusion logique.
