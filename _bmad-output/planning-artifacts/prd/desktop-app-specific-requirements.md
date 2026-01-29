# Desktop App Specific Requirements

## Project-Type Overview

Splice est une application desktop native cross-platform construite avec **Tauri** (Rust + Web frontend). Architecture hybride:
- **Backend Rust:** traitement vidéo intensif, inférence ML locale (Parakeet), découpage, gestion fichiers volumineux
- **Frontend web:** HTML/CSS/TypeScript, exploitant compétences existantes
- **Bridge Tauri:** communication optimisée frontend/backend

Avantages: développement web (rapidité, flexibilité UI) + performance native Rust pour opérations critiques.

## Technical Architecture Considerations

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

## Platform Support

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

## System Integration

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

## Update Strategy

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

## Offline Capabilities

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

## Implementation Considerations

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
