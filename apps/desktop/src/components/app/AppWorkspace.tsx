import type { ComponentProps } from 'react';
import type { Transcript } from '@splice/types';
import type { VideoProject } from '@splice/types/generated';
import { Brain } from 'lucide-react';
import { VideoImport } from '../video-import';
import { TopBar } from '../layout';
import { Toaster } from '../ui/sonner';
import { Button } from '../ui/button';
import { TranscriptionScreen } from '../transcription';
import { TranscriptViewer, TranscriptViewerToolbar } from '../transcript';
import { PreviewPlayer } from '../preview/PreviewPlayer';
import { VideoPlayer, KeyboardShortcutsBar } from '../video';
import type { SegmentBoundary } from '../../stores/segmentation-store';

export type AppScreen = 'import' | 'project-details' | 'transcribing' | 'editor' | 'preview';

interface ProjectDetailsProps {
  currentProject: VideoProject;
  isTranscribing: boolean;
  isReady: boolean;
  onStartTranscription: () => void;
}

interface PreviewScreenProps {
  isPreparingPreview: boolean;
  previewError: string | null;
  previewPath: string | null;
  finalVideoPath: string | null;
  segmentBoundaries: SegmentBoundary[];
  onBackToEditor: () => void;
}

interface EditorScreenProps {
  transcript: Transcript;
  currentProject: VideoProject;
  toolbarProps: ComponentProps<typeof TranscriptViewerToolbar>;
  viewerProps: Omit<ComponentProps<typeof TranscriptViewer>, 'words'>;
  onSegmentClick: (wordIndex: number) => void;
}

interface AppWorkspaceProps {
  showDialog: boolean;
  currentProject: VideoProject | null;
  currentScreen: AppScreen;
  isSegmenting: boolean;
  hasSelections: boolean;
  finalVideoPath: string | null;
  isPreparingPreview: boolean;
  onGenerateCuts: () => void | Promise<void>;
  onPreview: () => void;
  onBackToEditor: () => void;
  onExport: () => void;
  transcribingScreenProps: ComponentProps<typeof TranscriptionScreen> | null;
  projectDetailsProps: ProjectDetailsProps | null;
  previewScreenProps: PreviewScreenProps;
  editorScreenProps: EditorScreenProps | null;
}

function ProjectDetailsScreen({
  currentProject,
  isTranscribing,
  isReady,
  onStartTranscription,
}: ProjectDetailsProps) {
  const totalSeconds = Math.floor(currentProject.duration_seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const formattedDuration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="text-white relative z-10 w-full max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Projet chargé</h1>
      <div className="bg-[#25252D] p-8 rounded-xl border border-[#35353F] shadow-2xl">
        <div className="space-y-4">
          <div>
            <p className="text-slate-400 text-sm mb-1">Fichier</p>
            <p className="text-white font-semibold text-lg">{currentProject.file_name}</p>
          </div>

          <div>
            <p className="text-slate-400 text-sm mb-1">Durée</p>
            <p className="text-white font-medium">{formattedDuration}</p>
          </div>

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

          {currentProject.file_size_bytes && (
            <div>
              <p className="text-slate-400 text-sm mb-1">Taille</p>
              <p className="text-white font-medium">
                {(currentProject.file_size_bytes / (1024 ** 3)).toFixed(2)} GB
              </p>
            </div>
          )}

          {currentProject.codec && (
            <div>
              <p className="text-slate-400 text-sm mb-1">Codec</p>
              <p className="text-white font-medium uppercase">{currentProject.codec}</p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-700">
            <p className="text-slate-400 text-sm mb-1">Chemin</p>
            <p className="text-slate-300 text-sm break-all">{currentProject.file_path}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <Button
          size="lg"
          className="w-full max-w-md"
          onClick={onStartTranscription}
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
  );
}

function PreviewScreen({
  isPreparingPreview,
  previewError,
  previewPath,
  finalVideoPath,
  segmentBoundaries,
  onBackToEditor,
}: PreviewScreenProps) {
  return (
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
            onClick={onBackToEditor}
          >
            Retour à l'éditeur
          </button>
        </div>
      )}
      {!isPreparingPreview && !previewError && (previewPath || finalVideoPath) && (
        <PreviewPlayer filePath={previewPath || finalVideoPath!} segmentBoundaries={segmentBoundaries} />
      )}
    </section>
  );
}

function EditorScreen({
  transcript,
  currentProject,
  toolbarProps,
  viewerProps,
  onSegmentClick,
}: EditorScreenProps) {
  return (
    <div className="relative z-10 w-full h-full min-h-0 flex flex-row">
      <section aria-label="Transcript" className="w-[60%] h-full min-h-0 flex flex-col border-r border-border-dark">
        <TranscriptViewerToolbar {...toolbarProps} />
        <div id="transcript" className="flex-1 min-h-0 overflow-hidden">
          <TranscriptViewer {...viewerProps} words={transcript.words} />
        </div>
      </section>

      <section aria-label="Lecteur vidéo" className="w-[40%] h-full min-h-0 flex flex-col bg-panel-dark">
        <VideoPlayer
          filePath={currentProject.file_path}
          width={currentProject.width ?? undefined}
          height={currentProject.height ?? undefined}
          onSegmentClick={onSegmentClick}
        />
        <KeyboardShortcutsBar />
      </section>
    </div>
  );
}

export function AppWorkspace({
  showDialog,
  currentProject,
  currentScreen,
  isSegmenting,
  hasSelections,
  finalVideoPath,
  isPreparingPreview,
  onGenerateCuts,
  onPreview,
  onBackToEditor,
  onExport,
  transcribingScreenProps,
  projectDetailsProps,
  previewScreenProps,
  editorScreenProps,
}: AppWorkspaceProps) {
  if (showDialog) {
    return <div className="min-h-screen bg-background-dark" />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
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
        onGenerateCuts={onGenerateCuts}
        isSegmenting={isSegmenting}
        hasSelections={hasSelections}
        canPreview={!!finalVideoPath}
        isPreparingPreview={isPreparingPreview}
        onPreview={onPreview}
        onBackToEditor={onBackToEditor}
        onExport={onExport}
      />
      <Toaster />

      <main className={`flex-1 min-h-0 flex flex-col relative ${currentScreen === 'editor' ? 'overflow-hidden' : 'items-center justify-center p-6 sm:p-10'}`}>
        {currentScreen !== 'transcribing' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]"></div>
            <div className="absolute top-[40%] right-[5%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]"></div>
          </div>
        )}

        {currentScreen === 'import' && (
          <div className="relative w-full max-w-4xl flex flex-col items-center justify-center">
            <VideoImport />
          </div>
        )}

        {currentScreen === 'transcribing' && transcribingScreenProps && (
          <TranscriptionScreen {...transcribingScreenProps} />
        )}

        {currentScreen === 'project-details' && projectDetailsProps && (
          <ProjectDetailsScreen {...projectDetailsProps} />
        )}

        {currentScreen === 'preview' && (
          <PreviewScreen {...previewScreenProps} />
        )}

        {currentScreen === 'editor' && editorScreenProps && (
          <EditorScreen {...editorScreenProps} />
        )}
      </main>
    </div>
  );
}
