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

  // Initialize or re-create editor when tab changes
  useEffect(() => {
    if (!containerRef.current) return;

    if (editorViewRef.current) {
      editorViewRef.current.destroy();
      editorViewRef.current = null;
    }

    const currentThemeExt = theme === 'light' ? lightVellumTheme : darkForensicsTheme;
    const langExt = getLanguageExtension(activeTab?.title || '');

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newDoc = update.state.doc.toString();
        if (activeTab && newDoc !== activeTab.content) {
          updateContent(activeTab.id, newDoc);
        }
      }

      if (update.selectionSet || update.docChanged) {
        const head = update.state.selection.main.head;
        const line = update.state.doc.lineAt(head);
        const col = head - line.from + 1;
        if (activeTab) {
          setCursor(activeTab.id, line.number, col);
        }
      }
    });

    const startState = EditorState.create({
      doc: activeTab?.content || '',
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

  return (
    <div className="h-full w-full flex flex-col min-h-0 bg-obsidian">
      <div ref={containerRef} className="flex-1 min-h-0 overflow-auto" />
    </div>
  );
};

