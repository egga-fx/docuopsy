// Audit-only reproductions. These assert required behavior and intentionally
// fail until the findings are fixed. Excluded from the normal test suite.
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import type { EditorView } from '@codemirror/view';
import { undo } from '@codemirror/commands';
vi.mock('../../src/api/ipc', () => ({
  saveDraft: vi.fn().mockResolvedValue('draft'),
  saveSession: vi.fn().mockResolvedValue(undefined),
  removeDraft: vi.fn().mockResolvedValue(undefined),
}));
import { saveDraft, removeDraft } from '../../src/api/ipc';
import { useTabStore } from '../../src/store/tabStore';
import { EditorPane } from '../../src/components/EditorPane';

const makeTab = (id: string) => ({id, title: `${id}.md`, content: 'original', filePath: null,
  isDirty: false, cursorLine: 1, cursorCol: 1, scrollTop: 0, draftPath: null});
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  useTabStore.setState({tabs: [makeTab('a'), makeTab('b')], activeTabId: 'a', theme: 'dark'});
});
afterEach(() => { cleanup(); vi.clearAllTimers(); vi.useRealTimers(); });

it('persists both tabs edited within the debounce window', async () => {
  useTabStore.getState().updateContent('a', 'draft A');
  await vi.advanceTimersByTimeAsync(100);
  useTabStore.getState().updateContent('b', 'draft B');
  await vi.advanceTimersByTimeAsync(500);
  expect(saveDraft).toHaveBeenCalledWith('a', 'draft A');
  expect(saveDraft).toHaveBeenCalledWith('b', 'draft B');
});

it('keeps store content synchronized when undo returns to the mounted text', () => {
  let view!: EditorView;
  render(<EditorPane onViewReady={(v) => { view = v; }} />);
  act(() => { view.dispatch({changes: {from: 8, insert: ' changed'}}); });
  act(() => { undo(view); });
  expect(view.state.doc.toString()).toBe('original');
  expect(useTabStore.getState().getActiveTab()?.content).toBe('original');
});

it('preserves editor undo history across a theme change', () => {
  let view!: EditorView;
  render(<EditorPane onViewReady={(v) => { view = v; }} />);
  act(() => { view.dispatch({changes: {from: 8, insert: ' changed'}}); });
  act(() => { useTabStore.getState().setTheme('light'); });
  let undone = false;
  act(() => { undone = undo(view); });
  expect(undone).toBe(true);
  expect(view.state.doc.toString()).toBe('original');
});

it('does not erase a dirty draft when the tab is closed without a discard decision', () => {
  useTabStore.getState().updateContent('a', 'unsaved work');
  useTabStore.getState().closeTab('a');
  expect(removeDraft).not.toHaveBeenCalledWith('a');
});
