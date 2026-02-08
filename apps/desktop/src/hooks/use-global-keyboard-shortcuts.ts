import { useEffect, useState, useCallback } from 'react';

export function useGlobalKeyboardShortcuts() {
  const [isShortcutsDialogOpen, setIsShortcutsDialogOpen] = useState(false);

  const openShortcutsDialog = useCallback(() => {
    setIsShortcutsDialogOpen(true);
  }, []);

  const closeShortcutsDialog = useCallback(() => {
    setIsShortcutsDialogOpen(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if focus is on an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      // Cmd+/ (Mac) or Ctrl+/ (Windows) — Open keyboard shortcuts help
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setIsShortcutsDialogOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isShortcutsDialogOpen,
    openShortcutsDialog,
    closeShortcutsDialog,
    setIsShortcutsDialogOpen,
  };
}
