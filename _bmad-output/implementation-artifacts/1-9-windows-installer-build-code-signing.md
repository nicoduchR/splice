# Story 1.9: Windows Installer Build & Code Signing

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que développeur,
Je veux construire et signer un installateur Windows,
Afin que les utilisateurs sur Windows 10/11 puissent installer Splice sans avertissements SmartScreen.

## Acceptance Criteria

**Given** le développement est prêt pour la distribution (FR44, PLATFORM-2, PLATFORM-4)
**When** construction pour Windows production
**Then** `tauri build` configuré pour Windows x86_64
**And** `tauri.conf.json` inclut les paramètres bundle Windows:
  - App name: "Splice"
  - Minimum OS version: Windows 10 22H2, Windows 11
**And** certificat Windows code signing configuré (NFR18)
**And** installateur signé avec certificat pour éviter les avertissements SmartScreen
**And** `.msi` ou `.exe` installer créé
**And** installateur inclut option d'ajouter raccourci bureau
**And** app se désinstalle proprement (supprime données dans `%APPDATA%/splice/`)
**And** les builds sont stockés dans `apps/desktop/src-tauri/target/release/bundle/msi/` ou `/nsis/`

## Tasks / Subtasks

- [ ] Configurer tauri.conf.json pour Windows x86_64 (AC: tauri build configured)
  - [ ] Ajouter "msi" aux bundle targets
  - [ ] Définir productName "Splice" (déjà fait)
  - [ ] Configurer bundle.windows section avec digestAlgorithm: "sha256"
  - [ ] Vérifier icon.ico existe dans icons/ (déjà présent)
  - [ ] Tester configuration: pnpm tauri build --target x86_64-pc-windows-msvc (local ou CI)

- [ ] Télécharger et bundler FFmpeg pour Windows x86_64 (AC: FFmpeg bundled)
  - [ ] Télécharger ffmpeg-x86_64-pc-windows-msvc depuis eugeneware/ffmpeg-static ou source alternative
  - [ ] Télécharger ffprobe-x86_64-pc-windows-msvc depuis eugeneware/ffmpeg-static ou source alternative
  - [ ] Placer binaries dans apps/desktop/src-tauri/binaries/
  - [ ] Vérifier externalBin dans tauri.conf.json pointe vers binaries/ (utilise suffixes Tauri auto)
  - [ ] Tester détection et exécution FFmpeg dans app Windows

- [ ] Configurer Windows Code Signing Certificate (AC: certificate configured)
  - [ ] Obtenir certificat Authenticode depuis autorité certifiée (DigiCert, Sectigo, GlobalSign) - documentation fournie
  - [ ] Exporter certificat au format .pfx avec mot de passe
  - [ ] Configurer GitHub Secrets: WINDOWS_CERTIFICATE (Base64), WINDOWS_CERTIFICATE_PASSWORD
  - [ ] Créer script code-sign-windows.ps1 pour automation
  - [ ] Tester signature locale: signtool sign (script prêt, nécessite certificat utilisateur)

- [ ] Créer build script et CI/CD workflow (AC: builds automation)
  - [ ] Créer .github/workflows/build-windows.yml
  - [ ] Configurer runner windows-latest
  - [ ] Setup Rust target x86_64-pc-windows-msvc
  - [ ] Intégrer bundle FFmpeg step (PowerShell script)
  - [ ] Intégrer code signing step (PowerShell script)
  - [ ] Configurer upload artifacts vers GitHub Releases
  - [ ] Créer script local scripts/build-windows.ps1 ou .sh

- [ ] Build et test .msi installer local (AC: .msi created, app runs)
  - [ ] Setup Rust target: rustup target add x86_64-pc-windows-msvc (local ou CI)
  - [ ] Build: pnpm tauri build --target x86_64-pc-windows-msvc
  - [ ] Vérifier .msi créé dans src-tauri/target/release/bundle/msi/
  - [ ] Tester installation .msi sur Windows 10 (ready to test when built)
  - [ ] Tester installation .msi sur Windows 11 (ready to test when built)
  - [ ] Vérifier raccourci bureau créé (si configuré)
  - [ ] Vérifier désinstallation propre (supprime %APPDATA%/splice/)

