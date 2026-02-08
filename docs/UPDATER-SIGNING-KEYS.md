# Configuration des cles de signature pour l'auto-update

Guide pour generer et configurer les cles Ed25519 utilisees par `tauri-plugin-updater` pour verifier l'integrite des mises a jour.

Date: 2026-02-08

---

## Pourquoi c'est necessaire

Tauri verifie chaque mise a jour avec une signature Ed25519 avant installation. Sans cle valide :
- Le build ne generera pas les artefacts `.sig` requis
- Le client refusera d'installer les mises a jour telechargees
- Le placeholder actuel dans `tauri.conf.json` doit etre remplace

## 1. Generer la paire de cles

```bash
# Depuis la racine du projet
cd apps/desktop
pnpm tauri signer generate -w ~/.tauri/splicely.key
```

Le CLI demande un mot de passe. **Retiens-le** : il sera necessaire en CI pour signer les builds.

Fichiers generes :
- `~/.tauri/splicely.key` - Cle privee (ne JAMAIS commiter)
- `~/.tauri/splicely.key.pub` - Cle publique (va dans `tauri.conf.json`)

## 2. Configurer la cle publique

Copier le contenu de la cle publique :

```bash
cat ~/.tauri/splicely.key.pub
```

Remplacer le placeholder dans `apps/desktop/src-tauri/tauri.conf.json` :

```json
{
  "plugins": {
    "updater": {
      "pubkey": "COLLER_LA_CLE_PUBLIQUE_ICI"
    }
  }
}
```

La cle publique ressemble a : `dW50cnVzdGVkIGNvbW1lbnQ6IG1p...` (base64, ~environ 90 caracteres).

## 3. Configurer le CI/CD

Ajouter ces secrets dans GitHub Actions (Settings > Secrets and variables > Actions) :

| Secret | Valeur | Description |
|--------|--------|-------------|
| `TAURI_SIGNING_PRIVATE_KEY` | Contenu de `~/.tauri/splicely.key` | Cle privee complete |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Le mot de passe choisi a l'etape 1 | Deverrouille la cle |

Dans le workflow GitHub Actions, ces variables d'environnement seront automatiquement utilisees par `tauri build` pour signer les artefacts.

```yaml
# Exemple dans .github/workflows/release.yml
env:
  TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
```

## 4. Verifier que ca fonctionne

Apres avoir configure la cle publique, lancer un build :

```bash
cd apps/desktop
pnpm tauri build
```

Verifier que les artefacts de signature sont generes :

```bash
ls target/release/bundle/macos/*.sig
```

Un fichier `.sig` doit exister a cote de chaque artefact `.tar.gz` ou `.dmg`.

## Securite

- **Cle privee** : ne JAMAIS la commiter dans le repo. La stocker dans un gestionnaire de mots de passe et dans les secrets CI
- **Cle publique** : commitee dans `tauri.conf.json`, elle est publique par nature
- **Mot de passe** : uniquement dans les secrets CI, jamais en clair dans les fichiers
- **Rotation** : si la cle privee est compromise, generer une nouvelle paire et publier une version signee avec l'ancienne cle qui contient la nouvelle cle publique (migration progressive)
- **Backup** : conserver une copie de la cle privee dans un endroit securise (1Password, Bitwarden, etc.)
