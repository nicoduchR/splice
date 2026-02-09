import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';

interface ShortcutEntry {
  keys: string[];
  description: string;
}

interface ShortcutSection {
  title: string;
  shortcuts: ShortcutEntry[];
}

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const KeyboardShortcutsDialog = React.memo(function KeyboardShortcutsDialog({
  isOpen,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  const isMac = useMemo(
    () => typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform),
    []
  );
  const modKey = isMac ? '⌘' : 'Ctrl';

  const sections: ShortcutSection[] = useMemo(
    () => [
      {
        title: 'Global',
        shortcuts: [
          { keys: [`${modKey}+/`], description: 'Aide raccourcis clavier' },
          { keys: [`${modKey}+Z`], description: 'Annuler' },
          { keys: [`${modKey}+⇧+Z`], description: 'Rétablir' },
          { keys: [`${modKey}+F`], description: 'Rechercher dans le transcript' },
        ],
      },
      {
        title: 'Transcript',
        shortcuts: [
          { keys: ['←', '→'], description: 'Mot précédent / suivant' },
          { keys: ['↑', '↓'], description: 'Paragraphe précédent / suivant' },
          { keys: ['Escape'], description: 'Désélectionner tout' },
          { keys: ['⇧+Click'], description: 'Étendre la sélection' },
        ],
      },
      {
        title: 'Timeline',
        shortcuts: [
          { keys: ['←', '→'], description: '±1 frame (1/30s)' },
          { keys: ['⇧+←', '⇧+→'], description: '±5 secondes' },
          { keys: ['Home'], description: 'Début de la vidéo' },
          { keys: ['End'], description: 'Fin de la vidéo' },
        ],
      },
      {
        title: 'Lecteur',
        shortcuts: [
          { keys: ['Space'], description: 'Play / Pause' },
          { keys: ['↑', '↓'], description: 'Volume ±10%' },
          { keys: ['F'], description: 'Plein écran' },
        ],
      },
      {
        title: 'Modals',
        shortcuts: [
          { keys: ['Escape'], description: 'Fermer' },
          { keys: ['Tab'], description: 'Navigation entre éléments' },
          { keys: ['Enter'], description: 'Confirmer' },
        ],
      },
    ],
    [modKey]
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Raccourcis clavier</DialogTitle>
          <DialogDescription>
            Liste de tous les raccourcis clavier disponibles dans l'application.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4" data-testid="shortcuts-sections">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {section.title}
              </h3>
              <div className="space-y-2">
                {section.shortcuts.map((shortcut, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm text-foreground">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, kidx) => (
                        <kbd
                          key={kidx}
                          className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
});
