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
import { TranscriptionProgressDialog, TranscriptionScreen } from './components/transcription';
import { ErrorDialog } from './components/error';
import { TranscriptViewer, TranscriptViewerToolbar } from './components/transcript';
import { VideoPlayer, KeyboardShortcutsBar } from './components/video';
import { useModelDownload } from './hooks/use-model-download';
import { useTimelineSync } from './hooks/use-timeline-sync';
import { useProjectStateAutosave } from './hooks/use-project-state-autosave';
import { useTimelineStore } from './stores/timeline-store';
import { useTranscriptSearch } from './hooks/use-transcript-search';
import { useLicenseVerification } from './hooks/use-license-verification';
import { useLicenseStore } from './stores/license-store';
import { useUpdateStore } from './stores/update-store';
import { RollbackNotification } from './components/update';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Brain } from 'lucide-react';
import { useSegmentationStore } from './stores/segmentation-store';
import { getErrorWithGuidance, sanitizeErrorForUser } from './lib/error-messages';
import { logError } from './lib/logger';
import { useExportStore } from './stores/export-store';
import { SegmentationProgressDialog } from './components/segmentation';
import { ExportDialog } from './components/export';
import { PreviewPlayer } from './components/preview/PreviewPlayer';
import { GracePeriodWarning, ExportBlockedDialog, EarlyAdopterCodeDialog } from './components/license-modal';
import { CrashRecoveryDialog } from './components/recovery';
import { KeyboardShortcutsDialog } from './components/keyboard-shortcuts';
import { useGlobalKeyboardShortcuts } from './hooks/use-global-keyboard-shortcuts';
import { checkDirtyShutdown, loadProjectState } from './services/project-state-service';
import type { SegmentationProgress } from '@splice/types/generated';

// App screen states
type AppScreen = 'import' | 'project-details' | 'transcribing' | 'editor' | 'preview';

