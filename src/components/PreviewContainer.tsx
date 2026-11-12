import React, { Suspense, lazy } from 'react';
import { MarkdownPreview } from './MarkdownPreview';
import { CodePreview } from './CodePreview';
import type { TabState } from '../types';

// PDF.js is ~1MB; split it into an async chunk that only loads when a PDF opens.
const PdfViewer = lazy(() => import('./PdfViewer').then((m) => ({ default: m.PdfViewer })));

interface PreviewContainerProps {
  tab?: TabState;
}

export const PreviewContainer: React.FC<PreviewContainerProps> = ({ tab }) => {
  if (!tab) {
    return <MarkdownPreview markdown="" />;
  }

  const titleLower = tab.title.toLowerCase();

  // 1. PDF Documents
  if (titleLower.endsWith('.pdf')) {
    return (
      <Suspense
        fallback={
          <div className="h-full w-full flex items-center justify-center bg-app-canvas font-mono text-xs text-app-muted animate-pulse">
            Loading PDF engine…
          </div>
        }
      >
        <PdfViewer filePath={tab.filePath} />
      </Suspense>
    );
  }

  // 2. Default initial format is Markdown (.md, .markdown, or untitled documents)
  const isMarkdown =
    titleLower.endsWith('.md') ||
    titleLower.endsWith('.markdown') ||
    !tab.title.includes('.') ||
    tab.title.startsWith('Untitled');

  if (isMarkdown) {
    return <MarkdownPreview markdown={tab.content} />;
  }

  // 3. Text/Code formatted documents (.txt, .json, .rs, .ts, etc.)
  return <CodePreview content={tab.content} fileName={tab.title} />;
};

