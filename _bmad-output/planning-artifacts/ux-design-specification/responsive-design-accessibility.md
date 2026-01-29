# Responsive Design & Accessibility

## Responsive Strategy

**Platform Priority: Desktop-First**

Splice est une application desktop professionnelle (Tauri) ciblant des monteurs vidéo travaillant sur workstations. La stratégie responsive se concentre sur l'adaptation aux différentes résolutions desktop et prépare l'architecture pour une future version web.

**Desktop Strategy (Primary)**

**Target Resolutions:**
- **Minimum:** 1920x1080 (Full HD) - 85% des utilisateurs pro
- **Optimal:** 2560x1440 (2K) - 40% des utilisateurs
- **Maximum:** 3840x2160 (4K) - 15% early adopters

**Layout Adaptation par Résolution:**

**1920x1080 (Minimum Viable):**
- 3-zone layout: Transcript 30% (576px) | Preview 40% (768px) | Timeline 120px bottom
- Transcript: 2 colonnes texte si largeur >600px
- Preview: 16:9 aspect ratio maintained
- Timeline: Segments visibles min 50px width

**2560x1440 (Optimal Comfort):**
- 3-zone layout: Transcript 35% (896px) | Preview 45% (1152px) | Timeline 150px bottom
- Transcript: Increased line-height 1.8, larger font 17px
- Preview: Meilleure qualité preview (720p → 1080p)
- Timeline: Plus de segments visibles, waveform overlay enabled

**3840x2160 (4K Power Users):**
- 3-zone layout: Transcript 35% (1344px) | Preview 50% (1920px) | Timeline 180px bottom
- Transcript: 3 colonnes texte possible avec sidebar controls
- Preview: 4K preview si source 4K
- Timeline: Zoom granulaire frame-by-frame, markers visibles

**Window Resizing Behavior:**

**Horizontal Resize:**
- **Priority:** Maintenir aspect ratio Preview (16:9 sacré)
- **Strategy:** Timeline et Transcript ajustent proportionnellement
- **Minimum Width:** 1280px (below = warning "Fenêtre trop petite pour workflow optimal")
- **Constraints:** 
  - Transcript: Min 400px, Max 800px
  - Preview: Min 640px (toujours 16:9)
  - Timeline: Min 100px, Max 200px

**Vertical Resize:**
- **Priority:** Timeline height fixe (toujours visible), Transcript + Preview ajustent
- **Minimum Height:** 720px (below = scrollable transcript)
- **Constraints:**
  - Timeline: Fixe 120-180px selon résolution
  - Preview: Min 360px height (16:9 maintenu)
  - Transcript: Scrollable si déborde

**Desktop-Specific Features:**

- **Multi-Window Support (Phase 3):** Détacher Preview dans fenêtre séparée (second screen workflow)
- **Toolbar Density:** Compact mode si width <1600px (hide button labels, show icons only)
- **Keyboard Shortcuts:** Découvrabilité via tooltips (Cmd+/ pour panel raccourcis)
- **Context Menus:** Right-click disponibles (Timeline, Transcript, Player)
- **Drag & Drop:** File import via drag anywhere dans app window

---

**Future Web Version (Preparation)**

**Architecture Responsive Dès Maintenant:**

Bien que MVP soit desktop-only, architecture frontend prepare web version future:

1. **Tailwind Breakpoints Standards:**
   ```css
   sm: 640px   /* Mobile landscape (future) */
   md: 768px   /* Tablet (future) */
   lg: 1024px  /* Laptop (current min) */
   xl: 1280px  /* Desktop (current optimal) */
   2xl: 1536px /* Large desktop (current) */
   ```

2. **Component Design Mobile-Ready:**
   - Tous composants utilisent relative units (rem, %, vw)
   - Flexbox/Grid layouts (pas de fixed positioning)
   - Touch target sizes 44px minimum (préparation tactile)

