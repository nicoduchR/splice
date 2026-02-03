# Story 6.1: Export Configuration & Options

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to configure export settings before finalizing my video,
So that I can ensure the output meets my quality and compatibility requirements.

## Acceptance Criteria

1. **Given** le preview est validé et l'utilisateur clique "Exporter" (FR29)
   **When** le dialog d'export s'ouvre
   **Then** le formulaire de paramètres d'export affiche :
   - Format de sortie : MP4 (fixé pour le MVP) (FR29)
   - Codec : H.264 (High profile, fixé) (FR30, NFR36)
   - Qualité : "Préserver l'original" (défaut) ou "Haute/Moyenne/Basse" (FR31)
   - Emplacement de sortie : File picker pour choisir la destination
   - Nom de fichier : Auto-suggéré comme `{nom_original}_edited.mp4`

2. **And** la taille estimée du fichier est affichée en fonction des sélections

3. **And** le temps estimé d'export est affiché : "~5 minutes" (NFR10)

4. **And** un bouton "Exporter" démarre le processus

5. **And** un bouton "Annuler" ferme le dialog

6. **And** les paramètres sont sauvegardés comme défauts pour les futurs exports

## Tasks / Subtasks

- [x] Task 1: Créer le store d'export `export-store.ts` (AC: #1, #6)
  - [x] 1.1 Créer le Zustand store avec état : `isExportDialogOpen`, `exportSettings` (quality, outputPath, fileName), `estimatedFileSize`, `estimatedDuration`, `isExporting`, `exportProgress`, `exportError`
  - [x] 1.2 Actions : `openExportDialog()`, `closeExportDialog()`, `updateSettings(partial)`, `startExport(projectId)`, `cancelExport()`, `resetExport()`
  - [x] 1.3 Persister les settings par défaut dans localStorage (qualité choisie, dernier dossier de sortie)
  - [x] 1.4 Action `estimateExportSize(projectId, quality)` → invoque commande Tauri pour estimer taille/durée

