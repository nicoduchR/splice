import { useEffect, useState, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Brain, Film, Lock, Cpu } from 'lucide-react';

interface TranscriptionProgress {
  video_id: string;
  stage: 'extracting' | 'loading' | 'transcribing' | 'completed';
  progress: number; // 0.0 to 1.0
  message: string;
}

interface VideoInfo {
  id: string;
  file_name: string;
  duration_seconds: number;
  file_size_bytes?: number;
}

interface TranscriptionProgressDialogProps {
  isOpen: boolean;
  progress: TranscriptionProgress;
  videoInfo: VideoInfo;
  onCancel?: () => void;
}

export function TranscriptionProgressDialog({
  isOpen,
  progress,
  videoInfo,
  onCancel,
}: TranscriptionProgressDialogProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [progressHistory, setProgressHistory] = useState<
    { timestamp: number; progress: number }[]
  >([]);

  // Screen reader: announce percentage every 10%
  const lastAnnouncedRef = useRef(0);
  const [srMessage, setSrMessage] = useState('');

  // Calculer le temps restant basé sur la progression
  useEffect(() => {
    if (!isOpen || progress.progress === 0) {
      setProgressHistory([]);
      setTimeRemaining(null);
      return;
    }

    // Ajouter à l'historique (functional update to avoid stale closure)
    setProgressHistory((prevHistory) => {
      const newHistory = [
        ...prevHistory,
        { timestamp: Date.now(), progress: progress.progress },
      ].slice(-10); // Garder les 10 derniers échantillons

      // Calculer temps restant si on a au moins 2 échantillons
      if (newHistory.length >= 2) {
        const first = newHistory[0];
        const last = newHistory[newHistory.length - 1];
        const deltaProgress = last.progress - first.progress;
        const deltaTime = last.timestamp - first.timestamp;

        if (deltaProgress > 0) {
          const speed = deltaProgress / deltaTime; // progress/ms
          const remaining = 1.0 - last.progress;
          const estimatedMs = remaining / speed;
          setTimeRemaining(Math.max(0, Math.round(estimatedMs / 1000)));
        }
      }

      return newHistory;
    });
  }, [progress.progress, isOpen]);

  // Screen reader: announce percentage every 10%
  useEffect(() => {
    const percent = progress.progress * 100;
    const currentTen = Math.floor(percent / 10);
    if (currentTen > lastAnnouncedRef.current && currentTen > 0) {
      lastAnnouncedRef.current = currentTen;
      setSrMessage(`Transcription ${currentTen * 10}% terminée`);
    }
    if (percent === 0) {
      lastAnnouncedRef.current = 0;
    }
  }, [progress.progress]);

  // Formater la durée de la vidéo
  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    const gb = (bytes / (1024 ** 3)).toFixed(1);
    return `${gb} GB`;
  };

  // Déterminer le message selon le stage
  const getStageMessage = (): string => {
    switch (progress.stage) {
      case 'extracting':
        return 'Extraction audio...';
      case 'loading':
        return 'Chargement du modèle...';
      case 'transcribing':
        return 'Transcription en cours...';
      case 'completed':
        return 'Transcription terminée!';
      default:
        return progress.message || 'Transcription en cours...';
    }
  };

  // Déterminer si on doit afficher la barre de progression
  const showProgressBar = videoInfo.duration_seconds > 600; // >10 min

  // Formater le temps restant
  const formatTimeRemaining = (): string => {
    if (timeRemaining === null || timeRemaining === 0) return '';
    if (timeRemaining < 60) {
      return `~${timeRemaining} seconde${timeRemaining > 1 ? 's' : ''} restante${timeRemaining > 1 ? 's' : ''}`;
    }
    const minutes = Math.ceil(timeRemaining / 60);
    return `~${minutes} minute${minutes > 1 ? 's' : ''} restante${minutes > 1 ? 's' : ''}`;
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel?.()}>
      <AlertDialogContent className="max-w-xl p-0 gap-0 border-white/5 bg-card-dark">
        {/* Accessible title for screen readers */}
        <AlertDialogTitle className="sr-only">
          Progression de la transcription - {videoInfo.file_name}
        </AlertDialogTitle>

        {/* Video Thumbnail Section */}
        <div className="relative w-full aspect-video bg-gray-800 group">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Play Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-black/40 rounded-full p-3 backdrop-blur-sm">
              <div className="w-10 h-10 flex items-center justify-center">
                <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1" />
              </div>
            </div>
          </div>

          {/* Duration Badge */}
          <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded">
            {formatDuration(videoInfo.duration_seconds)}
          </div>
        </div>

        {/* Content Container */}
        <div className="p-6 flex flex-col gap-6">
          {/* File Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Film aria-hidden="true" className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <h2 className="text-white text-base font-semibold truncate">
                {videoInfo.file_name}
              </h2>
              <span className="text-gray-400 text-xs">
                Video • {formatFileSize(videoInfo.file_size_bytes)} • Last modified today
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-card-border" />

          {/* Progress Section */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-primary animate-pulse-slow">
                <Brain aria-hidden="true" className="w-5 h-5" />
                <span className="text-sm font-medium tracking-wide">
                  {getStageMessage()}
                </span>
              </div>
              {showProgressBar && (
                <span className="text-white text-sm font-bold tabular-nums">
                  {Math.round(progress.progress * 100)}%
                </span>
              )}
            </div>

            {/* Progress Bar (only for videos >10 min) */}
            {showProgressBar ? (
              <div className="relative h-2.5 w-full bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress.progress * 100}%` }}
                >
                  <div className="shimmer" />
                </div>
              </div>
            ) : (
              // Simple spinner for videos <10 min
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            )}

            {/* Technical Metadata */}
            <div className="flex justify-between items-center text-xs text-gray-400">
              <div className="flex gap-2 items-center">
                <span>Parakeet TDT</span>
                <span className="w-1 h-1 rounded-full bg-gray-500" />
                <span className="flex items-center gap-1">
                  <Cpu aria-hidden="true" className="w-3.5 h-3.5" />
                  CPU
                </span>
              </div>
              {showProgressBar && timeRemaining !== null && (
                <span className="font-medium text-primary">
                  {formatTimeRemaining()}
                </span>
              )}
            </div>
          </div>

          {/* Privacy Footer Box */}
          <div className="mt-2 bg-[#1f1f25] border border-card-border rounded-lg p-3 flex items-start gap-3">
            <Lock aria-hidden="true" className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <p className="text-xs text-gray-300 font-medium">
                Transcription locale et sécurisée
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Aucune donnée ne quitte votre appareil. Le traitement est effectué entièrement hors ligne.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center pt-2">
            <AlertDialogCancel asChild>
              <Button
                variant="ghost"
                onClick={onCancel}
                className="min-w-[5.25rem]"
              >
                Annuler
              </Button>
            </AlertDialogCancel>
          </div>

          {/* Screen reader progress announce */}
          <div aria-live="polite" className="sr-only">
            {srMessage}
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
