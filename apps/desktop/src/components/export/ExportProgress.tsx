import { useState, useRef, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useExportStore, type ExportProgressInfo } from '../../stores/export-store';

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

export function ExportProgress() {
  const isExporting = useExportStore(s => s.isExporting);
  const progress = useExportStore(s => s.exportProgress);
  const cancelExport = useExportStore(s => s.cancelExport);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const lastAnnouncedRef = useRef(0);
  const [announcePercent, setAnnouncePercent] = useState<string>('');

  const percent = progress?.percent ?? 0;

  // Announce percentage every 10% for screen readers
  useEffect(() => {
    const rounded = Math.floor(percent / 10) * 10;
    if (rounded > lastAnnouncedRef.current && rounded > 0) {
      lastAnnouncedRef.current = rounded;
      setAnnouncePercent(`Export ${rounded}% terminé`);
    }
    if (percent === 0) {
      lastAnnouncedRef.current = 0;
    }
  }, [percent]);

  if (!isExporting || !progress) return null;

  const handleCancel = () => {
    setShowCancelDialog(false);
    cancelExport();
  };

  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
      <h3 className="text-gray-200 font-medium text-base mb-3">Export en cours...</h3>

      {/* Progress bar */}
      <div
        className="h-2 w-full bg-gray-800 rounded-full overflow-hidden mb-3"
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progression de l'export"
      >
        <div
          className="h-full bg-emerald-600 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-y-1.5 text-sm mb-3">
        <div>
          <span className="text-gray-500">Progression : </span>
          <span className="text-emerald-500 font-medium">{Math.round(percent)}%</span>
        </div>

        {progress.currentFrame != null && (
          <div>
            <span className="text-gray-500">Frames : </span>
            <span className="text-gray-300">
              {progress.currentFrame.toLocaleString()}
              {progress.totalFrames != null ? ` / ${progress.totalFrames.toLocaleString()}` : ''}
            </span>
          </div>
        )}

        {progress.speed != null && progress.speed > 0 && (
          <div>
            <span className="text-gray-500">Vitesse : </span>
            <span className="text-gray-300">{progress.speed.toFixed(1)}x realtime</span>
          </div>
        )}

        {progress.fps != null && progress.fps > 0 && (
          <div>
            <span className="text-gray-500">FPS : </span>
            <span className="text-gray-300">{progress.fps.toFixed(0)}</span>
          </div>
        )}

        {progress.elapsedSecs != null && (
          <div>
            <span className="text-gray-500">Temps : </span>
            <span className="text-gray-300">
              {formatTime(progress.elapsedSecs)}
              {progress.eta != null && progress.eta > 0
                ? ` / ~${formatTime(progress.elapsedSecs + progress.eta)}`
                : ''}
            </span>
          </div>
        )}

        {progress.eta != null && progress.eta > 0 && (
          <div>
            <span className="text-gray-500">Restant : </span>
            <span className="text-gray-500 text-xs">{formatTime(progress.eta)}</span>
          </div>
        )}

        {progress.fileSizeBytes != null && (
          <div>
            <span className="text-gray-500">Taille : </span>
            <span className="text-gray-300">
              {formatFileSize(progress.fileSizeBytes)}
              {progress.estimatedTotalBytes != null
                ? ` / ~${formatFileSize(progress.estimatedTotalBytes)}`
                : ''}
            </span>
          </div>
        )}
      </div>

      {/* Cancel button */}
      <Button
        variant="ghost"
        size="sm"
        className="text-gray-400 hover:text-red-400"
        onClick={() => setShowCancelDialog(true)}
      >
        Annuler l'export
      </Button>

      {/* Screen reader announce */}
      <div aria-live="polite" className="sr-only">
        {announcePercent}
      </div>

      {/* Cancel confirmation dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-gray-950 border-gray-800">
          <AlertDialogTitle className="text-white">Annuler l'export ?</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            L'export en cours sera interrompu et le fichier partiel supprimé.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700">Continuer l'export</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleCancel}
            >
              Annuler l'export
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
