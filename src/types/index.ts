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
  accentColor?: string;
  isAiSidebarOpen?: boolean;
  aiSidebarWidth?: number;
  tabs: Omit<TabState, 'content'>[];
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

