# UX Consistency Patterns

## Button Hierarchy

**Primary Actions (Emerald Green)**

**When to Use:** Actions principales qui font progresser le workflow utilisateur (Générer les cuts, Exporter la vidéo).

**Visual Design:**
- Background: `bg-emerald-600 hover:bg-emerald-700`
- Text: `text-white font-medium`
- Padding: `px-6 py-2.5`
- Border radius: `rounded-md` (6px)
- Shadow: `shadow-sm hover:shadow-md`

**Behavior:**
- Hover: Darkening + shadow elevation
- Active: Scale down `scale-95` + shadow-inner
- Disabled: `opacity-50 cursor-not-allowed`
- Loading: Spinner icon + "Processing..." text

**Accessibility:**
- ARIA: `role="button"` avec `aria-busy="true"` pendant loading
- Keyboard: `Enter` et `Space` pour activation
- Focus: Ring visible `focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2`

**Mobile Considerations:**
- Min height 44px pour touch target
- Espacement 8px minimum entre boutons

**Variants:**
```typescript
// Shadcn Button variants
<Button variant="default" size="default">Générer les cuts</Button>
<Button variant="default" size="sm">Exporter</Button>
```

---

**Secondary Actions (Gray Outline)**

**When to Use:** Actions alternatives non-destructives (Annuler, Clear selection, Paramètres).

**Visual Design:**
- Border: `border border-gray-700 hover:border-gray-600`
- Background: `bg-transparent hover:bg-gray-900`
- Text: `text-gray-300 hover:text-gray-100`
- Padding: `px-5 py-2.5`

**Behavior:**
- Hover: Border lightening + subtle background
- Active: Background darkening
- Disabled: `opacity-40 cursor-not-allowed`

**Accessibility:**
- Même standards que Primary
- Contrast ratio minimum 4.5:1 avec background

**Variants:**
```typescript
<Button variant="outline" size="default">Annuler</Button>
<Button variant="outline" size="icon"><Settings /></Button>
```

---

**Ghost Actions (Transparent)**

**When to Use:** Actions tertiaires légères (icône seule, navigation discrète).

**Visual Design:**
- Background: `transparent hover:bg-gray-800`
- Text: `text-gray-400 hover:text-gray-200`
- Padding: `px-3 py-2`

**Behavior:**
- Hover: Subtle background + text lightening
- Active: Background darkening
- Tooltip apparaît après 500ms sur hover

**Accessibility:**
- Toujours accompagné d'un tooltip explicatif
- ARIA label obligatoire si icon-only

**Variants:**
```typescript
<Button variant="ghost" size="icon"><Play /></Button>
```

---

**Danger Actions (Red)**

**When to Use:** Actions destructives irréversibles (Supprimer projet, Réinitialiser).

**Visual Design:**
- Background: `bg-red-600 hover:bg-red-700`
- Text: `text-white`
- Border: Optionnel `border border-red-500`

**Behavior:**
- Toujours précédé d'un modal de confirmation
- Hover: Darkening + warning icon
- Double confirmation pour actions critiques

**Accessibility:**
- ARIA: `aria-label="Action destructive: [description]"`
- Screen reader: Annonce "Warning: [action] cannot be undone"

**Variants:**
```typescript
<Button variant="destructive">Supprimer le projet</Button>
```

---

## Feedback Patterns

**Success Feedback (Toast)**

**When to Use:** Confirmation d'opérations réussies non-bloquantes (Export terminé, Cuts générés).

**Visual Design:**
- Background: `bg-emerald-900 border border-emerald-700`
- Icon: Check circle `text-emerald-500`
- Text: `text-gray-100`
- Position: `fixed bottom-4 right-4`

**Behavior:**
- Slide in from right avec `ease-out`
- Auto-dismiss après 4 secondes
- Stack vertical si multiple toasts (espacement 12px)
- Bouton close optionnel (icône X)

**Accessibility:**
- ARIA: `role="status" aria-live="polite"`
- Keyboard: `Escape` pour dismiss
- Screen reader: Message annoncé automatiquement

**Mobile Considerations:**
- Full width sur mobile (<768px)
- Position `bottom-0 left-0 right-0`

**Variants:**
```typescript
toast.success('Export terminé avec succès', {
  description: '3 vidéos exportées (142MB)',
  duration: 4000,
});
```

---

**Error Feedback (Modal)**

**When to Use:** Erreurs bloquantes nécessitant attention utilisateur (Transcription failed, Export error).

