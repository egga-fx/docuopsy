import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, vi } from 'vitest';
import { WindowControls } from '../components/WindowControls';
import { handleCloseRequest } from '../api/window';
import { useTabStore } from '../store/tabStore';

interface InvokeCall {
  cmd: string;
  payload?: Record<string, unknown>;
}

type Internals = {
  metadata: Record<string, unknown>;
  transformCallback: (cb: unknown) => number;
  invoke: (cmd: string, payload?: Record<string, unknown>) => Promise<unknown>;
};

const internals: Internals = {
  metadata: {
    currentWindow: { label: 'main' },
    currentWebview: { label: 'main' },
    currentTags: [],
  },
  transformCallback: () => 1,
  invoke: async () => undefined,
};

function installFakeTauri(initial: { fullscreen?: boolean; maximized?: boolean } = {}) {
  const calls: InvokeCall[] = [];
  let fullscreen = initial.fullscreen ?? false;
  const maximized = initial.maximized ?? false;

  internals.invoke = async (cmd: string, payload?: Record<string, unknown>) => {
    calls.push({ cmd, payload });
    if (cmd.endsWith('is_fullscreen')) return fullscreen;
    if (cmd.endsWith('set_fullscreen')) {
      fullscreen = Boolean(payload?.fullscreen ?? payload?.value ?? !fullscreen);
      return undefined;
    }
    if (cmd.endsWith('is_maximized')) return maximized;
    return undefined;
  };

  return {
    calls,
    commands: () => calls.map((call) => call.cmd),
    listenedEvents: () =>
      calls.filter((call) => call.cmd === 'plugin:event|listen').map((call) => call.payload?.event),
    isFullscreen: () => fullscreen,
  };
}

beforeAll(() => {
  const host = window as unknown as Record<string, unknown>;
  host.__TAURI_INTERNALS__ = internals;
  host.__TAURI_EVENT_PLUGIN_INTERNALS__ = { unregisterListener: () => {} };
});

afterAll(() => {
  const host = window as unknown as Record<string, unknown>;
  delete host.__TAURI_INTERNALS__;
  delete host.__TAURI_EVENT_PLUGIN_INTERNALS__;
});

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  internals.invoke = async () => undefined;
  vi.restoreAllMocks();
  cleanup();
});

describe('WindowControls (custom chrome for the undecorated window)', () => {
  it('renders exactly minimize, fullscreen and close as icon-only buttons', () => {
    installFakeTauri();
    render(<WindowControls />);

    expect(screen.getByRole('group', { name: 'Window controls' })).toBeInTheDocument();
    expect(screen.getByLabelText('Minimize window')).toBeInTheDocument();
    expect(screen.getByLabelText('Enter fullscreen')).toBeInTheDocument();
    expect(screen.getByLabelText('Close window')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('issues the native minimize command', async () => {
    const fake = installFakeTauri();
    render(<WindowControls />);

    fireEvent.click(screen.getByLabelText('Minimize window'));

    await waitFor(() => expect(fake.commands()).toContain('plugin:window|minimize'));
  });

  it('enters fullscreen from the window state and flips the icon', async () => {
    const fake = installFakeTauri({ fullscreen: false });
    render(<WindowControls />);

    await waitFor(() => expect(screen.getByLabelText('Enter fullscreen')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Enter fullscreen'));

    await waitFor(() => expect(fake.isFullscreen()).toBe(true));
    expect(fake.commands()).toContain('plugin:window|set_fullscreen');
    await waitFor(() => expect(screen.getByLabelText('Exit fullscreen')).toBeInTheDocument());
    expect(screen.getByLabelText('Exit fullscreen')).toHaveAttribute('aria-pressed', 'true');
  });

  it('exits fullscreen when it is already fullscreen', async () => {
    const fake = installFakeTauri({ fullscreen: true });
    render(<WindowControls />);

    await waitFor(() => expect(screen.getByLabelText('Exit fullscreen')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Exit fullscreen'));

    await waitFor(() => expect(fake.isFullscreen()).toBe(false));
    await waitFor(() => expect(screen.getByLabelText('Enter fullscreen')).toBeInTheDocument());
  });

  it('flushes the pending draft and session before closing the window', async () => {
    const fake = installFakeTauri();
    const { activeTabId } = useTabStore.getState();
    useTabStore.getState().updateContent(activeTabId, 'last keystrokes before quit');
    render(<WindowControls />);

    fireEvent.click(screen.getByLabelText('Close window'));

    await waitFor(() => expect(fake.commands()).toContain('save_draft'));
    const commands = fake.commands();
    expect(commands).toContain('save_session');
    expect(commands.indexOf('save_draft')).toBeLessThan(commands.indexOf('plugin:window|close'));
    expect(commands.indexOf('save_session')).toBeLessThan(commands.indexOf('plugin:window|close'));
  });

  it('arms a close-requested guard so Alt+F4 and taskbar quit also flush', async () => {
    const fake = installFakeTauri();
    render(<WindowControls />);

    await waitFor(() =>
      expect(fake.listenedEvents()).toContain('tauri://close-requested'),
    );
  });

  it('registers a resize listener and releases every listener on unmount', async () => {
    const fake = installFakeTauri();
    const { unmount } = render(<WindowControls />);

    await waitFor(() => expect(fake.commands()).toContain('plugin:event|listen'));
    expect(fake.commands()).toContain('plugin:window|is_fullscreen');
    const listened = fake.listenedEvents();
    expect(listened).toContain('tauri://resize');
    expect(listened).toContain('tauri://close-requested');

    unmount();

    await waitFor(() =>
      expect(fake.commands().filter((cmd) => cmd === 'plugin:event|unlisten')).toHaveLength(2),
    );
  });

  it('routes a denied window command to the logger instead of crashing', async () => {
    const calls: InvokeCall[] = [];
    internals.invoke = async (cmd: string, payload?: Record<string, unknown>) => {
      calls.push({ cmd, payload });
      if (cmd.endsWith('minimize')) {
        throw new Error('window.minimize not allowed by capabilities');
      }
      return undefined;
    };

    render(<WindowControls />);
    fireEvent.click(screen.getByLabelText('Minimize window'));

    await waitFor(() =>
      expect(calls.some((call) => call.cmd.endsWith('window|minimize'))).toBe(true),
    );

    const logged = calls.find((call) => call.cmd === 'log_event');
    expect(logged?.payload?.level).toBe('error');
    expect(String(logged?.payload?.message)).toBe('Failed to minimize window');
    expect(String(logged?.payload?.context)).toContain('not allowed by capabilities');
  });
});

describe('close-requested guard', () => {
  it('prevents the close, awaits the flush, then force-closes', async () => {
    const order: string[] = [];
    const event = { preventDefault: () => order.push('preventDefault') };

    await handleCloseRequest(
      event,
      async () => {
        order.push('flush');
      },
      async () => {
        order.push('destroy');
      },
    );

    expect(order).toEqual(['preventDefault', 'flush', 'destroy']);
  });

  it('still closes the window when the flush itself fails', async () => {
    const order: string[] = [];

    await expect(
      handleCloseRequest(
        { preventDefault: () => {} },
        async () => {
          throw new Error('session disk write failed');
        },
        async () => {
          order.push('destroy');
        },
      ),
    ).rejects.toThrow('session disk write failed');

    expect(order).toEqual(['destroy']);
  });
});
