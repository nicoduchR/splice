# 🚀 Guide d'Installation - Model Download UI

Ce guide vous montre comment intégrer l'UI de téléchargement du modèle Parakeet dans votre application Splice.

## ✅ Ce qui a été créé

### Composants UI
- ✅ `ModelDownloadDialog.tsx` - Dialogue modal avec barre de progression
- ✅ `ModelDownloadDialog.test.tsx` - Tests unitaires Vitest
- ✅ `index.ts` - Export du composant

### Services
- ✅ `model-service.ts` - Wrapper TypeScript pour commandes Tauri

### Hooks
- ✅ `use-model-download.ts` - Hook personnalisé pour gérer le téléchargement
- ✅ `use-model-download.test.ts` - Tests du hook

### Exemples
- ✅ `ModelDownloadExample.tsx` - Exemple d'utilisation détaillé
- ✅ `App-with-model-download.example.tsx` - Intégration complète dans App.tsx

### Documentation
- ✅ `README.md` - Documentation complète du composant

## 📦 Étape 1: Installer les Dépendances

```bash
# Installer les composants shadcn/ui manquants
pnpm dlx shadcn-ui@latest add alert-dialog
pnpm dlx shadcn-ui@latest add progress
pnpm dlx shadcn-ui@latest add button

# Installer Lucide React pour les icônes
pnpm add lucide-react
```

## 🎨 Étape 2: Vérifier la Configuration Tailwind

Assurez-vous que votre `tailwind.config.js` contient les couleurs du design :

```js
// apps/desktop/tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#1580f9',
        'background-light': '#f5f7f8',
        'background-dark': '#1A1A1F',
        'card-dark': '#232429',
        'surface-dark': '#2A2B32',
      },
    },
  },
};
```

## 🔧 Étape 3: Configurer les Alias de Chemin (si nécessaire)

Vérifiez que `tsconfig.json` et `vite.config.ts` ont les alias corrects :

**tsconfig.json :**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**vite.config.ts :**
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

## 💻 Étape 4: Intégrer dans App.tsx

### Option A: Utilisation Ultra-Simple avec le Hook (Recommandé)

Remplacez votre `App.tsx` par :

```tsx
import { ModelDownloadDialog } from '@/components/model-download';
import { useModelDownload } from '@/hooks/use-model-download';

function App() {
  const {
    showDialog,
    isChecking,
    isReady,
    cancelDownload,
    retryDownload,
  } = useModelDownload();

  // Écran de chargement
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Vérification du modèle...</p>
      </div>
    );
  }

  return (
    <>
      {/* Votre app */}
      {isReady && <YourMainApp />}

      {/* Dialogue de téléchargement */}
      <ModelDownloadDialog
        isOpen={showDialog}
        onCancel={cancelDownload}
        onRetry={retryDownload}
      />
    </>
  );
}

export default App;
```

### Option B: Utilisation Manuelle avec ModelService

```tsx
import { useState, useEffect } from 'react';
import { ModelDownloadDialog } from '@/components/model-download';
import { ModelService } from '@/services/model-service';

function App() {
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    checkModel();
  }, []);

  const checkModel = async () => {
    const status = await ModelService.checkModelStatus();

    if (status.status === 'missing' || status.status === 'corrupted') {
      setShowDialog(true);
      await ModelService.downloadParakeetModel();
    }
  };

  return (
    <>
      <YourApp />
      <ModelDownloadDialog
        isOpen={showDialog}
        onCancel={async () => {
          await ModelService.cancelDownload();
          setShowDialog(false);
        }}
        onRetry={async () => {
          await ModelService.downloadParakeetModel();
        }}
      />
    </>
  );
}
```

## 🧪 Étape 5: Tester l'Intégration

### Test Manuel

1. **Supprimer le modèle existant (si présent) :**
   ```bash
   rm -rf ~/.splice/models/parakeet-tdt-0.6b-v3/
   ```

2. **Lancer l'application :**
   ```bash
   pnpm tauri dev
   ```

