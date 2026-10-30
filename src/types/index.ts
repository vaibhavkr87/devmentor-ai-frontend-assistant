export type TechStack = 'React + Tailwind CSS' | 'Vanilla HTML/CSS/JS' | 'Next.js';

export interface DebuggerRequest {
  code: string;
  errorDescription: string;
  techStack: TechStack;
  clarificationAnswer?: string;
}

export interface DebuggerSolution {
  correctedCode: string;
  explanation: string;
}

export interface DebuggerResponse {
  mode: 'debugger';
  diagnosis: string;
  antiPatternWarning: string;
  assumptions: string;
  clarificationQuestion: string | null;
  hints: string[];
  solution: DebuggerSolution;
  preventionChecklist: string[];
}

export interface RoadmapTask {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Tricky';
  hint: string;
}

export interface RoadmapPhase {
  phaseName: string;
  tasks: RoadmapTask[];
}

export interface RoadmapResponse {
  mode: 'roadmap';
  projectTitle: string;
  componentHierarchy: string[];
  phases: RoadmapPhase[];
}

export interface RoadmapRequest {
  projectIdea: string;
  techStack: TechStack;
}

export interface SavedHistoryItem {
  id: string;
  timestamp: number;
  type: 'debugger' | 'roadmap';
  title: string;
  techStack: TechStack;
  data: DebuggerResponse | RoadmapResponse;
  inputSnippet: string;
}
