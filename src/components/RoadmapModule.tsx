import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  Bookmark,
  ChevronDown,
  ChevronUp,
  FolderTree,
  Lightbulb,
  ListTodo,
} from 'lucide-react';
import type { TechStack, RoadmapRequest, RoadmapResponse, RoadmapTask, SavedHistoryItem } from '../types/index.ts';
import { SAMPLE_PROJECT_IDEAS } from '../data/samplePresets.ts';

interface RoadmapModuleProps {
  initialSession?: SavedHistoryItem | null;
  onSaveSession: (item: {
    type: 'roadmap';
    title: string;
    techStack: TechStack;
    data: RoadmapResponse;
    inputSnippet: string;
  }) => void;
}

export const RoadmapModule: React.FC<RoadmapModuleProps> = ({
  initialSession,
  onSaveSession,
}) => {
  const [techStack, setTechStack] = useState<TechStack>('React + Tailwind CSS');
  const [projectIdea, setProjectIdea] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<RoadmapResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Task completion tracking stored by task id
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<string, boolean>>({});
  // Open hints per task
  const [expandedHints, setExpandedHints] = useState<Record<string, boolean>>({});

  const [copiedTree, setCopiedTree] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Mobile scroll reference
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load initial session if passed from history
  useEffect(() => {
    if (initialSession && initialSession.type === 'roadmap') {
      const data = initialSession.data as RoadmapResponse;
      setTechStack(initialSession.techStack);
      setProjectIdea(initialSession.inputSnippet || '');
      setResponse(data);
      setIsSaved(true);
    }
  }, [initialSession]);

  // Smooth scroll on mobile when roadmap is generated
  useEffect(() => {
    if (response && window.innerWidth < 1024) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [response]);

  // Load progress from localStorage when response changes
  useEffect(() => {
    if (!response) return;
    try {
      const storageKey = `devmentor_roadmap_progress_${response.projectTitle.replace(/\s+/g, '_')}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setCompletedTaskIds(JSON.parse(saved));
      } else {
        setCompletedTaskIds({});
      }
    } catch {
      // ignore
    }
  }, [response]);

  // Persist progress to localStorage whenever toggled
  const handleToggleTask = (taskId: string) => {
    setCompletedTaskIds((prev) => {
      const updated = { ...prev, [taskId]: !prev[taskId] };
      if (response) {
        try {
          const storageKey = `devmentor_roadmap_progress_${response.projectTitle.replace(/\s+/g, '_')}`;
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch {
          // ignore
        }
      }
      return updated;
    });
  };

  const toggleHint = (taskId: string) => {
    setExpandedHints((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_PROJECT_IDEAS.find((s) => s.id === sampleId);
    if (!sample) return;
    setTechStack(sample.techStack);
    setProjectIdea(sample.description);
    setResponse(null);
    setErrorMessage(null);
    setCompletedTaskIds({});
    setExpandedHints({});
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!projectIdea.trim()) {
      setErrorMessage('Please describe the project you want to build.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setCompletedTaskIds({});
    setExpandedHints({});
    setIsSaved(false);

    try {
      const payload: RoadmapRequest = {
        projectIdea,
        techStack,
      };

      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data: RoadmapResponse = await res.json();
      setResponse(data);
    } catch (err: any) {
      console.error('Roadmap generation failed:', err);
      setErrorMessage(err?.message || 'Failed to generate project roadmap.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTree = async () => {
    if (!response?.componentHierarchy) return;
    try {
      await navigator.clipboard.writeText(response.componentHierarchy.join('\n'));
      setCopiedTree(true);
      setTimeout(() => setCopiedTree(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSave = () => {
    if (!response) return;
    onSaveSession({
      type: 'roadmap',
      title: response.projectTitle,
      techStack,
      data: response,
      inputSnippet: projectIdea.slice(0, 140),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Calculate total tasks and completed count
  const allTasks: RoadmapTask[] = response
    ? response.phases.flatMap((phase) => phase.tasks)
    : [];
  const totalTasksCount = allTasks.length;
  const completedTasksCount = allTasks.filter((t) => completedTaskIds[t.id]).length;
  const progressPercent =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
      {/* LEFT PANEL: Inputs (5 cols on desktop) */}
      <div className="lg:col-span-5 space-y-6 mb-8 lg:mb-0">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Project Architect</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Generate an incremental roadmap & hierarchy
              </p>
            </div>
            {projectIdea && (
              <button
                type="button"
                onClick={() => {
                  setProjectIdea('');
                  setResponse(null);
                  setErrorMessage(null);
                }}
                className="text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Idea Presets */}
          <div className="mt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Inspiring starter project ideas
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {SAMPLE_PROJECT_IDEAS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleLoadSample(sample.id)}
                  className="text-left px-3 py-2 text-xs rounded-lg bg-slate-50 hover:bg-indigo-50/70 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 transition-colors group flex items-center justify-between"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                    {sample.title}
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono shrink-0 ml-2">
                    {sample.techStack.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={(e) => handleSubmit(e)} className="mt-5 space-y-4">
            {/* Tech Stack Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Tech Stack
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                {(['React + Tailwind CSS', 'Vanilla HTML/CSS/JS', 'Next.js'] as TechStack[]).map(
                  (stack) => (
                    <button
                      key={stack}
                      type="button"
                      onClick={() => setTechStack(stack)}
                      className={`py-1.5 px-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap text-center ${
                        techStack === stack
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {stack === 'React + Tailwind CSS'
                        ? 'React + Tailwind'
                        : stack === 'Vanilla HTML/CSS/JS'
                        ? 'Vanilla Web'
                        : 'Next.js'}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Input: Project Idea */}
            <div>
              <label
                htmlFor="input-idea"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Project Idea & Requirements <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="input-idea"
                rows={6}
                value={projectIdea}
                onChange={(e) => setProjectIdea(e.target.value)}
                placeholder="Describe what you want to build (e.g., 'A responsive habit tracker with dark mode and local storage', 'A simple recipe search app using an external API')."
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all leading-relaxed"
                required
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Structuring Blueprint...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Implementation Roadmap</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT PANEL: Roadmap, Hierarchy & Task Checklists (7 cols on desktop) */}
      <div ref={resultsRef} className="lg:col-span-7">
        {!response && !loading && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FolderTree className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Step-by-Step Architecture Blueprint
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Describe any project idea. DevMentor AI will decompose it into clean parent-child
                components, state ownership, and 4 sequential milestone phases with difficulty
                levels and actionable hints.
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6 animate-pulse">
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-2/5" />
            <div className="h-32 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="space-y-3">
              <div className="h-14 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
              <div className="h-14 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
              <div className="h-14 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            </div>
            <p className="text-center text-xs text-slate-600 dark:text-slate-400 font-mono">
              Drafting component tree & milestone checkpoints...
            </p>
          </div>
        )}

        {response && !loading && (
          <div className="space-y-6">
            {/* Project Overview & Real-Time Progress Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                    Roadmap & Architecture
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {response.projectTitle}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {isSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Saved</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Save roadmap</span>
                    </>
                  )}
                </button>
              </div>

              {/* Progress Tracking Bar */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      Implementation Progress
                    </span>
                    {completedTasksCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setCompletedTaskIds({});
                          if (response) {
                            const storageKey = `devmentor_roadmap_progress_${response.projectTitle.replace(/\s+/g, '_')}`;
                            localStorage.removeItem(storageKey);
                          }
                        }}
                        className="text-[11px] text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                      >
                        (Reset progress)
                      </button>
                    )}
                  </div>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                    {completedTasksCount} of {totalTasksCount} tasks ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 1. Component Hierarchy & Data Flow */}
            {response.componentHierarchy && response.componentHierarchy.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Component Hierarchy & State Flow</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleCopyTree}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    {copiedTree ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy tree</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto">
                  <pre>
                    {response.componentHierarchy.map((line, idx) => (
                      <div key={idx} className="hover:text-indigo-300 transition-colors">
                        {line}
                      </div>
                    ))}
                  </pre>
                </div>
              </div>
            )}

            {/* 2 & 3. Milestone Phases and Interactive Task Checklist */}
            <div className="space-y-4">
              {response.phases.map((phase, pIdx) => {
                const phaseTasks = phase.tasks || [];
                const phaseCompleted = phaseTasks.filter((t) => completedTaskIds[t.id]).length;
                return (
                  <div
                    key={pIdx}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center font-mono">
                          {pIdx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {phase.phaseName}
                        </h4>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        {phaseCompleted}/{phaseTasks.length} done
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {phaseTasks.map((task) => {
                        const isDone = !!completedTaskIds[task.id];
                        const isHintOpen = !!expandedHints[task.id];
                        return (
                          <div key={task.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => handleToggleTask(task.id)}
                                className="flex items-start gap-3 text-left group flex-1 focus:outline-none"
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                ) : (
                                  <Circle className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:text-slate-600 shrink-0 mt-0.5 transition-colors" />
                                )}
                                <span
                                  className={`text-xs font-medium leading-relaxed ${
                                    isDone
                                      ? 'line-through text-slate-400 dark:text-slate-600'
                                      : 'text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                                  }`}
                                >
                                  {task.title}
                                </span>
                              </button>

                              {/* Difficulty Badge */}
                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`text-[11px] font-mono px-2 py-0.5 rounded-md font-semibold whitespace-nowrap ${
                                    task.difficulty === 'Easy'
                                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                                      : task.difficulty === 'Medium'
                                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                                  }`}
                                >
                                  {task.difficulty === 'Easy'
                                    ? '🟢 Easy'
                                    : task.difficulty === 'Medium'
                                    ? '🟡 Medium'
                                    : '🔴 Tricky'}
                                </span>

                                {task.hint && (
                                  <button
                                    type="button"
                                    onClick={() => toggleHint(task.id)}
                                    className={`px-2.5 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                                      isHintOpen
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/70 dark:border-indigo-800 dark:text-indigo-300 font-semibold'
                                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300'
                                    }`}
                                  >
                                    <Lightbulb className="w-3.5 h-3.5" />
                                    <span className="font-medium text-[11px]">How do I do this?</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Practical Hint Toggle per task */}
                            {task.hint && isHintOpen && (
                              <div className="ml-7 p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
                                <span className="font-semibold text-indigo-700 dark:text-indigo-300 block mb-0.5">
                                  💡 Mentor Tip:
                                </span>
                                {task.hint}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
