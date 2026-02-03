# Story 7.3: Freemium Limitations & Enforcement

Status: done

## Story

As a user on the free plan,
I want to use all features freely until export,
So that I can see the value of the product before upgrading.

## Acceptance Criteria

1. **AC1: No Import Restrictions for Freemium**
   - Given user has free/freemium license (plan = 'free')
   - When importing any video (any duration, up to 50GB size limit)
   - Then import proceeds normally with no license-based restrictions
   - And all existing import validations apply (format, size, codec)

2. **AC2: Full Feature Access for Freemium**
   - Given freemium user has imported a video
   - When using transcription, text selection, cut editing, preview
   - Then all features work normally regardless of license plan
   - And no license checks during the editing workflow

3. **AC3: Export Blocked for Freemium Users (FR37)**
   - Given freemium user clicks "Exporter" button
   - When export action is triggered
   - Then ExportBlockedDialog is displayed instead of ExportDialog
   - And export functionality is prevented

4. **AC4: Export Blocked Dialog Content**
   - Given ExportBlockedDialog is shown
   - Then dialog displays:
     - Title: "Export réservé à Splice Pro"
     - Message: "Vous avez créé un montage parfait! Pour exporter votre vidéo, passez à Splice Pro."
     - "Passer à Pro" button (emerald green, prominent)
     - "Fermer" button (secondary)
   - And clicking "Passer à Pro" triggers upgrade flow (Story 7.4)
   - And clicking "Fermer" closes the dialog

5. **AC5: Pro Users Can Export Normally**
   - Given user has pro license (plan = 'pro')
   - When clicking "Exporter" button
   - Then ExportDialog opens normally
   - And export proceeds without restrictions

## Tasks / Subtasks

