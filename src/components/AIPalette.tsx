import React, { useState, useEffect, useRef, useMemo } from 'react';
import { listen } from '@tauri-apps/api/event';
import { aiGenerateStream } from '../api/ipc';
import {
  Sparkles,
  X,
  CornerDownLeft,
  Loader2,
  Clock,
  Trash2,
  Copy,
  Check,
  ArrowLeft,
  BrainCircuit,
} from 'lucide-react';
import type { AIStreamChunk, AIChatMessage, RecentTask } from '../types';
import type { EditorView } from '@codemirror/view';
import MarkdownIt from 'markdown-it';
import { sanitizeHtml } from '../utils/sanitizer';
import { useTabStore } from '../store/tabStore';

const mdParser = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
});

function injectStreamCaret(html: string): string {
  const caret = '<span class="stream-caret" aria-hidden="true"></span>';
  const lastTagMatch = html.match(/(<\/(?:p|li|h[1-6]|pre|blockquote|td)>)(\s*(?:<\/(?:ul|ol|table|tbody)>)?\s*)$/);
  if (lastTagMatch) {
    const [full, closingTag, remainder] = lastTagMatch;
    const index = html.lastIndexOf(full);
    return html.slice(0, index) + caret + closingTag + remainder;
  }
  return html + caret;
}

function renderAssistantMarkdown(content: string, isStreaming: boolean): string {
  const parsed = mdParser.render(content);
  const withCaret = isStreaming ? injectStreamCaret(parsed) : parsed;
  return sanitizeHtml(withCaret);
}

interface AIPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  editorView?: EditorView | null;
  width?: number;
  onWidthChange?: (width: number) => void;
}

const PRESET_PROMPTS = [
  { label: 'Continue Writing', prompt: 'Continue writing seamlessly from the current point, matching style and tone.' },
  { label: 'Summarize', prompt: 'Summarize the document key points into a structured GFM Markdown outline.' },
  { label: 'Fix Grammar & Polish', prompt: 'Improve clarity, fix grammar, and elevate readability while preserving technical precision.' },
  { label: 'Explain Code / Text', prompt: 'Explain the core logic and structural concepts in this section.' },
];

const RECENT_TASKS_KEY = 'docuopsy_recent_tasks';

function getContextualProgress(prompt: string, status?: string): { stage: string; message: string } {
  const lower = prompt.toLowerCase();

  let stage = 'Thinking';
  let message = 'Menganalisis konteks dokumen...';

  if (status === 'thinking') {
    stage = 'Thinking';
  } else if (status === 'reasoning') {
    stage = 'Reasoning';
  } else if (status === 'retrying') {
    return { stage: 'Retrying', message: 'Server padat, mencoba menghubungkan ulang otomatis...' };
  } else if (status === 'streaming') {
    stage = 'Generating';
  } else if (status === 'completed') {
    return { stage: 'Done', message: 'Selesai menghasilkan respons.' };
  }

  const isPreGeneration = stage === 'Thinking' || stage === 'Reasoning';

  if (lower.includes('resep') || lower.includes('puding') || lower.includes('kopi') || lower.includes('americano') || lower.includes('amerikano') || lower.includes('masak') || lower.includes('makanan') || lower.includes('kue')) {
    message = isPreGeneration
      ? 'Menelaah takaran bahan baku & teknik kuliner...'
      : 'Mengompilasi langkah pembuatan & panduan penyajian...';
  } else if (lower.includes('code') || lower.includes('kode') || lower.includes('fungsi') || lower.includes('script') || lower.includes('rust') || lower.includes('python') || lower.includes('bug')) {
    message = isPreGeneration
      ? 'Menganalisis logika algoritma & sintaks kode...'
      : 'Menyusun implementasi kode & penjelasan teknis...';
  } else if (lower.includes('summarize') || lower.includes('ringkas') || lower.includes('rangkum') || lower.includes('intisari')) {
    message = isPreGeneration
      ? 'Mengekstraksi premis pokok & argumen sentral...'
      : 'Merumuskan ikhtisar terstruktur & poin analitis...';
  } else if (lower.includes('grammar') || lower.includes('tata bahasa') || lower.includes('perbaiki') || lower.includes('polish')) {
    message = isPreGeneration
      ? 'Meninjau kohesi kalimat, diksi & ejaan...'
      : 'Menyelaraskan stilistika bahasa & kejelasan naskah...';
  } else {
    message = isPreGeneration
      ? 'Merumuskan penalaran konseptual & sintesis...'
      : 'Menghasilkan respons terstruktur...';
  }

  return { stage, message };
}

