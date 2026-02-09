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
import { AlertTriangle } from 'lucide-react';

interface TranscriptionErrorDialogProps {
  isOpen: boolean;
  errorMessage: string;
  onRetry?: () => void;
  onClose: () => void;
}

export function TranscriptionErrorDialog({
  isOpen,
  errorMessage,
  onRetry,
  onClose,
}: TranscriptionErrorDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-lg border-destructive/50">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">
              Erreur de transcription
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base text-gray-300">
            {errorMessage}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel onClick={onClose}>Fermer</AlertDialogCancel>
          {onRetry && (
            <AlertDialogAction
              onClick={onRetry}
              className="bg-primary hover:bg-primary/90"
            >
              Réessayer
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
