# Project Scoping & Phased Development

## MVP Strategy & Philosophy

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

## MVP Feature Set (Phase 1)

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

## Post-MVP Features

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

## Risk Mitigation Strategy

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
