import { Clock } from 'lucide-react';
import { useLicenseStore } from '@/stores/license-store';

/**
 * Subtle indicator showing remaining grace period days
 * Only visible when in grace period (offline mode)
 */
export function GracePeriodIndicator() {
  const { isInGracePeriod, daysUntilGraceExpires, isVerifying, isBlocked } = useLicenseStore();

  // Don't show if not in grace period, blocked, or verifying
  if (!isInGracePeriod || isBlocked || isVerifying || daysUntilGraceExpires <= 0) {
    return null;
  }

  // Color based on urgency
  const isUrgent = daysUntilGraceExpires <= 3;
  const colorClass = isUrgent ? 'text-amber-500' : 'text-slate-400';

  return (
    <div
      className={`flex items-center gap-1.5 text-xs ${colorClass}`}
      title={`Mode hors ligne - ${daysUntilGraceExpires} jour${daysUntilGraceExpires > 1 ? 's' : ''} restants avant vérification requise`}
    >
      <Clock className="w-3.5 h-3.5" />
      <span>
        {daysUntilGraceExpires}j hors ligne
      </span>
    </div>
  );
}
