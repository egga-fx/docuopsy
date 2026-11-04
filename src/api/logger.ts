import { invoke } from '@tauri-apps/api/core';

export async function logEvent(level: string, message: string, context?: Record<string, unknown> | string): Promise<void> {
  const contextStr = typeof context === 'object' ? JSON.stringify(context) : context;
  try {
    // Check if in Tauri environment
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      await invoke('log_event', { level, message, context: contextStr });
    } else {
      // In web/test dev environment, log to console
      if (level === 'error') {
        console.error(`[Docuopsy Logger] ${message}`, contextStr || '');
      } else if (level === 'warn') {
        console.warn(`[Docuopsy Logger] ${message}`, contextStr || '');
      } else {
        console.log(`[Docuopsy Logger] ${message}`, contextStr || '');
      }
    }
  } catch (err) {
    console.error('Failed to forward log to Rust backend:', err);
  }
}

