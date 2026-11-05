import React, { useState, useEffect, useRef } from 'react';
import { TabBar } from './components/TabBar';
import { LayoutManager } from './components/LayoutManager';
import { EditorPane } from './components/EditorPane';
import { MarkdownPreview } from './components/MarkdownPreview';
import { PdfViewer } from './components/PdfViewer';
import { AIPalette } from './components/AIPalette';
import { useTabStore } from './store/tabStore';
import { loadSession, loadDraft } from './api/ipc';
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

  // Global keyboard shortcuts (Ctrl+K for AI)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsAiPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isPdf = activeTab?.title?.toLowerCase().endsWith('.pdf') ?? false;

  return (
    <div className={`flex flex-col h-screen w-screen select-none font-sans overflow-hidden ${
      theme === 'light' ? 'bg-vellum-canvas text-forensic-ink' : 'bg-obsidian text-parchment'
    }`}>
      {/* Top Document Tab Strip */}
      <TabBar />

      {/* Main Workspace Layout */}
      <LayoutManager
        editor={<EditorPane onViewReady={(view) => { editorViewRef.current = view; }} />}
        preview={
          isPdf ? (
            <PdfViewer filePath={activeTab?.filePath} />
          ) : (
            <MarkdownPreview markdown={activeTab?.content} />
          )
        }
      />

      {/* Floating KIE AI Assistant Palette (Ctrl+K) */}
      <AIPalette
        isOpen={isAiPaletteOpen}
        onClose={() => setIsAiPaletteOpen(false)}
        editorView={editorViewRef.current}
      />

      {/* Forensic Telemetry Status Bar */}
      <footer className="h-6 bg-slate-shell border-t border-slate-border px-3.5 flex items-center justify-between font-mono text-[11px] text-slate-muted tabular-nums select-none z-20">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-parchment">
            <span className={`w-1.5 h-1.5 rounded-full ${activeTab?.isDirty ? 'bg-amber-dirty' : 'bg-emerald-verified'}`} />
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
            title="Open KIE AI Assistant (Ctrl+K)"
          >
            <Sparkles className="w-3 h-3" />
            <span>KIE AI: claude-haiku-5-5</span>
            <kbd className="text-[9px] bg-slate-surface px-1 rounded border border-slate-border">Ctrl+K</kbd>
          </button>
          <span className="opacity-40">|</span>
          <span>UTF-8</span>
        </div>
      </footer>
    </div>
  );
}
