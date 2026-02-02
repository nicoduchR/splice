import React, { useRef, useEffect } from 'react';
import { Search, Highlighter, Undo2, Redo2, Trash2 } from 'lucide-react';
import { SelectionStats } from './SelectionStats';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';

export interface TranscriptViewerToolbarProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  currentMatchIndex: number;
  totalMatches: number;
  onNextMatch: () => void;
  onPrevMatch: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onClearAll?: () => void;
}

export const TranscriptViewerToolbar = React.memo(function TranscriptViewerToolbar({
  searchQuery,
  onSearchQueryChange,
  currentMatchIndex,
  totalMatches,
  onNextMatch,
  onPrevMatch,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onClearAll,
}: TranscriptViewerToolbarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input on Cmd+F / Ctrl+F
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="sticky top-0 z-10 bg-panel-dark border-b border-border-dark p-3">
      <div className="flex items-center gap-4 justify-between">
        {/* Left Section - Highlight instruction */}
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Highlighter className="h-4 w-4" />
          <span>Surlignez les passages à conserver</span>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {/* Selection stats */}
          <SelectionStats />

          {/* Undo */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={!canUndo}
            onClick={onUndo}
            title="Annuler (⌘Z)"
          >
            <Undo2 className="h-4 w-4" />
          </Button>

          {/* Redo */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={!canRedo}
            onClick={onRedo}
            title="Rétablir (⌘⇧Z)"
          >
            <Redo2 className="h-4 w-4" />
          </Button>

          {/* Clear All with confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Effacer toutes les sélections"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Effacer toutes les sélections ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Toutes les sélections seront supprimées. Vous pouvez annuler avec Cmd+Z.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={onClearAll}
                >
                  Effacer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher... (Cmd+F)"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="pl-9 w-48 h-8 text-sm"
            />
          </div>

          {/* Match Counter & Navigation */}
          {totalMatches > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {currentMatchIndex + 1}/{totalMatches}
              </span>
              <Button variant="ghost" size="sm" onClick={onPrevMatch} className="h-8 w-8 p-0">
                ↑
              </Button>
              <Button variant="ghost" size="sm" onClick={onNextMatch} className="h-8 w-8 p-0">
                ↓
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
