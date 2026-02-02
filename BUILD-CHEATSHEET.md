# 🚀 Splice Build Cheat Sheet

Aide-mémoire rapide pour builder Splice.

---

## ⚡ Commandes Principales

```bash
# Build Universal Binary (Intel + Apple Silicon)
./scripts/build-macos.sh

# Build Apple Silicon uniquement (plus rapide)
./scripts/build-macos.sh --target aarch64-apple-darwin

# Build avec signature Apple
./scripts/build-macos.sh --sign

# Build avec signature + notarization
./scripts/build-macos.sh --notarize

# Vérifier la configuration
./scripts/verify-macos-config.sh

# Re-télécharger FFmpeg
./scripts/bundle-ffmpeg.sh
```

---

## 📦 Trouver le DMG

```bash
# Ouvrir le dossier DMG
open apps/desktop/src-tauri/target/universal-apple-darwin/release/bundle/dmg/

# Copier DMG sur le Bureau
cp apps/desktop/src-tauri/target/universal-apple-darwin/release/bundle/dmg/Splice_*.dmg ~/Desktop/

# Chemin complet du DMG
~/Documents/Dev/splice/apps/desktop/src-tauri/target/universal-apple-darwin/release/bundle/dmg/Splice_0.1.0_universal.dmg
```

---

## 🔧 Setup Initial (une fois)

```bash
# Installer targets Rust
rustup target add x86_64-apple-darwin aarch64-apple-darwin

# Configurer PATH Rust
source $HOME/.cargo/env
echo 'source $HOME/.cargo/env' >> ~/.zshrc
```

---

## 🐛 Fixes Rapides

```bash
# Problème cargo not found
source $HOME/.cargo/env

# Nettoyer cache build
cd apps/desktop/src-tauri && cargo clean && cd ../../..

# Réinstaller dépendances
rm -rf node_modules && pnpm install

# Vérifier targets Rust
rustup target list | grep installed
```

---

## 📤 Partager l'App

**1. WeTransfer** (recommandé)
- https://wetransfer.com
- Upload le DMG
- Envoyer lien

**2. Instructions utilisateur:**
```
1. Télécharge Splice_0.1.0_universal.dmg
2. Double-clique dessus
3. Glisse Splice.app vers Applications
4. Clic Droit sur Splice.app → Ouvrir (important!)
5. Clique "Ouvrir" dans la popup
```

---

## 📚 Documentation

- **Quick Start:** `docs/QUICK-START-BUILD.md`
- **Guide Complet:** `docs/GUIDE-BUILD-MACOS-SIMPLE.md`
- **Guide Technique:** `docs/MACOS_BUILD_CODESIGN.md`
- **Index Docs:** `docs/README.md`

---

## 🎯 Durées Typiques

- Premier build: 5-10 min
- Builds suivants: 2-3 min
- Build avec notarization: 15-25 min

---

Dernière mise à jour: 2026-01-31
