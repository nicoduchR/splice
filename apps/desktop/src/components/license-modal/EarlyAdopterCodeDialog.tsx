import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';

interface EarlyAdopterCodeDialogProps {
  isOpen: boolean;
  isActivating?: boolean;
  error?: string | null;
  defaultEmail?: string;
  onActivate: (code: string, email: string) => void;
  onClose: () => void;
}

const CODE_REGEX = /^SPLICE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EarlyAdopterCodeDialog({
  isOpen,
  isActivating = false,
  error = null,
  defaultEmail = '',
  onActivate,
  onClose,
}: EarlyAdopterCodeDialogProps) {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState(defaultEmail);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const isValidCodeFormat = useCallback((value: string): boolean => {
    return CODE_REGEX.test(value.toUpperCase());
  }, []);

  const isValidEmailFormat = useCallback((value: string): boolean => {
    return EMAIL_REGEX.test(value);
  }, []);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setCode(value);

    // Real-time validation
    if (value.length > 0 && !isValidCodeFormat(value)) {
      // Only show error if user has typed enough characters
      if (value.length >= 19) {
        setValidationError('Format invalide. Le code doit être au format SPLICE-XXXX-XXXX-XXXX');
      } else {
        setValidationError(null);
      }
    } else {
      setValidationError(null);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    // Clear error when typing
    if (emailError) {
      setEmailError(null);
    }
  };

  const handleActivate = () => {
    if (!isValidCodeFormat(code)) {
      setValidationError('Format invalide. Le code doit être au format SPLICE-XXXX-XXXX-XXXX');
      return;
    }
    if (!isValidEmailFormat(email)) {
      setEmailError('Veuillez entrer une adresse email valide');
      return;
    }
    onActivate(code, email);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValidCodeFormat(code) && isValidEmailFormat(email) && !isActivating) {
      handleActivate();
    }
  };

  const handleClose = () => {
    setCode('');
    setEmail(defaultEmail);
    setValidationError(null);
    setEmailError(null);
    onClose();
  };

  const isButtonDisabled = !code || !isValidCodeFormat(code) || !email || !isValidEmailFormat(email) || isActivating;
  const displayError = error || validationError;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && !isActivating && handleClose()}>
      <AlertDialogContent className="bg-gray-950 border-gray-800 max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white text-xl">
            Activer votre code early adopter
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            Entrez votre code d'accès lifetime pour débloquer Splice Pro.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="early-adopter-code" className="text-sm text-gray-400">Code early adopter</label>
            <Input
              id="early-adopter-code"
              type="text"
              placeholder="SPLICE-XXXX-XXXX-XXXX"
              value={code}
              onChange={handleCodeChange}
              onKeyDown={handleKeyDown}
              disabled={isActivating}
              className={`bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 ${
                displayError ? 'border-red-500' : ''
              }`}
              maxLength={19}
            />
            {displayError && (
              <p className="text-red-400 text-sm">{displayError}</p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="early-adopter-email" className="text-sm text-gray-400">Votre adresse email</label>
            <Input
              id="early-adopter-email"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={handleEmailChange}
              onKeyDown={handleKeyDown}
              disabled={isActivating}
              className={`bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 ${
                emailError ? 'border-red-500' : ''
              }`}
            />
            {emailError && (
              <p className="text-red-400 text-sm">{emailError}</p>
            )}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel
            className="border-gray-700"
            disabled={isActivating}
            onClick={handleClose}
          >
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleActivate}
            disabled={isButtonDisabled}
            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[8.75rem] disabled:opacity-50"
          >
            {isActivating ? (
              <>
                <Loader2 aria-hidden="true" className="w-4 h-4 mr-2 animate-spin" />
                Activation...
              </>
            ) : (
              'Activer'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
