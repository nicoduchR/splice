# Requirements Inventory

## Functional Requirements

**Video Import & Management**

**FR1:** Les utilisateurs peuvent importer des fichiers vidéo par glisser-déposer depuis leur système de fichiers

**FR2:** Le système peut accepter les formats vidéo MP4, MOV, et AVI

**FR3:** Le système peut valider le format et le codec du fichier vidéo importé

**FR4:** Le système peut afficher un message d'erreur clair si le fichier importé n'est pas supporté

**FR5:** Le système peut gérer des fichiers vidéo jusqu'à 50GB sans échec

**FR6:** Les utilisateurs peuvent importer un seul projet vidéo à la fois (mono-projet MVP)

**Transcription**

**FR7:** Le système peut télécharger automatiquement le modèle de transcription Parakeet lors du premier lancement

**FR8:** Le système peut afficher une barre de progression pendant le téléchargement du modèle

**FR9:** Le système peut générer automatiquement un transcript textuel à partir de l'audio de la vidéo importée

**FR10:** Le système peut effectuer la transcription localement sur la machine de l'utilisateur (on-device)

**FR11:** Le système peut générer des word-level timestamps (timestamp par mot) pour le transcript

**FR12:** Le système peut afficher le transcript généré dans une interface textuelle lisible

**FR13:** Le système peut gérer la transcription de vidéos jusqu'à 2 heures de durée

**Content Editing**

**FR14:** Les utilisateurs peuvent lire le transcript comme du texte dans l'interface

**FR15:** Les utilisateurs peuvent surligner des passages de texte dans le transcript

**FR16:** Le système peut identifier les passages surlignés comme "passages à garder"

**FR17:** Les utilisateurs peuvent dé-surligner des passages précédemment surlignés

**FR18:** Le système peut synchroniser visuellement le texte surligné avec les segments vidéo correspondants

**Video Processing**

**FR19:** Le système peut générer automatiquement des cuts vidéo basés sur les passages surlignés

**FR20:** Le système peut appliquer des marges temporelles automatiques (0.1s) avant et après chaque cut pour des transitions naturelles

**FR21:** Le système peut traiter le découpage vidéo en streaming pour éviter de charger la vidéo entière en mémoire

**FR22:** Le système peut afficher une barre de progression pendant le traitement des cuts

**FR23:** Le système peut garantir que les cuts ne coupent jamais au milieu d'un mot (utilisation word-level timestamps)

**FR24:** Le système peut assembler automatiquement les segments surlignés dans l'ordre chronologique

**Preview & Validation**

**FR25:** Les utilisateurs peuvent prévisualiser la vidéo cutée avant l'export

**FR26:** Le système peut fournir des contrôles de lecture basiques (play, pause) dans le lecteur de preview

**FR27:** Le système peut fournir un scrubbing basique dans le lecteur de preview

**FR28:** Les utilisateurs peuvent valider que les cuts correspondent à leurs attentes avant d'exporter

**Export**

**FR29:** Les utilisateurs peuvent exporter la vidéo cutée en format MP4

**FR30:** Le système peut encoder l'export en codec H.264 pour compatibilité universelle

**FR31:** Le système peut préserver la qualité originale de la vidéo lors de l'export

**FR32:** Le système peut afficher une barre de progression pendant l'export

**FR33:** Les utilisateurs peuvent télécharger le fichier MP4 exporté sur leur système de fichiers

**FR34:** Le système peut générer un fichier export prêt à être importé dans Premiere Pro ou DaVinci Resolve

**Licensing & Monetization**

**FR35:** Le système peut vérifier la licence de l'utilisateur au démarrage de l'application

**FR36:** Le système peut limiter les vidéos sources à 30 minutes maximum pour les utilisateurs gratuits (freemium)

**FR37:** Le système peut bloquer l'export pour les utilisateurs freemium après la preview

**FR38:** Le système peut afficher un message de conversion vers abonnement payant au moment du blocage export

**FR39:** Le système peut accepter des codes early adopters pour débloquer l'accès lifetime gratuit

**FR40:** Le système peut fonctionner offline pendant une période de grace de 7 jours sans vérification licence

**FR41:** Le système peut afficher un message informatif après 7 jours offline demandant une connexion pour vérifier la licence

**FR42:** Le système peut réinitialiser le compteur de grace period après une vérification licence réussie

**Platform & Distribution**

