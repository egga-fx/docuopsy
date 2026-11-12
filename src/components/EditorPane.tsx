import React, { useEffect, useRef } from 'react';
import { Compartment, EditorState, Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { useTabStore } from '../store/tabStore';
import type { AppTheme, TabState } from '../types';
import {
  baseEditorExtensions,
  darkForensicsTheme,
  lightVellumTheme,
  getLanguageExtension,
  resolveLanguageExtension,
} from '../editor/extensions';

interface EditorPaneProps {
  onViewReady?: (view: EditorView) => void;
}

// Per-tab EditorState cache living above the component lifetime: undo history
// survives tab switches and even unmounts (LayoutManager drops the editor pane
// in FullPreview mode), fixing audit finding P1 #06.
const editorStatesByTab = new Map<string, { state: EditorState; grammar: string }>();

function pruneStaleStates(liveIds: Set<string>) {
  for (const id of editorStatesByTab.keys()) {
    if (!liveIds.has(id)) editorStatesByTab.delete(id);
  }
}

export const EditorPane: React.FC<EditorPaneProps> = ({ onViewReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const activeTab = useTabStore((s) => s.getActiveTab());
  const theme = useTabStore((s) => s.theme);
  const updateContent = useTabStore((s) => s.updateContent);
  const setCursor = useTabStore((s) => s.setCursor);

  // Keep references to activeTabId and latest internal doc to prevent stale closures
  const activeTabIdRef = useRef(activeTab?.id);
  activeTabIdRef.current = activeTab?.id;

  const internalDocRef = useRef(activeTab?.content || '');

  const themeCompartmentRef = useRef(new Compartment());
  const langCompartmentRef = useRef(new Compartment());
  // A renamed tab title is a display label, not the file on disk, so the grammar
  // follows filePath whenever the tab is backed by one.
  const grammarName = activeTab?.filePath || activeTab?.title || '';
  // Lazy grammars are fetched once per filename; re-applying an identical extension
  // would make CodeMirror throw away and re-parse the whole tree.
  const langCacheRef = useRef(new Map<string, Extension>());
  const appliedNameRef = useRef('');
  const prevTabIdRef = useRef<string | undefined>(undefined);

  const buildState = (tab: TabState, themeMode: AppTheme): EditorState => {
    const name = tab.filePath || tab.title || '';
    const cachedLang = langCacheRef.current.get(name);
    appliedNameRef.current = cachedLang ? name : '';
    const langExt = cachedLang ?? getLanguageExtension(name);
    const themeExt = themeMode === 'light' ? lightVellumTheme : darkForensicsTheme;
    const content = tab.content || '';
    internalDocRef.current = content;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newDoc = update.state.doc.toString();
        internalDocRef.current = newDoc;
        const currentId = activeTabIdRef.current;
        if (currentId) {
          // Always notify the store of doc changes, even when empty string ""
          updateContent(currentId, newDoc);
        }
      }

      if (update.selectionSet || update.docChanged) {
        const head = update.state.selection.main.head;
        const line = update.state.doc.lineAt(head);
        const col = head - line.from + 1;
        const currentId = activeTabIdRef.current;
        if (currentId) {
          setCursor(currentId, line.number, col);
        }
      }
    });

    let state = EditorState.create({
      doc: content,
      extensions: [
        baseEditorExtensions,
        themeCompartmentRef.current.of(themeExt),
        langCompartmentRef.current.of(langExt),
        updateListener,
        EditorView.lineWrapping,
      ],
    });

    // Restore the reading position for a state built fresh (not from the cache).
    if (tab.cursorLine > 1 || tab.cursorCol > 1) {
      const line = state.doc.line(Math.min(Math.max(1, tab.cursorLine), state.doc.lines));
      const pos = Math.min(line.from + Math.max(1, tab.cursorCol) - 1, line.to);
      state = state.update({ selection: { anchor: pos } }).state;
    }

    return state;
  };

  const stashCurrentState = () => {
    const view = editorViewRef.current;
    const prevId = prevTabIdRef.current;
    if (view && prevId) {
      editorStatesByTab.set(prevId, { state: view.state, grammar: appliedNameRef.current });
    }
  };

  // Create the view once; tab and theme changes reconfigure or swap state
  // instead of destroying the view, so undo history is never thrown away.
  useEffect(() => {
    if (!containerRef.current) return;
    const { getActiveTab, theme: themeMode, tabs } = useTabStore.getState();
    const tab = getActiveTab();
    if (!tab) return;

    pruneStaleStates(new Set(tabs.map((t) => t.id)));
    const stashed = editorStatesByTab.get(tab.id);
    let startState: EditorState;
    if (stashed) {
      appliedNameRef.current = stashed.grammar;
      startState = stashed.state;
      internalDocRef.current = startState.doc.toString();
    } else {
      startState = buildState(tab, themeMode);
    }

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    editorViewRef.current = view;
    prevTabIdRef.current = tab.id;
    if (onViewReady) onViewReady(view);

    return () => {
      stashCurrentState();
      view.destroy();
      editorViewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap editor state when the active tab changes, preserving each tab's history.
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view || !activeTab || prevTabIdRef.current === activeTab.id) return;

    stashCurrentState();
    const stashed = editorStatesByTab.get(activeTab.id);
    if (stashed) {
      appliedNameRef.current = stashed.grammar;
      view.setState(stashed.state);
    } else {
      view.setState(buildState(activeTab, useTabStore.getState().theme));
    }
    prevTabIdRef.current = activeTab.id;
    internalDocRef.current = view.state.doc.toString();
    pruneStaleStates(new Set(useTabStore.getState().tabs.map((t) => t.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab?.id]);

  // Theme switches reconfigure in place through the compartment; the view (and
  // its undo history) stays alive.
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;
    const themeExt = theme === 'light' ? lightVellumTheme : darkForensicsTheme;
    view.dispatch({ effects: themeCompartmentRef.current.reconfigure(themeExt) });
  }, [theme]);

  // Lazy grammars (Python, YAML, SQL, ...) load asynchronously, so the eager
  // extension above is swapped in through the compartment once it resolves.
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view || appliedNameRef.current === grammarName) return;

    let cancelled = false;
    const apply = (ext: Extension) => {
      if (cancelled || editorViewRef.current !== view || appliedNameRef.current === grammarName) return;
      appliedNameRef.current = grammarName;
      view.dispatch({ effects: langCompartmentRef.current.reconfigure(ext) });
    };

    const cached = langCacheRef.current.get(grammarName);
    if (cached) {
      apply(cached);
      return;
    }
    resolveLanguageExtension(grammarName).then((ext) => {
      if (cancelled || editorViewRef.current !== view) return;
      langCacheRef.current.set(grammarName, ext);
      apply(ext);
    });

    return () => {
      cancelled = true;
    };
  }, [activeTab?.id, grammarName]);

  // Synchronize external changes into CodeMirror buffer (e.g. file open, AI generation)
  useEffect(() => {
    if (editorViewRef.current && activeTab) {
      const currentDoc = editorViewRef.current.state.doc.toString();
      // If store content changed from outside and does not match CodeMirror's doc
      if (activeTab.content !== currentDoc && activeTab.content !== internalDocRef.current) {
        internalDocRef.current = activeTab.content;
        editorViewRef.current.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: activeTab.content },
        });
      }
    }
  }, [activeTab?.content]);

  return (
    <div className="h-full w-full flex flex-col min-h-0 bg-app-canvas">
      <div ref={containerRef} className="flex-1 min-h-0 overflow-auto" />
    </div>
  );
};
