import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppMenu } from '../components/AppMenu';

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
});

