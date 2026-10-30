import React from 'react';
import { Bookmark, Trash2, ArrowRight, Bug, MapPin } from 'lucide-react';
import type { SavedHistoryItem } from '../types/index.ts';

interface HistoryViewProps {
  items: SavedHistoryItem[];
  onSelectItem: (item: SavedHistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  items,
  onSelectItem,
  onDeleteItem,
  onClearAll,
}) => {
  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 px-4 space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Bookmark className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          No Saved Sessions Yet
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          When you diagnose a bug or generate an implementation roadmap, click "Save to history"
          to bookmark the solutions and tasks for reference here.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Saved Mentorship Sessions</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {items.length} saved {items.length === 1 ? 'record' : 'records'} in your browser
          </p>
        </div>

        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
        >
          Clear all saved
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors group"
          >
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                  {item.type === 'debugger' ? (
                    <>
                      <Bug className="w-3.5 h-3.5" />
                      <span>Bug Diagnosis</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Project Roadmap</span>
                    </>
                  )}
                </span>
                <span>·</span>
                <span>{item.techStack}</span>
                <span>·</span>
                <span>{new Date(item.timestamp).toLocaleDateString()}</span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {item.title}
              </h4>

              {item.inputSnippet && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                  {item.inputSnippet}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onSelectItem(item)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
              >
                <span>View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteItem(item.id)}
                title="Delete saved item"
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
