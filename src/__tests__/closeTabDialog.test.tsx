import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useTabStore } from '../store/tabStore';
import { CloseTabDialog } from '../components/CloseTabDialog';

const dirtyTab = {
  id: 'dirty-1',
  title: 'notes.md',
  content: 'unsaved work',
  filePath: 'C:/docs/notes.md',
  isDirty: true,
  cursorLine: 1,
  cursorCol: 1,
  scrollTop: 0,
  draftPath: null,
};

const cleanTab = {
  id: 'clean-1',
  title: 'other.md',
  content: 'text',
  filePath: null,
  isDirty: false,
  cursorLine: 1,
  cursorCol: 1,
  scrollTop: 0,
  draftPath: null,
};

describe('CloseTabDialog', () => {
  beforeEach(() => {
    localStorage.clear();
    useTabStore.setState({
      tabs: [dirtyTab, cleanTab],
      activeTabId: 'dirty-1',
      pendingCloseTabId: null,
    });
  });

  it('renders nothing until a dirty close is requested', () => {
    render(<CloseTabDialog />);
    expect(screen.queryByTestId('close-tab-dialog')).not.toBeInTheDocument();
  });

  it('asks for a decision when a dirty tab close is requested', () => {
    render(<CloseTabDialog />);
    act(() => { useTabStore.getState().requestCloseTab('dirty-1'); });
    expect(screen.getByTestId('close-tab-dialog')).toBeInTheDocument();
    expect(useTabStore.getState().tabs.some((t) => t.id === 'dirty-1')).toBe(true);
  });

  it('closes a clean tab immediately without a dialog', () => {
    render(<CloseTabDialog />);
    act(() => { useTabStore.getState().requestCloseTab('clean-1'); });
    expect(screen.queryByTestId('close-tab-dialog')).not.toBeInTheDocument();
    expect(useTabStore.getState().tabs.some((t) => t.id === 'clean-1')).toBe(false);
  });

  it('Cancel keeps the tab and the draft', () => {
    render(<CloseTabDialog />);
    act(() => { useTabStore.getState().requestCloseTab('dirty-1'); });
    fireEvent.click(screen.getByText('Cancel'));
    expect(useTabStore.getState().tabs.some((t) => t.id === 'dirty-1')).toBe(true);
    expect(useTabStore.getState().pendingCloseTabId).toBeNull();
  });

  it('Discard closes the tab and removes the cached draft', () => {
    act(() => { useTabStore.getState().updateContent('dirty-1', 'unsaved work'); });
    render(<CloseTabDialog />);
    act(() => { useTabStore.getState().requestCloseTab('dirty-1'); });
    fireEvent.click(screen.getByText('Discard'));
    expect(useTabStore.getState().tabs.some((t) => t.id === 'dirty-1')).toBe(false);
    expect(localStorage.getItem('docuopsy_draft_dirty-1')).toBeNull();
  });

  it('Save & Close writes the file, then closes the tab', async () => {
    render(<CloseTabDialog />);
    act(() => { useTabStore.getState().requestCloseTab('dirty-1'); });
    await act(async () => {
      fireEvent.click(screen.getByText('Save & Close'));
    });
    await waitFor(() => {
      expect(localStorage.getItem('docuopsy_file_C:/docs/notes.md')).toBe('unsaved work');
    });
    expect(useTabStore.getState().tabs.some((t) => t.id === 'dirty-1')).toBe(false);
  });
});
