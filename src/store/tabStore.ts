import { create } from 'zustand';
import type { AppSession, AppTheme, LayoutMode, TabState } from '../types';
import { saveDraft, saveSession, removeDraft } from '../api/ipc';

interface TabStoreState {
  tabs: TabState[];
  activeTabId: string;
  layoutMode: LayoutMode;
  splitRatio: number;
  theme: AppTheme;
  accentColor: string;
  isAiSidebarOpen: boolean;
  aiSidebarWidth: number;
  pendingCloseTabId: string | null;
  /** Transient, non-tab-scoped failure (e.g. open picker) surfaced in the UI. */
  actionError: string | null;

  // Actions
  addTab: (tab?: Partial<TabState>) => string;
  closeTab: (id: string, opts?: { discard?: boolean }) => void;
  requestCloseTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateContent: (id: string, content: string) => void;
  setCursor: (id: string, line: number, col: number, scrollTop?: number) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  setTheme: (theme: AppTheme) => void;
  setAccentColor: (color: string) => void;
  setAiSidebarOpen: (open: boolean) => void;
  toggleAiSidebar: () => void;
  setAiSidebarWidth: (width: number) => void;
  setSplitRatio: (ratio: number) => void;
  /** Starts a save and returns the revision snapshot to pass back to markClean. */
  beginSave: (id: string) => number;
  setSaveError: (id: string, message: string) => void;
  setDraftSaved: (id: string, saved: boolean) => void;
  markClean: (id: string, filePath?: string, expectedRevision?: number) => void;
  renameTab: (id: string, title: string) => void;
  setPendingCloseTabId: (id: string | null) => void;
  setActionError: (message: string | null) => void;
  restoreSession: (session: AppSession) => void;
  getActiveTab: () => TabState | undefined;
}

const LOCAL_STORAGE_SESSION_KEY = 'docuopsy_session';

function getStoredSessionSnapshot(): Partial<TabStoreState> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

let sessionDebounceTimer: NodeJS.Timeout | null = null;
// Per-tab draft queues: a shared timer would drop tab A's pending draft when
// tab B is edited inside the same debounce window (audit finding P0 #04).
const draftDebounceTimers = new Map<string, NodeJS.Timeout>();
const pendingDrafts = new Map<string, string>();

function writeLocalSnapshot(state: TabStoreState) {
  if (typeof window === 'undefined') return;
  try {
    const localData = {
      activeTabId: state.activeTabId,
      layoutMode: state.layoutMode,
      splitRatio: state.splitRatio,
      theme: state.theme,
      accentColor: state.accentColor,
      isAiSidebarOpen: state.isAiSidebarOpen,
      aiSidebarWidth: state.aiSidebarWidth,
      tabs: state.tabs.map((t) => ({
        id: t.id,
        filePath: t.filePath,
        title: t.title,
        isDirty: t.isDirty,
        cursorLine: t.cursorLine,
        cursorCol: t.cursorCol,
        scrollTop: t.scrollTop,
        draftPath: t.draftPath,
        content: t.filePath ? '' : t.content,
      })),
    };
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(localData));
  } catch {}
}

function persistSessionNow(state: TabStoreState): Promise<void> {
  const session: AppSession = {
    version: 1,
    activeTabId: state.activeTabId,
    layoutMode: state.layoutMode,
    splitRatio: state.splitRatio,
    theme: state.theme,
    accentColor: state.accentColor,
    isAiSidebarOpen: state.isAiSidebarOpen,
    aiSidebarWidth: state.aiSidebarWidth,
    tabs: state.tabs.map((t) => ({
      id: t.id,
      filePath: t.filePath,
      title: t.title,
      isDirty: t.isDirty,
      cursorLine: t.cursorLine,
      cursorCol: t.cursorCol,
      scrollTop: t.scrollTop,
      draftPath: t.draftPath,
    })),
  };
  return saveSession(session).catch(() => {});
}

