import { useEffect, useState } from 'react';
import { subscribeToDrop } from '../api/dnd';
import { allowPaths, readDocument } from '../api/ipc';
import { logEvent } from '../api/logger';
import { useTabStore } from '../store/tabStore';

const SUPPORTED_EXTENSIONS = [
  'md', 'markdown', 'txt', 'log', 'pdf', 'json', 'rs', 'ts', 'tsx', 'js', 'jsx',
  'html', 'css', 'toml', 'yaml', 'yml', 'env', 'csv',
];

const MAX_DROPPED_FILES = 10;

export function extensionOf(fileName: string): string {
  const match = /\.([^.]+)$/.exec(fileName);
  return match ? match[1].toLowerCase() : '';
}

function isAbsolutePath(path: string): boolean {
  return path.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(path) || path.startsWith('\\\\');
}

async function openSinglePath(path: string): Promise<void> {
  const fileName = path.split(/[\\/]/).pop() || path;
  const extension = extensionOf(fileName);

  if (!isAbsolutePath(path)) {
    logEvent('warn', 'Rejected unsafe dropped path', { path });
    return;
  }
  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    logEvent('warn', `Unsupported dropped file type: ${fileName}`);
    return;
  }

  // A drop is explicit user authorization; register it with the Rust gate.
  await allowPaths([path]);

  const { tabs, addTab, setActiveTab } = useTabStore.getState();
  const alreadyOpen = tabs.find((tab) => tab.filePath === path);
  if (alreadyOpen) {
    setActiveTab(alreadyOpen.id);
    return;
  }

  // PDFs are streamed by PDF.js from the file URL; reading them as UTF-8 text would fail.
  if (extension === 'pdf') {
    addTab({ filePath: path, title: fileName, content: '' });
    return;
  }

  const content = await readDocument(path);
  addTab({ filePath: path, title: fileName, content });
}

function readFileAsText(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read dropped file'));
    reader.readAsText(file);
  });
}

async function openSingleBrowserFile(file: File): Promise<void> {
  const extension = extensionOf(file.name);
  const { addTab } = useTabStore.getState();

  if (extension === 'pdf') {
    const objectUrl = typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : null;
    addTab({ filePath: objectUrl, title: file.name, content: '' });
    return;
  }
  addTab({ title: file.name, content: await readFileAsText(file) });
}

async function runBatch<T>(
  items: T[],
  open: (item: T) => Promise<void>,
  label: string,
): Promise<void> {
  const accepted = items.slice(0, MAX_DROPPED_FILES);
  if (items.length > accepted.length) {
    logEvent('warn', `Dropped file limit reached; ${items.length - accepted.length} file(s) ignored`);
  }

  for (const item of accepted) {
    try {
      await open(item);
    } catch (err) {
      logEvent('error', label, String(err));
    }
  }
}

/** Opens native absolute paths handed over by the Tauri webview drop event. */
export function openDroppedPaths(paths: string[]): Promise<void> {
  return runBatch(paths, openSinglePath, 'Failed to open dropped file');
}

/** Opens File objects handed over by the browser dev-server drop event. */
export function openDroppedFiles(files: File[]): Promise<void> {
  return runBatch(files, openSingleBrowserFile, 'Failed to open dropped browser file');
}

/** Tracks whether a file drag is currently hovering the window, and opens what is dropped. */
export function useFileDropOpen(): boolean {
  const [isDropActive, setIsDropActive] = useState(false);

  useEffect(
    () =>
      subscribeToDrop({
        onEnter: () => setIsDropActive(true),
        onLeave: () => setIsDropActive(false),
        onDrop: ({ paths, files }) => {
          setIsDropActive(false);
          void openDroppedPaths(paths);
          void openDroppedFiles(files);
        },
      }),
    [],
  );

  return isDropActive;
}
