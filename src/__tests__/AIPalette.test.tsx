import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AIPalette } from '../components/AIPalette';

describe('AIPalette Component', () => {
  it('renders prompt input and preset options when open', () => {
    render(<AIPalette isOpen={true} onClose={() => {}} />);
    expect(screen.getByRole('complementary', { name: 'AI Assistant' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type prompt or task/i)).toBeInTheDocument();
    expect(screen.getByText('Continue Writing')).toBeInTheDocument();
    expect(screen.getByText('Summarize')).toBeInTheDocument();
    expect(screen.getByText('Fix Grammar & Polish')).toBeInTheDocument();
    expect(screen.getByText('Explain Code / Text')).toBeInTheDocument();
    expect(screen.getByTitle('Recent Tasks')).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<AIPalette isOpen={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});