- [ ] Valider signature et SmartScreen acceptance (AC: no SmartScreen warnings)
  - [ ] Signer .msi avec certificat: signtool sign
  - [ ] Vérifier signature: signtool verify /pa installer.msi
  - [ ] Tester installation depuis .msi téléchargé (sans signature: warning attendu)
  - [ ] Tester installation .msi signé (avec certificat: pas de warning critique)
  - [ ] Vérifier premier launch sans erreurs critiques
  - [ ] Documenter process dans README (docs/WINDOWS_BUILD_CODESIGN.md créé)

## Dev Notes

### Architecture Context - Windows Distribution Strategy

Cette story implémente la **distribution Windows professionnelle** pour Splice, permettant aux utilisateurs d'installer l'application sans avertissements SmartScreen. C'est la story miroir de Story 1.8 (macOS), complétant la stratégie multi-plateforme.

**Décision: .MSI Installer pour compatibilité maximale**
[Source: Architecture PLATFORM-2, PLATFORM-4, Epic 1 Story 1.9]

**Rationale:** Le format .MSI (Microsoft Installer) est le standard entreprise Windows, supportant:
- Installations silencieuses via CLI (`msiexec /i installer.msi /quiet`)
- Intégration système complète (Start Menu, desktop shortcuts, uninstall)
- Déploiement via Group Policy Object (GPO) pour entreprises
- Code signing natif avec Authenticode

**Alternative considérée:**
- **.EXE portable (NSIS):** Plus léger et rapide, mais moins d'intégration système
- **Rejeté car:** Les utilisateurs professionnels (target de Splice) préfèrent installateurs .MSI standards

**Implications NFR:**
- **NFR18:** App signée avec certificat Authenticode (éviter warnings SmartScreen)
- **PLATFORM-2:** Windows 10 22H2+ et Windows 11, architecture x86_64 uniquement
- **PLATFORM-4:** Code signing obligatoire pour distribution publique

### Technical Requirements - Tauri Configuration

**1. Configuration tauri.conf.json (Priorité Critique)**
[Source: apps/desktop/src-tauri/tauri.conf.json, Story 1.8 Pattern]

**Configuration actuelle (macOS uniquement):**
```json
{
  "productName": "Splice",
  "version": "0.1.0",
  "identifier": "com.splice.app",
  "bundle": {
    "active": true,
    "targets": ["dmg", "app"],  // AJOUTER: "msi"
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"  // DÉJÀ PRÉSENT pour Windows!
    ],
    "externalBin": [
      "binaries/ffmpeg",  // Tauri ajoute automatiquement suffixes -x86_64-pc-windows-msvc.exe
      "binaries/ffprobe"
    ],
    "macOS": { /* ... */ }
  }
}
```

**Modifications requises pour Story 1.9:**

```json
{
  "bundle": {
    "targets": ["dmg", "app", "msi"],  // AJOUTER "msi"

    // NOUVELLE SECTION: Configuration Windows spécifique
    "windows": {
      "certificateThumbprint": null,  // Optionnel: thumbprint du certificat dans cert store
      "digestAlgorithm": "sha256",    // Algorithme signature (SHA-256 standard)
      "timestampUrl": "",             // URL serveur timestamp (optionnel, fourni par CA)
      "wix": {
        "language": "en-US",          // Langue installer
        "template": null,              // Template WiX custom (optionnel)
        "fragmentPaths": [],           // Fragments WiX additionnels (optionnel)
        "componentRefs": [],           // Références composants WiX (optionnel)
        "featureIds": [],              // Features WiX (optionnel)
        "mergeRefs": [],               // Merge modules (optionnel)
        "skipWebView Install": false,  // Skip WebView2 bundling (false par défaut)
        "enableElevatedUpdateRuntime": false  // Require admin for updates (false par défaut)
      }
    }
  }
}
```

**IMPORTANT: Naming Convention FFmpeg**
[Source: Story 1.8 Dev Notes, commit fe047fc "revert externalBin to base names"]

⚠️ **Tauri 2.x gère automatiquement les suffixes de plateforme!**

