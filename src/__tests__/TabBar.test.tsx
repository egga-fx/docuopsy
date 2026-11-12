import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TabBar } from '../components/TabBar';
import { useTabStore } from '../store/tabStore';

/** jsdom ships no PointerEvent, so a mouse-shaped event carries the pointer fields. */
function pointer(el: Element, type: string, init: { clientX: number; buttons: number }) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, ...init });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  el.dispatchEvent(event);
}

function makePannable() {
  const strip = screen.getByRole('tablist') as HTMLElement;
  Object.defineProperty(strip, 'scrollWidth', { value: 2000, configurable: true });
  Object.defineProperty(strip, 'clientWidth', { value: 400, configurable: true });
  strip.setPointerCapture = () => {};
  return strip;
}

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

  it('exposes a window grip as the leftmost header element', () => {
    const { container } = render(<TabBar />);
    const grip = screen.getByLabelText('Drag to move the window');
    expect(grip).toHaveAttribute('data-tauri-drag-region');
    expect(container.firstChild?.childNodes[0]).toBe(grip);
    expect(grip).toHaveClass('cursor-default');
    expect(grip).not.toHaveClass('cursor-grab', 'active:cursor-grabbing');
    expect(grip.querySelector('svg')).toHaveClass('opacity-50', 'pointer-events-none');
  });

  it('makes empty tab-strip space draggable without panning or capturing the pointer', () => {
    render(<TabBar />);
    const strip = makePannable();
    const capture = vi.fn();
    strip.setPointerCapture = capture;
    expect(strip).toHaveAttribute('data-tauri-drag-region');
    expect(strip).toHaveClass('cursor-default');
    expect(strip).not.toHaveClass('cursor-grab', 'active:cursor-grabbing');

    pointer(strip, 'pointerdown', { clientX: 300, buttons: 1 });
    pointer(strip, 'pointermove', { clientX: 200, buttons: 1 });
    pointer(strip, 'pointerup', { clientX: 200, buttons: 0 });
    expect(strip.scrollLeft).toBe(0);
    expect(capture).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('sample.pdf'));
    expect(useTabStore.getState().activeTabId).toBe('tab-2');
  });

  it('keeps tab controls and rename fields out of native drag regions', () => {
    render(<TabBar />);
    for (const element of screen.getAllByRole('tab').concat(screen.getAllByRole('button'))) {
      expect(element).not.toHaveAttribute('data-tauri-drag-region');
    }
    fireEvent.doubleClick(screen.getAllByRole('tab')[0]);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('data-tauri-drag-region');
  });

  it('pans the tab strip on hold-and-move and suppresses the trailing click', () => {
    render(<TabBar />);
    const strip = makePannable();

    pointer(screen.getByText('sample.pdf'), 'pointerdown', { clientX: 300, buttons: 1 });
    pointer(strip, 'pointermove', { clientX: 200, buttons: 1 });
    expect(strip.scrollLeft).toBe(100);

    pointer(strip, 'pointerup', { clientX: 200, buttons: 0 });
    fireEvent.click(screen.getByText('sample.pdf'));
    expect(useTabStore.getState().activeTabId).toBe('tab-1');
  });

  it('keeps a plain click usable for switching tabs', () => {
    render(<TabBar />);
    const strip = makePannable();

    pointer(screen.getByText('sample.pdf'), 'pointerdown', { clientX: 300, buttons: 1 });
    pointer(strip, 'pointerup', { clientX: 300, buttons: 0 });
    fireEvent.click(screen.getByText('sample.pdf'));
    expect(useTabStore.getState().activeTabId).toBe('tab-2');
  });

  it('releases its drag listeners when the pointer is lost or the bar unmounts', () => {
    const { unmount } = render(<TabBar />);
    const strip = makePannable();

    // mouseup never arrives: the released button is detected on the next move
    pointer(screen.getByText('sample.pdf'), 'pointerdown', { clientX: 300, buttons: 1 });
    pointer(strip, 'pointermove', { clientX: 200, buttons: 0 });
    expect(strip.scrollLeft).toBe(0);
    pointer(strip, 'pointermove', { clientX: 100, buttons: 1 });
    expect(strip.scrollLeft).toBe(0);

    pointer(screen.getByText('sample.pdf'), 'pointerdown', { clientX: 300, buttons: 1 });
    unmount();
    pointer(strip, 'pointermove', { clientX: 100, buttons: 1 });
    expect(strip.scrollLeft).toBe(0);
  });
});

