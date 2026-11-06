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

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const mod = isMac ? '⌘' : 'Ctrl';

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
    <div className="relative flex items-stretch z-40" ref={menuRef}>
      {/* Hamburger Menu Button */}
      <button
        type="button"
        aria-label="Application Menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`h-full px-3 flex items-center justify-center transition-colors border-r border-app-border cursor-pointer ${
          isOpen
            ? 'bg-app-surface text-app-primary'
            : 'text-app-muted hover:text-app-primary hover:bg-app-surface/60'
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
          className="absolute left-0 top-full mt-1 w-72 bg-app-surface border border-app-border rounded-lg shadow-2xl py-2 z-50 font-sans text-xs select-none"
        >
          {/* Menu Category Switcher Bar */}
          <div className="flex border-b border-app-border px-2 pb-1.5 mb-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveMenu('file')}
              className={`flex-1 py-1 px-2 rounded text-center font-medium transition-colors ${
                activeMenu === 'file'
                  ? 'bg-app-surface-hover text-app-primary font-semibold'
                  : 'text-app-muted hover:text-app-primary'
              }`}
            >
              File
            </button>
            <button
              type="button"
              onClick={() => setActiveMenu('edit')}
              className={`flex-1 py-1 px-2 rounded text-center font-medium transition-colors ${
                activeMenu === 'edit'
                  ? 'bg-app-surface-hover text-app-primary font-semibold'
                  : 'text-app-muted hover:text-app-primary'
              }`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setActiveMenu('view')}
              className={`flex-1 py-1 px-2 rounded text-center font-medium transition-colors ${
                activeMenu === 'view'
                  ? 'bg-app-surface-hover text-app-primary font-semibold'
                  : 'text-app-muted hover:text-app-primary'
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
                className="flex items-center justify-between px-3 py-1.5 hover:bg-app-surface text-app-primary transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FilePlus className="w-3.5 h-3.5 text-app-muted" />
                  New File
                </span>
                <span className="font-mono text-[10px] text-app-muted">{mod}+N</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onOpenFile)}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-app-surface text-app-primary transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FolderOpen className="w-3.5 h-3.5 text-app-muted" />
                  Open File...
                </span>
                <span className="font-mono text-[10px] text-app-muted">{mod}+O</span>
              </button>

              <div className="h-px bg-app-border my-1" />

              <button
                type="button"
                onClick={() => handleAction(onSave)}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-app-surface text-app-primary transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Save className="w-3.5 h-3.5 text-app-muted" />
                  Save
                </span>
                <span className="font-mono text-[10px] text-app-muted">{mod}+S</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onSaveAs)}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-app-surface text-app-primary transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-app-muted" />
                  Save As...
                </span>
                <span className="font-mono text-[10px] text-app-muted">{mod}+Shift+S</span>
              </button>

              <div className="h-px bg-app-border my-1" />

              <button
                type="button"
                onClick={() => handleAction(onCloseTab)}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-app-surface text-rose-500 hover:text-rose-400 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <X className="w-3.5 h-3.5" />
                  Close Tab
                </span>
                <span className="font-mono text-[10px] text-app-muted">{mod}+W</span>
              </button>
            </div>
          )}

          {/* EDIT MENU */}
          {activeMenu === 'edit' && (
            <div className="flex flex-col py-0.5">
              <button
                type="button"
                onClick={() => handleAction(() => onUndo?.())}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-app-surface text-app-primary transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Undo2 className="w-3.5 h-3.5 text-app-muted" />
                  Undo
                </span>
                <span className="font-mono text-[10px] text-app-muted">{mod}+Z</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => onRedo?.())}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-app-surface text-app-primary transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Redo2 className="w-3.5 h-3.5 text-app-muted" />
                  Redo
                </span>
                <span className="font-mono text-[10px] text-app-muted">{mod}+Y</span>
              </button>

              <div className="h-px bg-app-border my-1" />

              <button
                type="button"
                onClick={() => handleAction(() => document.execCommand('cut'))}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-app-surface text-app-primary transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Scissors className="w-3.5 h-3.5 text-app-muted" />
                  Cut
                </span>
                <span className="font-mono text-[10px] text-app-muted">{mod}+X</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => document.execCommand('copy'))}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-app-surface text-app-primary transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Copy className="w-3.5 h-3.5 text-app-muted" />
                  Copy
                </span>
                <span className="font-mono text-[10px] text-app-muted">{mod}+C</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => document.execCommand('paste'))}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-app-surface text-app-primary transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Clipboard className="w-3.5 h-3.5 text-app-muted" />
                  Paste
                </span>
                <span className="font-mono text-[10px] text-app-muted">{mod}+V</span>
              </button>
            </div>
          )}

          {/* VIEW MENU */}
          {activeMenu === 'view' && (
            <div className="flex flex-col py-0.5">
              <button
                type="button"
                onClick={() => handleAction(() => setLayoutMode('Split'))}
                className={`flex items-center justify-between px-3 py-1.5 hover:bg-app-surface transition-colors ${
                  layoutMode === 'Split' ? 'text-app-accent font-medium' : 'text-app-primary'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Columns2 className="w-3.5 h-3.5 text-app-muted" />
                  Split Mode
                </span>
                <span className="font-mono text-[10px] text-app-muted">{mod}+\</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => setLayoutMode('FullEditor'))}
                className={`flex items-center justify-between px-3 py-1.5 hover:bg-app-surface transition-colors ${
                  layoutMode === 'FullEditor' ? 'text-app-accent font-medium' : 'text-app-primary'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Maximize2 className="w-3.5 h-3.5 text-app-muted" />
                  Editor Only
                </span>
                <span className="font-mono text-[10px] text-app-muted">{mod}+Shift+E</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => setLayoutMode('FullPreview'))}
                className={`flex items-center justify-between px-3 py-1.5 hover:bg-app-surface transition-colors ${
                  layoutMode === 'FullPreview' ? 'text-app-accent font-medium' : 'text-app-primary'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-app-muted" />
                  Preview Only
                </span>
                <span className="font-mono text-[10px] text-app-muted">{mod}+Shift+P</span>
              </button>

              <div className="h-px bg-app-border my-1" />

              <button
                type="button"
                onClick={() => handleAction(toggleTheme)}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-app-surface text-app-primary transition-colors"
              >
                <span className="flex items-center gap-2">
                  <SunMoon className="w-3.5 h-3.5 text-app-muted" />
                  Toggle Theme ({theme === 'dark' ? 'Light Vellum' : 'Dark Forensics'})
                </span>
                <span className="font-mono text-[10px] text-app-muted">{mod}+Shift+L</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onOpenAI)}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-app-surface text-app-accent hover:opacity-90 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Assistant
                </span>
                <span className="font-mono text-[10px] text-app-muted">{mod}+K</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
