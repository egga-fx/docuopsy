import React, { useEffect, useState } from 'react';
import { Maximize, Minimize, Minus, X } from 'lucide-react';
import {
  closeWindow,
  minimizeWindow,
  readWindowState,
  subscribeToCloseRequest,
  subscribeToWindowState,
  toggleFullscreenWindow,
} from '../api/window';
import { flushPersistence } from '../store/tabStore';
import { logEvent } from '../api/logger';
import type { WindowState } from '../api/window';

const BUTTON_BASE =
  'h-full w-[34px] flex items-center justify-center text-app-muted transition-colors duration-100 outline-none focus-visible:ring-1 focus-visible:ring-app-accent';

interface WindowControlsProps {
  state?: WindowState;
}

/**
 * Custom chrome for the undecorated Docuopsy window: minimize, fullscreen
 * toggle and close. Kept icon-only so the tab strip stays the primary row.
 */
export const WindowControls: React.FC<WindowControlsProps> = ({ state: controlledState }) => {
  const [internalState, setInternalState] = useState<WindowState>({
    isFullscreen: false,
    isMaximized: false,
  });
  const windowState = controlledState ?? internalState;

  useEffect(() => {
    let isActive = true;
    const cleanups: Array<() => void> = [];
    const capture = (fn: () => void) => {
      if (isActive) cleanups.push(fn);
      else fn();
    };

    if (!controlledState) {
      subscribeToWindowState((next) => {
        if (isActive) setInternalState(next);
      })
        .then(capture)
        .catch((err) => {
          logEvent('error', 'Failed to observe window state', err instanceof Error ? err.message : String(err));
        });
    }

    // Alt+F4 and taskbar quit never reach the close button, so the last-edit flush
    // has to be armed on the window itself.
    subscribeToCloseRequest(flushPersistence)
      .then(capture)
      .catch((err) => {
        logEvent('error', 'Failed to guard window close', err instanceof Error ? err.message : String(err));
      });

    return () => {
      isActive = false;
      for (const fn of cleanups) fn();
    };
  }, [controlledState]);

  const runWindowAction = async (label: string, action: () => Promise<unknown>) => {
    try {
      await action();
    } catch (err) {
      // A rejected IPC here usually means the capability file is missing a window permission.
      logEvent('error', label, err instanceof Error ? err.message : String(err));
    }
  };

  const handleMinimize = () => runWindowAction('Failed to minimize window', minimizeWindow);

  const handleFullscreen = () =>
    runWindowAction('Failed to toggle fullscreen', async () => {
      await toggleFullscreenWindow();
      setInternalState(await readWindowState());
    });

  const handleClose = () =>
    runWindowAction('Failed to close window', async () => {
      // Awaited here too: the guard above is registered asynchronously, so the
      // first click could arrive before its listener exists.
      await flushPersistence();
      await closeWindow();
    });

  return (
    <div className="flex items-stretch h-full" role="group" aria-label="Window controls">
      <button
        type="button"
        title="Minimize"
        aria-label="Minimize window"
        onClick={handleMinimize}
        className={`${BUTTON_BASE} hover:bg-app-surface hover:text-app-primary`}
      >
        <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        title={windowState.isFullscreen ? 'Exit fullscreen (F11)' : 'Fullscreen (F11)'}
        aria-label={windowState.isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        aria-pressed={windowState.isFullscreen}
        onClick={handleFullscreen}
        className={`${BUTTON_BASE} hover:bg-app-surface hover:text-app-primary`}
      >
        {windowState.isFullscreen ? (
          <Minimize className="w-3.5 h-3.5" strokeWidth={1.5} />
        ) : (
          <Maximize className="w-3.5 h-3.5" strokeWidth={1.5} />
        )}
      </button>
      <button
        type="button"
        title="Close"
        aria-label="Close window"
        onClick={handleClose}
        className={`${BUTTON_BASE} hover:bg-[#c42b1c] hover:text-white`}
      >
        <X className="w-3.5 h-3.5" strokeWidth={1.5} />
      </button>
    </div>
  );
};
