# Component Strategy

## Design System Components (Shadcn/ui)

**Composants Standards Utilisés:**

**1. Button Component**
- **Usage:** Actions primaires (Générer cuts, Exporter, Annuler), actions secondaires (Clear selection, Settings)
- **Variants:** Primary (vert emerald), Secondary (gris outline), Ghost (transparent), Danger (rouge pour destructive)
- **States:** Default, Hover, Active, Disabled, Loading
- **Customisation:** Couleurs adaptées palette Splice, border-radius réduit pour look pro

**2. Dialog/Modal Component**
- **Usage:** Messages erreur, confirmation actions critiques, conversion freemium
- **Variantes:** Alert (erreurs), Confirm (confirmations), Full (conversion freemium avec contenu riche)
- **States:** Open, Closed, Loading
- **Customisation:** Dark theme, backdrop blur, escape to close

**3. Progress Component**
- **Usage:** Opérations longues (transcription, génération cuts, export)
- **Variantes:** Determinate (% connu), Indeterminate (durée inconnue)
- **States:** In Progress, Complete, Error
- **Customisation:** Vert emerald pour barre, affichage % + temps estimé intégré

**4. Toast/Notification Component**
- **Usage:** Feedback success/error discret, non-bloquant
- **Variantes:** Success (vert), Error (rouge), Info (bleu), Warning (orange)
- **States:** Showing, Hiding (fade out)
- **Customisation:** Position bottom-right, auto-dismiss 3-5s, stack vertical

**5. Tooltip Component**
- **Usage:** Aide contextuelle (raccourcis clavier, explications boutons)
- **Variantes:** Default (dark background), Light (si besoin)
- **States:** Visible (hover), Hidden
- **Customisation:** Délai 500ms, flèche pointeur, max-width 200px

**Total Design System Components:** 5 composants standards = 40% des besoins UI

## Custom Components

Spécifications détaillées documentées dans section précédente incluant:
1. **Transcript Editor Component** - Surlignage texte avec sync timeline temps réel
2. **Timeline Component** - Visualisation NLE-like avec segments colorés
3. **Video Preview Player Component** - Lecteur avec controls NLE standards
4. **Duration Counter Component** - Feedback temps sélectionné continu
5. **Conversion Modal Component** - Blocage freemium stratégique

**Total Custom Components:** 5 composants critiques = 60% du travail, 90% de la valeur différenciante

## Component Implementation Strategy

**Foundation Approach:**

1. **Use Design System Tokens**
   - Tous composants custom utilisent variables Tailwind définies (colors, spacing, typography)
   - Cohérence garantie avec composants Shadcn/ui
   - Facilite theming futur (dark/light toggle post-MVP)

2. **Component Architecture**
   - **Dumb Components:** Présentation pure (Transcript, Timeline, Player)
   - **Smart Containers:** State management (TranscriptContainer wrappe Transcript + state)
   - **State Management:** Zustand ou Context API pour sync bidirectionnelle
   - **Event Bus:** Custom events pour sync transcript ↔ timeline ↔ player

3. **Accessibility First**
   - ARIA labels/roles dès développement initial
   - Keyboard navigation testée avant mouse
   - Screen reader testing avec NVDA/VoiceOver
   - Focus management rigoureux (modals, tooltips)

4. **Performance Optimization**
   - Transcript: Virtualization si >10k mots (react-window)
   - Timeline: Canvas rendering pour >100 segments
   - Video: Proxy génération si source >4K
   - Debounce/throttle updates <16ms pour 60fps

5. **Testing Strategy**
   - Unit tests: Composants isolés (Jest + React Testing Library)
   - Integration tests: Sync transcript-timeline (Playwright)
   - E2E tests: User journeys complets (Playwright)
   - Visual regression: Chromatic ou Percy

## Implementation Roadmap

**Phase 1: Core Components (Semaine 2-3)**

**Priorité Critique:**
1. **Transcript Editor** - Cœur expérience, bloquant pour tout workflow
2. **Timeline Component** - Sync bidirectionnelle essentielle
3. **Duration Counter** - Feedback continu pendant surlignage

**Rationale:** Ces 3 composants = 80% de la valeur utilisateur (surlignage + preview sélection). Sans eux, pas de MVP fonctionnel.

**Validation:** Tests Orlan/Ayub sur surlignage + sync temps réel

**Phase 2: Playback & Validation (Semaine 4)**

**Priorité Haute:**
1. **Video Preview Player** - Validation qualité cuts avant export
2. **Progress Component (custom wrapper)** - Feedback opérations longues
3. **Toast Notifications** - Success/error feedback discret

**Rationale:** Validation cuts = confiance établie. Sans preview, utilisateur anxieux qualité résultat.

**Validation:** Tests cuts précision (aucune coupe mid-word), transitions naturelles

**Phase 3: Monetization & Polish (Semaine 5)**

**Priorité Moyenne:**
1. **Conversion Modal** - Freemium → Pro conversion
2. **Error Dialogs** - Gestion erreurs gracieuse
3. **Tooltip Helpers** - Aide contextuelle raccourcis

**Rationale:** Monétisation critique business mais pas bloquante MVP technique. Polish améliore UX mais pas essentiel première validation.

**Validation:** Tests conversion rate (freemium qui voient preview → % upgrade)

**Phase 4: Enhancement (Post-MVP)**

**Priorité Basse:**
1. **Timeline Zoom** - Précision frame-level avancée
2. **Waveform Overlay** - Visualisation audio timeline
3. **Keyboard Shortcuts Panel** - Découvrabilité raccourcis
4. **Settings Dialog** - Préférences utilisateur (marges, exports)

**Rationale:** Nice-to-have, améliorent productivité power users mais pas essentiels adoption initiale.

**Validation:** Feedback utilisateurs établis sur features manquantes

---