- **Configuration dans tauri.conf.json:** `"binaries/ffmpeg"` et `"binaries/ffprobe"` (sans extension)
- **Fichiers physiques Windows:** `binaries/ffmpeg-x86_64-pc-windows-msvc.exe` et `binaries/ffprobe-x86_64-pc-windows-msvc.exe`
- **Tauri détecte automatiquement la plateforme au build et ajoute le bon suffixe**
- **NE PAS modifier externalBin** - garder `"binaries/ffmpeg"` et `"binaries/ffprobe"` tel quel

**2. FFmpeg Binaries Windows Setup**
[Source: Architecture Cross-Cutting NFR33, Story 1.8 bundle-ffmpeg.sh pattern]

**Téléchargement FFmpeg pour Windows x86_64:**

**Sources recommandées (par ordre de préférence):**

1. **eugeneware/ffmpeg-static (Recommandé - utilisé pour macOS)**
   - GitHub: https://github.com/eugeneware/ffmpeg-static
   - Release: https://github.com/eugeneware/ffmpeg-static/releases/tag/b6.1.1
   - Fichiers:
     - `ffmpeg-win32-x64` (ffmpeg.exe)
     - `ffprobe-win32-x64` (ffprobe.exe)

2. **BtbN/FFmpeg-Builds (Alternative - builds plus récents)**
   - GitHub: https://github.com/BtbN/FFmpeg-Builds
   - URL: https://github.com/BtbN/FFmpeg-Builds/releases
   - Chercher: `ffmpeg-master-latest-win64-gpl.zip`

**Script PowerShell de téléchargement (à créer: scripts/bundle-ffmpeg-windows.ps1):**

```powershell
# Bundle FFmpeg binaries for Windows x86_64
# Story 1.9 - Windows Installer Build & Code Signing

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BinariesDir = Join-Path $ScriptDir ".." "apps" "desktop" "src-tauri" "binaries"

Write-Host "📦 Bundling FFmpeg binaries for Windows x86_64..."

# Create binaries directory if not exists
New-Item -ItemType Directory -Force -Path $BinariesDir | Out-Null
Set-Location $BinariesDir

# Download from eugeneware/ffmpeg-static
Write-Host "📥 Downloading FFmpeg from eugeneware/ffmpeg-static..."
$BaseUrl = "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1"

Invoke-WebRequest -Uri "$BaseUrl/ffmpeg-win32-x64.exe" -OutFile "ffmpeg-x86_64-pc-windows-msvc.exe"
Invoke-WebRequest -Uri "$BaseUrl/ffprobe-win32-x64.exe" -OutFile "ffprobe-x86_64-pc-windows-msvc.exe"

Write-Host "✅ FFmpeg binaries downloaded successfully!"
Write-Host "   - ffmpeg-x86_64-pc-windows-msvc.exe ($(((Get-Item ffmpeg-x86_64-pc-windows-msvc.exe).Length / 1MB).ToString('0.0')) MB)"
Write-Host "   - ffprobe-x86_64-pc-windows-msvc.exe ($(((Get-Item ffprobe-x86_64-pc-windows-msvc.exe).Length / 1MB).ToString('0.0')) MB)"
```

**CRITICAL:** Vérifier que les binaries téléchargés sont bien des exécutables Windows (.exe) et non des archives (.zip). Si archives, extraire d'abord.

**3. Windows Code Signing Certificate Setup**
[Source: Architecture Security NFR18, PLATFORM-4]

**Prérequis:**
- Certificat Authenticode d'une autorité certifiée reconnue
- Coût: ~100-300€/an selon l'autorité
- Formats: .pfx ou .p12 avec mot de passe

**Autorités certifiées recommandées:**
1. **DigiCert** - https://www.digicert.com/code-signing
   - Le plus réputé, reconnu par Microsoft
   - ~$300-400/an

2. **Sectigo (ex-Comodo)** - https://sectigo.com/ssl-certificates-tls/code-signing
   - Bon rapport qualité/prix
   - ~$100-200/an

3. **GlobalSign** - https://www.globalsign.com/en/code-signing-certificate
   - Alternative reconnue
   - ~$200-300/an

**Types de certificats:**
- **Standard Authenticode:** Validation Organization (OV) - Livraison immédiate
- **EV Code Signing:** Extended Validation - Plus cher, meilleure réputation SmartScreen, nécessite clé matérielle (token USB)

**Recommandation Story 1.9:** Certificat **Standard OV** pour MVP, envisager EV si budget le permet.

