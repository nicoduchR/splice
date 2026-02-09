import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { useUpdateStore } from '@/stores/update-store';

interface UpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

function ChangelogRenderer({ notes }: { notes: string }) {
  if (!notes) return <p className="text-sm text-gray-400">Aucune note de version disponible.</p>;

  const lines = notes.split('\n');
  return (
    <div className="space-y-1 text-sm text-gray-300" data-testid="changelog">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('## ')) {
          return <h3 key={i} className="text-white font-semibold mt-2">{trimmed.slice(3)}</h3>;
        }
        if (trimmed.startsWith('### ')) {
          return <h4 key={i} className="text-gray-200 font-medium mt-1">{trimmed.slice(4)}</h4>;
        }
        if (trimmed.startsWith('- ')) {
          return <li key={i} className="ml-4 list-disc">{trimmed.slice(2)}</li>;
        }
        if (trimmed === '') return null;
        return <p key={i}>{trimmed}</p>;
      })}
    </div>
  );
}

function formatReleaseDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function UpdateDialog({ isOpen, onClose }: UpdateDialogProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const updateInfo = useUpdateStore((s) => s.updateInfo);
  const installUpdate = useUpdateStore((s) => s.installUpdate);
  const setInstallOnQuit = useUpdateStore((s) => s.setInstallOnQuit);
  const remindLater = useUpdateStore((s) => s.remindLater);

  const handleInstallNow = () => {
    setShowConfirm(true);
  };

  const handleConfirmInstall = async () => {
    setIsInstalling(true);
    setShowConfirm(false);
    try {
      await installUpdate();
    } catch {
      setIsInstalling(false);
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirm(false);
  };

  const handleInstallOnQuit = async () => {
    await setInstallOnQuit(true);
    onClose();
  };

  const handleRemindLater = () => {
    remindLater();
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="bg-card-dark border-white/5 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Mise à jour disponible</DialogTitle>
            <DialogDescription className="text-gray-500">
              Une nouvelle version est prête à être installée.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-gray-400">Version :</span>
              <span className="text-white font-medium" data-testid="update-version">
                {updateInfo?.version}
              </span>
            </div>

            {updateInfo?.release_date && (
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-gray-400">Date de sortie :</span>
                <span className="text-white" data-testid="update-date">
                  {formatReleaseDate(updateInfo.release_date)}
                </span>
              </div>
            )}

            <div>
              <span className="text-sm text-gray-400">Nouveautés :</span>
              <div className="mt-2 max-h-48 overflow-y-auto rounded-md bg-gray-900 p-3 border border-gray-800">
                <ChangelogRenderer notes={updateInfo?.release_notes || ''} />
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={handleRemindLater}
              disabled={isInstalling}
            >
              Rappeler plus tard
            </Button>
            <Button
              onClick={handleInstallOnQuit}
              disabled={isInstalling}
            >
              Installer à la fermeture
            </Button>
            <Button
              variant="destructive"
              onClick={handleInstallNow}
              disabled={isInstalling}
            >
              Installer maintenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="max-w-xl p-0 gap-0 border-white/5 bg-card-dark">
          <AlertDialogHeader className="p-6 pb-4">
            <AlertDialogTitle>Confirmer le redémarrage</AlertDialogTitle>
            <AlertDialogDescription>
              L'application va redémarrer pour appliquer la mise à jour. Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="p-6 pt-0">
            <AlertDialogCancel onClick={handleCancelConfirm}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmInstall}>Redémarrer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
