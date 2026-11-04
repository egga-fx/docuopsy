export type LayoutMode = 'Split' | 'FullEditor' | 'FullPreview';

export type AppTheme = 'dark' | 'light';

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
}

export interface AppSession {
  version: number;
  activeTabId: string;
  layoutMode: LayoutMode;
  splitRatio: number;
  theme?: string;
  tabs: Omit<TabState, 'content'>[];
}

export interface AIStreamChunk {
  streamId: string;
  delta: string;
  isDone: boolean;
  error?: string;
}

