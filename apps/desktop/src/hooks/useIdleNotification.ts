import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useUpdateStore } from '@/stores/update-store';
import { useTranscriptStore } from '@/stores/transcript-store';
import { useExportStore } from '@/stores/export-store';
import { useSegmentationStore } from '@/stores/segmentation-store';

export function useIdleNotification() {
  const status = useUpdateStore((s) => s.status);
  const updateInfo = useUpdateStore((s) => s.updateInfo);
  const remindLaterUntil = useUpdateStore((s) => s.remindLaterUntil);

  const isTranscribing = useTranscriptStore((s) => s.isTranscribing);
  const isExporting = useExportStore((s) => s.isExporting);
  const isSegmenting = useSegmentationStore((s) => s.isSegmenting);

  const isBusy = isTranscribing || isExporting || isSegmenting;
  const wasBusyRef = useRef(false);
  const toastShownForVersionRef = useRef<string | null>(null);

  useEffect(() => {
    const wasBusy = wasBusyRef.current;
    wasBusyRef.current = isBusy;

    // Detect busy → idle transition
    if (wasBusy && !isBusy) {
      const isReady = status === 'ready';
      const isReminded = remindLaterUntil != null && Date.now() < remindLaterUntil;
      const version = updateInfo?.version;

      if (isReady && !isReminded && version && toastShownForVersionRef.current !== version) {
        toastShownForVersionRef.current = version;
        toast.info(`Mise à jour v${version} disponible`, {
          description: "Cliquez sur l'icône de mise à jour pour plus de détails.",
          duration: 5000,
        });
      }
    }
  }, [isBusy, status, updateInfo?.version, remindLaterUntil]);
}