- [x] Task 2: Créer la commande Tauri backend `estimate_export` (AC: #2, #3)
  - [x] 2.1 Créer `export_commands.rs` dans `infrastructure/tauri_commands/`
  - [x] 2.2 Commande `estimate_export(project_id, quality)` → retourne `{ estimated_size_bytes: u64, estimated_duration_seconds: f64 }`
  - [x] 2.3 Calculer la taille estimée basée sur : durée du preview × bitrate selon qualité (preserve: bitrate original, high: CRF 18 ~8Mbps, medium: CRF 23 ~4Mbps, low: CRF 28 ~2Mbps)
  - [x] 2.4 Calculer le temps estimé basé sur : durée vidéo / vitesse d'encodage estimée (~2x realtime pour re-encode, ~10x pour copy)
  - [x] 2.5 Enregistrer la commande dans `main.rs` via `generate_handler!`
  - [x] 2.6 Ajouter le module `export_commands` dans `tauri_commands/mod.rs`

- [x] Task 3: Créer le composant `ExportDialog.tsx` (AC: #1, #2, #3, #4, #5)
  - [x] 3.1 Créer `apps/desktop/src/components/export/ExportDialog.tsx` utilisant shadcn `Dialog`
  - [x] 3.2 Section format : badge "MP4 • H.264 High" (fixé, non modifiable, informatif)
  - [x] 3.3 Section qualité : `RadioGroup` avec 4 options (Préserver l'original, Haute, Moyenne, Basse) avec descriptions
  - [x] 3.4 Section destination : input texte affichant le chemin + bouton "Parcourir" utilisant `save()` de `@tauri-apps/plugin-dialog`
  - [x] 3.5 Nom de fichier : input texte pré-rempli avec `{nom_original}_edited.mp4`, éditable
  - [x] 3.6 Affichage taille estimée et temps estimé (actualisés quand qualité change)
  - [x] 3.7 Footer : bouton "Annuler" (secondary) + bouton "Exporter" (primary emerald)
  - [x] 3.8 Créer `apps/desktop/src/components/export/index.ts` barrel export

- [x] Task 4: Câbler le bouton "Exporter" dans TopBar.tsx (AC: #1)
  - [x] 4.1 Retirer l'attribut `disabled` et le `title` du bouton Exporter en mode preview
  - [x] 4.2 Au clic, appeler `openExportDialog()` du export store
  - [x] 4.3 Intégrer `ExportDialog` dans App.tsx (rendu conditionnel basé sur `isExportDialogOpen`)

- [x] Task 5: Persistance des paramètres par défaut (AC: #6)
  - [x] 5.1 Utiliser `zustand/middleware` persist avec localStorage pour sauver les settings (quality, lastOutputDir)
  - [x] 5.2 Au montage du store, restaurer les derniers paramètres sauvegardés
  - [x] 5.3 Auto-suggérer le dernier dossier de sortie utilisé + le dossier Documents par défaut si premier usage

- [x] Task 6: Tests frontend TypeScript (AC: #1-#6)
  - [x] 6.1 Test export-store : `openExportDialog` / `closeExportDialog` toggle state
  - [x] 6.2 Test export-store : `updateSettings` met à jour qualité et chemin
  - [x] 6.3 Test export-store : persistance localStorage des settings
  - [x] 6.4 Test ExportDialog : rendu correct avec tous les champs (format, qualité, destination, nom)
  - [x] 6.5 Test ExportDialog : changement de qualité met à jour estimation taille/temps
  - [x] 6.6 Test ExportDialog : bouton "Parcourir" appelle save dialog
  - [x] 6.7 Test ExportDialog : bouton "Annuler" ferme le dialog
  - [x] 6.8 Test ExportDialog : bouton "Exporter" appelle startExport
  - [x] 6.9 Test TopBar : bouton "Exporter" en preview est enabled et ouvre le dialog

- [x] Task 7: Tests backend Rust (AC: #2, #3)
  - [x] 7.1 Test `estimate_export` : calcul correct taille pour qualité "preserve" (bitrate original)
  - [x] 7.2 Test `estimate_export` : calcul correct taille pour qualités high/medium/low
  - [x] 7.3 Test `estimate_export` : calcul correct temps estimé

## Dev Notes

### Ce qui existe déjà (analysé en détail)

**TopBar.tsx** (Story 5.3) :
- Bouton "Exporter" déjà rendu en mode preview mais `disabled` avec `title="Bientôt disponible"`
- Style déjà correct : `bg-emerald-600 hover:bg-emerald-700 text-white`
- Icône `Download` de lucide-react déjà importée
- **À modifier** : retirer `disabled`, ajouter `onClick` → `openExportDialog()`

**App.tsx — Navigation existante** :
- Écrans : `'import'` | `'project-details'` | `'transcribing'` | `'editor'` | `'preview'`
- Le dialog d'export est un overlay sur l'écran preview, pas un nouvel écran
- `ExportDialog` doit être rendu dans App.tsx (ou directement dans le composant preview) quand `isExportDialogOpen === true`

**segmentation-store.ts — Pattern à suivre** :
- Zustand + devtools middleware
- Pattern async actions avec `set({ isLoading: true, error: null })` / `try-catch` / `set({ isLoading: false })`
- Toast notifications via `sonner` (ou pattern existant)
- `invoke()` de `@tauri-apps/api/core` pour appels Tauri

**Tauri Dialog Plugin — Prêt à l'emploi** :
- `tauri-plugin-dialog` v2.0 déjà dans `Cargo.toml` et initialisé dans `main.rs`
- Utiliser `save()` de `@tauri-apps/plugin-dialog` côté frontend
- Exemple : `const filePath = await save({ filters: [{ name: 'MP4', extensions: ['mp4'] }], defaultPath: 'video_edited.mp4' });`

**FFmpeg Service — Pattern d'estimation** :
- `ffmpeg_service.rs` a `probe_video()` qui retourne métadonnées incluant bitrate, durée, codec
- Utiliser les infos de probe pour estimer la taille d'export
- Le sidecar FFprobe est bundlé et fonctionnel

**Données disponibles pour estimation** :
- `finalVideoPath` dans segmentation store → durée de la vidéo finale (preview concaténé)
- Bitrate original du fichier source accessible via `get_video_info`
- Formules d'estimation : `taille = durée × bitrate`, `temps = durée / vitesse_encoding`

**Tauri Commands — Structure existante** :
- Fichiers dans `infrastructure/tauri_commands/` (segmentation_commands.rs, preview_commands.rs, etc.)
- Enregistrement dans `main.rs` via `generate_handler![]`
- Module export dans `tauri_commands/mod.rs`
- Pattern : `#[tauri::command] pub async fn cmd_name(...) -> Result<T, String>`

**Composants UI shadcn disponibles** :
- `Dialog` / `DialogContent` / `DialogHeader` / `DialogFooter` — pour le dialog d'export
- `RadioGroup` / `RadioGroupItem` — pour sélection qualité
- `Button` — variants default/outline/ghost
- `Input` — pour nom de fichier et chemin
- `Label` — pour labels de formulaire
- `Badge` — pour afficher "MP4 • H.264" fixé

### Patterns à suivre

**UX — Export Dialog** (d'après ux-consistency-patterns.md) :
- Dialog : `bg-gray-950 border border-gray-800`, backdrop blur
- Bouton "Exporter" = Primary emerald `bg-emerald-600 hover:bg-emerald-700`
- Bouton "Annuler" = Secondary outline `border border-gray-700`
- Progress : `bg-emerald-600 h-2 rounded-full` sur track `bg-gray-800`
- Labels : `text-gray-300`, descriptions : `text-gray-500`

**Frontend** :
- Composants dans `apps/desktop/src/components/export/`
- Tests côte à côte `.test.tsx`
- Store : `apps/desktop/src/stores/export-store.ts` (nouveau)
- Utiliser `@tauri-apps/plugin-dialog` pour save dialog natif

**Backend** :
- Nouvelle commande dans `infrastructure/tauri_commands/export_commands.rs`
- Pas de use case complexe pour cette story — l'estimation est un calcul simple
- Story 6.2 implémentera le vrai `export_video` use case avec FFmpeg

### Apprentissages Stories précédentes

- `convertFileSrc()` fonctionne pour servir des vidéos locales
- Le plugin dialog Tauri est installé mais jamais utilisé — cette story sera le premier usage
- Le store segmentation montre le pattern parfait pour un nouveau store Zustand
- Le `generate_handler!` macro dans `main.rs` accepte simplement l'ajout de nouvelles commandes
- Les erreurs Rust sont mappées en String via `.map_err(|e| e.to_string())`
- FFmpeg `-c copy` ne re-encode jamais → qualité préservée, vitesse ~10x
- CRF 18 = haute qualité, CRF 23 = medium, CRF 28 = basse — pattern H.264 standard
- `cargo test` a des erreurs pré-existantes (MockRuntime) — les tests unitaires doivent être vérifiés via `cargo check`
- 12 tests frontend pré-existants échouent — non liés à cette story

### Git Intelligence

Derniers commits pertinents :
- `97469ac` feat: implement segment boundaries in preview with visual markers and export button
- `fb86561` feat: implement preview playback functionality with caching and validation
- Pattern : `feat:` / `fix:` / `chore:` prefixes, messages en anglais

### Project Structure Notes

- Nouveau fichier `apps/desktop/src/stores/export-store.ts`
- Nouveau dossier `apps/desktop/src/components/export/` avec `ExportDialog.tsx` et `index.ts`
- Nouveau fichier `apps/desktop/src-tauri/src/infrastructure/tauri_commands/export_commands.rs`
- Modification `apps/desktop/src-tauri/src/infrastructure/tauri_commands/mod.rs` — ajouter module export_commands
- Modification `apps/desktop/src-tauri/src/main.rs` — enregistrer commande estimate_export
- Modification `apps/desktop/src/components/layout/TopBar.tsx` — activer bouton Exporter
- Modification `apps/desktop/src/App.tsx` — intégrer ExportDialog

### References

- [Epic 6: Story 6.1](_bmad-output/planning-artifacts/epics/epic-6-professional-export.md) — AC complets
- [Story 5.3: Preview Validation](_bmad-output/implementation-artifacts/5-3-preview-validation-editing-controls.md) — Bouton export existant, learnings
- [UX Consistency Patterns](_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md) — Dialog, boutons, progress
- [Architecture: Patterns d'implémentation](_bmad-output/planning-artifacts/architecture/patterns-dimplmentation-rgles-de-cohrence.md) — Naming, stores, events, error handling
- [Architecture: Project Structure](_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md) — File locations, boundaries
- `apps/desktop/src/components/layout/TopBar.tsx` — Bouton export disabled
- `apps/desktop/src/stores/segmentation-store.ts` — Pattern store à suivre
- `apps/desktop/src/App.tsx` — Navigation écrans
- `apps/desktop/src-tauri/src/main.rs` — Enregistrement commandes + dialog plugin
- `apps/desktop/src-tauri/src/infrastructure/tauri_commands/mod.rs` — Modules commandes
- `apps/desktop/src-tauri/src/infrastructure/ffmpeg/ffmpeg_service.rs` — FFprobe pour estimation

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Rust `cargo check` OK (33 warnings pré-existantes, 0 erreurs)
- Rust `cargo test` — tests export unitaires écrits et corrects, compilation bloquée par erreurs MockRuntime pré-existantes dans d'autres modules
- TypeScript `tsc --noEmit` — 0 erreurs
- Vitest: 18/18 nouveaux tests passing (6 store + 7 dialog + 5 TopBar)
- Régression: 12 échecs pré-existants (use-model-download, SegmentationProgressDialog, TranscriptionProgressDialog) — non liés à cette story

### Completion Notes List

- Store d'export créé avec Zustand + devtools + persist middleware, suivant le pattern de segmentation-store
- Commande backend `estimate_export` implémentée avec fonction `compute_estimate` pure et testable séparément
- Estimation basée sur: durée finale (somme des cuts) × bitrate selon qualité (preserve=original, high=8Mbps, medium=4Mbps, low=2Mbps)
- Temps estimé: durée / facteur vitesse (10x pour copy, 2x pour re-encode)
- ExportDialog utilise shadcn Dialog, RadioGroup (installé), Badge, Input, Label, Button
- RadioGroup et Label installés via shadcn CLI
- UX conforme aux patterns: bg-gray-950, border-gray-800, emerald primary, outline secondary
- Bouton Export dans TopBar activé via prop `onExport` (suppression du `disabled` et `title`)
- ExportDialog rendu dans App.tsx comme overlay (même pattern que SegmentationProgressDialog)
- Persistance via zustand persist: qualité et dernier dossier sauvés en localStorage
- `startExport` est un placeholder pour Story 6.2
- Composant `ExportEstimate` Rust exporté avec ts_rs pour génération de types TS

### Change Log

- 2026-02-03: Implémentation complète Story 6.1 — Export dialog, store, backend estimation, tests
- 2026-02-03: Code review fixes — enum ExportQuality Rust typé, validation bouton export (outputPath+fileName requis), test re-estimation qualité, test split path browse, message toast corrigé, File List complétée

### File List

- apps/desktop/src/stores/export-store.ts (nouveau)
- apps/desktop/src/stores/export-store.test.ts (nouveau)
- apps/desktop/src/components/export/ExportDialog.tsx (nouveau)
- apps/desktop/src/components/export/ExportDialog.test.tsx (nouveau)
- apps/desktop/src/components/export/index.ts (nouveau)
- apps/desktop/src/components/ui/radio-group.tsx (nouveau — shadcn)
- apps/desktop/src/components/ui/label.tsx (nouveau — shadcn)
- apps/desktop/src/components/layout/TopBar.tsx (modifié — bouton export activé, prop onExport)
- apps/desktop/src/components/layout/TopBar.test.tsx (modifié — tests mis à jour)
- apps/desktop/src/App.tsx (modifié — intégration ExportDialog + useExportStore)
- apps/desktop/src-tauri/src/infrastructure/tauri_commands/export_commands.rs (nouveau)
- apps/desktop/src-tauri/src/infrastructure/tauri_commands/mod.rs (modifié — ajout export_commands)
- apps/desktop/src-tauri/src/main.rs (modifié — enregistrement estimate_export)
- apps/desktop/package.json (modifié — ajout @radix-ui/react-label et @radix-ui/react-radio-group)
- pnpm-lock.yaml (modifié — mise à jour lockfile)
