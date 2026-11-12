export type LayoutMode = 'Split' | 'FullEditor' | 'FullPreview';

export type AppTheme = 'dark' | 'light';

/** Lifecycle of an explicit save (Ctrl+S / Save & Close), per tab. */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface TabState {
  id: string;
  filePath: string | null;
  title: string;
  isDirty: boolean;
  cursorLine: number;
  cursorCol: number;
  scrollTop: number;
  draftPath: string | null;
  content: string; // buffer content in memory
  // Ephemeral save/draft bookkeeping — never persisted to session.json.
  saveStatus?: SaveStatus;
  saveError?: string | null;
  /** Bumped on every edit so a slow save cannot mark newer changes clean. */
  revision?: number;
  /** True only after the debounced draft write was acknowledged. */
  draftSaved?: boolean;
}

/** Tab fields that survive a restart; content and save bookkeeping are ephemeral. */
export type PersistedTab = Omit<
  TabState,
  'content' | 'saveStatus' | 'saveError' | 'revision' | 'draftSaved'
>;

export interface AppSession {
  version: number;
  activeTabId: string;
  layoutMode: LayoutMode;
  splitRatio: number;
  theme?: string;
  accentColor?: string;
  isAiSidebarOpen?: boolean;
  aiSidebarWidth?: number;
  tabs: PersistedTab[];
}

export interface AIStreamChunk {
  streamId: string;
  delta: string;
  isDone: boolean;
  status?: string;
  error?: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  status?: string;
}

export interface RecentTask {
  id: string;
  prompt: string;
  timestamp: number;
  preview?: string;
}

