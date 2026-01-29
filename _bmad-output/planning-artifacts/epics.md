---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - '_bmad-output/planning-artifacts/prd/index.md'
  - '_bmad-output/planning-artifacts/architecture/index.md'
  - '_bmad-output/planning-artifacts/ux-design-specification/index.md'
---

# splice - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for splice, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

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

### NonFunctional Requirements

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

### Additional Requirements

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

### FR Coverage Map

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

## Epic List

### Epic 0: Market Validation & Landing Page

Les entrepreneurs peuvent valider la demande marché pour Splice avant d'investir dans le développement complet de l'application desktop.

**FRs couverts:** Aucun (validation marché pre-product)

**Business Value:** Tester le message produit, mesurer l'intérêt réel avec du trafic payant, collecter des early adopters, valider le pricing avant développement complet

**NFRs associés:** Performance landing page (<2s load time)

---

### Epic 1: Application Foundation & Video Import

Les utilisateurs peuvent installer Splice et importer leur première vidéo professionnelle.

**FRs couverts:** FR1-FR6, FR43-FR44

**Additional Requirements:** ARCH-1 à ARCH-12, PLATFORM-1 à PLATFORM-8, UX-11 à UX-12

**NFRs associés:** NFR9, NFR17-NFR18, NFR33

---

### Epic 2: Automatic Transcription

Les utilisateurs peuvent générer automatiquement un transcript précis avec timestamps par mot.

**FRs couverts:** FR7-FR13

**NFRs associés:** NFR1-NFR3, NFR39-NFR40

---

### Epic 3: Content Selection & Editing

Les utilisateurs peuvent sélectionner les passages à garder en surlignant le texte du transcript.

**FRs couverts:** FR14-FR18

**NFRs associés:** NFR7, NFR25-NFR27

---

### Epic 4: Intelligent Video Cutting

Les utilisateurs peuvent générer automatiquement des cuts vidéo basés sur leur sélection textuelle.

**FRs couverts:** FR19-FR24

**NFRs associés:** NFR4-NFR6, NFR11, NFR34

---

### Epic 5: Preview & Validation

Les utilisateurs peuvent prévisualiser et valider la vidéo cutée avant l'export final.

**FRs couverts:** FR25-FR28

**NFRs associés:** NFR8

---

### Epic 6: Professional Export

Les utilisateurs peuvent exporter leur vidéo cutée en qualité professionnelle compatible Premiere/Resolve.

**FRs couverts:** FR29-FR34

**NFRs associés:** NFR10-NFR11, NFR36-NFR38

---

### Epic 7: License Management & Monetization

Les utilisateurs peuvent gérer leur licence freemium/pro et accéder aux fonctionnalités selon leur plan.

**FRs couverts:** FR35-FR42

**NFRs associés:** NFR13-NFR16, NFR31-NFR32

---

### Epic 8: Reliable Auto-Updates

Les utilisateurs reçoivent automatiquement les mises à jour sans interruption de leur workflow.

**FRs couverts:** FR45-FR50

**NFRs associés:** NFR19, NFR28

---

### Epic 9: Robust Error Handling & Recovery

Les utilisateurs peuvent récupérer de toute erreur sans perdre leur travail.

**FRs couverts:** FR51-FR54

**NFRs associés:** NFR22-NFR24, NFR28-NFR30

---

### Epic 10: Accessibility & Inclusive Design

Tous les utilisateurs peuvent utiliser Splice avec keyboard navigation et screen readers (WCAG AA).

**Additional Requirements:** UX-1 à UX-10

**NFRs associés:** NFR29

---

## Epic 0: Market Validation & Landing Page

Valider la demande marché pour Splice avant d'investir dans le développement complet de l'application desktop en lançant une landing page et une campagne publicitaire ciblée.

### Story 0.1: Landing Page Deployment

As a entrepreneur,
I want to deploy the existing landing page design to production,
So that I can start collecting early adopter emails and validate market demand immediately.

**Acceptance Criteria:**

**Given** the HTML/CSS code exists in `/designs/splice_product_landing_page/code.html`
**When** deployed to Vercel with custom domain
**Then** landing page is accessible publicly on production domain
**And** page loads in less than 2 seconds on desktop and mobile
**And** all sections render correctly (Hero, Comparison, Features, CTA, Footer)
**And** responsive design works on mobile, tablet, and desktop
**And** SSL certificate is active (HTTPS)

---

### Story 0.2: Email Collection Setup with Tally.so

As a entrepreneur,
I want to collect email addresses from interested visitors,
So that I can build a waitlist of early adopters to contact when the product launches.

**Acceptance Criteria:**

**Given** a visitor lands on the page and is interested
**When** they click on any "Télécharger" CTA button
**Then** a Tally.so form popup or embed appears
**And** form requests email address and optional name
**And** form includes RGPD consent checkbox
**And** on successful submission, user sees confirmation message "Merci! Nous vous contacterons bientôt pour l'accès beta."
**And** email is saved in Tally.so dashboard
**And** entrepreneur receives email notification for each new signup
**And** form design matches landing page dark theme aesthetic

---

### Story 0.3: DataFast Analytics Integration

As a entrepreneur,
I want to track visitor behavior and conversion metrics on the landing page,
So that I can measure campaign performance and optimize conversion rates.

**Acceptance Criteria:**

**Given** DataFast account is created and tracking script obtained
**When** integrated into landing page `<head>` section
**Then** all page views are tracked in DataFast dashboard
**And** custom events are tracked:
  - Event "cta_click" with button location (header, hero, final_cta)
  - Event "email_submitted" with source location
  - Event "scroll_depth" at 25%, 50%, 75%, 100%
**And** real-time metrics visible in DataFast dashboard
**And** tracking works without blocking page load
**And** RGPD compliance banner shown if required

---

### Story 0.4: Meta Ads Campaign Launch

As a entrepreneur,
I want to launch targeted Instagram and Facebook ads,
So that I can drive qualified traffic to the landing page and test market demand with real budget.

**Acceptance Criteria:**

**Given** landing page is live with tracking and email collection
**When** Meta Ads campaign is created and launched
**Then** campaign objective is set to "Lead Generation" or "Traffic"
**And** budget is set to 100-150 USD over 7-10 days
**And** daily budget cap configured to prevent overspend
**And** target audiences include:
  - Interests: "Video editing", "Adobe Premiere Pro", "DaVinci Resolve", "YouTube Creator", "Content Creation"
  - Geographic: France, Belgium, Switzerland, Canada (French-speaking)
  - Age: 18-45
