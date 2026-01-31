# Tech Debt: Code Cleanup & Quality Improvements

**Priority:** P2 (Medium - Non-blocking, but important for maintainability)
**Story Type:** Technical Debt / Refactoring
**Estimated Effort:** 2-3 hours

## Objectif

Nettoyer le code technique accumulé pendant le développement rapide des stories 1.x et 2.1. Supprimer les annotations temporaires, code mort, et améliorer la qualité générale du codebase.

## Motivation

- Code plus maintenable et professionnel
- Facilite l'onboarding de nouveaux développeurs
- Réduit les warnings de compilation
- Prépare le terrain pour les stories futures

## Tâches de nettoyage

### 🦀 Backend Rust

#### 1. Supprimer les `#[allow(dead_code)]` temporaires

**Fichiers concernés:**
- `src/domain/entities/mod.rs` - Transcript, TranscriptWord, ModelMetadata, ModelStatus
- `src/domain/entities/transcript.rs` - TranscriptWord, Transcript
- `src/domain/value_objects/timecode.rs` - Timecode + impl methods
- `src/domain/value_objects/mod.rs` - Timecode export
- `src/application/use_cases/mod.rs` - GetVideoInfoUseCase
- `src/application/ports/mod.rs` - ModelDownloader
- `src/infrastructure/adapters/mod.rs` - MockVideoRepository, HuggingFaceModelManager
- `src/infrastructure/adapters/model_manager.rs` - PARAKEET_MODEL_NAME constant

**Action:** Supprimer les annotations `#[allow(dead_code)]` et `#[allow(unused_imports)]` une fois que le code est utilisé dans les stories de transcription (Story 2.2+).

#### 2. Fixer les tests cassés

**Fichiers concernés:**
- `src/infrastructure/ffmpeg/ffmpeg_service.rs` - Tests utilisant `tauri::test::mock_app()`
- `src/application/use_cases/import_video.rs` - Tests avec mock_app

**Problème:** Les tests utilisent `let app = tauri::test::mock_app()` mais les fonctions attendent `&AppHandle<R>`.

**Solution:**
```rust
let app = tauri::test::mock_app();
let app_handle = app.handle();
service.probe_video_format(app_handle, path).await
```

**Commande pour vérifier:**
```bash
cd apps/desktop/src-tauri
cargo test
```

#### 3. Supprimer code mort identifié

**Classes/structs jamais utilisés:**
- `MockVideoRepository` - Supprimé ou intégré dans les tests
- `GetVideoInfoUseCase` - À supprimer si vraiment pas nécessaire, ou implémenter

**Méthodes jamais utilisées:**
- `VideoRepository::delete()` - À implémenter ou marquer comme TODO

#### 4. Améliorer la gestion des erreurs

**Fichier:** `src/infrastructure/adapters/model_manager.rs`

**Problème actuel:**
- Utilise beaucoup de `.map_err()` avec conversion de strings
- Erreurs peu typées

**Solution:** Créer des types d'erreurs dédiés:
```rust
#[derive(Debug, thiserror::Error)]
pub enum ModelDownloadError {
    #[error("Failed to download file {0}: {1}")]
    DownloadFailed(String, String),
    #[error("Checksum validation failed for {0}")]
    ChecksumMismatch(String),
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
}
```

#### 5. Remplacer PLACEHOLDER_HASH par checksums réels

**Fichier:** `src/infrastructure/adapters/model_manager.rs`

**Action:**
```bash
# Calculer les checksums réels
cd ~/.splice/models/parakeet-tdt-0.6b-v3
shasum -a 256 *.onnx
shasum -a 256 vocab.txt
```

Puis remplacer dans le code:
```rust
const MODEL_CHECKSUMS: &[(&str, &str)] = &[
    ("encoder-model.onnx", "abc123..."),  // Vrai SHA-256
    ("encoder-model.onnx.data", "def456..."),
    ("decoder_joint-model.onnx", "ghi789..."),
    ("vocab.txt", "jkl012..."),
];
```

#### 6. Nettoyer les imports inutilisés

**Commande pour trouver:**
```bash
cargo clippy -- -W unused_imports
```

### ⚛️ Frontend TypeScript/React

#### 1. Supprimer les logs de debug

**Fichiers concernés:**
- `src/hooks/use-model-download.ts` - Logs console.log('🔍 Checking Tauri...', '📡 Calling...', etc.)
- `src/services/model-service.ts` - Logs console.log('🔍 Invoking...', '✅ check_model_status returned...', etc.)

