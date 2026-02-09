import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface CrashRecoveryDialogProps {
  isOpen: boolean;
  isRecovering: boolean;
  onRecover: () => void;
  onStartFresh: () => void;
}

export function CrashRecoveryDialog({
  isOpen,
  isRecovering,
  onRecover,
  onStartFresh,
}: CrashRecoveryDialogProps) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-xl p-0 gap-0 border-white/5 bg-card-dark">
        <AlertDialogHeader className="p-6 pb-4">
          <AlertDialogTitle>
            Splice s&apos;est ferm&eacute; de mani&egrave;re inattendue
          </AlertDialogTitle>
          <AlertDialogDescription>
            Un projet en cours a été détecté. Souhaitez-vous récupérer votre
            travail ou repartir à zéro ?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="p-6 pt-0 flex gap-2">
          <Button
            variant="outline"
            onClick={onStartFresh}
            disabled={isRecovering}
            data-testid="start-fresh"
          >
            Repartir à zéro
          </Button>
          <Button
            onClick={onRecover}
            disabled={isRecovering}
            data-testid="recover-project"
          >
            {isRecovering ? 'Récupération...' : 'Récupérer le projet'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
