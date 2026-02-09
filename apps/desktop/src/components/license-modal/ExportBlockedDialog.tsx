import { Check, Loader2 } from 'lucide-react';
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
  isUpgrading?: boolean;
  onUpgrade: () => void;
  onClose: () => void;
  onEarlyAdopterClick?: () => void;
}

const BENEFITS = [
  'Export illimité en MP4 haute qualité',
  'Vidéos jusqu\'à 2h (pas de limite 30min)',
  'Support prioritaire',
  'Mises à jour incluses',
];

export function ExportBlockedDialog({
  isOpen,
  isUpgrading = false,
  onUpgrade,
  onClose,
  onEarlyAdopterClick,
}: ExportBlockedDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && !isUpgrading && onClose()}>
      <AlertDialogContent className="bg-gray-950 border-gray-800 max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white text-xl">
            Export disponible uniquement pour Splice Pro
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            Vous avez créé un montage parfait! Pour exporter votre vidéo, passez à Splice Pro.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Benefits List */}
        <div className="py-4 space-y-3">
          {BENEFITS.map((benefit) => (
            <div key={benefit} className="flex items-center gap-3">
              <Check aria-hidden="true" className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span className="text-gray-300 text-sm">{benefit}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="text-center py-2">
          <p className="text-white font-semibold">19€/mois ou 99€/an</p>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel
            className="border-gray-700"
            disabled={isUpgrading}
          >
            Fermer
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onUpgrade}
            disabled={isUpgrading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]"
          >
            {isUpgrading ? (
              <>
                <Loader2 aria-hidden="true" className="w-4 h-4 mr-2 animate-spin" />
                Attente...
              </>
            ) : (
              'Passer à Pro'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>

        {onEarlyAdopterClick && (
          <div className="text-center pt-2 pb-1">
            <button
              type="button"
              onClick={onEarlyAdopterClick}
              disabled={isUpgrading}
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