**Visual Design:**
- Background: `bg-gray-950 border border-red-800`
- Title: `text-red-500 font-semibold text-lg`
- Icon: Alert triangle `text-red-500 size-6`
- Description: `text-gray-300`
- Buttons: Secondary (Fermer) + Primary (Retry si applicable)

**Behavior:**
- Backdrop blur `backdrop-blur-sm bg-black/60`
- Modal center screen
- Escape to close (sauf erreurs critiques)
- Focus trap à l'ouverture

**Accessibility:**
- ARIA: `role="alertdialog" aria-modal="true"`
- Focus auto sur bouton primaire à l'ouverture
- Screen reader: Message d'erreur annoncé immédiatement

**Content Pattern:**
```
[Titre Court]: "Transcription échouée"
[Description Explicative]: "Le fichier audio est corrompu ou dans un format non supporté."
[Action Suggérée]: "Vérifiez le fichier et réessayez."
[Boutons]: [Fermer] [Réessayer]
```

**Variants:**
```typescript
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Transcription échouée</AlertDialogTitle>
      <AlertDialogDescription>
        Le fichier audio est corrompu...
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Fermer</AlertDialogCancel>
      <AlertDialogAction>Réessayer</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

**Warning Feedback (Toast)**

**When to Use:** Avertissements non-bloquants (Sélection >30min freemium, Mémoire faible).

**Visual Design:**
- Background: `bg-orange-950 border border-orange-700`
- Icon: Alert circle `text-orange-500`
- Text: `text-gray-100`

**Behavior:**
- Auto-dismiss après 6 secondes (plus long que success)
- Bouton d'action optionnel (ex: "Upgrade")

**Accessibility:**
- ARIA: `role="status" aria-live="polite"`

**Variants:**
```typescript
toast.warning('Limite freemium atteinte', {
  description: 'Upgrade pour exporter des vidéos >30min',
  action: { label: 'Upgrade', onClick: () => showConversionModal() },
  duration: 6000,
});
```

---

**Info Feedback (Toast)**

**When to Use:** Informations neutres (Raccourcis clavier disponibles, Mise à jour disponible).

**Visual Design:**
- Background: `bg-blue-950 border border-blue-700`
- Icon: Info circle `text-blue-500`

**Behavior:**
- Auto-dismiss après 5 secondes

**Variants:**
```typescript
toast.info('Raccourci: Cmd+G pour générer les cuts');
```

---

**Progress Feedback (Determinate)**

**When to Use:** Opérations longues avec durée estimée (Transcription, Export).

**Visual Design:**
- Container: `bg-gray-900 p-4 rounded-lg border border-gray-800`
- Progress bar: `bg-emerald-600 h-2 rounded-full`
- Track: `bg-gray-800`
- Label: `text-gray-300 text-sm`
- Percentage: `text-emerald-500 font-medium`
- Time estimate: `text-gray-500 text-xs`

**Behavior:**
- Smooth animation `transition-all duration-300`
- Update minimum toutes les 500ms (éviter jank)
- Cancel button disponible

**Accessibility:**
- ARIA: `role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100"`
- Screen reader: Annonce % toutes les 10%

**Mobile Considerations:**
- Full width container

**Variants:**
```typescript
<Progress value={percent} className="h-2" />
<div className="flex justify-between text-xs mt-2">
  <span>{percent}% terminé</span>
  <span>~{estimatedTime}s restant</span>
</div>
```

---

**Progress Feedback (Indeterminate)**

**When to Use:** Opérations sans durée estimée (Chargement initial, Processing).

**Visual Design:**
- Spinner: Emerald green `border-t-emerald-600`
- Animation: Rotate 360° en 1s linear infinite
- Taille: 24px (sm), 32px (md), 48px (lg)

**Behavior:**
- Animation continue jusqu'à completion
- Message "Processing..." en dessous

**Accessibility:**
- ARIA: `role="status" aria-busy="true"`

**Variants:**
```typescript
<div className="flex items-center gap-3">
  <Spinner size="md" />
  <span className="text-gray-400">Processing...</span>
</div>
```

---

## Keyboard Shortcuts Patterns

**Philosophy:** NLE-like keyboard-first workflow. Tous les raccourcis découvrables via tooltips.

**Primary Shortcuts (Global)**