function persistDraftFor(id: string): Promise<void> {
  const timer = draftDebounceTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    draftDebounceTimers.delete(id);
  }
  if (!pendingDrafts.has(id)) return Promise.resolve();
  const content = pendingDrafts.get(id)!;
  pendingDrafts.delete(id);
  return saveDraft(id, content)
    .then(() => {
      useTabStore.getState().setDraftSaved(id, true);
    })
    .catch(() => {
      // A failed draft write must not be reported as "cached" (audit #08).
      useTabStore.getState().setDraftSaved(id, false);
    });
}

function scheduleDraftPersistence(id: string, content: string) {
  pendingDrafts.set(id, content);
  const existing = draftDebounceTimers.get(id);
  if (existing) clearTimeout(existing);
  draftDebounceTimers.set(
    id,
    setTimeout(() => {
      draftDebounceTimers.delete(id);
      void persistDraftFor(id);
    }, 500)
  );
}

function discardDraft(id: string) {
  const timer = draftDebounceTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    draftDebounceTimers.delete(id);
  }
  pendingDrafts.delete(id);
  removeDraft(id).catch(() => {});
}

/** Builds a TabState with every ephemeral save/draft field defaulted. */
function makeTab(id: string, partial: Partial<TabState> = {}): TabState {
  return {
    id,
    filePath: partial.filePath ?? null,
    title: partial.title ?? 'Untitled-1',
    isDirty: partial.isDirty ?? false,
    cursorLine: partial.cursorLine ?? 1,
    cursorCol: partial.cursorCol ?? 1,
    scrollTop: partial.scrollTop ?? 0,
    draftPath: partial.draftPath ?? null,
    content: partial.content ?? '',
    saveStatus: partial.saveStatus ?? 'idle',
    saveError: partial.saveError ?? null,
    revision: partial.revision ?? 0,
    draftSaved: partial.draftSaved ?? false,
  };
}

function scheduleSessionPersistence(get: () => TabStoreState) {
  // 1. Instant local state cache for zero-flicker startup restoration
  writeLocalSnapshot(get());

  // 2. Debounced backend session persistence (%APPDATA%\Docuopsy\session.json)
  if (sessionDebounceTimer) clearTimeout(sessionDebounceTimer);
  sessionDebounceTimer = setTimeout(() => {
    sessionDebounceTimer = null;
    void persistSessionNow(get());
  }, 500);
}

/**
 * Commits pending debounced writes immediately so a quit inside the debounce
 * window cannot drop the last edits. Awaiting it guarantees the bytes are on
 * disk before the process exits.
 */
export async function flushPersistence(): Promise<void> {
  for (const timer of draftDebounceTimers.values()) clearTimeout(timer);
  draftDebounceTimers.clear();
  if (sessionDebounceTimer) clearTimeout(sessionDebounceTimer);
  sessionDebounceTimer = null;
  const draftFlushes = [...pendingDrafts.keys()].map((id) => persistDraftFor(id));
  await Promise.all([...draftFlushes, persistSessionNow(useTabStore.getState())]);
}

const initialTabId = 'initial-scratch-tab';
const snapshot = getStoredSessionSnapshot();

// Immediately apply cached theme and accent to document element
if (typeof document !== 'undefined') {
  if (snapshot?.theme) {
    document.documentElement.setAttribute('data-theme', snapshot.theme);
  }
  if (snapshot?.accentColor) {
    document.documentElement.style.setProperty('--app-accent', snapshot.accentColor);
  }
}