**FR43:** Le système peut s'installer sur macOS 13 Ventura et supérieur (Intel et Apple Silicon)

**FR44:** Le système peut s'installer sur Windows 10 22H2 et supérieur, et Windows 11

**FR45:** Le système peut vérifier automatiquement la disponibilité de mises à jour au démarrage

**FR46:** Le système peut télécharger et installer les mises à jour de manière silencieuse en arrière-plan

**FR47:** Le système peut afficher un indicateur discret de mise à jour disponible sans bloquer le workflow

**FR48:** Le système peut appliquer les mises à jour au prochain redémarrage de l'application

**FR49:** Les administrateurs système peuvent signer et notariser l'application pour macOS

**FR50:** Les administrateurs système peuvent signer l'application pour Windows (code signing)

**Error Handling & User Feedback**

**FR51:** Le système peut afficher des messages d'erreur clairs et actionnables en cas de problème

**FR52:** Le système peut gérer gracieusement les échecs de connexion réseau (téléchargement Parakeet, vérification licence)

**FR53:** Le système peut fournir un retry automatique en cas d'échec de téléchargement du modèle Parakeet

**FR54:** Le système peut afficher des messages d'état pour informer l'utilisateur des opérations en cours

## NonFunctional Requirements

**Performance**

**NFR1:** La transcription d'une vidéo de 60 minutes doit se compléter en moins de 5 secondes sur un CPU moderne (Intel i7/Ryzen 7 ou équivalent, Apple Silicon M1+)

**NFR2:** Le système doit afficher un indicateur de progression pendant la transcription pour vidéos >10 minutes

**NFR3:** La transcription doit fonctionner en arrière-plan sans bloquer l'interface utilisateur

**NFR4:** Le traitement des cuts pour 1 heure de vidéo source doit se compléter en moins de 30 secondes

**NFR5:** Le découpage vidéo doit utiliser un traitement streaming pour éviter de saturer la mémoire (RAM usage <4GB pour vidéos 50GB)

**NFR6:** Le système doit afficher une barre de progression en temps réel pendant le traitement des cuts

**NFR7:** Les interactions UI principales (surlignage texte, navigation) doivent répondre en moins de 100ms

**NFR8:** La preview vidéo doit démarrer en moins de 2 secondes après génération des cuts

**NFR9:** L'application doit démarrer en moins de 3 secondes sur des machines avec SSD

**NFR10:** L'export MP4 ne doit pas prendre plus de 2x la durée de la vidéo finale (ex: vidéo finale 20min = export max 40min)

**NFR11:** Le système doit préserver la qualité vidéo originale sans ré-encodage inutile

**Security**

**NFR12:** Les vidéos importées ne doivent jamais être envoyées vers des serveurs externes (traitement 100% local)

**NFR13:** Les tokens de licence doivent être stockés de manière sécurisée (Keychain macOS, Credential Manager Windows)

**NFR14:** Toutes les communications avec le backend de licence doivent utiliser HTTPS avec validation certificat

**NFR15:** Les informations de paiement ne doivent jamais transiter par ou être stockées par Splice (délégation complète à Stripe)

**NFR16:** Les tokens d'authentification doivent expirer et nécessiter re-validation après 30 jours de grace period

**NFR17:** L'application macOS doit être signée et notarisée par Apple pour éviter les avertissements Gatekeeper

**NFR18:** L'application Windows doit être signée avec code signing pour éviter les warnings SmartScreen

**NFR19:** Les mises à jour téléchargées doivent être signées et validées avant installation

**NFR20:** Aucune donnée analytique ou télémétrie ne doit être collectée en MVP (pas de tracking utilisateur)

**NFR21:** Les logs locaux ne doivent pas contenir de données sensibles (pas de contenu transcript, pas de chemins fichiers complets)

**Reliability**

**NFR22:** Le taux de crash doit être inférieur à 1% des sessions utilisateur

**NFR23:** Le système doit gérer gracieusement les fichiers vidéo corrompus ou mal formés sans crasher

**NFR24:** Le système doit gérer les situations de manque d'espace disque avec des messages d'erreur clairs

**NFR25:** Le système doit sauvegarder automatiquement le transcript et les passages surlignés toutes les 30 secondes

**NFR26:** En cas de crash, le système doit offrir de récupérer le dernier projet en cours au redémarrage

**NFR27:** Les projets non exportés ne doivent pas être perdus en cas de fermeture brutale

