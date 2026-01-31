# Configuration Apple Developer pour Splice

Guide complet pour configurer le code signing et la notarization macOS avec ton compte Apple Developer.

**Prérequis:** Compte Apple Developer Program actif ($99/an)

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Étape 1: Créer le certificat Developer ID](#étape-1-créer-le-certificat-developer-id)
3. [Étape 2: Créer un App-Specific Password](#étape-2-créer-un-app-specific-password)
4. [Étape 3: Récupérer le Team ID](#étape-3-récupérer-le-team-id)
5. [Étape 4: Configurer les credentials localement](#étape-4-configurer-les-credentials-localement)
6. [Étape 5: Premier build avec signature](#étape-5-premier-build-avec-signature)
7. [Étape 6: Build complet avec notarization](#étape-6-build-complet-avec-notarization)
8. [Étape 7: Tester l'installation](#étape-7-tester-linstallation)
9. [Étape 8: Configurer GitHub Actions (CI/CD)](#étape-8-configurer-github-actions-cicd)
10. [Troubleshooting](#troubleshooting)

---

## Vue d'ensemble

### Pourquoi code signing et notarization?

Depuis macOS 10.15 Catalina, Apple impose:
- **Code Signing:** Garantir que l'app n'a pas été modifiée depuis sa signature
- **Notarization:** Scan de sécurité Apple pour détecter malware

**Sans ces étapes:** Les utilisateurs verront un warning Gatekeeper:
> "Splice cannot be opened because the developer cannot be verified"

### Ce que tu vas configurer

1. **Developer ID Application Certificate** - Pour signer l'app
2. **App-Specific Password** - Pour soumettre l'app à Apple pour notarization
3. **Team ID** - Identifiant de ton équipe Apple Developer
4. **Variables d'environnement** - Pour automatiser le processus

### Temps estimé

- Setup initial: **15-20 minutes**
- Build avec notarization: **15-20 minutes** (dont 10-15 min d'attente Apple)

---

## Étape 1: Créer le certificat Developer ID

### Prérequis

```bash
# Vérifier que Xcode Command Line Tools sont installés
xcode-select --version

# Si pas installé:
xcode-select --install
```

### Créer le certificat

**Option A: Via Xcode (Recommandé)**

1. Ouvre Xcode (ou juste les Preferences si tu ne veux pas installer tout Xcode)
2. Menu: **Xcode** → **Settings...** (ou **Preferences** sur versions anciennes)
3. Onglet **Accounts**
4. Clique le **+** en bas à gauche → **Add Apple ID...**
5. Entre ton **Apple ID** (celui de ton compte Developer)
6. Sélectionne ton **Team** dans la liste
7. Clique **Manage Certificates...**
8. Clique le **+** en bas à gauche
9. Sélectionne **Developer ID Application**
10. Le certificat est créé et installé automatiquement dans ton Keychain

**Option B: Via developer.apple.com (Alternative)**

1. Va sur https://developer.apple.com/account/resources/certificates/list
2. Clique le **+** pour créer un certificat
3. Sélectionne **Developer ID Application**
4. Suis les instructions pour générer un CSR (Certificate Signing Request)
5. Télécharge le certificat et double-clique pour l'installer

### Vérifier l'installation

```bash
# Liste les certificats de code signing
security find-identity -v -p codesigning

# Tu devrais voir une ligne comme:
# 1) ABC123DEF456... "Developer ID Application: TON NOM (TEAM_ID)"
#    1 valid identities found
```

**Si tu vois ton certificat:** ✅ Étape 1 terminée!

---

## Étape 2: Créer un App-Specific Password

Apple ne permet pas d'utiliser ton mot de passe principal pour la notarization. Tu dois créer un "App-Specific Password".

### Générer le mot de passe

1. Va sur https://appleid.apple.com/account/manage
2. Connecte-toi avec ton Apple ID
3. Section **Sign-In and Security**
4. Trouve **App-Specific Passwords**
5. Clique le **+** ou **Generate Password...**
6. Label: `Splice Notarization` (ou ce que tu veux)
7. Clique **Create**
8. **COPIE le mot de passe affiché** (format: `xxxx-xxxx-xxxx-xxxx`)

⚠️ **IMPORTANT:** Ce mot de passe ne sera affiché qu'UNE SEULE FOIS. Sauvegarde-le dans un gestionnaire de mots de passe!

### Exemple

```
Mot de passe généré: abcd-efgh-ijkl-mnop
```

**Si tu vois le mot de passe:** ✅ Étape 2 terminée! (Note-le bien!)

---

## Étape 3: Récupérer le Team ID

Ton Team ID est un identifiant unique de 10 caractères (ex: `ABCD123456`).

### Option A: Via Xcode

1. Xcode → **Settings** → **Accounts**
2. Sélectionne ton Apple ID
3. Sélectionne ton Team dans la liste
4. Le **Team ID** est affiché à droite (10 caractères)

### Option B: Via developer.apple.com

1. Va sur https://developer.apple.com/account
2. Section **Membership**
3. Le **Team ID** est affiché sous ton nom

### Exemple

```
Team ID: ABCD123456
```

**Note ton Team ID:** ✅ Étape 3 terminée!

---

## Étape 4: Configurer les credentials localement

Maintenant tu vas configurer les 3 valeurs pour que les scripts puissent les utiliser.

### Configuration temporaire (pour tester)

```bash
# Dans ton terminal, exporte ces variables:
export APPLE_ID="ton@email.com"                    # Ton Apple ID
export APPLE_APP_PASSWORD="abcd-efgh-ijkl-mnop"   # App-Specific Password (Étape 2)
export APPLE_TEAM_ID="ABCD123456"                  # Team ID (Étape 3)

# Vérifier que c'est bien configuré:
echo $APPLE_ID
echo $APPLE_TEAM_ID
# Ne pas echo le password pour sécurité!
```

⚠️ **Note:** Ces exports sont temporaires et seront perdus si tu fermes le terminal.

### Configuration permanente (recommandé)

Pour garder les credentials entre sessions:

```bash
# Ajoute ces lignes dans ton fichier de config shell
# (Remplace les valeurs par les tiennes!)

# Si tu utilises zsh (macOS par défaut):
cat >> ~/.zshrc << 'EOF'

# Apple Developer credentials pour Splice
export APPLE_ID="ton@email.com"
export APPLE_APP_PASSWORD="abcd-efgh-ijkl-mnop"
export APPLE_TEAM_ID="ABCD123456"
EOF

# Si tu utilises bash:
cat >> ~/.bash_profile << 'EOF'

# Apple Developer credentials pour Splice
export APPLE_ID="ton@email.com"
export APPLE_APP_PASSWORD="abcd-efgh-ijkl-mnop"
export APPLE_TEAM_ID="ABCD123456"
EOF

# Recharge la config
source ~/.zshrc   # ou source ~/.bash_profile
```

### Vérifier la configuration

```bash
# Vérifier que toutes les variables sont définies:
[ -n "$APPLE_ID" ] && echo "✅ APPLE_ID configuré" || echo "❌ APPLE_ID manquant"
[ -n "$APPLE_APP_PASSWORD" ] && echo "✅ APPLE_APP_PASSWORD configuré" || echo "❌ APPLE_APP_PASSWORD manquant"
[ -n "$APPLE_TEAM_ID" ] && echo "✅ APPLE_TEAM_ID configuré" || echo "❌ APPLE_TEAM_ID manquant"
```

**Si les 3 sont ✅:** Étape 4 terminée!

---

## Étape 5: Premier build avec signature

Avant de tester la notarization complète (qui prend 15 min), teste d'abord la signature seule.

### Lancer le build avec signature

```bash
# Depuis la racine du projet:
./scripts/build-macos.sh --sign
```

### Ce qui va se passer

```
🚀 Building Splice for macOS...

📦 Step 1: Bundle FFmpeg binaries...
✅ FFmpeg binaries bundled successfully!

🔨 Step 2: Building Tauri app for target: universal-apple-darwin
   Compiling splice v0.0.0 (...)
✓ built in 2.5s
✅ Build successful: apps/desktop/src-tauri/target/release/bundle/macos/Splice.app

🔏 Step 3: Signing app bundle...
🔏 Signing app bundle: apps/desktop/src-tauri/target/release/bundle/macos/Splice.app
✅ Verifying signature...
✅ App signed successfully

📋 Signature details:
Authority=Developer ID Application: TON NOM (TEAM_ID)
TeamIdentifier=TEAM_ID
Identifier=com.splice.app

✨ Build complete!
```

### Vérifier la signature manuellement

```bash
# Vérifier que la signature est valide
codesign --verify --deep --strict apps/desktop/src-tauri/target/release/bundle/macos/Splice.app

# Pas d'output = succès!
echo $?  # Devrait afficher: 0

# Voir les détails de la signature
codesign -dv --verbose=4 apps/desktop/src-tauri/target/release/bundle/macos/Splice.app
```

### Tester l'app signée

```bash
# Lance l'app pour vérifier qu'elle fonctionne
open apps/desktop/src-tauri/target/release/bundle/macos/Splice.app
```

**Si l'app lance sans erreur:** ✅ Étape 5 terminée! La signature fonctionne.

⚠️ **Note:** L'app va quand même afficher un warning Gatekeeper car elle n'est pas encore notarisée. C'est normal!

---

## Étape 6: Build complet avec notarization

Maintenant on fait le processus complet: Build → Sign → Notarize → Staple

### Lancer le build avec notarization

```bash
./scripts/build-macos.sh --notarize
```

### Ce qui va se passer

```
🚀 Building Splice for macOS...

📦 Step 1: Bundle FFmpeg binaries...
✅ FFmpeg binaries bundled successfully!

🔨 Step 2: Building Tauri app for target: universal-apple-darwin
✓ built in 2.5s
✅ Build successful

🔏 Step 3: Signing app bundle...
✅ App signed successfully

📝 Step 4: Notarizing app with Apple...
📦 Creating ZIP for notarization...
⏳ Submitting to Apple (this may take 5-15 minutes)...
```

☕ **C'EST LE MOMENT D'ALLER CHERCHER UN CAFÉ!** La notarization prend généralement 5-15 minutes.

### Pendant l'attente

Apple va:
1. Recevoir ton ZIP
2. Scanner l'app pour malware
3. Vérifier la signature
4. Vérifier les entitlements
5. Approuver ou rejeter

### Après approbation

```
✅ Notarization successful
📎 Stapling notarization ticket...
✅ Verifying notarization...
Splice.app: accepted
source=Notarized Developer ID
✅ App notarized and stapled successfully

✨ Build complete!

📁 Output files:
  App bundle: apps/desktop/src-tauri/target/release/bundle/macos/Splice.app
  DMG installer: apps/desktop/src-tauri/target/release/bundle/dmg

🎉 Done!
```

**Si tu vois "Notarization successful":** ✅ Étape 6 terminée!

### En cas d'échec

Si la notarization échoue, le script affichera un message avec le submission ID:

```bash
# Récupérer les logs détaillés:
xcrun notarytool log <submission-id> \
  --apple-id "$APPLE_ID" \
  --password "$APPLE_APP_PASSWORD" \
  --team-id "$APPLE_TEAM_ID"
```

Voir section [Troubleshooting](#troubleshooting) pour les erreurs communes.

---

## Étape 7: Tester l'installation

Maintenant teste l'app comme un utilisateur final pour vérifier qu'il n'y a AUCUN warning Gatekeeper.

### Test 1: Vérifier la notarization

```bash
# Vérifier que le ticket est bien stapled
stapler validate apps/desktop/src-tauri/target/release/bundle/macos/Splice.app

# Output attendu:
# The validate action worked!

# Vérifier l'acceptation Gatekeeper
spctl --assess --verbose apps/desktop/src-tauri/target/release/bundle/macos/Splice.app

# Output attendu:
# apps/desktop/src-tauri/target/release/bundle/macos/Splice.app: accepted
# source=Notarized Developer ID
```

### Test 2: Installation depuis DMG

```bash
# 1. Ouvre le DMG
open apps/desktop/src-tauri/target/release/bundle/dmg/Splice_0.1.0_universal.dmg

# 2. Glisse Splice.app vers le dossier Applications
# 3. Éjecte le DMG
```

### Test 3: Lancement depuis Applications

```bash
# Lance l'app depuis Applications
open /Applications/Splice.app

# Ou via Spotlight:
# Cmd+Space → tape "Splice" → Enter
```

### Vérifier: AUCUN WARNING

✅ **SUCCÈS si:**
- L'app s'ouvre immédiatement
- Aucun message "cannot be opened because the developer cannot be verified"
- Aucun message "damaged and can't be opened"

❌ **ÉCHEC si:**
- Warning Gatekeeper apparaît
- L'app ne s'ouvre pas

Si échec, voir section [Troubleshooting](#troubleshooting).

### Test 4: Vérifier FFmpeg fonctionne

```bash
# Lance l'app et essaye d'importer une vidéo
# Si FFmpeg fonctionne, la vidéo sera validée et importée
```

**Si tout marche:** ✅ Étape 7 terminée! Ton app est prête pour distribution!

---

## Étape 8: Configurer GitHub Actions (CI/CD)

Optionnel mais recommandé: Automatise les builds signés et notarisés sur GitHub.

### 8.1: Exporter le certificat pour CI/CD

GitHub Actions ne peut pas accéder à ton Keychain. Il faut exporter le certificat.

```bash
# 1. Ouvre Keychain Access (App Utilitaires)
# 2. Dans la liste, cherche "Developer ID Application"
# 3. Right-click sur le certificat → "Export..."
# 4. Nom du fichier: apple-certificate.p12
# 5. Format: Personal Information Exchange (.p12)
# 6. Localisation: Bureau (ou autre dossier temporaire)
# 7. Clique "Save"
# 8. Choisis un mot de passe FORT (tu vas le mettre dans GitHub Secrets)
#    Exemple: "MyStrongP@ssw0rd2024!"
# 9. Clique "OK"
# 10. Entre ton mot de passe macOS pour autoriser l'export
```

⚠️ **Note ce mot de passe!** Tu en auras besoin pour GitHub Secrets.

### 8.2: Encoder le certificat en Base64

```bash
# Va dans le dossier où tu as exporté le certificat
cd ~/Desktop  # ou là où tu l'as mis

# Encode en Base64
base64 -i apple-certificate.p12 -o apple-certificate-base64.txt

# Copie le contenu dans le clipboard
cat apple-certificate-base64.txt | pbcopy

# Le contenu est maintenant copié, prêt à être collé dans GitHub
```

### 8.3: Créer les GitHub Secrets

1. Va sur ton repo GitHub: https://github.com/TON-USERNAME/splice
2. **Settings** (onglet en haut)
3. Dans la sidebar gauche: **Secrets and variables** → **Actions**
4. Clique **New repository secret**

**Crée ces 5 secrets:**

| Secret Name | Value | Où le trouver |
|-------------|-------|---------------|
| `APPLE_CERTIFICATE` | Colle le contenu de `apple-certificate-base64.txt` | Step 8.2 (dans clipboard) |
| `APPLE_CERTIFICATE_PASSWORD` | Le mot de passe du .p12 | Step 8.1 (celui que tu as choisi) |
| `APPLE_ID` | `ton@email.com` | Ton Apple ID |
| `APPLE_APP_PASSWORD` | `abcd-efgh-ijkl-mnop` | Étape 2 (App-Specific Password) |
| `APPLE_TEAM_ID` | `ABCD123456` | Étape 3 |

### 8.4: Vérifier le workflow

Le workflow `.github/workflows/build-macos.yml` est déjà configuré!

```bash
# Vérifier qu'il existe:
cat .github/workflows/build-macos.yml
```

### 8.5: Trigger un build

**Option A: Via tag version (Recommandé)**

```bash
# Créer un tag
git tag v0.1.0
git push origin v0.1.0

# Le workflow se déclenche automatiquement
# Va sur GitHub → Actions pour voir le build en cours
```

**Option B: Manuel via GitHub UI**

1. Va sur GitHub → **Actions**
2. Sélectionne **Build macOS** dans la liste
3. Clique **Run workflow** (bouton à droite)
4. Sélectionne la branche `development`
5. Clique **Run workflow** (vert)

### 8.6: Télécharger l'artifact

Une fois le build terminé (15-20 min):

1. Va dans **Actions** → Sélectionne le build terminé
2. Scroll en bas → **Artifacts**
3. Clique sur **Splice-macOS-Universal** pour télécharger le DMG

### 8.7: Tester le DMG téléchargé

```bash
# 1. Ouvre le DMG téléchargé depuis GitHub
# 2. Glisse vers Applications
# 3. Lance l'app
# 4. Vérifier AUCUN warning Gatekeeper
```

**Si tout marche:** ✅ Étape 8 terminée! CI/CD configuré!

---

## Troubleshooting

### Erreur: "No Developer ID Application certificate found"

**Cause:** Le certificat n'est pas installé ou pas visible.

**Solution:**
```bash
# Vérifier les certificats
security find-identity -v -p codesigning

# Si vide, retourne à l'Étape 1 et crée le certificat
```

### Erreur: "Notarization failed" - Invalid Code Signature

**Cause:** La signature est invalide ou incomplète.

**Solution:**
```bash
# Vérifier la signature
codesign --verify --deep --strict apps/desktop/src-tauri/target/release/bundle/macos/Splice.app

# Si erreur, re-signer:
./scripts/build-macos.sh --sign
```

### Erreur: "Notarization failed" - Invalid Provisioning Profile

**Cause:** Mauvais type de certificat utilisé.

**Solution:** Assure-toi d'utiliser **Developer ID Application**, PAS "Apple Development" ou "iOS Distribution".

### Erreur: Notarization timeout

**Cause:** Apple est lent ou a beaucoup de traffic.

**Solution:**
```bash
# Attendre 30 minutes et vérifier manuellement:
xcrun notarytool history \
  --apple-id "$APPLE_ID" \
  --password "$APPLE_APP_PASSWORD" \
  --team-id "$APPLE_TEAM_ID"

# Trouver ton submission ID et check le statut:
xcrun notarytool info <submission-id> \
  --apple-id "$APPLE_ID" \
  --password "$APPLE_APP_PASSWORD" \
  --team-id "$APPLE_TEAM_ID"
```

### Warning: "Bundle identifier ends with .app"

**Cause:** L'identifier `com.splice.app` se termine par `.app`, ce qui peut causer des confusions.

**Solution (optionnel):**
```json
// apps/desktop/src-tauri/tauri.conf.json
{
  "identifier": "com.splice.desktop"  // au lieu de com.splice.app
}
```

⚠️ **ATTENTION:** Changer l'identifier après distribution casse les mises à jour auto!

### Erreur: GitHub Actions - Certificate import failed

**Cause:** Le certificat encodé est corrompu ou le mot de passe est incorrect.

**Solution:**
```bash
# Re-encoder le certificat:
base64 -i apple-certificate.p12 -o apple-certificate-base64.txt

# Vérifier que ça decode correctement:
base64 -D -i apple-certificate-base64.txt -o test.p12
ls -lh test.p12  # Devrait avoir une taille > 0

# Mettre à jour le secret GitHub avec le nouveau contenu
```

### App lance mais FFmpeg ne fonctionne pas

**Cause:** Les binaries FFmpeg ne sont pas bundlés ou pas exécutables.

**Solution:**
```bash
# Vérifier que les binaries sont dans le bundle:
ls -lh apps/desktop/src-tauri/target/release/bundle/macos/Splice.app/Contents/Resources/

# Devrait montrer:
# ffmpeg-aarch64-apple-darwin
# ffprobe-aarch64-apple-darwin
# ffmpeg-x86_64-apple-darwin
# ffprobe-x86_64-apple-darwin

# Si absent, re-bundle:
./scripts/bundle-ffmpeg.sh
./scripts/build-macos.sh --notarize
```

### Gatekeeper warning malgré notarization

**Cause:** Le ticket de notarization n'est pas stapled.

**Solution:**
```bash
# Vérifier si stapled:
stapler validate apps/desktop/src-tauri/target/release/bundle/macos/Splice.app

# Si "does not have a ticket stapled":
xcrun stapler staple apps/desktop/src-tauri/target/release/bundle/macos/Splice.app
```

---

## Récapitulatif des credentials

Tu as maintenant configuré 5 valeurs importantes:

| Credential | Où c'est utilisé | Où c'est stocké |
|------------|------------------|-----------------|
| **Developer ID Certificate** | Signature locale | Keychain macOS |
| **APPLE_ID** | Notarization | `~/.zshrc` + GitHub Secrets |
| **APPLE_APP_PASSWORD** | Notarization | `~/.zshrc` + GitHub Secrets |
| **APPLE_TEAM_ID** | Notarization | `~/.zshrc` + GitHub Secrets |
| **APPLE_CERTIFICATE** (Base64) | CI/CD signing | GitHub Secrets uniquement |

---

## Commandes utiles

```bash
# Build sans signature (développement)
./scripts/build-macos.sh

# Build avec signature uniquement (test rapide)
./scripts/build-macos.sh --sign

# Build complet avec notarization (production)
./scripts/build-macos.sh --notarize

# Vérifier la signature
codesign --verify --deep --strict apps/desktop/src-tauri/target/release/bundle/macos/Splice.app

# Vérifier la notarization
spctl --assess --verbose apps/desktop/src-tauri/target/release/bundle/macos/Splice.app

# Voir l'historique notarization
xcrun notarytool history --apple-id "$APPLE_ID" --password "$APPLE_APP_PASSWORD" --team-id "$APPLE_TEAM_ID"

# Bundle FFmpeg uniquement
./scripts/bundle-ffmpeg.sh

# Lancer l'app
open apps/desktop/src-tauri/target/release/bundle/macos/Splice.app
```

---

## Sécurité

### Bonnes pratiques

✅ **À FAIRE:**
- Utiliser App-Specific Password (jamais ton mot de passe principal)
- Garder le certificat .p12 dans un endroit sécurisé
- Ne JAMAIS committer les credentials dans git
- Utiliser GitHub Secrets pour CI/CD
- Changer régulièrement l'App-Specific Password

❌ **À NE PAS FAIRE:**
- Partager ton certificat .p12 ou son mot de passe
- Committer `~/.zshrc` avec les credentials
- Utiliser le même App-Specific Password partout
- Laisser le fichier apple-certificate-base64.txt traîner

### Rotation des credentials

**Si tu penses que tes credentials sont compromis:**

1. **App-Specific Password:**
   - Va sur appleid.apple.com
   - Révoque l'ancien password
   - Génère un nouveau
   - Mets à jour `~/.zshrc` et GitHub Secrets

2. **Certificat:**
   - Révoque l'ancien sur developer.apple.com
   - Crée un nouveau certificat
   - Re-exporte et mets à jour GitHub Secrets

---

## Support

Pour des questions ou problèmes:

1. ✅ Consulte cette documentation
2. ✅ Vérifie [MACOS_BUILD_CODESIGN.md](./MACOS_BUILD_CODESIGN.md) pour détails techniques
3. ✅ Check les logs: `pnpm tauri build --verbose`
4. ✅ Apple Developer Forums: https://developer.apple.com/forums/
5. ✅ Tauri Discord: https://discord.gg/tauri

---

**Dernière mise à jour:** 2026-01-31
**Story:** 1-8-macos-universal-binary-build-code-signing
