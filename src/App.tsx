import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TabBar } from './components/TabBar';
import { AppMenu } from './components/AppMenu';
import { LayoutManager } from './components/LayoutManager';
import { EditorPane } from './components/EditorPane';
import { PreviewContainer } from './components/PreviewContainer';
import { AIPalette } from './components/AIPalette';
import { useTabStore } from './store/tabStore';
import {
  loadSession,
  loadDraft,
  saveDocument,
  readDocument,
  pickFileToOpen,
  pickFileToSave,
} from './api/ipc';
import { undo, redo } from '@codemirror/commands';
import { Sparkles } from 'lucide-react';
import type { EditorView } from '@codemirror/view';

export default function App(): React.JSX.Element {
  const [isAiPaletteOpen, setIsAiPaletteOpen] = useState(false);
  const editorViewRef = useRef<EditorView | null>(null);

  const activeTab = useTabStore((s) => s.getActiveTab());
  const layoutMode = useTabStore((s) => s.layoutMode);
  const theme = useTabStore((s) => s.theme);
  const restoreSession = useTabStore((s) => s.restoreSession);
  const updateContent = useTabStore((s) => s.updateContent);
  const addTab = useTabStore((s) => s.addTab);
  const closeTab = useTabStore((s) => s.closeTab);
  const markClean = useTabStore((s) => s.markClean);

  // Restore session on application boot
  useEffect(() => {
    async function initSession() {
      try {
        if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
          const session = await loadSession();
          if (session && session.tabs && session.tabs.length > 0) {
            restoreSession(session);

            // Attempt to restore drafts for active tabs
            for (const t of session.tabs) {
              const draft = await loadDraft(t.id);
              if (draft) {
                updateContent(t.id, draft);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Session restoration skipped (non-tauri or dev env):', err);
      }
    }

    initSession();
  }, [restoreSession, updateContent]);

  // Document Save As Handler
  const handleSaveAs = useCallback(async () => {
    if (!activeTab) return;
    try {
      const selectedPath = await pickFileToSave(activeTab.title);
      if (selectedPath) {
        await saveDocument(selectedPath, activeTab.content);
        markClean(activeTab.id, selectedPath);
      }
    } catch (err) {
      console.error('Failed to save document as:', err);
    }
  }, [activeTab, markClean]);

  // Document Save Handler
  const handleSave = useCallback(async () => {
    if (!activeTab) return;
    if (!activeTab.filePath) {
      await handleSaveAs();
      return;
    }
    try {
      await saveDocument(activeTab.filePath, activeTab.content);
      markClean(activeTab.id, activeTab.filePath);
    } catch (err) {
      console.error('Failed to save document:', err);
    }
  }, [activeTab, handleSaveAs, markClean]);

  // Open Document File Picker Handler
  const handleOpenFile = useCallback(async () => {
    try {
      const selectedPath = await pickFileToOpen();
      if (selectedPath) {
        const content = await readDocument(selectedPath);
        const fileName = selectedPath.split(/[\\/]/).pop() || 'Untitled';
        addTab({
          filePath: selectedPath,
          title: fileName,
          content,
          isDirty: false,
        });
      }
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  }, [addTab]);

  // Global keyboard shortcuts (Ctrl+S, Ctrl+Shift+S, Ctrl+O, Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+S: Save As
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveAs();
      }
      // Ctrl+S: Save
      else if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
      // Ctrl+O: Open File
      else if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleOpenFile();
      }
      // Ctrl+K: AI Assistant
      else if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsAiPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleSaveAs, handleOpenFile]);

  return (
    <div
      className={`flex flex-col h-screen w-screen select-none font-sans overflow-hidden ${
        theme === 'light' ? 'bg-vellum-canvas text-forensic-ink' : 'bg-obsidian text-parchment'
      }`}
    >
      {/* Top Document Tab Strip with App Menu Toolbar */}
      <TabBar
        leftAddon={
          <AppMenu
            onNewFile={() => addTab()}
            onOpenFile={handleOpenFile}
            onSave={handleSave}
            onSaveAs={handleSaveAs}
            onCloseTab={() => activeTab && closeTab(activeTab.id)}
            onUndo={() => editorViewRef.current && undo(editorViewRef.current)}
            onRedo={() => editorViewRef.current && redo(editorViewRef.current)}
            onOpenAI={() => setIsAiPaletteOpen(true)}
          />
        }
      />

      {/* Main Workspace Layout */}
      <LayoutManager
        editor={<EditorPane onViewReady={(view) => { editorViewRef.current = view; }} />}
        preview={<PreviewContainer tab={activeTab} />}
      />

      {/* Floating AI Assistant Palette (Ctrl+K) */}
      <AIPalette
        isOpen={isAiPaletteOpen}
        onClose={() => setIsAiPaletteOpen(false)}
        editorView={editorViewRef.current}
      />

      {/* Forensic Telemetry Status Bar */}
      <footer className="h-6 bg-slate-shell border-t border-slate-border px-3.5 flex items-center justify-between font-mono text-[11px] text-slate-muted tabular-nums select-none z-20">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-parchment">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                activeTab?.isDirty ? 'bg-amber-dirty' : 'bg-emerald-verified'
              }`}
            />
            {activeTab?.isDirty ? 'Draft Cached (Unsaved)' : 'Clean'}
          </span>
          <span className="opacity-40">|</span>
          <span>
            Ln {activeTab?.cursorLine ?? 1}, Col {activeTab?.cursorCol ?? 1}
          </span>
          <span className="opacity-40">|</span>
          <span>Mode: {layoutMode}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAiPaletteOpen(true)}
            className="flex items-center gap-1 text-kie-violet hover:text-kie-violet/80 transition-colors"
            title="Open AI Assistant (Ctrl+K)"
          >
            <Sparkles className="w-3 h-3" />
            <span>AI: deepseek-v4-1-flash</span>
            <kbd className="text-[9px] bg-slate-surface px-1 rounded border border-slate-border">Ctrl+K</kbd>
          </button>
          <span className="opacity-40">|</span>
          <span>UTF-8</span>
        </div>
      </footer>
    </div>
  );
}
