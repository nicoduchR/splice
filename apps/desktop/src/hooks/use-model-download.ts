import { useState, useEffect, useCallback, useRef } from 'react';
import { ModelService } from '@/services/model-service';
import type { ModelMetadata } from '@/services/model-service';

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

    // Debug: Check if Tauri is available
    console.log('🔍 Checking Tauri availability:', {
      isTauri,
      hasTauriInternals: typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window,
      userAgent: navigator.userAgent
    });

    // Only check model status if running in Tauri (not browser dev mode)
    if (isTauri) {
      console.log('✅ Running in Tauri mode - checking model status');
      checkModelStatus();
    } else {
      // Running in browser dev mode - skip model check
      console.log('⚠️ Running in browser dev mode - skipping model check');
      setIsChecking(false);
      setIsReady(true); // Assume ready in dev mode
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - run once on mount

  const checkModelStatus = async () => {
    try {
      console.log('📡 Calling ModelService.checkModelStatus()...');
      setIsChecking(true);
      setError(null);

      const status = await ModelService.checkModelStatus();
      console.log('📦 Model status received:', status);
      setModelStatus(status);

      switch (status.status) {
        case 'missing':
          console.log('⚠️ Model is missing - starting download...');
          // Modèle manquant → afficher dialogue et lancer téléchargement
          setShowDialog(true);
          setIsReady(false);
          // Lance le téléchargement en arrière-plan (ne pas attendre!)
          // Only start if not already downloading (prevent duplicate calls)
          if (!isDownloading) {
            startDownload();
          }
          break;

        case 'ready':
          console.log('✅ Model is ready!');
          // Modèle prêt → continuer normalement
          setIsReady(true);
          setShowDialog(false);
          break;

        case 'corrupted':
          console.log('❌ Model is corrupted - starting download...');
          // Modèle corrompu → demander re-téléchargement
          setShowDialog(true);
          setIsReady(false);
          // Lance le téléchargement en arrière-plan (ne pas attendre!)
          if (!isDownloading) {
            startDownload();
          }
          break;

        case 'downloading':
          console.log('📥 Model download already in progress');
          // Téléchargement déjà en cours (cas rare, redémarrage app pendant download)
          setShowDialog(true);
          setIsReady(false);
          break;

        default:
          console.warn('Unknown model status:', status.status);
          setIsReady(false);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('❌ Failed to check model status:', err);
      setError(errorMessage);
      setIsReady(false);
    } finally {
      console.log('✅ checkModelStatus completed, setting isChecking=false');
      setIsChecking(false);
    }
  };

  const startDownload = async () => {
    if (downloadStartedRef.current) {
      console.log('Download already in progress (ref guard), skipping');
      return;
    }
    downloadStartedRef.current = true;
    try {
      console.log('Starting download...');
      setIsDownloading(true);
      setError(null);
      const result = await ModelService.downloadParakeetModel();
      console.log('📦 Download result:', result);
      setModelStatus(result);

      if (result.status === 'ready') {
        console.log('✅ Download completed successfully!');
        setIsReady(true);
        setShowDialog(false);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Téléchargement échoué';
      console.error('❌ Download failed:', err);
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

      // Optionnel : fermer l'application après annulation
      // La décision de fermer l'app peut être laissée au composant parent
      console.log('Download cancelled by user');
    } catch (err) {
      console.error('Failed to cancel download:', err);
    }
  }, []);

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
