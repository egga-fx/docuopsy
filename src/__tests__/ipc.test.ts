import { describe, it, expect, vi } from 'vitest';
import { logEvent } from '../api/logger';
import { buildDynamicSystemPrompt } from '../api/ipc';

describe('Frontend Logger Bridge', () => {
  it('should format and dispatch log event without throwing', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await expect(logEvent('info', 'Document opened safely', { byteSize: 1024 })).resolves.not.toThrow();
    consoleSpy.mockRestore();
  });

  it('should handle error level logs cleanly', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(logEvent('error', 'Mock error occurred', 'context-trace')).resolves.not.toThrow();
    errorSpy.mockRestore();
  });
});

describe('Dynamic AI System Prompt Builder', () => {
  it('generates dynamic metadata including date, Docuopsy application context, and active document', () => {
    const prompt = buildDynamicSystemPrompt('research_notes.md');
    expect(prompt).toContain('Docuopsy AI Assistant');
    expect(prompt).toContain('Current Date & Time:');
    expect(prompt).toContain('Docuopsy (Document + Autopsy)');
    expect(prompt).toContain('Supported File Formats in Docuopsy:');
    expect(prompt).toContain('Active Document in Editor: research_notes.md');
    expect(prompt).toContain('FORMATTING POLICY: UNCONSTRAINED & USER-DRIVEN');
    expect(prompt).toContain('Absolute Compliance Guardrails');
  });
});