**NFR28:** Tous les échecs de téléchargement (modèle Parakeet, mises à jour) doivent offrir un retry automatique avec backoff exponentiel

**NFR29:** Les messages d'erreur doivent être actionnables et en français (langue de l'utilisateur)

**NFR30:** Le système ne doit jamais afficher de stack traces techniques aux utilisateurs finaux

**NFR31:** Le système doit fonctionner à 100% sans connexion internet après installation initiale et téléchargement du modèle

**NFR32:** La vérification licence en échec (pas de connexion) ne doit pas bloquer l'utilisation pendant 7 jours (grace period)

**Integration**

**NFR33:** Le système doit bundler FFmpeg compatible avec toutes les plateformes supportées (macOS Intel/Silicon, Windows)

**NFR34:** Le traitement vidéo doit supporter les codecs courants H.264, H.265 (HEVC) sans installation additionnelle

**NFR35:** Le système doit détecter et rejeter les formats/codecs non supportés avec un message clair avant traitement

**NFR36:** L'export MP4 doit utiliser le codec H.264 (compatible universellement) avec profil High à qualité préservée

**NFR37:** Les MP4 exportés doivent être immédiatement importables dans Adobe Premiere Pro CC 2020+ sans erreur

**NFR38:** Les MP4 exportés doivent être immédiatement importables dans DaVinci Resolve 17+ sans erreur

**NFR39:** Le système doit détecter si Parakeet est déjà téléchargé et skip le téléchargement si présent et valide

**NFR40:** Le modèle Parakeet doit fonctionner sur CPU-only sans dépendances GPU/CUDA pour MVP

## Additional Requirements

**Architecture & Technical Setup**

**ARCH-1:** Utiliser create-tauri-app pour initialiser le projet avec structure monorepo (apps/desktop + packages shared: ui, types, validation, utils)

**ARCH-2:** Configurer Tauri 2.x avec architecture hybride Rust backend + React TypeScript frontend + Vite

**ARCH-3:** Installer et configurer Tailwind CSS v4 avec plugin Vite + shadcn/ui design system

**ARCH-4:** Implémenter Architecture Clean en 3 couches (Domain, Application, Infrastructure) dans le backend Rust

**ARCH-5:** Configurer SQLite embedded pour stockage local des projets et transcripts

**ARCH-6:** Configurer PostgreSQL centralisé pour backend API (licences, subscriptions, analytics)

**ARCH-7:** Implémenter Stack Backend API: Node.js + NestJS + Prisma avec endpoints minimaux (/license/verify, /license/activate, /stripe/webhook)

**ARCH-8:** Configurer State Management avec Zustand - multiple stores par domaine (video, transcript, timeline, license)

**ARCH-9:** Implémenter Type Safety Rust ↔ TypeScript avec ts-rs pour génération automatique des types

**ARCH-10:** Organiser Tauri Commands par domaine métier (video_commands, transcript_commands, selection_commands, cuts_commands, export_commands, license_commands)

**ARCH-11:** Configurer Testing Strategy: Tests unitaires Rust (Cargo), tests frontend (Vitest + React Testing Library), tests E2E (Playwright)

**ARCH-12:** Configurer pnpm workspaces + Turbo pour orchestration builds monorepo

**Desktop Platform Requirements**

**PLATFORM-1:** Créer Universal Binary pour macOS 13+ supportant Intel x86_64 et Apple Silicon (M1/M2/M3+)

**PLATFORM-2:** Créer installeur Windows (.msi ou .exe) pour Windows 10 22H2+ et Windows 11 (x86_64 uniquement)

**PLATFORM-3:** Implémenter code signing et notarization pour macOS (Apple Developer Program)

**PLATFORM-4:** Implémenter code signing pour Windows pour éviter SmartScreen warnings

**PLATFORM-5:** Configurer auto-update silencieux en arrière-plan avec vérification au démarrage

**PLATFORM-6:** Implémenter architecture streaming pour gestion de fichiers vidéo 15-50GB sans saturer la mémoire

**PLATFORM-7:** Implémenter grace period offline de 7 jours pour vérification licence

**PLATFORM-8:** Stocker tokens de licence de manière sécurisée (Keychain macOS, Credential Manager Windows)

**UX & Accessibility Requirements**

**UX-1:** Implémenter WCAG 2.1 Level AA compliance (contraste minimum 4.5:1 pour texte normal, 3:1 pour large text)

