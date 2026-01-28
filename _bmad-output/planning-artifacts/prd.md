---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments: []
workflowType: 'prd'
briefCount: 0
researchCount: 0
brainstormingCount: 0
projectDocsCount: 0
classification:
  projectType: 'desktop_app'
  domain: 'general'
  complexity: 'medium-high'
  projectContext: 'greenfield'
  keyDetails:
    - 'Application native cross-platform (Windows + Mac)'
    - 'Transcription locale avec Parakeet TDT 0.6B v3'
    - 'Traitement vidéo performant (découpage automatique)'
    - 'Outil personnel pour monteurs professionnels'
    - 'Workflow: Upload → Transcript → Surlignage → Cuts → Export MP4'
---

# Product Requirements Document - Splice

**Author:** Nicolas
**Date:** 2026-01-28

## Executive Summary

**Vision produit:**
Splice transforme le dérushage vidéo en remplaçant le scrubbing manuel chronophage (1h15 pour 1h de rushes) par un workflow textuel ultra-rapide (3-5 minutes): transcription locale instantanée, surlignage des passages à garder, et génération automatique de cuts précis.

**Innovation clé:**
Contrairement aux outils existants qui coupent les silences, Splice permet de **curer le contenu parlé lui-même** via une interface textuelle. La transcription locale (Parakeet) garantit confidentialité et performance sans dépendance cloud.

**Utilisateurs cibles:**
Monteurs vidéo professionnels (15+ vidéos/semaine) et créateurs de contenu solo qui veulent récupérer des heures de travail sans quitter leurs outils pro (Premiere, DaVinci).

**Objectif business:**
- Phase 1 (0-3 mois): 10 utilisateurs actifs via réseau d'Orlan (monteur pilote)
- Phase 2 (3-6 mois): 100 utilisateurs payants = Product-Market Fit validé
- Modèle freemium avec blocage stratégique à l'export après preview

**Stack technique:**
Application desktop native (Tauri + Rust backend + Web frontend) pour macOS 13+ et Windows 10+, avec transcription ML locale CPU-only pour simplicité MVP.

---

## Success Criteria

### User Success

**Le moment "aha!" - Validation immédiate de la valeur:**
Le monteur voit le transcript d'une vidéo de 60 minutes généré en 1-2 secondes, puis sa vidéo parfaitement cutée en quelques secondes supplémentaires. La magie opère quand il réalise qu'un travail de 1h15 se fait en 3-5 minutes.

**Gain de temps massif:**
- **Aujourd'hui:** 1h de rushes = 1h15 de travail manuel
- **Avec Splice:** 1h de rushes = 3-5 minutes
- **Réduction: ~95%**

