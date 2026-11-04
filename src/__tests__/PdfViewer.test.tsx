import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PdfViewer } from '../components/PdfViewer';

describe('PdfViewer Component', () => {
  it('renders PDF controls toolbar with navigation and zoom buttons', () => {
    render(<PdfViewer filePath="sample.pdf" />);
    expect(screen.getByRole('toolbar', { name: 'pdf-controls' })).toBeInTheDocument();
    expect(screen.getByLabelText('Previous Page')).toBeInTheDocument();
    expect(screen.getByLabelText('Next Page')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom In')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom Out')).toBeInTheDocument();
  });
});