3. **Conditional Features:**
   ```typescript
   // Exemple architecture
   const isMobile = useMediaQuery('(max-width: 768px)');
   const isDesktop = useMediaQuery('(min-width: 1024px)');
   
   // Desktop-only features
   {isDesktop && <KeyboardShortcutsPanel />}
   {isDesktop && <DragHandles />}
   ```

---

**Tablet Strategy (Future Web Version)**

**Not MVP - Architecture Preparation Only**

Si web version déployée future, adaptation tablet (768px - 1023px):

**Layout Changes:**
- 2-zone stacked: Preview top (full width) | Transcript bottom (scrollable)
- Timeline overlay bottom (collapsible)
- Touch-optimized controls (buttons 48px, spacing 12px)

**Interaction Changes:**
- Touch gestures: Pinch to zoom timeline, swipe to navigate
- No hover states (tap to preview segment)
- Bottom sheet modals (vs centered modals desktop)

---

**Mobile Strategy (Future Web Version)**

**Not MVP - Architecture Preparation Only**

Si web version déployée future, adaptation mobile (320px - 767px):

**Layout Changes:**
- Single column stacked: Preview top | Transcript center | Timeline bottom sheet
- Bottom navigation: Home | Transcript | Timeline | Export
- Hamburger menu pour settings

**Interaction Changes:**
- Simplified workflow: Import → Read transcript → Select (tap words) → Export
- No frame-by-frame controls (gestures approximatifs OK pour mobile use case)
- Voice input alternative (tap-to-dictate segments à garder)

**Critical Mobile Difference:**
Mobile use case ≠ Desktop use case. Mobile = review/approve cuts créés sur desktop, pas editing complet.

---

## Breakpoint Strategy

**Desktop App (Current MVP):**

Pas de breakpoints traditionnels, mais **window size thresholds** pour adaptive layouts:

**Breakpoints Internes (Window Resize):**

```typescript
// Window size thresholds
const BREAKPOINTS = {
  minViable: 1280,    // Below = warning
  comfortable: 1920,  // Default optimal
  spacious: 2560,     // Enhanced features
  ultra: 3840,        // 4K optimizations
};

// Layout adjustments
const getLayoutConfig = (windowWidth: number) => {
  if (windowWidth >= BREAKPOINTS.ultra) {
    return { transcript: '35%', preview: '50%', timeline: 180 };
  }
  if (windowWidth >= BREAKPOINTS.spacious) {
    return { transcript: '35%', preview: '45%', timeline: 150 };
  }
  if (windowWidth >= BREAKPOINTS.comfortable) {
    return { transcript: '30%', preview: '40%', timeline: 120 };
  }
  // Below 1280px: Warning overlay
  return { transcript: '30%', preview: '40%', timeline: 100 };
};
```

**Adaptive Features by Window Size:**

| Feature | 1280px | 1920px | 2560px | 3840px |
|---------|--------|--------|--------|--------|
| Transcript Columns | 1 | 1-2 | 2 | 2-3 |
| Timeline Waveform | Hidden | Optional | Visible | Detailed |
| Button Labels | Icons only | Visible | Visible | Verbose |
| Preview Quality | 480p | 720p | 1080p | 4K |
| Font Size Base | 14px | 16px | 17px | 18px |
| Spacing Unit | 3px | 4px | 5px | 6px |

---

**Future Web Version Breakpoints:**

```typescript
// Standard Tailwind breakpoints
const WEB_BREAKPOINTS = {
  mobile: 320,    // Mobile portrait
  tablet: 768,    // Tablet portrait
  laptop: 1024,   // Small laptop
  desktop: 1280,  // Desktop
  wide: 1920,     // Wide desktop
};

// Mobile-first media queries
@media (min-width: 768px) { /* Tablet styles */ }
@media (min-width: 1024px) { /* Desktop styles */ }
@media (min-width: 1920px) { /* Enhanced desktop */ }
```

---

## Accessibility Strategy

**WCAG Compliance Level: AA (Industry Standard)**

Splice vise **WCAG 2.1 Level AA compliance** - standard industrie pour applications professionnelles. Pas de Level AAA nécessaire (overkill pour target users), mais dépassement de Level A (insuffisant pour UX moderne).

