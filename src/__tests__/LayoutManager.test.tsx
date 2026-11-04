import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { LayoutManager } from '../components/LayoutManager';
import { useTabStore } from '../store/tabStore';

describe('LayoutManager Component', () => {
  beforeEach(() => {
    useTabStore.setState({
      layoutMode: 'Split',
      splitRatio: 0.5,
      theme: 'dark',
    });
  });

  it('renders both editor and preview in Split mode', () => {
    render(
      <LayoutManager
        editor={<div data-testid="editor-slot">Editor Slot</div>}
        preview={<div data-testid="preview-slot">Preview Slot</div>}
      />
    );
    expect(screen.getByTestId('editor-slot')).toBeInTheDocument();
    expect(screen.getByTestId('preview-slot')).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('renders only editor in FullEditor mode', () => {
    useTabStore.setState({ layoutMode: 'FullEditor' });
    render(
      <LayoutManager
        editor={<div data-testid="editor-slot">Editor Slot</div>}
        preview={<div data-testid="preview-slot">Preview Slot</div>}
      />
    );
    expect(screen.getByTestId('editor-slot')).toBeInTheDocument();
    expect(screen.queryByTestId('preview-slot')).not.toBeInTheDocument();
  });

  it('renders only preview in FullPreview mode', () => {
    useTabStore.setState({ layoutMode: 'FullPreview' });
    render(
      <LayoutManager
        editor={<div data-testid="editor-slot">Editor Slot</div>}
        preview={<div data-testid="preview-slot">Preview Slot</div>}
      />
    );
    expect(screen.queryByTestId('editor-slot')).not.toBeInTheDocument();
    expect(screen.getByTestId('preview-slot')).toBeInTheDocument();
  });

  it('switches layout mode when toolbar button is clicked', () => {
    render(
      <LayoutManager
        editor={<div>Editor</div>}
        preview={<div>Preview</div>}
      />
    );
    const editorBtn = screen.getByLabelText('Full Editor Layout');
    fireEvent.click(editorBtn);

    expect(useTabStore.getState().layoutMode).toBe('FullEditor');
  });
});