| Action | Shortcut | Context |
|--------|----------|---------|
| Play/Pause | `Space` | Player focused |
| Générer cuts | `Cmd+G` / `Ctrl+G` | Sélection active |
| Exporter | `Cmd+E` / `Ctrl+E` | Cuts générés |
| Undo | `Cmd+Z` / `Ctrl+Z` | Global |
| Redo | `Cmd+Shift+Z` / `Ctrl+Shift+Z` | Global |
| Clear selection | `Escape` | Transcript |
| Jump to timecode | `Cmd+J` / `Ctrl+J` | Global |

**Timeline Navigation**

| Action | Shortcut | Behavior |
|--------|----------|----------|
| Frame forward | `→` | +1 frame (1/30s) |
| Frame backward | `←` | -1 frame |
| Jump forward 5s | `Shift+→` | +5s |
| Jump backward 5s | `Shift+←` | -5s |
| Jump to start | `Home` | 0:00:00 |
| Jump to end | `End` | Durée totale |

**Text Selection (Transcript)**

| Action | Shortcut | Behavior |
|--------|----------|----------|
| Select word | `Double-click` | Mot + sync timeline |
| Select sentence | `Triple-click` | Phrase + sync timeline |
| Extend selection | `Shift+Click` | Ajoute à sélection existante |
| Deselect all | `Escape` | Clear + reset timeline |

**Accessibility:**
- Tous les shortcuts affichés dans tooltips avec `data-shortcut` attribute
- Panneau d'aide raccourcis : `Cmd+/` ou `Ctrl+/`
- Shortcuts customisables (Phase 4 enhancement)

**Visual Feedback:**
- Tooltip affiche shortcut en gris `text-gray-500` sous description principale
- Exemple: "Play/Pause `Space`"

**Mobile Considerations:**
- Shortcuts désactivés sur mobile/tablet
- Touch gestures alternatifs (pinch to zoom timeline, etc.)

---

## Timeline Interaction Patterns

**Click Behaviors**

**Single Click:**
- **Action:** Position playhead à timecode cliqué
- **Visual Feedback:** Playhead animé vers nouvelle position `transition-all duration-200`
- **Audio Feedback:** Aucun
- **State Change:** `currentTime` updated

**Double Click:**
- **Action:** Play/Pause toggle
- **Visual Feedback:** Bouton play/pause icon change
- **Behavior:** Si playing, pause. Si paused, play from current position.

**Right Click:**
- **Action:** Context menu (Phase 4 enhancement)
- **Options:** Add marker, Split segment, Copy timecode
- **Visual:** Custom context menu `bg-gray-900 border border-gray-700`

---

**Drag Behaviors**

**Drag Playhead:**
- **Visual Feedback:** Playhead suit cursor en temps réel
- **Performance:** Throttle à 60fps (16ms updates)
- **Audio:** Optionnel scrubbing audio (Phase 3)
- **Cursor:** `cursor-grabbing` pendant drag

**Drag Segment Boundary:**
- **Action:** Adjust début/fin segment (trim)
- **Constraints:** Snap to word boundaries (évite coupe mid-word)
- **Visual Feedback:** Segment width animé, transcript highlighting updated
- **Cursor:** `cursor-ew-resize` sur hover boundary

**Drag to Select (Timeline):**
- **Action:** Brush selection de range temporel (Phase 4 enhancement)
- **Visual:** Rectangle selection overlay `bg-emerald-500/20 border border-emerald-500`

---

**Hover States**

**Segment Hover:**
- **Visual:** Lighten background `bg-emerald-600 → bg-emerald-500`
- **Cursor:** `cursor-pointer`
- **Tooltip:** Affiche durée segment + texte correspondant (max 100 chars)

**Playhead Hover:**
- **Visual:** Increase size slightly `scale-105`
- **Cursor:** `cursor-grab`

**Timeline Scrubbing:**
- **Visual:** Vertical line preview `border-l-2 border-gray-400` suit cursor
- **Tooltip:** Affiche timecode au hover

---

**Selection States**

**Single Segment Selected:**
- **Visual:** Border emerald `border-2 border-emerald-500`
- **Behavior:** Clic ailleurs deselect

**Multiple Segments Selected:**
- **Visual:** Tous segments selected ont border emerald
- **Behavior:** `Shift+Click` pour ajouter/retirer de sélection

**No Selection:**
- **Visual:** Timeline neutre gris foncé
- **Behavior:** Bouton "Générer cuts" disabled

---

**Accessibility:**
- ARIA: `role="slider"` pour playhead, `aria-valuetext` avec timecode
- Keyboard: `Tab` pour focus playhead, `←/→` pour déplacer frame-by-frame
- Screen reader: Annonce timecode et segments sélectionnés

---