**Rationale WCAG AA:**
- Target users = professionnels techniques, pas utilisateurs handicap majeur
- Légal compliance (ADA, Section 508 requiert minimum AA)
- UX moderne attendue par users exigeants
- Keyboard navigation critique (monteurs utilisent shortcuts intensivement)

---

**Color Contrast Requirements**

**WCAG AA Standards:**
- Normal text (16px): Minimum 4.5:1 contrast ratio
- Large text (18px+ ou 14px+ bold): Minimum 3:1 contrast ratio
- UI components et graphiques: Minimum 3:1 contrast ratio

**Splice Compliance:**

| Element | Foreground | Background | Ratio | Status |
|---------|-----------|------------|-------|--------|
| Body text | #fafafa | #0a0a0a | 18.5:1 | ✅ AAA |
| Secondary text | #a3a3a3 | #0a0a0a | 8.2:1 | ✅ AAA |
| Primary button | #ffffff | #10b981 | 4.9:1 | ✅ AA |
| Selected text | #f3f4f6 | #10b981 | 4.7:1 | ✅ AA |
| Timeline segments | #10b981 | #171717 | 5.1:1 | ✅ AA |
| Error text | #f87171 | #0a0a0a | 6.3:1 | ✅ AAA |
| Warning text | #fb923c | #0a0a0a | 5.8:1 | ✅ AAA |

**Testing:** Utiliser WebAIM Contrast Checker pendant design iteration.

---

**Keyboard Navigation (Critical)**

**Full Keyboard Support - Aucune Fonctionnalité Mouse-Only:**

**Global Navigation:**
- `Tab` / `Shift+Tab`: Navigate entre zones (Transcript → Timeline → Player → Controls)
- `Escape`: Fermer modals, clear selection, cancel operations
- `Cmd+/` ou `Ctrl+/`: Open keyboard shortcuts help

**Transcript Navigation:**
- `↑/↓`: Navigate paragraphes
- `←/→`: Navigate mots (avec Shift pour extend selection)
- `Cmd+A` / `Ctrl+A`: Select all text
- `Escape`: Clear selection

**Timeline Navigation:**
- `Tab` pour focus playhead, `←/→` pour frame-by-frame (1/30s)
- `Shift+←/→`: Jump 5s
- `Home` / `End`: Jump to start/end
- `Space`: Play/Pause

**Modal/Dialog Navigation:**
- Focus trap activé (Tab ne sort pas du modal)
- Focus auto sur bouton primaire à l'ouverture
- `Enter`: Activer bouton focused
- `Escape`: Fermer (si dismissable)

**Focus Indicators:**
- Visible ring: `focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2`
- Offset 2px pour distinction avec borders
- Skip links pour navigation rapide (Phase 2)

---

**Screen Reader Support**

**Semantic HTML Structure:**
- `<main>`, `<section>`, `<article>`, `<aside>` pour landmarks
- `<nav>` pour navigation zones
- `<button>` pour actions (jamais `<div onclick>`)
- `<form>` pour inputs (settings, export options)

**ARIA Labels & Roles:**

| Component | ARIA Implementation |
|-----------|---------------------|
| Transcript | `role="document" aria-label="Video transcript"` |
| Timeline | `role="slider" aria-valuetext="Timecode 00:02:34"` |
| Playhead | `role="slider" aria-valuenow={currentTime}` |
| Progress Bar | `role="progressbar" aria-valuenow={percent}` |
| Modals | `role="dialog" aria-modal="true"` |
| Error Dialogs | `role="alertdialog"` |
| Toasts | `role="status" aria-live="polite"` |

**Dynamic Content Announcements:**
- Selection changes: "3 segments selected, total duration 2 minutes 34 seconds"
- Progress updates: Announce % toutes les 10% (éviter spam)
- Error messages: `aria-live="assertive"` pour erreurs critiques
- Success messages: `aria-live="polite"` pour confirmations

