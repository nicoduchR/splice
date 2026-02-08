import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useUpdateStore } from '@/stores/update-store';

export function RollbackNotification() {
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  const rollbackCompleted = useUpdateStore((s) => s.rollbackCompleted);
  const sendCrashReport = useUpdateStore((s) => s.sendCrashReport);
  const clearRollbackNotification = useUpdateStore((s) => s.clearRollbackNotification);

  if (!rollbackCompleted) return null;

  const handleSendReport = async () => {
    setIsSendingReport(true);
    try {
      await sendCrashReport(true);
      setReportSent(true);
    } catch {
      // Silently fail — crash report is optional
    } finally {
      setIsSendingReport(false);
    }
  };

  const handleClose = () => {
    setReportSent(false);
    clearRollbackNotification();
  };

  return (
    <AlertDialog open={!!rollbackCompleted} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <AlertDialogContent className="max-w-[520px] p-0 gap-0 border-white/5 bg-card-dark">
        <AlertDialogHeader className="p-6 pb-4">
          <AlertDialogTitle>Version précédente restaurée</AlertDialogTitle>
          <AlertDialogDescription>
            La mise à jour v{rollbackCompleted.previousVersion} a causé des problèmes.
            La version v{rollbackCompleted.restoredVersion} a été restaurée.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="p-6 pt-0 flex gap-2">
          {!reportSent && (
            <Button
              variant="outline"
              onClick={handleSendReport}
              disabled={isSendingReport}
              data-testid="send-crash-report"
            >
              {isSendingReport ? 'Envoi...' : 'Envoyer le rapport de crash'}
            </Button>
          )}
          {reportSent && (
            <span className="text-sm text-green-400 self-center" data-testid="report-sent">
              Rapport envoyé
            </span>
          )}
          <AlertDialogAction onClick={handleClose}>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
