import React, { useState } from 'react';
import { BookOpen, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { CONCEPT_GUIDES, type ConceptGuide } from '../data/cheatSheets.ts';
import { CodeViewer } from './CodeViewer.tsx';

export const ConceptsView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(CONCEPT_GUIDES.map((g) => g.category)))];

  const filteredGuides =
    selectedCategory === 'All'
      ? CONCEPT_GUIDES
      : CONCEPT_GUIDES.filter((g) => g.category === selectedCategory);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Frontend Foundations & Cheat Sheets</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Core principles that eliminate 90% of junior debugging headaches
          </p>
        </div>

        {/* Category filter tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {filteredGuides.map((guide) => (
          <div
            key={guide.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {guide.category}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {guide.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {guide.summary}
              </p>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {guide.badExample && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>Common Anti-Pattern</span>
                  </span>
                  <CodeViewer code={guide.badExample} language="javascript" maxHeight="max-h-48" />
                </div>
              )}

              {guide.goodExample && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Recommended Pattern</span>
                  </span>
                  <CodeViewer code={guide.goodExample} language="javascript" maxHeight="max-h-48" />
                </div>
              )}
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white">Mentor Rule of Thumb: </strong>
              {guide.keyTakeaway}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