**Screen Reader Testing:**
- macOS: VoiceOver (built-in, primary testing)
- Windows: NVDA (free, secondary testing)
- Windows: JAWS (payant, Phase 3 si budget)

---

**Touch Target Sizes**

**WCAG AA Requirement:** Minimum 44x44px pour touch targets.

**Splice Implementation (Desktop app = mouse + potential future touch screens):**

| Element | Size | Status |
|---------|------|--------|
| Primary buttons | 44px height | ✅ |
| Icon buttons | 44x44px | ✅ |
| Timeline playhead | 48px width (drag handle) | ✅ |
| Segment boundaries | 12px hover area (cursor-ew-resize) | ⚠️ Desktop-only |
| Transcript words | 28px line-height (tap area) | ⚠️ Future web |
| Checkbox/Radio | 24x24px (with 44px padding) | ✅ |

**Desktop Exception:** Segment boundary drag handles (12px) OK pour desktop app (precision mouse), mais sera augmenté à 44px pour future web version tactile.

---

**Additional Accessibility Features**

**Color Independence:**
- Jamais utiliser couleur seule pour informer (toujours icône + texte)
- Segments timeline: Couleur + border pattern (solid vs dashed pour distinguish)
- Error states: Rouge + icon triangle + text explicatif

**Animation & Motion:**
- Respect `prefers-reduced-motion` media query
- Désactiver animations non-essentielles si demandé
- Animations essentielles (progress bars) maintenues mais ralentis

**Text Scalability:**
- Font-size en `rem` (user peut zoom browser/system settings)
- Layout tested jusqu'à 200% zoom (WCAG AA requirement)
- Min font-size 14px (16px optimal)

**Error Identification:**
- Messages d'erreur clairs et explicatifs (pas juste "Error")
- Form validation: Error message + red border + icon
- Suggestions de correction: "Format attendu: .mp4, .mov, .avi"

---

## Testing Strategy

**Responsive Testing (Desktop Window Sizes)**

**Manual Testing:**
1. **Window Resize Testing:**
   - Test resize horizontal: 1280px → 1920px → 2560px → 3840px
   - Test resize vertical: 720px → 1080px → 1440px
   - Verify layout adaptatif sans overflow/breakage

2. **Resolution Testing:**
   - 1920x1080 (Full HD) - Primary test environment
   - 2560x1440 (2K) - Verify enhanced features
   - 3840x2160 (4K) - Verify scaling (DPI awareness)

3. **Multi-Monitor Testing:**
   - Drag window entre monitors (DPI differences)
   - Detach preview window (Phase 3 feature)

**Automated Responsive Testing:**
```typescript
// Playwright test example
test('Layout adapts to window resize', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  // Verify min viable layout
  
  await page.setViewportSize({ width: 1920, height: 1080 });
  // Verify optimal layout
  
  await page.setViewportSize({ width: 2560, height: 1440 });
  // Verify enhanced features visible
});
```

---

**Accessibility Testing**

**Automated Testing (CI/CD Integration):**

1. **axe-core (Jest + React Testing Library):**
   ```typescript
   import { axe, toHaveNoViolations } from 'jest-axe';
   
   test('Transcript component has no accessibility violations', async () => {
     const { container } = render(<TranscriptEditor />);
     const results = await axe(container);
     expect(results).toHaveNoViolations();
   });
   ```

2. **Playwright Accessibility Tests:**
   ```typescript
   test('Main interface passes accessibility audit', async ({ page }) => {
     await page.goto('/');
     const accessibilityScanResults = await page.accessibility.snapshot();
     // Validate WCAG AA compliance
   });
   ```

3. **Lighthouse CI (Score Targets):**
   - Accessibility: 95+ (minimum)
   - Best Practices: 90+
   - Performance: 85+ (acceptable pour desktop app)

**Manual Accessibility Testing:**

**Keyboard Navigation Testing (Daily Dev):**
- [ ] `Tab` navigation complète sans mouse
- [ ] Toutes fonctionnalités accessibles au clavier
- [ ] Focus indicators visibles à chaque étape
- [ ] Shortcuts clavier fonctionnent globalement
- [ ] Modals trap focus correctement
- [ ] `Escape` ferme modals/clears selections