3. **Vérifier que :**
   - ✅ Le dialogue de téléchargement apparaît automatiquement
   - ✅ La barre de progression s'anime de 0% à 100%
   - ✅ La vitesse de téléchargement s'affiche (MB/s)
   - ✅ Le temps restant est calculé automatiquement
   - ✅ Le bouton "Annuler" fonctionne
   - ✅ En cas d'erreur, le bouton "Réessayer" apparaît

### Tests Automatisés

```bash
# Tests unitaires du composant
pnpm test ModelDownloadDialog.test.tsx

# Tests du hook
pnpm test use-model-download.test.ts

# Tous les tests
pnpm test
```

## 🎨 Personnalisation

### Modifier les Couleurs

Éditez `tailwind.config.js` pour changer les couleurs :

```js
colors: {
  primary: '#your-color',        // Couleur principale (barre de progression)
  'background-dark': '#1A1A1F',  // Fond du dialogue (dark mode)
  'card-dark': '#232429',        // Fond de carte
}
```

### Modifier les Textes

Éditez directement dans `ModelDownloadDialog.tsx` :

```tsx
<AlertDialogTitle>
  Votre Titre Personnalisé
</AlertDialogTitle>
```

### Désactiver l'Annulation à >90%

Par défaut, le bouton "Annuler" est désactivé à >90% pour éviter la corruption. Pour changer :

```tsx
disabled={isDownloading && progress.percentage > 90}
//                                              ^^^ Changer cette valeur
```

## 🚨 Troubleshooting

### Le dialogue ne s'affiche pas

**Vérifiez :**
1. Les commandes Tauri sont bien enregistrées dans `main.rs` :
   ```rust
   .invoke_handler(tauri::generate_handler![
       check_model_status,
       download_parakeet_model,
       cancel_model_download,
   ])
   ```

2. Le backend Rust est bien implémenté (voir story 2-1)

### Erreur "Cannot find module '@/components/ui/...'"

**Solution :** Installez les composants shadcn/ui manquants :
```bash
pnpm dlx shadcn-ui@latest add alert-dialog progress button
```

### Erreur "Cannot find module 'lucide-react'"

**Solution :** Installez Lucide React :
```bash
pnpm add lucide-react
```

### La progression ne s'affiche pas

**Vérifiez :**
1. Le backend émet bien les événements `model:download_progress`
2. Les événements sont au bon format (voir README.md)
3. Ouvrez la console DevTools pour voir les erreurs

### Le dark mode ne fonctionne pas

**Solution :** Ajoutez la classe `dark` au HTML :
```tsx
// Dans votre layout principal
<html className="dark">
  {/* ... */}
</html>
```

## 📚 Ressources

- [README Complet](src/components/model-download/README.md)
- [Exemple d'Utilisation](src/examples/ModelDownloadExample.tsx)
- [Design Original](../../../designs/splice_transcription_engine_download/code.html)
- [Story 2.1](../../_bmad-output/implementation-artifacts/2-1-parakeet-model-download-infrastructure.md)

## ✅ Checklist d'Intégration

- [ ] Dépendances installées (shadcn/ui + lucide-react)
- [ ] Tailwind config vérifié
- [ ] Alias de chemin configurés
- [ ] App.tsx modifié avec `useModelDownload`
- [ ] Backend Rust implémenté (commandes Tauri)
- [ ] Tests unitaires passent
- [ ] Test manuel effectué (supprimer modèle + relancer app)
- [ ] Dialogue apparaît et téléchargement fonctionne
- [ ] Bouton annuler fonctionne
- [ ] Bouton réessayer fonctionne en cas d'erreur

## 🎉 Prochaines Étapes

Une fois l'UI intégrée, vous pouvez passer à :

1. **Implémentation Backend Rust** (si pas encore fait)
   - Voir story 2-1 pour l'implémentation complète
   - Ou lancer `/dev-story` pour implémentation automatique

2. **Story 2.2** - Transcription Backend Integration
   - Intégrer le modèle Parakeet dans le backend Rust
   - Utiliser `parakeet-rs` ou `ort` pour l'inférence

3. **Tests E2E**
   - Ajouter tests Playwright pour le workflow complet
   - Scénarios : premier lancement, échec réseau, retry

---

**Besoin d'aide ?** Consultez le [README du composant](src/components/model-download/README.md) pour plus de détails.
