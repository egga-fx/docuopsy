import { invoke } from '@tauri-apps/api/core';
import type { AppSession } from '../types';

export async function readDocument(path: string): Promise<string> {
  return await invoke<string>('read_document', { path });
}

export async function saveDocument(path: string, content: string): Promise<number> {
  return await invoke<number>('save_document', { path, content });
}

export async function saveSession(session: AppSession): Promise<void> {
  return await invoke<void>('save_session', { session });
}

export async function loadSession(): Promise<AppSession> {
  return await invoke<AppSession>('load_session');
}

export async function saveDraft(tabId: string, content: string): Promise<string> {
  return await invoke<string>('save_draft', { tabId, content });
}

export async function loadDraft(tabId: string): Promise<string | null> {
  return await invoke<string | null>('load_draft', { tabId });
}

export async function removeDraft(tabId: string): Promise<void> {
  return await invoke<void>('remove_draft', { tabId });
}

export async function aiGenerateStream(
  streamId: string,
  prompt: string,
  context: string
): Promise<void> {
  return await invoke<void>('ai_generate_stream', { streamId, prompt, context });
}

