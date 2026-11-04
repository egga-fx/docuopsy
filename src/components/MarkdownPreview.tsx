import React, { useMemo } from 'react';
import MarkdownIt from 'markdown-it';
import { sanitizeHtml } from '../utils/sanitizer';
import { useTabStore } from '../store/tabStore';

const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

interface MarkdownPreviewProps {
  markdown?: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ markdown }) => {
  const activeTab = useTabStore((s) => s.getActiveTab());
  const rawContent = markdown ?? activeTab?.content ?? '';

  const sanitizedHtml = useMemo(() => {
    const rawHtml = mdParser.render(rawContent);
    return sanitizeHtml(rawHtml);
  }, [rawContent]);

  return (
    <div className="h-full w-full overflow-y-auto px-8 py-8 bg-obsidian text-parchment select-text">
      {/* 65ch–72ch Scholar's Measure Column */}
      <article
        className="max-w-[70ch] mx-auto font-serif text-[1.0625rem] leading-[1.7] prose-docuopsy"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </div>
  );
};

