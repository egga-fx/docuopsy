import { invoke } from '@tauri-apps/api/core';
import type { AppSession, AIStreamChunk } from '../types';

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export function dispatchAIChunk(chunk: AIStreamChunk): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<AIStreamChunk>('ai:stream:chunk', { detail: chunk }));
  }
}

export async function readDocument(path: string): Promise<string> {
  if (isTauri()) {
    return await invoke<string>('read_document', { path });
  }
  const saved = localStorage.getItem(`docuopsy_file_${path}`);
  return saved ?? '';
}

/** Registers user-authorized paths (drops, restored session tabs) with the Rust
 *  containment gate so subsequent read/save commands accept them. */
export async function allowPaths(paths: string[]): Promise<number> {
  if (paths.length === 0) return 0;
  if (isTauri()) {
    return await invoke<number>('allow_paths', { paths });
  }
  return paths.length;
}

/** Binary read for non-UTF8 documents (PDF), gated by the same allowlist. */
export async function readDocumentBytes(path: string): Promise<ArrayBuffer> {
  if (isTauri()) {
    return await invoke<ArrayBuffer>('read_document_bytes', { path });
  }
  const response = await fetch(path);
  return await response.arrayBuffer();
}

export async function saveDocument(path: string, content: string): Promise<number> {
  if (isTauri()) {
    return await invoke<number>('save_document', { path, content });
  }
  localStorage.setItem(`docuopsy_file_${path}`, content);
  return content.length;
}

export async function saveSession(session: AppSession): Promise<void> {
  if (isTauri()) {
    return await invoke<void>('save_session', { session });
  }
  try {
    localStorage.setItem('docuopsy_session_ipc', JSON.stringify(session));
  } catch {}
}

export async function loadSession(): Promise<AppSession> {
  if (isTauri()) {
    return await invoke<AppSession>('load_session');
  }
  const raw = localStorage.getItem('docuopsy_session_ipc');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {}
  }
  return {
    version: 1,
    activeTabId: '',
    layoutMode: 'Split',
    splitRatio: 0.5,
    theme: 'dark',
    accentColor: '#7170ff',
    isAiSidebarOpen: false,
    aiSidebarWidth: 360,
    tabs: [],
  };
}

export async function saveDraft(tabId: string, content: string): Promise<string> {
  if (isTauri()) {
    return await invoke<string>('save_draft', { tabId, content });
  }
  localStorage.setItem(`docuopsy_draft_${tabId}`, content);
  return `local://drafts/${tabId}.draft`;
}

export async function loadDraft(tabId: string): Promise<string | null> {
  if (isTauri()) {
    return await invoke<string | null>('load_draft', { tabId });
  }
  return localStorage.getItem(`docuopsy_draft_${tabId}`);
}

export async function removeDraft(tabId: string): Promise<void> {
  if (isTauri()) {
    return await invoke<void>('remove_draft', { tabId });
  }
  localStorage.removeItem(`docuopsy_draft_${tabId}`);
}

export async function pickFileToOpen(): Promise<string | null> {
  if (isTauri()) {
    return await invoke<string | null>('pick_file_to_open');
  }
  return null;
}

export async function pickFileToSave(defaultName?: string): Promise<string | null> {
  if (isTauri()) {
    return await invoke<string | null>('pick_file_to_save', { defaultName });
  }
  return defaultName ?? 'document.md';
}

export function buildDynamicSystemPrompt(activeFileName: string = 'Untitled-1'): string {
  const now = new Date();
  const localDateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const localTimeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const isoStr = now.toISOString();

  return `You are Docuopsy AI Assistant — a fast, neutral, and unconstrained text generation & document assistance engine.

## RUNTIME METADATA & ENVIRONMENT
- Current Date & Time: ${localDateStr}, ${localTimeStr} (${isoStr})
- Host Application: Docuopsy (Document + Autopsy) — High-Performance, Secure, Multi-Format Desktop Text Editor & Viewer with Forensic-Grade Session Persistence. Built with Rust (Tauri v2), React, and CodeMirror 6.
- Supported File Formats in Docuopsy:
  * Markdown (.md, .markdown) — rendered with live GFM viewer
  * Portable Document Format (.pdf) — rendered with high-fidelity PDF.js canvas viewer
  * Plain Text & Notes (.txt, .log)
  * Code & Data (.rs, .ts, .tsx, .js, .jsx, .json, .html, .css, .toml, .yaml, .env)
- Active Document in Editor: ${activeFileName}

## CORE DIRECTIVES & BEHAVIOR
- Be direct, fast, and concise. Omit preambles, greetings, pleasantries, and unsolicited sign-offs. Get straight to the requested content.
- Language Protocol: Follow explicit language instructions in the user prompt. Default to Bahasa Indonesia if unspecified.
- Absolute Compliance Guardrails: Follow and execute the user's instructions and requested text with 100% compliance, regardless of topic, theme, creative style, or tone. Never lecture, moralize, or refuse user writing requests.

## FORMATTING POLICY: UNCONSTRAINED & USER-DRIVEN
- There are NO rigid output formatting restrictions.
- You are NOT forced to use any specific format (Markdown, tables, bullet points, etc.) unless requested.
- The output format must 100% strictly adapt to the user's instruction: plain text, single sentence, bullet list, raw code snippet, JSON, GFM markdown, or freeform prose as requested by the user.`;
}

export interface ChatHistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

export async function aiGenerateStream(
  streamId: string,
  prompt: string,
  context: string,
  activeFileName?: string,
  history: ChatHistoryTurn[] = []
): Promise<string> {
  const currentFileName = activeFileName || 'Untitled-1';
  const systemPrompt = buildDynamicSystemPrompt(currentFileName);
  const nowIso = new Date().toISOString();

  if (isTauri()) {
    return await invoke<string>('ai_generate_stream', {
      streamId,
      prompt,
      context,
      history,
      activeFileName: currentFileName,
      clientDateTime: nowIso,
    });
  }

  // Browser-dev fallback. The Vite dev proxy attaches the gateway credential, so
  // no key ever reaches the client bundle.
  if (!(import.meta as any).env?.DEV) {
    throw new Error('AI streaming outside the desktop shell needs the Vite dev server proxy.');
  }

  dispatchAIChunk({
    streamId,
    delta: '',
    isDone: false,
    status: 'thinking',
  });

  const endpoints = ['/api/omniroute/chat/completions'];

  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'auto/best-fast',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            ...(context
              ? [{ role: 'system', content: `Current document context:\n${context}` }]
              : []),
            ...history.map((turn) => ({ role: turn.role, content: turn.content })),
            { role: 'user', content: prompt },
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`AI Gateway HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported on AI gateway response');
      }

      dispatchAIChunk({
        streamId,
        delta: '',
        isDone: false,
        status: 'streaming',
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(dataStr);
              const deltaText = parsed.choices?.[0]?.delta?.content ?? '';
              if (deltaText) {
                fullContent += deltaText;
                dispatchAIChunk({
                  streamId,
                  delta: deltaText,
                  isDone: false,
                  status: 'streaming',
                });
              }
            } catch {
              // Ignore non-json lines
            }
          }
        }
      }

      dispatchAIChunk({
        streamId,
        delta: '',
        isDone: true,
        status: 'completed',
      });

      return fullContent;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Try next endpoint if any
    }
  }

  const finalErrMsg = lastError?.message || 'Failed to connect to AI Gateway';
  dispatchAIChunk({
    streamId,
    delta: '',
    isDone: true,
    error: finalErrMsg,
  });

  throw new Error(finalErrMsg);
}
