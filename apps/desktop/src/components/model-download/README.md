# Model Download Dialog Component

Composant React pour gérer le téléchargement automatique du modèle de transcription Parakeet TDT 0.6B v3.

## 📋 Vue d'Ensemble

Ce composant affiche un dialogue modal élégant lors du premier lancement de l'application pour télécharger le modèle de transcription Parakeet (~670 MB). Il fournit un feedback visuel en temps réel avec :

- Barre de progression (0-100%)
- Vitesse de téléchargement (MB/s)
- Temps restant estimé
- Possibilité d'annuler ou réessayer en cas d'erreur

## 🎨 Design

Le composant suit le design fourni dans `/designs/splice_transcription_engine_download/code.html` avec :

- Icône cloud download (Lucide React)
- Barre de progression de 8px de hauteur
- Pourcentage en police tabular-nums
- Support dark mode complet
- Responsive (max-width: 520px)

## 🚀 Installation

### 1. Installer les Dépendances

```bash
# Composants shadcn/ui
pnpm dlx shadcn-ui@latest add alert-dialog
pnpm dlx shadcn-ui@latest add progress
pnpm dlx shadcn-ui@latest add button

# Icônes Lucide React
pnpm add lucide-react
```

### 2. Configuration Tailwind

Assurez-vous que `tailwind.config.js` contient les couleurs nécessaires :

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#1580f9',
        'background-dark': '#1A1A1F',
        'card-dark': '#232429',
        'surface-dark': '#2A2B32',
      },
    },
  },
};
```

## 💻 Utilisation

### Utilisation Basique

```tsx
import { ModelDownloadDialog } from '@/components/model-download';

function App() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <ModelDownloadDialog
      isOpen={showDialog}
      onCancel={() => setShowDialog(false)}
      onRetry={() => console.log('Retry download')}
    />
  );
}
```

### Intégration au Démarrage de l'App

Voir l'exemple complet dans `/examples/ModelDownloadExample.tsx` pour une intégration complète avec vérification du statut du modèle au démarrage.

```tsx
import { useEffect, useState } from 'react';
import { ModelDownloadDialog } from '@/components/model-download';
import { ModelService } from '@/services/model-service';

function App() {
  const [showDownload, setShowDownload] = useState(false);

  useEffect(() => {
    checkModel();
  }, []);

  const checkModel = async () => {
    const status = await ModelService.checkModelStatus();

    if (status.status === 'missing') {
      setShowDownload(true);
      await ModelService.downloadParakeetModel();
    }
  };

  return (
    <>
      {/* Votre app */}
      <ModelDownloadDialog
        isOpen={showDownload}
        onCancel={handleCancel}
        onRetry={handleRetry}
      />
    </>
  );
}
```

## 📡 Événements Tauri

Le composant écoute les événements Tauri suivants émis depuis le backend Rust :

### `model:download_progress`

Émis périodiquement pendant le téléchargement.

```typescript
interface DownloadProgress {
  downloaded: number;      // Bytes téléchargés
  total: number;           // Total bytes (670,000,000)
  percentage: number;      // Pourcentage (0-100)
  speed_mbps: number;      // Vitesse en MB/s
}
```

**Backend Rust :**
```rust
app_handle.emit_all("model:download_progress", DownloadProgress {
    downloaded,
    total: 670_000_000,
    percentage: (downloaded as f64 / 670_000_000.0) * 100.0,
    speed_mbps: calculate_speed(downloaded, elapsed),
})?;
```

### `model:download_failed`

Émis en cas d'échec du téléchargement.

```typescript
interface DownloadError {
  message: string;
}
```

**Backend Rust :**
```rust
app_handle.emit_all("model:download_failed", {
    message: "Échec du téléchargement après 3 tentatives"
})?;
```

### `model:download_completed`

Émis lorsque le téléchargement est terminé avec succès.

```rust
app_handle.emit_all("model:download_completed", {})?;
```

## 🔧 API du Service

### `ModelService.checkModelStatus()`

Vérifie le statut actuel du modèle.

```typescript
const status = await ModelService.checkModelStatus();
// Returns: { name, version, status, total_size_bytes, downloaded_at? }
```

**Statuts possibles :**
- `'missing'` - Modèle non téléchargé
- `'downloading'` - Téléchargement en cours
- `'ready'` - Modèle prêt à l'utilisation
- `'corrupted'` - Modèle corrompu (checksum invalide)

### `ModelService.downloadParakeetModel()`

Lance le téléchargement du modèle Parakeet.

```typescript
await ModelService.downloadParakeetModel();
```

### `ModelService.cancelDownload()`

Annule le téléchargement en cours.

```typescript
await ModelService.cancelDownload();
```

## 🧪 Tests

Exécuter les tests unitaires :

```bash
pnpm test ModelDownloadDialog.test.tsx
```

Tests couverts :
- ✅ Rendu du dialogue ouvert/fermé
- ✅ Affichage de la progression
- ✅ Bouton annuler et callback
- ✅ Gestion des erreurs
- ✅ Bouton réessayer en cas d'échec

## 📝 Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `isOpen` | `boolean` | `false` | Contrôle l'affichage du dialogue |
| `onCancel` | `() => void` | `undefined` | Callback lors du clic sur "Annuler" |
| `onRetry` | `() => void` | `undefined` | Callback lors du clic sur "Réessayer" (après erreur) |

## 🎯 Calculs Automatiques

### Temps Restant

Le composant calcule automatiquement le temps restant basé sur :
- Bytes restants = `total - downloaded`
- Vitesse actuelle en MB/s
- Affichage en secondes (<60s) ou minutes (≥60s)

```typescript
const remainingBytes = total - downloaded;
const remainingMB = remainingBytes / (1024 * 1024);
const secondsRemaining = remainingMB / speed_mbps;
```

### Vitesse de Téléchargement

Formatée avec 1 décimale :
```typescript
const formatSpeed = (speedMbps: number) => `${speedMbps.toFixed(1)} MB/s`;
```

## 🔒 Sécurité

- ✅ Validation checksum SHA-256 dans le backend Rust
- ✅ Retry automatique avec exponential backoff (3 tentatives)
- ✅ Annulation désactivée à >90% (éviter corruption)
- ✅ Streaming vers disque (pas de buffer RAM complet)

## 📚 Références

- [Design Original](/designs/splice_transcription_engine_download/code.html)
- [Story 2.1](_bmad-output/implementation-artifacts/2-1-parakeet-model-download-infrastructure.md)
- [shadcn/ui AlertDialog](https://ui.shadcn.com/docs/components/alert-dialog)
- [shadcn/ui Progress](https://ui.shadcn.com/docs/components/progress)
- [Lucide React Icons](https://lucide.dev/icons/)