## Text Selection Patterns (Transcript)

**Selection Mechanics**

**Word Selection:**
- **Action:** Click sur mot
- **Visual Feedback:** Background emerald `bg-emerald-600/30`, border bottom `border-b-2 border-emerald-500`
- **Timeline Sync:** Segment correspondant créé/highlighted instantanément (<16ms)
- **State:** Ajouté à `selectedRanges` array

**Sentence Selection:**
- **Action:** Triple-click sur phrase
- **Visual:** Tous mots de phrase highlighted avec même style
- **Behavior:** Respecte ponctuation (. ! ?) pour boundary detection

**Range Selection:**
- **Action:** Click-drag sur texte OU Shift+Click
- **Visual:** Selection continue de début à fin range
- **Constraints:** Snap to word boundaries (pas de sélection partielle mot)

**Multi-Range Selection:**
- **Action:** `Cmd/Ctrl+Click` pour ajouter range non-contigüe (Phase 3 enhancement)
- **Visual:** Multiple ranges highlighted simultaneously
- **Timeline:** Multiple segments colorés

---

**Visual Feedback States**

**Default (Not Selected):**
- Background: `transparent`
- Text: `text-gray-300`
- Hover: `bg-gray-800` subtle

**Selected:**
- Background: `bg-emerald-600/30`
- Text: `text-gray-100` (plus contrasté)
- Border bottom: `border-b-2 border-emerald-500`

**Active (Currently Playing):**
- Background: `bg-emerald-600/50` (plus intense)
- Border: `border-l-4 border-emerald-400` à gauche du mot
- Animation: Pulse subtil `animate-pulse` (optionnel)

**Hover (Not Selected):**
- Background: `bg-gray-800/50`
- Cursor: `cursor-text`

---

**Synchronization Behavior**

**Transcript → Timeline:**
- **Trigger:** User sélectionne texte
- **Latency:** <16ms (60fps)
- **Visual:** Segment apparaît instantanément sur timeline
- **Animation:** Fade in `opacity-0 → opacity-100` en 150ms

**Timeline → Transcript:**
- **Trigger:** User clique segment timeline OU playhead passe sur segment
- **Latency:** <16ms
- **Visual:** Mots correspondants highlighted
- **Scroll:** Auto-scroll transcript si mot hors viewport

**Playhead Sync:**
- **Trigger:** Playback en cours
- **Behavior:** Mot actuel highlighted en temps réel
- **Performance:** Optimisation avec memoization (éviter re-render complet)

---

**Accessibility:**

**Keyboard Selection:**
- `Shift+→/←`: Extend selection mot par mot
- `Cmd/Ctrl+A`: Select all transcript text
- `Escape`: Clear selection

**Screen Reader:**
- ARIA: `role="document" aria-label="Video transcript"`
- Selected ranges annoncés: "3 segments selected, total duration 2 minutes 34 seconds"

**Focus Management:**
- Focus ring visible sur transcript container
- Tab order: Transcript → Timeline → Player controls

---

**Error States:**

**Selection Impossible:**
- **Cas:** Texte transcription en cours (pas encore finalisé)
- **Visual:** Cursor `not-allowed` + tooltip "Transcription en cours..."
- **Behavior:** Click sans effet

**Selection Limite Freemium:**
- **Cas:** Total sélectionné >30min
- **Visual:** Toast warning apparaît
- **Behavior:** Dernière sélection allowed, nouvelle sélection blocked
- **CTA:** "Upgrade pour sélection illimitée"

---

## Loading States

**Application Loading (Initial)**

**When:** Premier chargement app, avant UI ready.

**Visual Design:**
- Full screen `bg-gray-950`
- Logo Splice centered
- Spinner emerald en dessous
- Text: "Initialisation..." `text-gray-500`

**Duration:** <2s optimisé (Tauri native)

**Behavior:**
- Fade out vers main UI en 300ms

---

**File Loading**

**When:** User sélectionne fichier vidéo à importer.

**Visual Design:**
- Modal overlay `bg-black/60 backdrop-blur-sm`
- Content card centered `bg-gray-900 p-6 rounded-lg`
- Progress bar determinate si taille fichier connue
- Text: "Chargement de `filename.mp4`... `percent`%"

**Behavior:**
- Cancel button disponible
- Si cancel: Cleanup + retour empty state

**Accessibility:**
- Focus trap sur modal
- ARIA: `role="dialog" aria-busy="true"`

---

**Transcription Loading**

**When:** Transcription audio en cours (Parakeet TDT).

