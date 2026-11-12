import { describe, it, expect } from 'vitest';
import { Extension } from '@codemirror/state';
import { getLanguageExtension, resolveLanguageExtension } from '../editor/extensions';

const isEmpty = (ext: Extension) => Array.isArray(ext) && ext.length === 0;

describe('editor language resolution', () => {
  it('resolves grammars outside the eager set', async () => {
    expect(isEmpty(getLanguageExtension('script.py'))).toBe(true);
    expect(isEmpty(await resolveLanguageExtension('script.py'))).toBe(false);
    expect(isEmpty(await resolveLanguageExtension('config.yaml'))).toBe(false);
  });

  it('keeps the synchronous mapping for common documents', async () => {
    for (const name of ['notes.md', 'data.json', 'main.rs', 'app.ts']) {
      expect(isEmpty(getLanguageExtension(name))).toBe(false);
      expect(isEmpty(await resolveLanguageExtension(name))).toBe(false);
    }
  });

  it('stays empty for files with no grammar', async () => {
    expect(isEmpty(await resolveLanguageExtension('LICENSE'))).toBe(true);
  });
});
