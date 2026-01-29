# Analyse du Contexte Projet

## Vue d'ensemble des Exigences

**Nature du Projet:**

Splice est une application desktop native cross-platform construite avec **Tauri** (backend Rust + frontend web) qui transforme le dérushage vidéo chronophage (1h15 pour 1h de rushes) en workflow textuel ultra-rapide (3-5 minutes). L'application permet aux monteurs professionnels d'importer des vidéos volumineuses (15-50GB), d'obtenir une transcription locale instantanée via Parakeet TDT 0.6B v3, de sélectionner les passages à conserver par surlignage de texte, et de générer automatiquement des cuts vidéo précis prêts à exporter vers Premiere Pro ou DaVinci Resolve.

**Exigences Fonctionnelles (54 FRs):**

Les exigences fonctionnelles s'organisent en 8 catégories architecturalement significatives:

1. **Video Import & Management (FR1-FR6):** Drag & drop multi-format (MP4/MOV/AVI), validation codec/format, gestion fichiers jusqu'à 50GB, mono-projet MVP
2. **Transcription (FR7-FR13):** Téléchargement auto modèle Parakeet (~500MB premier lancement), transcription locale on-device avec word-level timestamps, support vidéos jusqu'à 2h
3. **Content Editing (FR14-FR18):** Interface surlignage texte intuitive, synchronisation bidirectionnelle texte ↔ timeline
4. **Video Processing (FR19-FR24):** Génération cuts automatiques basés sur surlignage, marges 0.1s auto, traitement streaming, garantie précision (pas de coupe mid-word)
5. **Preview & Validation (FR25-FR28):** Lecteur preview intégré avec contrôles play/pause/scrubbing
6. **Export (FR29-FR34):** Export MP4 H.264 qualité préservée, compatible Premiere/DaVinci
7. **Licensing & Monetization (FR35-FR42):** Vérification licence au démarrage, freemium limite 30min source avec blocage export après preview, grace period 7 jours offline
8. **Platform & Distribution (FR43-FR54):** macOS 13+ (Universal Binary Intel+Silicon), Windows 10 22H2+/11, auto-update silencieux, code signing obligatoire

**Implications architecturales clés:**
- Architecture hybride Tauri nécessaire pour combiner performance native Rust (traitement vidéo/ML) et flexibilité web frontend (UI)
- Streaming architecture obligatoire pour gérer fichiers 15-50GB sans saturation mémoire
- Backend licence minimal requis (API vérification + Stripe)
- Infrastructure distribution avec signature/notarisation pour éviter warnings système

**Exigences Non-Fonctionnelles Critiques:**

**Performance (NFR1-NFR11):**
- Transcription 60min audio → <5s CPU moderne (Apple Silicon M1+, Intel i7/Ryzen 7)
- Workflow complet 10-30s pour 1h vidéo
- Synchronisation UI temps réel <16ms (60fps) entre surlignage texte et timeline
- Export MP4 max 2x durée vidéo finale
- Streaming vidéo pour RAM usage <4GB même avec sources 50GB

**Sécurité (NFR12-NFR21):**
- Traitement vidéo 100% local (jamais envoyé serveurs externes) pour confidentialité projets sensibles
- Tokens licence stockés sécurisé (Keychain macOS, Credential Manager Windows)
- Communications HTTPS obligatoire avec validation certificat
- Aucune télémétrie/analytics MVP (confidentialité maximale)
- Code signing + notarisation macOS, code signing Windows

**Fiabilité (NFR22-NFR32):**
- Taux crash <1% sessions
- Auto-save transparent toutes les 30s
- Crash recovery automatique au redémarrage
- Gestion gracieuse fichiers corrompus, manque espace disque
- Retry automatique avec backoff exponentiel pour échecs réseau

**Intégration (NFR33-NFR40):**
- FFmpeg bundlé compatible toutes plateformes (macOS Intel/Silicon, Windows)
- Support codecs H.264, H.265 sans installation additionnelle
- Export MP4 H.264 immédiatement importable dans Premiere Pro CC 2020+ et DaVinci Resolve 17+
- Parakeet TDT fonctionnel CPU-only (pas de dépendances GPU/CUDA pour MVP)