**Screen Reader Testing (Weekly):**
- [ ] VoiceOver macOS: Navigate transcript, timeline, controls
- [ ] NVDA Windows: Verify announcements corrects
- [ ] Landmarks navigation (`Cmd+U` VoiceOver landmarks rotor)
- [ ] Form labels correctly announced
- [ ] Error messages announced immediately
- [ ] Dynamic content changes announced appropriately

**Color Contrast Testing:**
- [ ] WebAIM Contrast Checker pour tous text/background combos
- [ ] Chrome DevTools "Rendering > Emulate vision deficiencies" (Protanopia, Deuteranopia, Tritanopia)
- [ ] Verify UI usable en grayscale (test color independence)

**Touch Target Testing (Future Prep):**
- [ ] Tous buttons minimum 44x44px
- [ ] Espacement 8px minimum entre touch targets
- [ ] Test avec trackpad gestures (Mac)

---

**User Testing with Disabilities**

**Phase 2-3: Real User Validation**

**Recruit Test Users:**
- 2-3 utilisateurs with vision impairments (screen reader users)
- 2-3 utilisateurs with motor impairments (keyboard-only users)
- 1-2 utilisateurs with cognitive impairments (simplicité validation)

**Test Scenarios:**
1. Import vidéo et démarrer transcription (keyboard only)
2. Navigate transcript avec screen reader
3. Sélectionner segments et générer cuts (keyboard + screen reader)
4. Prévisualiser et exporter (full workflow)

**Success Criteria:**
- 90% task completion rate (vs 95% pour utilisateurs standard)
- Feedback qualitative positif
- Aucun blocker critique identifié

---

## Implementation Guidelines

**Responsive Development**

**Use Relative Units (Not Fixed Pixels):**

```css
/* ❌ Bad - Fixed pixels */
.transcript {
  width: 600px;
  font-size: 16px;
  padding: 20px;
}

/* ✅ Good - Relative units */
.transcript {
  width: 30%;           /* Percentage pour layout flex */
  font-size: 1rem;      /* rem pour scalability */
  padding: 1.25rem;     /* rem pour consistent spacing */
}
```

**Tailwind Configuration (tailwind.config.js):**

```javascript
module.exports = {
  theme: {
    extend: {
      spacing: {
        // Relative spacing scale (4px base unit)
        '1': '0.25rem',   // 4px
        '2': '0.5rem',    // 8px
        '3': '0.75rem',   // 12px
        '4': '1rem',      // 16px
        '5': '1.25rem',   // 20px
        '6': '1.5rem',    // 24px
        // ...
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5' }],    // 12px
        'sm': ['0.875rem', { lineHeight: '1.6' }],   // 14px
        'base': ['1rem', { lineHeight: '1.7' }],     // 16px
        'lg': ['1.125rem', { lineHeight: '1.7' }],   // 18px
        'xl': ['1.25rem', { lineHeight: '1.7' }],    // 20px
        // ...
      },
    },
  },
};
```

**Responsive Layout Grid:**

```typescript
// 3-zone layout avec CSS Grid
<div className="grid grid-cols-[30%_1fr_120px] h-screen">
  {/* Transcript - 30% width */}
  <div className="overflow-auto">
    <TranscriptEditor />
  </div>
  
  {/* Preview - Flex remaining space */}
  <div className="flex items-center justify-center">
    <VideoPreviewPlayer />
  </div>
  
  {/* Timeline - Fixed 120px */}
  <div className="border-t border-gray-800">
    <TimelineComponent />
  </div>
</div>

// Window resize responsive (Tailwind custom breakpoints)
<div className="grid 
  grid-cols-[30%_1fr_120px]         /* Default 1920px */
  xl:grid-cols-[35%_1fr_150px]      /* 2560px+ */
  2xl:grid-cols-[35%_1fr_180px]     /* 3840px+ */
  h-screen">
  {/* ... */}
</div>
```

