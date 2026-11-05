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
  ArrowDownToLine,
  BrainCircuit,
} from 'lucide-react';
import type { AIStreamChunk, AIChatMessage, RecentTask } from '../types';
import type { EditorView } from '@codemirror/view';
import MarkdownIt from 'markdown-it';
import { sanitizeHtml } from '../utils/sanitizer';

const mdParser = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
});

interface AIPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  editorView?: EditorView | null;
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
  } else if (status === 'retrying') {
    return { stage: 'Retrying', message: 'Server padat, mencoba menghubungkan ulang otomatis...' };
  } else if (status === 'streaming') {
    stage = 'Generating';
  } else if (status === 'completed') {
    return { stage: 'Done', message: 'Selesai menghasilkan respons.' };
  }

  if (lower.includes('resep') || lower.includes('puding') || lower.includes('masak') || lower.includes('makanan') || lower.includes('kue')) {
    message = stage === 'Thinking'
      ? 'Menelaah takaran bahan baku & teknik kuliner...'
      : 'Mengompilasi langkah pembuatan & panduan penyajian...';
  } else if (lower.includes('code') || lower.includes('kode') || lower.includes('fungsi') || lower.includes('script') || lower.includes('rust') || lower.includes('python') || lower.includes('bug')) {
    message = stage === 'Thinking'
      ? 'Menganalisis logika algoritma & sintaks kode...'
      : 'Menyusun implementasi kode & penjelasan teknis...';
  } else if (lower.includes('summarize') || lower.includes('ringkas') || lower.includes('rangkum') || lower.includes('intisari')) {
    message = stage === 'Thinking'
      ? 'Mengekstraksi premis pokok & argumen sentral...'
      : 'Merumuskan ikhtisar terstruktur & poin analitis...';
  } else if (lower.includes('grammar') || lower.includes('tata bahasa') || lower.includes('perbaiki') || lower.includes('polish')) {
    message = stage === 'Thinking'
      ? 'Meninjau kohesi kalimat, diksi & ejaan...'
      : 'Menyelaraskan stilistika bahasa & kejelasan naskah...';
  } else {
    message = stage === 'Thinking'
      ? 'Merumuskan penalaran konseptual & sintesis...'
      : 'Menghasilkan respons terstruktur...';
  }

  return { stage, message };
}

