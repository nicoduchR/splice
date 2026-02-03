import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

interface ExportBlockedDialogProps {
  isOpen: boolean;
  onUpgrade: () => void;
  onClose: () => void;
}

export function ExportBlockedDialog({
  isOpen,
  onUpgrade,
  onClose,
}: ExportBlockedDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="bg-gray-950 border-gray-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            Export réservé à Splice Pro
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            Vous avez créé un montage parfait! Pour exporter votre vidéo, passez à Splice Pro.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-gray-700">
            Fermer
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onUpgrade}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Passer à Pro
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
