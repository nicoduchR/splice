import { useEffect, useState, useRef } from 'react';
import { Brain, Film, Lock, Cpu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { convertFileSrc } from '@tauri-apps/api/core';

interface TranscriptionProgress {
  video_id: string;
  stage: 'extracting' | 'loading' | 'transcribing' | 'completed';
  progress: number; // 0.0 to 1.0
  message: string;
}

interface VideoInfo {
  id: string;
  file_name: string;
  file_path: string;
  duration_seconds: number;
  file_size_bytes?: number;
}

interface TranscriptionScreenProps {
  progress: TranscriptionProgress;
  videoInfo: VideoInfo;
  onCancel?: () => void;
}

export function TranscriptionScreen({
  progress,
  videoInfo,
  onCancel,
}: TranscriptionScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [progressHistory, setProgressHistory] = useState<
    { timestamp: number; progress: number }[]
  >([]);
  const [videoSrc, setVideoSrc] = useState<string>('');

  // Convertir le chemin du fichier en URL utilisable
  useEffect(() => {
    try {
      // Tauri v2: convertFileSrc avec protocole asset explicite
      const assetUrl = convertFileSrc(videoInfo.file_path, 'asset');
      setVideoSrc(assetUrl);
    } catch (error) {
      console.error('Failed to convert file source:', error);
    }
  }, [videoInfo.file_path]);

  // Synchroniser la position vidéo avec la progression
  useEffect(() => {
    if (videoRef.current && videoInfo.duration_seconds > 0) {
      const estimatedTime = progress.progress * videoInfo.duration_seconds;
      videoRef.current.currentTime = estimatedTime;
    }
  }, [progress.progress, videoInfo.duration_seconds]);

  // Calculer le temps restant basé sur la progression
  useEffect(() => {
    if (progress.progress === 0) {
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
    <div className="min-h-screen bg-background-dark flex items-center justify-center p-6">
      <div className="w-full max-w-[680px] flex flex-col gap-8">
        {/* Video Thumbnail Card */}
        <div className="bg-card-dark rounded-xl border border-white/5 overflow-hidden shadow-2xl">
          {/* Video Preview Section */}
          <div className="relative w-full aspect-video bg-gray-800 group">
            {/* Video Element */}
            {videoSrc ? (
              <video
                ref={videoRef}
                src={videoSrc}
                className="w-full h-full object-contain"
                muted
                playsInline
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

            {/* Duration Badge */}
            <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded">
              {formatDuration(videoInfo.duration_seconds)}
            </div>

            {/* Cancel button */}
            {onCancel && (
              <div className="absolute top-3 right-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onCancel}
                  className="bg-black/40 backdrop-blur-sm hover:bg-black/60"
                >
                  <X className="w-5 h-5 text-white" />
                </Button>
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Film className="w-5 h-5 text-primary" />
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

            {/* Progress Section */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-primary animate-pulse-slow">
                  <Brain className="w-5 h-5" />
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
                    className="absolute top-0 left-0 h-full bg-[hsl(var(--primary-button))] rounded-full transition-all duration-300 ease-out"
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
                    <Cpu className="w-3.5 h-3.5" />
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
            <div className="mt-6 bg-[#1f1f25] border border-card-border rounded-lg p-3 flex items-start gap-3">
              <Lock className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <p className="text-xs text-gray-300 font-medium">
                  Transcription locale et sécurisée
                </p>
                <p className="text-[11px] text-gray-400 leading-tight">
                  Aucune donnée ne quitte votre appareil. Le traitement est effectué entièrement hors ligne.
                </p>
              </div>
            </div>

            {/* Action Button */}
            {onCancel && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="ghost"
                  onClick={onCancel}
                  className="min-w-[120px]"
                >
                  Annuler
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
