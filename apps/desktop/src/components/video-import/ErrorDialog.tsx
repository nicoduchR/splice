import React from 'react';
import { AlertTriangle } from 'lucide-react';
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

interface ErrorDialogProps {
  isOpen: boolean;
  errorMessage: string;
  onRetry: () => void;
  onCancel: () => void;
}

export function ErrorDialog({
  isOpen,
  errorMessage,
  onRetry,
  onCancel,
}: ErrorDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">
              Erreur d'importation
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base text-left pt-2">
            {errorMessage}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="sm:justify-end gap-2">
          <AlertDialogCancel onClick={onCancel}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onRetry} className="bg-primary hover:bg-primary/90">
            Réessayer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
