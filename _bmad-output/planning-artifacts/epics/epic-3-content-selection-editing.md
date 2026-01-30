# Epic 3: Content Selection & Editing

Les utilisateurs peuvent sélectionner les passages à garder en surlignant le texte du transcript.

## Story 3.1: Text Selection & Highlighting

As a user,
I want to highlight passages of text in the transcript,
So that I can mark which parts of my video to keep.

**Acceptance Criteria:**

**Given** transcript is displayed (FR15)
**When** user selects text by clicking and dragging
**Then** selected words highlighted with emerald green background (`bg-emerald-500/30`)
**And** multi-word selection supported (click word 1, shift+click word 10 = select words 1-10)
**And** click individual words to toggle selection
**And** keyboard selection: Shift + Arrow keys extend selection (UX-4)
**And** selected text stored in Zustand transcript store
**And** selected ranges saved to SQLite `selections` table:
  ```sql
  CREATE TABLE selections (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    start_word_index INTEGER NOT NULL,
    end_word_index INTEGER NOT NULL,
    start_time REAL NOT NULL,
    end_time REAL NOT NULL,
    created_at INTEGER NOT NULL
  );
  ```
**And** selections auto-saved every 30 seconds (NFR25)
**And** UI responds to selection in less than 100ms (NFR7)

---

## Story 3.2: De-Selection & Selection Management

As a user,
I want to un-highlight previously selected text,
So that I can refine my selection and remove parts I don't want.

**Acceptance Criteria:**

**Given** text is currently highlighted (FR17)
**When** user clicks on highlighted text again
**Then** highlight removed and text returns to normal state
**And** selection record deleted from SQLite `selections` table
**And** Zustand store updated to reflect removal
**And** keyboard shortcut Escape clears all selections (UX-4)
**And** "Clear all selections" button available in toolbar
**And** confirmation dialog: "Effacer toutes les sélections?" (Yes/No)
**And** undo/redo functionality available (Cmd+Z / Cmd+Shift+Z)
**And** selection state restored on app restart (NFR26, NFR27)

---

## Story 3.3: Timeline Visualization & Sync

As a user,
I want to see my selected text passages visualized on a timeline,
So that I can understand the structure of my edited video at a glance.

**Acceptance Criteria:**

**Given** text selections have been made (FR18)
**When** timeline component renders
**Then** timeline shows full video duration as horizontal bar
**And** selected segments displayed as emerald green blocks on timeline
**And** unselected segments displayed as gray or transparent
**And** hovering over segment shows tooltip with:
  - Start/end timecodes
  - Duration of segment
  - Text preview (first 50 characters)
**And** clicking timeline segment scrolls transcript to corresponding text
**And** timeline synchronized with transcript editor (changes reflect immediately)
**And** timeline uses Zustand timeline store for state management
**And** playhead indicator shows current position (if preview playing)
**And** timeline scales responsively to window width (UX-2, UX-3)

---

## Story 3.4: Selection Statistics & Feedback

As a user,
I want to see statistics about my selections,
So that I know how much content I'm keeping and the final video duration.

**Acceptance Criteria:**

**Given** user has made selections
**When** selections change
**Then** statistics panel displays:
  - Total original video duration: "45:30"
  - Total selected duration: "12:45"
  - Reduction percentage: "71% réduction"
  - Number of segments: "23 segments"
  - Estimated final video length
**And** statistics update in real-time as selections change
**And** color coding: Green if >50% reduction, yellow if 20-50%, gray if <20%
**And** statistics help user gauge editing progress
**And** export button disabled if no selections made

---
