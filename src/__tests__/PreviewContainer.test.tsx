import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PreviewContainer } from '../components/PreviewContainer';
import type { TabState } from '../types';

describe('PreviewContainer Component', () => {
  it('renders MarkdownPreview by default for untitled new document', () => {
    const tab: TabState = {
      id: 'tab-1',
      filePath: null,
      title: 'Untitled-1',
      isDirty: false,
      cursorLine: 1,
      cursorCol: 1,
      scrollTop: 0,
      draftPath: null,
      content: '# Hello Markdown',
    };

    render(<PreviewContainer tab={tab} />);
    expect(screen.getByText('Hello Markdown')).toBeInTheDocument();
  });

  it('renders MarkdownPreview for .md files', () => {
    const tab: TabState = {
      id: 'tab-2',
      filePath: 'D:/docs/notes.md',
      title: 'notes.md',
      isDirty: false,
      cursorLine: 1,
      cursorCol: 1,
      scrollTop: 0,
      draftPath: null,
      content: '## Secondary Section',
    };

    render(<PreviewContainer tab={tab} />);
    expect(screen.getByText('Secondary Section')).toBeInTheDocument();
  });

  it('renders CodePreview for code and text files (.json, .rs, .txt)', () => {
    const tab: TabState = {
      id: 'tab-3',
      filePath: 'D:/src/main.rs',
      title: 'main.rs',
      isDirty: false,
      cursorLine: 1,
      cursorCol: 1,
      scrollTop: 0,
      draftPath: null,
      content: 'fn main() {\n    println!("Docuopsy");\n}',
    };

    render(<PreviewContainer tab={tab} />);
    expect(screen.getByTestId('code-preview')).toBeInTheDocument();
    expect(screen.getByText(/main.rs \(Preview\)/i)).toBeInTheDocument();
  });
});

