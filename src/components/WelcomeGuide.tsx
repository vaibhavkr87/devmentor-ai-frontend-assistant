import React from 'react';
import {
  Sparkles,
  Bug,
  FolderTree,
  BookOpen,
  Bookmark,
  ArrowRight,
  X,
  Compass,
} from 'lucide-react';
import type { ActiveTab } from './Navbar.tsx';

interface WelcomeGuideProps {
  onGetStarted: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onDismiss: () => void;
}

export const WelcomeGuide: React.FC<WelcomeGuideProps> = ({
  onGetStarted,
  onNavigateTab,
  onDismiss,
}) => {
  return (
    <div className="mb-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden transition-colors">
      {/* Subtle background decorative gradient accent */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Dismiss button */}
      <button
        type="button"
        onClick={onDismiss}
        className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
        aria-label="Dismiss welcome guide"
        title="Hide guide"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header section: What DevMentor AI does */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
          <Compass className="w-4 h-4" />
          <span>First-Time User Guide</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Welcome to DevMentor AI
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
          DevMentor AI is a patient, pedagogically sound frontend engineering mentor. Rather than
          handing you copy-paste shortcuts that you don't understand, DevMentor guides you to solve
          bugs and architect projects using progressive hints, plain-English diagnoses, and modern
          web standards.
        </p>
      </div>

      {/* 4 Feature Walkthrough Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80">
        {/* 1. Debugging Assistant */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Bug className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              1. Debugging Assistant
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Paste your failing code and console error. DevMentor provides a plain-English "Aha!"
              explanation, an anti-pattern warning, and progressive hints before revealing the working solution.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('debugger')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 self-start flex items-center gap-1 group"
          >
            <span>Open Debugger</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* 2. Project Roadmap */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FolderTree className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              2. Project Roadmap
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Describe what you want to build. Receive an indented component hierarchy tree and a 4-phase
              interactive checklist with difficulty badges and practical tips.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('roadmap')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 self-start flex items-center gap-1 group"
          >
            <span>Generate Roadmap</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* 3. Frontend Concepts */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              3. Frontend Concepts
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Master core mental models: state immutability, <code className="font-mono text-[11px]">useEffect</code> dependencies,
              flexbox centering, stacking contexts, and semantic HTML.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('concepts')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 self-start flex items-center gap-1 group"
          >
            <span>Browse Concepts</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* 4. Saved Sessions */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              4. Saved Sessions
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Bookmark diagnoses and roadmaps to your browser's local storage. Revisit them at any time
              or restore them directly into your active workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('saved')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 self-start flex items-center gap-1 group"
          >
            <span>View Saved</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Primary Action Button: "Get Started" */}
      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Ready to diagnose a frontend bug or design your next app?
        </span>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 sm:flex-none px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Hide guide
          </button>
          <button
            type="button"
            onClick={onGetStarted}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 group"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
