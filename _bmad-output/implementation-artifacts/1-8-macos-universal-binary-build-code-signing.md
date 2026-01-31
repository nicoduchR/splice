# Story 1.8: macOS Universal Binary Build & Code Signing

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que développeur,
Je veux construire et signer un Universal Binary macOS,
Afin que les utilisateurs sur Mac Intel et Apple Silicon puissent installer et exécuter Splice sans avertissements de sécurité.

## Acceptance Criteria

**Given** le développement est prêt pour la distribution (FR43, PLATFORM-1, PLATFORM-3)
**When** construction pour macOS production
**Then** `tauri build` configuré pour Universal Binary (x86_64 + aarch64)
**And** `tauri.conf.json` inclut les paramètres bundle macOS:
  - App name: "Splice"
  - Bundle identifier: "com.splice.app"
  - Minimum OS version: macOS 13.0 Ventura
**And** certificat Apple Developer configuré pour code signing (NFR17)
**And** app signée avec certificat Developer ID Application
**And** app notarisée via le service de notarisation Apple
**And** le fichier `.dmg` résultant est installable sans avertissements Gatekeeper
**And** l'app fonctionne sur Mac Intel et Apple Silicon
**And** les builds sont stockés dans `src-tauri/target/release/bundle/dmg/`

## Tasks / Subtasks

- [ ] Configurer tauri.conf.json pour macOS Universal Binary (AC: tauri build configured)
  - [ ] Vérifier bundle identifier "com.splice.app"
  - [ ] Définir productName "Splice"
  - [ ] Configurer minimumSystemVersion "13.0"
  - [ ] Vérifier externalBin pour FFmpeg binaries (aarch64 + x86_64)
  - [ ] Configurer icône .icns pour macOS

- [ ] Télécharger et bundler FFmpeg pour les deux architectures (AC: externalBin configured)
  - [ ] Télécharger ffmpeg-aarch64-apple-darwin depuis evermeet.cx
  - [ ] Télécharger ffprobe-aarch64-apple-darwin depuis evermeet.cx
  - [ ] Télécharger ffmpeg-x86_64-apple-darwin depuis evermeet.cx
  - [ ] Télécharger ffprobe-x86_64-apple-darwin depuis evermeet.cx
  - [ ] Placer binaries dans src-tauri/binaries/
  - [ ] chmod +x sur tous les binaries
  - [ ] Tester détection architecture avec Tauri resource API

- [ ] Configurer Apple Developer Certificate (AC: Developer ID Application configured)
  - [ ] Obtenir Developer ID Application certificate depuis Apple Developer
  - [ ] Installer certificate dans Keychain (développement local)
  - [ ] Configurer GitHub Secrets pour CI/CD: APPLE_CERTIFICATE, APPLE_CERTIFICATE_PASSWORD
  - [ ] Créer script code-sign.sh pour automation
  - [ ] Tester signature locale avec codesign --verify

- [ ] Configurer Apple Notarization (AC: app notarized)
  - [ ] Obtenir App-Specific Password ou API Key depuis Apple Developer
  - [ ] Configurer GitHub Secrets: APPLE_ID, APPLE_TEAM_ID, APPLE_APP_PASSWORD
  - [ ] Intégrer notarytool dans build process
  - [ ] Tester notarization locale avec xcrun notarytool submit
  - [ ] Stapler notarization ticket avec xcrun stapler staple

- [ ] Créer build script et CI/CD workflow (AC: builds automation)
  - [ ] Créer .github/workflows/build-macos.yml
  - [ ] Configurer matrix build: [aarch64-apple-darwin, x86_64-apple-darwin]
  - [ ] Intégrer code signing step
  - [ ] Intégrer notarization step
  - [ ] Configurer upload artifacts vers GitHub Releases
  - [ ] Créer script local scripts/build-macos.sh

- [ ] Build et test Universal Binary local (AC: app runs on both architectures)
  - [ ] Build pour aarch64: pnpm tauri build --target aarch64-apple-darwin
  - [ ] Build pour x86_64: pnpm tauri build --target x86_64-apple-darwin
  - [ ] Créer Universal Binary avec lipo (optionnel si Tauri le fait)
  - [ ] Tester .dmg installation sur Mac Apple Silicon
  - [ ] Tester .dmg installation sur Mac Intel (si disponible)
  - [ ] Vérifier absence warnings Gatekeeper

- [ ] Valider signature et notarization (AC: no Gatekeeper warnings)
  - [ ] Vérifier signature: codesign --verify --deep --strict Splice.app
  - [ ] Vérifier notarization: spctl --assess --verbose Splice.app
  - [ ] Tester installation depuis .dmg téléchargé (pas local build)
  - [ ] Vérifier premier launch sans warnings
  - [ ] Documenter process dans README

## Dev Notes

