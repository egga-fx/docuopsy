import React from 'react';
import { Copy, Check } from 'lucide-react';

interface CodePreviewProps {
  content?: string;
  fileName?: string;
}

export const CodePreview: React.FC<CodePreviewProps> = ({ content = '', fileName = 'document.txt' }) => {
  const [copied, setCopied] = React.useState(false);

  const lines = content.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      data-testid="code-preview"
      className="h-full w-full flex flex-col overflow-hidden font-mono text-xs bg-app-canvas text-app-primary"
    >
      {/* Mini header showing file info and copy button */}
      <div className="h-9 border-b border-app-border px-4 flex items-center justify-between bg-app-surface select-none">
        <span className="text-[11px] text-app-muted font-mono">{fileName} (Preview)</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full border border-app-border text-app-muted hover:text-app-primary hover:bg-app-surface-hover transition-all"
          title="Copy content"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-app-accent" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Code body with line numbers */}
      <div className="flex-1 overflow-auto p-4 leading-relaxed">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-app-surface/50">
                <td className="w-10 select-none text-right pr-4 text-app-muted/60 tabular-nums align-top">
                  {idx + 1}
                </td>
                <td className="whitespace-pre-wrap break-all font-mono align-top text-sm">
                  {line || ' '}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

