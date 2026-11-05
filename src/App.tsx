import React, { useEffect, useRef, useCallback } from 'react';
import { TabBar } from './components/TabBar';
import { AppMenu } from './components/AppMenu';
import { LayoutManager } from './components/LayoutManager';
import { EditorPane } from './components/EditorPane';
import { PreviewContainer } from './components/PreviewContainer';
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
import { MessageSquare, Sparkles } from 'lucide-react';
import type { EditorView } from '@codemirror/view';

export default function App(): React.JSX.Element {
  const editorViewRef = useRef<EditorView | null>(null);

  const activeTab = useTabStore((s) => s.getActiveTab());
  const layoutMode = useTabStore((s) => s.layoutMode);
  const restoreSession = useTabStore((s) => s.restoreSession);
  const updateContent = useTabStore((s) => s.updateContent);
  const addTab = useTabStore((s) => s.addTab);
  const closeTab = useTabStore((s) => s.closeTab);
  const markClean = useTabStore((s) => s.markClean);
  const toggleAiSidebar = useTabStore((s) => s.toggleAiSidebar);
  const setAiSidebarOpen = useTabStore((s) => s.setAiSidebarOpen);

  // Restore session on application boot
  useEffect(() => {
    async function initSession() {
      try {
        if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
          const session = await loadSession();
          if (session && session.tabs && session.tabs.length > 0) {
            restoreSession(session);

            // Attempt to restore drafts or read file content from disk
            for (const t of session.tabs) {
              const draft = await loadDraft(t.id);
              if (draft) {
                updateContent(t.id, draft);
              } else if (t.filePath) {
                try {
                  const fileContent = await readDocument(t.filePath);
                  updateContent(t.id, fileContent);
                  markClean(t.id, t.filePath);
                } catch (err) {
                  console.warn('Failed to hydrate file from disk:', t.filePath, err);
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('Session restoration skipped (non-tauri or dev env):', err);
      }
    }

    initSession();
  }, [restoreSession, updateContent, markClean]);

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
        toggleAiSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleSaveAs, handleOpenFile, toggleAiSidebar]);

  return (
    <div className="flex flex-col h-screen w-screen select-none font-sans overflow-hidden bg-app-canvas text-app-primary">
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
            onOpenAI={() => setAiSidebarOpen(true)}
          />
        }
      />

      {/* Main Workspace Layout */}
      <LayoutManager
        editor={<EditorPane onViewReady={(view) => { editorViewRef.current = view; }} />}
        preview={<PreviewContainer tab={activeTab} />}
        editorView={editorViewRef.current}
      />

      {/* Forensic Telemetry Status Bar */}
      <footer className="h-6 bg-app-shell border-t border-app-border px-3.5 flex items-center justify-between font-mono text-[11px] text-app-muted tabular-nums select-none z-20">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-app-primary">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                activeTab?.isDirty ? 'bg-amber-500' : 'bg-emerald-500'
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
            onClick={toggleAiSidebar}
            className="flex items-center gap-1.5 text-app-accent hover:opacity-85 transition-opacity"
            title="Toggle AI Assistant (Ctrl+K)"
          >
            <div className="relative flex items-center justify-center">
              <MessageSquare className="w-3 h-3" />
              <Sparkles className="w-1.5 h-1.5 text-app-accent absolute -top-0.5 -right-0.5" />
            </div>
            <span>AI Assistant</span>
            <kbd className="text-[9px] bg-app-surface text-app-primary px-1 rounded border border-app-border">Ctrl+K</kbd>
          </button>
          <span className="opacity-40">|</span>
          <span>UTF-8</span>
        </div>
      </footer>
    </div>
  );
}
