import { create } from 'zustand';
import type { AppSession, AppTheme, LayoutMode, TabState } from '../types';
import { saveDraft, saveSession, removeDraft } from '../api/ipc';

interface TabStoreState {
  tabs: TabState[];
  activeTabId: string;
  layoutMode: LayoutMode;
  splitRatio: number;
  theme: AppTheme;

  // Actions
  addTab: (tab?: Partial<TabState>) => string;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateContent: (id: string, content: string) => void;
  setCursor: (id: string, line: number, col: number, scrollTop?: number) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  setTheme: (theme: AppTheme) => void;
  setSplitRatio: (ratio: number) => void;
  markClean: (id: string, filePath?: string) => void;
  restoreSession: (session: AppSession) => void;
  getActiveTab: () => TabState | undefined;
}

let draftDebounceTimer: NodeJS.Timeout | null = null;
let sessionDebounceTimer: NodeJS.Timeout | null = null;

function scheduleSessionPersistence(get: () => TabStoreState) {
  if (sessionDebounceTimer) clearTimeout(sessionDebounceTimer);
  sessionDebounceTimer = setTimeout(() => {
    const state = get();
    const session: AppSession = {
      version: 1,
      activeTabId: state.activeTabId,
      layoutMode: state.layoutMode,
      splitRatio: state.splitRatio,
      theme: state.theme,
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
    saveSession(session).catch(() => {});
  }, 500);
}

const initialTabId = 'initial-scratch-tab';

export const useTabStore = create<TabStoreState>((set, get) => ({
  tabs: [
    {
      id: initialTabId,
      filePath: null,
      title: 'Untitled-1',
      isDirty: false,
      cursorLine: 1,
      cursorCol: 1,
      scrollTop: 0,
      draftPath: null,
      content: '# Untitled Document\n\nWelcome to Docuopsy.',
    },
  ],
  activeTabId: initialTabId,
  layoutMode: 'Split',
  splitRatio: 0.5,
  theme: 'dark',

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
      tabs: session.tabs.map((t) => ({
        ...t,
        content: '', // loaded lazily or from draft
      })),
    });

    if (typeof document !== 'undefined' && session.theme) {
      document.documentElement.setAttribute('data-theme', session.theme);
    }
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get();
    return tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  },
}));

