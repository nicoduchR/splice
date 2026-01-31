# Quick Start: Builder Splice sur macOS

**Guide ultra-rapide** pour builder et partager Splice.

Date: 2026-01-31

---

## 🚀 Build Rapide (Pour Tester ou Partager)

### Prérequis (une seule fois)

```bash
# 1. Installer les targets Rust pour Universal Binary
rustup target add x86_64-apple-darwin
rustup target add aarch64-apple-darwin

# 2. S'assurer que Rust est dans le PATH
source $HOME/.cargo/env
```

### Build en Une Commande

```bash
# Depuis la racine du projet
./scripts/build-macos.sh
```

**Durée:** 5-10 minutes la première fois, 2-3 minutes ensuite

---

## 📦 Récupérer le DMG

Après le build, le DMG est ici:

```bash
# Ouvrir le dossier
open apps/desktop/src-tauri/target/universal-apple-darwin/release/bundle/dmg/

# OU copier sur le Bureau
cp apps/desktop/src-tauri/target/universal-apple-darwin/release/bundle/dmg/Splice_*.dmg ~/Desktop/
```

Fichier: **`Splice_0.1.0_universal.dmg`** (~120-150 MB)

---

## 📤 Partager à Quelqu'un

**1. Envoie le DMG via:**
- WeTransfer (https://wetransfer.com) - Recommandé!
- Google Drive / Dropbox
- AirDrop (si proche)

**2. Instructions pour l'installation:**

```
1. Télécharge Splice_0.1.0_universal.dmg
2. Double-clique sur le DMG
3. Glisse Splice.app vers Applications
4. IMPORTANT: Clic Droit sur Splice.app → Ouvrir (pas double-clic!)
5. Clique "Ouvrir" dans la popup

Note: Le warning de sécurité est normal (app non signée).
Après le premier "Clic Droit → Ouvrir", ça marchera normalement.
```

---

## 🎯 Commandes Utiles

### Build pour Apple Silicon uniquement (plus rapide)
```bash
./scripts/build-macos.sh --target aarch64-apple-darwin
```

### Build pour Intel uniquement
```bash
./scripts/build-macos.sh --target x86_64-apple-darwin
```

### Build Universal Binary (Intel + Apple Silicon)
```bash
./scripts/build-macos.sh
# OU explicitement:
./scripts/build-macos.sh --target universal-apple-darwin
```

### Vérifier la config avant de builder
```bash
./scripts/verify-macos-config.sh
```

---

## 🔧 Problèmes Fréquents

### Erreur: "cargo: command not found"

**Solution:**
```bash
source $HOME/.cargo/env
./scripts/build-macos.sh
```

### Erreur: "Target x86_64-apple-darwin is not installed"

**Solution:**
```bash
rustup target add x86_64-apple-darwin
./scripts/build-macos.sh
```

### Erreur: "resource path binaries/ffmpeg-universal-apple-darwin doesn't exist"

**Solution:** (déjà corrigée dans le script, mais au cas où)
```bash
cd apps/desktop/src-tauri/binaries
lipo -create ffmpeg-aarch64-apple-darwin ffmpeg-x86_64-apple-darwin -output ffmpeg-universal-apple-darwin
lipo -create ffprobe-aarch64-apple-darwin ffprobe-x86_64-apple-darwin -output ffprobe-universal-apple-darwin
chmod +x ffmpeg-universal-apple-darwin ffprobe-universal-apple-darwin
cd ../../../..
./scripts/build-macos.sh
```

### Build très lent ou bloqué

**Solution:** Nettoyer le cache
```bash
cd apps/desktop/src-tauri
cargo clean
cd ../../..
./scripts/build-macos.sh
```

---

## 🔐 Build Signé (Sans Warnings)

### Prérequis
- Apple Developer Program (99$/an)
- Certificat Developer ID Application créé

### Commande
```bash
./scripts/build-macos.sh --sign
```

Le DMG sera au même endroit, mais signé! L'utilisateur aura moins de warnings.

---

## ✨ Build Notarisé (Zéro Warning)

### Prérequis
- Tout ce qui précède +
- App-Specific Password Apple
- Team ID Apple

### Setup (une fois)
```bash
# Créer fichier de credentials
cat > ~/.splice-notarize << 'EOF'
export APPLE_ID="ton-email@exemple.com"
export APPLE_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="ABCD123456"
EOF
```

### Build
```bash
source ~/.splice-notarize
./scripts/build-macos.sh --notarize
```

**Durée:** 15-25 minutes (Apple prend du temps pour vérifier)

Le DMG résultant n'aura AUCUN warning! 🎉

---

## 📁 Où Sont les Fichiers?

```
apps/desktop/src-tauri/target/
├── universal-apple-darwin/           # Build Universal Binary
│   └── release/
│       └── bundle/
│           ├── macos/
│           │   └── Splice.app        # App bundle
│           └── dmg/
│               └── Splice_*.dmg      # 👈 FICHIER À PARTAGER
│
├── aarch64-apple-darwin/             # Build Apple Silicon uniquement
│   └── release/bundle/dmg/
│
└── x86_64-apple-darwin/              # Build Intel uniquement
    └── release/bundle/dmg/
```

---

## 🎓 Recap Ultra-Rapide

**Pour tester localement:**
```bash
./scripts/build-macos.sh
open apps/desktop/src-tauri/target/universal-apple-darwin/release/bundle/macos/Splice.app
```

**Pour partager:**
```bash
./scripts/build-macos.sh
cp apps/desktop/src-tauri/target/universal-apple-darwin/release/bundle/dmg/Splice_*.dmg ~/Desktop/
# Puis envoyer le DMG via WeTransfer
```

**Pour distribution professionnelle:**
```bash
source ~/.splice-notarize
./scripts/build-macos.sh --notarize
# Partager le DMG notarisé (aucun warning!)
```

---

## 📚 Documentation Complète

Pour plus de détails, voir:
- `docs/GUIDE-BUILD-MACOS-SIMPLE.md` - Guide complet et pédagogique
- `docs/MACOS_BUILD_CODESIGN.md` - Guide technique détaillé

---

**Besoin d'aide?** Lance:
```bash
./scripts/build-macos.sh --help
```
