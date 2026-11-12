import React, { useEffect, useRef, useState } from 'react';
import { useTabStore } from '../store/tabStore';
import { FileText, FileCode, BookOpen, Plus, X, GripVertical } from 'lucide-react';

function getFileIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.endsWith('.pdf')) {
    return <BookOpen className="w-3.5 h-3.5 text-app-accent" />;
  }
  if (lower.endsWith('.rs') || lower.endsWith('.js') || lower.endsWith('.ts') || lower.endsWith('.json')) {
    return <FileCode className="w-3.5 h-3.5 text-app-accent" />;
  }
  return <FileText className="w-3.5 h-3.5 text-app-accent" />;
}

/** Selects the basename without the extension so a rename keeps the suffix. */
function selectFileStem(input: HTMLInputElement) {
  const name = input.value;
  const dot = name.lastIndexOf('.');
  const stemEnd = dot > 0 ? dot : name.length;
  input.focus();
  input.setSelectionRange(0, stemEnd);
}

interface TabBarProps {
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const TabBar: React.FC<TabBarProps> = ({ leftAddon, rightAddon }) => {
  const { tabs, activeTabId, setActiveTab, requestCloseTab, addTab, renameTab } = useTabStore();
  const [renamingTabId, setRenamingTabId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (renamingTabId && renameInputRef.current) {
      selectFileStem(renameInputRef.current);
    }
  }, [renamingTabId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // A live rename field owns its keystrokes.
      if (renamingTabId) return;

      const isMod = e.ctrlKey || e.metaKey;

      // Mod+N: New tab
      if (isMod && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        addTab();
      }
      // Mod+W: Close active tab
      else if (isMod && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        requestCloseTab(activeTabId);
      }
      // Mod+Tab: Next tab
      else if (isMod && e.key === 'Tab') {
        e.preventDefault();
        const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
        const nextIndex = (currentIndex + 1) % tabs.length;
        setActiveTab(tabs[nextIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTabId, addTab, requestCloseTab, setActiveTab, renamingTabId]);

  const startRename = (tabId: string, currentTitle: string) => {
    setRenamingTabId(tabId);
    setDraftTitle(currentTitle);
  };

  const commitRename = () => {
    if (!renamingTabId) return;
    const id = renamingTabId;
    setRenamingTabId(null);
    renameTab(id, draftTitle);
  };

  const cancelRename = () => {
    setRenamingTabId(null);
    setDraftTitle('');
  };

  // Hold-and-move panning: the strip never shows a scrollbar, so dragging sideways
  // on the tab row is what scrolls it. `panned` suppresses the click that follows.
  const tabStripRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<{ panned: boolean; stop: (() => void) | null }>({ panned: false, stop: null });

  // A drag that outlives the component must not leave window-level listeners behind.
  useEffect(() => () => panRef.current.stop?.(), []);

  // Vertical wheel pans the strip sideways; horizontal deltas stay with the browser
  // so a trackpad pan is not applied twice.
  useEffect(() => {
    const el = tabStripRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const handleStripPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = tabStripRef.current;
    if (!el || e.button !== 0 || panRef.current.stop) return;
    if ((e.target as HTMLElement).closest('input,button')) return;

    const pointerId = e.pointerId;
    const startX = e.clientX;
    const startScroll = el.scrollLeft;
    panRef.current.panned = false;

    const stop = () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', stop);
      el.removeEventListener('pointercancel', stop);
      panRef.current.stop = null;
    };
    const onMove = (move: PointerEvent) => {
      if (move.pointerId !== pointerId) return;
      if (move.buttons === 0) return stop();
      const delta = move.clientX - startX;
      if (!panRef.current.panned) {
        if (Math.abs(delta) < 5) return;
        panRef.current.panned = true;
        // Capture only once panning starts, so a plain click still lands on its tab.
        el.setPointerCapture(pointerId);
      }
      el.scrollLeft = startScroll - delta;
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);
    panRef.current.stop = stop;
  };

  // Roving-tabindex keyboard navigation across the tab strip (audit #11):
  // Left/Right move selection, Home/End jump to the ends.
  const focusTabAt = (index: number) => {
    const clamped = Math.max(0, Math.min(tabs.length - 1, index));
    const tab = tabs[clamped];
    if (!tab) return;
    setActiveTab(tab.id);
    requestAnimationFrame(() => {
      const el = tabStripRef.current?.querySelector<HTMLElement>(
        `[data-tab-id="${tab.id}"]`,
      );
      el?.focus();
    });
  };

  return (
    <div
      data-tauri-drag-region
      className="h-10 bg-app-shell border-b border-app-border flex items-stretch select-none font-mono text-xs relative z-30"
    >
      {/* Window grip: the one header slot that is unmistakably draggable. */}
      <div
        data-tauri-drag-region
        role="img"
        aria-label="Drag to move the window"
        title="Drag to move the window"
        className="h-full w-8 shrink-0 flex items-center justify-center border-r border-app-border text-app-muted hover:text-app-primary hover:bg-app-surface/60 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-3.5 h-3.5 pointer-events-none" aria-hidden="true" />
      </div>

      {leftAddon}
      <div
        ref={tabStripRef}
        role="tablist"
        aria-label="Document Tabs"
        onPointerDown={handleStripPointerDown}
        className="flex items-stretch flex-1 overflow-x-auto pan-scroller cursor-grab active:cursor-grabbing"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const isRenaming = tab.id === renamingTabId;
          return (
            <div
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              data-tab-id={tab.id}
              onClick={() => {
                if (panRef.current.panned) return;
                setActiveTab(tab.id);
              }}
              onKeyDown={(e) => {
                if (isRenaming) return;
                const index = tabs.findIndex((t) => t.id === tab.id);
                if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  focusTabAt((index + 1) % tabs.length);
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  focusTabAt((index - 1 + tabs.length) % tabs.length);
                } else if (e.key === 'Home') {
                  e.preventDefault();
                  focusTabAt(0);
                } else if (e.key === 'End') {
                  e.preventDefault();
                  focusTabAt(tabs.length - 1);
                } else if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTab(tab.id);
                }
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (panRef.current.panned) return;
                startRename(tab.id, tab.title);
              }}
              title="Double-click to rename"
              className={`group flex items-center gap-2 px-3.5 border-r border-app-border cursor-pointer transition-all duration-100 ${
                isActive
                  ? 'bg-app-surface text-app-primary border-t-2 border-t-app-accent font-medium'
                  : 'bg-app-shell text-app-muted hover:bg-app-surface/50 hover:text-app-primary border-t-2 border-t-transparent'
              }`}
            >
              {getFileIcon(tab.title)}

              {isRenaming ? (
                <input
                  ref={renameInputRef}
                  data-testid="tab-rename-input"
                  aria-label={`Rename ${tab.title}`}
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onBlur={commitRename}
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitRename();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      cancelRename();
                    }
                  }}
                  className="w-[150px] bg-app-surface-hover border border-app-accent rounded px-1.5 py-0.5 text-app-primary outline-none"
                />
              ) : (
                <span className="truncate max-w-[140px]">{tab.title}</span>
              )}

              {tab.isDirty && (
                <span
                  role="status"
                  aria-label="dirty-indicator"
                  title="Unsaved changes (Atomic draft cached)"
                  className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_#7170ff] inline-block animate-pulse"
                />
              )}

              <button
                type="button"
                aria-label={`Close ${tab.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  requestCloseTab(tab.id);
                }}
                onDoubleClick={(e) => e.stopPropagation()}
                className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 hover:bg-app-surface-hover rounded p-0.5 text-app-muted hover:text-app-primary transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        <button
          type="button"
          aria-label="New scratch document"
          onClick={() => addTab()}
          onDoubleClick={(e) => e.stopPropagation()}
          className="px-3 flex items-center justify-center text-app-muted hover:text-app-primary hover:bg-app-surface/60 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Outside the scroller so the strip stays draggable even with overflowing tabs. */}
      <div data-tauri-drag-region className="w-12 shrink-0 h-full" />

      {rightAddon}
    </div>
  );
};
