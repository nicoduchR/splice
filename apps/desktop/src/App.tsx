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
import { VideoPlayer, KeyboardShortcutsBar } from './components/video';
import { useModelDownload } from './hooks/use-model-download';
import { useTimelineSync } from './hooks/use-timeline-sync';
import { useTimelineStore } from './stores/timeline-store';
import { useTranscriptSearch } from './hooks/use-transcript-search';
import { listen } from '@tauri-apps/api/event';
import { Brain } from 'lucide-react';
import { useSegmentationStore } from './stores/segmentation-store';
import { SegmentationProgressDialog } from './components/segmentation';
import { PreviewPlayer } from './components/preview/PreviewPlayer';
import type { SegmentationProgress } from '@splice/types/generated';

// App screen states
type AppScreen = 'import' | 'project-details' | 'transcribing' | 'editor' | 'preview';

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
  const undo = useTranscriptStore(s => s.undo);
  const redo = useTranscriptStore(s => s.redo);
  const canUndo = useTranscriptStore(s => s.canUndo);
  const canRedo = useTranscriptStore(s => s.canRedo);
  const loadSelections = useTranscriptStore(s => s.loadSelections);
  const startAutoSave = useTranscriptStore(s => s.startAutoSave);
  const stopAutoSave = useTranscriptStore(s => s.stopAutoSave);

  // Segmentation state
  const isSegmenting = useSegmentationStore(s => s.isSegmenting);
  const segmentationProgress = useSegmentationStore(s => s.segmentationProgress);
  const isValidating = useSegmentationStore(s => s.isValidating);
  const validationProgress = useSegmentationStore(s => s.validationProgress);
  const isConcatenating = useSegmentationStore(s => s.isConcatenating);
  const segmentationStats = useSegmentationStore(s => s.stats);
  const finalVideoPath = useSegmentationStore(s => s.finalVideoPath);
  const isPreparingPreview = useSegmentationStore(s => s.isPreparingPreview);
  const previewPath = useSegmentationStore(s => s.previewPath);
  const previewError = useSegmentationStore(s => s.previewError);
  const segmentBoundaries = useSegmentationStore(s => s.segmentBoundaries);

  // Search functionality
  const {
    searchQuery,
    setSearchQuery,
    matches,
    currentMatchIndex,
    nextMatch,
    prevMatch,
  } = useTranscriptSearch(transcript?.words || []);

  // Timeline sync
  useTimelineSync();
  const timelineSegments = useTimelineStore(s => s.segments);
  const hasSelections = timelineSegments.length > 0;
  const [scrollToWordIndex, setScrollToWordIndex] = useState<number | null>(null);

  const handleSegmentClick = (wordIndex: number) => {
    setScrollToWordIndex(null);
    queueMicrotask(() => setScrollToWordIndex(wordIndex));
  };

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

  // Listen to segmentation events
  useEffect(() => {
    if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) {
      return;
    }

    let unlistenProgress: (() => void) | undefined;
    let unlistenCompleted: (() => void) | undefined;
    let unlistenError: (() => void) | undefined;
    let unlistenValidating: (() => void) | undefined;
    let unlistenConcatenating: (() => void) | undefined;
    let unlistenStats: (() => void) | undefined;
    // Note: preview:ready and preview:error events are NOT listened here.
    // The preparePreview store action handles state via invoke return value,
    // avoiding a race condition from dual state updates.

    const setupListeners = async () => {
      unlistenStats = await listen<{
        segment_count: number;
        final_duration_secs: number;
        original_duration_secs: number;
        reduction_percent: number;
      }>(
        'segmentation:stats',
        (event) => {
          useSegmentationStore.getState().setStats(event.payload);
        }
      );

      unlistenProgress = await listen<SegmentationProgress>(
        'segmentation:progress',
        (event) => {
          useSegmentationStore.getState().updateProgress(event.payload);
        }
      );

      unlistenValidating = await listen<{ project_id: string; current_segment: number; total_segments: number }>(
        'segmentation:validating',
        (event) => {
          useSegmentationStore.getState().updateValidationProgress(event.payload);
        }
      );

      unlistenConcatenating = await listen<{ project_id: string }>(
        'segmentation:concatenating',
        () => {
          useSegmentationStore.getState().setConcatenating(true);
        }
      );

      unlistenCompleted = await listen<{ project_id: string; segment_paths: string[]; final_video_path?: string }>(
        'segmentation:completed',
        (event) => {
          const finalPath = event.payload.final_video_path;
          if (finalPath) {
            useSegmentationStore.getState().setFinalVideoPath(finalPath);
          }
          useSegmentationStore.getState().resetSegmentation();
          toast.success('Vidéo finale générée avec succès!', {
            description: finalPath
              ? `Fichier: ${finalPath}`
              : 'Export terminé',
            duration: 5000,
          });
        }
      );

      unlistenError = await listen<{ project_id: string; error: string }>(
        'segmentation:error',
        (event) => {
          useSegmentationStore.setState({
            isSegmenting: false,
            segmentationProgress: null,
            isValidating: false,
            validationProgress: null,
            error: event.payload.error,
          });
          toast.error('Erreur lors de la génération des cuts', {
            description: event.payload.error,
          });
        }
      );

      // preview:ready and preview:error are handled by the preparePreview
      // store action via invoke return, not via events (avoids dual state updates).
    };

    setupListeners();

    return () => {
      if (unlistenProgress) unlistenProgress();
      if (unlistenCompleted) unlistenCompleted();
      if (unlistenError) unlistenError();
      if (unlistenValidating) unlistenValidating();
      if (unlistenConcatenating) unlistenConcatenating();
      if (unlistenStats) unlistenStats();
    };
  }, []);

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
        <div className="h-screen flex flex-col overflow-hidden">
          <TopBar
            currentProject={currentProject}
            currentScreen={currentScreen}
            onGenerateCuts={async () => {
              if (currentProject && !isSegmenting) {
                // Flush pending selections to DB before generating cuts
                await useTranscriptStore.getState().saveSelections();
                useSegmentationStore.getState().startSegmentation(currentProject.id);
              }
            }}
            isSegmenting={isSegmenting}
            hasSelections={hasSelections}
            canPreview={!!finalVideoPath}
            isPreparingPreview={isPreparingPreview}
            onPreview={() => {
              if (currentProject) {
                useSegmentationStore.getState().preparePreview(currentProject.id);
                setCurrentScreen('preview');
              }
            }}
            onBackToEditor={() => setCurrentScreen('editor')}
          />
          <Toaster />

      <main className={`flex-1 min-h-0 flex flex-col relative ${currentScreen === 'editor' ? 'overflow-hidden' : 'items-center justify-center p-6 sm:p-10'}`}>
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

        {currentScreen === 'preview' && (
          <div className="relative z-10 w-full h-full min-h-0 flex items-center justify-center bg-black">
              {isPreparingPreview && (
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                  <p className="text-sm text-gray-400">Préparation du preview...</p>
                </div>
              )}
              {previewError && (
                <div className="flex flex-col items-center gap-3 text-center px-4">
                  <p className="text-red-400 text-sm">{previewError}</p>
                  <button
                    type="button"
                    className="text-primary text-sm underline"
                    onClick={() => setCurrentScreen('editor')}
                  >
                    Retour à l'éditeur
                  </button>
                </div>
              )}
              {!isPreparingPreview && !previewError && (previewPath || finalVideoPath) && (
                <PreviewPlayer filePath={previewPath || finalVideoPath!} segmentBoundaries={segmentBoundaries} />
              )}
          </div>
        )}

        {currentScreen === 'editor' && transcript && currentProject && (
          <div className="relative z-10 w-full h-full min-h-0 flex flex-row">
            {/* Left panel — Transcript (60%) */}
            <div className="w-[60%] h-full min-h-0 flex flex-col border-r border-border-dark">
              <TranscriptViewerToolbar
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                currentMatchIndex={currentMatchIndex}
                totalMatches={matches.length}
                onNextMatch={nextMatch}
                onPrevMatch={prevMatch}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                onClearAll={clearSelection}
              />
              <div className="flex-1 min-h-0 overflow-hidden">
                <TranscriptViewer
                  words={transcript.words}
                  selectedIndices={selectedWordIndices}
                  onWordClick={toggleWordSelection}
                  onSelectionChange={setSelection}
                  onToggleRange={toggleSelectionRange}
                  onSetIndices={setSelectionFromIndices}
                  onClearSelection={clearSelection}
                  onUndo={undo}
                  onRedo={redo}
                  searchQuery={searchQuery}
                  scrollToWordIndex={scrollToWordIndex}
                />
              </div>
            </div>

            {/* Right panel — Video (40%) */}
            <div className="w-[40%] h-full min-h-0 flex flex-col bg-panel-dark">
              <VideoPlayer
                filePath={currentProject.file_path}
                width={currentProject.width ?? undefined}
                height={currentProject.height ?? undefined}
                onSegmentClick={handleSegmentClick}
              />
              <KeyboardShortcutsBar />
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

      {/* Segmentation Progress Dialog */}
      <SegmentationProgressDialog
        isOpen={isSegmenting}
        progress={segmentationProgress}
        isValidating={isValidating}
        validationProgress={validationProgress}
        isConcatenating={isConcatenating}
        stats={segmentationStats}
        onCancel={() => {
          if (currentProject) {
            useSegmentationStore.getState().cancelSegmentation(currentProject.id);
          }
        }}
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
