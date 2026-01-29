# Desired Emotional Response

## Primary Emotional Goals

**Empowerment (Puissance récupérée)**
L'émotion centrale de Splice est le sentiment de **contrôle retrouvé** sur le temps et la productivité. Le monteur doit ressentir viscéralement "je viens de faire en 3 minutes ce qui me prenait 1h15". Ce n'est pas qu'un gain de temps technique - c'est une transformation de leur réalité professionnelle. Orlan qui récupère 3 jours complets en 2 semaines doit le **ressentir dans son corps**, pas juste le calculer intellectuellement.

**Surprise transformée en Confiance**
Le parcours émotionnel commence par le scepticisme ("encore un outil magique..."), passe par la surprise ("transcript en 2s, c'est réel??"), puis s'ancre dans la **confiance totale** ("je peux faire confiance à cet outil pour mon travail professionnel"). Cette transition scepticisme → surprise → confiance doit se dérouler en moins de 5 minutes lors de la première utilisation.

**Flow productif**
Pendant le workflow de surlignage, l'utilisateur doit entrer dans un état de **flow** - lecture rapide du transcript, sélection intuitive, zéro friction cognitive. Pas de pause pour réfléchir "comment je fais ça?". Tout est évident, naturel, fluide. L'utilisateur est absorbé dans la **curation du contenu**, pas dans l'apprentissage de l'interface.

**Accomplissement disproportionné**
À la fin du workflow (preview validée), l'utilisateur doit ressentir un **accomplissement disproportionné** par rapport au temps investi. "J'ai TERMINÉ en 5 minutes." Pas juste satisfaction ou soulagement - un vrai sentiment d'avoir été **extraordinairement productif**.

## Emotional Journey Mapping

**Phase 1: Découverte (avant premier lancement)**
- Scepticisme + Curiosité: "Encore un outil qui promet la lune..."
- Espoir prudent: "Si ça marche vraiment, ça change tout pour moi"
- Décision de tester: "Essai gratuit, je ne risque rien"

**Phase 2: Premier import (0-30s)**
- Anxiété légère: "Fichier 50GB, est-ce que ça va planter?"
- Réassurance progressive: Feedback clair, pourcentage précis, estimation temps
- Anticipation: "Voyons voir si c'est aussi rapide qu'annoncé"

**Phase 3: Le "wow" initial (transcript apparaît en 1-2s)**
- Surprise pure: "QUOI? 60 minutes transcrites en 2 secondes??"
- Validation immédiate: "C'est réel. Ça marche vraiment."
- Excitation croissante: "Si c'est aussi rapide pour le reste..."

**Phase 4: Workflow surlignage (2-5min)**
- Flow: Lecture rapide, surlignage intuitif, absorption dans le contenu
- Contrôle: Timeline synchronisée visuellement, lien texte-vidéo évident
- Confiance croissante: "C'est exactement ce dont j'avais besoin"

**Phase 5: Génération cuts + Preview (30s-2min)**
- Anticipation: "Est-ce que les cuts seront précis?"
- Validation qualité: "Aucune coupe mid-word, transitions naturelles"
- Accomplissement: "J'ai fini en 5 minutes ce qui prend normalement 1h15"

**Phase 6: Blocage export freemium (moment de conversion)**
- Frustration calculée: "Je veux exporter MAINTENANT"
- Réalisation valeur: "J'ai gagné 1h10. €15/mois c'est rien comparé à ça."
- Décision rationnelle: Conversion naturelle (valeur déjà prouvée)

**Phase 7: Utilisations futures (workflow établi)**
- Confiance établie: "Mon outil de dérushage quotidien"
- Routine productive: Pas de surprise, juste efficacité répétable
- Fidélité: Recommandation spontanée à d'autres monteurs

## Micro-Emotions

**Confiance vs Anxiété**
- **Objectif:** Réassurance constante, jamais d'anxiété paralysante
- **Moyens UX:** Feedback transparent (pourcentage précis, temps estimé), annulation toujours visible, retry facile en cas d'échec
- **Moments critiques:** Import gros fichiers, transcription longue, génération cuts, export final

**Contrôle vs Impuissance**
- **Objectif:** Utilisateur toujours en contrôle, jamais de "l'outil a décidé pour moi"
- **Moyens UX:** Ajustements frame par frame disponibles, marges personnalisables (post-MVP), annulation opérations, preview avant export
- **Moments critiques:** Sélection passages, validation cuts, décision export

**Delight vs Simple Satisfaction**
- **Objectif:** Surprise positive répétée (pas juste fonctionnalité attendue)
- **Moyens UX:** Vitesse viscérale (transcript 1-2s), synchronisation instantanée texte-timeline, animations subtiles
- **Moments critiques:** Première transcription, première sélection texte, preview cuts parfaits