**And** ad creatives include:
  - Carousel with landing page screenshots
  - Copy highlighting "Découpez vos vidéos en sélectionnant du texte"
  - Clear CTA "Rejoindre la beta" or "Découvrir Splice"
**And** Meta Pixel installed on landing page for conversion tracking
**And** campaign performance metrics visible in Meta Ads Manager
**And** cost per lead (CPL) calculated and monitored

---

### Story 0.5: A/B Testing & Campaign Optimization

As a entrepreneur,
I want to test variations of messaging and optimize ad performance,
So that I can improve conversion rates and reduce cost per lead.

**Acceptance Criteria:**

**Given** initial campaign has run for 3-5 days with sufficient data
**When** analyzing DataFast and Meta Ads metrics
**Then** conversion rate (visitors → email signups) is measured
**And** cost per lead is calculated
**And** A/B test variations are created for:
  - Different hero headlines
  - CTA button wording ("Rejoindre la beta" vs "Essai gratuit" vs "Télécharger gratuitement")
  - Ad creative variations (different screenshots, videos)
**And** winning variations are identified based on conversion rate
**And** budget is reallocated to best-performing ads
**And** campaign is paused or continued based on validation criteria:
  - ✅ Success: Conversion rate >5%, CPL <10 USD, 50+ emails collected
  - ⚠️ Pivot: Conversion rate 2-5%, test new messaging
  - ❌ Stop: Conversion rate <2%, CPL >20 USD

---

## Epic 1: Application Foundation & Video Import

Les utilisateurs peuvent installer Splice et importer leur première vidéo professionnelle.

### Story 1.1: Project Foundation Setup with Monorepo

As a developer,
I want to initialize the project with the recommended starter template and monorepo structure,
So that I have a solid foundation with Tauri, React, TypeScript, and shared packages ready for development.

**Acceptance Criteria:**

**Given** starting a new greenfield project
**When** following the architecture starter template setup (ARCH-1, ARCH-2, ARCH-3, ARCH-12)
**Then** monorepo structure is created with:
  - Root `package.json` with pnpm workspaces
  - `pnpm-workspace.yaml` configured
  - `turbo.json` for build orchestration
  - `apps/desktop/` directory with Tauri 2.x app (created via `pnpm create tauri-app`)
  - `packages/ui/`, `packages/types/`, `packages/validation/`, `packages/utils/` directories
**And** Tauri app includes React + TypeScript + Vite configuration
**And** Tailwind CSS v4 installed and configured with `@tailwindcss/vite` plugin
**And** `vite.config.ts` includes path aliases for `@/` and `@splice/*` packages
**And** `tsconfig.json` includes path mappings for monorepo packages
**And** shadcn/ui initialized with `npx shadcn@latest init` (base color: Slate, CSS variables: yes)
**And** all dependencies install successfully with `pnpm install`
**And** dev server starts with `pnpm dev` and displays default Tauri app
**And** application starts in less than 3 seconds (NFR9)

---

### Story 1.2: Clean Architecture Foundation & Type Safety

As a developer,
I want to implement Clean Architecture layers and automatic type generation,
So that the codebase is maintainable, testable, and type-safe across Rust and TypeScript.

**Acceptance Criteria:**

**Given** the project foundation is setup
**When** implementing Clean Architecture structure (ARCH-4, ARCH-9)
**Then** Rust backend organized in 3 layers:
  - `src-tauri/src/domain/` - entities, value_objects, repository traits, domain errors
  - `src-tauri/src/application/` - use_cases, ports (abstract interfaces)
  - `src-tauri/src/infrastructure/` - adapters, tauri_commands, config
**And** ts-rs crate added to `Cargo.toml` dependencies
**And** example domain entity created with `#[derive(TS)]` and `#[ts(export, export_to = "../../../packages/types/src/generated/")]`
**And** cargo build generates TypeScript types in `packages/types/src/generated/`
**And** TypeScript can import generated types with `import type { EntityName } from '@splice/types/generated'`
**And** Dependency Inversion principle enforced: Domain → Application → Infrastructure
**And** example demonstrates no circular dependencies

---

### Story 1.3: State Management & Local Storage Setup

As a developer,
I want to configure Zustand state management and SQLite embedded storage,
So that the app can manage state efficiently and persist projects locally.

**Acceptance Criteria:**

**Given** architecture foundation is in place
**When** setting up state management and storage (ARCH-5, ARCH-8)
**Then** Zustand installed in `apps/desktop` dependencies
**And** multiple store files created in `apps/desktop/src/stores/`:
  - `video-store.ts` - manages current project, import state
  - `transcript-store.ts` - manages transcript data and selections
  - `timeline-store.ts` - manages playback state and timeline
  - `license-store.ts` - manages license verification state
**And** SQLite configured in Rust backend with `rusqlite` crate
**And** database file location configured: `~/.splice/db/splice.db` (macOS), `%APPDATA%/splice/db/splice.db` (Windows)
**And** `projects` table created with migration:
  ```sql
  CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    duration_seconds REAL NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  ```
**And** SQLite repository trait defined in domain layer
**And** SQLite adapter implementation in infrastructure layer
**And** example Zustand store demonstrates updating state and triggering re-renders

---

### Story 1.4: Video Import UI with Drag & Drop

As a user,
I want to import video files by dragging them into the application window,
So that I can quickly start working on my video without navigating file dialogs.

**Acceptance Criteria:**

**Given** the application is running
**When** user drags a video file over the app window (FR1)
**Then** drop zone highlights with visual feedback (border glow or overlay)
**And** supported formats indicated: "Drop MP4, MOV, or AVI files here" (FR2)
**And** on drop, file path is captured
**And** import process initiates automatically
**And** alternative "Select File" button available for users who prefer file picker
**And** only one project can be imported at a time (mono-projet MVP) (FR6)
**And** if a project already exists, user is prompted: "Replace current project?"
**And** UI is responsive and handles drag events without lag (<100ms response) (NFR7)

---

### Story 1.5: Video Format Validation & Error Handling

As a user,
I want the system to validate my video file format before processing,
So that I get clear error messages if my file isn't supported.

**Acceptance Criteria:**

**Given** user has dropped or selected a video file
**When** file validation runs (FR3, FR4)
**Then** FFmpeg bundled with app and accessible (NFR33)
**And** system checks file extension is MP4, MOV, or AVI (FR2)
**And** system probes video codec using FFmpeg
**And** supported codecs: H.264, H.265/HEVC (NFR34)
**And** if format unsupported, clear error dialog displays: "Format non supporté. Splice accepte uniquement MP4, MOV et AVI avec codec H.264 ou H.265." (FR4, NFR35)
**And** if codec unsupported, error specifies: "Ce fichier utilise un codec non supporté. Veuillez convertir en H.264 ou H.265."
**And** if file corrupted, error displays: "Ce fichier vidéo semble corrompu. Impossible de le lire." (NFR23)
**And** error messages are in French (NFR29)
**And** error dialog includes "Retry" button and "Cancel" button

