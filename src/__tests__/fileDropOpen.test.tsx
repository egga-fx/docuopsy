import { render, screen, waitFor, renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  extensionOf,
  openDroppedFiles,
  openDroppedPaths,
  useFileDropOpen,
} from '../hooks/useFileDropOpen';
import { useTabStore } from '../store/tabStore';
import App from '../App';

const FILE_KEY = (path: string) => `docuopsy_file_${path}`;

let warnSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

function seedStore() {
  useTabStore.setState({
    tabs: [
      {
        id: 'seed',
        filePath: null,
        title: 'Untitled-1',
        isDirty: false,
        cursorLine: 1,
        cursorCol: 1,
        scrollTop: 0,
        draftPath: null,
        content: '',
      },
    ],
    activeTabId: 'seed',
    layoutMode: 'Split',
  });
}

function dispatchDrag(kind: 'dragover' | 'dragleave' | 'drop', files: File[] = []) {
  act(() => {
    const event = new Event(kind, { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'dataTransfer', { value: { types: ['Files'], files } });
    window.dispatchEvent(event);
  });
}

beforeEach(() => {
  localStorage.clear();
  seedStore();
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('extensionOf', () => {
  it('reads trailing extensions including dotfiles', () => {
    expect(extensionOf('report.MD')).toBe('md');
    expect(extensionOf('.env')).toBe('env');
    expect(extensionOf('archive.tar.gz')).toBe('gz');
    expect(extensionOf('LICENSE')).toBe('');
  });
});

describe('openDroppedPaths (native Tauri drop payloads)', () => {
  it('opens a dropped document straight into a tab', async () => {
    localStorage.setItem(FILE_KEY('C:/docs/report.md'), '# dropped from disk');

    await openDroppedPaths(['C:/docs/report.md']);

    expect(useTabStore.getState().tabs).toHaveLength(2);
    const opened = useTabStore.getState().tabs[1];
    expect(opened.title).toBe('report.md');
    expect(opened.filePath).toBe('C:/docs/report.md');
    expect(opened.content).toBe('# dropped from disk');
    expect(opened.isDirty).toBe(false);
    expect(useTabStore.getState().activeTabId).toBe(opened.id);
  });

  it('rejects relative paths yet keeps filenames that merely contain dots', async () => {
    localStorage.setItem(FILE_KEY('../secrets/id_rsa'), 'SECRET');
    localStorage.setItem(FILE_KEY('C:/docs/v1..v2.md'), '# range notes');

    await openDroppedPaths(['../secrets/id_rsa', 'relative/notes.md', 'C:/docs/v1..v2.md']);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Rejected unsafe dropped path'),
      expect.anything(),
    );

    const tabs = useTabStore.getState().tabs;
    expect(tabs).toHaveLength(2);
    expect(tabs[1].title).toBe('v1..v2.md');
  });

  it('rejects unsupported file types', async () => {
    await openDroppedPaths(['C:/Windows/notepad.exe']);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unsupported dropped file type: notepad.exe'),
      '',
    );
    expect(useTabStore.getState().tabs).toHaveLength(1);
  });

  it('activates the existing tab instead of re-opening the same file', async () => {
    useTabStore.setState({
      tabs: [
        {
          id: 'seed',
          filePath: 'C:/docs/report.md',
          title: 'report.md',
          isDirty: false,
          cursorLine: 1,
          cursorCol: 1,
          scrollTop: 0,
          draftPath: null,
          content: '# already open',
        },
        {
          id: 'other',
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
      activeTabId: 'other',
    });

    await openDroppedPaths(['C:/docs/report.md']);

    expect(useTabStore.getState().activeTabId).toBe('seed');
    expect(useTabStore.getState().tabs).toHaveLength(2);
  });

  it('opens a dropped PDF without reading it as text and switches to preview', async () => {
    await openDroppedPaths(['C:/docs/manual.pdf']);

    expect(useTabStore.getState().tabs).toHaveLength(2);
    expect(useTabStore.getState().tabs[1].filePath).toBe('C:/docs/manual.pdf');
    expect(useTabStore.getState().layoutMode).toBe('FullPreview');
  });

  it('caps a mass drop at ten files', async () => {
    const paths = Array.from({ length: 14 }, (_, i) => `C:/docs/note${i}.md`);

    await openDroppedPaths(paths);

    expect(useTabStore.getState().tabs).toHaveLength(11);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('file(s) ignored'), '');
  });

  it('logs a failed read and still opens the remaining files', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      if (key === FILE_KEY('C:/docs/broken.md')) throw new Error('disk unreadable');
      return key === FILE_KEY('C:/docs/fine.md') ? '# second' : null;
    });

    await openDroppedPaths(['C:/docs/broken.md', 'C:/docs/fine.md']);

    const titles = useTabStore.getState().tabs.map((tab) => tab.title);
    expect(titles).not.toContain('broken.md');
    expect(titles).toContain('fine.md');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to open dropped file'),
      expect.stringContaining('disk unreadable'),
    );
  });
});

describe('openDroppedFiles (browser dev-server drop payloads)', () => {
  it('opens a dropped text file from the browser', async () => {
    const file = new File(['# browser notes'], 'browser-notes.md', { type: 'text/markdown' });

    await openDroppedFiles([file]);

    expect(useTabStore.getState().tabs).toHaveLength(2);
    const opened = useTabStore.getState().tabs[1];
    expect(opened.title).toBe('browser-notes.md');
    expect(opened.content).toBe('# browser notes');
  });
});

describe('App drop wiring', () => {
  it('shows the drop overlay while hovering and opens the dropped file', async () => {
    localStorage.setItem(FILE_KEY('C:/docs/dropped.md'), '# dropped');
    render(<App />);

    dispatchDrag('dragover');
    expect(screen.getByTestId('drop-overlay')).toBeInTheDocument();

    dispatchDrag('drop', [new File(['# inline'], 'dropped.md')]);
    expect(screen.queryByTestId('drop-overlay')).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('dropped.md')).toBeInTheDocument());
  });

  it('hides the overlay when the drag leaves the window', () => {
    render(<App />);

    dispatchDrag('dragover');
    expect(screen.getByTestId('drop-overlay')).toBeInTheDocument();

    dispatchDrag('dragleave');
    expect(screen.queryByTestId('drop-overlay')).not.toBeInTheDocument();
  });

  it('ignores drags that carry no files', () => {
    render(<App />);

    act(() => {
      const event = new Event('dragover', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'dataTransfer', { value: { types: ['text/plain'] } });
      window.dispatchEvent(event);
    });

    expect(screen.queryByTestId('drop-overlay')).not.toBeInTheDocument();
  });
});

describe('useFileDropOpen subscription lifecycle', () => {
  it('reports the hover state and removes its listeners on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { result, unmount } = renderHook(() => useFileDropOpen());

    dispatchDrag('dragover');
    expect(result.current).toBe(true);

    unmount();
    expect(removeSpy).toHaveBeenCalledWith('drop', expect.any(Function));
  });
});
