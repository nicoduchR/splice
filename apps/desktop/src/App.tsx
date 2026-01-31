import { useEffect, useState } from 'react';
import { useVideoStore } from './stores/video-store';
import { VideoImport } from './components/video-import';
import { TopBar } from './components/layout';
import { Toaster } from './components/ui/sonner';
import { ComponentsDemo } from './pages/ComponentsDemo';
import { Button } from './components/ui/button';
import { ModelDownloadDialog } from './components/model-download';
import { useModelDownload } from './hooks/use-model-download';

function App() {
  const currentProject = useVideoStore(s => s.currentProject);
  const loadAllProjects = useVideoStore(s => s.loadAllProjects);
  const [showComponentsDemo, setShowComponentsDemo] = useState(false);

  // Model download management
  const {
    showDialog,
    isChecking,
    isReady,
    cancelDownload,
    retryDownload,
  } = useModelDownload();

  // Load all projects on mount
  useEffect(() => {
    // Only load if running in Tauri (not in browser dev mode)
    // Check for Tauri 2.0 internals object
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      loadAllProjects();
    }
  }, [loadAllProjects]);

  // Loading screen while checking model status
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

  // Show components demo if toggled
  if (showComponentsDemo) {
    return (
      <div className="min-h-screen flex flex-col overflow-hidden">
        <div className="p-4 bg-panel-dark border-b border-border-dark flex items-center justify-between">
          <h2 className="text-white font-semibold">Design System Demo</h2>
          <Button variant="outline" onClick={() => setShowComponentsDemo(false)}>
            Retour à l'app
          </Button>
        </div>
        <ComponentsDemo />
        <Toaster />
      </div>
    );
  }

  return (
    <>
      {!showDialog ? (
        // Normal app content
        <div className="min-h-screen flex flex-col overflow-hidden">
          <TopBar />
          <Toaster />

      {/* Dev: Toggle Components Demo */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowComponentsDemo(true)}
          className="text-xs bg-background/50 backdrop-blur-sm hover:bg-background/80"
        >
          <span className="material-symbols-outlined text-sm">palette</span>
          Demo
        </Button>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative">
        {/* Abstract Background Gradient for depth */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]"></div>
          <div className="absolute top-[40%] right-[5%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]"></div>
        </div>

        {!currentProject ? (
          <div className="relative w-full max-w-[800px] flex flex-col items-center justify-center">
            <VideoImport />
          </div>
        ) : (
          <div className="text-white relative z-10 w-full max-w-2xl">
            <h1 className="text-3xl font-bold mb-6 text-center">Projet chargé</h1>
            <div className="bg-[#25252D] p-8 rounded-xl border border-[#35353F] shadow-2xl">
              <div className="space-y-4">
                {/* File name */}
                <div>
                  <p className="text-slate-400 text-sm mb-1">Fichier</p>
                  <p className="text-white font-semibold text-lg">{currentProject.file_name}</p>
                </div>

                {/* Duration */}
                <div>
                  <p className="text-slate-400 text-sm mb-1">Durée</p>
                  <p className="text-white font-medium">
                    {(() => {
                      const totalSeconds = Math.floor(currentProject.duration_seconds);
                      const hours = Math.floor(totalSeconds / 3600);
                      const minutes = Math.floor((totalSeconds % 3600) / 60);
                      const seconds = totalSeconds % 60;
                      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    })()}
                  </p>
                </div>

                {/* Resolution */}
                {currentProject.width && currentProject.height && (
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Résolution</p>
                    <p className="text-white font-medium">
                      {currentProject.width} × {currentProject.height}
                      {currentProject.width === 3840 && currentProject.height === 2160 && (
                        <span className="ml-2 text-primary text-sm">(4K UHD)</span>
                      )}
                      {currentProject.width === 1920 && currentProject.height === 1080 && (
                        <span className="ml-2 text-primary text-sm">(Full HD)</span>
                      )}
                    </p>
                  </div>
                )}

                {/* File size */}
                {currentProject.file_size_bytes && (
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Taille</p>
                    <p className="text-white font-medium">
                      {(currentProject.file_size_bytes / (1024 ** 3)).toFixed(2)} GB
                    </p>
                  </div>
                )}

                {/* Codec */}
                {currentProject.codec && (
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Codec</p>
                    <p className="text-white font-medium uppercase">{currentProject.codec}</p>
                  </div>
                )}

                {/* File path */}
                <div className="pt-4 border-t border-slate-700">
                  <p className="text-slate-400 text-sm mb-1">Chemin</p>
                  <p className="text-slate-300 text-sm break-all">{currentProject.file_path}</p>
                </div>
              </div>
            </div>

            {/* Next steps placeholder */}
            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                Prochaine étape: Transcription (Story 2.1+)
              </p>
            </div>
          </div>
        )}
      </main>
        </div>
      ) : (
        // Clean background when model is downloading
        <div className="min-h-screen bg-background-dark" />
      )}

      {/* Model Download Dialog - shown automatically if model is missing or corrupted */}
      <ModelDownloadDialog
        isOpen={showDialog}
        onCancel={cancelDownload}
        onRetry={retryDownload}
      />
    </>
  );
}

export default App;