---

### Story 1.6: Video Import Backend Processing & Storage

As a user,
I want my imported video to be processed and saved efficiently,
So that I can work with large files up to 50GB without the app crashing or running out of memory.

**Acceptance Criteria:**

**Given** video file has passed validation
**When** import processing starts (FR5, FR6)
**Then** Tauri command `import_video` is called from frontend with file path
**And** Rust backend extracts video metadata: duration, resolution, codec, file size
**And** streaming architecture used to avoid loading entire file in memory (NFR5, PLATFORM-6)
**And** video file stays in original location (not copied)
**And** project record created in SQLite `projects` table with:
  - Unique project ID (UUID)
  - Original file path
  - File name
  - Duration in seconds
  - Created/updated timestamps
**And** frontend receives project object with type safety via ts-rs generated types
**And** video store updated with current project
**And** files up to 50GB handled without crash or memory saturation (<4GB RAM usage) (FR5, NFR5)
**And** import completes successfully and user sees confirmation toast: "Vidéo importée avec succès"

---

### Story 1.7: Design System Foundation with Shadcn/ui

As a developer,
I want essential UI components installed and configured,
So that the app has a consistent, accessible, and professional design system.

**Acceptance Criteria:**

**Given** shadcn/ui is initialized
**When** installing base components (UX-11, UX-12)
**Then** following shadcn/ui components added with `npx shadcn@latest add`:
  - `button` - Primary, secondary, destructive variants
  - `dialog` - Modals and confirmations
  - `progress` - Progress bars for transcription, cuts, export
  - `toast` - Success/error notifications
  - `tooltip` - Contextual help
**And** Tailwind config extended with custom breakpoints (UX-3):
  ```js
  theme: {
    extend: {
      screens: {
        'desktop': '1280px',
        'comfortable': '1920px',
        'spacious': '2560px',
        'ultra': '3840px',
      }
    }
  }
  ```
**And** color system configured with emerald primary: `colors: { primary: '#10b981' }`
**And** spacing scale uses rem units for scalability (UX-9)
**And** components follow WCAG AA contrast requirements (UX-1)
**And** all buttons have minimum 44x44px touch targets (UX-6)
**And** focus indicators visible with `focus:ring-2 focus:ring-emerald-500` (UX-10)
**And** example page demonstrates all components rendering correctly

---

### Story 1.8: macOS Universal Binary Build & Code Signing

As a developer,
I want to build and sign a macOS Universal Binary,
So that users on both Intel and Apple Silicon Macs can install and run Splice without security warnings.

**Acceptance Criteria:**

**Given** development is ready for distribution (FR43, PLATFORM-1, PLATFORM-3)
**When** building for macOS production
**Then** `tauri build` configured for Universal Binary (x86_64 + aarch64)
**And** `tauri.conf.json` includes macOS bundle settings:
  - App name: "Splice"
  - Bundle identifier: "com.splice.app"
  - Minimum OS version: macOS 13.0 Ventura
**And** Apple Developer certificate configured for code signing (NFR17)
**And** app is signed with Developer ID Application certificate
**And** app is notarized via Apple notarization service
**And** resulting `.dmg` file installable without Gatekeeper warnings
**And** app runs on both Intel and Apple Silicon Macs
**And** builds stored in `src-tauri/target/release/bundle/dmg/`

---

### Story 1.9: Windows Installer Build & Code Signing

As a developer,
I want to build and sign a Windows installer,
So that users on Windows 10/11 can install Splice without SmartScreen warnings.

**Acceptance Criteria:**

**Given** development is ready for distribution (FR44, PLATFORM-2, PLATFORM-4)
**When** building for Windows production
**Then** `tauri build` configured for Windows x86_64
**And** `tauri.conf.json` includes Windows bundle settings:
  - App name: "Splice"
  - Minimum OS version: Windows 10 22H2, Windows 11
**And** Windows code signing certificate configured (NFR18)
**And** installer signed with certificate to avoid SmartScreen warnings
**And** `.msi` or `.exe` installer created
**And** installer includes option to add desktop shortcut
**And** app uninstalls cleanly (removes data in `%APPDATA%/splice/`)
**And** builds stored in `src-tauri/target/release/bundle/msi/` or `/nsis/`

---

## Epic 2: Automatic Transcription

Les utilisateurs peuvent générer automatiquement un transcript précis avec timestamps par mot.

### Story 2.1: Parakeet Model Download Infrastructure

As a user,
I want the Parakeet transcription model to download automatically on first launch,
So that I can start transcribing videos without manual setup.

**Acceptance Criteria:**

**Given** app is launched for the first time (FR7)
**When** no Parakeet model detected locally
**Then** app checks model location: `~/.splice/models/parakeet-tdt-0.6b-v3/` (macOS), `%APPDATA%/splice/models/` (Windows)
**And** if model missing, download dialog appears: "Première utilisation: Téléchargement du modèle de transcription Parakeet (≈500MB)"
**And** download starts from model repository (URL configured in backend)
**And** progress bar shows download percentage and speed (FR8, NFR2)
**And** download uses streaming to disk (not all in memory)
**And** on download failure, retry automatically with exponential backoff (NFR28, FR53)
**And** after 3 failed attempts, show error with manual retry button
**And** downloaded model validated (checksum verification) (NFR39)
**And** on successful download, model marked as ready in local config
**And** user can click "Cancel" to quit app and download later

---

### Story 2.2: Transcription Backend Integration

As a developer,
I want to integrate Parakeet TDT 0.6B v3 model into the Rust backend,
So that transcription runs locally on the user's CPU without requiring GPU.

**Acceptance Criteria:**

**Given** Parakeet model downloaded and ready (FR10, NFR40)
**When** integrating model into Rust backend
**Then** Parakeet TDT Rust crate or bindings added to `Cargo.toml`
**And** model loaded on-demand (not at app startup to reduce memory)
**And** transcription runs on CPU-only without CUDA/GPU dependencies (NFR40)
**And** model processes audio extracted from video file
**And** transcription use case created in `application/use_cases/transcribe_video.rs`
**And** transcription adapter in `infrastructure/adapters/parakeet_adapter.rs`
**And** word-level timestamps generated for each word (FR11)
**And** confidence scores calculated for each word
**And** 60 minutes of video transcribed in less than 5 seconds on modern CPU (Intel i7/Ryzen 7, Apple Silicon M1+) (NFR1)
**And** transcription runs in background thread without blocking UI (NFR3)