**UX-2:** Implémenter responsive strategy desktop-first avec support 1920x1080 minimum, 2560x1440 optimal, 3840x2160 (4K)

**UX-3:** Implémenter window resize adaptatif avec breakpoints internes (1280px warning, 1920px optimal, 2560px enhanced, 3840px ultra)

**UX-4:** Implémenter keyboard navigation complète - toutes fonctionnalités accessibles sans souris (Tab/Shift+Tab, Arrow keys, Escape, Space, Cmd+/)

**UX-5:** Implémenter screen reader support avec ARIA labels, semantic HTML, et live regions pour announcements

**UX-6:** Implémenter touch target sizes minimum 44x44px pour tous buttons et controls interactifs

**UX-7:** Garantir color independence - jamais utiliser couleur seule pour informer (toujours icône + texte)

**UX-8:** Respecter prefers-reduced-motion media query pour animations

**UX-9:** Utiliser relative units (rem, %) pour text scalability jusqu'à 200% zoom

**UX-10:** Implémenter focus indicators visibles (ring-2 ring-emerald-500 ring-offset-2) pour keyboard navigation

**UX-11:** Implémenter Design System Shadcn/ui avec composants de base (button, dialog, progress, toast, tooltip)

**UX-12:** Configurer Tailwind custom breakpoints et spacing scale cohérents avec architecture responsive

## FR Coverage Map

**Epic 0: Market Validation & Landing Page**
- Aucun FR (validation marché pre-product)
- Business: Landing page + collecte emails + ads + analytics

**Epic 1: Application Foundation & Video Import**
- FR1: Import vidéo par glisser-déposer
- FR2: Support formats MP4, MOV, AVI
- FR3: Validation format et codec
- FR4: Messages d'erreur si format non supporté
- FR5: Gestion fichiers jusqu'à 50GB
- FR6: Import mono-projet MVP
- FR43: Installation macOS 13+
- FR44: Installation Windows 10+

**Epic 2: Automatic Transcription**
- FR7: Téléchargement automatique modèle Parakeet
- FR8: Barre de progression téléchargement modèle
- FR9: Génération transcript automatique
- FR10: Transcription locale on-device
- FR11: Word-level timestamps
- FR12: Affichage transcript interface lisible
- FR13: Support vidéos jusqu'à 2h

**Epic 3: Content Selection & Editing**
- FR14: Lecture transcript comme texte
- FR15: Surlignage passages texte
- FR16: Identification passages à garder
- FR17: Dé-surlignage passages
- FR18: Synchronisation visuelle texte/vidéo

**Epic 4: Intelligent Video Cutting**
- FR19: Génération cuts automatique
- FR20: Marges temporelles 0.1s automatiques
- FR21: Traitement streaming vidéo
- FR22: Barre de progression traitement cuts
- FR23: Cuts sans couper au milieu d'un mot
- FR24: Assemblage segments chronologique

**Epic 5: Preview & Validation**
- FR25: Preview vidéo cutée avant export
- FR26: Contrôles lecture (play, pause)
- FR27: Scrubbing basique
- FR28: Validation cuts avant export

**Epic 6: Professional Export**
- FR29: Export vidéo format MP4
- FR30: Encodage H.264 universel
- FR31: Préservation qualité originale
- FR32: Barre de progression export
- FR33: Téléchargement fichier MP4
- FR34: Compatibilité Premiere Pro / DaVinci Resolve

**Epic 7: License Management & Monetization**
- FR35: Vérification licence au démarrage
- FR36: Limite 30min freemium
- FR37: Blocage export freemium
- FR38: Message conversion abonnement
- FR39: Codes early adopters lifetime
- FR40: Fonctionnement offline 7 jours
- FR41: Message après 7 jours offline
- FR42: Reset compteur grace period

**Epic 8: Reliable Auto-Updates**
- FR45: Vérification updates au démarrage
- FR46: Téléchargement updates silencieux
- FR47: Indicateur discret update disponible
- FR48: Application updates au redémarrage
- FR49: Signature et notarization macOS
- FR50: Code signing Windows

**Epic 9: Robust Error Handling & Recovery**
- FR51: Messages d'erreur clairs et actionnables
- FR52: Gestion échecs connexion réseau
- FR53: Retry automatique téléchargement Parakeet
- FR54: Messages d'état opérations en cours

**Epic 10: Accessibility & Inclusive Design**
- (Pas de FRs directs - Additional Requirements UX-1 à UX-10)
