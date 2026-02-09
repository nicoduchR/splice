import { useState, useEffect, useCallback, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { ModelService } from '@/services/model-service';
import type { ModelMetadata } from '@/services/model-service';
import { getNetworkErrorMessage } from '@/lib/error-messages';

/**
 * Check if running in Tauri context (vs browser dev mode)
 * In Tauri 2.0, we check if the invoke function exists
 */
function isTauriContext(): boolean {
  try {
    // Try to access Tauri's invoke - will exist in Tauri, undefined in browser
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  } catch {
    return false;
  }
}

interface UseModelDownloadReturn {
  /** Le dialogue de téléchargement doit-il être affiché ? */
  showDialog: boolean;
  /** Le modèle est-il en cours de vérification ? */
  isChecking: boolean;
  /** Le modèle est-il prêt à l'utilisation ? */
  isReady: boolean;
  /** Métadonnées du modèle */
  modelStatus: ModelMetadata | null;
  /** Erreur éventuelle */
  error: string | null;
  /** Annuler le téléchargement et fermer l'app */
  cancelDownload: () => Promise<void>;
  /** Réessayer le téléchargement */
  retryDownload: () => Promise<void>;
  /** Fermer le dialogue */
  closeDialog: () => void;
}

/**
 * Hook personnalisé pour gérer le téléchargement du modèle Parakeet
 *
 * Ce hook gère automatiquement la vérification du statut du modèle au montage
 * et affiche le dialogue de téléchargement si nécessaire.
 *
 * @example
 * ```tsx
 * function App() {
 *   const {
 *     showDialog,
 *     isReady,
 *     cancelDownload,
 *     retryDownload
 *   } = useModelDownload();
 *
 *   if (!isReady) {
 *     return (
 *       <ModelDownloadDialog
 *         isOpen={showDialog}
 *         onCancel={cancelDownload}
 *         onRetry={retryDownload}
 *       />
 *     );
 *   }
 *
 *   return <YourApp />;
 * }
 * ```
 */
export function useModelDownload(): UseModelDownloadReturn {
  const [showDialog, setShowDialog] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [modelStatus, setModelStatus] = useState<ModelMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const downloadStartedRef = useRef(false);

  /**
   * Vérifie le statut du modèle au montage
   */
  useEffect(() => {
    const isTauri = isTauriContext();

    // Only check model status if running in Tauri (not browser dev mode)
    if (isTauri) {
      checkModelStatus();
    } else {
      // Running in browser dev mode - skip model check
      setIsChecking(false);
      setIsReady(true); // Assume ready in dev mode
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - run once on mount

  /**
   * Écouter les événements d'échec du téléchargement du modèle (AC #1 Story 9.1)
   * Émis par le backend après épuisement des retries automatiques (1s, 2s, 4s, 8s)
   */
  useEffect(() => {
    if (!isTauriContext()) return;

    const unlistenPromise = listen<{ message: string }>('model:download-failed', (event) => {
      console.error('Model download failed after retries:', event.payload.message);
      setError(event.payload.message);
      setShowDialog(true);
      setIsReady(false);
    });

    return () => {
      unlistenPromise.then((fn) => fn());
    };
  }, []);

  const checkModelStatus = async () => {
    try {
      setIsChecking(true);
      setError(null);

      const status = await ModelService.checkModelStatus();
      setModelStatus(status);

      switch (status.status) {
        case 'missing':
          setShowDialog(true);
          setIsReady(false);
          if (!isDownloading) {
            startDownload();
          }
          break;

        case 'ready':
          setIsReady(true);
          setShowDialog(false);
          break;

        case 'corrupted':
          setShowDialog(true);
          setIsReady(false);
          if (!isDownloading) {
            startDownload();
          }
          break;

        case 'downloading':
          setShowDialog(true);
          setIsReady(false);
          break;

        default:
          setError('Statut du modèle inconnu');
          setIsReady(false);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('Failed to check model status:', err);
      setError(errorMessage);
      setIsReady(false);
    } finally {
      setIsChecking(false);
    }
  };

  const startDownload = async () => {
    if (downloadStartedRef.current) {
      return;
    }
    downloadStartedRef.current = true;
    try {
      setIsDownloading(true);
      setError(null);
      const result = await ModelService.downloadParakeetModel();
      setModelStatus(result);

      if (result.status === 'ready') {
        setIsReady(true);
        setShowDialog(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error
        ? getNetworkErrorMessage(err.message)
        : 'Téléchargement échoué';
      console.error('Download failed:', err);
      setError(errorMessage);
    } finally {
      setIsDownloading(false);
      downloadStartedRef.current = false;
    }
  };

  const cancelDownload = useCallback(async () => {
    try {
      await ModelService.cancelDownload();
      setShowDialog(false);

    } catch (err) {
      console.error('Failed to cancel download:', err);
    }
  }, []);

  // startDownload captures only stable values (state setters, refs, module imports),
  // so this closure is safe with empty deps despite the lint warning.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const retryDownload = useCallback(async () => {
    setError(null);
    await startDownload();
  }, []);

  const closeDialog = useCallback(() => {
    setShowDialog(false);
  }, []);

  return {
    showDialog,
    isChecking,
    isReady,
    modelStatus,
    error,
    cancelDownload,
    retryDownload,
    closeDialog,
  };
}
