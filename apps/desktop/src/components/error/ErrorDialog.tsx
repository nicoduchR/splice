import { AlertTriangle, XCircle, Copy } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ErrorDialogProps {
  isOpen: boolean;
  severity: 'warning' | 'error';
  title: string;
  description: string;
  suggestedActions: string[];
  onRetry?: () => void;
  onClose: () => void;
  errorDetails?: string;
}

export function ErrorDialog({
  isOpen,
  severity,
  title,
  description,
  suggestedActions,
  onRetry,
  onClose,
  errorDetails,
}: ErrorDialogProps) {
  const isError = severity === 'error';
  const IconComponent = isError ? XCircle : AlertTriangle;
  const iconTestId = isError ? 'error-icon' : 'warning-icon';
  const iconColorClass = isError ? 'text-destructive' : 'text-yellow-500';
  const bgColorClass = isError ? 'bg-destructive/10' : 'bg-yellow-500/10';

  const handleCopyDetails = async () => {
    if (!errorDetails) return;
    const detailsBlock = [
      `Application: Splice`,
      `OS: ${navigator.userAgent}`,
      `Date: ${new Date().toISOString()}`,
      `Erreur: ${title}`,
      `Détails: ${errorDetails}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(detailsBlock);
      toast.success('Détails copiés dans le presse-papiers');
    } catch {
      toast.error('Impossible de copier les détails');
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="sm:max-w-md" data-testid="error-dialog-content">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`w-12 h-12 rounded-full ${bgColorClass} flex items-center justify-center`}
            >
              <IconComponent
                className={`w-6 h-6 ${iconColorClass}`}
                data-testid={iconTestId}
              />
            </div>
            <AlertDialogTitle className="text-xl">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base text-left pt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {suggestedActions.length > 0 && (
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-2">
            {suggestedActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        )}

        <AlertDialogFooter className="sm:justify-end gap-2">
          {errorDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyDetails}
              className="gap-1.5"
            >
              <Copy className="w-4 h-4" />
              Copier les détails
            </Button>
          )}
          <AlertDialogCancel>Fermer</AlertDialogCancel>
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
