import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { TabBar } from '../components/TabBar';
import { useTabStore } from '../store/tabStore';

function seedTabs() {
  useTabStore.setState({
    tabs: [
      {
        id: 'tab-1',
        filePath: 'C:/docs/test.md',
        title: 'test.md',
        isDirty: true,
        cursorLine: 1,
        cursorCol: 1,
        scrollTop: 0,
        draftPath: null,
        content: '# Test',
      },
      {
        id: 'tab-2',
        filePath: null,
        title: 'Untitled-2',
        isDirty: false,
        cursorLine: 1,
        cursorCol: 1,
        scrollTop: 0,
        draftPath: null,
        content: '',
      },
    ],
    activeTabId: 'tab-1',
    layoutMode: 'Split',
  });
}

describe('Tab fast rename', () => {
  beforeEach(() => seedTabs());

  it('renames a tab through the store and keeps the dirty flag', () => {
    useTabStore.getState().renameTab('tab-2', '  meeting notes.md  ');

    const tab = useTabStore.getState().tabs.find((t) => t.id === 'tab-2');
    expect(tab?.title).toBe('meeting notes.md');
    expect(tab?.isDirty).toBe(false);
  });

  it('keeps the previous title when the new one is blank', () => {
    useTabStore.getState().renameTab('tab-1', '   ');
    expect(useTabStore.getState().tabs[0].title).toBe('test.md');
  });

  it('keeps a renamed title when saving back to the same file', () => {
    useTabStore.getState().renameTab('tab-1', 'renamed.md');
    useTabStore.getState().markClean('tab-1', 'C:/docs/test.md');

    const tab = useTabStore.getState().tabs[0];
    expect(tab.title).toBe('renamed.md');
    expect(tab.filePath).toBe('C:/docs/test.md');
    expect(tab.isDirty).toBe(false);
  });

  it('follows the filename when the document is saved to a new path', () => {
    useTabStore.getState().renameTab('tab-2', 'scratch.md');
    useTabStore.getState().markClean('tab-2', 'C:/docs/final.md');

    const tab = useTabStore.getState().tabs[1];
    expect(tab.title).toBe('final.md');
    expect(tab.filePath).toBe('C:/docs/final.md');
  });

  it('turns the title into an input on double-click and commits on Enter', () => {
    render(<TabBar />);

    fireEvent.doubleClick(screen.getAllByRole('tab')[0]);
    const input = screen.getByTestId<HTMLInputElement>('tab-rename-input');
    expect(input.value).toBe('test.md');

    fireEvent.change(input, { target: { value: 'renamed.md' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(useTabStore.getState().tabs[0].title).toBe('renamed.md');
    expect(screen.queryByTestId('tab-rename-input')).not.toBeInTheDocument();
  });

  it('cancels the rename on Escape without touching the store', () => {
    render(<TabBar />);

    fireEvent.doubleClick(screen.getAllByRole('tab')[0]);
    const input = screen.getByTestId<HTMLInputElement>('tab-rename-input');
    fireEvent.change(input, { target: { value: 'discarded.md' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByTestId('tab-rename-input')).not.toBeInTheDocument();
    expect(useTabStore.getState().tabs[0].title).toBe('test.md');
  });

  it('commits the rename when the input loses focus', () => {
    render(<TabBar />);

    fireEvent.doubleClick(screen.getAllByRole('tab')[1]);
    const input = screen.getByTestId<HTMLInputElement>('tab-rename-input');
    fireEvent.change(input, { target: { value: 'blur-saved.txt' } });
    fireEvent.blur(input);

    expect(useTabStore.getState().tabs[1].title).toBe('blur-saved.txt');
  });

  it('does not start a rename when the close button is double-clicked', () => {
    render(<TabBar />);

    fireEvent.doubleClick(screen.getByLabelText('Close test.md'));
    expect(screen.queryByTestId('tab-rename-input')).not.toBeInTheDocument();
  });

  it('suppresses tab keyboard shortcuts while a rename is in progress', () => {
    render(<TabBar />);

    fireEvent.doubleClick(screen.getAllByRole('tab')[0]);

    // Mod+W would close the tab if the global handler were still active.
    fireEvent.keyDown(window, { key: 'w', ctrlKey: true });
    expect(useTabStore.getState().tabs.length).toBe(2);
  });
});
