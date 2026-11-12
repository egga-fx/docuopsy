import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTabStore } from '../store/tabStore';
import {
  Columns,
  Square,
  Eye,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import type { EditorView } from '@codemirror/view';
import { AIPalette } from './AIPalette';

interface LayoutManagerProps {
  editor: React.ReactNode;
  preview: React.ReactNode;
  editorView?: EditorView | null;
}

export const LayoutManager: React.FC<LayoutManagerProps> = ({ editor, preview, editorView }) => {
  const {
    layoutMode,
    setLayoutMode,
    splitRatio,
    setSplitRatio,
    theme,
    setTheme,
    isAiSidebarOpen,
    toggleAiSidebar,
    setAiSidebarOpen,
    aiSidebarWidth,
    setAiSidebarWidth,
  } = useTabStore();

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

  // Keyboard layout shortcuts (Cross-platform Ctrl/Cmd)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;

      // Mod+\: Toggle Split
      if (isMod && e.key === '\\') {
        e.preventDefault();
        setLayoutMode(layoutMode === 'Split' ? 'FullEditor' : 'Split');
      }
      // Mod+Shift+E: Full Editor
      else if (isMod && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setLayoutMode('FullEditor');
      }
      // Mod+Shift+P: Full Preview
      else if (isMod && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setLayoutMode('FullPreview');
      }
      // Mod+Shift+L: Toggle Theme
      else if (isMod && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setTheme(theme === 'dark' ? 'light' : 'dark');
      }
      // Mod+K: Toggle AI Assistant Sidebar
      else if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleAiSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [layoutMode, theme, setLayoutMode, setTheme, toggleAiSidebar]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-app-canvas text-app-primary">
      {/* Sub-toolbar for layout & theme mode controls */}
      <div className="h-8 bg-app-shell border-b border-app-border px-3.5 flex items-center justify-between font-mono text-xs text-app-muted select-none flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Split Layout"
            onClick={() => setLayoutMode('Split')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] transition-all ${
              layoutMode === 'Split'
                ? 'bg-app-surface text-app-primary border border-app-accent font-medium shadow-sm'
                : 'hover:text-app-primary hover:bg-app-surface/50 border border-transparent'
            }`}
          >
            <Columns className="w-3 h-3 text-app-accent" />
            <span>Split</span>
            <kbd className="text-[10px] opacity-50">Ctrl+\</kbd>
          </button>

          <button
            type="button"
            aria-label="Full Editor Layout"
            onClick={() => setLayoutMode('FullEditor')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] transition-all ${
              layoutMode === 'FullEditor'
                ? 'bg-app-surface text-app-primary border border-app-accent font-medium shadow-sm'
                : 'hover:text-app-primary hover:bg-app-surface/50 border border-transparent'
            }`}
          >
            <Square className="w-3 h-3 text-app-accent" />
            <span>Editor</span>
          </button>

          <button
            type="button"
            aria-label="Full Preview Layout"
            onClick={() => setLayoutMode('FullPreview')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] transition-all ${
              layoutMode === 'FullPreview'
                ? 'bg-app-surface text-app-primary border border-app-accent font-medium shadow-sm'
                : 'hover:text-app-primary hover:bg-app-surface/50 border border-transparent'
            }`}
          >
            <Eye className="w-3 h-3 text-app-accent" />
            <span>Preview</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Assistant Icon Button (Message + Sparkles) */}
          <button
            type="button"
            aria-label="AI Assistant"
            onClick={toggleAiSidebar}
            className={`p-1 rounded transition-colors relative flex items-center justify-center ${
              isAiSidebarOpen
                ? 'text-app-accent'
                : 'text-app-muted hover:text-app-primary hover:bg-app-surface'
            }`}
            title="AI Assistant (Ctrl+K)"
          >
            <div className="relative flex items-center justify-center">
              <MessageSquare className={`w-3.5 h-3.5 ${isAiSidebarOpen ? 'fill-app-accent' : ''}`} />
              <Sparkles className={`w-2 h-2 absolute -top-1 -right-1 ${isAiSidebarOpen ? 'text-app-accent fill-app-accent' : 'text-app-accent'}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Main Workspace Body with Optional Right Sidebar */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Workspace Panes (Editor & Preview) */}
        <div
          ref={containerRef}
          className={`flex-1 flex min-h-0 min-w-0 overflow-hidden relative ${
            isDragging ? 'cursor-col-resize select-none' : ''
          }`}
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

          {/* Draggable Divider (pointer + keyboard resizable, audit #11) */}
          {layoutMode === 'Split' && (
            <div
              onMouseDown={handleMouseDown}
              onKeyDown={(e) => {
                const step = e.shiftKey ? 0.1 : 0.02;
                if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  setSplitRatio(Math.max(0.15, splitRatio - step));
                } else if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  setSplitRatio(Math.min(0.85, splitRatio + step));
                } else if (e.key === 'Home') {
                  e.preventDefault();
                  setSplitRatio(0.15);
                } else if (e.key === 'End') {
                  e.preventDefault();
                  setSplitRatio(0.85);
                }
              }}
              tabIndex={0}
              className="w-1 bg-app-border hover:bg-app-accent focus-visible:bg-app-accent cursor-col-resize transition-colors duration-150 z-10 flex-shrink-0"
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize editor and preview panes"
              aria-valuemin={15}
              aria-valuemax={85}
              aria-valuenow={Math.round(splitRatio * 100)}
              title="Drag or use arrow keys to resize split ratio"
            />
          )}

          {/* Right Pane: Preview */}
          {layoutMode !== 'FullEditor' && (
            <div
              style={{ width: layoutMode === 'Split' ? `${(1 - splitRatio) * 100}%` : '100%' }}
              className="h-full min-h-0 overflow-hidden flex flex-col bg-app-canvas"
            >
              {preview}
            </div>
          )}
        </div>

        {/* Right Sidebar: AI Assistant */}
        {isAiSidebarOpen && (
          <AIPalette
            isOpen={isAiSidebarOpen}
            onClose={() => setAiSidebarOpen(false)}
            editorView={editorView}
            width={aiSidebarWidth}
            onWidthChange={setAiSidebarWidth}
          />
        )}
      </div>
    </div>
  );
};
