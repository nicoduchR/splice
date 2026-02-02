import { useEffect, useState } from 'react';
import { useVideoStore } from './stores/video-store';
import { useTranscriptStore } from './stores/transcript-store';
import { VideoImport } from './components/video-import';
import { TopBar } from './components/layout';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { ComponentsDemo } from './pages/ComponentsDemo';
import { Button } from './components/ui/button';
import { ModelDownloadDialog } from './components/model-download';
import { TranscriptionProgressDialog, TranscriptionErrorDialog, TranscriptionScreen } from './components/transcription';
import { TranscriptViewer, TranscriptViewerToolbar } from './components/transcript';
import { useModelDownload } from './hooks/use-model-download';
import { useTranscriptSearch } from './hooks/use-transcript-search';
import { listen } from '@tauri-apps/api/event';
import { Brain } from 'lucide-react';

// App screen states
type AppScreen = 'import' | 'project-details' | 'transcribing' | 'editor';

function App() {
  const currentProject = useVideoStore(s => s.currentProject);
  const loadAllProjects = useVideoStore(s => s.loadAllProjects);
  const [showComponentsDemo, setShowComponentsDemo] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  // Screen state management
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('import');

  // Transcription state
  const isTranscribing = useTranscriptStore(s => s.isTranscribing);
  const transcriptionProgress = useTranscriptStore(s => s.transcriptionProgress);
  const transcribingProjectId = useTranscriptStore(s => s.currentProjectId); // Capture project ID to prevent race condition
  const updateTranscriptionProgress = useTranscriptStore(s => s.updateTranscriptionProgress);
  const completeTranscription = useTranscriptStore(s => s.completeTranscription);
  const cancelTranscription = useTranscriptStore(s => s.cancelTranscription);
  const startTranscription = useTranscriptStore(s => s.startTranscription);

  // Transcript viewer state
  const transcript = useTranscriptStore(s => s.transcript);
  const loadTranscript = useTranscriptStore(s => s.loadTranscript);
  const selectedWordIndices = useTranscriptStore(s => s.selectedWordIndices);
  const toggleWordSelection = useTranscriptStore(s => s.toggleWordSelection);
  const setSelection = useTranscriptStore(s => s.setSelection);
  const clearSelection = useTranscriptStore(s => s.clearSelection);
  const toggleSelectionRange = useTranscriptStore(s => s.toggleSelectionRange);
  const setSelectionFromIndices = useTranscriptStore(s => s.setSelectionFromIndices);
  const loadSelections = useTranscriptStore(s => s.loadSelections);
  const startAutoSave = useTranscriptStore(s => s.startAutoSave);
  const stopAutoSave = useTranscriptStore(s => s.stopAutoSave);

  // Search functionality
  const {
    searchQuery,
    setSearchQuery,
    matches,
    currentMatchIndex,
    nextMatch,
    prevMatch,
  } = useTranscriptSearch(transcript?.words || []);

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

  // Auto-manage screen transitions based on app state
  useEffect(() => {
    if (!currentProject) {
      setCurrentScreen('import');
    } else if (isTranscribing) {
      setCurrentScreen('transcribing');
    } else if (transcript && transcript.project_id === currentProject.id) {
      // If transcript exists for current project, show editor
      setCurrentScreen('editor');
    } else {
      setCurrentScreen('project-details');
    }
  }, [currentProject, isTranscribing, transcript]);

  // Load transcript when project changes
  useEffect(() => {
    if (currentProject && typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      loadTranscript(currentProject.id);
    }
  }, [currentProject, loadTranscript]);

  // Load selections when transcript is available & manage auto-save lifecycle
  useEffect(() => {
    if (transcript && currentProject && typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      loadSelections(currentProject.id);
      startAutoSave();
    }
    return () => {
      // Save pending selections and stop auto-save on cleanup
      useTranscriptStore.getState().saveSelections();
      stopAutoSave();
    };
  }, [transcript, currentProject, loadSelections, startAutoSave, stopAutoSave]);


  // Listen to transcription events
  useEffect(() => {
    if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) {
      return;
    }

    let unlistenProgress: (() => void) | undefined;
    let unlistenCompleted: (() => void) | undefined;
    let unlistenError: (() => void) | undefined;

    // Setup listeners
    const setupListeners = async () => {
      // Listen for transcription progress events
      unlistenProgress = await listen<{
        video_id: string;
        stage: string;
        progress: number;
        message: string;
      }>('transcription:progress', (event) => {
        const { progress, stage, message } = event.payload;
        updateTranscriptionProgress(progress, stage, message);
      });

      // Listen for transcription completion
      unlistenCompleted = await listen<{
        text: string;
        words: any[];
        language: string;
        confidence?: number;
      }>('transcription:completed', async (event) => {
        // Use captured project ID to prevent race condition (user might have changed projects)
        if (transcribingProjectId) {
          try {
            await completeTranscription(event.payload, transcribingProjectId);

            // Show success toast
            const wordCount = event.payload.words.length;
            toast.success('Transcript généré avec succès!', {
              description: `${wordCount} mots détectés`,
              duration: 5000,
            });
          } catch (error) {
            console.error('Failed to save transcript:', error);
            toast.error('Erreur lors de la sauvegarde du transcript', {
              description: error as string,
            });
          }
        }
      });

      // Listen for transcription errors
      unlistenError = await listen<{ message: string }>(
        'transcription:error',
        (event) => {
          console.error('Transcription error:', event.payload.message);

          // Show error dialog instead of toast
          setTranscriptionError(event.payload.message);
        }
      );
    };

    setupListeners();

    return () => {
      if (unlistenProgress) unlistenProgress();
      if (unlistenCompleted) unlistenCompleted();
      if (unlistenError) unlistenError();
    };
  }, [updateTranscriptionProgress, completeTranscription, transcribingProjectId]);

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

      <main className={`flex-1 flex flex-col relative ${currentScreen === 'editor' ? 'overflow-hidden' : 'items-center justify-center p-6 sm:p-10'}`}>
        {/* Abstract Background Gradient for depth - only for import and project-details */}
        {currentScreen !== 'transcribing' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]"></div>
            <div className="absolute top-[40%] right-[5%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]"></div>
          </div>
        )}

        {/* Screen Router */}
        {currentScreen === 'import' && (
          <div className="relative w-full max-w-[800px] flex flex-col items-center justify-center">
            <VideoImport />
          </div>
        )}

        {currentScreen === 'transcribing' && currentProject && (
          <TranscriptionScreen
            progress={transcriptionProgress}
            videoInfo={{
              id: currentProject.id,
              file_name: currentProject.file_name,
              file_path: currentProject.file_path,
              duration_seconds: currentProject.duration_seconds,
              file_size_bytes: currentProject.file_size_bytes,
            }}
            onCancel={cancelTranscription}
          />
        )}

        {currentScreen === 'project-details' && currentProject && (
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

            {/* Transcription Action Button */}
            <div className="mt-6 flex flex-col items-center gap-3">
              <Button
                size="lg"
                className="w-full max-w-md"
                onClick={() => {
                  if (currentProject) {
                    startTranscription(
                      currentProject.id,
                      currentProject.file_path,
                      currentProject.id
                    );
                  }
                }}
                disabled={isTranscribing || !isReady}
              >
                {isTranscribing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Transcription en cours...
                  </>
                ) : !isReady ? (
                  'Modèle en préparation...'
                ) : (
                  <>
                    <Brain className="w-5 h-5 mr-2" />
                    Générer le transcript
                  </>
                )}
              </Button>
              {!isReady && (
                <p className="text-slate-400 text-xs">
                  Le modèle de transcription se télécharge au premier lancement
                </p>
              )}
            </div>
          </div>
        )}

        {currentScreen === 'editor' && transcript && (
          <div className="relative z-10 w-full h-full flex flex-col">
            <TranscriptViewerToolbar
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              currentMatchIndex={currentMatchIndex}
              totalMatches={matches.length}
              onNextMatch={nextMatch}
              onPrevMatch={prevMatch}
            />
            <div className="flex-1 overflow-hidden">
              <TranscriptViewer
                words={transcript.words}
                selectedIndices={selectedWordIndices}
                onWordClick={toggleWordSelection}
                onSelectionChange={setSelection}
                onToggleRange={toggleSelectionRange}
                onSetIndices={setSelectionFromIndices}
                onClearSelection={clearSelection}
                searchQuery={searchQuery}
              />
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

      {/* Transcription Error Dialog - shown as overlay on any screen */}
      {currentProject && (
        <TranscriptionErrorDialog
          isOpen={!!transcriptionError}
          errorMessage={transcriptionError || ''}
          onRetry={() => {
            setTranscriptionError(null);
            // Retry transcription with same video
            startTranscription(currentProject.id, currentProject.file_path, currentProject.id);
          }}
          onClose={() => setTranscriptionError(null)}
        />
      )}
    </>
  );
}

export default App;
