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

  it('should manage accent color and AI sidebar state with clamping', () => {
    const { setAccentColor, toggleAiSidebar, setAiSidebarWidth } = useTabStore.getState();

    setAccentColor('#7C5CFC');
    expect(useTabStore.getState().accentColor).toBe('#7C5CFC');

    toggleAiSidebar();
    expect(useTabStore.getState().isAiSidebarOpen).toBe(true);

    toggleAiSidebar();
    expect(useTabStore.getState().isAiSidebarOpen).toBe(false);

    // Clamping test: min 300, max 560
    setAiSidebarWidth(200);
    expect(useTabStore.getState().aiSidebarWidth).toBe(300);

    setAiSidebarWidth(800);
    expect(useTabStore.getState().aiSidebarWidth).toBe(560);

    setAiSidebarWidth(420);
    expect(useTabStore.getState().aiSidebarWidth).toBe(420);
  });

  it('keeps the tab dirty when the buffer changes during an in-flight save (audit #08)', () => {
    const s = () => useTabStore.getState();
    s().updateContent('initial', 'v1');
    const revision = s().beginSave('initial');
    expect(s().getActiveTab()?.saveStatus).toBe('saving');

    // User keeps typing while the save is still writing the older snapshot.
    s().updateContent('initial', 'v2 typed during save');

    s().markClean('initial', 'C:/docs/notes.md', revision);

    const tab = s().getActiveTab();
    expect(tab?.isDirty).toBe(true);
    expect(tab?.saveStatus).toBe('idle');
    expect(tab?.content).toBe('v2 typed during save');
  });

  it('marks the tab clean and "saved" when the revision is unchanged', () => {
    const s = () => useTabStore.getState();
    s().updateContent('initial', 'v1');
    const revision = s().beginSave('initial');

    s().markClean('initial', 'C:/docs/notes.md', revision);

    const tab = s().getActiveTab();
    expect(tab?.isDirty).toBe(false);
    expect(tab?.saveStatus).toBe('saved');
    expect(tab?.filePath).toBe('C:/docs/notes.md');
  });

  it('reports saving then error without clearing dirty (audit #08)', () => {
    const s = () => useTabStore.getState();
    s().updateContent('initial', 'v1');
    s().beginSave('initial');
    expect(s().getActiveTab()?.saveStatus).toBe('saving');

    s().setSaveError('initial', 'disk full');

    const tab = s().getActiveTab();
    expect(tab?.saveStatus).toBe('error');
    expect(tab?.saveError).toBe('disk full');
    expect(tab?.isDirty).toBe(true);
  });
});

