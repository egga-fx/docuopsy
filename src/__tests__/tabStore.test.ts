import { describe, it, expect, beforeEach } from 'vitest';
import { useTabStore } from '../store/tabStore';

describe('Tab Store Unit Tests', () => {
  beforeEach(() => {
    useTabStore.setState({
      tabs: [
        {
          id: 'initial',
          filePath: null,
          title: 'Untitled-1',
          isDirty: false,
          cursorLine: 1,
          cursorCol: 1,
          scrollTop: 0,
          draftPath: null,
          content: 'initial text',
        },
      ],
      activeTabId: 'initial',
      layoutMode: 'Split',
      theme: 'dark',
    });
  });

  it('should mark tab as dirty and update buffer upon modification', () => {
    const { updateContent, getActiveTab } = useTabStore.getState();
    updateContent('initial', 'Modified forensic text');

    const tab = getActiveTab();
    expect(tab?.isDirty).toBe(true);
    expect(tab?.content).toBe('Modified forensic text');
  });

  it('should add a new tab and set it active', () => {
    const { addTab } = useTabStore.getState();
    const newId = addTab({ title: 'notes.md', content: '# Notes' });

    expect(useTabStore.getState().activeTabId).toBe(newId);
    expect(useTabStore.getState().tabs.length).toBe(2);
  });

  it('should toggle theme cleanly between dark and light', () => {
    const { setTheme } = useTabStore.getState();
    setTheme('light');
    expect(useTabStore.getState().theme).toBe('light');

    setTheme('dark');
    expect(useTabStore.getState().theme).toBe('dark');
  });

  it('should auto-switch to FullPreview when opening a PDF', () => {
    const { addTab } = useTabStore.getState();
    addTab({ title: 'research.pdf', content: '' });

    expect(useTabStore.getState().layoutMode).toBe('FullPreview');
  });
});

