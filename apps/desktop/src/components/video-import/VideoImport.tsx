import React, { useCallback, useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { DropZone } from './DropZone';
import { ErrorDialog } from '@/components/error';
import { useVideoStore } from '@/stores/video-store';
import { toast } from 'sonner';
import { getErrorWithGuidance, sanitizeErrorForUser } from '@/lib/error-messages';
import { logError } from '@/lib/logger';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface VideoImportProps {
  className?: string;
}

export function VideoImport({ className }: VideoImportProps) {
  const currentProject = useVideoStore(s => s.currentProject);
  const isImporting = useVideoStore(s => s.isImporting);
  const error = useVideoStore(s => s.error);
  const importVideo = useVideoStore(s => s.importVideo);
  const clearProject = useVideoStore(s => s.clearProject);
  const setError = useVideoStore(s => s.setError);

  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [pendingFilePath, setPendingFilePath] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [validatingFilePath, setValidatingFilePath] = useState<string | null>(null);

  // Open error dialog when error occurs
  useEffect(() => {
    if (error) {
      setShowErrorDialog(true);
    }
  }, [error]);

  const performImport = useCallback(async (filePath: string) => {
    try {
      setValidatingFilePath(filePath);
      await importVideo(filePath);
      setValidatingFilePath(null);
      toast.success('Vidéo importée avec succès');
    } catch (err) {
      setValidatingFilePath(null);
      // Error dialog will be shown automatically via useEffect
      logError('VideoImport.performImport', err);
    }
  }, [importVideo]);

  const handleBrowseFiles = useCallback(async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Video',
          extensions: ['mp4', 'mov', 'avi']
        }]
      });

      if (selected && typeof selected === 'string') {
        // Check if project already exists
        if (currentProject) {
          setPendingFilePath(selected);
          setShowReplaceDialog(true);
          return;
        }
        // Import video directly
        await performImport(selected);
      }
    } catch (err) {
      logError('VideoImport.handleBrowseFiles', err);
      toast.error('Impossible d\'ouvrir le sélecteur de fichiers');
    }
  }, [currentProject, performImport]);

  const handleFileSelected = useCallback(async (filePath: string) => {
    // Mono-project constraint: check if project already exists
    if (currentProject) {
      setPendingFilePath(filePath);
      setShowReplaceDialog(true);
      return;
    }

    // Import video
    await performImport(filePath);
  }, [currentProject, performImport]);

  const handleRetryError = useCallback(() => {
    setShowErrorDialog(false);
    setError(null);
    handleBrowseFiles();
  }, [setError, handleBrowseFiles]);

  const handleCancelError = useCallback(() => {
    setShowErrorDialog(false);
    setError(null);
  }, [setError]);

  const handleConfirmReplace = useCallback(async () => {
    if (!pendingFilePath) return;

    clearProject();
    setShowReplaceDialog(false);
    await performImport(pendingFilePath);
    setPendingFilePath(null);
  }, [pendingFilePath, clearProject, performImport]);

  const handleCancelReplace = useCallback(() => {
    setShowReplaceDialog(false);
    setPendingFilePath(null);
  }, []);

  return (
    <div className={className}>
      <div className="relative w-full max-w-4xl flex flex-col items-center justify-center">
        {/* Don't show inline error in DropZone, use ErrorDialog instead */}
        <DropZone
          onFileSelected={handleFileSelected}
          onBrowseFiles={handleBrowseFiles}
          isValidating={isImporting}
          error={null}
          validatingFilePath={validatingFilePath}
        />
      </div>

      {/* Error Dialog - Story 9.3: Unified ErrorDialog with guidance */}
      {error && (() => {
        const guidance = getErrorWithGuidance(error);
        return (
          <ErrorDialog
            isOpen={showErrorDialog}
            severity={guidance.severity}
            title={guidance.title}
            description={guidance.description}
            suggestedActions={guidance.suggestedActions}
            onRetry={guidance.retryable ? handleRetryError : undefined}
            onClose={handleCancelError}
            errorDetails={sanitizeErrorForUser(error)}
          />
        );
      })()}

      {/* Replace Dialog */}
      <AlertDialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remplacer le projet actuel ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez déjà un projet ouvert. Voulez-vous le remplacer par cette nouvelle vidéo ?
              Cette action ne supprimera pas le fichier précédent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelReplace}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReplace}>Remplacer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