**Étapes Certificate Setup (Local Development):**

**a) Obtenir le certificat:**
```bash
# 1. Acheter certificat auprès de l'autorité choisie
# 2. Compléter validation organisation (email, documents légaux)
# 3. Télécharger certificat au format .pfx ou .p12
# 4. Sauvegarder mot de passe du certificat de manière sécurisée
```

**b) Tester signature locale (Windows uniquement):**

**Prérequis:** Windows SDK installé (contient signtool.exe)
```powershell
# Installer Windows SDK si nécessaire
# URL: https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/

# Localisation signtool.exe (varie selon version SDK):
$SignToolPath = "C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64\signtool.exe"

# Signer un fichier test
& $SignToolPath sign `
  /f "path\to\certificate.pfx" `
  /p "CERTIFICATE_PASSWORD" `
  /t "http://timestamp.digicert.com" `
  /d "Splice" `
  /du "https://splice.app" `
  "path\to\file.msi"

# Vérifier signature
& $SignToolPath verify /pa "path\to\file.msi"
# Output attendu: "Successfully verified: path\to\file.msi"
```

**c) Exporter Certificate pour CI/CD (GitHub Secrets):**

```powershell
# 1. Le certificat .pfx est déjà au bon format pour CI/CD
# 2. Encoder en Base64 pour GitHub Secret

$CertPath = "C:\path\to\certificate.pfx"
$Base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($CertPath))
$Base64 | Out-File -FilePath "certificate-base64.txt" -Encoding ASCII

# 3. Copier contenu de certificate-base64.txt
# 4. Ajouter à GitHub Secrets comme WINDOWS_CERTIFICATE
```

**GitHub Secrets requis:**
| Secret Name | Description | Comment obtenir |
|-------------|-------------|-----------------|
| `WINDOWS_CERTIFICATE` | Certificat .pfx encodé Base64 | Encoder .pfx avec PowerShell script ci-dessus |
| `WINDOWS_CERTIFICATE_PASSWORD` | Mot de passe du certificat | Défini lors de l'achat/téléchargement |
| `TIMESTAMP_URL` | URL serveur timestamp (optionnel) | Fourni par CA (ex: http://timestamp.digicert.com) |

**4. Windows Installer (.MSI) via WiX Toolset**
[Source: Tauri 2.x Documentation, Windows Bundle Configuration]

**Qu'est-ce que WiX?**
WiX (Windows Installer XML) est le toolset Microsoft pour créer des installateurs .msi. Tauri 2.x l'utilise automatiquement pour générer le .msi.

**Configuration WiX dans tauri.conf.json:**

```json
"windows": {
  "wix": {
    "language": "en-US",  // Langue de l'installer (en-US, fr-FR, etc.)
    "template": null,      // Template WiX custom (laisser null pour template par défaut)

    // Desktop shortcut (optionnel - à ajouter si AC demande)
    "fragmentPaths": ["wix/desktop-shortcut.wxs"],  // Fragment WiX pour raccourci bureau

    // Uninstall cleanup (optionnel - à configurer si AC demande nettoyage %APPDATA%)
    "componentRefs": ["CleanupAppData"]  // Référence composant cleanup
  }
}
```

**Custom WiX Fragment pour Desktop Shortcut (optionnel):**

Si AC demande "raccourci bureau", créer `apps/desktop/src-tauri/wix/desktop-shortcut.wxs`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <Fragment>
    <DirectoryRef Id="DesktopFolder">
      <Component Id="DesktopShortcut" Guid="*">
        <Shortcut Id="DesktopShortcut"
                  Name="Splice"
                  Target="[INSTALLDIR]Splice.exe"
                  WorkingDirectory="INSTALLDIR"
                  Icon="ProductIcon"
                  IconIndex="0"
                  Description="Splice - Video Editing for Content Creators" />
        <RegistryValue Root="HKCU"
                       Key="Software\Splice\Shortcuts"
                       Name="Desktop"
                       Type="integer"
                       Value="1"
                       KeyPath="yes" />
      </Component>
    </DirectoryRef>
  </Fragment>
</Wix>
```

**IMPORTANT:** Pour MVP Story 1.9, **laisser configuration WiX par défaut** sauf si AC explicitement demandé. Tauri génère un .msi fonctionnel automatiquement.

