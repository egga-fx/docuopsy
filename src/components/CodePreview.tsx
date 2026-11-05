import React from 'react';
import { useTabStore } from '../store/tabStore';
import { Copy, Check } from 'lucide-react';

interface CodePreviewProps {
  content?: string;
  fileName?: string;
}

export const CodePreview: React.FC<CodePreviewProps> = ({ content = '', fileName = 'document.txt' }) => {
  const theme = useTabStore((s) => s.theme);
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
      className={`h-full w-full flex flex-col overflow-hidden font-mono text-xs ${
        theme === 'light' ? 'bg-vellum-canvas text-forensic-ink' : 'bg-obsidian text-parchment'
      }`}
    >
      {/* Mini header showing file info and copy button */}
      <div className="h-8 border-b border-slate-border px-4 flex items-center justify-between bg-slate-shell/60 select-none">
        <span className="text-[11px] text-slate-muted">{fileName} (Preview)</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded text-slate-muted hover:text-parchment hover:bg-slate-surface transition-colors"
          title="Copy content"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-verified" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Code body with line numbers */}
      <div className="flex-1 overflow-auto p-4 leading-relaxed">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-slate-surface/30">
                <td className="w-10 select-none text-right pr-4 text-slate-muted/50 tabular-nums align-top">
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

