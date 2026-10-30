import React from 'react';
import { Sun, Moon, Terminal, HelpCircle } from 'lucide-react';

export type ActiveTab = 'debugger' | 'roadmap' | 'concepts' | 'saved';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  savedCount: number;
  onToggleGuide?: () => void;
  isGuideOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  isDarkMode,
  onToggleTheme,
  savedCount,
  onToggleGuide,
  isGuideOpen,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Terminal className="w-4 h-4 stroke-[2.2]" />
            </div>
            <button
              onClick={() => onSelectTab('debugger')}
              className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap hover:opacity-90 transition-opacity"
            >
              DevMentor AI
            </button>
          </div>

          {/* Zone 2: 4 concise single-line nav links */}
          <nav className="flex items-center gap-1 sm:gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 overflow-x-auto">
            <button
              onClick={() => onSelectTab('debugger')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'debugger'
                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Debugger
            </button>
            <button
              onClick={() => onSelectTab('roadmap')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'roadmap'
                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Roadmap
            </button>
            <button
              onClick={() => onSelectTab('concepts')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'concepts'
                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Concepts
            </button>
            <button
              onClick={() => onSelectTab('saved')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                activeTab === 'saved'
                  ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Saved</span>
              {savedCount > 0 && (
                <span className="text-xs font-mono font-semibold px-1.5 py-0.2 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-md">
                  {savedCount}
                </span>
              )}
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {onToggleGuide && (
              <button
                type="button"
                onClick={onToggleGuide}
                title="Toggle First-Time User Guide"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isGuideOpen
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Guide</span>
              </button>
            )}

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle visual theme"
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
