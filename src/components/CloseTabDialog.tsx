import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTabStore } from '../store/tabStore';
import { saveDocument, pickFileToSave } from '../api/ipc';
import { AlertTriangle } from 'lucide-react';

export const CloseTabDialog: React.FC = () => {
  const pendingCloseTabId = useTabStore((s) => s.pendingCloseTabId);
  const tabs = useTabStore((s) => s.tabs);
  const closeTab = useTabStore((s) => s.closeTab);
  const markClean = useTabStore((s) => s.markClean);
  const setPendingCloseTabId = useTabStore((s) => s.setPendingCloseTabId);
  const [error, setError] = useState<string | null>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const tab = tabs.find((t) => t.id === pendingCloseTabId);

  useEffect(() => {
    if (pendingCloseTabId) {
      setError(null);
      // Remember where focus was so it can be restored when the dialog closes.
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      saveButtonRef.current?.focus();
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus?.();
      previousFocusRef.current = null;
    }
  }, [pendingCloseTabId]);

  const cancel = useCallback(() => {
    setPendingCloseTabId(null);
  }, [setPendingCloseTabId]);

  const discard = useCallback(() => {
    if (!tab) return cancel();
    closeTab(tab.id, { discard: true });
  }, [tab, closeTab, cancel]);

  const saveAndClose = useCallback(async () => {
    if (!tab) return;
    try {
      let targetPath = tab.filePath;
      if (!targetPath) {
        targetPath = await pickFileToSave(tab.title);
        if (!targetPath) return; // user cancelled the native dialog
      }
      await saveDocument(targetPath, tab.content);
      markClean(tab.id, targetPath);
      closeTab(tab.id, { discard: true });
    } catch (err) {
      console.error('Failed to save before close:', err);
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [tab, markClean, closeTab]);

  if (!pendingCloseTabId || !tab) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={cancel}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="close-tab-dialog-title"
        data-testid="close-tab-dialog"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
            return;
          }
          // Focus trap: cycle Tab within the dialog so it behaves like a modal.
          if (e.key === 'Tab') {
            const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            );
            if (!focusables || focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }}
        className="w-full max-w-sm mx-4 bg-app-shell border border-app-border rounded-lg shadow-xl p-5 font-mono text-xs text-app-primary max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-app-accent" aria-hidden="true" />
          <h2 id="close-tab-dialog-title" className="text-sm font-medium">
            Unsaved changes in “{tab.title}”
          </h2>
        </div>
        <p className="text-app-muted mb-4 leading-relaxed">
          This tab has edits that are not saved to a file. Save before closing, or discard the
          changes permanently.
        </p>
        {error && (
          <p role="alert" className="mb-3 text-red-500 break-all">
            Save failed: {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={cancel}
            className="px-3 py-1.5 rounded border border-app-border text-app-muted hover:text-app-primary hover:bg-app-surface transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={discard}
            className="px-3 py-1.5 rounded border border-red-500/40 text-red-500 hover:bg-red-500/10 transition-colors"
          >
            Discard
          </button>
          <button
            ref={saveButtonRef}
            type="button"
            onClick={() => void saveAndClose()}
            className="px-3 py-1.5 rounded bg-app-accent text-white hover:brightness-110 transition-all"
          >
            Save &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
