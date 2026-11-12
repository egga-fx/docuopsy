// Audit-only reproductions. These assert required behavior and intentionally
// fail until the findings are fixed. Excluded from the normal test suite.
//
// Instrumentation note (2026-11-11): vi.mock no longer intercepts src/api/ipc
// in this environment (imported bindings arrive as the real functions), so the
// draft probes assert on the real browser-fallback persistence path
// (localStorage — the same code path saveDraft/removeDraft take outside
// Tauri) instead of module spies. This exercises more of the real stack.
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import type { EditorView } from '@codemirror/view';
import { undo } from '@codemirror/commands';
import { useTabStore } from '../../src/store/tabStore';
import { EditorPane } from '../../src/components/EditorPane';

const draftKey = (id: string) => `docuopsy_draft_${id}`;

const makeTab = (id: string) => ({id, title: `${id}.md`, content: 'original', filePath: null,
  isDirty: false, cursorLine: 1, cursorCol: 1, scrollTop: 0, draftPath: null});
beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  useTabStore.setState({tabs: [makeTab('a'), makeTab('b')], activeTabId: 'a', theme: 'dark',
    pendingCloseTabId: null});
});
afterEach(() => { cleanup(); vi.clearAllTimers(); vi.useRealTimers(); });

it('persists both tabs edited within the debounce window', async () => {
  useTabStore.getState().updateContent('a', 'draft A');
  await vi.advanceTimersByTimeAsync(100);
  useTabStore.getState().updateContent('b', 'draft B');
  await vi.advanceTimersByTimeAsync(500);
  expect(localStorage.getItem(draftKey('a'))).toBe('draft A');
  expect(localStorage.getItem(draftKey('b'))).toBe('draft B');
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

it('preserves editor undo history across a tab switch and back', () => {
  let view!: EditorView;
  render(<EditorPane onViewReady={(v) => { view = v; }} />);
  act(() => { view.dispatch({changes: {from: 8, insert: ' changed'}}); });
  act(() => { useTabStore.getState().setActiveTab('b'); });
  act(() => { useTabStore.getState().setActiveTab('a'); });
  expect(view.state.doc.toString()).toBe('original changed');
  let undone = false;
  act(() => { undone = undo(view); });
  expect(undone).toBe(true);
  expect(view.state.doc.toString()).toBe('original');
});

it('does not erase a dirty draft when the tab is closed without a discard decision', () => {
  useTabStore.getState().updateContent('a', 'unsaved work');
  useTabStore.getState().closeTab('a');
  expect(localStorage.getItem(draftKey('a'))).toBe('unsaved work');
  expect(useTabStore.getState().tabs.some((t) => t.id === 'a')).toBe(false);
});

it('asks for a Save/Discard decision before closing a dirty tab', () => {
  useTabStore.getState().updateContent('a', 'unsaved work');
  useTabStore.getState().requestCloseTab('a');
  expect(useTabStore.getState().pendingCloseTabId).toBe('a');
  expect(useTabStore.getState().tabs.some((t) => t.id === 'a')).toBe(true);
});

it('removes the draft only when the close explicitly discards', () => {
  useTabStore.getState().updateContent('b', 'throwaway');
  useTabStore.getState().closeTab('b', { discard: true });
  expect(localStorage.getItem(draftKey('b'))).toBeNull();
});
