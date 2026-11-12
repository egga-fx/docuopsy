import { EditorView, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, keymap } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, LanguageDescription } from '@codemirror/language';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { json } from '@codemirror/lang-json';
import { rust } from '@codemirror/lang-rust';
import { javascript } from '@codemirror/lang-javascript';
import { languages } from '@codemirror/language-data';

export function getLanguageExtension(filename: string): Extension {
  const lower = filename.toLowerCase();
  // Markdown keeps fenced-code highlighting by resolving nested blocks against
  // the full language-data registry rather than a hard-coded subset.
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) {
    return markdown({ base: markdownLanguage, codeLanguages: languages });
  }
  if (lower.endsWith('.json')) {
    return json();
  }
  if (lower.endsWith('.rs')) {
    return rust();
  }
  if (lower.endsWith('.js') || lower.endsWith('.ts') || lower.endsWith('.tsx') || lower.endsWith('.jsx')) {
    return javascript();
  }
  return [];
}

/**
 * Everything getLanguageExtension covers plus the remaining grammars, whose
 * parsers are lazily fetched, so callers must apply the result asynchronously.
 */
export async function resolveLanguageExtension(filename: string): Promise<Extension> {
  const eager = getLanguageExtension(filename);
  if (!Array.isArray(eager)) {
    return eager;
  }
  const match = LanguageDescription.matchFilename(languages, filename);
  if (!match) return [];
  try {
    // `description.support` is only populated by load(); awaiting it directly yields undefined.
    const loaded = await match.load();
    return loaded?.extension ?? [];
  } catch {
    return [];
  }
}

export const darkForensicsTheme = EditorView.theme(
  {
    '&': {
      color: '#f7f8f8',
      backgroundColor: '#08090a',
      height: '100%',
      fontFamily: "'Berkeley Mono', 'JetBrains Mono', Consolas, monospace",
      fontSize: '13px',
      letterSpacing: '0px',
    },
    '.cm-content': {
      caretColor: '#7170ff',
      padding: '16px 0',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#7170ff',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(113, 112, 255, 0.25)',
    },
    '.cm-gutters': {
      backgroundColor: '#08090a',
      color: '#8a9099',
      borderRight: '1px solid rgba(255, 255, 255, 0.078)',
      fontVariantNumeric: 'tabular-nums',
      paddingRight: '10px',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#0f1011',
      color: '#7170ff',
      fontWeight: '510',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    '.cm-line': {
      padding: '0 20px',
      lineHeight: '20px',
    },
  },
  { dark: true }
);

export const lightVellumTheme = EditorView.theme(
  {
    '&': {
      color: '#08090a',
      backgroundColor: '#f7f8f8',
      height: '100%',
      fontFamily: "'Berkeley Mono', 'JetBrains Mono', Consolas, monospace",
      fontSize: '13px',
      letterSpacing: '0px',
    },
    '.cm-content': {
      caretColor: '#7170ff',
      padding: '16px 0',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#7170ff',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(113, 112, 255, 0.20)',
    },
    '.cm-gutters': {
      backgroundColor: '#efeff0',
      color: '#8a9099',
      borderRight: '1px solid rgba(0, 0, 0, 0.08)',
      fontVariantNumeric: 'tabular-nums',
      paddingRight: '10px',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#e5e5e6',
      color: '#7170ff',
      fontWeight: '510',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
    },
    '.cm-line': {
      padding: '0 20px',
      lineHeight: '20px',
    },
  },
  { dark: false }
);

export const baseEditorExtensions: Extension[] = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  drawSelection(),
  bracketMatching(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  keymap.of([...defaultKeymap, ...historyKeymap]),
];