**Implications architecturales:**
- Rust backend obligatoire pour performance + gestion mémoire optimisée
- Architecture événementielle pour opérations asynchrones (transcription, découpage, export)
- State management robuste pour synchronisation temps réel multi-composants
- Infrastructure monitoring pour garantir taux crash <1% (crash reports Phase 2)

## Complexité UX et Implications Techniques

**Interface Critique - Synchronisation Temps Réel:**

L'UX Design spécifie une interface 3-zones synchronisées en temps réel (<16ms, 60fps):
- **Transcript Editor (30-35% largeur):** Éditeur texte avec surlignage, word-level highlighting, scroll tracking
- **Video Preview (40-45% largeur):** Lecteur vidéo HTML5 avec contrôles NLE standards, scrubbing
- **Timeline (120-150px bas):** Visualisation NLE-like avec segments colorés, sync bidirectionnelle

**Défis architecturaux UX:**
1. **Synchronisation bidirectionnelle <16ms:** Surlignage texte doit instantanément mettre à jour timeline ET inversement (clic timeline → scroll transcript). Nécessite state management optimisé (Zustand/Redux avec memoization) et event bus performant.
2. **Virtualisation transcripts longs:** Vidéos 2h = ~18,000 mots. Nécessite virtualisation (react-window) pour maintenir performance scroll/rendering.
3. **Timeline rendering performant:** Canvas/SVG rendering pour >100 segments simultanés sans impact performance.
4. **Raccourcis clavier NLE standards:** Mapping complet espace (play/pause), J/K/L (scrub), flèches (frame-by-frame) nécessite gestion événements globale.

**Composants Custom Critiques (60% effort, 90% valeur):**
1. **Transcript Editor Component:** Surlignage texte natif + sync temps réel timeline
2. **Timeline Component:** Rendu segments avec zoom/scrubbing performant
3. **Video Preview Player:** Contrôles NLE + synchronisation playhead
4. **Duration Counter:** Feedback continu temps sélectionné
5. **Conversion Modal:** Blocage freemium stratégique post-preview

**Standards Accessibilité (WCAG AA):**
- Navigation clavier complète (Tab order logique, focus visible, raccourcis documentés)
- Contrast ratios: Texte principal >21:1, couleur primary >7:1, tous éléments >4.5:1
- ARIA labels complets (Radix UI via Shadcn/ui fournit base)
- Screen reader support (VoiceOver, NVDA)

**Implications architecturales:**
- Frontend framework moderne nécessaire (React/Vue/Svelte) avec virtual DOM performant
- State management centralisé pour sync multi-composants
- Web Workers potentiels pour opérations CPU-intensive côté frontend
- Tailwind CSS + Shadcn/ui pour rapidité développement (solo dev, timeline MVP 2-4 mois)

## Échelle & Complexité du Projet

**Niveau de Complexité: Medium-High**

**Justification:**
- Application hybride native/web (Tauri) avec intégration ML locale et traitement vidéo performant
- Synchronisation temps réel multi-composants (<16ms contrainte stricte)
- Cross-platform avec spécificités (Universal Binary macOS, code signing)
- Gestion fichiers volumineux (15-50GB) en streaming
- Workflow offline-first avec système licence en ligne
- Performance critique sur toute la chaîne (transcription, UI, découpage, export)

**Domaine Technique Principal:** Desktop App Full-Stack
- Backend: Rust (traitement vidéo FFmpeg, ML Parakeet, découpage, gestion fichiers)
- Frontend: Web (HTML/CSS/TypeScript, framework moderne, Tailwind/Shadcn)
- Bridge: Tauri IPC optimisé pour communication frontend ↔ backend

**Composants Architecturaux Estimés (8-12 majeurs):**

*Backend Rust (4-5 composants):*
1. Video Import & Validation Service
2. Transcription Service (Parakeet integration)
3. Video Processing Engine (FFmpeg cuts generation)
4. Export Service (MP4 encoding)
5. License Verification Service (HTTP client + grace period logic)

