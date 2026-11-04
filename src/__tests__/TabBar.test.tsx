import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { TabBar } from '../components/TabBar';
import { useTabStore } from '../store/tabStore';

describe('TabBar Component', () => {
  beforeEach(() => {
    useTabStore.setState({
      tabs: [
        {
          id: 'tab-1',
          filePath: '/path/test.md',
          title: 'test.md',
          isDirty: true,
          cursorLine: 1,
          cursorCol: 1,
          scrollTop: 0,
          draftPath: null,
          content: '# Test',
        },
        {
          id: 'tab-2',
          filePath: null,
          title: 'sample.pdf',
          isDirty: false,
          cursorLine: 1,
          cursorCol: 1,
          scrollTop: 0,
          draftPath: null,
          content: '',
        },
      ],
      activeTabId: 'tab-1',
      layoutMode: 'Split',
    });
  });

  it('renders tab titles and dirty badge correctly', () => {
    render(<TabBar />);
    expect(screen.getByText('test.md')).toBeInTheDocument();
    expect(screen.getByText('sample.pdf')).toBeInTheDocument();
    expect(screen.getByLabelText('dirty-indicator')).toBeInTheDocument();
  });

  it('switches active tab when clicked', () => {
    render(<TabBar />);
    const pdfTab = screen.getByText('sample.pdf');
    fireEvent.click(pdfTab);

    expect(useTabStore.getState().activeTabId).toBe('tab-2');
  });

  it('creates a new tab when plus button is clicked', () => {
    render(<TabBar />);
    const plusBtn = screen.getByLabelText('New scratch document');
    fireEvent.click(plusBtn);

    expect(useTabStore.getState().tabs.length).toBe(3);
  });
});

