import { describe, it, expect, vi } from 'vitest';
import { logEvent } from '../api/logger';

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

