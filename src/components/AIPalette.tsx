import React, { useState, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { aiGenerateStream } from '../api/ipc';
import { Sparkles, X, CornerDownLeft, Loader2 } from 'lucide-react';
import type { AIStreamChunk } from '../types';
import type { EditorView } from '@codemirror/view';

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

export const AIPalette: React.FC<AIPaletteProps> = ({ isOpen, onClose, editorView }) => {
  const [prompt, setPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let unlistenFn: (() => void) | null = null;

    async function setupListener() {
      try {
        if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
          const unlisten = await listen<AIStreamChunk>('ai:stream:chunk', (event) => {
            const chunk = event.payload;

            if (chunk.error) {
              setErrorMessage(chunk.error);
              setIsStreaming(false);
              return;
            }

            if (chunk.delta && editorView) {
              // Insert token into CodeMirror editor at cursor
              const selection = editorView.state.selection.main;
              editorView.dispatch({
                changes: { from: selection.to, insert: chunk.delta },
                selection: { anchor: selection.to + chunk.delta.length },
                scrollIntoView: true,
              });
            }

            if (chunk.isDone) {
              setIsStreaming(false);
              onClose();
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
    }

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, [isOpen, editorView, onClose]);

  const handleSubmit = async (selectedPrompt?: string) => {
    const finalPrompt = selectedPrompt || prompt;
    if (!finalPrompt.trim() || isStreaming) return;

    setIsStreaming(true);
    setErrorMessage(null);

    const streamId = `stream-${Date.now()}`;
    const context = editorView ? editorView.state.doc.toString() : '';

    try {
      await aiGenerateStream(streamId, finalPrompt, context);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setIsStreaming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-obsidian/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4 select-none">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="AI Assistant"
        className="w-full max-w-xl bg-slate-shell border border-slate-border rounded-lg shadow-2xl p-4 flex flex-col gap-3 font-sans"
      >
        {/* Header Row */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-muted">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-kie-violet" />
            <span className="font-semibold text-parchment">AI Assistant</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-surface text-[10px] text-kie-violet border border-kie-violet/30">
              claude-haiku-5-5
            </span>
          </div>
          <button
            type="button"
            aria-label="Close Assistant"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-surface text-slate-muted hover:text-parchment"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Input Field */}
        <div className="flex items-center gap-2 bg-slate-surface border border-slate-border focus-within:border-kie-violet focus-within:ring-1 focus-within:ring-kie-violet/40 rounded-md px-3 py-2 transition-all">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
            placeholder="Ask AI to continue, summarize, or edit manuscript..."
            disabled={isStreaming}
            className="flex-1 bg-transparent border-none outline-none text-sm text-parchment placeholder:text-slate-muted"
            autoFocus
          />
          <button
            type="button"
            aria-label="Submit Prompt"
            onClick={() => handleSubmit()}
            disabled={isStreaming || !prompt.trim()}
            className="p-1.5 bg-kie-violet text-white rounded hover:bg-kie-violet/90 disabled:opacity-30 transition-opacity"
          >
            {isStreaming ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CornerDownLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Preset Action Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {PRESET_PROMPTS.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={isStreaming}
              onClick={() => handleSubmit(item.prompt)}
              className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-surface border border-slate-border hover:border-kie-violet text-slate-muted hover:text-parchment transition-colors disabled:opacity-40"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Error message beacon */}
        {errorMessage && (
          <div className="text-crimson-alert text-xs font-mono p-2 rounded bg-crimson-alert/10 border border-crimson-alert/30">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
};

