import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  FileText,
  FolderOpen,
  Save,
  FilePlus,
  X,
  Undo2,
  Redo2,
  Scissors,
  Copy,
  Clipboard,
  Columns2,
  Maximize2,
  Eye,
  SunMoon,
  Sparkles,
} from 'lucide-react';
import { useTabStore } from '../store/tabStore';

interface AppMenuProps {
  onNewFile: () => void;
  onOpenFile: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onCloseTab: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onOpenAI: () => void;
}

export const AppMenu: React.FC<AppMenuProps> = ({
  onNewFile,
  onOpenFile,
  onSave,
  onSaveAs,
  onCloseTab,
  onUndo,
  onRedo,
  onOpenAI,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'file' | 'edit' | 'view'>('file');
  const menuRef = useRef<HTMLDivElement>(null);

  const theme = useTabStore((s) => s.theme);
  const setTheme = useTabStore((s) => s.setTheme);
  const layoutMode = useTabStore((s) => s.layoutMode);
  const setLayoutMode = useTabStore((s) => s.setLayoutMode);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Hamburger Menu Button */}
      <button
        type="button"
        aria-label="Application Menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`h-9 px-2.5 flex items-center justify-center transition-colors border-r border-slate-border ${
          isOpen
            ? 'bg-slate-surface text-parchment'
            : 'text-slate-muted hover:text-parchment hover:bg-slate-surface/60'
        }`}
        title="App Menu (File, Edit, View)"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-label="Main Menu"
          className="absolute left-0 top-full mt-1 w-72 bg-slate-shell border border-slate-border rounded-lg shadow-2xl py-1.5 z-50 font-sans text-xs select-none backdrop-blur-md animate-in fade-in duration-100"
        >
          {/* Menu Category Switcher Bar */}
          <div className="flex border-b border-slate-border px-2 pb-1.5 mb-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveMenu('file')}
              className={`flex-1 py-1 px-2 rounded text-center font-medium transition-colors ${
                activeMenu === 'file'
                  ? 'bg-slate-surface text-parchment font-semibold'
                  : 'text-slate-muted hover:text-parchment'
              }`}
            >
              File
            </button>
            <button
              type="button"
              onClick={() => setActiveMenu('edit')}
              className={`flex-1 py-1 px-2 rounded text-center font-medium transition-colors ${
                activeMenu === 'edit'
                  ? 'bg-slate-surface text-parchment font-semibold'
                  : 'text-slate-muted hover:text-parchment'
              }`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setActiveMenu('view')}
              className={`flex-1 py-1 px-2 rounded text-center font-medium transition-colors ${
                activeMenu === 'view'
                  ? 'bg-slate-surface text-parchment font-semibold'
                  : 'text-slate-muted hover:text-parchment'
              }`}
            >
              View
            </button>
          </div>

          {/* FILE MENU */}
          {activeMenu === 'file' && (
            <div className="flex flex-col py-0.5">
              <button
                type="button"
                onClick={() => handleAction(onNewFile)}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-slate-surface text-parchment transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FilePlus className="w-3.5 h-3.5 text-slate-muted" />
                  New File
                </span>
                <span className="font-mono text-[10px] text-slate-muted">Ctrl+N</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onOpenFile)}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-slate-surface text-parchment transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FolderOpen className="w-3.5 h-3.5 text-slate-muted" />
                  Open File...
                </span>
                <span className="font-mono text-[10px] text-slate-muted">Ctrl+O</span>
              </button>

              <div className="h-px bg-slate-border my-1" />

              <button
                type="button"
                onClick={() => handleAction(onSave)}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-slate-surface text-parchment transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Save className="w-3.5 h-3.5 text-slate-muted" />
                  Save
                </span>
                <span className="font-mono text-[10px] text-slate-muted">Ctrl+S</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onSaveAs)}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-slate-surface text-parchment transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-muted" />
                  Save As...
                </span>
                <span className="font-mono text-[10px] text-slate-muted">Ctrl+Shift+S</span>
              </button>

              <div className="h-px bg-slate-border my-1" />

              <button
                type="button"
                onClick={() => handleAction(onCloseTab)}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-slate-surface text-rose-400 hover:text-rose-300 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <X className="w-3.5 h-3.5" />
                  Close Tab
                </span>
                <span className="font-mono text-[10px] text-slate-muted">Ctrl+W</span>
              </button>
            </div>
          )}

          {/* EDIT MENU */}
          {activeMenu === 'edit' && (
            <div className="flex flex-col py-0.5">
              <button
                type="button"
                onClick={() => handleAction(() => onUndo?.())}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-slate-surface text-parchment transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Undo2 className="w-3.5 h-3.5 text-slate-muted" />
                  Undo
                </span>
                <span className="font-mono text-[10px] text-slate-muted">Ctrl+Z</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => onRedo?.())}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-slate-surface text-parchment transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Redo2 className="w-3.5 h-3.5 text-slate-muted" />
                  Redo
                </span>
                <span className="font-mono text-[10px] text-slate-muted">Ctrl+Y</span>
              </button>

              <div className="h-px bg-slate-border my-1" />

              <button
                type="button"
                onClick={() => handleAction(() => document.execCommand('cut'))}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-slate-surface text-parchment transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Scissors className="w-3.5 h-3.5 text-slate-muted" />
                  Cut
                </span>
                <span className="font-mono text-[10px] text-slate-muted">Ctrl+X</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => document.execCommand('copy'))}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-slate-surface text-parchment transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Copy className="w-3.5 h-3.5 text-slate-muted" />
                  Copy
                </span>
                <span className="font-mono text-[10px] text-slate-muted">Ctrl+C</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => document.execCommand('paste'))}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-slate-surface text-parchment transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Clipboard className="w-3.5 h-3.5 text-slate-muted" />
                  Paste
                </span>
                <span className="font-mono text-[10px] text-slate-muted">Ctrl+V</span>
              </button>
            </div>
          )}

          {/* VIEW MENU */}
          {activeMenu === 'view' && (
            <div className="flex flex-col py-0.5">
              <button
                type="button"
                onClick={() => handleAction(() => setLayoutMode('Split'))}
                className={`flex items-center justify-between px-3 py-1.5 hover:bg-slate-surface transition-colors ${
                  layoutMode === 'Split' ? 'text-teal-accent font-medium' : 'text-parchment'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Columns2 className="w-3.5 h-3.5 text-slate-muted" />
                  Split Mode
                </span>
                <span className="font-mono text-[10px] text-slate-muted">Ctrl+\</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => setLayoutMode('FullEditor'))}
                className={`flex items-center justify-between px-3 py-1.5 hover:bg-slate-surface transition-colors ${
                  layoutMode === 'FullEditor' ? 'text-teal-accent font-medium' : 'text-parchment'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Maximize2 className="w-3.5 h-3.5 text-slate-muted" />
                  Editor Only
                </span>
                <span className="font-mono text-[10px] text-slate-muted">Ctrl+Shift+E</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => setLayoutMode('FullPreview'))}
                className={`flex items-center justify-between px-3 py-1.5 hover:bg-slate-surface transition-colors ${
                  layoutMode === 'FullPreview' ? 'text-teal-accent font-medium' : 'text-parchment'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-slate-muted" />
                  Preview Only
                </span>
                <span className="font-mono text-[10px] text-slate-muted">Ctrl+Shift+P</span>
              </button>

              <div className="h-px bg-slate-border my-1" />

              <button
                type="button"
                onClick={() => handleAction(toggleTheme)}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-slate-surface text-parchment transition-colors"
              >
                <span className="flex items-center gap-2">
                  <SunMoon className="w-3.5 h-3.5 text-slate-muted" />
                  Toggle Theme ({theme === 'dark' ? 'Light Vellum' : 'Dark Forensics'})
                </span>
                <span className="font-mono text-[10px] text-slate-muted">Ctrl+Shift+L</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onOpenAI)}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-slate-surface text-kie-violet hover:text-kie-violet/90 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Assistant
                </span>
                <span className="font-mono text-[10px] text-slate-muted">Ctrl+K</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

