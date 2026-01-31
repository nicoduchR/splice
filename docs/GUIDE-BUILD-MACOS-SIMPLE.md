# Guide Complet: Builder et Partager Splice sur macOS

**Pour:** Nicolas
**Niveau:** Guide simplifié et pédagogique
**Date:** 2026-01-31

---

## 📚 Table des Matières

1. [Comprendre le Processus](#comprendre-le-processus)
2. [Ce que Font les Scripts](#ce-que-font-les-scripts)
3. [Scénario 1: Build Simple (Pour Tester Localement)](#scénario-1-build-simple-pour-tester-localement)
4. [Scénario 2: Build Signé (Pour Partager Sans Warnings)](#scénario-2-build-signé-pour-partager-sans-warnings)
5. [Scénario 3: Build Notarisé (Distribution Publique)](#scénario-3-build-notarisé-distribution-publique)
6. [FAQ & Troubleshooting](#faq--troubleshooting)

---

## Comprendre le Processus

### C'est Quoi Exactement un "Build"?

Imagine que ton code source (TypeScript, Rust, etc.) c'est comme une recette de cuisine. Le "build" c'est le processus qui transforme cette recette en un plat prêt à servir.

**Pour Splice, ça donne:**

```
Code Source (apps/desktop/)
    ↓
    BUILD (compilation + bundling)
    ↓
Splice.app (application macOS prête à utiliser)
    ↓
Splice.dmg (installeur macOS)
```

### Les 3 Niveaux de Distribution

| Niveau | Pour Qui | Avertissement macOS | Temps |
|--------|----------|---------------------|-------|
| **Build Simple** | Toi uniquement | ⚠️ "Non identifié" | ~5 min |
| **Build Signé** | Toi + Amis proches | ⚠️ "Non vérifié" réduit | ~5 min |
| **Build Notarisé** | Public / Clients | ✅ Aucun warning | ~20 min |

**Pourquoi ces différences?**

macOS est très strict sur la sécurité. Il fait confiance aux apps selon 3 niveaux:

1. **Pas de signature** = "Je ne connais pas cette app, danger!"
2. **Signature Apple Developer** = "OK, je connais le développeur, mais je n'ai pas encore vérifié l'app"
3. **Signature + Notarization** = "App vérifiée par Apple, 100% safe"

---

## Ce que Font les Scripts

J'ai créé 4 scripts pour t'aider. Voici ce que chacun fait, en langage simple:

### 1. `scripts/bundle-ffmpeg.sh` 📦

**Qu'est-ce qu'il fait?**
- Télécharge FFmpeg (le logiciel qui gère les vidéos)
- Télécharge 2 versions: une pour Mac Intel, une pour Mac Apple Silicon (M1/M2/M3)
- Les place au bon endroit pour que Tauri les trouve

**Quand l'utiliser?**
- Première fois que tu build
- Si tu as supprimé les binaries FFmpeg
- Si FFmpeg a une nouvelle version

**Commande:**
```bash
./scripts/bundle-ffmpeg.sh
```

**Ce qui se passe:**
```
📥 Téléchargement FFmpeg...
  → arm64 (Apple Silicon): 43 MB
  → x64 (Intel): 75 MB
📂 Extraction...
🔐 Configuration permissions...
✅ Terminé!
```

---

### 2. `scripts/build-macos.sh` 🔨

**Qu'est-ce qu'il fait?**
C'est le script principal! Il:
1. Lance `bundle-ffmpeg.sh` pour avoir FFmpeg
2. Appelle Tauri pour compiler ton app
3. Crée Splice.app (l'application)
4. Crée Splice.dmg (l'installeur)
5. Optionnellement: signe et/ou notarise

**Options disponibles:**

```bash
# Build basique (juste pour toi)
./scripts/build-macos.sh

# Build + signature (pour partager à des amis)
./scripts/build-macos.sh --sign

# Build + signature + notarization Apple (pour distribution)
./scripts/build-macos.sh --notarize

# Build pour Apple Silicon seulement
./scripts/build-macos.sh --target aarch64-apple-darwin

# Build pour Intel seulement
./scripts/build-macos.sh --target x86_64-apple-darwin
```

**Durée:** 5-10 minutes pour un build normal

---

### 3. `scripts/code-sign.sh` 🔐

**Qu'est-ce qu'il fait?**
Signe l'application avec ton certificat Apple Developer. C'est comme mettre ton cachet officiel sur l'app.

**Tu ne l'appelles PAS directement!**
Il est appelé automatiquement par `build-macos.sh --sign`

**Technique:** Il utilise `codesign`, un outil macOS qui dit "Cette app a été créée par Nicolas Duchemann, développeur Apple vérifié"

---

### 4. `scripts/verify-macos-config.sh` ✅

**Qu'est-ce qu'il fait?**
Vérifie que tout est bien configuré AVANT de builder. C'est comme une checklist.

**Quand l'utiliser?**
- Avant ton premier build
- Si tu as des erreurs de build bizarres
- Pour vérifier que FFmpeg est bien installé

**Commande:**
```bash
./scripts/verify-macos-config.sh
```

**Ce qu'il vérifie:**
- ✅ Configuration Tauri correcte
- ✅ FFmpeg présent (4 fichiers)
- ✅ Bonnes architectures (arm64 + x64)
- ✅ Scripts exécutables
- ✅ Icons présents

---

## Scénario 1: Build Simple (Pour Tester Localement)

### 🎯 Objectif
Builder Splice pour le tester sur TON Mac uniquement.

### ⚠️ Limites
- Warnings Gatekeeper si tu essaies de l'ouvrir
- Ne peut PAS être partagé facilement

### 📋 Prérequis
- macOS 13+ (Ventura ou plus récent)
- Node.js 20+ installé
- Rust installé
- Xcode Command Line Tools: `xcode-select --install`

**IMPORTANT - Setup Rust (une fois):**
```bash
# Installer les targets pour Universal Binary
rustup target add x86_64-apple-darwin
rustup target add aarch64-apple-darwin

# Ajouter Rust au PATH
source $HOME/.cargo/env

# Pour que ce soit permanent:
echo 'source $HOME/.cargo/env' >> ~/.zshrc
source ~/.zshrc
```

### 🚀 Étapes

**1. Vérifie que tout est OK:**
```bash
cd /Users/nicoduch/Documents/Dev/splice
./scripts/verify-macos-config.sh
```

Tu dois voir tous les ✅ verts.

**2. Lance le build:**
```bash
./scripts/build-macos.sh
```

**3. Attends (~5-10 minutes)**

Tu vas voir défiler:
```
📦 Bundling FFmpeg...
🔨 Building Tauri app...
   Compiling frontend...
   Compiling Rust backend...
   Creating app bundle...
   Creating DMG...
✅ Build complete!
```

**4. Récupère tes fichiers:**

L'app est ici:
```
apps/desktop/src-tauri/target/release/bundle/macos/Splice.app
```

L'installeur DMG est ici:
```
apps/desktop/src-tauri/target/release/bundle/dmg/Splice_0.1.0_universal.dmg
```

**5. Teste l'app:**

**Option A: Lancer directement l'app**
```bash
open apps/desktop/src-tauri/target/release/bundle/macos/Splice.app
```

⚠️ macOS va dire: *"Splice.app ne peut pas être ouvert car le développeur ne peut pas être vérifié"*

**Solution:** Clic droit → Ouvrir → Ouvrir quand même

**Option B: Installer via DMG**
```bash
open apps/desktop/src-tauri/target/release/bundle/dmg/Splice_0.1.0_universal.dmg
```

Glisse Splice.app vers Applications, puis Clic droit → Ouvrir.

---

## Scénario 2: Build Signé (Pour Partager Sans Warnings)

### 🎯 Objectif
Builder une app que tu peux partager à des amis/testeurs sans trop de warnings.

### ⚠️ Limites
- Toujours un petit warning à la première ouverture
- Nécessite Apple Developer Program (99$/an)

### 📋 Prérequis Supplémentaires

**1. Apple Developer Program:**
- Créer un compte: https://developer.apple.com/programs/
- Payer 99$ / an
- Attendre validation (1-2 jours)

**2. Créer un Certificat Developer ID Application:**

**Étape A: Via Xcode**
```bash
# Ouvrir Xcode (installer depuis App Store si pas déjà fait)
# Aller dans: Xcode → Preferences → Accounts
# Cliquer sur ton Apple ID
# Cliquer "Manage Certificates..."
# Cliquer "+" → "Developer ID Application"
```

**Étape B: Vérifier que c'est bien installé**
```bash
security find-identity -v -p codesigning
```

Tu dois voir quelque chose comme:
```
1) ABCD1234... "Developer ID Application: Nicolas Duchemann (TEAM123)"
```

### 🚀 Étapes

**1. Lance le build signé:**
```bash
./scripts/build-macos.sh --sign
```

**2. Le script va:**
- Builder l'app (comme avant)
- **Signer** l'app avec ton certificat
- Vérifier la signature

**3. Récupère le DMG:**
```
apps/desktop/src-tauri/target/release/bundle/dmg/Splice_0.1.0_universal.dmg
```

**4. Partage ce DMG:**

Tu peux maintenant envoyer ce DMG à des amis par:
- Email (si < 25 MB)
- WeTransfer
- Google Drive / Dropbox
- AirDrop

**5. Ils l'installent:**
- Double-clic sur DMG
- Glisser Splice.app vers Applications
- Ouvrir (peut-être un warning à la première fois, mais moins sévère)

---

## Scénario 3: Build Notarisé (Distribution Publique)

### 🎯 Objectif
Créer une app "officielle" sans AUCUN warning, comme les apps du Mac App Store.

### ⚠️ Complexité
C'est le plus compliqué, mais le plus pro!

### 📋 Prérequis Supplémentaires

En plus du certificat (Scénario 2), il faut:

**1. App-Specific Password Apple:**

```bash
# Aller sur: https://appleid.apple.com/account/manage
# Section "Sécurité" → "Mots de passe spécifiques aux apps"
# Cliquer "Générer un mot de passe..."
# Nom: "Splice Notarization"
# Copier le mot de passe généré (format: xxxx-xxxx-xxxx-xxxx)
```

**2. Team ID Apple:**

```bash
# Aller sur: https://developer.apple.com/account
# Cliquer sur "Membership"
# Copier ton "Team ID" (10 caractères, ex: ABCD123456)
```

**3. Configurer les variables d'environnement:**

```bash
# Dans ton terminal, taper:
export APPLE_ID="ton-email@exemple.com"
export APPLE_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx"  # Password généré à l'étape 1
export APPLE_TEAM_ID="ABCD123456"  # Team ID de l'étape 2
```

💡 **Astuce:** Crée un fichier pour sauvegarder ça:

```bash
# Créer fichier ~/.splice-notarize
cat > ~/.splice-notarize << 'EOF'
export APPLE_ID="ton-email@exemple.com"
export APPLE_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="ABCD123456"
EOF

# Puis chaque fois que tu veux notariser:
source ~/.splice-notarize
```

### 🚀 Étapes

**1. Charge tes credentials:**
```bash
source ~/.splice-notarize
```

**2. Lance le build notarisé:**
```bash
./scripts/build-macos.sh --notarize
```

**3. Attends (~20 minutes):**

Le script va:
- Builder l'app (5-10 min)
- Signer l'app
- **Envoyer l'app à Apple** pour vérification
- **Attendre l'approval Apple** (10-15 min généralement)
- **Stapler** le ticket de notarization sur l'app

Tu verras:
```
📦 Bundling FFmpeg...
🔨 Building...
🔏 Signing app bundle...
📝 Notarizing app with Apple...
⏳ Submitting to Apple (this may take 5-15 minutes)...
...
✅ Notarization successful
📎 Stapling notarization ticket...
✅ App notarized and stapled successfully
```

**4. Récupère le DMG notarisé:**
```
apps/desktop/src-tauri/target/release/bundle/dmg/Splice_0.1.0_universal.dmg
```

**5. Distribue:**

Cette app peut maintenant être:
- Uploadée sur un site web
- Envoyée à n'importe qui
- Installée sans AUCUN warning!

L'utilisateur fait juste:
- Double-clic DMG
- Glisser vers Applications
- Double-clic pour ouvrir
- ✅ Ça marche directement!

---

## FAQ & Troubleshooting

### ❓ Questions Fréquentes

**Q: Quel build dois-je utiliser pour partager à un ami?**

R: Ça dépend:
- **Ami proche qui te fait confiance:** Build signé suffit
- **Testeur/Client:** Build notarisé (plus pro)
- **Juste toi:** Build simple

**Q: Combien de temps ça prend?**

R:
- Build simple: 5-10 minutes
- Build signé: 5-10 minutes (pareil)
- Build notarisé: 15-25 minutes (à cause d'Apple)

**Q: C'est quoi "Universal Binary"?**

R: C'est un seul fichier qui marche sur:
- Mac Intel (anciens Macs, avant 2020)
- Mac Apple Silicon (M1/M2/M3, depuis 2020)

Donc tu distribues UN SEUL fichier pour tous les Macs! 🎉

**Q: Je dois payer 99$ OBLIGATOIREMENT?**

R:
- Pour build simple: NON
- Pour build signé: OUI (Apple Developer Program)
- Pour build notarisé: OUI (même chose)

**Q: Mes amis ont des warnings, pourquoi?**

R: Tu as probablement fait un build simple ou signé (pas notarisé).

**Solution:** Soit:
1. Dis-leur de faire Clic Droit → Ouvrir (contourne le warning)
2. Fais un build notarisé (plus de warning du tout)

**Q: FFmpeg c'est quoi exactement?**

R: C'est un logiciel qui gère les vidéos. Splice l'utilise pour:
- Lire les vidéos
- Extraire des métadonnées
- Couper/monter les vidéos

On le "bundle" = on l'inclut dans l'app, comme ça l'utilisateur n'a rien à installer.

**Q: Pourquoi 2 versions de FFmpeg?**

R: Une pour Mac Intel (x86_64), une pour Mac Apple Silicon (arm64).

Le "Universal Binary" inclut les deux, et macOS choisit automatiquement la bonne version selon le Mac de l'utilisateur.

---

### 🔧 Problèmes Courants

**Problème: "No Developer ID Application certificate found"**

```
❌ Error: No Developer ID Application certificate found in keychain
```

**Solution:**
Tu n'as pas encore créé ton certificat Apple. Suis "Scénario 2" → Prérequis → Étape "Créer Certificat".

---

**Problème: "Notarization failed"**

```
❌ Notarization failed
```

**Solutions possibles:**

1. **Vérifier tes credentials:**
```bash
echo $APPLE_ID
echo $APPLE_TEAM_ID
echo $APPLE_APP_PASSWORD
```

Si vide, tu as oublié de faire `source ~/.splice-notarize`

2. **Vérifier le mot de passe:**
Le mot de passe App-Specific doit être format: `xxxx-xxxx-xxxx-xxxx` (avec tirets)

3. **Voir les logs Apple:**
```bash
# Le script affiche un submission ID, exemple: "abc123-def456"
# Pour voir les détails de l'erreur:
xcrun notarytool log abc123-def456 \
  --apple-id "$APPLE_ID" \
  --password "$APPLE_APP_PASSWORD" \
  --team-id "$APPLE_TEAM_ID"
```

---

**Problème: "Build failed" avec des erreurs de compilation**

**Solution 1: Nettoyer le cache:**
```bash
cd apps/desktop/src-tauri
cargo clean
cd ../../..
./scripts/build-macos.sh
```

**Solution 2: Réinstaller les dépendances:**
```bash
rm -rf node_modules
pnpm install
./scripts/build-macos.sh
```

---

**Problème: "FFmpeg binary not found"**

```
resource path `binaries/ffmpeg-xxx` doesn't exist
```

**Solution:**
Lance le script FFmpeg manuellement:
```bash
./scripts/bundle-ffmpeg.sh
```

Puis rebuild:
```bash
./scripts/build-macos.sh
```

---

**Problème: L'app crash au lancement**

**Diagnostic:**
```bash
# Ouvrir Console.app (Cmd+Space → "Console")
# Chercher "Splice" dans les logs
```

Souvent c'est:
- Une dépendance manquante
- FFmpeg pas bundlé correctement

**Solution:**
Rebuilder avec logs détaillés:
```bash
./scripts/build-macos.sh --verbose 2>&1 | tee build.log
```

Envoie-moi `build.log` et je t'aide.

---

## 🎓 Résumé pour Débutants

**Pour juste tester:**
```bash
./scripts/build-macos.sh
# Attendre 5-10 min
# L'app est dans: apps/desktop/src-tauri/target/release/bundle/macos/Splice.app
# Clic droit → Ouvrir pour lancer
```

**Pour partager à un ami:**
```bash
# 1. Créer certificat Apple Developer (une fois)
# 2. Builder et signer:
./scripts/build-macos.sh --sign
# 3. Envoyer le DMG à ton ami:
# apps/desktop/src-tauri/target/release/bundle/dmg/Splice_0.1.0_universal.dmg
```

**Pour distribution pro:**
```bash
# 1. Setup Apple Developer (certificat + credentials)
# 2. Configurer variables:
source ~/.splice-notarize
# 3. Builder et notariser:
./scripts/build-macos.sh --notarize
# 4. Distribuer le DMG (aucun warning!)
```

---

## 📞 Besoin d'Aide?

Si tu es bloqué:

1. Lance le script de vérification:
```bash
./scripts/verify-macos-config.sh
```

2. Vérifie les logs du build:
```bash
./scripts/build-macos.sh 2>&1 | tee build.log
cat build.log
```

3. Demande-moi! 😊

---

**Dernière mise à jour:** 2026-01-31
**Auteur:** Claude (dev-story workflow)
**Pour:** Nicolas - Projet Splice
