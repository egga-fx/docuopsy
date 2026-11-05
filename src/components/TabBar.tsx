import React, { useEffect } from 'react';
import { useTabStore } from '../store/tabStore';
import { FileText, FileCode, BookOpen, Plus, X } from 'lucide-react';

function getFileIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.endsWith('.pdf')) {
    return <BookOpen className="w-3.5 h-3.5 text-verdigris" />;
  }
  if (lower.endsWith('.rs') || lower.endsWith('.js') || lower.endsWith('.ts') || lower.endsWith('.json')) {
    return <FileCode className="w-3.5 h-3.5 text-kie-violet" />;
  }
  return <FileText className="w-3.5 h-3.5 text-verdigris" />;
}

interface TabBarProps {
  leftAddon?: React.ReactNode;
}

export const TabBar: React.FC<TabBarProps> = ({ leftAddon }) => {
  const { tabs, activeTabId, setActiveTab, closeTab, addTab } = useTabStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N: New tab
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        addTab();
      }
      // Ctrl+W: Close active tab
      else if (e.ctrlKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        closeTab(activeTabId);
      }
      // Ctrl+Tab: Next tab
      else if (e.ctrlKey && e.key === 'Tab') {
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
      role="tablist"
      aria-label="Document Tabs"
      className="h-9 bg-slate-shell border-b border-slate-border flex items-stretch select-none font-mono text-xs overflow-x-auto scrollbar-none"
    >
      {leftAddon}
      <div className="flex items-stretch flex-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-2 px-3.5 border-r border-slate-border cursor-pointer transition-colors duration-100 ${
                isActive
                  ? 'bg-obsidian text-parchment border-t-2 border-t-verdigris'
                  : 'bg-slate-shell text-slate-muted hover:bg-slate-surface hover:text-parchment border-t-2 border-t-transparent'
              }`}
            >
              {getFileIcon(tab.title)}
              <span className="truncate max-w-[140px]">{tab.title}</span>

              {tab.isDirty && (
                <span
                  role="status"
                  aria-label="dirty-indicator"
                  title="Unsaved changes (Atomic draft cached)"
                  className="w-1.5 h-1.5 rounded-full bg-amber-dirty inline-block animate-pulse"
                />
              )}

              <button
                type="button"
                aria-label={`Close ${tab.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:bg-slate-border rounded p-0.5 text-slate-muted hover:text-parchment transition-opacity"
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
          className="px-2.5 flex items-center justify-center text-slate-muted hover:text-parchment hover:bg-slate-surface transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

