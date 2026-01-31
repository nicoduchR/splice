import { useState, useEffect } from 'react';
import { ModelDownloadDialog } from '@/components/model-download';
import { ModelService } from '@/services/model-service';

/**
 * Exemple d'utilisation du ModelDownloadDialog
 *
 * Ce composant montre comment intégrer le dialogue de téléchargement
 * du modèle Parakeet au démarrage de l'application.
 */
export function ModelDownloadExample() {
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [isCheckingModel, setIsCheckingModel] = useState(true);

  useEffect(() => {
    checkModelOnStartup();
  }, []);

  const checkModelOnStartup = async () => {
    try {
      const modelStatus = await ModelService.checkModelStatus();

      if (modelStatus.status === 'missing') {
        // Modèle manquant → afficher dialogue de téléchargement
        setShowDownloadDialog(true);
        await ModelService.downloadParakeetModel();
      } else if (modelStatus.status === 'ready') {
        // Modèle déjà téléchargé → continuer normalement
        console.log('Model ready:', modelStatus);
      } else if (modelStatus.status === 'corrupted') {
        // Modèle corrompu → demander re-téléchargement
        setShowDownloadDialog(true);
        await ModelService.downloadParakeetModel();
      }
    } catch (error) {
      console.error('Model check failed:', error);
    } finally {
      setIsCheckingModel(false);
    }
  };

  const handleCancelDownload = async () => {
    try {
      await ModelService.cancelDownload();
      setShowDownloadDialog(false);
      // Optionnel : fermer l'application
      // await invoke('exit_app');
    } catch (error) {
      console.error('Failed to cancel download:', error);
    }
  };

  const handleRetryDownload = async () => {
    try {
      await ModelService.downloadParakeetModel();
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  if (isCheckingModel) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Vérification du modèle de transcription...</p>
      </div>
    );
  }

  return (
    <>
      {/* Votre application principale */}
      <div className="p-8">
        <h1 className="text-2xl font-bold">Splice</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Application de montage vidéo automatique
        </p>
      </div>

      {/* Dialogue de téléchargement du modèle */}
      <ModelDownloadDialog
        isOpen={showDownloadDialog}
        onCancel={handleCancelDownload}
        onRetry={handleRetryDownload}
      />
    </>
  );
}