*Frontend Web (4-5 composants):*
1. Transcript Editor (surlignage + sync)
2. Timeline Component (visualisation + interactions)
3. Video Preview Player (HTML5 video + contrôles)
4. State Management Layer (Zustand/Redux)
5. UI Components Library (Shadcn/ui + custom)

*Infrastructure (2-3 composants):*
1. Tauri App Shell (window management, file system, auto-update)
2. Backend API Licence (Node.js/Go minimal pour vérification + Stripe)
3. Update Server (Tauri update distribution)

## Contraintes & Dépendances Techniques

**Contraintes Technologiques Fixées:**

1. **Framework Desktop: Tauri 2.x (obligatoire)**
   - Rationale PRD: Légèreté (~10-15MB vs ~150MB Electron), performance native Rust, footprint mémoire réduit
   - Implication: Backend doit être Rust, frontend peut être n'importe quel framework web

2. **Modèle ML: Parakeet TDT 0.6B v3 CPU-only (obligatoire MVP)**
   - Rationale PRD: 60min→2-5s acceptable, zéro complexité GPU/drivers
   - Implication: Intégration Rust ML libs (tract/candle/onnx), bundling modèle ~500MB, téléchargement géré premier lancement

3. **Traitement Vidéo: FFmpeg (obligatoire)**
   - Rationale PRD: Standard industrie, support codecs universel, CLI stable
   - Implication: FFmpeg bundlé dans app, commands shell depuis Rust, parsing output pour progress

4. **Design System: Tailwind CSS + Shadcn/ui (obligatoire)**
   - Rationale UX: Solo dev 2-4 mois, composants accessibles prêts (Radix UI), flexibilité custom components
   - Implication: Frontend probablement React (Shadcn natif React), alternative: adapter pour Vue/Svelte

5. **Plateformes Cibles: macOS 13+ / Windows 10 22H2+ uniquement**
   - Rationale PRD: 95%+ utilisateurs cibles, pas Linux MVP
   - Implication: Builds séparés, CI/CD dual-platform, tests Windows + macOS obligatoires

**Dépendances Externes Critiques:**

1. **FFmpeg (bundlé):** Encodage/décodage vidéo, extraction audio, découpage précis
2. **Parakeet TDT 0.6B v3 (téléchargé runtime):** Transcription locale word-level timestamps
3. **Rust ML Runtime (tract/candle/onnxruntime):** Inférence Parakeet
4. **Stripe API (externe):** Gestion paiements freemium→pro
5. **Backend API Licence (à développer):** Vérification tokens, grace period tracking

**Contraintes Réglementaires:**

1. **Confidentialité (RGPD implicite):**
   - Traitement vidéo 100% local (jamais upload serveurs)
   - Pas de télémétrie/analytics MVP
   - Tokens stockés sécurisé système
   - Communications HTTPS uniquement

2. **Code Signing Obligatoire:**
   - macOS: Signature + notarisation Apple (éviter Gatekeeper warnings)
   - Windows: Code signing (éviter SmartScreen warnings)
   - Implication: Certificats développeur requis (~$100-200/an), process CI/CD signature

3. **Accessibilité (WCAG AA):**
   - Standard industrie applications pro
   - Contrast ratios minimaux, navigation clavier complète, ARIA labels
   - Tests VoiceOver/NVDA obligatoires

**Contraintes Opérationnelles:**

1. **Équipe: Solo Developer (Nicolas)**
   - Full-stack Rust + Frontend web
   - Timeline MVP: 2-4 mois
   - Implication: Stack familière obligatoire, pas d'apprentissage nouveau framework majeur

2. **Validation Terrain: 2 Monteurs Pilotes (Orlan + Ayub)**
   - Feedback continu pendant développement
   - Validation cuts précision, workflow rapidité
   - Implication: Déploiement beta builds fréquent, crash reports essentiels

3. **Infrastructure Minimale MVP:**
   - Backend licence: API simple Node.js/Go + Stripe
   - Update server: Tauri update distribution basique
   - Pas de CDN, analytics, monitoring avancé (Phase 2)

## Préoccupations Transversales Identifiées

**1. Performance End-to-End (Critique)**

Impacte: Tous composants (transcription, UI, découpage, export)

