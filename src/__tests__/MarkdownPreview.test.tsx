import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MarkdownPreview } from '../components/MarkdownPreview';

describe('MarkdownPreview Anti-XSS Sanitization', () => {
  it('renders valid Markdown headers and paragraphs', () => {
    const md = '# Forensic Autopsy\nThis is a research document.';
    const { container } = render(<MarkdownPreview markdown={md} />);

    expect(container.querySelector('h1')).toHaveTextContent('Forensic Autopsy');
    expect(container.querySelector('p')).toHaveTextContent('This is a research document.');
  });

  it('neutralizes malicious script tags and onerror attributes', () => {
    const malicious = '### Injected Title\n<script>alert("xss")</script>\n<img src="invalid.png" onerror="alert(1)">';
    const { container } = render(<MarkdownPreview markdown={malicious} />);

    // Script tag must be removed
    expect(container.querySelector('script')).toBeNull();

    // Image onerror attribute must be removed
    const img = container.querySelector('img');
    expect(img?.getAttribute('onerror')).toBeNull();
  });
});

