import React, { useState, useEffect } from 'react';
import { Navbar, type ActiveTab } from './components/Navbar.tsx';
import { DebuggerModule } from './components/DebuggerModule.tsx';
import { RoadmapModule } from './components/RoadmapModule.tsx';
import { ConceptsView } from './components/ConceptsView.tsx';
import { HistoryView } from './components/HistoryView.tsx';
import { WelcomeGuide } from './components/WelcomeGuide.tsx';
import type { SavedHistoryItem } from './types/index.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('debugger');

  // Welcome guide visibility state for first-time users
  const [showWelcomeGuide, setShowWelcomeGuide] = useState<boolean>(() => {
    try {
      return localStorage.getItem('devmentor_guide_dismissed') !== 'true';
    } catch {
      return true;
    }
  });

  // Dual theme state (stored in localStorage)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('devmentor_theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Saved sessions state
  const [savedItems, setSavedItems] = useState<SavedHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem('devmentor_saved_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync theme to <html> tag
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('devmentor_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('devmentor_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleSaveSession = (item: {
    type: 'debugger' | 'roadmap';
    title: string;
    techStack: any;
    data: any;
    inputSnippet: string;
  }) => {
    const newItem: SavedHistoryItem = {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      type: item.type,
      title: item.title,
      techStack: item.techStack,
      data: item.data,
      inputSnippet: item.inputSnippet,
    };

    setSavedItems((prev) => {
      const updated = [newItem, ...prev.filter((i) => i.title !== item.title)].slice(0, 50);
      try {
        localStorage.setItem('devmentor_saved_sessions', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleDeleteSavedItem = (id: string) => {
    setSavedItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem('devmentor_saved_sessions', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleClearAllSaved = () => {
    setSavedItems([]);
    try {
      localStorage.removeItem('devmentor_saved_sessions');
    } catch {
      // ignore
    }
  };

  const [selectedSession, setSelectedSession] = useState<SavedHistoryItem | null>(null);

  const handleSelectSavedItem = (item: SavedHistoryItem) => {
    setSelectedSession(item);
    if (item.type === 'debugger') {
      setActiveTab('debugger');
    } else {
      setActiveTab('roadmap');
    }
  };

  const handleTabChange = (tab: ActiveTab) => {
    setSelectedSession(null);
    setActiveTab(tab);
  };

  const handleDismissGuide = () => {
    setShowWelcomeGuide(false);
    try {
      localStorage.setItem('devmentor_guide_dismissed', 'true');
    } catch {
      // ignore
    }
  };

  const handleGetStarted = () => {
    handleTabChange('debugger');
    setShowWelcomeGuide(false);
    try {
      localStorage.setItem('devmentor_guide_dismissed', 'true');
    } catch {
      // ignore
    }
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleTabChange}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        savedCount={savedItems.length}
        onToggleGuide={() => setShowWelcomeGuide((prev) => !prev)}
        isGuideOpen={showWelcomeGuide}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Welcome Guide for First-Time Users */}
        {showWelcomeGuide && (
          <WelcomeGuide
            onGetStarted={handleGetStarted}
            onNavigateTab={(tab) => {
              handleTabChange(tab);
            }}
            onDismiss={handleDismissGuide}
          />
        )}

        {/* Mode Introduction Banner */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {activeTab === 'debugger' && 'Pedagogical Error Diagnosis'}
              {activeTab === 'roadmap' && 'Milestone & Component Architecture'}
              {activeTab === 'concepts' && 'Foundational Knowledge'}
              {activeTab === 'saved' && 'Archived Mentorship Sessions'}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
              {activeTab === 'debugger' && 'Frontend Debugging Assistant'}
              {activeTab === 'roadmap' && 'Interactive Project Roadmap'}
              {activeTab === 'concepts' && 'Essential Frontend Concepts'}
              {activeTab === 'saved' && 'Saved Sessions & Roadmaps'}
            </h1>
          </div>

          {/* Quick tab switcher pill bar */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleTabChange('debugger')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'debugger'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              1. Debugger
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('roadmap')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'roadmap'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              2. Roadmap
            </button>
          </div>
        </div>

        {/* Tab Views */}
        {activeTab === 'debugger' && (
          <DebuggerModule
            initialSession={selectedSession}
            onSaveSession={handleSaveSession}
          />
        )}
        {activeTab === 'roadmap' && (
          <RoadmapModule
            initialSession={selectedSession}
            onSaveSession={handleSaveSession}
          />
        )}
        {activeTab === 'concepts' && <ConceptsView />}
        {activeTab === 'saved' && (
          <HistoryView
            items={savedItems}
            onSelectItem={handleSelectSavedItem}
            onDeleteItem={handleDeleteSavedItem}
            onClearAll={handleClearAllSaved}
          />
        )}
      </main>

      {/* Quiet Footer adhering to anti-slop guidelines */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-6 mt-12 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">DevMentor AI</span>
            <span>·</span>
            <span>Frontend Engineering Teaching Assistant</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setShowWelcomeGuide(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-slate-900 dark:hover:text-white transition-colors font-medium text-indigo-600 dark:text-indigo-400"
            >
              User Guide
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('concepts')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Core Concepts
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('debugger')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Debugger
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('roadmap')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Roadmap
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
