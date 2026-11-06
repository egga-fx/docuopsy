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

  // Global cross-platform keyboard shortcuts (Ctrl/Cmd+S, Ctrl/Cmd+Shift+S, Ctrl/Cmd+O, Ctrl/Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;

      // Mod+Shift+S: Save As
      if (isMod && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveAs();
      }
      // Mod+S: Save
      else if (isMod && !e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
      // Mod+O: Open File
      else if (isMod && !e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleOpenFile();
      }
      // Mod+K: AI Assistant
      else if (isMod && e.key.toLowerCase() === 'k') {
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
      <footer className="h-7 bg-app-shell border-t border-app-border px-3.5 flex items-center justify-between font-mono text-[11px] text-app-muted tabular-nums select-none z-20">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-app-primary">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                activeTab?.isDirty ? 'bg-primary shadow-[0_0_6px_#7170ff]' : 'bg-emerald-500'
              }`}
            />
            {activeTab?.isDirty ? 'Draft Cached (Unsaved)' : 'Clean'}
          </span>
          <span className="opacity-30">|</span>
          <span>
            Ln {activeTab?.cursorLine ?? 1}, Col {activeTab?.cursorCol ?? 1}
          </span>
          <span className="opacity-30">|</span>
          <span>Mode: {layoutMode}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleAiSidebar}
            className="flex items-center gap-1.5 text-app-accent hover:brightness-125 transition-all"
            title="Toggle AI Assistant (Ctrl+K)"
          >
            <div className="relative flex items-center justify-center">
              <MessageSquare className="w-3 h-3 text-app-accent" />
              <Sparkles className="w-1.5 h-1.5 text-app-accent absolute -top-0.5 -right-0.5" />
            </div>
            <span className="font-medium text-app-primary">AI Assistant</span>
            <kbd className="text-[9px] bg-app-surface text-app-primary px-1.5 py-0.5 rounded border border-app-border">Ctrl+K</kbd>
          </button>
          <span className="opacity-30">|</span>
          <span>UTF-8</span>
        </div>
      </footer>
    </div>
  );
}
