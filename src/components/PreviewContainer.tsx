import React from 'react';
import { MarkdownPreview } from './MarkdownPreview';
import { PdfViewer } from './PdfViewer';
import { CodePreview } from './CodePreview';
import type { TabState } from '../types';

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
    return <PdfViewer filePath={tab.filePath} />;
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

