import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, WifiOff } from 'lucide-react';
import { useState } from 'react';
import { useLicenseStore } from '@/stores/license-store';

interface GracePeriodWarningProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEarlyAdopterClick?: () => void;
}

/**
 * Modal displayed when the grace period has expired
 * Blocks app functionality until successful verification
 */
export function GracePeriodWarning({ open, onOpenChange, onEarlyAdopterClick }: GracePeriodWarningProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const { licenseKey, verifyOnStartup, lastVerifiedAt, error } = useLicenseStore();

  // Calculate days since last verification
  const daysSinceVerification = lastVerifiedAt
    ? Math.floor((Date.now() - lastVerifiedAt * 1000) / (1000 * 60 * 60 * 24))
    : null;

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await verifyOnStartup();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <WifiOff className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">
              Connexion requise pour vérifier la licence
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 text-left">
            <p>
              {daysSinceVerification !== null ? (
                <>
                  Dernière vérification :{' '}
                  <span className="font-medium text-foreground">
                    il y a {daysSinceVerification} jours
                  </span>
                </>
              ) : (
                'Aucune vérification de licence enregistrée.'
              )}
            </p>
            <p>
              La période de grâce de 7 jours est expirée. Connectez-vous à Internet pour
              continuer à utiliser l'application.
            </p>
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {error}
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full sm:w-auto"
          >
            {isRetrying ? (
              <>
                <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
                Vérification en cours...
              </>
            ) : (
              'Réessayer'
            )}
          </Button>
        </AlertDialogFooter>
        {onEarlyAdopterClick && (
          <div className="text-center pt-2 pb-1">
            <button
              type="button"
              onClick={onEarlyAdopterClick}
              disabled={isRetrying}
              className="text-gray-400 text-sm hover:text-gray-300 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Vous avez un code early adopter?
            </button>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
