import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTabStore } from '../store/tabStore';
import {
  Columns,
  Square,
  Eye,
  Sun,
  Moon,
  Palette,
  Check,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import type { EditorView } from '@codemirror/view';
import { AIPalette } from './AIPalette';

const ACCENT_PRESETS = [
  { label: 'Electric Indigo', color: '#7170ff' },
  { label: 'Verdigris', color: '#0E9F8A' },
  { label: 'Violet', color: '#7C5CFC' },
  { label: 'Amber', color: '#D97706' },
  { label: 'Cyan', color: '#06B6D4' },
  { label: 'Monochrome', color: '#e5e5e6' },
];

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
    accentColor,
    setAccentColor,
    isAiSidebarOpen,
    toggleAiSidebar,
    setAiSidebarOpen,
    aiSidebarWidth,
    setAiSidebarWidth,
  } = useTabStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isAccentPickerOpen, setIsAccentPickerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const accentPickerRef = useRef<HTMLDivElement>(null);

  // Close accent picker on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (accentPickerRef.current && !accentPickerRef.current.contains(e.target as Node)) {
        setIsAccentPickerOpen(false);
      }
    }
    if (isAccentPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAccentPickerOpen]);

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
          {/* Accent Color Customizer Popover */}
          <div ref={accentPickerRef} className="relative">
            <button
              type="button"
              aria-label="Customize Accent Color"
              onClick={() => setIsAccentPickerOpen((p) => !p)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] hover:text-app-primary hover:bg-app-surface/60 transition-colors border border-app-border"
              title="Customize Accent Color"
            >
              <Palette className="w-3 h-3 text-app-muted" />
              <span
                className="w-2.5 h-2.5 rounded-full inline-block border border-app-border shadow-[0_0_4px_currentColor]"
                style={{ backgroundColor: accentColor }}
              />
            </button>

            {isAccentPickerOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-app-surface border border-app-border rounded-lg shadow-2xl p-3 z-50 font-sans text-xs">
                <span className="text-[10px] font-semibold text-app-muted uppercase tracking-wider block mb-2.5 font-mono">
                  Accent Color
                </span>
                <div className="grid grid-cols-6 gap-1.5 mb-2.5">
                  {ACCENT_PRESETS.map((preset) => (
                    <button
                      key={preset.color}
                      type="button"
                      title={preset.label}
                      onClick={() => {
                        setAccentColor(preset.color);
                        setIsAccentPickerOpen(false);
                      }}
                      className="w-5 h-5 rounded-full border border-app-border hover:scale-110 transition-transform relative flex items-center justify-center"
                      style={{ backgroundColor: preset.color }}
                    >
                      {accentColor.toLowerCase() === preset.color.toLowerCase() && (
                        <Check className="w-2.5 h-2.5 text-white drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-app-border text-[11px]">
                  <span className="text-app-muted text-[11px]">Custom:</span>
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-5 h-5 rounded border-0 cursor-pointer bg-transparent"
                    title="Custom Hex Color"
                  />
                  <span className="font-mono text-[10px] text-app-muted ml-auto uppercase">
                    {accentColor}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Theme Mode Toggle (Light / Dark) */}
          <button
            type="button"
            aria-label="Toggle Theme"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] hover:text-app-primary hover:bg-app-surface transition-colors"
            title="Toggle Light/Dark Theme (Ctrl+Shift+L)"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3 h-3 text-amber-500" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3 h-3 text-app-accent" />
                <span>Dark</span>
              </>
            )}
          </button>

          {/* AI Assistant Icon Button (Message + Sparkles) */}
          <button
            type="button"
            aria-label="AI Assistant"
            onClick={toggleAiSidebar}
            className={`p-1 rounded transition-colors relative flex items-center justify-center ${
              isAiSidebarOpen
                ? 'bg-app-surface text-app-accent border border-app-accent shadow-sm'
                : 'text-app-muted hover:text-app-primary hover:bg-app-surface border border-transparent'
            }`}
            title="AI Assistant (Ctrl+K)"
          >
            <div className="relative flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5" />
              <Sparkles className="w-2 h-2 text-app-accent absolute -top-1 -right-1" />
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

          {/* Draggable Divider */}
          {layoutMode === 'Split' && (
            <div
              onMouseDown={handleMouseDown}
              className="w-1 bg-app-border hover:bg-app-accent cursor-col-resize transition-colors duration-150 z-10 flex-shrink-0"
              role="separator"
              aria-orientation="vertical"
              title="Drag to resize split ratio"
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
