import React, { useEffect, useRef, useCallback } from 'react';
import { TabBar } from './components/TabBar';
import { AppMenu } from './components/AppMenu';
import { WindowControls } from './components/WindowControls';
import { CloseTabDialog } from './components/CloseTabDialog';
import { LayoutManager } from './components/LayoutManager';
import { EditorPane } from './components/EditorPane';
import { PreviewContainer } from './components/PreviewContainer';
import { useFileDropOpen } from './hooks/useFileDropOpen';
import { toggleFullscreenWindow } from './api/window';
import { useTabStore } from './store/tabStore';
import {
  loadSession,
  loadDraft,
  saveDocument,
  readDocument,
  pickFileToOpen,
  pickFileToSave,
  allowPaths,
} from './api/ipc';
import { undo, redo } from '@codemirror/commands';
import { MessageSquare, Sparkles } from 'lucide-react';
import type { EditorView } from '@codemirror/view';

export default function App(): React.JSX.Element {
  const editorViewRef = useRef<EditorView | null>(null);
  const isDropActive = useFileDropOpen();

  const activeTab = useTabStore((s) => s.getActiveTab());
  const layoutMode = useTabStore((s) => s.layoutMode);
  const actionError = useTabStore((s) => s.actionError);
  const restoreSession = useTabStore((s) => s.restoreSession);
  const updateContent = useTabStore((s) => s.updateContent);
  const addTab = useTabStore((s) => s.addTab);
  const requestCloseTab = useTabStore((s) => s.requestCloseTab);
  const beginSave = useTabStore((s) => s.beginSave);
  const markClean = useTabStore((s) => s.markClean);
  const setSaveError = useTabStore((s) => s.setSaveError);
  const setActionError = useTabStore((s) => s.setActionError);
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

            // The containment allowlist lives in memory only, so paths authorized
            // in a previous run must be re-registered before we hydrate from disk.
            const restoredPaths = session.tabs
              .map((t) => t.filePath)
              .filter((p): p is string => Boolean(p));
            if (restoredPaths.length > 0) {
              await allowPaths(restoredPaths);
            }

            // Attempt to restore drafts or read file content from disk
            for (const t of session.tabs) {
              const draft = await loadDraft(t.id);
              if (draft) {
                updateContent(t.id, draft);
              } else if (t.filePath && !/\.pdf$/i.test(t.filePath)) {
                // PDFs are streamed as bytes by the viewer; reading them as text would fail.
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
    const tab = activeTab;

    let selectedPath: string | null = null;
    try {
      selectedPath = await pickFileToSave(tab.title);
    } catch (err) {
      setActionError(`Save As dialog failed: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
    if (!selectedPath) return; // user cancelled the native dialog

    const revision = beginSave(tab.id);
    try {
      await saveDocument(selectedPath, tab.content);
      markClean(tab.id, selectedPath, revision);
      setActionError(null);
    } catch (err) {
      setSaveError(tab.id, err instanceof Error ? err.message : String(err));
    }
  }, [activeTab, beginSave, markClean, setSaveError, setActionError]);

  // Document Save Handler
  const handleSave = useCallback(async () => {
    if (!activeTab) return;
    if (!activeTab.filePath) {
      await handleSaveAs();
      return;
    }
    const filePath = activeTab.filePath;
    const tabId = activeTab.id;
    const content = activeTab.content;
    const revision = beginSave(tabId);
    try {
      await saveDocument(filePath, content);
      markClean(tabId, filePath, revision);
      setActionError(null);
    } catch (err) {
      setSaveError(tabId, err instanceof Error ? err.message : String(err));
    }
  }, [activeTab, handleSaveAs, beginSave, markClean, setSaveError, setActionError]);

  // Open Document File Picker Handler
  const handleOpenFile = useCallback(async () => {
    try {
      const selectedPath = await pickFileToOpen();
      if (!selectedPath) return;
      const fileName = selectedPath.split(/[\\/]/).pop() || 'Untitled';
      // PDFs are rendered from raw bytes by the viewer; skip the UTF-8 text read.
      const content = /\.pdf$/i.test(selectedPath) ? '' : await readDocument(selectedPath);
      addTab({
        filePath: selectedPath,
        title: fileName,
        content,
        isDirty: false,
      });
      setActionError(null);
    } catch (err) {
      setActionError(`Failed to open file: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [addTab, setActionError]);

  // Global cross-platform keyboard shortcuts (Ctrl/Cmd+S, Ctrl/Cmd+Shift+S, Ctrl/Cmd+O, Ctrl/Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;

      // F11: Toggle native fullscreen
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreenWindow().catch(() => {});
      }
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

  // Honest persistence status derived from per-tab save/draft acknowledgement.
  const saveStatus = activeTab?.saveStatus ?? 'idle';
  const isDirty = Boolean(activeTab?.isDirty);
  let statusLabel: string;
  let statusDot: string;
  if (saveStatus === 'error') {
    statusLabel = 'Save failed';
    statusDot = 'bg-rose-500';
  } else if (saveStatus === 'saving') {
    statusLabel = 'Saving…';
    statusDot = 'bg-amber-400 animate-pulse';
  } else if (!isDirty) {
    statusLabel = saveStatus === 'saved' ? 'Saved' : 'Clean';
    statusDot = 'bg-emerald-500';
  } else if (activeTab?.draftSaved) {
    statusLabel = 'Draft cached';
    statusDot = 'bg-primary shadow-[0_0_6px_#7170ff]';
  } else {
    statusLabel = 'Unsaved…';
    statusDot = 'bg-primary shadow-[0_0_6px_#7170ff]';
  }

  return (
    <div className="relative flex flex-col h-screen w-screen select-none font-sans overflow-hidden bg-app-canvas text-app-primary">
      {/* Top Document Tab Strip with App Menu Toolbar */}
      <TabBar
        rightAddon={<WindowControls />}
        leftAddon={
          <AppMenu
            onNewFile={() => addTab()}
            onOpenFile={handleOpenFile}
            onSave={handleSave}
            onSaveAs={handleSaveAs}
            onCloseTab={() => activeTab && requestCloseTab(activeTab.id)}
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

      {/* Dirty-tab close confirmation (Save / Discard / Cancel) */}
      <CloseTabDialog />

      {/* Drag-and-Drop Target Feedback */}
      {isDropActive && (
        <div
          data-testid="drop-overlay"
          className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-app-canvas/70 border-2 border-dashed border-app-accent"
        >
          <div className="px-4 py-2 rounded-md bg-app-shell border border-app-border font-mono text-xs text-app-primary">
            Drop files to open them
          </div>
        </div>
      )}

      {/* Forensic Telemetry Status Bar */}
      <footer className="h-7 bg-app-shell border-t border-app-border px-3.5 flex items-center justify-between font-mono text-[11px] text-app-muted tabular-nums select-none z-20">
        <div className="flex items-center gap-3">
          <span
            className="flex items-center gap-1.5 text-app-primary"
            data-testid="save-status"
            data-status={saveStatus}
            title={saveStatus === 'error' ? activeTab?.saveError ?? undefined : undefined}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
            {statusLabel}
          </span>
          {saveStatus === 'error' && (
            <button
              type="button"
              onClick={handleSave}
              data-testid="save-retry"
              className="px-1.5 py-0.5 rounded border border-rose-500/50 text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              Retry
            </button>
          )}
          {actionError && (
            <span className="flex items-center gap-1.5 text-rose-400" role="alert">
              <span className="max-w-[28ch] truncate" title={actionError}>
                {actionError}
              </span>
              <button
                type="button"
                onClick={() => setActionError(null)}
                aria-label="Dismiss error"
                className="opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </span>
          )}
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