---

**Accessibility Development**

**Semantic HTML (Always):**

```tsx
// ❌ Bad - Non-semantic divs
<div className="button" onClick={handleClick}>
  Click me
</div>

// ✅ Good - Semantic button element
<button 
  onClick={handleClick}
  className="btn-primary"
  aria-label="Generate video cuts"
>
  Generate Cuts
</button>
```

**ARIA Labels & Roles:**

```tsx
// Transcript Component
<section 
  role="document" 
  aria-label="Video transcript"
  className="transcript-container"
>
  {transcript.map((paragraph, idx) => (
    <p 
      key={idx}
      role="paragraph"
      aria-setsize={transcript.length}
      aria-posinset={idx + 1}
    >
      {paragraph.words.map((word) => (
        <span
          role="button"
          tabIndex={0}
          aria-pressed={word.isSelected}
          onClick={() => toggleWord(word)}
        >
          {word.text}
        </span>
      ))}
    </p>
  ))}
</section>

// Timeline Component
<div 
  role="slider"
  aria-label="Video timeline"
  aria-valuemin={0}
  aria-valuemax={videoDuration}
  aria-valuenow={currentTime}
  aria-valuetext={formatTimecode(currentTime)}
  tabIndex={0}
  onKeyDown={handleTimelineKeyboard}
>
  {/* Playhead et segments */}
</div>

// Progress Component
<div 
  role="progressbar"
  aria-valuenow={percent}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label={`Transcription progress: ${percent}%`}
>
  <div 
    className="progress-bar" 
    style={{ width: `${percent}%` }}
  />
</div>
```

**Keyboard Navigation Implementation:**

```typescript
// Focus management avec React
const TranscriptEditor = () => {
  const transcriptRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Auto-focus transcript au mount (si first element)
    transcriptRef.current?.focus();
  }, []);
  
  const handleKeyDown = (e: KeyboardEvent) => {
    switch(e.key) {
      case 'Escape':
        clearSelection();
        break;
      case 'ArrowUp':
        navigatePreviousParagraph();
        e.preventDefault(); // Prevent scroll
        break;
      case 'ArrowDown':
        navigateNextParagraph();
        e.preventDefault();
        break;
      // ...
    }
  };
  
  return (
    <div 
      ref={transcriptRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="focus:outline-none focus:ring-2 focus:ring-emerald-500"
    >
      {/* Transcript content */}
    </div>
  );
};

// Modal focus trap
const Modal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      // Trap focus inside modal
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements?.[0] as HTMLElement;
      const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement;
      
      // Focus first element
      firstElement?.focus();
      
      // Handle Tab key to cycle focus
      const handleTab = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement?.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement?.focus();
              e.preventDefault();
            }
          }
        }
      };
      
      document.addEventListener('keydown', handleTab);
      return () => document.removeEventListener('keydown', handleTab);
    }
  }, [isOpen]);
  
  return isOpen ? (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {children}
    </div>
  ) : null;
};
```

**High Contrast Mode Support:**

```css
/* Respect user system preferences */
@media (prefers-contrast: high) {
  :root {
    --color-bg-primary: #000000;
    --color-text-primary: #ffffff;
    --color-border: #ffffff;
  }
  
  .button-primary {
    border: 2px solid white; /* Enhanced border visibility */
  }
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Accessibility Testing Integration:**

```typescript
// jest.config.js
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};

// jest.setup.js
import { toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

// Component.test.tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import TranscriptEditor from './TranscriptEditor';

test('TranscriptEditor is accessible', async () => {
  const { container } = render(<TranscriptEditor />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

test('Keyboard navigation works', async () => {
  const { getByRole } = render(<TranscriptEditor />);
  const transcript = getByRole('document');
  
  // Test Tab navigation
  userEvent.tab();
  expect(transcript).toHaveFocus();
  
  // Test Escape clears selection
  userEvent.keyboard('{Escape}');
  // Verify selection cleared
});
```

