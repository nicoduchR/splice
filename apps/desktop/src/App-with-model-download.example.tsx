/**
 * Exemple d'intégration du ModelDownloadDialog dans App.tsx
 *
 * Ce fichier montre comment intégrer le téléchargement automatique
 * du modèle Parakeet au démarrage de l'application avec le hook useModelDownload.
 *
 * Copiez ce code dans votre App.tsx pour activer le téléchargement automatique.
 */

import { ModelDownloadDialog } from '@/components/model-download';
import { useModelDownload } from '@/hooks/use-model-download';

function App() {
  const {
    showDialog,
    isChecking,
    isReady,
    error,
    cancelDownload,
    retryDownload,
  } = useModelDownload();

  // Écran de chargement pendant la vérification du modèle
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-gray-400">
            Vérification du moteur de transcription...
          </p>
        </div>
      </div>
    );
  }

  // Dialogue de téléchargement du modèle
  // S'affiche automatiquement si le modèle est manquant ou corrompu
  return (
    <>
      {/* Votre application principale */}
      {isReady ? (
        <div className="min-h-screen bg-background-dark text-white">
          {/* Votre contenu d'application ici */}
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-2">Splice</h1>
            <p className="text-gray-400">
              Montage vidéo automatique par transcription
            </p>

            {/* Vos composants: VideoImport, TranscriptEditor, Timeline, etc. */}
          </div>
        </div>
      ) : (
        // Afficher un placeholder si le modèle n'est pas prêt
        <div className="flex items-center justify-center min-h-screen bg-background-dark">
          <p className="text-gray-500">
            En attente du téléchargement du modèle...
          </p>
        </div>
      )}

      {/* Dialogue de téléchargement */}
      <ModelDownloadDialog
        isOpen={showDialog}
        onCancel={cancelDownload}
        onRetry={retryDownload}
      />

      {/* Affichage des erreurs (optionnel, pour debug) */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Erreur: {error}
        </div>
      )}
    </>
  );
}

export default App;
