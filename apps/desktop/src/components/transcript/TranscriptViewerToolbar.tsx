import React, { useRef, useEffect } from 'react';
import { Search, Clock, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export interface TranscriptViewerToolbarProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  currentMatchIndex: number;
  totalMatches: number;
  onNextMatch: () => void;
  onPrevMatch: () => void;
  showTimestamps: boolean;
  onToggleTimestamps: () => void;
  onClearSelection: () => void;
}

export const TranscriptViewerToolbar = React.memo(function TranscriptViewerToolbar({
  searchQuery,
  onSearchQueryChange,
  currentMatchIndex,
  totalMatches,
  onNextMatch,
  onPrevMatch,
  showTimestamps,
  onToggleTimestamps,
  onClearSelection,
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
        {/* Search Section */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher dans le transcript... (Cmd+F)"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Match Counter & Navigation */}
          {totalMatches > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {currentMatchIndex + 1}/{totalMatches}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPrevMatch}
                  disabled={totalMatches === 0}
                  className="h-8 w-8 p-0"
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onNextMatch}
                  disabled={totalMatches === 0}
                  className="h-8 w-8 p-0"
                >
                  ↓
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Toggle Timestamps */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTimestamps}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            <span>{showTimestamps ? 'Masquer' : 'Afficher'} timestamps</span>
          </Button>

          {/* Clear Selection */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            <span>Effacer sélection (Esc)</span>
          </Button>
        </div>
      </div>
    </div>
  );
});
