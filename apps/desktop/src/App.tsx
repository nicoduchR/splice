import { useEffect, useState } from 'react';
import { useVideoStore } from './stores/video-store';
import { useTranscriptStore } from './stores/transcript-store';
import { toast } from 'sonner';
import { ComponentsDemo } from './pages/ComponentsDemo';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { ModelDownloadDialog } from './components/model-download';
import { ErrorDialog } from './components/error';
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
import { useSegmentationStore } from './stores/segmentation-store';
import { getErrorWithGuidance, sanitizeErrorForUser } from './lib/error-messages';
import { logError } from './lib/logger';
import { useExportStore } from './stores/export-store';
import { SegmentationProgressDialog } from './components/segmentation';
import { ExportDialog } from './components/export';
import { GracePeriodWarning, ExportBlockedDialog, EarlyAdopterCodeDialog } from './components/license-modal';
import { CrashRecoveryDialog } from './components/recovery';
import { KeyboardShortcutsDialog } from './components/keyboard-shortcuts';
import { useGlobalKeyboardShortcuts } from './hooks/use-global-keyboard-shortcuts';
import { checkDirtyShutdown, loadProjectState } from './services/project-state-service';
import type { SegmentationProgress, Word } from '@splice/types/generated';
import { AppWorkspace, type AppScreen } from './components/app/AppWorkspace';
import {
  getPreference,
  PREF_TRANSCRIPTION_WHISPER_AUTO_APPLY_IF_UNEDITED,
} from './services/preferences-service';

