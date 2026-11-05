import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { useTabStore } from '../store/tabStore';
import {
  baseEditorExtensions,
  darkForensicsTheme,
  lightVellumTheme,
  getLanguageExtension,
} from '../editor/extensions';

interface EditorPaneProps {
  onViewReady?: (view: EditorView) => void;
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

  // Initialize or re-create editor when tab or theme changes
  useEffect(() => {
    if (!containerRef.current) return;

    if (editorViewRef.current) {
      editorViewRef.current.destroy();
      editorViewRef.current = null;
    }

    const currentThemeExt = theme === 'light' ? lightVellumTheme : darkForensicsTheme;
    const langExt = getLanguageExtension(activeTab?.title || '');
    const initialContent = activeTab?.content || '';
    internalDocRef.current = initialContent;

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

    const startState = EditorState.create({
      doc: initialContent,
      extensions: [
        baseEditorExtensions,
        currentThemeExt,
        langExt,
        updateListener,
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    editorViewRef.current = view;
    if (onViewReady) onViewReady(view);

    return () => {
      view.destroy();
      editorViewRef.current = null;
    };
  }, [activeTab?.id, theme]); // rebuild when active tab or theme changes

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
