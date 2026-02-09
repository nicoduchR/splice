import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

interface SettingsRollbackSectionProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsRollbackSection({ isOpen, onClose }: SettingsRollbackSectionProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const backupInfo = useUpdateStore((s) => s.backupInfo);
  const fetchBackupInfo = useUpdateStore((s) => s.fetchBackupInfo);
  const performManualRollback = useUpdateStore((s) => s.performManualRollback);

  useEffect(() => {
    if (isOpen) {
      fetchBackupInfo();
    }
  }, [isOpen, fetchBackupInfo]);

  const handleRollback = async () => {
    setShowConfirm(false);
    await performManualRollback();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="bg-card-dark border-white/5 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Mises à jour</DialogTitle>
            <DialogDescription className="text-gray-500">
              Gérer les mises à jour et la version de l'application.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Revenir à la version précédente
              </h3>

              {backupInfo ? (
                <div className="space-y-3">
                  <div className="rounded-md bg-gray-900 p-3 border border-gray-800 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-gray-400">Version sauvegardée :</span>
                      <span className="text-white font-medium" data-testid="backup-version">
                        v{backupInfo.version}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-gray-400">Date :</span>
                      <span className="text-white text-sm" data-testid="backup-date">
                        {backupInfo.backupDate}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-gray-400">Taille :</span>
                      <span className="text-white text-sm" data-testid="backup-size">
                        {backupInfo.sizeMb} Mo
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setShowConfirm(true)}
                    data-testid="rollback-button"
                  >
                    Revenir à v{backupInfo.version}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-gray-500" data-testid="no-backup">
                  Aucune version précédente disponible.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="max-w-xl p-0 gap-0 border-white/5 bg-card-dark">
          <AlertDialogHeader className="p-6 pb-4">
            <AlertDialogTitle>Confirmer le rollback</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous revenir à la version v{backupInfo?.version} ? L'application va redémarrer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="p-6 pt-0">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleRollback} data-testid="confirm-rollback">
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
