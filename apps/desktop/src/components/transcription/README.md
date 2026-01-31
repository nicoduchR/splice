# Transcription Components

This directory contains React components for the transcription feature of Splice.

## Components

### TranscriptionProgressDialog

A modal dialog that displays real-time transcription progress with video information, progress tracking, and cancellation support.

**Features:**
- Real-time progress updates via Tauri events
- Video thumbnail with duration badge
- File information display
- Adaptive progress indicators (progress bar for long videos, spinner for short ones)
- Time remaining estimation
- Privacy notice
- Cancellation support

**Usage:**

```tsx
import { TranscriptionProgressDialog } from '@/components/transcription';

function MyComponent() {
  const isTranscribing = useTranscriptStore(s => s.isTranscribing);
  const progress = useTranscriptStore(s => s.transcriptionProgress);
  const cancelTranscription = useTranscriptStore(s => s.cancelTranscription);
  const currentProject = useVideoStore(s => s.currentProject);

  return (
    <TranscriptionProgressDialog
      isOpen={isTranscribing}
      progress={progress}
      videoInfo={{
        id: currentProject.id,
        file_name: currentProject.file_name,
        duration_seconds: currentProject.duration_seconds,
        file_size_bytes: currentProject.file_size_bytes,
      }}
      onCancel={cancelTranscription}
    />
  );
}
```

**Props:**

```typescript
interface TranscriptionProgressDialogProps {
  isOpen: boolean;                    // Whether the dialog is visible
  progress: TranscriptionProgress;    // Current transcription progress
  videoInfo: VideoInfo;               // Video metadata
  onCancel?: () => void;              // Cancel callback
}

interface TranscriptionProgress {
  video_id: string;
  stage: 'extracting' | 'loading' | 'transcribing' | 'completed';
  progress: number;    // 0.0 to 1.0
  message: string;
}

interface VideoInfo {
  id: string;
  file_name: string;
  duration_seconds: number;
  file_size_bytes?: number;
}
```

**Design Reference:**

The component follows the design specification in `/designs/splice_transcription_progress_screen/code.html`.

**Backend Integration:**

The component listens to Tauri events emitted by the `transcribe_video` command:
- `transcription:progress` - Progress updates
- `transcription:completed` - Transcription completion
- `transcription:error` - Error events

**Testing:**

Run tests with:
```bash
npm test -- TranscriptionProgressDialog
```

## Architecture

- **Pattern:** Follows the established pattern from `ModelDownloadDialog.tsx`
- **State Management:** Uses Zustand store for global transcription state
- **Events:** Tauri event listeners with proper cleanup
- **Styling:** Tailwind CSS with design system tokens
- **Animations:** Shimmer effect on progress bar, slow pulse on status text