export const AIPalette: React.FC<AIPaletteProps> = ({
  isOpen,
  onClose,
  editorView,
  width = 360,
  onWidthChange,
}) => {
  const [prompt, setPrompt] = useState('');
  const [lastPrompt, setLastPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStatus, setStreamStatus] = useState<string>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRecentTasks, setShowRecentTasks] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Typewriter streaming animation refs
  const streamTargetRef = useRef<string>('');
  const streamDisplayRef = useRef<string>('');
  const activeMsgIdRef = useRef<string | null>(null);
  const isDoneReceivedRef = useRef<boolean>(false);

  // Resize handler for the left edge of the sidebar
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      if (onWidthChange) {
        onWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onWidthChange]);

  // Load recent tasks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_TASKS_KEY);
      if (saved) {
        setRecentTasks(JSON.parse(saved));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save recent tasks
  const saveRecentTask = (taskPrompt: string) => {
    try {
      const newTask: RecentTask = {
        id: `task-${Date.now()}`,
        prompt: taskPrompt,
        timestamp: Date.now(),
        preview: taskPrompt.slice(0, 60),
      };
      const updated = [newTask, ...recentTasks.filter((t) => t.prompt !== taskPrompt)].slice(0, 20);
      setRecentTasks(updated);
      localStorage.setItem(RECENT_TASKS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  const clearRecentTasks = () => {
    setRecentTasks([]);
    try {
      localStorage.removeItem(RECENT_TASKS_KEY);
    } catch {}
  };

  // Auto-scroll chat when idle or when new messages arrive
  useEffect(() => {
    if (!isStreaming) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming]);

  // Smooth Typewriter Animation Engine for Streaming Output
  useEffect(() => {
    if (!isStreaming) return;

    let rafId: number;
    let lastTick = performance.now();

    const updateDisplay = (now: number) => {
      const elapsed = now - lastTick;

      // Update at smooth ~16ms animation intervals
      if (elapsed >= 16) {
        lastTick = now;
        const target = streamTargetRef.current;
        const current = streamDisplayRef.current;

        if (current.length < target.length) {
          const diff = target.length - current.length;
          // Adaptive fluid typing speed:
          // Low backlog: 1-2 chars per tick (~60-120 cps typewriter feel)
          // High backlog: progressively accelerated catchup
          // Stream completed: fast clean flush
          const step = isDoneReceivedRef.current
            ? Math.max(4, Math.ceil(diff / 3))
            : diff > 60
            ? Math.ceil(diff / 4)
            : diff > 20
            ? Math.ceil(diff / 6)
            : Math.min(2, diff);

          const nextText = target.slice(0, current.length + step);
          streamDisplayRef.current = nextText;

          const activeId = activeMsgIdRef.current;
          setMessages((prev) => {
            const index = prev.findIndex((m) => m.id === activeId);
            if (index !== -1 && prev[index].content !== nextText) {
              const updated = [...prev];
              updated[index] = { ...updated[index], content: nextText };
              return updated;
            }
            return prev;
          });

          // Butter-smooth scroll tracking without layout jitter
          if (scrollContainerRef.current) {
            const el = scrollContainerRef.current;
            const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
            if (isNearBottom) {
              el.scrollTop = el.scrollHeight;
            }
          }
        } else if (isDoneReceivedRef.current) {
          // Finished unspooling all tokens
          setIsStreaming(false);
          setStreamStatus('idle');
          activeMsgIdRef.current = null;
        }
      }

      rafId = requestAnimationFrame(updateDisplay);
    };

    rafId = requestAnimationFrame(updateDisplay);
    return () => cancelAnimationFrame(rafId);
  }, [isStreaming]);

  // Setup streaming event listener
  useEffect(() => {
    let unlistenFn: (() => void) | null = null;

    const handleChunk = (chunk: AIStreamChunk) => {
      if (chunk.status) {
        setStreamStatus(chunk.status);
      }

      if (chunk.error) {
        setErrorMessage(chunk.error);
        setIsStreaming(false);
        setStreamStatus('idle');
        activeMsgIdRef.current = null;
        return;
      }

      if (chunk.delta) {
        if (!activeMsgIdRef.current) {
          const newId = `asst-${Date.now()}`;
          activeMsgIdRef.current = newId;
          setMessages((prev) => [
            ...prev,
            { id: newId, role: 'assistant', content: '', timestamp: Date.now() },
          ]);
        }
        streamTargetRef.current += chunk.delta;
      }

      if (chunk.isDone) {
        isDoneReceivedRef.current = true;
      }
    };

    async function setupListener() {
      try {
        if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
          const unlisten = await listen<AIStreamChunk>('ai:stream:chunk', (event) => {
            handleChunk(event.payload);
          });
          unlistenFn = unlisten;
        } else if (typeof window !== 'undefined') {
          const customEventHandler = (event: Event) => {
            const ce = event as CustomEvent<AIStreamChunk>;
            if (ce.detail) {
              handleChunk(ce.detail);
            }
          };
          window.addEventListener('ai:stream:chunk', customEventHandler);
          unlistenFn = () => window.removeEventListener('ai:stream:chunk', customEventHandler);
        }
      } catch (err) {
        console.warn('Event listener setup failed:', err);
      }
    }

    if (isOpen) {
      setupListener();
      setTimeout(() => inputRef.current?.focus(), 50);
    }

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, [isOpen]);

  const handleSubmit = async (customPrompt?: string) => {
    const finalPrompt = (customPrompt ?? prompt).trim();
    if (!finalPrompt || isStreaming) return;

    setErrorMessage(null);
    setIsStreaming(true);
    setStreamStatus('thinking');
    isDoneReceivedRef.current = false;
    streamTargetRef.current = '';
    streamDisplayRef.current = '';

    const assistantId = `asst-${Date.now()}`;
    activeMsgIdRef.current = assistantId;

    // Add user message to chat thread
    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: finalPrompt,
      timestamp: Date.now(),
    };

    // Add placeholder assistant message
    const assistantMsg: AIChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    saveRecentTask(finalPrompt);
    setLastPrompt(finalPrompt);
    setPrompt('');

    // Context from current editor buffer
    const editorContext = editorView ? editorView.state.doc.toString().slice(0, 8000) : '';
    const activeTab = useTabStore.getState().getActiveTab();
    const activeFileName = activeTab?.title || 'Untitled-1';
    const streamId = `stream-${Date.now()}`;

    try {
      const fullResult = await aiGenerateStream(streamId, finalPrompt, editorContext, activeFileName);
      if (fullResult && streamTargetRef.current.length < fullResult.length) {
        streamTargetRef.current = fullResult;
      }
      isDoneReceivedRef.current = true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setIsStreaming(false);
      setStreamStatus('idle');
      activeMsgIdRef.current = null;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant' && !last.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    }
  };

  const handleInsertAtCursor = (text: string) => {
    if (!editorView || !text) return;
    const selection = editorView.state.selection.main;
    editorView.dispatch({
      changes: { from: selection.to, insert: text },
      selection: { anchor: selection.to + text.length },
      scrollIntoView: true,
    });
  };

  const handleNewSession = () => {
    if (isStreaming) return;
    setMessages([]);
    setErrorMessage(null);
    setPrompt('');
    streamTargetRef.current = '';
    streamDisplayRef.current = '';
    activeMsgIdRef.current = null;
    isDoneReceivedRef.current = false;
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeProgress = useMemo(() => {
    if (!isStreaming) return null;
    const lastUserPrompt = [...messages].reverse().find((m) => m.role === 'user')?.content || prompt;
    return getContextualProgress(lastUserPrompt, streamStatus);
  }, [isStreaming, messages, prompt, streamStatus]);

  if (!isOpen) return null;

  return (
    <aside
      role="complementary"
      aria-label="AI Assistant"
      style={{ width: `${width}px` }}
      className="h-full flex-shrink-0 border-l border-app-border bg-app-surface flex flex-col font-sans select-none overflow-hidden relative shadow-2xl z-20"
    >
      {/* Resizable Left Drag Border */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute top-0 bottom-0 left-0 w-1.5 cursor-col-resize hover:bg-app-accent/60 active:bg-app-accent transition-colors z-30"
        title="Drag to resize AI sidebar"
      />

      {/* Header Bar */}
      <div className="h-10 flex-shrink-0 border-b border-app-border px-3.5 flex items-center justify-between bg-app-surface">
        <button
          type="button"
          onClick={handleNewSession}
          className="flex items-center gap-2 group hover:opacity-80 active:scale-[0.98] transition-all cursor-pointer p-1 -ml-1 rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-app-accent"
          title="New Session (Click icon or text to start new session)"
          aria-label="New Session"
        >
          <Sparkles className="w-4 h-4 text-app-accent fill-app-accent group-hover:scale-105 transition-transform" />
          <span className="font-semibold text-xs text-app-primary group-hover:text-app-accent transition-colors">
            AI Assistant
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowRecentTasks((p) => !p)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] transition-colors border ${
              showRecentTasks
                ? 'bg-app-surface-hover border-app-border text-app-primary font-medium'
                : 'border-transparent text-app-muted hover:text-app-primary hover:bg-app-surface-hover'
            }`}
            title="Recent Tasks"
          >
            <Clock className="w-3 h-3" />
            <span>Recent</span>
            {recentTasks.length > 0 && (
              <span className="ml-0.5 text-[9px] px-1.5 rounded-full bg-app-surface-hover border border-app-border text-app-muted font-mono">
                {recentTasks.length}
              </span>
            )}
          </button>

          <button
            type="button"
            aria-label="Close Assistant"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-app-surface-hover text-app-muted hover:text-app-primary transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Body Area: Recent Tasks Drawer + Chat Thread */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Collapsible Recent Tasks Drawer */}
        {showRecentTasks && (
          <div className="w-52 flex-shrink-0 border-r border-app-border bg-app-surface/60 flex flex-col overflow-hidden animate-in slide-in-from-left duration-150 z-20">
            <div className="p-2 border-b border-app-border flex items-center justify-between text-xs font-mono text-app-muted">
              <span className="flex items-center gap-1.5 font-semibold text-[11px]">
                <Clock className="w-3 h-3" />
                Recent Tasks
              </span>
              {recentTasks.length > 0 && (
                <button
                  type="button"
                  onClick={clearRecentTasks}
                  className="p-1 hover:text-rose-500 rounded transition-colors"
                  title="Clear history"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-1.5 space-y-1 scrollbar-none">
              {recentTasks.length === 0 ? (
                <div className="text-[11px] text-app-muted p-3 text-center">
                  No recent tasks yet.
                </div>
              ) : (
                recentTasks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setPrompt(t.prompt);
                      setShowRecentTasks(false);
                      inputRef.current?.focus();
                    }}
                    className="w-full text-left p-2 rounded hover:bg-app-surface text-app-muted hover:text-app-primary transition-colors group"
                  >
                    <p className="text-xs truncate font-medium text-app-primary/90">{t.prompt}</p>
                    <span className="text-[10px] text-app-muted/60 font-mono">
                      {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Chat Stream Thread */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-app-canvas/40">
          {messages.length === 0 ? (
            // Empty State & Presets
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center p-4 text-center select-none scrollbar-none">
              <div className="mb-2.5 flex-shrink-0">
                <Sparkles className="w-6 h-6 text-app-accent fill-app-accent" />
              </div>
              <h3 className="text-xs font-semibold text-app-primary mb-1">How can I assist your document?</h3>
              <p className="text-[11px] text-app-muted max-w-xs mb-4 leading-relaxed">
                Contextual writing assistant. Ask questions, draft recipes, generate code, or analyze text.
              </p>

              <div className="grid grid-cols-1 gap-1.5 w-full max-w-xs">
                {PRESET_PROMPTS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleSubmit(item.prompt)}
                    className="text-left p-2 rounded-lg bg-app-surface/60 border border-app-border hover:border-app-accent/40 hover:bg-app-surface text-xs text-app-muted hover:text-app-primary transition-all flex flex-col gap-0.5"
                  >
                    <span className="font-semibold text-app-primary text-[11px]">{item.label}</span>
                    <span className="text-[10px] text-app-muted line-clamp-1">{item.prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Message Stream List
            <div
              ref={scrollContainerRef}
              className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 select-text"
            >
              {messages.map((msg, index) => {
                const isLastAssistant = msg.role === 'assistant' && index === messages.length - 1;
                const isMessageStreaming = isStreaming && isLastAssistant;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[92%] rounded-lg px-3.5 py-2.5 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-app-surface-hover border border-app-border text-app-primary font-medium shadow-sm'
                          : 'bg-app-surface border border-app-border text-app-primary shadow-sm w-full'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div>
                          {msg.content ? (
                            <div
                              className={`prose-docuopsy text-xs leading-relaxed select-text ${
                                isMessageStreaming ? 'stream-text-active' : ''
                              }`}
                              dangerouslySetInnerHTML={{
                                __html: renderAssistantMarkdown(msg.content, isMessageStreaming),
                              }}
                            />
                          ) : (
                            <div className="flex items-center gap-2 text-app-muted font-mono text-[11px] py-1">
                              <Loader2 className="w-3 h-3 text-app-accent animate-spin" />
                              <span>Menganalisis & menyusun respons...</span>
                            </div>
                          )}

                          {/* Action Toolbar for Assistant Response */}
                          {msg.content && !isMessageStreaming && (
                            <div className="mt-2.5 pt-2 border-t border-app-border flex items-center justify-between text-[11px] text-app-muted select-none">
                              <span className="font-mono text-[9px] opacity-50">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleCopyMessage(msg.id, msg.content)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-app-border hover:border-app-border-strong bg-transparent text-app-muted hover:text-app-primary transition-all text-[10px]"
                                  title="Copy text"
                                >
                                  {copiedId === msg.id ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                  <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleInsertAtCursor(msg.content)}
                                  className="p-1.5 rounded-full bg-app-accent text-white hover:opacity-90 active:scale-95 transition-all flex items-center justify-center shadow-sm"
                                  title="Insert into document cursor"
                                  aria-label="Insert into document cursor"
                                >
                                  <ArrowLeft className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Context-Aware Progress Bar */}
      {activeProgress && (
        <div className="flex-shrink-0 px-3 py-1.5 border-t border-app-border bg-app-surface flex items-center gap-2 text-xs select-none">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-app-surface-hover border border-app-border text-app-accent font-mono text-[9px] font-semibold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <BrainCircuit className="w-2.5 h-2.5" />
            <span>{activeProgress.stage}</span>
          </div>
          <span className="text-app-muted truncate text-[10px]">
            {activeProgress.message}
          </span>
          <Loader2 className="w-3 h-3 text-app-accent animate-spin ml-auto flex-shrink-0" />
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="flex-shrink-0 px-3 py-1.5 border-t border-error/30 bg-error/10 text-error text-xs flex items-center justify-between gap-2 font-mono">
          <span className="flex-1 text-[10px] leading-snug truncate">{errorMessage}</span>
          {lastPrompt && (
            <button
              type="button"
              onClick={() => handleSubmit(lastPrompt)}
              disabled={isStreaming}
              className="px-2.5 py-0.5 rounded-full bg-error/20 hover:bg-error/30 text-white border border-error/40 text-[10px] font-medium transition-all whitespace-nowrap active:scale-95"
            >
              Coba Lagi
            </button>
          )}
        </div>
      )}

      {/* Input Bar */}
      <div className="flex-shrink-0 p-3 border-t border-app-border bg-app-surface flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            } else if (e.key === 'Escape') {
              onClose();
            }
          }}
          placeholder="Type prompt or task (e.g. buatkan resep)..."
          disabled={isStreaming}
          className="flex-1 bg-app-canvas border border-app-border focus:border-app-accent focus:ring-1 focus:ring-app-accent/30 rounded-md px-3 py-2 text-xs text-app-primary placeholder:text-app-muted outline-none transition-all"
        />

        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={isStreaming || !prompt.trim()}
          className="h-8 px-3.5 rounded-full bg-app-accent hover:opacity-90 disabled:opacity-40 text-white font-medium transition-all flex items-center justify-center shadow-sm"
          title="Send task to AI (Enter)"
        >
          {isStreaming ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CornerDownLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </aside>
  );
};
