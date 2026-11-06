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

  // Actions
  addTab: (tab?: Partial<TabState>) => string;
  closeTab: (id: string) => void;
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
  markClean: (id: string, filePath?: string) => void;
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

let draftDebounceTimer: NodeJS.Timeout | null = null;
let sessionDebounceTimer: NodeJS.Timeout | null = null;

function scheduleSessionPersistence(get: () => TabStoreState) {
  const state = get();

  // 1. Instant local state cache for zero-flicker startup restoration
  if (typeof window !== 'undefined') {
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

  // 2. Debounced backend session persistence (%APPDATA%\Docuopsy\session.json)
  if (sessionDebounceTimer) clearTimeout(sessionDebounceTimer);
  sessionDebounceTimer = setTimeout(() => {
    const s = get();
    const session: AppSession = {
      version: 1,
      activeTabId: s.activeTabId,
      layoutMode: s.layoutMode,
      splitRatio: s.splitRatio,
      theme: s.theme,
      accentColor: s.accentColor,
      isAiSidebarOpen: s.isAiSidebarOpen,
      aiSidebarWidth: s.aiSidebarWidth,
      tabs: s.tabs.map((t) => ({
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
    saveSession(session).catch(() => {});
  }, 500);
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
  tabs: snapshot?.tabs && snapshot.tabs.length > 0
    ? snapshot.tabs.map((t) => ({
        id: t.id,
        filePath: t.filePath ?? null,
        title: t.title ?? 'Untitled-1',
        isDirty: t.isDirty ?? false,
        cursorLine: t.cursorLine ?? 1,
        cursorCol: t.cursorCol ?? 1,
        scrollTop: t.scrollTop ?? 0,
        draftPath: t.draftPath ?? null,
        content: t.content ?? '',
      }))
    : [
        {
          id: initialTabId,
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
  activeTabId: snapshot?.activeTabId ?? (snapshot?.tabs?.[0]?.id || initialTabId),
  layoutMode: snapshot?.layoutMode ?? 'Split',
  splitRatio: snapshot?.splitRatio ?? 0.5,
  theme: snapshot?.theme ?? 'dark',
  accentColor: snapshot?.accentColor ?? '#7170ff',
  isAiSidebarOpen: snapshot?.isAiSidebarOpen ?? false,
  aiSidebarWidth: snapshot?.aiSidebarWidth ?? 360,

  addTab: (partial) => {
    const id = `tab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newTab: TabState = {
      id,
      filePath: partial?.filePath ?? null,
      title: partial?.title ?? `Untitled-${get().tabs.length + 1}`,
      isDirty: partial?.isDirty ?? false,
      cursorLine: partial?.cursorLine ?? 1,
      cursorCol: partial?.cursorCol ?? 1,
      scrollTop: partial?.scrollTop ?? 0,
      draftPath: partial?.draftPath ?? null,
      content: partial?.content ?? '',
    };

    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: id,
      // If opening a PDF, auto-switch to FullPreview
      layoutMode: newTab.title.toLowerCase().endsWith('.pdf') ? 'FullPreview' : state.layoutMode,
    }));

    scheduleSessionPersistence(get);
    return id;
  },

  closeTab: (id) => {
    const { tabs, activeTabId } = get();
    if (tabs.length === 1) {
      // Don't close last tab; replace with a clean untitled tab
      const replacementId = `tab-${Date.now()}`;
      set({
        tabs: [
          {
            id: replacementId,
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
        activeTabId: replacementId,
      });
      removeDraft(id).catch(() => {});
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
    });

    removeDraft(id).catch(() => {});
    scheduleSessionPersistence(get);
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
      tabs: state.tabs.map((t) =>
        t.id === id
          ? {
              ...t,
              content,
              isDirty: true,
            }
          : t
      ),
    }));

    // Debounced atomic draft persistence
    if (draftDebounceTimer) clearTimeout(draftDebounceTimer);
    draftDebounceTimer = setTimeout(() => {
      saveDraft(id, content).catch(() => {});
    }, 500);

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

  markClean: (id, filePath) => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id
          ? {
              ...t,
              isDirty: false,
              filePath: filePath ?? t.filePath,
              title: filePath ? (filePath.split(/[\\/]/).pop() || t.title) : t.title,
            }
          : t
      ),
    }));
    removeDraft(id).catch(() => {});
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
      tabs: session.tabs.map((t) => ({
        ...t,
        content: '', // loaded lazily or from draft
      })),
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

