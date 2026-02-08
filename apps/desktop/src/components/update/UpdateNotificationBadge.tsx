import { Download, Check } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUpdateStore } from '@/stores/update-store';
import { useTranscriptStore } from '@/stores/transcript-store';
import { useExportStore } from '@/stores/export-store';
import { useSegmentationStore } from '@/stores/segmentation-store';

interface UpdateNotificationBadgeProps {
  onClick: () => void;
}

export function UpdateNotificationBadge({ onClick }: UpdateNotificationBadgeProps) {
  const status = useUpdateStore((s) => s.status);
  const updateInfo = useUpdateStore((s) => s.updateInfo);
  const installOnQuit = useUpdateStore((s) => s.installOnQuit);
  const shouldShowNotification = useUpdateStore((s) => s.shouldShowNotification);

  const isTranscribing = useTranscriptStore((s) => s.isTranscribing);
  const isExporting = useExportStore((s) => s.isExporting);
  const isSegmenting = useSegmentationStore((s) => s.isSegmenting);

  const isBusy = isTranscribing || isExporting || isSegmenting;
  const shouldShow = shouldShowNotification(isBusy);

  // Show badge with check icon when install on quit is scheduled
  if (installOnQuit && status === 'ready') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="relative flex w-10 h-10 cursor-pointer items-center justify-center rounded-lg hover:bg-[#21344a] text-slate-400 transition-colors"
              onClick={onClick}
              data-testid="update-badge"
            >
              <Check className="w-5 h-5 text-green-500" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Installation programmée (v{updateInfo?.version})</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (!shouldShow) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="relative flex w-10 h-10 cursor-pointer items-center justify-center rounded-lg hover:bg-[#21344a] text-slate-400 transition-colors"
            onClick={onClick}
            data-testid="update-badge"
          >
            <Download className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Mise à jour disponible (v{updateInfo?.version})</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