**Action:** Garder seulement les logs d'erreurs, supprimer les logs de debug verbose.

#### 2. Fixer warnings Radix UI

**Warning actuel:**
```
`AlertDialogContent` requires a description for the component to be accessible
```

**Fichier:** `src/components/model-download/ModelDownloadDialog.tsx`

**Solution:**
```tsx
<AlertDialogContent className="..." aria-describedby="download-description">
  <AlertDialogHeader>
    <AlertDialogTitle>...</AlertDialogTitle>
    <AlertDialogDescription id="download-description" className="sr-only">
      Téléchargement du modèle de transcription Parakeet depuis HuggingFace
    </AlertDialogDescription>
  </AlertDialogHeader>
  {/* ... */}
</AlertDialogContent>
```

#### 3. Nettoyer fichiers exemples

**Fichiers à supprimer (si plus nécessaires):**
- `src/App-with-model-download.example.tsx` - Exemple d'intégration, déjà intégré dans App.tsx
- `src/examples/*` - Dossier d'exemples si vide ou obsolète

#### 4. TypeScript strict mode

**Fichier:** `apps/desktop/tsconfig.json`

**Activer progressivement:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

Puis fixer les erreurs qui apparaissent.

### 📝 Documentation

#### 1. Mettre à jour README

**Fichier:** `apps/desktop/README.md` ou `SETUP-MODEL-DOWNLOAD.md`

**Ajouter:**
- Documentation sur le système de téléchargement du modèle
- Comment tester manuellement le workflow
- Comment calculer les checksums
- Troubleshooting commun

#### 2. Ajouter JSDoc/comments manquants

**Fichiers:** Fonctions complexes dans:
- `src/infrastructure/adapters/model_manager.rs`
- `src/hooks/use-model-download.ts`

### 🧪 Tests

#### 1. Ajouter tests unitaires manquants

**Frontend:**
- Tests pour `useModelDownload` hook
- Tests pour `ModelService`
- Tests du composant `ModelDownloadDialog`

**Backend:**
- Tests d'intégration pour le workflow complet de téléchargement
- Tests des retry avec backoff
- Tests de validation checksum avec vrais fichiers

#### 2. Fixer tests existants cassés

Voir section "Fixer les tests cassés" ci-dessus.

### 🔧 Configuration

#### 1. Optimiser les dépendances

**Vérifier les dépendances inutilisées:**
```bash
# Frontend
cd apps/desktop
pnpm depcheck

# Backend
cd apps/desktop/src-tauri
cargo machete
```

#### 2. Configurer pre-commit hooks

**Ajouter `.git/hooks/pre-commit`:**
```bash
#!/bin/bash
# Run linters before commit
cd apps/desktop
pnpm lint
cd src-tauri
cargo clippy -- -D warnings
cargo fmt --check
```

## Critères d'acceptation

- ✅ Compilation sans warnings (`cargo build` et `pnpm build`)
- ✅ Tous les tests passent (`cargo test` et `pnpm test`)
- ✅ Pas de `#[allow(dead_code)]` ou `#[allow(unused_imports)]` dans le code production
- ✅ Code mort supprimé ou implémenté
- ✅ Checksums réels en place
- ✅ Logs de debug frontend nettoyés
- ✅ Warnings d'accessibilité fixés
- ✅ Documentation à jour

## Priorité d'exécution

**Phase 1 (Critique - avant production):**
1. Remplacer PLACEHOLDER_HASH par checksums réels
2. Fixer warnings d'accessibilité
3. Supprimer logs de debug verbose

**Phase 2 (Important - avant Story 2.2):**
4. Fixer tests cassés
5. Supprimer `#[allow(dead_code)]` une fois code utilisé
6. Améliorer gestion des erreurs

**Phase 3 (Nice-to-have):**
7. TypeScript strict mode
8. Pre-commit hooks
9. Tests unitaires supplémentaires

## Notes

- Ne pas tout faire d'un coup - itérer progressivement
- Prioriser ce qui bloque les prochaines stories
- Garder les commits atomiques et bien nommés
- Tester après chaque cleanup pour éviter de casser des choses

## Checklist finale avant de clore

- [ ] `cargo build` - 0 warnings
- [ ] `cargo test` - All tests pass
- [ ] `cargo clippy` - 0 warnings
- [ ] `pnpm build` - 0 errors
- [ ] `pnpm test` - All tests pass
- [ ] `pnpm lint` - 0 errors
- [ ] Checksums réels en place
- [ ] Documentation README à jour
- [ ] Code reviewed par un pair (si équipe)