---

### Story 2.3: Transcript Data Storage

As a developer,
I want to store transcripts with word-level timestamps in SQLite,
So that transcripts persist and can be retrieved efficiently.

**Acceptance Criteria:**

**Given** transcription completes successfully
**When** storing transcript data
**Then** two SQLite tables created via migration:
  ```sql
  CREATE TABLE transcripts (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    full_text TEXT NOT NULL,
    language TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE transcript_words (
    id TEXT PRIMARY KEY,
    transcript_id TEXT NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    start_time REAL NOT NULL,
    end_time REAL NOT NULL,
    confidence REAL NOT NULL,
    word_index INTEGER NOT NULL
  );
  ```
**And** transcript saved with full text concatenation
**And** each word saved individually with precise start/end timestamps
**And** language detected and stored (default: French)
**And** transcript linked to project via foreign key
**And** auto-save triggered every 30 seconds during long transcriptions (NFR25)
**And** if app crashes mid-transcription, partial transcript recovered on restart (NFR26)

---

### Story 2.4: Transcription UI & Progress Tracking

As a user,
I want to see transcription progress in real-time,
So that I know the process is working and how long it will take.

**Acceptance Criteria:**

**Given** video imported successfully (FR9)
**When** user clicks "Générer le transcript" button
**Then** transcription starts in backend
**And** progress modal appears with:
  - Animated loading indicator
  - Progress bar showing percentage (0-100%)
  - Status text: "Transcription en cours... 45%" (FR8, NFR2)
  - Estimated time remaining (optional)
**And** for videos >10 minutes, progress updates every 2-3 seconds (NFR2)
**And** for videos <10 minutes, simple spinner without percentage
**And** UI remains responsive during transcription (no blocking) (NFR3)
**And** user can cancel transcription mid-process
**And** on completion, success toast: "Transcript généré avec succès! X mots détectés."
**And** transcript automatically displays in editor

---

### Story 2.5: Transcript Display & Editor Component

As a user,
I want to read the generated transcript in a clean, readable interface,
So that I can easily review and select text for editing.

**Acceptance Criteria:**

**Given** transcription completed (FR12, FR14)
**When** transcript displays in editor
**Then** transcript rendered as readable text with proper formatting:
  - Paragraphs separated by pauses/silences
  - Font size 16px (1rem) for readability (UX-9)
  - Line height 1.7 for comfortable reading
  - Dark theme with high contrast text (WCAG AA) (UX-1)
**And** each word is individually selectable
**And** timestamps hidden by default (cleaner view)
**And** optional "Show timestamps" toggle displays time codes
**And** transcript scrollable with smooth scrolling
**And** search functionality: Cmd+F / Ctrl+F highlights matching words
**And** transcript supports videos up to 2 hours (FR13)
**And** large transcripts (>10,000 words) render efficiently with virtualization
**And** keyboard navigation: Arrow keys move between words (UX-4)

---

## Epic 3: Content Selection & Editing

Les utilisateurs peuvent sélectionner les passages à garder en surlignant le texte du transcript.

### Story 3.1: Text Selection & Highlighting

As a user,
I want to highlight passages of text in the transcript,
So that I can mark which parts of my video to keep.

**Acceptance Criteria:**

**Given** transcript is displayed (FR15)
**When** user selects text by clicking and dragging
**Then** selected words highlighted with emerald green background (`bg-emerald-500/30`)
**And** multi-word selection supported (click word 1, shift+click word 10 = select words 1-10)
**And** click individual words to toggle selection
**And** keyboard selection: Shift + Arrow keys extend selection (UX-4)
**And** selected text stored in Zustand transcript store
**And** selected ranges saved to SQLite `selections` table:
  ```sql
  CREATE TABLE selections (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    start_word_index INTEGER NOT NULL,
    end_word_index INTEGER NOT NULL,
    start_time REAL NOT NULL,
    end_time REAL NOT NULL,
    created_at INTEGER NOT NULL
  );
  ```
**And** selections auto-saved every 30 seconds (NFR25)
**And** UI responds to selection in less than 100ms (NFR7)

---

### Story 3.2: De-Selection & Selection Management

As a user,
I want to un-highlight previously selected text,
So that I can refine my selection and remove parts I don't want.

**Acceptance Criteria:**

**Given** text is currently highlighted (FR17)
**When** user clicks on highlighted text again
**Then** highlight removed and text returns to normal state
**And** selection record deleted from SQLite `selections` table
**And** Zustand store updated to reflect removal
**And** keyboard shortcut Escape clears all selections (UX-4)
**And** "Clear all selections" button available in toolbar
**And** confirmation dialog: "Effacer toutes les sélections?" (Yes/No)
**And** undo/redo functionality available (Cmd+Z / Cmd+Shift+Z)
**And** selection state restored on app restart (NFR26, NFR27)

---

### Story 3.3: Timeline Visualization & Sync

As a user,
I want to see my selected text passages visualized on a timeline,
So that I can understand the structure of my edited video at a glance.

**Acceptance Criteria:**

**Given** text selections have been made (FR18)
**When** timeline component renders
**Then** timeline shows full video duration as horizontal bar
**And** selected segments displayed as emerald green blocks on timeline
**And** unselected segments displayed as gray or transparent
**And** hovering over segment shows tooltip with:
  - Start/end timecodes
  - Duration of segment
  - Text preview (first 50 characters)
**And** clicking timeline segment scrolls transcript to corresponding text
**And** timeline synchronized with transcript editor (changes reflect immediately)
**And** timeline uses Zustand timeline store for state management
**And** playhead indicator shows current position (if preview playing)
**And** timeline scales responsively to window width (UX-2, UX-3)

---

### Story 3.4: Selection Statistics & Feedback

As a user,
I want to see statistics about my selections,
So that I know how much content I'm keeping and the final video duration.

**Acceptance Criteria:**

**Given** user has made selections
**When** selections change
**Then** statistics panel displays:
  - Total original video duration: "45:30"
  - Total selected duration: "12:45"
  - Reduction percentage: "71% réduction"
  - Number of segments: "23 segments"
  - Estimated final video length
**And** statistics update in real-time as selections change
**And** color coding: Green if >50% reduction, yellow if 20-50%, gray if <20%
**And** statistics help user gauge editing progress
**And** export button disabled if no selections made

---

## Epic 4: Intelligent Video Cutting

Les utilisateurs peuvent générer automatiquement des cuts vidéo basés sur leur sélection textuelle.

### Story 4.1: Cut Generation Backend Logic

As a developer,
I want to implement the core cut generation algorithm,
So that selected text passages are accurately converted to video segments with proper timing.

