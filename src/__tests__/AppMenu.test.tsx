import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppMenu } from '../components/AppMenu';
import { useTabStore } from '../store/tabStore';

function openOptions() {
  render(
    <AppMenu
      onNewFile={vi.fn()}
      onOpenFile={vi.fn()}
      onSave={vi.fn()}
      onSaveAs={vi.fn()}
      onCloseTab={vi.fn()}
      onOpenAI={vi.fn()}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Application Menu' }));
  fireEvent.click(screen.getByRole('button', { name: 'Options' }));
}

describe('AppMenu Component', () => {
  it('renders hamburger menu button and toggles menu on click', () => {
    render(
      <AppMenu
        onNewFile={vi.fn()}
        onOpenFile={vi.fn()}
        onSave={vi.fn()}
        onSaveAs={vi.fn()}
        onCloseTab={vi.fn()}
        onOpenAI={vi.fn()}
      />
    );

    const button = screen.getByRole('button', { name: 'Application Menu' });
    expect(button).toBeInTheDocument();

    // Initially menu is closed
    expect(screen.queryByRole('menu', { name: 'Main Menu' })).not.toBeInTheDocument();

    // Click to open
    fireEvent.click(button);
    expect(screen.getByRole('menu', { name: 'Main Menu' })).toBeInTheDocument();
    expect(screen.getByText('New File')).toBeInTheDocument();
    expect(screen.getByText('Open File...')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Save As...')).toBeInTheDocument();
  });

  it('switches between File, Edit, and View tabs', () => {
    const handleOpenAI = vi.fn();
    render(
      <AppMenu
        onNewFile={vi.fn()}
        onOpenFile={vi.fn()}
        onSave={vi.fn()}
        onSaveAs={vi.fn()}
        onCloseTab={vi.fn()}
        onOpenAI={handleOpenAI}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Application Menu' }));

    // Switch to Edit tab
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByText('Undo')).toBeInTheDocument();
    expect(screen.getByText('Redo')).toBeInTheDocument();
    expect(screen.getByText('Cut')).toBeInTheDocument();

    // Switch to View tab
    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    expect(screen.getByText('Split Mode')).toBeInTheDocument();
    expect(screen.getByText('Editor Only')).toBeInTheDocument();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();

    // Click AI Assistant
    fireEvent.click(screen.getByText('AI Assistant'));
    expect(handleOpenAI).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu', { name: 'Main Menu' })).not.toBeInTheDocument();
  });

  it('toggles the theme from Options and removes the duplicate View action', () => {
    useTabStore.setState({ theme: 'dark' });
    openOptions();
    fireEvent.click(screen.getByRole('button', { name: 'Toggle Theme' }));
    expect(useTabStore.getState().theme).toBe('light');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Application Menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Toggle Theme' }));
    expect(useTabStore.getState().theme).toBe('dark');
    fireEvent.click(screen.getByRole('button', { name: 'Application Menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    expect(screen.queryByRole('button', { name: /Toggle Theme/ })).not.toBeInTheDocument();
  });

  it('changes preset and custom accent colors inside Options', () => {
    useTabStore.setState({ accentColor: '#7170ff' });
    openOptions();
    expect(screen.getByRole('button', { name: 'Electric Indigo' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Violet' }));
    expect(useTabStore.getState().accentColor).toBe('#7C5CFC');
    expect(screen.getByRole('button', { name: 'Violet' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.change(screen.getByLabelText('Custom Hex Color'), { target: { value: '#123456' } });
    expect(useTabStore.getState().accentColor).toBe('#123456');
    expect(screen.getByText('#123456')).toBeInTheDocument();
  });

  it('dismisses Options on Escape and outside click', () => {
    openOptions();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Application Menu' }));
    expect(screen.getByLabelText('Custom Hex Color')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

