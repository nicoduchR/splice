import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CloudDownload } from 'lucide-react';

interface DownloadProgress {
  downloaded: number;
  total: number;
  percentage: number;
  speedMbps: number;
}

interface ModelDownloadDialogProps {
  isOpen: boolean;
  onCancel?: () => void;
  onRetry?: () => void;
}

export function ModelDownloadDialog({
  isOpen,
  onCancel,
  onRetry,
}: ModelDownloadDialogProps) {
  const [progress, setProgress] = useState<DownloadProgress>({
    downloaded: 0,
    total: 2_514_050_000, // ~2.5 GB (Parakeet ONNX INT8)
    percentage: 0,
    speedMbps: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleDownloadFailed = (event: { payload: { message: string } }) => {
      setError(event.payload.message);
      setIsDownloading(false);
    };

    // Écouter les événements de progression du téléchargement
    const unlistenProgress = listen<DownloadProgress>(
      'model:download_progress',
      (event) => {
        setProgress(event.payload);
        setIsDownloading(true);
        setError(null);
      }
    );

    // Écouter les événements d'erreur (backend current event name)
    const unlistenError = listen<{ message: string }>(
      'model:download-failed',
      handleDownloadFailed
    );

    // Legacy compatibility with previous underscore event name.
    const unlistenLegacyError = listen<{ message: string }>(
      'model:download_failed',
      handleDownloadFailed
    );

    // Écouter les événements de succès
    const unlistenSuccess = listen('model:download_completed', () => {
      setIsDownloading(false);
      // Le dialogue se fermera automatiquement via la logique parent
    });

    return () => {
      unlistenProgress.then((fn) => fn());
      unlistenError.then((fn) => fn());
      unlistenLegacyError.then((fn) => fn());
      unlistenSuccess.then((fn) => fn());
    };
  }, [isOpen]);

  // Calculer le temps restant estimé
  const calculateTimeRemaining = (): string => {
    if (progress.speedMbps === 0) return 'Calcul en cours...';

    const remainingBytes = progress.total - progress.downloaded;
    const remainingMB = remainingBytes / (1024 * 1024);
    const secondsRemaining = remainingMB / progress.speedMbps;

    if (secondsRemaining < 60) {
      return `~${Math.ceil(secondsRemaining)} secondes restant${
        Math.ceil(secondsRemaining) > 1 ? 's' : ''
      }`;
    } else {
      const minutes = Math.ceil(secondsRemaining / 60);
      return `~${minutes} minute${minutes > 1 ? 's' : ''} restant${
        minutes > 1 ? 'es' : 'e'
      }`;
    }
  };

  // Formater la vitesse de téléchargement
  const formatSpeed = (speedMbps: number): string => {
    return `${speedMbps.toFixed(1)} MB/s`;
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-xl p-0 gap-0 border-white/5 bg-card-dark">
        <div className="p-8 md:p-10 flex flex-col items-center relative z-50">
          {/* Icon Section */}
          <div className="mb-6 flex items-center justify-center p-4 rounded-full bg-primary/10 dark:bg-primary/20">
            <CloudDownload className="w-12 h-12 text-primary" />
          </div>

          {/* Heading */}
          <AlertDialogHeader className="mb-8">
            <AlertDialogTitle className="text-center text-xl md:text-2xl font-bold tracking-tight">
              Téléchargement du moteur de transcription
            </AlertDialogTitle>
            {error && (
              <AlertDialogDescription className="text-center text-destructive mt-4">
                {error}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>

          {/* Progress Details */}
          {!error && (
            <div className="w-full flex flex-col gap-3 mb-2">
              {/* Label & Percentage Row */}
              <div className="flex justify-between items-end">
                <p className="text-base font-medium text-gray-700 dark:text-gray-200">
                  Téléchargement en cours...
                </p>
                <p className="text-base font-bold text-primary tabular-nums">
                  {Math.round(progress.percentage)}%
                </p>
              </div>

              {/* Progress Bar */}
              <Progress value={progress.percentage} className="h-2" />

              {/* Speed Indicator */}
              {progress.speedMbps > 0 && (
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {formatSpeed(progress.speedMbps)}
                </p>
              )}
            </div>
          )}

          {/* Meta Information (Time) */}
          {!error && progress.speedMbps > 0 && (
            <div className="mt-8 mb-4 w-full flex justify-center">
              <p className="text-sm font-normal text-gray-500 dark:text-gray-400 text-center">
                {calculateTimeRemaining()}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <AlertDialogFooter className="w-full flex justify-center mt-4">
            {error ? (
              <div className="flex gap-3">
                <AlertDialogCancel asChild>
                  <Button
                    variant="ghost"
                    onClick={onCancel}
                    className="min-w-[5.25rem]"
                  >
                    Quitter
                  </Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button
                    variant="default"
                    onClick={onRetry}
                    className="min-w-[5.25rem]"
                  >
                    Réessayer
                  </Button>
                </AlertDialogAction>
              </div>
            ) : (
              <AlertDialogCancel asChild>
                <Button
                  variant="ghost"
                  onClick={onCancel}
                  disabled={isDownloading && progress.percentage > 90}
                  className="min-w-[5.25rem]"
                >
                  Annuler
                </Button>
              </AlertDialogCancel>
            )}
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