function App() {
  const currentProject = useVideoStore(s => s.currentProject);
  const loadAllProjects = useVideoStore(s => s.loadAllProjects);
  const diskSpaceWarning = useVideoStore(s => s.diskSpaceWarning);
  const dismissDiskSpaceWarning = useVideoStore(s => s.dismissDiskSpaceWarning);
  const continueDespiteWarning = useVideoStore(s => s.continueDespiteWarning);
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

  // Export blocked dialog state (for freemium users)
  const showExportBlockedDialog = useExportStore(s => s.showExportBlockedDialog);
  const closeExportBlockedDialog = useExportStore(s => s.closeExportBlockedDialog);
  const isUpgrading = useExportStore(s => s.isUpgrading);
  const startUpgradeFlow = useExportStore(s => s.startUpgradeFlow);
  const exportDiskSpaceError = useExportStore(s => s.exportDiskSpaceError);
  const dismissExportDiskSpaceError = useExportStore(s => s.dismissExportDiskSpaceError);

  // Early adopter dialog state
  const [showEarlyAdopterDialog, setShowEarlyAdopterDialog] = useState(false);
  const isActivatingCode = useLicenseStore(s => s.isActivatingCode);
  const activationError = useLicenseStore(s => s.activationError);
  const activateEarlyAdopterCode = useLicenseStore(s => s.activateEarlyAdopterCode);
  const clearActivationError = useLicenseStore(s => s.clearActivationError);

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
  // Auto-save project state (timeline position, volume) every 30s
  useProjectStateAutosave(currentProject?.id ?? null);
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

  // License verification on startup
  const {
    isBlocked: isLicenseBlocked,
    showGraceWarning,
    dismissGraceWarning,
  } = useLicenseVerification();

  // Crash recovery state
  const [showCrashRecovery, setShowCrashRecovery] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  // Global keyboard shortcuts (Cmd+/ for help dialog)
  const {
    isShortcutsDialogOpen,
    setIsShortcutsDialogOpen,
  } = useGlobalKeyboardShortcuts();

  // Update store for event listeners
  const initUpdateEventListeners = useUpdateStore(s => s.initEventListeners);



  // Check for dirty shutdown on mount (crash recovery)
  useEffect(() => {
    if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) return;

    checkDirtyShutdown()
      .then((isDirty) => {
        if (isDirty) {
          setShowCrashRecovery(true);
        }
      })
      .catch((e) => {
        logError('App.checkDirtyShutdown', e);
      });
  }, []);

  // Load all projects on mount
  useEffect(() => {
    // Only load if running in Tauri (not in browser dev mode)
    // Check for Tauri 2.0 internals object
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      loadAllProjects();
    }
  }, [loadAllProjects]);

  // Initialize update event listeners on mount
  // The actual update check is performed by Rust on startup (see main.rs setup hook)
  useEffect(() => {
    if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) {
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      try {
        unsubscribe = await initUpdateEventListeners();
        console.debug('Update event listeners initialized');
      } catch (e) {
        // Silently log - don't bother user with update system errors
        console.debug('Failed to initialize update listeners:', e);
      }
    };

    init();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [initUpdateEventListeners]);

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
            logError('App.transcription:completed', error);
            toast.error('Erreur lors de la sauvegarde du transcript', {
              description: sanitizeErrorForUser(String(error)),
            });
          }
        }
      });

      // Listen for transcription errors
      unlistenError = await listen<{ message: string }>(
        'transcription:error',
        (event) => {
          logError('App.transcription:error', event.payload.message);

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
          const segGuidance = getErrorWithGuidance(event.payload.error);
          useSegmentationStore.setState({
            isSegmenting: false,
            segmentationProgress: null,
            isValidating: false,
            validationProgress: null,
            error: sanitizeErrorForUser(event.payload.error),
          });
          toast.error(segGuidance.title, {
            description: segGuidance.description + ' ' + segGuidance.suggestedActions[0],
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
          <div aria-hidden="true" className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
          {/* Skip links for keyboard navigation (AC #1) */}
          <a
            href="#transcript"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-emerald-600 focus:text-white focus:rounded focus:top-2 focus:left-2"
          >
            Aller au transcript
          </a>
          <a
            href="#timeline"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-emerald-600 focus:text-white focus:rounded focus:top-2 focus:left-24"
          >
            Aller à la timeline
          </a>
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
            onExport={() => useExportStore.getState().openExportDialog()}
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
                    <div aria-hidden="true" className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Transcription en cours...
                  </>
                ) : !isReady ? (
                  'Modèle en préparation...'
                ) : (
                  <>
                    <Brain aria-hidden="true" className="w-5 h-5 mr-2" />
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
          <section aria-label="Lecteur vidéo" className="relative z-10 w-full h-full min-h-0 flex items-center justify-center bg-black">
              {isPreparingPreview && (
                <div className="flex flex-col items-center gap-3">
                  <div aria-hidden="true" className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                  <p className="text-sm text-gray-400">Préparation du preview...</p>
                </div>
              )}
              {previewError && (
                <div className="flex flex-col items-center gap-3 text-center px-4">
                  <p className="text-red-400 text-sm">{previewError}</p>
                  <button
                    type="button"
                    className="text-primary text-sm underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
                    onClick={() => setCurrentScreen('editor')}
                  >
                    Retour à l'éditeur
                  </button>
                </div>
              )}
              {!isPreparingPreview && !previewError && (previewPath || finalVideoPath) && (
                <PreviewPlayer filePath={previewPath || finalVideoPath!} segmentBoundaries={segmentBoundaries} />
              )}
          </section>
        )}

        {currentScreen === 'editor' && transcript && currentProject && (
          <div className="relative z-10 w-full h-full min-h-0 flex flex-row">
            {/* Left panel — Transcript (60%) */}
            <section aria-label="Transcript" className="w-[60%] h-full min-h-0 flex flex-col border-r border-border-dark">
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
              <div id="transcript" className="flex-1 min-h-0 overflow-hidden">
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
            </section>

            {/* Right panel — Video (40%) */}
            <section aria-label="Lecteur vidéo" className="w-[40%] h-full min-h-0 flex flex-col bg-panel-dark">
              <VideoPlayer
                filePath={currentProject.file_path}
                width={currentProject.width ?? undefined}
                height={currentProject.height ?? undefined}
                onSegmentClick={handleSegmentClick}
              />
              <KeyboardShortcutsBar />
            </section>
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

      {/* Export Dialog */}
      <ExportDialog />

      {/* Export Disk Space Error Dialog - Story 9.4: Blocking error when insufficient space */}
      {exportDiskSpaceError && (
        <ErrorDialog
          isOpen={true}
          severity="error"
          title="Espace disque insuffisant"
          description={`Votre disque dispose de ${exportDiskSpaceError.availableGb.toFixed(1)} GB libres. L'export nécessite ~${exportDiskSpaceError.requiredGb.toFixed(1)} GB.`}
          suggestedActions={[
            'Libérez de l\'espace disque ou choisissez un emplacement différent.',
          ]}
          onRetry={async () => {
            try {
              const { open } = await import('@tauri-apps/plugin-dialog');
              const selected = await open({ directory: true, title: 'Choisir le répertoire d\'export' });
              if (selected && currentProject) {
                useExportStore.getState().updateSettings({ outputPath: selected as string });
                dismissExportDiskSpaceError();
                useExportStore.getState().startExport(currentProject.id);
              }
            } catch {
              // Dialog cancelled or error — do nothing
            }
          }}
          retryLabel="Changer le répertoire"
          onClose={dismissExportDiskSpaceError}
        />
      )}

      {/* Export Blocked Dialog for freemium users */}
      <ExportBlockedDialog
        isOpen={showExportBlockedDialog}
        isUpgrading={isUpgrading}
        onUpgrade={() => {
          // Story 7.4: Trigger upgrade flow
          // Default email - in production, should be from user input or license store
          const email = import.meta.env.VITE_DEFAULT_CHECKOUT_EMAIL || 'user@splice.app';
          const priceId = import.meta.env.VITE_STRIPE_PRICE_ID_MONTHLY || 'price_monthly';
          startUpgradeFlow(email, priceId);
        }}
        onClose={closeExportBlockedDialog}
        onEarlyAdopterClick={() => {
          closeExportBlockedDialog();
          setShowEarlyAdopterDialog(true);
        }}
      />

      {/* Early Adopter Code Dialog */}
      <EarlyAdopterCodeDialog
        isOpen={showEarlyAdopterDialog}
        isActivating={isActivatingCode}
        error={activationError}
        onActivate={async (code, email) => {
          const success = await activateEarlyAdopterCode(code, email);
          if (success) {
            setShowEarlyAdopterDialog(false);
            toast.success('Code activé! Bienvenue dans Splice Pro - Accès lifetime.');
          }
        }}
        onClose={() => {
          setShowEarlyAdopterDialog(false);
          clearActivationError();
        }}
      />

      {/* Disk Space Warning Dialog - Story 9.4: Warning before import when low disk space */}
      {diskSpaceWarning && (
        <ErrorDialog
          isOpen={true}
          severity="warning"
          title="Espace disque faible"
          description={`Votre disque dispose de ${diskSpaceWarning.availableGb.toFixed(1)} GB libres. Cette vidéo nécessite ~${diskSpaceWarning.requiredGb.toFixed(1)} GB pour le traitement.`}
          suggestedActions={[
            'Libérez de l\'espace ou choisissez une vidéo plus petite.',
          ]}
          onRetry={continueDespiteWarning}
          retryLabel="Continuer quand même"
          onClose={dismissDiskSpaceWarning}
        />
      )}

      {/* Transcription Error Dialog - Story 9.3: Unified ErrorDialog with guidance */}
      {currentProject && transcriptionError && (() => {
        const guidance = getErrorWithGuidance(transcriptionError);
        return (
          <ErrorDialog
            isOpen={true}
            severity={guidance.severity}
            title={guidance.title}
            description={guidance.description}
            suggestedActions={guidance.suggestedActions}
            onRetry={guidance.retryable ? () => {
              setTranscriptionError(null);
              startTranscription(currentProject.id, currentProject.file_path, currentProject.id);
            } : undefined}
            onClose={() => setTranscriptionError(null)}
            errorDetails={sanitizeErrorForUser(transcriptionError)}
          />
        );
      })()}

      {/* Crash Recovery Dialog - shown on dirty shutdown (Story 9.2) */}
      <CrashRecoveryDialog
        isOpen={showCrashRecovery}
        isRecovering={isRecovering}
        onRecover={async () => {
          setIsRecovering(true);
          try {
            const projectState = await loadProjectState();
            if (!projectState || !projectState.project_id) {
              toast.error('Aucun projet à récupérer');
              setShowCrashRecovery(false);
              setIsRecovering(false);
              return;
            }

            // Load all projects first to populate the allProjects array
            await useVideoStore.getState().loadAllProjects();

            // Select the project
            useVideoStore.getState().selectProject(projectState.project_id);

            const project = useVideoStore.getState().currentProject;
            if (!project) {
              toast.error('Le fichier vidéo original a été déplacé ou supprimé.');
              setShowCrashRecovery(false);
              setIsRecovering(false);
              return;
            }

            // Load transcript
            await useTranscriptStore.getState().loadTranscript(projectState.project_id);

            // Load selections
            await useTranscriptStore.getState().loadSelections(projectState.project_id);

            // Load cuts if any exist
            try {
              const cuts = await invoke<unknown[]>('get_cuts', { projectId: projectState.project_id });
              if (cuts && cuts.length > 0) {
                // Cuts are available in SQLite for re-export (AC #7)
                toast.success('Projet récupéré avec succès', {
                  description: `${cuts.length} cut(s) disponible(s) pour ré-export`,
                });
              } else {
                toast.success('Projet récupéré avec succès');
              }
            } catch {
              toast.success('Projet récupéré avec succès');
            }

            // Restore timeline position if timeline store is available
            if (projectState.timeline_position > 0) {
              useTimelineStore.getState().seek(projectState.timeline_position);
            }
            if (projectState.volume !== undefined) {
              useTimelineStore.getState().setVolume(projectState.volume);
            }

            setShowCrashRecovery(false);
          } catch (e) {
            logError('App.crashRecovery', e);
            toast.error('La récupération a échoué');
          } finally {
            setIsRecovering(false);
          }
        }}
        onStartFresh={() => {
          // AC #6: Don't delete saved data — just dismiss the dialog.
          // was_clean_shutdown stays 0 so crash detection works for the current session.
          // mark_clean_shutdown is called by the Rust CloseRequested handler on clean exit.
          setShowCrashRecovery(false);
        }}
      />

      {/* Rollback Notification - shown after automatic rollback (Story 8.3) */}
      <RollbackNotification />

      {/* Keyboard Shortcuts Help Dialog (Cmd+/) */}
      <KeyboardShortcutsDialog
        isOpen={isShortcutsDialogOpen}
        onOpenChange={setIsShortcutsDialogOpen}
      />

      {/* Grace Period Warning Modal - blocks app when offline too long */}
      <GracePeriodWarning
        open={showGraceWarning}
        onOpenChange={(open) => {
          // Only allow closing if not blocked
          if (!open && !isLicenseBlocked) {
            dismissGraceWarning();
          }
        }}
        onEarlyAdopterClick={() => {
          dismissGraceWarning();
          setShowEarlyAdopterDialog(true);
        }}
      />
    </>
  );
}

export default App;