**Visual Design:**
- Progress bar determinate en haut transcript zone
- Text: "Transcription en cours... `percent`% (~`time`s restant)"
- Partial transcript appears progressivement (streaming)

**Behavior:**
- Transcript readonly pendant processing
- Cancel button arrête transcription (garde partial result)

**Performance:**
- Update UI toutes les 500ms minimum (éviter jank)

---

**Cut Generation Loading**

**When:** Génération cuts après sélection texte.

**Visual Design:**
- Button "Générer cuts" remplacé par spinner + "Génération..."
- Progress bar si >100 segments à générer
- Timeline grayed out pendant processing

**Duration:** Typiquement <2s (opération rapide)

**Behavior:**
- User peut cancel (retour à sélection)

---

**Export Loading**

**When:** Export vidéo finale en cours.

**Visual Design:**
- Modal full avec progress bar determinate
- Preview thumbnail vidéo en cours d'export
- Text: "Export en cours... `percent`% (~`time` restant)"
- Estimation qualité export (taille fichier, fps)

**Behavior:**
- Cancel button disponible (destructive action, confirmation required)
- Notification system au completion

**Accessibility:**
- Screen reader annonce completion

---

**Skeleton Loading (Partial UI)**

**When:** Chargement asynchrone de metadata (durée vidéo, preview thumbnails).

**Visual Design:**
- Skeleton boxes `bg-gray-800 animate-pulse`
- Match final content dimensions
- Border radius identique au composant final

**Example:**
```typescript
<div className="animate-pulse">
  <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-800 rounded w-1/2"></div>
</div>
```

---

## Empty States

**No File Loaded (Initial State)**

**When:** User ouvre app première fois ou après export.

**Visual Design:**
- Centered content dans video preview zone
- Icon: Upload cloud `text-gray-600 size-16`
- Title: "Importez votre vidéo" `text-gray-300 text-xl font-medium`
- Description: "Glissez-déposez ou cliquez pour sélectionner" `text-gray-500`
- Button: "Sélectionner un fichier" (Primary)

**Behavior:**
- Drag & drop zone active sur toute preview area
- Click ouvre file picker (formats: .mp4, .mov, .avi)
- Keyboard: `Cmd+O` / `Ctrl+O` pour open file

**Accessibility:**
- ARIA: `role="button" aria-label="Upload video file"`
- Keyboard accessible

---

**No Transcript Generated**

**When:** Vidéo chargée mais transcription pas encore lancée.

**Visual Design:**
- Transcript zone avec message centré
- Icon: Mic `text-gray-600`
- Text: "Aucune transcription disponible"
- Button: "Générer la transcription" (Primary)

**Behavior:**
- Click démarre transcription automatiquement

---

**No Selection Made**

**When:** Transcription prête mais user n'a pas sélectionné texte.

**Visual Design:**
- Timeline empty state avec message centré
- Icon: Cursor click `text-gray-600`
- Text: "Sélectionnez du texte pour générer vos cuts"
- Subtitle: "Astuce: Double-cliquez sur un mot pour commencer"

**Behavior:**
- Message disparaît dès première sélection

---

**No Cuts Generated**

**When:** Sélection faite mais user n'a pas cliqué "Générer cuts".

**Visual Design:**
- Timeline show selection preview (wireframe segments)
- Button "Générer cuts" enabled et pulsing subtly
- Duration counter visible

**Behavior:**
- CTA visuel encourage user à générer

---

**Export Complete (Success State)**

**When:** Export terminé avec succès.

**Visual Design:**
- Modal overlay avec success icon `text-emerald-500`
- Title: "Export réussi !"
- Description: "3 vidéos exportées (142MB)"
- Preview thumbnails des fichiers exportés
- Buttons: "Ouvrir le dossier" (Primary), "Nouveau projet" (Secondary)

**Behavior:**
- Auto-dismiss après 10s si pas d'interaction
- "Ouvrir le dossier" lance file explorer (Tauri shell)

---

## Modal Patterns

**Error Modals** (détaillé dans Feedback Patterns)

**Confirmation Modals**

**When to Use:** Actions destructives ou irréversibles (Supprimer sélection, Quitter sans sauvegarder).

**Visual Design:**
- Background: `bg-gray-950 border border-gray-800`
- Title: `text-gray-100 font-semibold`
- Icon: Alert triangle `text-orange-500` si destructive
- Description: Explication claire des conséquences
- Buttons: Secondary (Annuler) à gauche, Danger (Confirmer) à droite

