# macOS Universal Binary Build & Code Signing Guide

Guide complet pour construire, signer et notariser Splice pour macOS.

**Story 1.8** - Configuration initiale implémentée
**Date:** 2026-01-31
**Architecture supportée:** Universal Binary (Apple Silicon arm64 + Intel x86_64)
**Système minimum:** macOS 13.0 Ventura

---

## Table des matières

1. [Prérequis](#prérequis)
2. [Configuration locale](#configuration-locale)
3. [Build sans signature](#build-sans-signature)
4. [Code Signing (Signature)](#code-signing-signature)
5. [Notarization Apple](#notarization-apple)
6. [CI/CD avec GitHub Actions](#cicd-avec-github-actions)
7. [Troubleshooting](#troubleshooting)

---

## Prérequis

### Développement local

- **macOS** 13.0 Ventura ou supérieur
- **Xcode Command Line Tools:**
  ```bash
  xcode-select --install
  ```
- **Node.js** 20+ et **pnpm** 8+
- **Rust** avec targets:
  ```bash
  rustup target add aarch64-apple-darwin
  rustup target add x86_64-apple-darwin
  ```

### Pour Code Signing & Notarization

- **Apple Developer Program** membership ($99/an)
- **Developer ID Application Certificate** installé dans Keychain
- **App-Specific Password** pour notarization (généré sur appleid.apple.com)

---

## Configuration locale

### 1. Installer les dépendances

```bash
# Depuis la racine du projet
pnpm install
```

### 2. Bundler les binaires FFmpeg

```bash
./scripts/bundle-ffmpeg.sh
```

Ce script télécharge automatiquement les binaries FFmpeg pour:
- Apple Silicon (arm64)
- Intel (x86_64)

---

## Build sans signature

Pour développer et tester localement sans signature:

```bash
# Build Universal Binary (recommandé)
./scripts/build-macos.sh

# Ou avec pnpm directement
pnpm tauri build --target universal-apple-darwin

# Build Apple Silicon uniquement
pnpm tauri build --target aarch64-apple-darwin

# Build Intel uniquement
pnpm tauri build --target x86_64-apple-darwin
```

**Sortie:**
- App bundle: `apps/desktop/src-tauri/target/release/bundle/macos/Splice.app`
- DMG installer: `apps/desktop/src-tauri/target/release/bundle/dmg/Splice_*.dmg`

⚠️ **Note:** L'app non signée affichera un avertissement Gatekeeper à l'installation.

---

## Code Signing (Signature)

### Configuration du certificat

1. **Créer Developer ID Application Certificate:**
   - Ouvrir Xcode → Preferences → Accounts
   - Ajouter Apple ID du compte Developer
   - Manage Certificates → Create "Developer ID Application"

2. **Vérifier le certificat:**
   ```bash
   security find-identity -v -p codesigning
   # Devrait afficher: "Developer ID Application: YOUR_NAME (TEAM_ID)"
   ```

### Signer l'app

```bash
# Build et signature automatique
./scripts/build-macos.sh --sign

# Ou signature manuelle
./scripts/code-sign.sh macos
```

### Vérifier la signature

```bash
APP_PATH="apps/desktop/src-tauri/target/release/bundle/macos/Splice.app"

# Vérifier signature
codesign --verify --deep --strict "$APP_PATH"

# Afficher détails signature
codesign -dv --verbose=4 "$APP_PATH"
```

---

## Notarization Apple

La notarization est **obligatoire** pour éviter les avertissements Gatekeeper sur macOS 10.15+.

### 1. Configurer les credentials

```bash
# Générer App-Specific Password sur https://appleid.apple.com/account/manage
export APPLE_ID="your@email.com"
export APPLE_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="ABCD123456"  # Team ID depuis Apple Developer
```

### 2. Build, signer et notariser

```bash
./scripts/build-macos.sh --notarize
```

Ce script:
1. Build l'app Universal Binary
2. Signe avec Developer ID
3. Submit pour notarization Apple
4. Attend l'approval (5-15 minutes)
5. Staple le ticket de notarization
6. Vérifie Gatekeeper acceptance

### 3. Vérifier la notarization

```bash
APP_PATH="apps/desktop/src-tauri/target/release/bundle/macos/Splice.app"

# Vérifier Gatekeeper
spctl --assess --verbose "$APP_PATH"
# Output attendu: "Splice.app: accepted"
#                 "source=Notarized Developer ID"

# Vérifier ticket stapled
stapler validate "$APP_PATH"
```

---

## CI/CD avec GitHub Actions

### Configuration des secrets

Dans GitHub repository settings → Secrets and variables → Actions, ajouter:

| Secret | Description | Obtention |
|--------|-------------|-----------|
| `APPLE_CERTIFICATE` | Certificat P12 encodé Base64 | Export depuis Keychain, encoder avec `base64` |
| `APPLE_CERTIFICATE_PASSWORD` | Mot de passe certificat P12 | Défini lors de l'export |
| `APPLE_ID` | Email Apple Developer | Compte Apple Developer |
| `APPLE_APP_PASSWORD` | App-Specific Password | https://appleid.apple.com/account/manage |
| `APPLE_TEAM_ID` | Team ID (10 caractères) | Apple Developer Account → Membership |

### Exporter le certificat pour CI/CD

```bash
# 1. Ouvrir Keychain Access
# 2. Rechercher "Developer ID Application"
# 3. Right-click → Export "Developer ID Application: YOUR_NAME"
# 4. Format: Personal Information Exchange (.p12)
# 5. Mot de passe: SECURE_PASSWORD

# 6. Encoder en Base64
base64 -i apple-certificate.p12 -o apple-certificate-base64.txt

# 7. Copier contenu de apple-certificate-base64.txt dans GitHub Secret APPLE_CERTIFICATE
```

### Déclencher le workflow

Le workflow `.github/workflows/build-macos.yml` se déclenche:

1. **Sur tag version:**
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

2. **Manuellement via GitHub Actions UI:**
   - Aller dans Actions → Build macOS → Run workflow

### Résultats

Le workflow produit:
- ✅ Universal Binary signé et notarisé
- ✅ DMG uploadé dans Artifacts
- ✅ GitHub Release (draft) si tag version

---

## Troubleshooting

### Erreur: "No Developer ID Application certificate found"

**Solution:**
```bash
# Vérifier certificats installés
security find-identity -v -p codesigning

# Si absent, créer via Xcode (voir section Code Signing)
```

### Erreur: "Notarization failed"

**Diagnostic:**
```bash
# Obtenir submission ID depuis output notarytool
# Puis récupérer logs:
xcrun notarytool log <submission-id> \
  --apple-id "$APPLE_ID" \
  --password "$APPLE_APP_PASSWORD" \
  --team-id "$APPLE_TEAM_ID"
```

**Causes communes:**
- Certificat expiré ou invalide
- App non signée correctement
- Hardened Runtime désactivé
- Entitlements manquants

### Erreur: "Resource fork, Finder information, or similar detritus not allowed"

**Solution:**
```bash
# Nettoyer extended attributes avant signature
xattr -cr apps/desktop/src-tauri/target/release/bundle/macos/Splice.app
```

### Build Universal Binary ne contient qu'une architecture

**Vérification:**
```bash
lipo -info apps/desktop/src-tauri/target/release/bundle/macos/Splice.app/Contents/MacOS/splice
# Attendu: "Architectures in the fat file: x86_64 arm64"
```

**Solution:**
Assurer que les targets Rust sont installés:
```bash
rustup target add aarch64-apple-darwin x86_64-apple-darwin
```

### FFmpeg binary manquant ou mauvaise architecture

**Vérification:**
```bash
cd apps/desktop/src-tauri/binaries
ls -lh ffmpeg-* ffprobe-*
lipo -info ffmpeg-aarch64-apple-darwin
lipo -info ffmpeg-x86_64-apple-darwin
```

**Solution:**
```bash
./scripts/bundle-ffmpeg.sh
```

---

## Références

- [Tauri 2.0 Build Guide](https://tauri.app/v2/guides/building/)
- [Apple Code Signing Documentation](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [notarytool Guide](https://developer.apple.com/documentation/technotes/tn3147-migrating-to-the-latest-notarization-tool)
- [eugeneware/ffmpeg-static](https://github.com/eugeneware/ffmpeg-static)

---

## Support

Pour questions ou problèmes:
1. Consulter cette documentation
2. Vérifier les logs de build (`pnpm tauri build --verbose`)
3. Consulter les issues GitHub du projet