export const AIPalette: React.FC<AIPaletteProps> = ({ isOpen, onClose, editorView }) => {
  const [prompt, setPrompt] = useState('');
  const [lastPrompt, setLastPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStatus, setStreamStatus] = useState<string>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRecentTasks, setShowRecentTasks] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Setup streaming event listener
  useEffect(() => {
    let unlistenFn: (() => void) | null = null;

    async function setupListener() {
      try {
        if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
          const unlisten = await listen<AIStreamChunk>('ai:stream:chunk', (event) => {
            const chunk = event.payload;

            if (chunk.status) {
              setStreamStatus(chunk.status);
            }

            if (chunk.error) {
              setErrorMessage(chunk.error);
              setIsStreaming(false);
              setStreamStatus('idle');
              return;
            }

            if (chunk.delta) {
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'assistant') {
                  return [
                    ...prev.slice(0, -1),
                    { ...last, content: last.content + chunk.delta },
                  ];
                }
                return [
                  ...prev,
                  {
                    id: `msg-${Date.now()}`,
                    role: 'assistant',
                    content: chunk.delta,
                    timestamp: Date.now(),
                  },
                ];
              });
            }

            if (chunk.isDone) {
              setIsStreaming(false);
              setStreamStatus('idle');
            }
          });
          unlistenFn = unlisten;
        }
      } catch (err) {
        console.warn('Tauri event listener setup skipped:', err);
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

    // Add user message to chat thread
    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: finalPrompt,
      timestamp: Date.now(),
    };

    // Add placeholder assistant message
    const assistantMsg: AIChatMessage = {
      id: `asst-${Date.now()}`,
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
    const streamId = `stream-${Date.now()}`;

    try {
      await aiGenerateStream(streamId, finalPrompt, editorContext);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setIsStreaming(false);
      setStreamStatus('idle');
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
    <div className="fixed inset-0 bg-obsidian/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 select-none overflow-hidden">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="AI Assistant"
        className="w-full max-w-3xl h-[82vh] max-h-[620px] min-h-[340px] bg-slate-shell border border-slate-border rounded-xl shadow-2xl flex flex-col font-sans overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header Bar */}
        <div className="h-11 sm:h-12 flex-shrink-0 border-b border-slate-border px-3 sm:px-4 flex items-center justify-between bg-slate-shell/90">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-kie-violet/10 border border-kie-violet/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-kie-violet" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-parchment">AI Assistant</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-surface text-[10px] text-kie-violet border border-kie-violet/30 font-mono">
                  deepseek-v4-1-flash
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowRecentTasks((p) => !p)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                showRecentTasks
                  ? 'bg-slate-surface text-parchment font-medium'
                  : 'text-slate-muted hover:text-parchment hover:bg-slate-surface/60'
              }`}
              title="Recent Tasks"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Recent</span>
              {recentTasks.length > 0 && (
                <span className="ml-1 text-[10px] px-1 rounded bg-slate-border text-slate-muted">
                  {recentTasks.length}
                </span>
              )}
            </button>

            <button
              type="button"
              aria-label="Close Assistant"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-surface text-slate-muted hover:text-parchment transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Body Area: Recent Tasks Drawer + Chat Thread */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Collapsible Recent Tasks Drawer */}
          {showRecentTasks && (
            <div className="w-56 flex-shrink-0 border-r border-slate-border bg-slate-surface/40 flex flex-col overflow-hidden animate-in slide-in-from-left duration-150">
              <div className="p-2.5 border-b border-slate-border flex items-center justify-between text-xs font-mono text-slate-muted">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  Recent Tasks
                </span>
                {recentTasks.length > 0 && (
                  <button
                    type="button"
                    onClick={clearRecentTasks}
                    className="p-1 hover:text-rose-400 rounded transition-colors"
                    title="Clear history"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-none">
                {recentTasks.length === 0 ? (
                  <div className="text-[11px] text-slate-muted/60 p-3 text-center">
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
                      className="w-full text-left p-2 rounded hover:bg-slate-surface text-slate-muted hover:text-parchment transition-colors group"
                    >
                      <p className="text-xs truncate font-medium text-parchment/90">{t.prompt}</p>
                      <span className="text-[10px] text-slate-muted/50 font-mono">
                        {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Chat Stream Thread */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-obsidian/40">
            {messages.length === 0 ? (
              // Empty State & Presets
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none scrollbar-none">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-kie-violet/10 border border-kie-violet/20 flex items-center justify-center mb-2.5 sm:mb-3 flex-shrink-0">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-kie-violet" />
                </div>
                <h3 className="text-sm font-semibold text-parchment mb-1">How can I assist your document today?</h3>
                <p className="text-xs text-slate-muted max-w-sm mb-4 sm:mb-5 leading-relaxed">
                  Streaming contextual assistant powered by DeepSeek V4.1 Flash on KIE AI. Ask questions, draft recipes, generate code, or analyze text.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                  {PRESET_PROMPTS.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleSubmit(item.prompt)}
                      className="text-left p-2.5 rounded-lg bg-slate-shell/80 border border-slate-border hover:border-kie-violet/40 hover:bg-slate-surface text-xs text-slate-muted hover:text-parchment transition-all flex flex-col gap-1"
                    >
                      <span className="font-semibold text-parchment">{item.label}</span>
                      <span className="text-[10px] text-slate-muted/80 line-clamp-1">{item.prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // Message Stream List
              <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3.5 select-text">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[88%] rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-slate-surface border border-slate-border text-parchment font-medium shadow-sm'
                          : 'bg-slate-shell border border-slate-border/80 text-parchment shadow-md w-full'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div>
                          <div
                            className="prose-docuopsy prose-invert text-xs leading-relaxed select-text"
                            dangerouslySetInnerHTML={{
                              __html: sanitizeHtml(mdParser.render(msg.content || '...')),
                            }}
                          />

                          {/* Action Toolbar for Assistant Response */}
                          {msg.content && (
                            <div className="mt-2.5 pt-2 border-t border-slate-border/60 flex items-center justify-between text-[11px] text-slate-muted select-none">
                              <span className="font-mono text-[10px] opacity-50">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleCopyMessage(msg.id, msg.content)}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-surface text-slate-muted hover:text-parchment transition-colors"
                                  title="Copy text"
                                >
                                  {copiedId === msg.id ? (
                                    <Check className="w-3 h-3 text-emerald-verified" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                  <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleInsertAtCursor(msg.content)}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-kie-violet/10 text-kie-violet hover:bg-kie-violet/20 border border-kie-violet/30 transition-colors"
                                  title="Insert into document cursor"
                                >
                                  <ArrowDownToLine className="w-3 h-3" />
                                  <span>Insert at Cursor</span>
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
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Context-Aware Progress Bar */}
        {activeProgress && (
          <div className="flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 border-t border-slate-border bg-slate-surface/40 flex items-center gap-2.5 text-xs select-none">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-kie-violet/15 border border-kie-violet/30 text-kie-violet font-mono text-[10px] font-semibold uppercase tracking-wider animate-pulse">
              <BrainCircuit className="w-3 h-3" />
              <span>{activeProgress.stage}</span>
            </div>
            <span className="text-slate-muted truncate text-[11px]">
              {activeProgress.message}
            </span>
            <Loader2 className="w-3 h-3 text-kie-violet animate-spin ml-auto" />
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="flex-shrink-0 px-3 sm:px-4 py-2 border-t border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center justify-between gap-3">
            <span className="flex-1 text-[11px] leading-snug">{errorMessage}</span>
            {lastPrompt && (
              <button
                type="button"
                onClick={() => handleSubmit(lastPrompt)}
                disabled={isStreaming}
                className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-[11px] font-semibold transition-all whitespace-nowrap active:scale-95"
              >
                Coba Lagi
              </button>
            )}
          </div>
        )}

        {/* Input Bar */}
        <div className="flex-shrink-0 p-2.5 sm:p-3 border-t border-slate-border bg-slate-shell flex items-center gap-2">
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
            placeholder="Type prompt or task (e.g. buatkan resep puding coklat enak)..."
            disabled={isStreaming}
            className="flex-1 bg-slate-surface border border-slate-border focus:border-kie-violet focus:ring-1 focus:ring-kie-violet/40 rounded-lg px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs text-parchment placeholder:text-slate-muted outline-none transition-all"
          />

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isStreaming || !prompt.trim()}
            className="px-3 py-1.5 sm:py-2 rounded-lg bg-kie-violet hover:bg-kie-violet/90 disabled:opacity-40 disabled:hover:bg-kie-violet text-white transition-all flex items-center justify-center shadow-md shadow-kie-violet/20"
            title="Send task to AI (Enter)"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CornerDownLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
