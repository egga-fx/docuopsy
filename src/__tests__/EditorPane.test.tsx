import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { EditorPane } from '../components/EditorPane';
import { useTabStore } from '../store/tabStore';

describe('EditorPane Component', () => {
  beforeEach(() => {
    useTabStore.setState({
      tabs: [
        {
          id: 'test-tab',
          filePath: null,
          title: 'test.md',
          isDirty: false,
          cursorLine: 1,
          cursorCol: 1,
          scrollTop: 0,
          draftPath: null,
          content: 'Hello CodeMirror 6',
        },
      ],
      activeTabId: 'test-tab',
      theme: 'dark',
    });
  });

  it('mounts CodeMirror 6 editor container to DOM', () => {
    const { container } = render(<EditorPane />);
    expect(container.querySelector('.cm-editor')).toBeInTheDocument();
    expect(container.querySelector('.cm-content')).toBeInTheDocument();
  });
});