Exigences:
- Transcription 60min → <5s
- Synchronisation UI <16ms (60fps)
- Workflow complet 10-30s
- Export max 2x durée finale

Solutions architecturales:
- Rust natif pour hot paths (transcription, découpage)
- State management optimisé avec memoization (React.memo, useMemo)
- Web Workers pour opérations CPU-intensive frontend
- Streaming architecture pour éviter chargement mémoire complet
- Progress feedback granulaire pour masquer latence perçue

**2. Gestion Mémoire - Fichiers Volumineux (Critique)**

Impacte: Import vidéo, découpage, export

Exigences:
- Fichiers 15-50GB supportés
- RAM usage <4GB même avec source 50GB
- Pas de crash OOM (Out Of Memory)

Solutions architecturales:
- Streaming file reading (pas de chargement complet en RAM)
- Traitement par chunks (FFmpeg stream processing)
- Garbage collection agressive
- Monitoring mémoire avec alertes/throttling si limite approchée

**3. Sécurité & Confidentialité (Critique)**

Impacte: Transcription, stockage tokens, communications réseau

Exigences:
- Vidéos jamais envoyées serveurs externes
- Tokens stockés sécurisé (Keychain/Credential Manager)
- HTTPS obligatoire communications licence

Solutions architecturales:
- Traitement 100% local (Parakeet on-device)
- Tauri secure storage APIs pour tokens
- Certificate pinning pour API licence (optionnel Phase 2)
- Pas de logs contenant données sensibles

**4. Cross-Platform Consistency (Important)**

Impacte: UI rendering, file paths, permissions système, code signing

Exigences:
- UX identique macOS / Windows
- Raccourcis clavier adaptés (Cmd vs Ctrl)
- Permissions système (disque, réseau)

Solutions architecturales:
- Tauri abstraction layer pour APIs système
- Conditional rendering raccourcis clavier (détection OS)
- Tests CI/CD sur macOS + Windows runners
- Builds séparés avec bundling plateforme-spécifique (FFmpeg binaries)

**5. Offline-First avec Licence Online (Important)**

Impacte: Vérification licence, téléchargement Parakeet, auto-update

Exigences:
- Fonctionnement 100% offline après installation
- Grace period 7 jours sans vérification licence
- Parakeet téléchargé premier lancement (connexion requise)

Solutions architecturales:
- Timestamp dernière vérification licence stocké localement
- Logic grace period avec countdown UI
- Retry automatique vérification licence avec exponential backoff
- Fallback gracieux si pas connexion (message clair, pas blocage brutal)

**6. Reliability & Error Recovery (Important)**

Impacte: Tous composants (transcription, découpage, export, licence)

Exigences:
- Taux crash <1%
- Auto-save 30s
- Crash recovery automatique
- Messages erreur actionnables

Solutions architecturales:
- Error boundaries React (frontend)
- Panic handlers Rust avec logging (backend)
- Auto-save state périodique (IndexedDB/localStorage)
- Retry logic avec exponential backoff pour opérations réseau
- Crash reports (Phase 2: Sentry/Crashlytics)

**7. Accessibilité (WCAG AA) (Important)**

Impacte: UI components, navigation, feedback

Exigences:
- Navigation clavier complète
- Contrast ratios minimaux
- ARIA labels
- Screen reader support

Solutions architecturales:
- Shadcn/ui (basé Radix) fournit accessibilité base
- Focus management rigoureux (modals, tooltips)
- Automated testing (jest-axe, Lighthouse CI)
- Manual testing (VoiceOver macOS, NVDA Windows)

**8. Developer Experience & Maintenabilité (Important)**

Impacte: Tous composants (structure code, tests, documentation)

Exigences:
- Solo dev doit maintenir + itérer rapidement
- Code compréhensible pour futurs contributeurs
- Tests automatisés pour éviter régressions

Solutions architecturales:
- Architecture modulaire (séparation concerns claire)
- TypeScript strict frontend (type safety)
- Rust type system backend (compile-time guarantees)
- Tests unitaires + intégration + E2E (Jest, Playwright)
- Documentation inline + architecture decision records
