# Epic 10: Accessibility & Inclusive Design

Tous les utilisateurs peuvent utiliser Splice avec keyboard navigation et screen readers (WCAG AA).

## Story 10.1: Keyboard Navigation Implementation

As a user who relies on keyboard,
I want to navigate and use all features without a mouse,
So that I can work efficiently with my preferred input method.

**Acceptance Criteria:**

**Given** WCAG 2.1 Level AA compliance required (UX-1, UX-4)
**When** user navigates with keyboard only
**Then** Tab/Shift+Tab cycles through all interactive elements in logical order:
  - Header navigation
  - Import button
  - Transcript editor
  - Timeline
  - Export controls
**And** focus indicators visible on all focused elements (UX-10):
  - `focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2`
  - High contrast, clearly visible
**And** Escape key closes modals and dialogs
**And** Arrow keys navigate within components:
  - Transcript: Up/Down = navigate paragraphs
  - Timeline: Left/Right = frame-by-frame or 5s jumps with Shift
**And** Space bar toggles play/pause in preview player
**And** Cmd+/ (Mac) or Ctrl+/ (Windows) opens keyboard shortcuts help modal
**And** all keyboard shortcuts documented in help
**And** no functionality requires mouse (all mouse actions have keyboard equivalent)

---

## Story 10.2: Screen Reader Support with ARIA

As a user with visual impairments,
I want to use Splice with a screen reader,
So that I can access all features through audio feedback.

**Acceptance Criteria:**

**Given** WCAG AA screen reader requirements (UX-5)
**When** using VoiceOver (macOS) or NVDA (Windows)
**Then** semantic HTML used throughout:
  - `<main>` for main content area
  - `<section>` for transcript, timeline, preview
  - `<nav>` for navigation
  - `<button>` for all clickable actions (never `<div onclick>`)
**And** ARIA labels on custom components:
  - Transcript: `role="document" aria-label="Video transcript"`
  - Timeline: `role="slider" aria-valuetext="Timecode 00:02:34"`
  - Progress bars: `role="progressbar" aria-valuenow={percent}`
  - Modals: `role="dialog" aria-modal="true"`
**And** dynamic content announced via ARIA live regions:
  - Selection changes: "3 segments selected, total duration 2 minutes 34 seconds"
  - Progress updates: "Transcription 45% complete"
  - Success/error toasts: `aria-live="polite"` or `aria-live="assertive"`
**And** screen reader testing done with VoiceOver (primary) and NVDA (secondary)
**And** all images have alt text
**And** all form inputs have associated labels

---

## Story 10.3: High Contrast & Color Independence

As a user with color vision deficiency,
I want the interface to be usable without relying on color alone,
So that I can distinguish all UI states and actions.

**Acceptance Criteria:**

**Given** WCAG AA color requirements (UX-1, UX-7)
**When** viewing interface
**Then** all text meets WCAG AA contrast ratios:
  - Normal text (16px): Minimum 4.5:1 contrast
  - Large text (18px+): Minimum 3:1 contrast
  - UI components: Minimum 3:1 contrast
**And** color never used alone to convey information (UX-7):
  - Selected text: Color + border + icon
  - Timeline segments: Color + pattern (solid vs dashed)
  - Error states: Red + icon + text
  - Success states: Green + checkmark + text
**And** verified with WebAIM Contrast Checker
**And** tested with browser "Emulate vision deficiencies" (Protanopia, Deuteranopia, Tritanopia)
**And** interface usable in grayscale mode
**And** high contrast mode supported (`prefers-contrast: high` media query)

---

## Story 10.4: Responsive Text & Scalability

As a user who needs larger text,
I want the interface to scale properly when I zoom,
So that I can read all content comfortably.

**Acceptance Criteria:**

**Given** WCAG AA scalability requirements (UX-9)
**When** user zooms interface
**Then** all font sizes defined in `rem` units (not `px`)
**And** layout tested up to 200% zoom without breaking
**And** text remains readable at 200% zoom
**And** no horizontal scrolling required at 200% zoom (content reflows)
**And** minimum font size is 14px (0.875rem)
**And** optimal base font size is 16px (1rem)
**And** line height minimum 1.5 for body text
**And** spacing between interactive elements sufficient (8px minimum)
**And** responsive breakpoints work correctly with zoom
**And** touch targets remain 44x44px minimum at all zoom levels (UX-6)
