import React, { useState } from 'react';
import {
  AlertTriangle,
  Lightbulb,
  Unlock,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Bookmark,
  Check,
  RefreshCw,
  Code2,
  Bug,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { TechStack, DebuggerRequest, DebuggerResponse } from '../types/index.ts';
import { SAMPLE_BUGS } from '../data/samplePresets.ts';
import { useRef, useEffect } from 'react';
import type { SavedHistoryItem } from '../types/index.ts';
import { CodeViewer } from './CodeViewer.tsx';

interface DebuggerModuleProps {
  initialSession?: SavedHistoryItem | null;
  onSaveSession: (item: {
    type: 'debugger';
    title: string;
    techStack: TechStack;
    data: DebuggerResponse;
    inputSnippet: string;
  }) => void;
}

export const DebuggerModule: React.FC<DebuggerModuleProps> = ({
  initialSession,
  onSaveSession,
}) => {
  const [techStack, setTechStack] = useState<TechStack>('React + Tailwind CSS');
  const [code, setCode] = useState<string>('');
  const [errorDescription, setErrorDescription] = useState<string>('');
  const [clarificationAnswer, setClarificationAnswer] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<DebuggerResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Progressive disclosure states
  const [showHint2, setShowHint2] = useState<boolean>(false);
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Mobile scroll reference
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load initial session if passed from history
  useEffect(() => {
    if (initialSession && initialSession.type === 'debugger') {
      const data = initialSession.data as DebuggerResponse;
      setTechStack(initialSession.techStack);
      setCode(initialSession.inputSnippet || '');
      setErrorDescription('Loaded from saved history');
      setResponse(data);
      setShowHint2(false);
      setShowSolution(false);
      setIsSaved(true);
    }
  }, [initialSession]);

  // Smooth scroll to results on mobile viewports (< 1024px)
  useEffect(() => {
    if (response && window.innerWidth < 1024) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [response]);

  // Load sample bug
  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_BUGS.find((s) => s.id === sampleId);
    if (!sample) return;
    setTechStack(sample.techStack);
    setCode(sample.code);
    setErrorDescription(sample.errorDescription);
    setClarificationAnswer('');
    setResponse(null);
    setShowHint2(false);
    setShowSolution(false);
    setIsSaved(false);
    setErrorMessage(null);
  };

  const handleClear = () => {
    setCode('');
    setErrorDescription('');
    setClarificationAnswer('');
    setResponse(null);
    setErrorMessage(null);
    setIsSaved(false);
  };

  const handleSubmit = async (e?: React.FormEvent, refinement?: string) => {
    if (e) e.preventDefault();
    if (!code.trim()) {
      setErrorMessage('Please paste or type the failing code snippet.');
      return;
    }
    if (!errorDescription.trim()) {
      setErrorMessage('Please describe the error or what looks broken.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setShowHint2(false);
    setShowSolution(false);
    setIsSaved(false);

    try {
      const payload: DebuggerRequest = {
        code,
        errorDescription,
        techStack,
        clarificationAnswer: refinement || clarificationAnswer || undefined,
      };

      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data: DebuggerResponse = await res.json();
      setResponse(data);
    } catch (err: any) {
      console.error('Diagnosis failed:', err);
      setErrorMessage(err?.message || 'Failed to connect to diagnostic mentor service.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!response) return;
    onSaveSession({
      type: 'debugger',
      title: response.diagnosis.slice(0, 60) + '...',
      techStack,
      data: response,
      inputSnippet: code.slice(0, 140),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
      {/* LEFT PANEL: Inputs and Controls (5 cols on desktop) */}
      <div className="lg:col-span-5 space-y-6 mb-8 lg:mb-0">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bug className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Diagnostic Inputs</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Paste failing frontend code & symptoms
              </p>
            </div>
            {(code || errorDescription) && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Quick Sample Presets */}
          <div className="mt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Quick test scenarios
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {SAMPLE_BUGS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleLoadSample(sample.id)}
                  className="text-left px-3 py-2 text-xs rounded-lg bg-slate-50 hover:bg-indigo-50/70 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 transition-colors group flex items-center justify-between"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                    {sample.name}
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
                Technology Stack
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

            {/* Input 1: Your Code */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="input-code"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Your Code</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                  {code ? `${code.split('\n').length} lines` : 'required'}
                </span>
              </div>
              <textarea
                id="input-code"
                rows={8}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste the component, HTML snippet, or JavaScript that is failing..."
                className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all leading-relaxed"
                required
              />
            </div>

            {/* Input 2: Problem or Error Description */}
            <div>
              <label
                htmlFor="input-error"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Problem or Error Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="input-error"
                rows={3}
                value={errorDescription}
                onChange={(e) => setErrorDescription(e.target.value)}
                placeholder="Paste red console errors OR describe what looks broken (e.g., 'Cards won't center on mobile', 'Button does not trigger state update')."
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
                  <span>Diagnosing Issue...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Diagnose & Guide Me</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT PANEL: Interactive Pedagogical Flow (7 cols on desktop) */}
      <div ref={resultsRef} className="lg:col-span-7">
        {!response && !loading && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Lightbulb className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Progressive Pedagogical Mentorship
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                DevMentor AI avoids quick copy-paste shortcuts. We reveal clear plain-English
                explanations, highlight anti-patterns, and provide progressive hints so you learn how
                to fix frontend bugs yourself.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  1. The "Aha!"
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Jargon-free breakdown of the root cause in your layout or state.
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  2. Anti-Patterns
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Warnings against mutating state or breaking accessibility.
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  3. Progressive Hints
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Try solving with Hint 1 first before opening the verified solution.
                </p>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-1/2" />
              </div>
            </div>
            <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-16 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl" />
            <div className="h-28 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <p className="text-center text-xs text-slate-600 dark:text-slate-400 font-mono">
              Analyzing logic, DOM structure, and responsive layout...
            </p>
          </div>
        )}

        {response && !loading && (
          <div className="space-y-5">
            {/* Header with save button */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {techStack}
                </span>
                <span>·</span>
                <span>Diagnostic Report</span>
              </div>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                {isSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Saved</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Save to history</span>
                  </>
                )}
              </button>
            </div>

            {/* 1. The "Aha!" Moment (Plain-English Diagnosis) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    The "Aha!" Diagnosis
                  </h3>
                  <p className="text-sm text-slate-800 dark:text-slate-200 mt-1.5 leading-relaxed font-medium">
                    {response.diagnosis}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Anti-Pattern Warning */}
            {response.antiPatternWarning && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-400 dark:border-amber-600 rounded-2xl p-5 text-amber-900 dark:text-amber-200">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                      Anti-Pattern Warning
                    </h4>
                    <p className="text-xs text-amber-900 dark:text-amber-200 mt-1 leading-relaxed">
                      {response.antiPatternWarning}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Progressive Step-by-Step Hints */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
                  <span>Step-by-Step Hints</span>
                  <span className="text-[11px] font-normal text-slate-600 dark:text-slate-400">
                    Try fixing before revealing solution
                  </span>
                </h4>
              </div>

              {/* Hint 1: Visible immediately */}
              {response.hints?.[0] && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      Hint 1
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400">
                      (Nudge to try in your editor)
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {response.hints[0]}
                  </p>
                </div>
              )}

              {/* Hint 2: Collapsible progressive disclosure */}
              {response.hints?.[1] && (
                <div>
                  {!showHint2 ? (
                    <button
                      type="button"
                      onClick={() => setShowHint2(true)}
                      className="w-full py-2 px-3 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100/80 dark:bg-slate-800/50 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Still stuck? Show Hint 2</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          Hint 2 (Deeper Clue)
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowHint2(false)}
                          className="text-[11px] text-slate-600 hover:text-slate-600 dark:text-slate-400 transition-colors"
                        >
                          Hide
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {response.hints[1]}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Complete Solution (Collapsed by Default) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Verified Drop-in Solution
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Working code with inline comments and architectural explanation
                  </p>
                </div>
              </div>

              {!showSolution ? (
                <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Give the hints above an honest try first! When you're ready to compare or drop
                    in the working code:
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowSolution(true)}
                    className="py-2 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors inline-flex items-center gap-2"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Reveal Corrected Code & Explanation</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      Corrected Drop-in Code
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSolution(false)}
                      className="text-xs text-slate-600 hover:text-slate-600 dark:text-slate-400 transition-colors"
                    >
                      Hide solution
                    </button>
                  </div>

                  <CodeViewer
                    code={response.solution.correctedCode}
                    language={techStack === 'Vanilla HTML/CSS/JS' ? 'html' : 'tsx'}
                  />

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                      Why this fix works
                    </h5>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {response.solution.explanation}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Prevention Checklist */}
            {response.preventionChecklist && response.preventionChecklist.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Defensive Coding Checklist</span>
                </h4>
                <ul className="space-y-2">
                  {response.preventionChecklist.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                        ✓
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 6. Smart Assumptions & Optional Clarification */}
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              {response.assumptions && (
                <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong className="text-slate-800 dark:text-slate-200">Context Assumptions: </strong>
                  {response.assumptions}
                </div>
              )}

              {response.clarificationQuestion && (
                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/60">
                  <div className="flex items-start gap-2 text-xs">
                    <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {response.clarificationQuestion}
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={clarificationAnswer}
                          onChange={(e) => setClarificationAnswer(e.target.value)}
                          placeholder="Your answer to refine this diagnosis..."
                          className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleSubmit(undefined, clarificationAnswer)}
                          disabled={!clarificationAnswer.trim() || loading}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-colors"
                        >
                          Refine
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
