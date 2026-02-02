# Executive Summary

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
