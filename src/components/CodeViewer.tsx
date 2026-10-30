import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeViewerProps {
  code: string;
  language?: string;
  maxHeight?: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  language = 'typescript',
  maxHeight = 'max-h-96',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const lines = code.trim().split('\n');

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950 text-slate-100 shadow-sm font-mono text-xs sm:text-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
        <span className="font-medium tracking-wide lowercase">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code body with line numbers */}
      <div className={`overflow-x-auto overflow-y-auto p-4 ${maxHeight} leading-relaxed`}>
        <pre className="flex flex-col">
          {lines.map((line, idx) => {
            const isComment = line.trim().startsWith('//') || line.trim().startsWith('<!--') || line.trim().startsWith('/*');
            return (
              <div key={idx} className="table-row group">
                <span className="table-cell pr-4 text-right select-none text-slate-600 font-mono text-xs tabular-nums group-hover:text-slate-400">
                  {idx + 1}
                </span>
                <span
                  className={`table-cell whitespace-pre ${
                    isComment ? 'text-emerald-400/90 italic' : 'text-slate-200'
                  }`}
                >
                  {line || ' '}
                </span>
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
};