export const useTabStore = create<TabStoreState>((set, get) => ({
  tabs:
    snapshot?.tabs && snapshot.tabs.length > 0
      ? snapshot.tabs.map((t) => makeTab(t.id, t))
      : [makeTab(initialTabId)],
  activeTabId: snapshot?.activeTabId ?? (snapshot?.tabs?.[0]?.id || initialTabId),
  layoutMode: snapshot?.layoutMode ?? 'Split',
  splitRatio: snapshot?.splitRatio ?? 0.5,
  theme: snapshot?.theme ?? 'dark',
  accentColor: snapshot?.accentColor ?? '#7170ff',
  isAiSidebarOpen: snapshot?.isAiSidebarOpen ?? false,
  aiSidebarWidth: snapshot?.aiSidebarWidth ?? 360,
  pendingCloseTabId: null,
  actionError: null,

  addTab: (partial) => {
    const id = `tab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newTab: TabState = makeTab(id, {
      ...partial,
      title: partial?.title ?? `Untitled-${get().tabs.length + 1}`,
    });

    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: id,
      // If opening a PDF, auto-switch to FullPreview
      layoutMode: newTab.title.toLowerCase().endsWith('.pdf') ? 'FullPreview' : state.layoutMode,
    }));

    scheduleSessionPersistence(get);
    return id;
  },

  closeTab: (id, opts) => {
    const { tabs, activeTabId } = get();
    const target = tabs.find((t) => t.id === id);

    // A dirty tab keeps its draft on disk unless the caller explicitly discards,
    // so closing never destroys the only copy of unsaved work (audit P0 #05).
    if (target?.isDirty && !opts?.discard) {
      if (pendingDrafts.has(id)) {
        void persistDraftFor(id);
      } else {
        saveDraft(id, target.content).catch(() => {});
      }
    } else {
      discardDraft(id);
    }

    if (tabs.length === 1) {
      // Don't close last tab; replace with a clean untitled tab
      const replacementId = `tab-${Date.now()}`;
      set({
        tabs: [makeTab(replacementId)],
        activeTabId: replacementId,
        pendingCloseTabId: null,
      });
      scheduleSessionPersistence(get);
      return;
    }

    const index = tabs.findIndex((t) => t.id === id);
    const newTabs = tabs.filter((t) => t.id !== id);
    let nextActiveId = activeTabId;

    if (activeTabId === id) {
      const nextIndex = Math.max(0, index - 1);
      nextActiveId = newTabs[nextIndex]?.id ?? newTabs[0].id;
    }

    set({
      tabs: newTabs,
      activeTabId: nextActiveId,
      pendingCloseTabId: null,
    });

    scheduleSessionPersistence(get);
  },

  requestCloseTab: (id) => {
    const tab = get().tabs.find((t) => t.id === id);
    if (tab?.isDirty) {
      // Dirty close needs an explicit Save / Discard decision from the user.
      set({ pendingCloseTabId: id });
    } else {
      get().closeTab(id);
    }
  },

  setPendingCloseTabId: (id) => {
    set({ pendingCloseTabId: id });
  },

  setActiveTab: (id) => {
    const tab = get().tabs.find((t) => t.id === id);
    set({
      activeTabId: id,
      layoutMode: tab?.title.toLowerCase().endsWith('.pdf') ? 'FullPreview' : get().layoutMode,
    });
    scheduleSessionPersistence(get);
  },

  updateContent: (id, content) => {
    set((state) => ({
      tabs: state.tabs.map((t) => {
        if (t.id !== id) return t;
        // A new edit invalidates any prior "saved"/"error" acknowledgement, but a
        // save already in flight stays 'saving' until it resolves (its revision
        // guard will then refuse to mark these newer changes clean).
        const saving = t.saveStatus === 'saving';
        return {
          ...t,
          content,
          isDirty: true,
          revision: (t.revision ?? 0) + 1,
          draftSaved: false,
          saveStatus: saving ? 'saving' : 'idle',
          saveError: saving ? t.saveError ?? null : null,
        };
      }),
    }));

    // Debounced atomic draft persistence, per tab
    scheduleDraftPersistence(id, content);

    scheduleSessionPersistence(get);
  },

  setCursor: (id, line, col, scrollTop) => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id
          ? {
              ...t,
              cursorLine: line,
              cursorCol: col,
              scrollTop: scrollTop ?? t.scrollTop,
            }
          : t
      ),
    }));
    scheduleSessionPersistence(get);
  },

  setLayoutMode: (mode) => {
    set({ layoutMode: mode });
    scheduleSessionPersistence(get);
  },

  setTheme: (theme) => {
    set({ theme });
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    scheduleSessionPersistence(get);
  },

  setAccentColor: (color) => {
    set({ accentColor: color });
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--app-accent', color);
    }
    scheduleSessionPersistence(get);
  },

  setAiSidebarOpen: (open) => {
    set({ isAiSidebarOpen: open });
    scheduleSessionPersistence(get);
  },

  toggleAiSidebar: () => {
    set((s) => ({ isAiSidebarOpen: !s.isAiSidebarOpen }));
    scheduleSessionPersistence(get);
  },

  setAiSidebarWidth: (width) => {
    const clamped = Math.min(560, Math.max(300, width));
    set({ aiSidebarWidth: clamped });
    scheduleSessionPersistence(get);
  },

  setSplitRatio: (ratio) => {
    const clamped = Math.min(0.85, Math.max(0.15, ratio));
    set({ splitRatio: clamped });
    scheduleSessionPersistence(get);
  },

  beginSave: (id) => {
    const revision = get().tabs.find((t) => t.id === id)?.revision ?? 0;
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id ? { ...t, saveStatus: 'saving', saveError: null } : t
      ),
    }));
    return revision;
  },

  setSaveError: (id, message) => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id ? { ...t, saveStatus: 'error', saveError: message } : t
      ),
    }));
  },

  setDraftSaved: (id, saved) => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id && (t.draftSaved ?? false) !== saved ? { ...t, draftSaved: saved } : t
      ),
    }));
  },

  markClean: (id, filePath, expectedRevision) => {
    const target = get().tabs.find((t) => t.id === id);
    if (!target) return;
    // If the buffer changed while the save was in flight, the bytes we wrote are
    // already stale: keep the tab dirty so the newer edit is not lost (audit #08).
    const stale =
      expectedRevision !== undefined && (target.revision ?? 0) !== expectedRevision;

    set((state) => ({
      tabs: state.tabs.map((t) => {
        if (t.id !== id) return t;
        const renamedOnDisk = filePath !== undefined && filePath !== t.filePath;
        // The filename only owns the tab title when the tab moved to a new path;
        // otherwise a manual rename would be silently reverted by Ctrl+S.
        const nextTitle =
          renamedOnDisk && filePath
            ? filePath.split(/[\\/]/).pop() || t.title
            : t.title;
        return {
          ...t,
          filePath: filePath ?? t.filePath,
          title: nextTitle,
          isDirty: stale ? true : false,
          saveStatus: stale ? 'idle' : 'saved',
          saveError: null,
        };
      }),
    }));

    if (!stale) discardDraft(id);
    scheduleSessionPersistence(get);
  },

  setActionError: (message) => {
    set({ actionError: message });
  },

  renameTab: (id, title) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    const current = get().tabs.find((t) => t.id === id);
    if (!current || current.title === trimmed) return;

    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, title: trimmed } : t)),
    }));
    scheduleSessionPersistence(get);
  },

  restoreSession: (session) => {
    if (!session || !session.tabs || session.tabs.length === 0) return;

    set({
      layoutMode: session.layoutMode,
      splitRatio: session.splitRatio || 0.5,
      activeTabId: session.activeTabId,
      theme: (session.theme as AppTheme) || 'dark',
      accentColor: session.accentColor || get().accentColor,
      isAiSidebarOpen: session.isAiSidebarOpen ?? get().isAiSidebarOpen,
      aiSidebarWidth: session.aiSidebarWidth || get().aiSidebarWidth,
      tabs: session.tabs.map((t) => makeTab(t.id, { ...t, content: '' })),
    });

    if (typeof document !== 'undefined') {
      if (session.theme) {
        document.documentElement.setAttribute('data-theme', session.theme);
      }
      if (session.accentColor) {
        document.documentElement.style.setProperty('--app-accent', session.accentColor);
      }
    }
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get();
    return tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  },
}));

