import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTabStore } from '../store/tabStore';
import { Columns, Square, Eye, Sun, Moon } from 'lucide-react';

interface LayoutManagerProps {
  editor: React.ReactNode;
  preview: React.ReactNode;
}

export const LayoutManager: React.FC<LayoutManagerProps> = ({ editor, preview }) => {
  const { layoutMode, setLayoutMode, splitRatio, setSplitRatio, theme, setTheme } = useTabStore();
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newRatio = (e.clientX - rect.left) / rect.width;
      setSplitRatio(newRatio);
    },
    [isDragging, setSplitRatio]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) setIsDragging(false);
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Keyboard layout shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+\: Toggle Split
      if (e.ctrlKey && e.key === '\\') {
        e.preventDefault();
        setLayoutMode(layoutMode === 'Split' ? 'FullEditor' : 'Split');
      }
      // Ctrl+Shift+E: Full Editor
      else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setLayoutMode('FullEditor');
      }
      // Ctrl+Shift+P: Full Preview
      else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setLayoutMode('FullPreview');
      }
      // Ctrl+Shift+L: Toggle Theme
      else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setTheme(theme === 'dark' ? 'light' : 'dark');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [layoutMode, theme, setLayoutMode, setTheme]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-obsidian">
      {/* Sub-toolbar for layout & theme mode controls */}
      <div className="h-7 bg-slate-surface border-b border-slate-border px-3 flex items-center justify-between font-mono text-xs text-slate-muted select-none">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Split Layout"
            onClick={() => setLayoutMode('Split')}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] transition-colors ${
              layoutMode === 'Split'
                ? 'bg-slate-shell text-parchment border border-verdigris'
                : 'hover:text-parchment hover:bg-slate-shell'
            }`}
          >
            <Columns className="w-3 h-3 text-verdigris" />
            <span>Split</span>
            <kbd className="text-[10px] opacity-60">Ctrl+\</kbd>
          </button>

          <button
            type="button"
            aria-label="Full Editor Layout"
            onClick={() => setLayoutMode('FullEditor')}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] transition-colors ${
              layoutMode === 'FullEditor'
                ? 'bg-slate-shell text-parchment border border-verdigris'
                : 'hover:text-parchment hover:bg-slate-shell'
            }`}
          >
            <Square className="w-3 h-3 text-verdigris" />
            <span>Editor</span>
          </button>

          <button
            type="button"
            aria-label="Full Preview Layout"
            onClick={() => setLayoutMode('FullPreview')}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] transition-colors ${
              layoutMode === 'FullPreview'
                ? 'bg-slate-shell text-parchment border border-verdigris'
                : 'hover:text-parchment hover:bg-slate-shell'
            }`}
          >
            <Eye className="w-3 h-3 text-verdigris" />
            <span>Preview</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Toggle Theme"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] hover:text-parchment hover:bg-slate-shell transition-colors"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3 h-3 text-amber-dirty" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3 h-3 text-kie-violet" />
                <span>Dark</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div
        ref={containerRef}
        className={`flex-1 flex min-h-0 relative ${isDragging ? 'cursor-col-resize select-none' : ''}`}
      >
        {/* Left Pane: Editor */}
        {layoutMode !== 'FullPreview' && (
          <div
            style={{ width: layoutMode === 'Split' ? `${splitRatio * 100}%` : '100%' }}
            className="h-full min-h-0 overflow-hidden flex flex-col"
          >
            {editor}
          </div>
        )}

        {/* Draggable Divider */}
        {layoutMode === 'Split' && (
          <div
            onMouseDown={handleMouseDown}
            className="w-1 bg-slate-border hover:bg-verdigris cursor-col-resize transition-colors duration-150 z-10 flex-shrink-0"
            role="separator"
            aria-orientation="vertical"
          />
        )}

        {/* Right Pane: Preview */}
        {layoutMode !== 'FullEditor' && (
          <div
            style={{ width: layoutMode === 'Split' ? `${(1 - splitRatio) * 100}%` : '100%' }}
            className="h-full min-h-0 overflow-hidden flex flex-col bg-obsidian"
          >
            {preview}
          </div>
        )}
      </div>
    </div>
  );
};