function tracingLogCorrection(issue: 'auto_applied' | 'manual_required' | 'failed', projectId: string, jobId: string) {
  console.debug(`[transcription-correction] issue=${issue} project_id=${projectId} job_id=${jobId}`);
}

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
  const correctionState = useTranscriptStore(s => s.correctionState);
  const pendingCorrection = useTranscriptStore(s => s.pendingCorrection);
  const correctionError = useTranscriptStore(s => s.correctionError);
  const hasUserEditedSinceTranscription = useTranscriptStore(s => s.hasUserEditedSinceTranscription);
  const setCorrectionRunning = useTranscriptStore(s => s.setCorrectionRunning);
  const setCorrectionCandidate = useTranscriptStore(s => s.setCorrectionCandidate);
  const setCorrectionFailed = useTranscriptStore(s => s.setCorrectionFailed);
  const dismissCorrection = useTranscriptStore(s => s.dismissCorrection);
  const applyCorrection = useTranscriptStore(s => s.applyCorrection);

  // Transcript viewer state
  const transcript = useTranscriptStore(s => s.transcript);
  const selectionMode = useTranscriptStore(s => s.selectionMode);
  const setSelectionMode = useTranscriptStore(s => s.setSelectionMode);
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
    currentMatchWordIndex,
    nextMatch,
    prevMatch,
  } = useTranscriptSearch(transcript?.words || []);

  // Timeline sync
  useTimelineSync();
  // Auto-save project state (timeline position, volume) every 30s
  useProjectStateAutosave(currentProject?.id ?? null);
  const timelineSegments = useTimelineStore(s => s.segments);
  const hasSelections = timelineSegments.length > 0;
  const canGenerateCuts = selectionMode === 'remove'
    ? Boolean(transcript?.words?.length)
    : hasSelections;
  const [scrollToWordIndex, setScrollToWordIndex] = useState<number | null>(null);

  // Auto-scroll transcript to active search match.
  useEffect(() => {
    if (currentMatchWordIndex === null) return;
    setScrollToWordIndex(null);
    queueMicrotask(() => setScrollToWordIndex(currentMatchWordIndex));
  }, [currentMatchWordIndex]);

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
    let unlistenCorrectionProgress: (() => void) | undefined;
    let unlistenCorrectionReady: (() => void) | undefined;
    let unlistenCorrectionFailed: (() => void) | undefined;

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
        words: Word[];
        language: string | null;
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

      // Listen for background correction progress
      unlistenCorrectionProgress = await listen<{
        project_id: string;
        job_id: string;
        stage: string;
        progress: number;
        message: string;
      }>('transcription:correction_progress', (event) => {
        const state = useTranscriptStore.getState();
        if (state.isTranscribing) return;
        setCorrectionRunning(event.payload.job_id, event.payload.project_id);
      });

      // Listen for correction ready and auto-apply when no user edits happened
      unlistenCorrectionReady = await listen<{
        project_id: string;
        job_id: string;
        detected_language: string;
        forced_language: string;
        profile: string;
        result: {
          text: string;
          words: Word[];
          language: string | null;
          confidence?: number;
        };
      }>('transcription:correction_ready', async (event) => {
        const payload = event.payload;
        const latestState = useTranscriptStore.getState();
        if (latestState.isTranscribing) return;

        setCorrectionCandidate({
          projectId: payload.project_id,
          jobId: payload.job_id,
          detectedLanguage: payload.detected_language,
          forcedLanguage: payload.forced_language,
          profile: payload.profile,
          result: payload.result,
        });

        const autoApplyRaw = await getPreference(PREF_TRANSCRIPTION_WHISPER_AUTO_APPLY_IF_UNEDITED);
        const autoApplyEnabled = autoApplyRaw === null || autoApplyRaw === '' || autoApplyRaw === 'true';

        const state = useTranscriptStore.getState();
        const shouldAutoApply =
          autoApplyEnabled &&
          state.currentProjectId === payload.project_id &&
          state.activeCorrectionJobId === payload.job_id &&
          !state.hasUserEditedSinceTranscription;

        if (!shouldAutoApply) {
          tracingLogCorrection('manual_required', payload.project_id, payload.job_id);
          toast.info('Correction Whisper disponible', {
            description: 'Applique-la depuis la bannière dans l’éditeur.',
            duration: 5000,
          });
          return;
        }

        const applied = await state.applyCorrection(payload.project_id, false);
        if (applied) {
          tracingLogCorrection('auto_applied', payload.project_id, payload.job_id);
          toast.success('Correction Whisper appliquée', {
            description: 'Le transcript a été amélioré automatiquement.',
            duration: 4000,
          });
        }
      });

      // Listen for correction failures (non-blocking)
      unlistenCorrectionFailed = await listen<{
        project_id: string;
        job_id: string;
        message: string;
      }>('transcription:correction_failed', (event) => {
        const state = useTranscriptStore.getState();
        if (state.isTranscribing) return;
        setCorrectionFailed(event.payload.message, event.payload.job_id);
        tracingLogCorrection('failed', event.payload.project_id, event.payload.job_id);
        toast.error('Correction Whisper indisponible', {
          description: sanitizeErrorForUser(event.payload.message),
          duration: 5000,
        });
      });
    };

    setupListeners();

    return () => {
      if (unlistenProgress) unlistenProgress();
      if (unlistenCompleted) unlistenCompleted();
      if (unlistenError) unlistenError();
      if (unlistenCorrectionProgress) unlistenCorrectionProgress();
      if (unlistenCorrectionReady) unlistenCorrectionReady();
      if (unlistenCorrectionFailed) unlistenCorrectionFailed();
    };
  }, [
    updateTranscriptionProgress,
    completeTranscription,
    transcribingProjectId,
    setCorrectionRunning,
    setCorrectionCandidate,
    setCorrectionFailed,
  ]);

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

  const handleBackToEditor = () => {
    setCurrentScreen('editor');
  };

  const handleStartTranscription = () => {
    if (!currentProject) return;
    startTranscription(currentProject.id, currentProject.file_path, currentProject.id);
  };

  const handleGenerateCuts = async () => {
    if (!currentProject || isSegmenting) return;

    // Flush pending selections to DB before generating cuts
    await useTranscriptStore.getState().saveSelections();
    useSegmentationStore.getState().startSegmentation(currentProject.id);
  };

  const handlePreview = () => {
    if (!currentProject) return;
    useSegmentationStore.getState().preparePreview(currentProject.id);
    setCurrentScreen('preview');
  };

  const handleApplyCorrection = async () => {
    if (!currentProject || !pendingCorrection) return;
    if (pendingCorrection.projectId !== currentProject.id) return;

    let clearSelections = false;
    if (selectedWordIndices.length > 0) {
      const confirmed = window.confirm(
        'Appliquer la correction va réinitialiser les sélections actuelles. Continuer ?'
      );
      if (!confirmed) return;
      clearSelections = true;
    }

    const applied = await applyCorrection(currentProject.id, clearSelections);
    if (applied) {
      toast.success('Correction Whisper appliquée', {
        description: 'Le transcript corrigé est maintenant actif.',
        duration: 4000,
      });
    } else {
      toast.error('Impossible d’appliquer la correction');
    }
  };

  const transcribingScreenProps = currentProject
    ? {
        progress: transcriptionProgress,
        videoInfo: {
          id: currentProject.id,
          file_name: currentProject.file_name,
          file_path: currentProject.file_path,
          duration_seconds: currentProject.duration_seconds,
          file_size_bytes: currentProject.file_size_bytes,
        },
        onCancel: cancelTranscription,
      }
    : null;

  const projectDetailsProps = currentProject
    ? {
        currentProject,
        isTranscribing,
        isReady,
        onStartTranscription: handleStartTranscription,
      }
    : null;

  const previewScreenProps = {
    isPreparingPreview,
    previewError,
    previewPath,
    finalVideoPath,
    segmentBoundaries,
    onBackToEditor: handleBackToEditor,
  };

  const editorScreenProps = transcript && currentProject
    ? {
        transcript,
        currentProject,
        toolbarProps: {
          searchQuery,
          onSearchQueryChange: setSearchQuery,
          currentMatchIndex,
          totalMatches: matches.length,
          onNextMatch: nextMatch,
          onPrevMatch: prevMatch,
          selectionMode,
          onSelectionModeChange: setSelectionMode,
          onUndo: undo,
          onRedo: redo,
          canUndo,
          canRedo,
          onClearAll: clearSelection,
        },
        viewerProps: {
          selectedIndices: selectedWordIndices,
          selectionMode,
          onWordClick: toggleWordSelection,
          onSelectionChange: setSelection,
          onToggleRange: toggleSelectionRange,
          onSetIndices: setSelectionFromIndices,
          onClearSelection: clearSelection,
          onUndo: undo,
          onRedo: redo,
          searchQuery,
          scrollToWordIndex,
        },
        onSegmentClick: handleSegmentClick,
        correctionState,
        correctionError,
        pendingCorrection,
        hasUserEditedSinceTranscription,
        onApplyCorrection: handleApplyCorrection,
        onDismissCorrection: dismissCorrection,
      }
    : null;

  return (
    <>
      <AppWorkspace
        showDialog={showDialog}
        currentProject={currentProject}
        currentScreen={currentScreen}
        isSegmenting={isSegmenting}
        hasSelections={canGenerateCuts}
        finalVideoPath={finalVideoPath}
        isPreparingPreview={isPreparingPreview}
        onGenerateCuts={handleGenerateCuts}
        onPreview={handlePreview}
        onBackToEditor={handleBackToEditor}
        onExport={() => useExportStore.getState().openExportDialog()}
        transcribingScreenProps={transcribingScreenProps}
        projectDetailsProps={projectDetailsProps}
        previewScreenProps={previewScreenProps}
        editorScreenProps={editorScreenProps}
      />

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
