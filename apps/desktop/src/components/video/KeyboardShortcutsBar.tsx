import React from 'react';

export const KeyboardShortcutsBar = React.memo(function KeyboardShortcutsBar() {
  return (
    <div className="bg-panel-dark border-t border-border-dark px-4 py-2 flex items-center gap-6 text-xs text-muted-foreground">
      <span>
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono mr-1">Space</kbd>
        Play / Pause
      </span>
      <span>
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono mr-1">Tab</kbd>
        Skip silence
      </span>
      <span>
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono mr-1">←</kbd>
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono mr-1">→</kbd>
        Seek ±5s
      </span>
    </div>
  );
});