**Accomplissement vs Soulagement**
- **Objectif:** "J'ai été extraordinairement productif" (pas juste "ouf, c'est fini")
- **Moyens UX:** Feedback temps gagné visible, workflow court (5min max), validation claire (preview parfaite)
- **Moments critiques:** Fin workflow surlignage, preview validée, export terminé

**Familiarité vs Désorientation**
- **Objectif:** Reconnaissance immédiate patterns NLE, zéro courbe d'apprentissage structure
- **Moyens UX:** Timeline en bas, contrôles lecture standards, terminologie métier, raccourcis clavier familiers
- **Moments critiques:** Premier lancement, découverte interface, premiers raccourcis

**Efficacité vs Friction**
- **Objectif:** Flow continu, zéro interruption cognitive
- **Moyens UX:** Auto-save silencieux, pas de modals intrusifs, transcription automatique au drop, génération cuts en un clic
- **Moments critiques:** Tout le workflow principal (import → export)

## Design Implications

**Pour créer l'Empowerment:**
1. Afficher feedback temps gagné visible: "Vous avez traité 60min de vidéo en 4min37s"
2. Message conversion mentionne comparaison: "Normalement 1h15, vous avez fait en 5min"
3. Contrôle total sur cuts: ajustements frame par frame toujours accessibles
4. Export qualité préservée: signal de respect pour expertise pro

**Pour créer la Confiance:**
1. Preview obligatoire avant export: utilisateur valide toujours le résultat
2. Feedback transparent: pourcentages précis, temps estimé honnête (pas optimiste)
3. Retry facile en cas d'échec: pas de blocage permanent, messages actionnables
4. Auto-save + crash recovery: pas de perte de travail jamais
5. Qualité export garantie: compatible Premiere/DaVinci sans post-traitement

**Pour créer le Flow:**
1. Zéro modal intrusif pendant workflow principal
2. Auto-save silencieux toutes les 30s (pas de "Voulez-vous sauvegarder?")
3. Raccourcis clavier standards NLE (espace, J/K/L, flèches) pour muscle memory
4. Synchronisation temps réel texte-timeline sans délai perceptible
5. Transcription automatique au drop (pas de bouton "Transcrire")

**Pour créer le Delight:**
1. Vitesse viscérale: transcript 1-2s (pas 5-10s), cuts 10-30s (pas minutes)
2. Animations subtiles synchronisation texte-timeline (feedback visuel immédiat)
3. Sound design discret pour actions réussies: transcription terminée, cuts générés (optionnel, à tester)
4. Premier wow répétable: chaque nouvelle vidéo = même surprise de vitesse

**Pour éviter l'Anxiété:**
1. Annulation toujours visible pour opérations longues (transcription, cuts, export)
2. Estimation temps restant affichée (même approximative > rien)
3. Messages d'erreur clairs et actionnables (pas de stack traces, pas de jargon)
4. Validation format/codec immédiate au drop (rejet clair si non supporté)
5. Grace period licence 7 jours (pas de blocage brutal offline)

**Pour créer l'Accomplissement:**
1. Moment validation clair: preview parfaite = "vous avez réussi"
2. Workflow court: 5min max pour 1h de vidéo (promesse tenue)
3. Export rapide: max 2x durée vidéo finale (pas d'attente frustrante)
4. Fichier prêt à l'emploi: import direct Premiere/DaVinci sans conversion

## Emotional Design Principles

**Principe 1: Réassurance Permanente**
L'utilisateur ne doit jamais se sentir abandonné ou dans le noir. Chaque opération longue affiche feedback précis (pourcentage, temps estimé). Chaque erreur propose une solution claire. Chaque action critique (export) demande confirmation. La confiance se construit par la **transparence totale**.

**Principe 2: Empowerment par le Contrôle**
L'utilisateur doit toujours sentir qu'il a le pouvoir de décision. Preview avant export (pas d'export surprise), annulation disponible (pas d'opération forcée), ajustements précis accessibles (pas de "l'outil sait mieux"). Le contrôle = respect de l'expertise professionnelle.

**Principe 3: Delight par la Vitesse Viscérale**
La rapidité n'est pas qu'une métrique - c'est une **émotion ressentie**. Transcript en 1-2s crée un choc positif répétable. Synchronisation instantanée texte-timeline crée un sentiment de magie. Chaque interaction rapide renforce "cet outil est différent".

**Principe 4: Flow par l'Automatisation Invisible**
Les actions évidentes doivent être automatiques: transcription au drop, auto-save silencieux, validation format immédiate. L'utilisateur reste concentré sur sa **tâche créative** (curation du contenu), pas sur la manipulation de l'outil.

**Principe 5: Conversion par Preuve Émotionnelle**
Le blocage freemium n'arrive qu'après que l'utilisateur ait **ressenti** la valeur: vitesse vécue, preview parfaite validée, temps gagné calculé mentalement. La conversion n'est pas une vente agressive - c'est la conclusion logique d'une démonstration émotionnelle.
