import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { AIPalette } from '../components/AIPalette';

describe('AIPalette Component', () => {
  beforeEach(() => {
    localStorage.removeItem('docuopsy_recent_tasks');
  });

  it('renders prompt input and preset options when open', () => {
    render(<AIPalette isOpen={true} onClose={() => {}} />);
    expect(screen.getByRole('complementary', { name: 'AI Assistant' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type prompt or task/i)).toBeInTheDocument();
    expect(screen.getByText('Continue Writing')).toBeInTheDocument();
    expect(screen.getByText('Summarize')).toBeInTheDocument();
    expect(screen.getByText('Fix Grammar & Polish')).toBeInTheDocument();
    expect(screen.queryByText('Explain Code / Text')).not.toBeInTheDocument();
    expect(screen.getByTitle('Recent Sessions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Session/i })).toBeInTheDocument();
  });

  it('quick prompt fills the input instead of running the task', () => {
    render(<AIPalette isOpen={true} onClose={() => {}} />);
    fireEvent.click(screen.getByText('Summarize'));
    expect(screen.getByPlaceholderText(/Type prompt or task/i)).toHaveValue(
      'Summarize the document key points into a structured GFM Markdown outline.'
    );
  });

  it('recent button opens a bubble listing at most five sessions plus show-all', () => {
    localStorage.setItem(
      'docuopsy_recent_tasks',
      JSON.stringify(
        Array.from({ length: 7 }, (_, i) => ({
          id: `task-${i}`,
          prompt: `Session ${i}`,
          timestamp: Date.now() - i,
          preview: `Session ${i}`,
        }))
      )
    );
    render(<AIPalette isOpen={true} onClose={() => {}} />);
    fireEvent.click(screen.getByTitle('Recent Sessions'));

    expect(screen.getByRole('dialog', { name: 'Recent Sessions' })).toBeInTheDocument();
    for (let i = 0; i < 5; i++) {
      expect(screen.getByText(`Session ${i}`)).toBeInTheDocument();
    }
    expect(screen.queryByText('Session 5')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/Show all sessions \(7\)/i));
    expect(screen.getByText('Session 6')).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<AIPalette isOpen={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('clicking New Session button resets conversation state', () => {
    render(<AIPalette isOpen={true} onClose={() => {}} />);
    const newSessionBtn = screen.getByRole('button', { name: /New Session/i });
    expect(newSessionBtn).toBeInTheDocument();
    fireEvent.click(newSessionBtn);
    expect(screen.getByPlaceholderText(/Type prompt or task/i)).toBeInTheDocument();
  });
});


