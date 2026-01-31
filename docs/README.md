# Documentation Splice - Build & Distribution macOS

Guides pour builder, signer et distribuer Splice sur macOS.

---

## 📚 Guides Disponibles

### 🚀 [QUICK-START-BUILD.md](./QUICK-START-BUILD.md)
**Pour:** Commencer rapidement
**Contenu:**
- Build en une commande
- Où trouver le DMG
- Comment partager
- Résolution problèmes courants

👉 **Commence par ici si tu veux juste builder!**

---

### 📖 [GUIDE-BUILD-MACOS-SIMPLE.md](./GUIDE-BUILD-MACOS-SIMPLE.md)
**Pour:** Comprendre en détail
**Contenu:**
- Explications pédagogiques
- Ce que font les scripts
- 3 scénarios détaillés (Simple / Signé / Notarisé)
- FAQ complète
- Troubleshooting avancé

👉 **Lis ça si tu veux vraiment comprendre le processus!**

---

### 🔧 [MACOS_BUILD_CODESIGN.md](./MACOS_BUILD_CODESIGN.md)
**Pour:** Setup avancé Apple Developer
**Contenu:**
- Configuration certificats Apple
- Setup notarization
- CI/CD GitHub Actions
- Guide technique complet

👉 **Pour la distribution professionnelle (certificat Apple requis)**

---

## 🎯 Quel Guide Pour Quoi?

**Je veux juste tester mon app:**
→ [QUICK-START-BUILD.md](./QUICK-START-BUILD.md) - Section "Build Rapide"

**Je veux partager à un ami:**
→ [QUICK-START-BUILD.md](./QUICK-START-BUILD.md) - Section "Partager"

**J'ai une erreur de build:**
→ [QUICK-START-BUILD.md](./QUICK-START-BUILD.md) - Section "Problèmes Fréquents"

**Je veux comprendre comment ça marche:**
→ [GUIDE-BUILD-MACOS-SIMPLE.md](./GUIDE-BUILD-MACOS-SIMPLE.md)

**Je veux distribuer sans warnings:**
→ [MACOS_BUILD_CODESIGN.md](./MACOS_BUILD_CODESIGN.md)

**Je veux setup CI/CD:**
→ [MACOS_BUILD_CODESIGN.md](./MACOS_BUILD_CODESIGN.md) - Section "CI/CD"

---

## ⚡ Commandes Essentielles

```bash
# Build simple
./scripts/build-macos.sh

# Vérifier config
./scripts/verify-macos-config.sh

# Voir où est le DMG
open apps/desktop/src-tauri/target/universal-apple-darwin/release/bundle/dmg/

# Copier DMG sur Bureau
cp apps/desktop/src-tauri/target/universal-apple-darwin/release/bundle/dmg/Splice_*.dmg ~/Desktop/
```

---

## 🆘 Aide Rapide

**Problème de build?**
1. Vérifie: `./scripts/verify-macos-config.sh`
2. Regarde: [QUICK-START-BUILD.md - Problèmes Fréquents](./QUICK-START-BUILD.md#-problèmes-fréquents)
3. Si toujours bloqué: Consulte les logs du build

**Setup initial?**
```bash
# Une fois pour toutes
rustup target add x86_64-apple-darwin aarch64-apple-darwin
source $HOME/.cargo/env
echo 'source $HOME/.cargo/env' >> ~/.zshrc
```

---

Dernière mise à jour: 2026-01-31
