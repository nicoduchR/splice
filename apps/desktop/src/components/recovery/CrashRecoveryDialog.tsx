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
      <AlertDialogContent className="max-w-[32rem] p-0 gap-0 border-white/15 bg-[#121a28] shadow-[0_44px_120px_-42px_rgba(0,0,0,0.92)]">
        <AlertDialogHeader className="p-6 pb-3">
          <AlertDialogTitle className="text-[1.85rem] font-bold leading-tight tracking-tight">
            Splice s&apos;est ferm&eacute; de mani&egrave;re inattendue
          </AlertDialogTitle>
          <AlertDialogDescription className="pt-1 text-base leading-relaxed text-slate-200/90">
            Un projet en cours a été détecté. Souhaitez-vous récupérer votre
            travail ou repartir à zéro ?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="p-6 pt-1 flex gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={onStartFresh}
            disabled={isRecovering}
            className="min-w-[8.75rem]"
            data-testid="start-fresh"
          >
            Repartir à zéro
          </Button>
          <Button
            onClick={onRecover}
            disabled={isRecovering}
            className="min-w-[10.5rem]"
            data-testid="recover-project"
          >
            {isRecovering ? 'Récupération...' : 'Récupérer le projet'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
