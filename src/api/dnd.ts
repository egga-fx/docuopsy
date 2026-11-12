import { isTauri } from './ipc';
import { logEvent } from './logger';

export interface DropPayload {
  paths: string[];
  files: File[];
}

export interface DropHandlers {
  onEnter: () => void;
  onLeave: () => void;
  onDrop: (payload: DropPayload) => void;
}

/**
 * Subscribes to OS-level file drops. Tauri delivers native absolute paths;
 * the browser dev server falls back to HTML5 DataTransfer files (name only).
 */
export function subscribeToDrop(handlers: DropHandlers): () => void {
  if (isTauri()) return subscribeToNativeDrop(handlers);
  return subscribeToBrowserDrop(handlers);
}

function subscribeToNativeDrop(handlers: DropHandlers): () => void {
  let disposed = false;
  let unlisten: (() => void) | null = null;

  import('@tauri-apps/api/webview')
    .then(({ getCurrentWebview }) => getCurrentWebview().onDragDropEvent((event) => {
      const payload = event.payload;
      if (payload.type === 'enter' || payload.type === 'over') {
        handlers.onEnter();
      } else if (payload.type === 'leave') {
        handlers.onLeave();
      } else if (payload.type === 'drop') {
        handlers.onLeave();
        handlers.onDrop({ paths: payload.paths, files: [] });
      }
    }))
    .then((fn) => {
      if (disposed) fn();
      else unlisten = fn;
    })
    .catch((err) => {
      logEvent('error', 'Failed to subscribe to native file drops', err instanceof Error ? err.message : String(err));
    });

  return () => {
    disposed = true;
    unlisten?.();
  };
}

function subscribeToBrowserDrop(handlers: DropHandlers): () => void {
  let depth = 0;

  const hasFiles = (event: DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes('Files');

  const onDragOver = (event: DragEvent) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    handlers.onEnter();
  };

  const onDragEnter = (event: DragEvent) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    depth += 1;
    handlers.onEnter();
  };

  const onDragLeave = (event: DragEvent) => {
    if (!hasFiles(event)) return;
    depth = Math.max(0, depth - 1);
    if (depth === 0) handlers.onLeave();
  };

  const onDrop = (event: DragEvent) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    depth = 0;
    handlers.onLeave();
    handlers.onDrop({ paths: [], files: Array.from(event.dataTransfer?.files ?? []) });
  };

  window.addEventListener('dragover', onDragOver);
  window.addEventListener('dragenter', onDragEnter);
  window.addEventListener('dragleave', onDragLeave);
  window.addEventListener('drop', onDrop);

  return () => {
    window.removeEventListener('dragover', onDragOver);
    window.removeEventListener('dragenter', onDragEnter);
    window.removeEventListener('dragleave', onDragLeave);
    window.removeEventListener('drop', onDrop);
  };
}
