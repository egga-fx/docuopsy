import { EditorView, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, keymap } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
import { markdown } from '@codemirror/lang-markdown';
import { json } from '@codemirror/lang-json';
import { rust } from '@codemirror/lang-rust';
import { javascript } from '@codemirror/lang-javascript';

export function getLanguageExtension(filename: string): Extension {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) {
    return markdown();
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

export const darkForensicsTheme = EditorView.theme(
  {
    '&': {
      color: '#ECF2F8',
      backgroundColor: '#0B0F14',
      height: '100%',
      fontFamily: "'JetBrains Mono', Consolas, monospace",
      fontSize: '13px',
    },
    '.cm-content': {
      caretColor: '#0E9F8A',
      padding: '12px 0',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#0E9F8A',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(14, 159, 138, 0.30)',
    },
    '.cm-gutters': {
      backgroundColor: '#111722',
      color: '#94A6BE',
      borderRight: '1px solid #243044',
      fontVariantNumeric: 'tabular-nums',
      paddingRight: '6px',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#18202F',
      color: '#0E9F8A',
      fontWeight: 'bold',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(24, 32, 47, 0.40)',
    },
    '.cm-line': {
      padding: '0 16px',
    },
  },
  { dark: true }
);

export const lightVellumTheme = EditorView.theme(
  {
    '&': {
      color: '#12161F',
      backgroundColor: '#FAF7F0',
      height: '100%',
      fontFamily: "'JetBrains Mono', Consolas, monospace",
      fontSize: '13px',
    },
    '.cm-content': {
      caretColor: '#0B7A6A',
      padding: '12px 0',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#0B7A6A',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(11, 122, 106, 0.25)',
    },
    '.cm-gutters': {
      backgroundColor: '#F0ECE1',
      color: '#4A5568',
      borderRight: '1px solid #CFC7B4',
      fontVariantNumeric: 'tabular-nums',
      paddingRight: '6px',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#E5DFD0',
      color: '#0B7A6A',
      fontWeight: 'bold',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(229, 223, 208, 0.50)',
    },
    '.cm-line': {
      padding: '0 16px',
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