**Behavior:**
- Escape to cancel
- Focus auto sur bouton Annuler (safe default)
- Checkbox optionnel "Ne plus me demander" pour actions répétitives

**Accessibility:**
- ARIA: `role="alertdialog"`
- Keyboard: `Enter` active bouton focused, `Escape` cancel

**Example:**
```typescript
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Supprimer la sélection ?</AlertDialogTitle>
      <AlertDialogDescription>
        Tous les segments sélectionnés seront supprimés. Cette action est irréversible.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Annuler</AlertDialogCancel>
      <AlertDialogAction variant="destructive">Supprimer</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

**Conversion Modal (Freemium → Pro)**

**When:** User tente d'exporter vidéo >30min OU après preview perfect cut (moment de satisfaction).

**Visual Design:**
- Full modal `max-w-2xl`
- Hero image/video: Preview du workflow complet
- Title: "Passez à Splice Pro" `text-2xl font-bold`
- Feature list avec check icons:
  - ✓ Export vidéos illimitées
  - ✓ Qualité 4K
  - ✓ Aucun watermark
  - ✓ Raccourcis clavier avancés
  - ✓ Support prioritaire
- Pricing: "19€/mois ou 149€/an (-30%)"
- Buttons: "Upgrade maintenant" (Primary large), "Rester en version gratuite" (Ghost small)

**Behavior:**
- Backdrop blur non-dismissable (pas de click outside to close)
- Escape to close (retour freemium limits)
- Click "Upgrade" ouvre Stripe checkout (Tauri shell)

**Conversion Triggers:**
1. **After Perfect Preview:** User a prévisualisé cuts, satisfaction peak
2. **Export Blocked:** User tente d'exporter >30min
3. **Advanced Feature:** User essaie feature Pro (keyboard shortcuts custom)

**Accessibility:**
- Focus trap
- ARIA: `role="dialog" aria-labelledby="upgrade-title"`

---

**Settings Modal (Phase 3)**

**When:** User clique bouton Settings.

**Visual Design:**
- Modal `max-w-md`
- Tabs: Général, Export, Raccourcis
- Form controls: Switches, selects, inputs
- Buttons: "Sauvegarder" (Primary), "Annuler" (Secondary)

**Behavior:**
- Changes saved on "Sauvegarder"
- "Annuler" restore previous values

---

**Help Modal (Keyboard Shortcuts)**

**When:** User appuie `Cmd+/` ou `Ctrl+/`.

**Visual Design:**
- Modal `max-w-lg`
- Title: "Raccourcis clavier"
- Table layout: Action | Shortcut
- Search bar en haut pour filter shortcuts

**Behavior:**
- Escape to close
- Search updates table en temps réel

**Accessibility:**
- ARIA: `role="dialog" aria-label="Keyboard shortcuts reference"`

---

## Integration with Shadcn/ui

**Customization Strategy:**

Tous les patterns utilisent les composants Shadcn/ui de base avec customisation via Tailwind:

1. **Button Component:**
   - Variants définis dans `components/ui/button.tsx`
   - Couleurs adaptées: `emerald` pour primary, `gray` pour secondary
   - Border radius réduit: `rounded-md` (6px) au lieu de `rounded-lg`

2. **Dialog Component:**
   - Dark theme appliqué: `bg-gray-950 border-gray-800`
   - Backdrop blur: `backdrop-blur-sm`
   - Custom animations: `data-[state=open]:animate-in`

3. **Progress Component:**
   - Couleur barre: `bg-emerald-600`
   - Track: `bg-gray-800`
   - Wrapper custom pour affichage % + time estimate

4. **Toast Component:**
   - Position: `bottom-right` par défaut
   - Auto-dismiss timings personnalisés par type
   - Stack vertical avec espacement 12px

5. **Tooltip Component:**
   - Délai: 500ms
   - Max-width: 200px
   - Affichage shortcuts clavier intégré

**Custom Pattern Rules:**

1. **Consistency First:** Tous les composants custom (Transcript, Timeline, Player) suivent mêmes patterns visuels (colors, spacing, typography)
2. **Accessibility Non-Négociable:** Tous patterns incluent ARIA labels, keyboard navigation, focus management
3. **Performance Critical:** Animations <16ms, debounce user inputs, virtualization si needed
4. **Mobile-First Thinking:** Même si desktop app, patterns responsive pour support futur web version
5. **Dark Theme Only (MVP):** Pas de light mode toggle, toutes couleurs optimisées pour dark background


---