**Qualité et précision:**
- Transcription ≥95% de précision
- Cuts parfaits via word-level timestamps (jamais de coupe au milieu d'un mot)
- Marges automatiques 0.1s pour transitions naturelles
- Preview intégrée pour validation
- <5% de retouches nécessaires

**Workflow fluide:**
1. Import vidéo (fichiers 15-50GB, 4K)
2. Transcript généré automatiquement
3. Surlignage intuitif des passages à garder
4. Cuts automatiques (10-30s pour 1h de vidéo)
5. Preview de la vidéo cutée
6. Export MP4 prêt pour Premiere/DaVinci

### Business Success

**Phase 1 - Validation (0-3 mois):**
- 1 pilote (Orlan) ultra satisfait et évangéliste
- 10 utilisateurs actifs via son réseau
- 2-5 vidéos/semaine par utilisateur
- 100% acquisition bouche-à-oreille

**Phase 2 - Product-Market Fit (3-6 mois):**
- **100 utilisateurs payants = PMF validé**
- Mesure taux conversion freemium → payant
- Lancement marketing après validation

**Modèle freemium:**
- Gratuit: vidéos ≤30min, blocage à l'export (conversion maximale)
- Payant: export illimité, sans limite durée
- Early adopters: 10 codes lifetime gratuits

**Indicateurs intermédiaires:**
- Réutilisation hebdomadaire >80%
- Net Promoter Score >50
- Satisfaction précision cuts >90%

### Technical Success

**Performance:**
- Transcription: 60min audio → <5s (Parakeet local CPU)
- Workflow complet: 10-30s pour 1h de vidéo
- Import fichiers 15-50GB sans timeout

**Qualité:**
- Précision transcription ≥95%
- Word-level timestamps pour cuts précis
- Support MP4, MOV, AVI jusqu'à 4K

**Stabilité:**
- Gestion mémoire optimisée (streaming)
- Crash recovery automatique
- Taux de crash <1%

**Plateformes:**
- macOS 13+ (Intel + Apple Silicon)
- Windows 10 22H2+ / 11
- Auto-update silencieux

**Architecture:**
- Tauri (Rust + Web frontend)
- Parakeet TDT 0.6B v3 (transcription locale)
- FFmpeg (manipulation vidéo)

### Measurable Outcomes

**Métriques utilisateur:**
- Temps traitement: <30s pour 1h de vidéo
- Précision cuts: ≥95% sans retouche
- Complétion workflow: >90%
- Réutilisation: >80% reviennent chaque semaine

**Métriques business:**
- Phase 1: 10 actifs en 3 mois
- Phase 2: 100 payants en 6 mois
- Engagement: 2-5 vidéos/semaine/utilisateur
- Conversion freemium→payant: >10%

**Métriques techniques:**
- Uptime licence: >99%
- Taux de crash: <1%
- Temps transcription: <2s pour 60min audio
- Support fichiers: jusqu'à 50GB sans échec

**Métriques qualitatives:**
- NPS: >50
- Satisfaction rapidité: >95%
- Satisfaction précision: >90%
- Volonté de payer après essai: >15%

---

## User Journeys

### Journey 1: Orlan - Le Monteur Professionnel Submergé

**Personnage:**
Orlan, 32 ans, monteur vidéo freelance depuis 5 ans. Il travaille avec des créateurs de contenu et entreprises sur des interviews longues. Son studio: MacBook Pro, Premiere Pro, et beaucoup de café.

**Situation:**
Lundi matin, 9h. Planning de la semaine: **15 vidéos à monter** (interviews 1h-2h chacune). Calcul rapide: 1h15 de dérushage × 15 = **~19 heures de dérushage pur**. Presque 3 jours complets à scrubber dans la timeline.

**Le problème:**
Pour chaque interview:
1. Regarder l'intégralité des rushes
2. Scrubber section par section pour identifier les passages intéressants
3. Placer marqueurs ou couper manuellement
4. Revoir certaines sections 2-3 fois pour couper au bon endroit

Les outils de "coupe automatique des blancs" existent, mais ne règlent pas son vrai problème: **identifier intelligemment QUOI garder dans le contenu parlé**. Couper les hésitations, répétitions, digressions tout en gardant le fil narratif reste du travail manuel intensif.

**Découverte de Splice:**
Un collègue monteur: "Tu upload ta vidéo, ça génère le transcript en quelques secondes, tu surligne ce que tu veux garder, et ça crée les cuts automatiquement. J'ai traité 1h de rushes en 5 minutes."

Orlan est sceptique mais teste (code early adopter gratuit).

**Première utilisation - Le moment "aha!" :**

*Lundi 14h - Première vidéo*

1. **Upload (30s):** Interview 1h30, 22GB
2. **Transcription (2s):** Transcript apparaît instantanément. "C'est local?"
3. **Lecture + Surlignage (3min):** Orlan **lit le transcript comme un article** - 10x plus rapide que regarder la vidéo. Il identifie passages clés, punchlines, moments forts. Surlignage fluide.
4. **Traitement cuts (15s):** Barre de progression, terminé.
5. **Preview (30s):** Les cuts sont **parfaits**. Pas de coupe au milieu d'un mot. Transitions naturelles.
6. **Export (20s):** MP4 prêt pour Premiere.

**Total: 4min45s au lieu de 1h15.**

Orlan reste figé. "J'ai gagné 1h10 sur UNE vidéo. Sur 15 vidéos = 17 heures."

**Résolution:**
Deux semaines plus tard: 30 vidéos traitées, **3 jours complets récupérés**. Avec ce temps:
- Accepté 3 nouveaux clients
- Augmenté ses tarifs
- Recommandé Splice à tout son réseau

Message à Nicolas: "Ne change rien. C'est exactement ce dont on avait besoin."

---

### Journey 2: Nicolas - Le Créateur Tech Limité par le Temps

**Personnage:**
Nicolas, créateur Tech avec 20 abonnés YouTube. Passionné de dev et outils. Entre travail temps plein et création, les heures sont comptées.

**Situation:**
Contrainte: **1 vidéo/semaine** (pas un choix créatif, une contrainte de temps). Il voudrait 2-3/semaine pour grandir la chaîne. Le montage le tue.

**Le problème:**

*Dimanche 21h - Veille de publication*

Vidéo filmée mercredi: 45min de rushes → 12-15min finale. Timeline Premiere ouverte.

Workflow actuel:
1. Premier visionnage (45min)
2. Marquage passages (1h30)
3. **Pire moment:** Revenir 2-3 fois sur 30s pour trouver où couper **à la seconde près**
4. Découpage manuel (45min)
5. Finition (1h)

**Total: ~4h dont 2h30 de dérushage.**

"Si seulement je pouvais lire le texte et dire 'garde ça, coupe ça' au lieu de scrubber..."

**Le déclic:**
Conversation avec Orlan: "Les outils de coupe des blancs existent. Mais personne n'a fait un outil où tu surligne le texte et ça coupe la vidéo automatiquement."

**Nicolas se dit: "Et si je construisais ça... pour moi ET pour Orlan?"**

**Construction & test:**
Nicolas construit Splice. Objectif: réduire dérushage de 2h30 à 5min.

*Dimanche suivant, 19h - Test sur sa propre vidéo*

1. Upload (20s): 45min rushes, 14GB
2. Transcription (1s): Instantané. Parakeet est rapide.
3. Lecture + Surlignage (4min): Nicolas **lit son propre contenu comme un script**. Révélation. Il voit immédiatement passages bien expliqués, hésitations, répétitions, digressions. Surlignage rapide.
4. Génération cuts (12s)
5. Preview (1min): **Exactement** ce qu'il voulait.
6. Export (15s)

**Total: 5min48s au lieu de 2h30.**

Nicolas sous le choc. **2h24 gagnées sur une vidéo.** Il est 19h06, il a tout son dimanche soir.

**Résolution:**
Trois semaines plus tard: **3 vidéos publiées** au lieu d'une. Rythme triplé. Soirées récupérées. Plus de créativité.

Il a construit un outil qui résout son problème ET celui d'Orlan. **Un outil qui existe maintenant dans le monde et qui n'existait pas avant.**

Prochain objectif: 100 utilisateurs payants.

---

### Journey 3: Sophie - L'Utilisateur Freemium et la Conversion par la Preuve

**Personnage:**
Sophie, 28 ans, podcasteuse gaming avec 2000 abonnés. Elle monte ses podcasts vidéo (1h-1h30), 1/semaine. Elle a entendu parler de Splice via Twitter.

**Situation:**
Sophie est sceptique sur les outils "magiques". Mais Splice est gratuit à tester.

**Le piège de conversion:**

1. Téléchargement & Installation (2min)
2. Upload (40s): Podcast 1h15, 18GB
3. Transcription (1s)
4. Lecture & Surlignage (5min): Format adoré - tellement plus rapide que réécouter
5. Génération cuts (18s)
6. Preview (2min): Cuts **parfaits**. "Ça marche vraiment..."
7. **Moment de vérité - Export bloqué:**

> **Débloquez l'export avec Splice Pro**
>
> Vous avez créé votre vidéo parfaitement cutée en 6 minutes.
> Abonnez-vous pour exporter et gagner des heures chaque semaine.

Sophie vient de passer 6 minutes à créer quelque chose qui prend d'habitude 1h30. La vidéo est là, parfaite, dans la preview. Elle voit la valeur.

**Calcul mental:**
"15€/mois. Je gagne 1h20/vidéo. 4 vidéos/mois = 5h20 gagnées. Mon taux horaire freelance: 40€/h. Je récupère 213€ de valeur/mois pour 15€. No-brainer."

**Résolution:**
Sophie souscrit à Splice Pro. Elle exporte. Publie son podcast 2 jours en avance pour la première fois en 6 mois.

Tweet: "Si vous montez des vidéos, testez @SpliceApp. J'ai gagné 1h20 sur mon dernier montage. Pour de vrai."

---

### Journey Requirements Summary

**Capacités révélées:**

**Core Engine:** Import gros fichiers, transcription locale ultra-rapide, interface surlignage intuitive, cuts automatiques word-level timestamps, preview intégrée, export MP4

**Licence & monétisation:** Freemium limite 30min, blocage export après preview, abonnement en ligne, vérification licence au démarrage, codes early adopters lifetime

**Performance critique:** Transcription 60min→1-2s, workflow 10-30s pour 1h vidéo, stabilité sessions multiples, gestion mémoire optimisée

**UX:** Installation simple, interface intuitive sans formation, feedback visuel clair, gestion d'erreurs compréhensible

**Plateformes:** Desktop natif macOS 13+/Windows 10+, formats MP4/MOV/AVI, support 4K, auto-update

---

## Innovation & Novel Patterns

### Detected Innovation Areas

**Paradigme inversé du découpage vidéo:**
Splice inverse le paradigme des outils existants (Descript, Autopod) qui coupent les **silences**. Splice permet de **couper le contenu parlé lui-même** - sélectionner intelligemment quels passages de dialogue garder ou supprimer. Passage d'une logique de "suppression des blancs" à "curation du contenu".

**Desktop AI locale pour confidentialité et performance:**
Contrairement aux solutions cloud (Whisper API, AssemblyAI), Splice utilise Parakeet TDT 0.6B v3 en **transcription locale on-device**:
- **Performance:** 60min → 1-2s sans latence réseau
- **Confidentialité:** Monteurs pros travaillent sur projets sensibles (interviews non publiques, contenu entreprise) qui ne peuvent être envoyés à OpenAI. Argument de vente critique.

**Interface textuelle pour workflow vidéo:**
Transformer le dérushage - tâche visuelle/temporelle (scrubber timeline) - en **lecture et annotation de texte**. Le monteur lit le transcript comme un article, surligne les passages pertinents, système génère cuts automatiquement avec précision au mot près.

### Market Context & Competitive Landscape

**Outils existants - Focus silences:**
- **Descript:** Édition vidéo via texte, mais surtout sous-titres et retrait silences
- **Autopod:** Coupe automatique silences podcasts
- **Premiere Auto-Reframe:** Recadrage auto, pas découpage contenu

**Gap de marché:**
Aucun outil ne permet de **sélectionner textuellement les passages parlés à conserver** et générer cuts automatiques. Les monteurs doivent toujours: écouter/regarder rushes, scrubber manuellement, couper manuellement.

Validation Orlan (5 ans d'expérience): *"Les outils de coupe des blancs existent. Mais personne n'a fait un outil où tu surligne le texte et ça coupe la vidéo automatiquement."*

**Positionnement unique:**
Splice se positionne entre sous-titrage automatique (pas de découpage) et coupe de silences (pas de contenu parlé). Nouvel espace dans le workflow de montage.

### Validation Approach

**Phase 1 - Pilotes:**
- Orlan: monteur pro, 15 vidéos/semaine, besoin validé 1h15→3-5min
- Ayub: monteur chaîne YouTube Nicolas, feedback terrain workflow pro

**Métrique validation:**
Réduction dérushage 1h15→3-5min (95%) avec cuts qualité pro (<5% retouches) = innovation validée.

**Phase 2 - Réseau (0-3 mois):**
10 premiers utilisateurs réseau Orlan, monteurs pros volume important, validation besoin au-delà des 2 pilotes.

**Critères réussite innovation:**
- Adoption monteurs pro
- Usage régulier 2-5 vidéos/semaine
- Conversion freemium >10%
- NPS >50

### Risk Mitigation

**Risque 1 - Précision transcription:**
- Impact: Transcript inutilisable
- Probabilité: Faible (benchmarks Parakeet 95-98%)
- Mitigation: Tests réels Orlan/Ayub, correction manuelle V2, fallback Whisper API

**Risque 2 - Cuts imprécis:**
- Impact: Retouches manuelles, valeur réduite
- Probabilité: Faible (word-level timestamps)
- Mitigation: Marges 0.1s auto, tests intensifs, ajustement marges si nécessaire

**Risque 3 - Performance gros fichiers:**
- Impact: Crashes, lenteur
- Probabilité: Moyenne (15-50GB challengeant)
- Mitigation: Architecture streaming, tests charge 4K 50GB, Rust optimisé, support prioritaire early adopters

**Risque 4 - Adoption limitée:**
- Impact: Pas assez d'utilisateurs PMF
- Probabilité: Faible (validation terrain)
- Mitigation: Validation 2 monteurs, extension bouche-à-oreille, pivot créateurs solo si nécessaire

**Risque 5 - Confidentialité pas valorisée:**
- Impact: Différenciateur local vs cloud pas perçu
- Probabilité: Moyenne
- Mitigation: Marketing explicite confidentialité, testimonials projets sensibles, certifications V2

**Fallback général:**
Si approche innovante échoue, Splice reste outil de transcription locale ultra-rapide avec édition textuelle - déjà valeur significative.

---

## Desktop App Specific Requirements

### Project-Type Overview

Splice est une application desktop native cross-platform construite avec **Tauri** (Rust + Web frontend). Architecture hybride:
- **Backend Rust:** traitement vidéo intensif, inférence ML locale (Parakeet), découpage, gestion fichiers volumineux
- **Frontend web:** HTML/CSS/TypeScript, exploitant compétences existantes
- **Bridge Tauri:** communication optimisée frontend/backend

Avantages: développement web (rapidité, flexibilité UI) + performance native Rust pour opérations critiques.

### Technical Architecture Considerations

**Stack:**
- **Framework:** Tauri 2.x
- **Backend:** Rust (FFmpeg, Parakeet TDT 0.6B v3, découpage vidéo, gestion fichiers)
- **Frontend:** TypeScript + framework (React/Vue/Svelte)
- **Communication:** Commandes Tauri (IPC optimisé)

**Avantages:**
- Légèreté: ~10-15MB vs ~150MB Electron (WebView natif OS)
- Performance: traitement vidéo Rust natif sans overhead JS
- Mémoire: footprint réduit critique pour vidéos 15-50GB
- Cohérence: backend et traitement même langage

### Platform Support

**macOS:**
- Versions: 13 Ventura+
- Architectures: Apple Silicon (M1/M2/M3+) + Intel x86_64
- Distribution: Universal Binary (.dmg)
- Signature: App signée et notarisée Apple

**Windows:**
- Versions: 10 22H2+ / 11
- Architectures: x86_64 (64-bit uniquement)
- Distribution: Installeur .msi ou .exe
- Signature: Code signing (éviter warnings SmartScreen)

**Contraintes:**
- Pas de 32-bit
- Pas de Linux pour MVP
- Pas de support anciennes versions (<macOS 13, <Windows 10)

### System Integration

**Import fichiers:**
- Drag & drop natif Finder/Explorer
- Formats: MP4, MOV, AVI
- Validation format/codec au drop
- Mono-projet MVP

**Hors MVP:**
- Association fichiers: NON
- Icône barre menu/tray: NON
- Notifications système: NON
- Menu contextuel: NON

**Permissions:**
- Accès disque (lecture vidéos, écriture exports)
- Accès réseau (licence, Parakeet, updates)
- Pas de caméra/micro/écran

### Update Strategy

**Auto-update silencieux:**
- Vérification: chaque démarrage
- Téléchargement: arrière-plan si nouvelle version
- Installation: silencieuse au redémarrage
- Notification: indicateur discret sans bloquer workflow
- Rollback: retour version précédente si échec

**Distribution:**
- Stable uniquement MVP
- Pas de beta/dev (early adopters sur stable)
- Post-MVP: canal beta power users

**Infrastructure:**
- Serveur distribution (Tauri Update Server ou custom)
- Signature updates (sécurité)
- Changelog visible après update

**Versioning:**
- Semantic: MAJOR.MINOR.PATCH
- Updates auto MINOR/PATCH
- MAJOR nécessite validation user (breaking changes)

### Offline Capabilities

**Fonctionnement 100% offline:**
Splice fonctionne entièrement offline une fois installé/activé (monteurs en avion, lieux sans connexion).

**Offline:**
- Transcription locale (Parakeet)
- Interface surlignage et édition
- Découpage vidéo
- Preview
- Export MP4

**Nécessite connexion:**
- Vérification licence (démarrage)
- Téléchargement initial Parakeet (~500MB premier lancement)
- Auto-update

**Grace period licence:**
- Durée: 7 jours offline max
- Si pas de connexion au démarrage: app continue normalement
- Tracking: timestamp dernière vérification
- Expiration: après 7 jours, message demandant connexion
- Reset: dès connexion rétablie

**Premier lancement (connexion requise):**
1. Vérification licence
2. Téléchargement Parakeet (~500MB)
3. Validation modèle
4. App prête offline

**Stockage local:**
- Modèle Parakeet: app data (~500-700MB)
- Licence token: keychain macOS / credential manager Windows
- Projets: stockés localement (pas de sync cloud MVP)

### Implementation Considerations

**Gros fichiers 15-50GB:**
- Architecture streaming (pas tout en RAM)
- Traitement par chunks
- Preview optimisée proxy léger si besoin
- Gestion d'erreurs robuste (espace disque, fichiers corrompus)

**Performance:**
- Rust compilé mode release optimisations max
- Profiling machines représentatives
- Tests charge fichiers 50GB 4K
- Monitoring mémoire/CPU

**Sécurité:**
- Code signing obligatoire (macOS + Windows)
- Tokens stockés sécurisé
- Communications HTTPS (API licence)
- Pas de données sensibles en clair

**Distribution:**
- Installeur simple rapide (<2min)
- Pas de dépendances externes manuelles
- Désinstallation propre (suppression Parakeet + données)

---

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**Approche: Experience-Driven Problem Solver**

Splice adopte une approche **Experience MVP** - résoudre le problème du dérushage avec UX qui impressionne dès la première utilisation. Pour monteurs pros habitués à outils haut de gamme (Premiere, DaVinci), interface médiocre ou bugs tueraient l'adoption.

**Pourquoi Experience MVP:**
- Utilisateurs = monteurs pros exigeants, pas early adopters tech tolérants
- "Wow moment" (transcript 1s, cuts 10s) doit être accompagné d'UX fluide
- Première impression critique pour bouche-à-oreille
- Différenciation passe aussi par l'expérience

**Contraintes MVP:**
- Interface polie ≠ complexe → simplicité + polish
- Fonctionnalités limitées mais **parfaites**
- Gestion d'erreurs basique acceptable (messages clairs)

**Ressources:**
- Dev: 1 full-stack (Nicolas) Rust + Frontend web
- Validation: 2 monteurs pilotes (Orlan + Ayub) feedback continu
- Durée MVP: 2-4 mois
- Infrastructure: Backend minimal (API licence + updates)

### MVP Feature Set (Phase 1)

**Journeys supportés:**
- Orlan: Import 15-50GB drag & drop, transcription ultra-rapide, surlignage, cuts auto, preview, export Premiere/DaVinci
- Nicolas: Workflow identique vidéos courtes, gain 2h30→5min
- Sophie: Découverte gratuite 30min, preview avant blocage export, conversion abonnement

**Must-Have Core:**
- Import multi-format (MP4, MOV, AVI) jusqu'à 50GB
- Transcription locale Parakeet CPU-only (~500MB téléchargement auto premier lancement)
- Interface surlignage éditeur texte fluide avec word-level timestamps
- Découpage auto Rust+FFmpeg streaming (marges 0.1s auto)
- Preview intégrée (play/pause, scrubbing basique)
- Export MP4 H.264 qualité originale

**Licence & monétisation:**
- Freemium: limite 30min source, blocage export après preview
- Codes early adopters: 10 lifetime gratuits (gestion manuelle OK)
- Vérification licence: démarrage + grace period 7 jours offline
- Backend minimal: API licence + Stripe

**Plateforme:**
- Tauri + Rust backend + Web frontend
- macOS 13+ (Universal Binary Intel+Silicon)
- Windows 10 22H2+/11
- Auto-update silencieux stable

**Gestion d'erreurs MVP (basique):**
- Messages clairs actionnables
- Validation format/codec au drop
- Gestion échecs réseau
- Pas de crash reports auto (post-MVP)
- Pas de recovery auto projets corrompus (post-MVP)

**Limitations acceptables:**
- Pas d'IA détection auto passages
- Pas de multi-projets
- Pas d'historique avancé
- Pas d'export formats multiples (MP4 uniquement)
- Pas de customisation marges
- Pas de raccourcis avancés
- Pas de dark mode
- Pas de collaboration
- Pas d'analytics

**Critère succès MVP:**
Si Orlan/Ayub réduisent dérushage 1h15→3-5min avec cuts précis et recommandent l'outil, MVP réussi.

### Post-MVP Features

**Phase 2 - Growth (3-6 mois post-launch):**

**IA:** Pré-sélection auto passages, détection silences/hésitations, analyse tonalité

**Productivité:** Multi-projets, historique cuts, batch processing, raccourcis clavier

**Export:** Formats multiples (MOV, ProRes), résolutions multiples, XML/EDL Premiere/DaVinci

**UX:** Dark mode, préférences avancées, analytics temps gagné, onboarding guidé

**Infrastructure:** Crash reporting, logging avancé, canal beta

**Phase 3 - Expansion (9-18 mois):**

**Intégration native:** Plugins Premiere/DaVinci/Final Cut

**IA avancée:** Détection scènes, multi-speakers, séparation musique/voix, multi-langues

**Collaboration:** Workflow client↔monteur, partage projets, sync cloud

**Expansion marché:** Version entreprise, app mobile review, version web

### Risk Mitigation Strategy

**Risque Technique #1 - Intégration Parakeet (CRITIQUE):**

Impact: Installation échoue = produit inutilisable
Probabilité: Moyenne-Haute

Mitigation MVP:
- CPU-only (60min→2-5s acceptable, zéro galère GPU/drivers)
- Bundling: dépendances Rust ML dans app
- Téléchargement géré: UI claire, retry auto, validation checksum
- Tests variés: MacBook M1/M2/M3+Intel, PC Windows AMD/Intel/NVIDIA

Fallback: Whisper API cloud temporaire, limite <30min si CPU trop lent

Post-MVP: Support GPU optionnel (détection auto + fallback CPU)

**Risque Technique #2 - Performance gros fichiers:**

Impact: Crashes, lenteur
Probabilité: Moyenne

Mitigation:
- Streaming (pas tout en RAM)
- Tests charge TÔT fichiers réels 4K 50GB
- Rust optimisé release, profile hot paths

Fallback: Limite MVP 10GB (80-90% cas d'usage)

**Risque Technique #3 - Précision cuts:**

Impact: Retouches manuelles
Probabilité: Faible-Moyenne

Mitigation:
- Tests réels intensifs Orlan/Ayub
- Marges ajustables si besoin
- Preview obligatoire catch problèmes

Fallback: Ajustement manuel cuts V1.1

**Risque Marché #1 - Adoption limitée:**

Impact: Pas assez users PMF
Probabilité: Faible

Mitigation:
- Validation 2 monteurs avant wider release
- Extension bouche-à-oreille
- Pivot créateurs solo si nécessaire

**Risque Marché #2 - Confidentialité pas valorisée:**

Mitigation: Marketing explicite, testimonials projets sensibles

**Risque Ressource #1 - Développement plus long:**

Probabilité: Haute

Mitigation:
- Scoping agressif
- De-scoping continu features non-critiques
- Feedback early prototype fonctionnel

Contingency: MVP super minimal (MP4 uniquement, 10GB max), private beta 10 users avant polish

---

## Functional Requirements

### Video Import & Management

**FR1:** Les utilisateurs peuvent importer des fichiers vidéo par glisser-déposer depuis leur système de fichiers

**FR2:** Le système peut accepter les formats vidéo MP4, MOV, et AVI

**FR3:** Le système peut valider le format et le codec du fichier vidéo importé

**FR4:** Le système peut afficher un message d'erreur clair si le fichier importé n'est pas supporté

**FR5:** Le système peut gérer des fichiers vidéo jusqu'à 50GB sans échec

**FR6:** Les utilisateurs peuvent importer un seul projet vidéo à la fois (mono-projet MVP)

### Transcription

**FR7:** Le système peut télécharger automatiquement le modèle de transcription Parakeet lors du premier lancement

**FR8:** Le système peut afficher une barre de progression pendant le téléchargement du modèle

**FR9:** Le système peut générer automatiquement un transcript textuel à partir de l'audio de la vidéo importée

**FR10:** Le système peut effectuer la transcription localement sur la machine de l'utilisateur (on-device)

**FR11:** Le système peut générer des word-level timestamps (timestamp par mot) pour le transcript

**FR12:** Le système peut afficher le transcript généré dans une interface textuelle lisible

**FR13:** Le système peut gérer la transcription de vidéos jusqu'à 2 heures de durée

### Content Editing

**FR14:** Les utilisateurs peuvent lire le transcript comme du texte dans l'interface

**FR15:** Les utilisateurs peuvent surligner des passages de texte dans le transcript

**FR16:** Le système peut identifier les passages surlignés comme "passages à garder"

**FR17:** Les utilisateurs peuvent dé-surligner des passages précédemment surlignés

**FR18:** Le système peut synchroniser visuellement le texte surligné avec les segments vidéo correspondants

### Video Processing

**FR19:** Le système peut générer automatiquement des cuts vidéo basés sur les passages surlignés

**FR20:** Le système peut appliquer des marges temporelles automatiques (0.1s) avant et après chaque cut pour des transitions naturelles

**FR21:** Le système peut traiter le découpage vidéo en streaming pour éviter de charger la vidéo entière en mémoire

**FR22:** Le système peut afficher une barre de progression pendant le traitement des cuts

**FR23:** Le système peut garantir que les cuts ne coupent jamais au milieu d'un mot (utilisation word-level timestamps)

**FR24:** Le système peut assembler automatiquement les segments surlignés dans l'ordre chronologique

### Preview & Validation

**FR25:** Les utilisateurs peuvent prévisualiser la vidéo cutée avant l'export

**FR26:** Le système peut fournir des contrôles de lecture basiques (play, pause) dans le lecteur de preview

**FR27:** Le système peut fournir un scrubbing basique dans le lecteur de preview

**FR28:** Les utilisateurs peuvent valider que les cuts correspondent à leurs attentes avant d'exporter

### Export

**FR29:** Les utilisateurs peuvent exporter la vidéo cutée en format MP4

**FR30:** Le système peut encoder l'export en codec H.264 pour compatibilité universelle

**FR31:** Le système peut préserver la qualité originale de la vidéo lors de l'export

**FR32:** Le système peut afficher une barre de progression pendant l'export

**FR33:** Les utilisateurs peuvent télécharger le fichier MP4 exporté sur leur système de fichiers

**FR34:** Le système peut générer un fichier export prêt à être importé dans Premiere Pro ou DaVinci Resolve

### Licensing & Monetization

**FR35:** Le système peut vérifier la licence de l'utilisateur au démarrage de l'application

**FR36:** Le système peut limiter les vidéos sources à 30 minutes maximum pour les utilisateurs gratuits (freemium)

**FR37:** Le système peut bloquer l'export pour les utilisateurs freemium après la preview

**FR38:** Le système peut afficher un message de conversion vers abonnement payant au moment du blocage export

**FR39:** Le système peut accepter des codes early adopters pour débloquer l'accès lifetime gratuit

**FR40:** Le système peut fonctionner offline pendant une période de grace de 7 jours sans vérification licence

**FR41:** Le système peut afficher un message informatif après 7 jours offline demandant une connexion pour vérifier la licence

**FR42:** Le système peut réinitialiser le compteur de grace period après une vérification licence réussie

### Platform & Distribution

**FR43:** Le système peut s'installer sur macOS 13 Ventura et supérieur (Intel et Apple Silicon)

**FR44:** Le système peut s'installer sur Windows 10 22H2 et supérieur, et Windows 11

**FR45:** Le système peut vérifier automatiquement la disponibilité de mises à jour au démarrage

**FR46:** Le système peut télécharger et installer les mises à jour de manière silencieuse en arrière-plan

**FR47:** Le système peut afficher un indicateur discret de mise à jour disponible sans bloquer le workflow

**FR48:** Le système peut appliquer les mises à jour au prochain redémarrage de l'application

**FR49:** Les administrateurs système peuvent signer et notariser l'application pour macOS

**FR50:** Les administrateurs système peuvent signer l'application pour Windows (code signing)

### Error Handling & User Feedback

**FR51:** Le système peut afficher des messages d'erreur clairs et actionnables en cas de problème

**FR52:** Le système peut gérer gracieusement les échecs de connexion réseau (téléchargement Parakeet, vérification licence)

**FR53:** Le système peut fournir un retry automatique en cas d'échec de téléchargement du modèle Parakeet

**FR54:** Le système peut afficher des messages d'état pour informer l'utilisateur des opérations en cours

---

## Non-Functional Requirements

### Performance

**Transcription:**
- **NFR1:** La transcription d'une vidéo de 60 minutes doit se compléter en moins de 5 secondes sur un CPU moderne (Intel i7/Ryzen 7 ou équivalent, Apple Silicon M1+)
- **NFR2:** Le système doit afficher un indicateur de progression pendant la transcription pour vidéos >10 minutes
- **NFR3:** La transcription doit fonctionner en arrière-plan sans bloquer l'interface utilisateur

**Découpage vidéo:**
- **NFR4:** Le traitement des cuts pour 1 heure de vidéo source doit se compléter en moins de 30 secondes
- **NFR5:** Le découpage vidéo doit utiliser un traitement streaming pour éviter de saturer la mémoire (RAM usage <4GB pour vidéos 50GB)
- **NFR6:** Le système doit afficher une barre de progression en temps réel pendant le traitement des cuts

**Interface utilisateur:**
- **NFR7:** Les interactions UI principales (surlignage texte, navigation) doivent répondre en moins de 100ms
- **NFR8:** La preview vidéo doit démarrer en moins de 2 secondes après génération des cuts
- **NFR9:** L'application doit démarrer en moins de 3 secondes sur des machines avec SSD

**Export:**
- **NFR10:** L'export MP4 ne doit pas prendre plus de 2x la durée de la vidéo finale (ex: vidéo finale 20min = export max 40min)
- **NFR11:** Le système doit préserver la qualité vidéo originale sans ré-encodage inutile

### Security

**Données utilisateur:**
- **NFR12:** Les vidéos importées ne doivent jamais être envoyées vers des serveurs externes (traitement 100% local)
- **NFR13:** Les tokens de licence doivent être stockés de manière sécurisée (Keychain macOS, Credential Manager Windows)
- **NFR14:** Toutes les communications avec le backend de licence doivent utiliser HTTPS avec validation certificat

**Paiements:**
- **NFR15:** Les informations de paiement ne doivent jamais transiter par ou être stockées par Splice (délégation complète à Stripe)
- **NFR16:** Les tokens d'authentification doivent expirer et nécessiter re-validation après 30 jours de grace period

**Code & distribution:**
- **NFR17:** L'application macOS doit être signée et notarisée par Apple pour éviter les avertissements Gatekeeper
- **NFR18:** L'application Windows doit être signée avec code signing pour éviter les warnings SmartScreen
- **NFR19:** Les mises à jour téléchargées doivent être signées et validées avant installation

**Confidentialité:**
- **NFR20:** Aucune donnée analytique ou télémétrie ne doit être collectée en MVP (pas de tracking utilisateur)
- **NFR21:** Les logs locaux ne doivent pas contenir de données sensibles (pas de contenu transcript, pas de chemins fichiers complets)

### Reliability

**Stabilité:**
- **NFR22:** Le taux de crash doit être inférieur à 1% des sessions utilisateur
- **NFR23:** Le système doit gérer gracieusement les fichiers vidéo corrompus ou mal formés sans crasher
- **NFR24:** Le système doit gérer les situations de manque d'espace disque avec des messages d'erreur clairs

**Sauvegarde & récupération:**
- **NFR25:** Le système doit sauvegarder automatiquement le transcript et les passages surlignés toutes les 30 secondes
- **NFR26:** En cas de crash, le système doit offrir de récupérer le dernier projet en cours au redémarrage
- **NFR27:** Les projets non exportés ne doivent pas être perdus en cas de fermeture brutale

**Gestion d'erreurs:**
- **NFR28:** Tous les échecs de téléchargement (modèle Parakeet, mises à jour) doivent offrir un retry automatique avec backoff exponentiel
- **NFR29:** Les messages d'erreur doivent être actionnables et en français (langue de l'utilisateur)
- **NFR30:** Le système ne doit jamais afficher de stack traces techniques aux utilisateurs finaux

**Offline resilience:**
- **NFR31:** Le système doit fonctionner à 100% sans connexion internet après installation initiale et téléchargement du modèle
- **NFR32:** La vérification licence en échec (pas de connexion) ne doit pas bloquer l'utilisation pendant 7 jours (grace period)

### Integration

**FFmpeg:**
- **NFR33:** Le système doit bundler FFmpeg compatible avec toutes les plateformes supportées (macOS Intel/Silicon, Windows)
- **NFR34:** Le traitement vidéo doit supporter les codecs courants H.264, H.265 (HEVC) sans installation additionnelle

**Formats vidéo:**
- **NFR35:** Le système doit détecter et rejeter les formats/codecs non supportés avec un message clair avant traitement
- **NFR36:** L'export MP4 doit utiliser le codec H.264 (compatible universellement) avec profil High à qualité préservée

**Compatibilité outils pro:**
- **NFR37:** Les MP4 exportés doivent être immédiatement importables dans Adobe Premiere Pro CC 2020+ sans erreur
- **NFR38:** Les MP4 exportés doivent être immédiatement importables dans DaVinci Resolve 17+ sans erreur

**Modèle ML:**
- **NFR39:** Le système doit détecter si Parakeet est déjà téléchargé et skip le téléchargement si présent et valide
- **NFR40:** Le modèle Parakeet doit fonctionner sur CPU-only sans dépendances GPU/CUDA pour MVP
