import { isTauri } from './ipc';

export interface WindowState {
  isFullscreen: boolean;
  isMaximized: boolean;
}

type WindowModule = typeof import('@tauri-apps/api/window');

let modulePromise: Promise<WindowModule> | null = null;

function loadWindowModule(): Promise<WindowModule> | null {
  if (!isTauri()) return null;
  if (!modulePromise) modulePromise = import('@tauri-apps/api/window');
  return modulePromise;
}

export function isWindowControlled(): boolean {
  return isTauri();
}

async function withWindow(action: (win: Awaited<ReturnType<WindowModule['getCurrentWindow']>>) => Promise<void>): Promise<boolean> {
  const module = loadWindowModule();
  if (!module) return false;
  const win = (await module).getCurrentWindow();
  await action(win);
  return true;
}

export async function minimizeWindow(): Promise<boolean> {
  return withWindow(async (win) => win.minimize());
}

export async function closeWindow(): Promise<boolean> {
  return withWindow(async (win) => win.close());
}

export async function toggleFullscreenWindow(): Promise<boolean> {
  const module = loadWindowModule();
  if (!module) return false;
  const win = (await module).getCurrentWindow();
  const next = !(await win.isFullscreen());
  await win.setFullscreen(next);
  return true;
}

export async function readWindowState(): Promise<WindowState> {
  const module = loadWindowModule();
  if (!module) return { isFullscreen: false, isMaximized: false };
  const win = (await module).getCurrentWindow();
  const [isFullscreen, isMaximized] = await Promise.all([win.isFullscreen(), win.isMaximized()]);
  return { isFullscreen, isMaximized };
}

export async function subscribeToWindowState(onChange: (state: WindowState) => void): Promise<() => void> {
  const module = loadWindowModule();
  if (!module) return () => {};
  const win = (await module).getCurrentWindow();
  const unlisten = await win.onResized(async () => {
    onChange(await readWindowState());
  });
  onChange(await readWindowState());
  return unlisten;
}

/**
 * Order-critical half of the close guard, split out so tests can drive it
 * directly: preventDefault must run synchronously because Rust only inspects it
 * after the handler returns, and the window is force-destroyed afterwards so the
 * request is not re-emitted.
 */
export async function handleCloseRequest(
  event: { preventDefault(): void },
  beforeClose: () => Promise<void>,
  forceClose: () => Promise<unknown>,
): Promise<void> {
  event.preventDefault();
  try {
    await beforeClose();
  } finally {
    await forceClose();
  }
}

/**
 * Runs `beforeClose` to completion on every close request — including Alt+F4 and
 * taskbar quit, which never pass through our custom controls.
 */
export async function subscribeToCloseRequest(beforeClose: () => Promise<void>): Promise<() => void> {
  const module = loadWindowModule();
  if (!module) return () => {};
  const win = (await module).getCurrentWindow();
  return win.onCloseRequested((event) => handleCloseRequest(event, beforeClose, () => win.destroy()));
}
