import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App Root Assembly Component', () => {
  it('renders top tab bar, workspace, and telemetry status footer', () => {
    render(<App />);

    // Tab bar and Application Menu rendered
    expect(screen.getByRole('tablist', { name: 'Document Tabs' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Application Menu' })).toBeInTheDocument();

    // Telemetry footer rendered
    expect(screen.getByTitle(/Toggle AI Assistant \(Ctrl\+K\)/i)).toBeInTheDocument();
    expect(screen.getByText(/UTF-8/i)).toBeInTheDocument();
  }, 15000);
});

