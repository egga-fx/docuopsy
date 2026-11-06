import React, { useEffect } from 'react';
import { useTabStore } from '../store/tabStore';
import { FileText, FileCode, BookOpen, Plus, X } from 'lucide-react';

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

interface TabBarProps {
  leftAddon?: React.ReactNode;
}

export const TabBar: React.FC<TabBarProps> = ({ leftAddon }) => {
  const { tabs, activeTabId, setActiveTab, closeTab, addTab } = useTabStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;

      // Mod+N: New tab
      if (isMod && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        addTab();
      }
      // Mod+W: Close active tab
      else if (isMod && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        closeTab(activeTabId);
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
  }, [tabs, activeTabId, addTab, closeTab, setActiveTab]);

  return (
    <div
      className="h-10 bg-app-shell border-b border-app-border flex items-stretch select-none font-mono text-xs relative z-30"
    >
      {leftAddon}
      <div
        role="tablist"
        aria-label="Document Tabs"
        className="flex items-stretch flex-1 overflow-x-auto scrollbar-none"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-2 px-3.5 border-r border-app-border cursor-pointer transition-all duration-100 ${
                isActive
                  ? 'bg-app-surface text-app-primary border-t-2 border-t-app-accent font-medium'
                  : 'bg-app-shell text-app-muted hover:bg-app-surface/50 hover:text-app-primary border-t-2 border-t-transparent'
              }`}
            >
              {getFileIcon(tab.title)}
              <span className="truncate max-w-[140px]">{tab.title}</span>

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
                  closeTab(tab.id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:bg-app-surface-hover rounded p-0.5 text-app-muted hover:text-app-primary transition-opacity"
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
          className="px-3 flex items-center justify-center text-app-muted hover:text-app-primary hover:bg-app-surface/60 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