**Acceptance Criteria:**

**Given** user has highlighted text selections (FR19)
**When** "Generate Cuts" is triggered
**Then** backend use case `generate_cuts` retrieves selections from SQLite
**And** for each selection:
  - Start time = first word start_time - 0.1s margin (FR20)
  - End time = last word end_time + 0.1s margin (FR20)
  - Margins ensure natural transitions
**And** cuts never split in middle of a word (use word boundaries) (FR23)
**And** segments assembled in chronological order (FR24)
**And** cut list stored as JSON or in `cuts` table:
  ```sql
  CREATE TABLE cuts (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    segment_index INTEGER NOT NULL,
    start_time REAL NOT NULL,
    end_time REAL NOT NULL,
    created_at INTEGER NOT NULL
  );
  ```
**And** cut generation completes in less than 1 second for typical edits

---

### Story 4.2: FFmpeg Video Segmentation

As a developer,
I want to use FFmpeg to extract video segments based on cut timecodes,
So that the actual video processing happens efficiently without re-encoding.

**Acceptance Criteria:**

**Given** cuts have been generated (FR21)
**When** video segmentation starts
**Then** FFmpeg adapter uses streaming architecture to process large files (NFR5, PLATFORM-6)
**And** FFmpeg command extracts segments with `-ss` (start) and `-to` (end) flags
**And** copy codec used to avoid re-encoding: `-c copy` (preserves quality, fast processing)
**And** for 1 hour of source video, processing completes in <30 seconds (NFR4)
**And** RAM usage stays under 4GB even for 50GB video files (NFR5)
**And** segments saved temporarily in `~/.splice/temp/` directory
**And** segment files named: `segment_001.mp4`, `segment_002.mp4`, etc.
**And** error handling for corrupted video or missing codecs (NFR23)

---

### Story 4.3: Cut Processing UI with Progress

As a user,
I want to see real-time progress while cuts are being generated,
So that I know the process is working and how long it will take.

**Acceptance Criteria:**

**Given** user clicks "Generate Cuts" button (FR22)
**When** processing starts
**Then** progress modal displays:
  - Title: "Génération des cuts vidéo..."
  - Progress bar showing percentage (0-100%)
  - Current segment: "Traitement du segment 5/23"
  - Estimated time remaining
**And** progress updates in real-time (NFR6)
**And** UI remains responsive (background processing)
**And** user can cancel operation mid-process
**And** on cancel, temp files cleaned up
**And** on completion, success toast: "Cuts générés avec succès! 23 segments prêts."
**And** automatically transitions to preview mode

---

### Story 4.4: Cut Validation & Quality Checks

As a developer,
I want to validate generated cuts for quality and integrity,
So that users don't get corrupted or invalid video segments.

**Acceptance Criteria:**

**Given** cuts have been processed
**When** validation runs
**Then** each segment verified:
  - File exists and is readable
  - Duration matches expected cut length (±0.5s tolerance)
  - Video codec is valid (H.264/H.265)
  - No corruption detected
**And** segments concatenable (compatible codecs, resolution, frame rate)
**And** if any segment fails validation, error reported: "Segment X invalide, régénération..."
**And** failed segments automatically regenerated (retry logic)
**And** all validation completes before preview available
**And** validation logged for debugging (NFR21 - logs without sensitive data)

---

## Epic 5: Preview & Validation

Les utilisateurs peuvent prévisualiser et valider la vidéo cutée avant l'export final.

### Story 5.1: Video Preview Player Component

As a user,
I want to preview my edited video with all cuts applied,
So that I can validate the result before exporting.

**Acceptance Criteria:**

**Given** cuts have been generated (FR25)
**When** preview mode opens
**Then** video player component displays with:
  - Video canvas showing concatenated segments
  - Play/Pause button (FR26)
  - Seek bar for scrubbing (FR27)
  - Current time / Total duration display
  - Volume control
  - Fullscreen toggle
**And** segments play in order seamlessly (no gaps)
**And** preview starts playing automatically after <2 seconds load time (NFR8)
**And** scrubbing responsive (click anywhere on seek bar jumps to that time) (FR27)
**And** playback controls use standard keyboard shortcuts:
  - Space: Play/Pause
  - Arrow Left/Right: Skip 5s back/forward
  - Arrow Up/Down: Volume up/down
  - F: Fullscreen
**And** player accessible via keyboard (WCAG AA) (UX-4)

---

### Story 5.2: Preview Playback Backend

As a developer,
I want to implement efficient preview playback of concatenated segments,
So that users can preview without waiting for full export.

**Acceptance Criteria:**

