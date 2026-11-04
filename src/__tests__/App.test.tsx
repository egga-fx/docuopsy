import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App Root Assembly Component', () => {
  it('renders top tab bar, workspace, and telemetry status footer', () => {
    render(<App />);

    // Tab bar rendered
    expect(screen.getByRole('tablist', { name: 'Document Tabs' })).toBeInTheDocument();

    // Telemetry footer rendered
    expect(screen.getByText(/KIE AI: claude-haiku-5-5/i)).toBeInTheDocument();
    expect(screen.getByText(/UTF-8/i)).toBeInTheDocument();
  });
});

