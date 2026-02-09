import { useEffect, useState, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Scissors, TrendingUp, Info } from 'lucide-react';
import type { SegmentationProgress } from '@splice/types/generated';
import type { ValidationProgress, SegmentationStats } from '@/stores/segmentation-store';

interface SegmentationProgressDialogProps {
  isOpen: boolean;
  progress: SegmentationProgress | null;
  isValidating?: boolean;
  validationProgress?: ValidationProgress | null;
  isConcatenating?: boolean;
  stats?: SegmentationStats | null;
  onCancel: () => void;
}

function formatDuration(totalSecs: number): { value: string; unit?: string; min?: number; sec?: number } {
  const min = Math.floor(totalSecs / 60);
  const sec = Math.round(totalSecs % 60);
  return { value: `${min}`, min, sec };
}

export function SegmentationProgressDialog({
  isOpen,
  progress,
  isValidating = false,
  validationProgress,
  isConcatenating = false,
  stats,
  onCancel,
}: SegmentationProgressDialogProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [progressHistory, setProgressHistory] = useState<
    { timestamp: number; progress: number }[]
  >([]);

  // Screen reader: announce percentage every 10%
  const lastAnnouncedRef = useRef(0);
  const [srMessage, setSrMessage] = useState('');

  // Determine current phase
  const phase: 'segmenting' | 'validating' | 'concatenating' = isConcatenating
    ? 'concatenating'
    : isValidating
      ? 'validating'
      : 'segmenting';

  // Active progress values
  const activeCurrentSegment = isValidating
    ? (validationProgress?.current_segment ?? 0)
    : (progress?.current_segment ?? 0);
  const activeTotalSegments = isValidating
    ? (validationProgress?.total_segments ?? 0)
    : (progress?.total_segments ?? 0);
  const currentSegment = progress?.current_segment ?? 0;
  const totalSegments = progress?.total_segments ?? 0;
  const progressPercent = activeTotalSegments > 0
    ? (activeCurrentSegment / activeTotalSegments) * 100
    : 0;

  // Phase labels
  const phaseLabel = {
    segmenting: 'Traitement en cours...',
    validating: 'Validation en cours...',
    concatenating: 'Assemblage final...',
  }[phase];

  const phaseSubtext = {
    segmenting: 'FFmpeg \u2022 D\u00e9coupage pr\u00e9cis',
    validating: 'FFprobe \u2022 V\u00e9rification qualit\u00e9',
    concatenating: 'FFmpeg \u2022 Concat demuxer',
  }[phase];

  // Reset progress history on phase change
  useEffect(() => {
    setProgressHistory([]);
    setTimeRemaining(null);
  }, [phase]);

  // ETA calculation
  useEffect(() => {
    if (!isOpen || activeCurrentSegment === 0 || isConcatenating) {
      setProgressHistory([]);
      setTimeRemaining(null);
      return;
    }

    setProgressHistory((prevHistory) => {
      const normalizedProgress = activeCurrentSegment / activeTotalSegments;
      const newHistory = [
        ...prevHistory,
        { timestamp: Date.now(), progress: normalizedProgress },
      ].slice(-10);

      if (newHistory.length >= 2) {
        const first = newHistory[0];
        const last = newHistory[newHistory.length - 1];
        const deltaProgress = last.progress - first.progress;
        const deltaTime = last.timestamp - first.timestamp;

        if (deltaProgress > 0) {
          const speed = deltaProgress / deltaTime;
          const remaining = 1.0 - last.progress;
          const estimatedMs = remaining / speed;
          setTimeRemaining(Math.max(0, Math.round(estimatedMs / 1000)));
        }
      }

      return newHistory;
    });
  }, [activeCurrentSegment, activeTotalSegments, isOpen, isConcatenating]);

  // Screen reader: announce percentage every 10%
  useEffect(() => {
    const currentTen = Math.floor(progressPercent / 10);
    if (currentTen > lastAnnouncedRef.current && currentTen > 0) {
      lastAnnouncedRef.current = currentTen;
      setSrMessage(`Génération des cuts ${currentTen * 10}% terminée`);
    }
    if (progressPercent === 0) {
      lastAnnouncedRef.current = 0;
    }
  }, [progressPercent]);

  const formatTimeRemaining = (): string => {
    if (timeRemaining === null || timeRemaining === 0) return '';
    if (timeRemaining < 60) {
      return `~${timeRemaining}s`;
    }
    const minutes = Math.ceil(timeRemaining / 60);
    return `~${minutes}min`;
  };

  // Stats formatting
  const duration = stats ? formatDuration(stats.final_duration_secs) : null;
  const reductionPercent = stats ? Math.round(stats.reduction_percent) : null;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-xl p-0 gap-0 border-white/5 bg-[#222229] shadow-2xl rounded-2xl overflow-hidden">
        <AlertDialogTitle className="sr-only">
          G&eacute;n&eacute;ration des cuts vid&eacute;o
        </AlertDialogTitle>
        <AlertDialogDescription className="sr-only">
          Progression de la g&eacute;n&eacute;ration des segments vid&eacute;o
        </AlertDialogDescription>

        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-primary/5 blur-3xl rounded-full pointer-events-none" />

        <div className="p-8 md:p-10 relative z-10 flex flex-col items-center text-center">
          {/* Header Icon */}
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-50" />
            <Scissors aria-hidden="true" className="w-12 h-12 text-primary relative z-10 drop-shadow-[0_0_15px_rgba(21,128,249,0.5)]" />
          </div>

          {/* Title */}
          <h2 className="text-white font-bold text-3xl tracking-tight mb-8">
            G&eacute;n&eacute;ration des cuts
          </h2>

          {/* Stats Box */}
          {stats && (
            <div className="w-full bg-[#2F2F38] rounded-xl p-6 grid grid-cols-3 divide-x divide-white/10 mb-10 border border-white/5">
              {/* Segments */}
              <div className="flex flex-col items-center justify-center px-2">
                <span className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
                  Segments
                </span>
                <span className="text-white text-xl md:text-2xl font-bold">
                  {stats.segment_count}
                </span>
              </div>

              {/* Final Duration */}
              <div className="flex flex-col items-center justify-center px-2">
                <span className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
                  Dur&eacute;e finale
                </span>
                <span className="text-white text-xl md:text-2xl font-bold whitespace-nowrap">
                  {duration && (
                    <>
                      {duration.min}<span className="text-sm font-normal ml-0.5 opacity-70">min</span>
                      {' '}{duration.sec}<span className="text-sm font-normal ml-0.5 opacity-70">s</span>
                    </>
                  )}
                </span>
              </div>

              {/* Reduction */}
              <div className="flex flex-col items-center justify-center px-2">
                <span className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
                  Gain
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-white text-xl md:text-2xl font-bold">
                    {reductionPercent}%
                  </span>
                  <TrendingUp aria-hidden="true" className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
            </div>
          )}

          {/* Progress Section */}
          <div className="w-full flex flex-col gap-3 text-left mb-8">
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-2">
                {!isConcatenating ? (
                  <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
                ) : (
                  <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
                )}
                <span className="text-gray-200 font-medium text-base">
                  {phaseLabel}
                </span>
              </div>
              {!isConcatenating && activeTotalSegments > 0 && (
                <span className="text-primary font-bold text-lg font-mono tabular-nums">
                  {Math.round(progressPercent)}%
                </span>
              )}
            </div>

            {/* Progress Bar */}
            {!isConcatenating && activeTotalSegments > 0 ? (
              <div className="h-2 w-full bg-[#15151a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[hsl(var(--primary-button))] rounded-full relative overflow-hidden transition-all duration-300 ease-out shadow-[0_0_10px_rgba(23,128,249,0.4)]"
                  style={{ width: `${progressPercent}%` }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full" />
                </div>
              </div>
            ) : isConcatenating ? (
              /* Indeterminate bar for concatenation */
              <div className="h-2 w-full bg-[#15151a] rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-[hsl(var(--primary-button))] rounded-full relative overflow-hidden shadow-[0_0_10px_rgba(23,128,249,0.4)] animate-[indeterminate_1.5s_ease-in-out_infinite]" />
              </div>
            ) : null}

            {/* Technical Subtext */}
            <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
              <div className="flex items-center gap-1.5">
                <span className="font-mono tracking-tight">{phaseSubtext}</span>
              </div>
              {!isConcatenating && activeTotalSegments > 0 && (
                <span className="font-mono tabular-nums">
                  {phase === 'segmenting'
                    ? `segment ${currentSegment}/${totalSegments}`
                    : `${activeCurrentSegment}/${activeTotalSegments}`
                  }
                  {timeRemaining !== null && timeRemaining > 0 && (
                    <> &middot; {formatTimeRemaining()}</>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="w-full pt-6 border-t border-white/10 flex items-start gap-3 text-left">
            <Info aria-hidden="true" className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-gray-400 text-sm leading-relaxed">
              Marge automatique de <span className="text-gray-200 font-semibold">0.1s</span> ajout&eacute;e pour des transitions naturelles.
            </p>
          </div>

          {/* Cancel Button */}
          <div className="mt-6">
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white"
              onClick={onCancel}
            >
              Annuler
            </Button>
          </div>

          {/* Screen reader progress announce */}
          <div aria-live="polite" className="sr-only">
            {srMessage}
          </div>
        </div>
      </AlertDialogContent>

      {/* Shimmer + indeterminate keyframes */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(200%); }
        }
        @keyframes indeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </AlertDialog>
  );
}