**Given** segments exist in temp directory
**When** preview requested
**Then** backend creates temporary concatenation list for FFmpeg
**And** FFmpeg concat demuxer used to stream segments: `-f concat -safe 0 -i concat_list.txt`
**And** preview pipe streams to frontend without creating full export file
**And** playback starts in <2 seconds (NFR8)
**And** seeking works smoothly (no lag)
**And** segments transition seamlessly (no black frames or audio glitches)
**And** memory efficient (doesn't load entire video in RAM)

---

### Story 5.3: Preview Validation & Editing Controls

As a user,
I want to validate that cuts meet my expectations and make adjustments if needed,
So that I can ensure quality before exporting.

**Acceptance Criteria:**

**Given** preview is playing (FR28)
**When** user reviews cuts
**Then** "Back to Edit" button available to return to transcript editor
**And** "Looks Good - Export" button available to proceed to export
**And** segment boundaries visible on preview timeline (markers show where cuts happen)
**And** clicking segment boundary jumps to that transition point
**And** user can identify any issues:
  - Cut too early/late
  - Awkward transitions
  - Missing content
**And** validation checklist displayed:
  - ☐ All important content included
  - ☐ Transitions feel natural
  - ☐ No awkward cuts mid-sentence
  - ☐ Audio levels consistent
**And** if user finds issues, they can return to edit without losing progress

---

## Epic 6: Professional Export

Les utilisateurs peuvent exporter leur vidéo cutée en qualité professionnelle compatible Premiere/Resolve.

### Story 6.1: Export Configuration & Options

As a user,
I want to configure export settings before finalizing my video,
So that I can ensure the output meets my quality and compatibility requirements.

**Acceptance Criteria:**

**Given** preview validated and user clicks "Export" (FR29)
**When** export dialog opens
**Then** export settings form displays:
  - Output format: MP4 (fixed for MVP) (FR29)
  - Codec: H.264 (High profile, fixed) (FR30, NFR36)
  - Quality: "Preserve Original" (default) or "High/Medium/Low" (FR31)
  - Output location: File picker to choose destination
  - Filename: Auto-suggested as `{original_name}_edited.mp4`
**And** estimated file size displayed based on selections
**And** estimated export time: "~5 minutes" (NFR10)
**And** "Export" button starts process
**And** "Cancel" button closes dialog
**And** settings saved as defaults for future exports

---

### Story 6.2: FFmpeg Export Processing

As a developer,
I want to implement high-quality video export using FFmpeg,
So that exported files are professional-grade and compatible with editing software.

**Acceptance Criteria:**

**Given** export started with user settings (FR30, FR31, FR34)
**When** backend processes export
**Then** FFmpeg concat demuxer merges segments into single MP4
**And** H.264 codec used with High profile (NFR36):
  - `-c:v libx264 -profile:v high -level 4.1`
**And** quality preserved from original (no unnecessary re-encoding) (NFR11)
**And** if source is H.264, codec copy used where possible (`-c copy`)
**And** if re-encoding needed, CRF 18-23 used for high quality
**And** audio codec: AAC at 192kbps (universal compatibility)
**And** metadata preserved (creation date, camera info if present)
**And** export file compatible with:
  - Adobe Premiere Pro CC 2020+ (NFR37)
  - DaVinci Resolve 17+ (NFR38)
  - Standard video players (VLC, QuickTime, Windows Media Player)
**And** export time ≤ 2x final video duration (NFR10)
**And** no quality degradation visible (PSNR/VMAF metrics high)

---

### Story 6.3: Export Progress & Real-time Feedback

As a user,
I want to see detailed progress while my video exports,
So that I know how long to wait and can track completion.

**Acceptance Criteria:**

**Given** export processing (FR32)
**When** FFmpeg is encoding
**Then** progress modal displays:
  - Title: "Export en cours..."
  - Progress bar (0-100%)
  - Current frame / Total frames
  - Encoding speed: "2.5x realtime"
  - Time elapsed / Time remaining
  - File size growing: "145 MB / ~380 MB"
**And** progress updates every 0.5-1 second (NFR6, real-time)
**And** UI remains responsive (background export)
**And** user can minimize app and continue other work
**And** system notifications sent on completion (optional)
**And** "Cancel Export" button available with confirmation dialog
**And** on cancel, partial export file deleted

---

### Story 6.4: Export Completion & File Access

As a user,
I want quick access to my exported video file after export completes,
So that I can immediately use it in my workflow.

**Acceptance Criteria:**

**Given** export completed successfully (FR33)
**When** processing finishes
**Then** success modal displays:
  - "Export terminé avec succès!"
  - File size: "385 MB"
  - Duration: "12:45"
  - Location: "/Users/name/Videos/project_edited.mp4"
**And** "Open File" button opens video in default player
**And** "Show in Finder/Explorer" button reveals file in file browser (FR33)
**And** "Export Another" button returns to preview
**And** "Done" button closes export flow
**And** success toast notification: "Vidéo exportée: project_edited.mp4"
**And** exported file plays correctly in Premiere Pro without errors (NFR37)
**And** exported file imports cleanly into DaVinci Resolve (NFR38)

---

## Epic 7: License Management & Monetization

Les utilisateurs peuvent gérer leur licence freemium/pro et accéder aux fonctionnalités selon leur plan.

### Story 7.1: Backend API License Service Setup

As a developer,
I want to create the NestJS backend API for license management,
So that licenses can be verified and managed centrally.

**Acceptance Criteria:**

**Given** architecture specifies NestJS + Prisma + PostgreSQL (ARCH-6, ARCH-7)
**When** setting up backend API
**Then** NestJS project initialized with modules:
  - `license` - License verification and activation
  - `stripe` - Webhook handling for subscriptions
  - `analytics` - Usage tracking (Phase 2)
**And** PostgreSQL database configured with Prisma schema:
  ```prisma
  model User {
    id        String   @id @default(uuid())
    email     String   @unique
    stripeCustomerId String? @unique
    licenses  License[]
    createdAt DateTime @default(now())
  }

  model License {
    id          String   @id @default(uuid())
    userId      String
    user        User     @relation(fields: [userId], references: [id])
    licenseKey  String   @unique
    plan        String   // 'free' | 'pro'
    status      String   // 'active' | 'expired'
    activatedAt DateTime?
    expiresAt   DateTime?
    createdAt   DateTime @default(now())
  }
  ```
**And** REST endpoints implemented:
  - `POST /api/v1/license/verify` - Verify license validity (FR35)
  - `POST /api/v1/license/activate` - Activate new license (FR39)
  - `POST /api/v1/stripe/webhook` - Receive Stripe events (FR35)
**And** API secured with API keys and rate limiting
**And** HTTPS enforced (NFR14)
**And** deployed to cloud provider (Render, Railway, or Fly.io)

---

### Story 7.2: License Verification on App Startup

As a user,
I want my license verified automatically when I launch the app,
So that I can access features according to my subscription plan.

**Acceptance Criteria:**

**Given** app launches (FR35)
**When** license verification runs
**Then** license stored securely in:
  - macOS: Keychain (NFR13, PLATFORM-8)
  - Windows: Credential Manager (NFR13, PLATFORM-8)
**And** if online, license verified via backend API: `POST /license/verify { licenseKey }`
**And** API returns: `{ valid: true, plan: 'pro', expiresAt: '2025-12-31' }`
**And** license cached locally in SQLite `license_cache` table
**And** if offline, grace period checked (7 days) (FR40, NFR32)
**And** `grace_period_ends_at` compared to current time
**And** if within grace period, app functions normally
**And** if grace period expired (>7 days offline), warning modal:
  - "Connexion requise pour vérifier la licence"
  - "Dernière vérification: il y a 8 jours"
  - "Connectez-vous à Internet pour continuer." (FR41)
**And** after successful online verification, grace period reset (FR42)
**And** license store updated with current plan and expiry

---

### Story 7.3: Freemium Limitations & Enforcement

As a user on the free plan,
I want clear limitations on video length,
So that I understand what I need to upgrade for.

**Acceptance Criteria:**

**Given** user has free/freemium license (FR36)
**When** importing video
**Then** video duration checked
**And** if duration ≤ 30 minutes, import proceeds normally
**And** if duration > 30 minutes, error dialog displays:
  - "Limite freemium dépassée"
  - "Les utilisateurs gratuits peuvent traiter des vidéos jusqu'à 30 minutes."
  - "Cette vidéo dure 45 minutes."
  - "Passez à Splice Pro pour supprimer cette limite."
  - "Upgrade to Pro" button (links to upgrade flow)
  - "Cancel" button
**And** video not imported until upgraded
**And** transcription and editing work normally for videos ≤30min
**And** preview works normally for freemium users (FR25-FR28)
**And** export blocked for freemium users (FR37)

---

### Story 7.4: Export Blocker & Conversion Flow

As a freemium user,
I want to see a clear upgrade prompt when I try to export,
So that I understand the value of upgrading and can easily do so.

**Acceptance Criteria:**

**Given** freemium user completes preview and clicks "Export" (FR37, FR38)
**When** export attempted
**Then** export blocked with modal:
  - Title: "Export disponible uniquement pour Splice Pro"
  - Message: "Vous avez créé un montage parfait! Pour exporter votre vidéo, passez à Splice Pro."
  - Benefits list:
    - ✅ Export illimité en MP4 haute qualité
    - ✅ Vidéos jusqu'à 2h (pas de limite 30min)
    - ✅ Support prioritaire
    - ✅ Mises à jour incluses
  - Pricing: "19€/mois ou 99€/an"
  - "Upgrade to Pro" button (prominent, emerald green)
  - "Maybe Later" button (subtle)
**And** clicking "Upgrade to Pro" opens Stripe Checkout
**And** after successful payment, license upgraded immediately
**And** user can export without restarting app
**And** conversion message: "Bienvenue dans Splice Pro! Vous pouvez maintenant exporter." (FR38)

---

### Story 7.5: Early Adopter Codes & Lifetime Access

As a user with an early adopter code,
I want to activate my lifetime access,
So that I can use Splice Pro forever without subscription.

**Acceptance Criteria:**

**Given** user has early adopter code (FR39)
**When** app prompts for license
**Then** "Have an early adopter code?" link available
**And** clicking opens activation dialog:
  - "Enter your early adopter code"
  - Input field for code (format: SPLICE-XXXX-XXXX-XXXX)
  - "Activate" button
**And** on activation, code sent to backend: `POST /license/activate { code }`
**And** backend validates code is valid and unused
**And** if valid, license created with:
  - Plan: 'pro'
  - Status: 'active'
  - ExpiresAt: null (lifetime)
**And** license stored in Keychain/Credential Manager
**And** success message: "Code activé! Bienvenue dans Splice Pro - Accès lifetime."
**And** if invalid, error: "Code invalide ou déjà utilisé."
**And** early adopters treated as Pro users (no limits, no payment required)

---

## Epic 8: Reliable Auto-Updates

Les utilisateurs reçoivent automatiquement les mises à jour sans interruption de leur workflow.

### Story 8.1: Update Check & Background Download

As a user,
I want the app to check for updates automatically,
So that I always have the latest features and bug fixes without manual intervention.

**Acceptance Criteria:**

**Given** app launches or runs (FR45)
**When** update check runs
**Then** update server queried on startup: `GET /api/updates/latest?platform=macos&version=1.0.0`
**And** server responds with latest version info:
  ```json
  {
    "version": "1.1.0",
    "releaseDate": "2025-01-15",
    "downloadUrl": "https://updates.splice.app/v1.1.0/Splice-macos.dmg",
    "signature": "...",
    "changelog": "- Feature X\n- Bug fix Y"
  }
  ```
**And** if new version available, download starts in background silently (FR46)
**And** download progress tracked but doesn't block user
**And** downloaded update stored in temp directory
**And** signature verified before installation (NFR19)
**And** if signature invalid, update rejected and error logged
**And** update check fails gracefully if offline (no error shown)
**And** retry automatically when connection restored (NFR28)

---

### Story 8.2: Update Notification & Installation

As a user,
I want to be notified when an update is ready,
So that I can choose when to apply it without disrupting my work.

**Acceptance Criteria:**

**Given** update downloaded successfully (FR47)
**When** user is working
**Then** discrete notification badge appears in app:
  - Small green dot on app icon or menu
  - Tooltip: "Mise à jour disponible (v1.1.0)"
**And** clicking notification shows update details:
  - Version: 1.1.0
  - Release date: 15 janvier 2025
  - Changelog (formatted, readable)
  - "Install Now" button
  - "Install on Quit" button (default)
  - "Remind Me Later" button
**And** "Install Now" restarts app immediately and applies update
**And** "Install on Quit" applies update next time app closes (FR48)
**And** "Remind Me Later" dismisses for 24 hours
**And** update never interrupts active work (no forced restart)
**And** if user is exporting or transcribing, notification waits until idle

---

### Story 8.3: Rollback & Update Recovery

As a developer,
I want to implement update rollback capability,
So that users can recover if an update causes issues.

**Acceptance Criteria:**

**Given** update installed
**When** user launches updated version
**Then** previous version backed up before update applied
**And** backup stored in `~/.splice/backups/v1.0.0/`
**And** if new version crashes on startup (3+ consecutive crashes), automatic rollback triggered
**And** rollback restores previous version
**And** user sees message: "La mise à jour v1.1.0 a causé des problèmes. Version précédente restaurée."
**And** crash report sent to developers (opt-in)
**And** manual rollback option in settings: "Revert to previous version"
**And** only 1 previous version kept (to save disk space)

---

## Epic 9: Robust Error Handling & Recovery

Les utilisateurs peuvent récupérer de toute erreur sans perdre leur travail.

### Story 9.1: Graceful Network Error Handling

As a user,
I want the app to handle network failures gracefully,
So that I can continue working even when offline.

**Acceptance Criteria:**

**Given** network operations fail (FR52)
**When** Parakeet model download fails, license verification fails, or update check fails
**Then** app continues functioning without crashing
**And** for model download failure:
  - Retry automatically with exponential backoff (1s, 2s, 4s, 8s) (NFR28, FR53)
  - After 3 attempts, show error: "Échec du téléchargement. Vérifiez votre connexion."
  - "Retry" and "Cancel" buttons available
**And** for license verification failure:
  - Use cached license (grace period)
  - No error shown to user if within grace period
  - Retry silently in background
**And** for update check failure:
  - Fail silently (no popup)
  - Retry on next app launch
**And** user can continue working offline with all core features
**And** no stack traces shown to users (NFR30)

---

### Story 9.2: Auto-Save & Crash Recovery

As a user,
I want my work auto-saved frequently,
So that I don't lose progress if the app crashes or closes unexpectedly.

**Acceptance Criteria:**

**Given** user is working on a project (NFR25, NFR26, NFR27)
**When** edits are made
**Then** transcript selections auto-saved to SQLite every 30 seconds
**And** cut configurations auto-saved
**And** project state auto-saved (current position, zoom level, etc.)
**And** if app crashes, on restart:
  - Recovery dialog appears: "Splice s'est fermé de manière inattendue. Récupérer le projet en cours?"
  - "Recover Project" button (default)
  - "Start Fresh" button
**And** clicking "Recover" restores:
  - Last imported video
  - Complete transcript
  - All selections (highlighted text)
  - Generated cuts
  - Timeline position
**And** unsaved exports not lost (cuts still available for re-export)
**And** crash rate kept under 1% of sessions (NFR22)

---

### Story 9.3: Clear Error Messages & User Guidance

As a user,
I want to see clear, actionable error messages when something goes wrong,
So that I understand what happened and know how to fix it.

**Acceptance Criteria:**

**Given** an error occurs (FR51, FR54, NFR29, NFR30)
**When** displaying error to user
**Then** error messages are in French (NFR29)
**And** messages are clear and actionable, not technical:
  - ❌ Bad: "ENOENT: no such file or directory"
  - ✅ Good: "Fichier vidéo introuvable. Il a peut-être été déplacé ou supprimé."
**And** messages include suggested actions:
  - "Vérifiez que le fichier existe toujours."
  - "Assurez-vous d'avoir au moins 5GB d'espace disque disponible."
  - "Redémarrez l'application et réessayez."
**And** no stack traces shown to end users (NFR30)
**And** error dialog includes:
  - Icon (⚠️ warning or ❌ error)
  - Title summarizing issue
  - Description with details
  - Suggested actions (bullet list)
  - "Retry" button if applicable
  - "Close" button
  - "Copy Error Details" button (for support requests)
**And** all errors logged to local file for debugging (NFR21)

---

### Story 9.4: Disk Space & Resource Management

As a user,
I want to be warned if I'm running low on disk space,
So that I can free up space before exports fail.

**Acceptance Criteria:**

**Given** user is working with large video files (NFR24)
**When** disk space checked
**Then** before import, available space verified
**And** if available space < 3x video file size, warning shown:
  - "Espace disque faible"
  - "Votre disque dispose de 8 GB libres."
  - "Cette vidéo (15 GB) nécessite ~45 GB pour le traitement."
  - "Libérez de l'espace ou choisissez une vidéo plus petite."
**And** before export, space checked again
**And** temp files cleaned up after successful export
**And** "Clear Cache" option in settings removes old temp files
**And** user can configure temp directory location
**And** if app runs out of space mid-operation, graceful failure with clear message

---

## Epic 10: Accessibility & Inclusive Design

Tous les utilisateurs peuvent utiliser Splice avec keyboard navigation et screen readers (WCAG AA).

### Story 10.1: Keyboard Navigation Implementation

As a user who relies on keyboard,
I want to navigate and use all features without a mouse,
So that I can work efficiently with my preferred input method.

**Acceptance Criteria:**

**Given** WCAG 2.1 Level AA compliance required (UX-1, UX-4)
**When** user navigates with keyboard only
**Then** Tab/Shift+Tab cycles through all interactive elements in logical order:
  - Header navigation
  - Import button
  - Transcript editor
  - Timeline
  - Export controls
**And** focus indicators visible on all focused elements (UX-10):
  - `focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2`
  - High contrast, clearly visible
**And** Escape key closes modals and dialogs
**And** Arrow keys navigate within components:
  - Transcript: Up/Down = navigate paragraphs
  - Timeline: Left/Right = frame-by-frame or 5s jumps with Shift
**And** Space bar toggles play/pause in preview player
**And** Cmd+/ (Mac) or Ctrl+/ (Windows) opens keyboard shortcuts help modal
**And** all keyboard shortcuts documented in help
**And** no functionality requires mouse (all mouse actions have keyboard equivalent)

---

### Story 10.2: Screen Reader Support with ARIA

As a user with visual impairments,
I want to use Splice with a screen reader,
So that I can access all features through audio feedback.

**Acceptance Criteria:**

**Given** WCAG AA screen reader requirements (UX-5)
**When** using VoiceOver (macOS) or NVDA (Windows)
**Then** semantic HTML used throughout:
  - `<main>` for main content area
  - `<section>` for transcript, timeline, preview
  - `<nav>` for navigation
  - `<button>` for all clickable actions (never `<div onclick>`)
**And** ARIA labels on custom components:
  - Transcript: `role="document" aria-label="Video transcript"`
  - Timeline: `role="slider" aria-valuetext="Timecode 00:02:34"`
  - Progress bars: `role="progressbar" aria-valuenow={percent}`
  - Modals: `role="dialog" aria-modal="true"`
**And** dynamic content announced via ARIA live regions:
  - Selection changes: "3 segments selected, total duration 2 minutes 34 seconds"
  - Progress updates: "Transcription 45% complete"
  - Success/error toasts: `aria-live="polite"` or `aria-live="assertive"`
**And** screen reader testing done with VoiceOver (primary) and NVDA (secondary)
**And** all images have alt text
**And** all form inputs have associated labels

---

### Story 10.3: High Contrast & Color Independence

As a user with color vision deficiency,
I want the interface to be usable without relying on color alone,
So that I can distinguish all UI states and actions.

**Acceptance Criteria:**

**Given** WCAG AA color requirements (UX-1, UX-7)
**When** viewing interface
**Then** all text meets WCAG AA contrast ratios:
  - Normal text (16px): Minimum 4.5:1 contrast
  - Large text (18px+): Minimum 3:1 contrast
  - UI components: Minimum 3:1 contrast
**And** color never used alone to convey information (UX-7):
  - Selected text: Color + border + icon
  - Timeline segments: Color + pattern (solid vs dashed)
  - Error states: Red + icon + text
  - Success states: Green + checkmark + text
**And** verified with WebAIM Contrast Checker
**And** tested with browser "Emulate vision deficiencies" (Protanopia, Deuteranopia, Tritanopia)
**And** interface usable in grayscale mode
**And** high contrast mode supported (`prefers-contrast: high` media query)

---

### Story 10.4: Responsive Text & Scalability

As a user who needs larger text,
I want the interface to scale properly when I zoom,
So that I can read all content comfortably.

**Acceptance Criteria:**

**Given** WCAG AA scalability requirements (UX-9)
**When** user zooms interface
**Then** all font sizes defined in `rem` units (not `px`)
**And** layout tested up to 200% zoom without breaking
**And** text remains readable at 200% zoom
**And** no horizontal scrolling required at 200% zoom (content reflows)
**And** minimum font size is 14px (0.875rem)
**And** optimal base font size is 16px (1rem)
**And** line height minimum 1.5 for body text
**And** spacing between interactive elements sufficient (8px minimum)
**And** responsive breakpoints work correctly with zoom
**And** touch targets remain 44x44px minimum at all zoom levels (UX-6)