- [x] Task 1: Create ExportBlockedDialog Component (AC: #3, #4)
  - [x] 1.1 Create `components/license-modal/ExportBlockedDialog.tsx`
  - [x] 1.2 Implement dialog with shadcn/ui AlertDialog:
     - Title, message, buttons per AC4
     - "Passer à Pro" button (bg-emerald-600)
     - "Fermer" button (secondary)
  - [x] 1.3 Style consistently (bg-gray-950, border-gray-800)
  - [x] 1.4 Add props: `isOpen, onUpgrade, onClose`
  - [x] 1.5 Write component tests

- [x] Task 2: Add Export Store License Check (AC: #3, #5)
  - [x] 2.1 Add `showExportBlockedDialog: boolean` state to export-store
  - [x] 2.2 Add `closeExportBlockedDialog` action
  - [x] 2.3 Modify `openExportDialog` action to:
     - Check `useLicenseStore.getState().plan`
     - If 'free' → set `showExportBlockedDialog = true`
     - If 'pro' → set `isExportDialogOpen = true`
  - [x] 2.4 Write store tests for license check behavior

- [x] Task 3: Integrate ExportBlockedDialog in App (AC: #3)
  - [x] 3.1 Import ExportBlockedDialog in App.tsx or ExportDialog parent
  - [x] 3.2 Connect to export store state
  - [x] 3.3 Handle "Passer à Pro" click → placeholder for Story 7.4
  - [x] 3.4 Handle "Fermer" click → closeExportBlockedDialog

- [x] Task 4: Update License Modal Exports (AC: #3)
  - [x] 4.1 Export ExportBlockedDialog from `components/license-modal/index.ts`

- [x] Task 5: Write Integration Tests (AC: #3, #5)
  - [x] 5.1 Test: freemium user clicks export → ExportBlockedDialog shown
  - [x] 5.2 Test: pro user clicks export → ExportDialog shown
  - [x] 5.3 Test: dialog buttons work correctly

## Dev Notes

### Architecture Compliance

Cette story est simple: bloquer l'export pour les freemium via une vérification côté frontend.

**Flow:**
```
User clicks "Exporter"
    ↓
export-store.openExportDialog()
    ↓
Check license-store.plan
    ↓
If 'free' → showExportBlockedDialog = true
If 'pro'  → isExportDialogOpen = true
```

### ExportBlockedDialog Component

```tsx
// components/license-modal/ExportBlockedDialog.tsx
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

interface ExportBlockedDialogProps {
  isOpen: boolean;
  onUpgrade: () => void;
  onClose: () => void;
}

export function ExportBlockedDialog({
  isOpen,
  onUpgrade,
  onClose,
}: ExportBlockedDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="bg-gray-950 border-gray-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            Export réservé à Splice Pro
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            Vous avez créé un montage parfait! Pour exporter votre vidéo, passez à Splice Pro.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} className="border-gray-700">
            Fermer
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onUpgrade}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Passer à Pro
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Export Store Modification

```typescript
// stores/export-store.ts - ADD license check
interface ExportStore {
  // ... existing state ...
  showExportBlockedDialog: boolean;

  // ... existing actions ...
  closeExportBlockedDialog: () => void;
}

// Modify openExportDialog:
openExportDialog: () => {
  const plan = useLicenseStore.getState().plan;

  if (plan === 'free') {
    set({ showExportBlockedDialog: true });
    return;
  }

  set({ isExportDialogOpen: true });
},

closeExportBlockedDialog: () => {
  set({ showExportBlockedDialog: false });
},
```

### Integration in App.tsx or Parent Component

```tsx
// Where ExportDialog is rendered, add ExportBlockedDialog
import { ExportBlockedDialog } from '@/components/license-modal';
import { useExportStore } from '@/stores/export-store';

function App() {
  const showExportBlockedDialog = useExportStore(s => s.showExportBlockedDialog);
  const closeExportBlockedDialog = useExportStore(s => s.closeExportBlockedDialog);

  const handleUpgrade = () => {
    closeExportBlockedDialog();
    // TODO Story 7.4: Trigger upgrade flow
    console.log('Upgrade flow - implemented in Story 7.4');
  };

  return (
    <>
      {/* ... existing content ... */}
      <ExportDialog />
      <ExportBlockedDialog
        isOpen={showExportBlockedDialog}
        onUpgrade={handleUpgrade}
        onClose={closeExportBlockedDialog}
      />
    </>
  );
}
```

### Project Structure Notes

**New Files:**
```
apps/desktop/src/components/license-modal/
├── ExportBlockedDialog.tsx (NEW)
├── ExportBlockedDialog.test.tsx (NEW)
└── index.ts (MODIFY - add export)
```

**Files to Modify:**
- `apps/desktop/src/stores/export-store.ts` - Add blocked dialog state + license check
- `apps/desktop/src/App.tsx` - Add ExportBlockedDialog component

### Testing Strategy

**Component Tests:**
- `ExportBlockedDialog.test.tsx`:
  - Renders with correct title/message
  - "Fermer" button calls onClose
  - "Passer à Pro" button calls onUpgrade
  - Dialog closes on overlay click

**Store Tests:**
- `export-store.test.ts`:
  - `openExportDialog` with plan='free' → showExportBlockedDialog=true
  - `openExportDialog` with plan='pro' → isExportDialogOpen=true
  - `closeExportBlockedDialog` → showExportBlockedDialog=false

### Important Notes

1. **No Backend Changes** - This story is frontend-only. No Rust code needed.

2. **Upgrade Flow Placeholder** - "Passer à Pro" click should prepare for Story 7.4. For now, just log or show a toast.

3. **License Store Dependency** - Uses existing `useLicenseStore` from Story 7.2 to get `plan` state.

4. **Story 7.4 Dependency** - Full conversion flow (Stripe checkout, payment) is in Story 7.4.

### References

- [Source: epic-7-license-management-monetization.md#Story-7.3] - Original requirements (adapted)
- [Source: 7-2-license-verification-on-app-startup.md] - License store with plan state
- [Source: apps/desktop/src/stores/export-store.ts] - Export store to modify
- [Source: apps/desktop/src/stores/license-store.ts] - License plan state
- [Source: apps/desktop/src/components/export/ExportDialog.tsx] - Export dialog pattern

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - No debugging issues encountered

### Completion Notes List

- ✅ Created ExportBlockedDialog component with AlertDialog from shadcn/ui
- ✅ Styled dialog with dark theme (bg-gray-950, border-gray-800)
- ✅ Implemented emerald green "Passer à Pro" button (bg-emerald-600)
- ✅ Added license check in export-store.openExportDialog()
- ✅ Integrated ExportBlockedDialog in App.tsx
- ✅ Added 11 component tests for ExportBlockedDialog
- ✅ Added 4 store tests for license check behavior
- ✅ All 41 related tests passing (11 component + 20 export-store + 10 license-store)
- ✅ TypeScript compilation successful
- ✅ "Passer à Pro" click logs placeholder for Story 7.4
- ✅ Added LICENSE_PLAN constants (FREE, PRO) in license-api.ts for centralized plan values

### File List

**New Files:**
- apps/desktop/src/components/license-modal/ExportBlockedDialog.tsx
- apps/desktop/src/components/license-modal/ExportBlockedDialog.test.tsx

**Modified Files:**
- apps/desktop/src/components/license-modal/index.ts
- apps/desktop/src/stores/export-store.ts
- apps/desktop/src/stores/export-store.test.ts
- apps/desktop/src/App.tsx
- apps/desktop/src/services/license-api.ts (added LICENSE_PLAN constants)
- apps/desktop/src/stores/license-store.ts (updated to use LICENSE_PLAN constants)
- apps/desktop/src/stores/license-store.test.ts (added LICENSE_PLAN to mock)

## Change Log

- 2026-02-03: Added LICENSE_PLAN constants (FREE, PRO) for centralized plan values - easier to search and maintain
- 2026-02-03: Story 7.3 implementation complete - Freemium export blocking with ExportBlockedDialog
- 2026-02-03: **Code Review Fixes Applied:**
  - Removed console.log in production (App.tsx)
  - Changed license check from `=== FREE` to `!== PRO` for defensive coding (export-store.ts)
  - Updated license-store.ts to use LICENSE_PLAN constants instead of string literals
  - Updated license-store.test.ts mock to export LICENSE_PLAN
  - Added test for overlay click closing dialog behavior
  - Added 2 defensive tests for undefined/corrupted plan state
  - Total: 44 tests passing
