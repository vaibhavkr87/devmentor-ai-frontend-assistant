import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import type { DebuggerRequest, DebuggerResponse, RoadmapRequest, RoadmapResponse } from "../types/index.ts";

function withTimeout<T>(promise: Promise<T>, ms = 18000): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    if (timer && typeof timer.unref === 'function') {
      timer.unref();
    }
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const DEBUGGER_SYSTEM_INSTRUCTION = `You are DevMentor AI, a patient, encouraging, and pedagogically sound frontend engineering mentor.
Your purpose is to help frontend beginners, students, and junior developers not just fix bugs, but understand foundational concepts of HTML, CSS, modern JavaScript, React, and Tailwind CSS.
Your teaching style prioritizes understanding over shortcuts: guide users to solve problems themselves using progressive hints before revealing code solutions.

Diagnostic Scope:
- Runtime & Logic Errors: Unhandled promises, undefined state properties, .map() on null, infinite useEffect loops, hydration mismatches.
- Visual & Layout Bugs: Flexbox/Grid alignment failures, broken responsive breakpoints, unexpected overflow/scrolling, missing parent heights, CSS z-index stacking context issues.

System Rules & Pedagogical Guardrails:
1. Stack Adaptation (No "React Bias"):
   - Strictly match the user's technology stack.
   - If the user provides vanilla HTML/CSS or plain JavaScript, diagnose and solve using native web standards. NEVER wrap vanilla code in React components.
   - If the user provides React or Next.js, use idiomatic modern hooks and conventions.
2. Complexity Cap (Simplicity First):
   - Always prefer standard, built-in solutions (native hooks like useState/useEffect; standard Tailwind utility classes).
   - Never recommend heavy external libraries (Redux, Zustand, Axios, Lodash). Native fetch and standard hooks are preferred.
3. Strict Modern & Accessible Standards:
   - Use semantic HTML (<button> instead of <div onClick>, <main>, <nav>, <section>, label-associated form inputs).
   - Write mobile-first, responsive Tailwind classes (w-full md:w-1/2, flex-col md:flex-row).
4. Honesty & Integrity:
   - Never invent imaginary error codes.
   - State all assumptions clearly.
   - Include at most ONE optional follow-up question if critical context is missing, else null.
5. Return strictly valid JSON adhering to the specified schema.`;

const ROADMAP_SYSTEM_INSTRUCTION = `You are DevMentor AI, an expert frontend engineering architect and mentor.
When a user submits a project idea, analyze the actual project domain, user roles, core entities, features, and workflows to construct an authentic, tailored frontend component hierarchy and an interactive 12-task implementation roadmap.

CRITICAL ARCHITECTURAL CONSTRAINTS & PROJECT UNDERSTANDING:
1. DEEP DOMAIN UNDERSTANDING (DO NOT CLASSIFY BY INDIVIDUAL KEYWORDS):
   - Analyze the complete project description, identify its actual purpose, user roles, core entities, features, and workflows before generating architecture.
   - Strictly distinguish between related but different project domains:
     * BLOGGING PLATFORM vs ARTICLE-READING PLATFORM:
       - A Blogging Platform involves authoring, publishing, and managing content: user registration/login, create/edit/delete posts, blog feed, categories, comments, user profiles, and an admin panel.
         Mandatory components:
         App
         ├── Navbar
         ├── Authentication (Login, Register)
         ├── BlogFeed (BlogPostCard, CategoryFilter, SearchBar)
         ├── PostManagement (CreatePost, EditPost, DeletePost)
         ├── BlogDetails (CommentSection)
         ├── UserProfile
         └── AdminDashboard
         Phases:
         Phase 1: Project Setup, Navigation and Blog Feed
         Phase 2: Authentication, Post Management and Component Structure
         Phase 3: Comments, Search, Categories, Database and API Integration
         Phase 4: Admin Dashboard, Security, Responsive Design, Accessibility and Deployment
       - An Article-Reading Platform is a consumption-oriented reader for articles/documentation/books: ArticleReader, MarkdownRenderer, TableOfContents, ReadingProgressBar, BookmarkDrawer. DO NOT output these for a blogging platform!
     * E-COMMERCE STORE vs INVENTORY MANAGEMENT SYSTEM:
       - E-Commerce Store: Consumer-facing shopping cart, product catalog, product details, wishlist, checkout, payment gateway, order tracking, admin dashboard.
       - Inventory Management: Internal stock levels, warehouse bins, stock adjustments, restocking alerts, SKU tracking, supplier directory.
     * SOCIAL NETWORKING APPLICATION vs MESSAGING APPLICATION:
       - Social Network: User profiles, friend/follow network, activity feed, post status updates, likes, reactions, comment threads.
       - Messaging App: Real-time chat workspace, channel list, message feed, message bubbles, message input bar, active members, direct messages.
     * LEARNING MANAGEMENT SYSTEM (LMS) vs ONLINE COURSE PLATFORM:
       - LMS: Multi-role (instructor/student/admin), curriculum management, assignment submissions, grading rubrics, student rosters.
       - Online Course Platform: Video lesson player, playlist, quizzes, notes, certificate of completion.
     * TASK MANAGEMENT APPLICATION vs PROJECT MANAGEMENT PLATFORM:
       - Task Management: Personal todo list, daily tasks, priority badges, completion checkboxes.
       - Project Management: Team workspaces, Kanban boards (Backlog, In Progress, Review, Done), sprints, milestones, task assignees.
   - For custom or unknown project types: Derive components, state, data flow, and 4 logical phases from the user's specific entities and workflows. NEVER output generic task-list templates.

2. COMPONENT HIERARCHY & DATA FLOW:
   - Provide an indented tree array with tree branches (├──, └──, │) showing parent-child relationships, held state in parentheses (e.g. holds: currentUser, posts, comments), passed props, and dispatched events.

3. FOUR DEVELOPMENT PHASES & 12-TASK CHECKLIST:
   - Provide EXACTLY 4 logical phases tailored to the project.
   - Each phase MUST contain EXACTLY 3 granular, domain-specific tasks (total of 12 tasks across the roadmap).
   - Each task MUST have:
     - id: "p1-t1", "p1-t2", "p1-t3", "p2-t1", ..., "p4-t3"
     - title: concise, actionable development task tailored to this project
     - difficulty: "Easy" | "Medium" | "Tricky"
     - hint: a 2-line practical "How do I do this?" tip or code pattern explaining how to implement it.

4. KEEP COMPLEXITY LOW: Prefer native web standards and modern React/Tailwind patterns.
Return strictly valid JSON adhering to the specified schema.`;

export async function diagnoseCode(req: DebuggerRequest): Promise<DebuggerResponse> {
  const ai = getGenAIClient();

  if (!ai) {
    return generateFallbackDebuggerResponse(req);
  }

  try {
    const prompt = `Please diagnose the following frontend code and error:
Technology Stack: ${req.techStack}
Error / Problem Description: ${req.errorDescription}
User Code:
\`\`\`
${req.code}
\`\`\`
${req.clarificationAnswer ? `User clarification to previous question: "${req.clarificationAnswer}"` : ''}

Provide a pedagogical diagnosis following the required JSON schema with:
- diagnosis: 2-3 clear sentences in plain English explaining what went wrong without jargon.
- antiPatternWarning: the specific bad practice (e.g. mutating state directly, using array index as key, using non-semantic <div onClick>, missing flex-wrap) and why it hurts.
- assumptions: explicit statement of any assumed context.
- clarificationQuestion: at most 1 optional follow-up question if critical context was missing, else null.
- hints: [Hint 1: guiding nudge for self-fixing, Hint 2: deeper clue or code pattern].
- solution: { correctedCode: clean drop-in replacement with inline comments, explanation: why the fix works }.
- preventionChecklist: 2-3 defensive programming tips.`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction: DEBUGGER_SYSTEM_INSTRUCTION,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mode: { type: Type.STRING },
              diagnosis: { type: Type.STRING },
              antiPatternWarning: { type: Type.STRING },
              assumptions: { type: Type.STRING },
              clarificationQuestion: { type: Type.STRING, nullable: true },
              hints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              solution: {
                type: Type.OBJECT,
                properties: {
                  correctedCode: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ["correctedCode", "explanation"],
              },
              preventionChecklist: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              "mode",
              "diagnosis",
              "antiPatternWarning",
              "assumptions",
              "hints",
              "solution",
              "preventionChecklist",
            ],
          },
        },
      }),
      18000
    );

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from Gemini");
    }

    const parsed = JSON.parse(text) as DebuggerResponse;
    parsed.mode = "debugger";
    return parsed;
  } catch (error) {
    console.warn("[DevMentor AI] Upstream model diagnosis unavailable or timed out, seamlessly using smart fallback.");
    return generateFallbackDebuggerResponse(req);
  }
}

export async function generateRoadmap(req: RoadmapRequest): Promise<RoadmapResponse> {
  const ai = getGenAIClient();

  if (!ai) {
    return generateFallbackRoadmapResponse(req);
  }

  try {
    const prompt = `Please generate an interactive implementation roadmap for this frontend project:
Project Idea: ${req.projectIdea}
Technology Stack: ${req.techStack}

CRITICAL DOMAIN-SPECIFIC REQUIREMENTS:
1. Thoroughly analyze the project description, user roles, entities, capabilities, and workflows before choosing architecture.
2. DO NOT classify projects using single keywords:
   - For a Blogging Platform (with user registration, login, create/edit/delete posts, categories, comments, search, user profiles, admin panel):
     You MUST generate authoring and management components:
     App
     ├── Navbar
     ├── Authentication (Login, Register)
     ├── BlogFeed (BlogPostCard, CategoryFilter, SearchBar)
     ├── PostManagement (CreatePost, EditPost, DeletePost)
     ├── BlogDetails (CommentSection)
     ├── UserProfile
     └── AdminDashboard
     With the 4 phases:
     Phase 1: Project Setup, Navigation and Blog Feed
     Phase 2: Authentication, Post Management and Component Structure
     Phase 3: Comments, Search, Categories, Database and API Integration
     Phase 4: Admin Dashboard, Security, Responsive Design, Accessibility and Deployment
     DO NOT output ArticleReader, MarkdownRenderer, TableOfContents, ReadingProgressBar, or BookmarkDrawer for a blogging platform.
   - For an E-Commerce Website/Store: generate Navbar, ProductListing, ProductDetails, ShoppingCart, Wishlist, Checkout, PaymentGateway, OrderTracking, AdminDashboard.
   - For a Social Networking App: generate Navbar, SocialFeed, CreateStatusPost, PostCard with comments, UserNetworkSidebar, FriendRequestList, UserProfileModal.
   - For a Task Management App: generate Navbar, TaskInputBar, TaskFilterTabs, TaskList, TaskItem with PriorityBadge, BatchActionsBar.
3. Every roadmap MUST have exactly 4 phases and exactly 3 tasks per phase (strictly 12 tasks in total).
4. For every task, include difficulty ("Easy" | "Medium" | "Tricky") and a 2-line practical "How do I do this?" hint with concrete code patterns.

Provide the response in the exact JSON schema requested.`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction: ROADMAP_SYSTEM_INSTRUCTION,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mode: { type: Type.STRING },
              projectTitle: { type: Type.STRING },
              componentHierarchy: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              phases: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    phaseName: { type: Type.STRING },
                    tasks: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          title: { type: Type.STRING },
                          difficulty: { type: Type.STRING },
                          hint: { type: Type.STRING },
                        },
                        required: ["id", "title", "difficulty", "hint"],
                      },
                    },
                  },
                  required: ["phaseName", "tasks"],
                },
              },
            },
            required: ["mode", "projectTitle", "componentHierarchy", "phases"],
          },
        },
      }),
      18000
    );

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from Gemini");
    }

    const parsed = JSON.parse(text) as RoadmapResponse;
    parsed.mode = "roadmap";
    return parsed;
  } catch (error) {
    console.warn("[DevMentor AI] Upstream model roadmap generation unavailable or timed out, seamlessly using smart architectural fallback.");
    return generateFallbackRoadmapResponse(req);
  }
}

function generateFallbackDebuggerResponse(req: DebuggerRequest): DebuggerResponse {
  const code = (req?.code || "").toLowerCase();
  const err = (req?.errorDescription || "").toLowerCase();

  // Handle empty input gracefully
  if (!code.trim() && !err.trim()) {
    return {
      mode: "debugger",
      diagnosis: "No code snippet or problem description was provided to analyze. To get a precise pedagogical diagnosis, paste your failing component or describe the unexpected behavior you are seeing.",
      antiPatternWarning: "Debugging without inspecting the code structure or runtime errors makes troubleshooting guess-based rather than deterministic.",
      assumptions: "Assumed you are working on a frontend component and encountered an issue with rendering, state management, or styling.",
      clarificationQuestion: "What framework and behavior were you trying to achieve?",
      hints: [
        "Paste the code snippet from your editor into the 'Your Code' field.",
        "Include the exact console error message (e.g. 'Cannot read properties of null') or describe what looks broken."
      ],
      solution: {
        correctedCode: `// Example: Clean React Component Structure
import { useState } from 'react';

export default function ExampleComponent() {
  const [items, setItems] = useState<string[]>([]);

  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
      <h2 className="text-base font-bold">Ready to Debug</h2>
      <p className="text-sm text-slate-500">Paste your code above to get personalized hints and explanations.</p>
    </div>
  );
}`,
        explanation: "Provide your code above to receive custom step-by-step guidance and drop-in fixes."
      },
      preventionChecklist: [
        "Check your browser console (F12 > Console) for red runtime errors.",
        "Verify your component props and initial state values.",
        "Add console.log() statements before the failing line to inspect variables at runtime."
      ]
    };
  }

  if ((err.includes("maximum update") || err.includes("depth exceeded") || err.includes("infinite") || err.includes("re-render loop") || err.includes("too many re-renders")) && !err.includes("reading 'map'")) {
    return {
      mode: "debugger",
      diagnosis: "Your component is stuck in an infinite re-render loop. This happens because state is updated inside useEffect without a proper dependency array or while mutating a dependency on every render.",
      antiPatternWarning: "Calling a state setter (like setCount or setData) inside useEffect without specifying dependencies causes the effect to run on every single render, triggering an endless loop and freezing the browser tab.",
      assumptions: "Assumed you intended this effect to run once when the component mounts or only when specific external variables change.",
      clarificationQuestion: "Should this effect fetch data once on initial load, or re-run whenever a specific filter or ID changes?",
      hints: [
        "Check the second argument passed to useEffect. Is there an array brackets '[]' provided?",
        "If your state update depends on previous state, use the functional updater syntax: setCount(prev => prev + 1) instead of referencing current state directly."
      ],
      solution: {
        correctedCode: `import { useState, useEffect } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Run interval only once on mount
    const timer = setInterval(() => {
      // Use functional state updater to avoid stale state & loop
      setCount((prev) => prev + 1);
    }, 1000);

    // Clean up timer when component unmounts to prevent memory leaks
    return () => clearInterval(timer);
  }, []); // Empty dependency array ensures effect runs only once on mount

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl">
      <p className="text-xl font-medium">Elapsed Seconds: {count}</p>
    </div>
  );
}`,
        explanation: "Adding an empty dependency array '[]' instructs React to run the effect only once when the component first mounts. Using the functional updater 'setCount(prev => prev + 1)' accesses the fresh state value without needing 'count' inside the dependency array."
      },
      preventionChecklist: [
        "Always provide a dependency array to useEffect (even an empty '[]' if it should only run once on mount).",
        "Enable eslint-plugin-react-hooks in your linter to catch missing or extraneous dependencies automatically.",
        "Always return a cleanup function when subscribing to intervals, event listeners, or WebSockets."
      ]
    };
  }

  if ((err.includes("reading 'map'") || err.includes("reading \"map\"") || err.includes("cannot read properties") || (err.includes("map") && err.includes("undefined")) || (code.includes(".map") && (code.includes("useState()") || code.includes("useState(null)") || code.includes("useState(undefined)")))) && !code.includes("todos.push")) {
    return {
      mode: "debugger",
      diagnosis: "The app crashed because '.map()' was invoked on a variable that is currently undefined or null. This usually occurs when rendering asynchronous data before the fetch request has resolved.",
      antiPatternWarning: "Assuming asynchronous state is populated immediately on initial render. State initialized as 'null' or 'undefined' will throw a fatal TypeError the moment '.map()' is evaluated during the initial mount render cycle.",
      assumptions: "Assumed the items are loaded asynchronously from an API or storage and the state was initialized as undefined or null.",
      clarificationQuestion: "Is the items data received asynchronously from a fetch API, or passed as a prop from a parent component?",
      hints: [
        "Look at your useState declaration. What is the initial default value? Try initializing with an empty array: useState([]).",
        "Use optional chaining or conditional rendering: items?.map(...) or items && items.map(...) or render a loading indicator first."
      ],
      solution: {
        correctedCode: `import { useState, useEffect } from 'react';

export default function UserList() {
  // 1. Initialize state with a safe default array [] instead of undefined
  const [users, setUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulated async fetch
    const fetchUsers = async () => {
      try {
        const data = ['Alex Morgan', 'Samira Chen', 'Marcus Vance'];
        setUsers(data);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (isLoading) {
    return <div className="p-6 text-slate-500">Loading team members...</div>;
  }

  return (
    <ul className="divide-y divide-slate-200 dark:divide-slate-800">
      {/* 2. Optional chaining ensures safe rendering even if data is null */}
      {users?.length > 0 ? (
        users.map((user, idx) => (
          <li key={idx} className="py-3 px-4 text-sm font-medium">
            {user}
          </li>
        ))
      ) : (
        <li className="py-3 text-slate-400">No users found.</li>
      )}
    </ul>
  );
}`,
        explanation: "By initializing 'users' with an empty array '[]' and guarding with optional chaining and a loading state, the component safely renders without attempting to call .map() on null."
      },
      preventionChecklist: [
        "Always initialize collection states with empty arrays: useState([]) rather than undefined.",
        "Implement dedicated loading and empty states before rendering the list.",
        "Use TypeScript interfaces or optional chaining (data?.map) to catch null references at compile time."
      ]
    };
  }

  if (code.includes(".push(") || code.includes("todos.push") || code.includes(".splice(") || err.includes("mutation") || ((err.includes("not appear") || err.includes("not updating") || err.includes("re-render")) && code.includes("push"))) {
    return {
      mode: "debugger",
      diagnosis: "The screen is not updating because you are mutating the existing state array in place with '.push()'. React compares previous and next state using reference equality (Object.is); since the array memory reference did not change, React assumes nothing happened and skips re-rendering.",
      antiPatternWarning: "Direct state mutation (e.g., todos.push(item) or user.name = 'New') bypasses React's change detection and breaks time-travel debugging, component re-renders, and concurrent mode consistency.",
      assumptions: "Assumed you want the new item to immediately appear at the bottom of the list when clicking the Add button.",
      clarificationQuestion: "Should the new item be appended to the end of the list or prepended to the top?",
      hints: [
        "Instead of mutating 'todos.push(input)', create a brand-new array using the spread operator: setTodos([...todos, input]).",
        "When your next state depends on current state, use the updater callback syntax: setTodos(prev => [...prev, input])."
      ],
      solution: {
        correctedCode: `import { useState } from 'react';

export default function TodoList() {
  const [todos, setTodos] = useState(['Buy groceries', 'Walk the dog']);
  const [input, setInput] = useState('');

  const handleAdd = () => {
    if (!input.trim()) return; // Defensive guard against empty todos

    // ✅ Immutable update: spread previous items and append new input into a fresh array
    setTodos((prevTodos) => [...prevTodos, input.trim()]);
    setInput(''); // Reset input field
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
      <div className="flex gap-2">
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="New task..."
          className="border border-slate-300 dark:border-slate-700 p-2 rounded-lg text-sm flex-1 dark:bg-slate-800" 
        />
        <button 
          type="button"
          onClick={handleAdd} 
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
        >
          Add Task
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {/* Use stable unique keys whenever available */}
        {todos.map((todo, idx) => (
          <li key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-medium">
            {todo}
          </li>
        ))}
      </ul>
    </div>
  );
}`,
        explanation: "By calling 'setTodos(prev => [...prev, input.trim()])', a new array reference is created in memory. React immediately detects the new reference, triggers a re-render, and paints the updated todo on screen."
      },
      preventionChecklist: [
        "Always treat React state as read-only and immutable.",
        "Use pure array methods like .map(), .filter(), and spread syntax ([...arr]) instead of .push(), .pop(), or .splice().",
        "Enable eslint-plugin-react-hooks to catch state mutation patterns during development."
      ]
    };
  }

  if (code.includes("z-index") || err.includes("z-index") || err.includes("stacking")) {
    return {
      mode: "debugger",
      diagnosis: "The dropdown is rendering underneath the main content because its parent element (.sidebar) creates a separate stacking context with a lower z-index (10 vs 20). An element cannot break out of its parent's stacking context, regardless of how large its individual z-index is.",
      antiPatternWarning: "Assigning huge arbitrary z-index numbers (e.g. z-index: 9999) to child elements without considering their parent stacking contexts. In CSS, z-index values are only compared between sibling elements within the same stacking context.",
      assumptions: "Assumed the sidebar and main-content are direct siblings within the same parent layout container.",
      clarificationQuestion: "Can the dropdown parent (.sidebar) be placed at a higher z-index than .main-content, or should the dropdown be rendered portaled to the document root?",
      hints: [
        "Look at the parent container (.sidebar). It has z-index: 10, while .main-content has z-index: 20. Change .sidebar to z-index: 30 or higher.",
        "Alternatively, render overlays or floating dropdowns with high stacking priority outside deeply nested relative containers."
      ],
      solution: {
        correctedCode: `<!-- Ensure the parent containing the dropdown has higher stacking priority than its sibling -->
<div class="container flex relative min-h-[350px]">
  <!-- 1. Lift parent sidebar stacking context above main-content (z-30 > z-20) -->
  <aside class="sidebar relative z-30 w-64 p-4 bg-slate-100 dark:bg-slate-800 border-r border-slate-200">
    <div class="relative">
      <button type="button" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">
        Toggle Menu
      </button>

      <!-- 2. Dropdown now stacks properly above main content -->
      <div class="dropdown-menu absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-700 rounded-xl p-3 z-40">
        <a href="#" class="block px-3 py-1.5 text-xs rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">Account Settings</a>
        <a href="#" class="block px-3 py-1.5 text-xs rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">Support Docs</a>
      </div>
    </div>
  </aside>

  <!-- Main Content Sibling (z-20) -->
  <main class="main-content relative z-20 flex-1 p-6 bg-slate-50 dark:bg-slate-950">
    <h2 class="text-lg font-bold">Main Dashboard View</h2>
    <p class="text-sm text-slate-600 mt-2">The dropdown above now cleanly layers over this content without clipping.</p>
  </main>
</div>`,
        explanation: "By assigning 'z-30' to the parent .sidebar, the entire sidebar and all its children sit above the 'z-20' .main-content container in the root stacking hierarchy."
      },
      preventionChecklist: [
        "Define an intentional z-index scale (e.g. dropdowns: 30, sticky headers: 40, modals: 50).",
        "Always compare z-index on the parent containers that establish new stacking contexts.",
        "Avoid adding 'position: relative' or CSS filters to parent containers unless positioning is strictly required."
      ]
    };
  }

  // Visual / Flexbox / Layout bug fallback
  return {
    mode: "debugger",
    diagnosis: "The layout is failing to center or wrap properly because the flex container is missing 'flex-wrap' or parent dimension constraints. On smaller screens, child items overflow horizontally instead of breaking cleanly into rows.",
    antiPatternWarning: "Relying on default 'flex-nowrap' without responsive modifier classes. By default, flex items shrink to fit their content until they reach their minimum width, after which they spill over the container viewport.",
    assumptions: "Assumed you want cards to display horizontally on desktop and stack cleanly in a single column on mobile viewports.",
    clarificationQuestion: "Do you want these elements to wrap automatically as a flexible grid, or switch strictly to vertical stack on mobile?",
    hints: [
      "Add 'flex-wrap' to the container or use responsive directional classes like 'flex-col md:flex-row'.",
      "Check that children have responsive width definitions such as 'w-full md:w-1/2' or 'w-full md:flex-1'."
    ],
    solution: {
      correctedCode: `<!-- Responsive Container with proper mobile-first flexbox rules -->
<div class="flex flex-col md:flex-row flex-wrap items-center justify-center gap-6 p-6 max-w-5xl mx-auto">
  <!-- Card Item 1: Full width on mobile, flexible half width on desktop -->
  <div class="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
    <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">Responsive Card 1</h3>
    <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">Adapts smoothly to screen width without overflowing the viewport.</p>
  </div>

  <!-- Card Item 2 -->
  <div class="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
    <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">Responsive Card 2</h3>
    <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">Maintains consistent vertical and horizontal rhythm with Tailwind gap.</p>
  </div>
</div>`,
      explanation: "Using 'flex flex-col md:flex-row' establishes a clear mobile-first flow where cards stack vertically on small screens and sit side-by-side on desktop. Adding 'gap-6' replaces fragile child margins."
    },
    preventionChecklist: [
      "Always design mobile-first: start with 'flex-col' and layer 'md:flex-row' for wider viewports.",
      "Prefer Tailwind's 'gap-*' utilities over manual margin offsets on sibling elements.",
      "Test responsive breakpoints in your browser's device toolbar with 'overflow-x: hidden' on the root body."
    ]
  };
}

type ProjectDomain =
  | 'BLOGGING_PLATFORM'
  | 'ARTICLE_READER'
  | 'ECOMMERCE_STORE'
  | 'INVENTORY_MANAGEMENT'
  | 'SOCIAL_NETWORK'
  | 'MESSAGING_CHAT'
  | 'LEARNING_MANAGEMENT_SYSTEM'
  | 'COURSE_PLATFORM'
  | 'PROJECT_MANAGEMENT'
  | 'TASK_MANAGEMENT'
  | 'RECIPE_FINDER'
  | 'ANALYTICS_DASHBOARD'
  | 'CUSTOM_DYNAMIC';

function classifyProjectDomain(rawIdea: string): ProjectDomain {
  const lower = rawIdea.toLowerCase();

  const hasAuth = /user registration|register|login|signup|sign-up|auth|user profile|profiles|password|jwt|session/i.test(lower);
  const hasPostCrud = /create post|edit post|delete post|create posts|edit posts|delete posts|write post|publish post|manage posts|authoring|blogging/i.test(lower);
  const hasComments = /comment|comments|discussion|discussion thread|replies/i.test(lower);
  const hasAdmin = /admin panel|admin dashboard|administrator|admin role|moderation/i.test(lower);

  // 1. BLOGGING PLATFORM vs ARTICLE READER
  if (
    hasPostCrud ||
    (lower.includes("blog") && (hasAuth || hasComments || hasAdmin || lower.includes("platform") || lower.includes("system") || lower.includes("cms"))) ||
    lower.includes("publishing platform") ||
    lower.includes("cms")
  ) {
    return 'BLOGGING_PLATFORM';
  }

  // Pure article/docs reading application (consumption focused)
  if (
    (lower.includes("article reader") || lower.includes("reading app") || lower.includes("book reader") || lower.includes("markdown reader") || lower.includes("docs reader") || lower.includes("table of contents") || lower.includes("reading progress")) &&
    !hasPostCrud
  ) {
    return 'ARTICLE_READER';
  }

  // 2. E-COMMERCE STORE vs INVENTORY MANAGEMENT
  const isInventorySpecific = /inventory management|warehouse|stock level|stock levels|restock|restocking|sku tracking|supplier management|asset tracking/i.test(lower);
  const isEcommerceConsumer = /shopping cart|checkout|payment gateway|buy products|product catalog|online store|ecommerce|e-commerce|webshop|storefront|wishlist/i.test(lower);

  if (isInventorySpecific && !isEcommerceConsumer) {
    return 'INVENTORY_MANAGEMENT';
  }

  if (
    isEcommerceConsumer ||
    lower.includes("commerce") ||
    lower.includes("shop") ||
    lower.includes("store") ||
    lower.includes("cart") ||
    lower.includes("checkout")
  ) {
    return 'ECOMMERCE_STORE';
  }

  // 3. SOCIAL NETWORK vs MESSAGING / CHAT
  const isChatSpecific = /chat|messaging|direct message|dm|channel|chat bubble|instant message|slack|discord/i.test(lower);
  const isSocialNetwork = /social network|social media|friends|followers|following|status update|activity feed|timeline|connect with friends/i.test(lower);

  if (isSocialNetwork && !isChatSpecific) {
    return 'SOCIAL_NETWORK';
  }
  if (isChatSpecific) {
    return 'MESSAGING_CHAT';
  }
  if (isSocialNetwork) {
    return 'SOCIAL_NETWORK';
  }

  // 4. LEARNING MANAGEMENT SYSTEM (LMS) vs ONLINE COURSE PLATFORM
  const isLMS = /lms|learning management|grading|gradebook|assignment submission|assignments|instructor dashboard|student roster|curriculum manager/i.test(lower);
  const isCoursePlatform = /course platform|video lesson|lecture playlist|watch course|quiz player|certificate of completion/i.test(lower);

  if (isLMS) {
    return 'LEARNING_MANAGEMENT_SYSTEM';
  }
  if (isCoursePlatform || (lower.includes("course") && lower.includes("lesson"))) {
    return 'COURSE_PLATFORM';
  }

  // 5. TASK MANAGEMENT vs PROJECT MANAGEMENT
  const isProjectManagement = /project management|kanban|sprint|milestone|burndown|team task|jira|trello|scrum|assignee|workspaces/i.test(lower);
  const isTaskManagement = /todo|task manager|daily task|checklist|habit tracker|to-do/i.test(lower);

  if (isProjectManagement) {
    return 'PROJECT_MANAGEMENT';
  }
  if (isTaskManagement) {
    return 'TASK_MANAGEMENT';
  }

  // 6. RECIPE FINDER
  if (/recipe|food|meal|cook|cooking|ingredient|dish|nutrition|dietary/i.test(lower)) {
    return 'RECIPE_FINDER';
  }

  // 7. ANALYTICS DASHBOARD
  if (/dashboard|analytic|analytics|metric|kpi|crm|revenue report|financial summary/i.test(lower)) {
    return 'ANALYTICS_DASHBOARD';
  }

  // 8. Default: CUSTOM DYNAMIC
  return 'CUSTOM_DYNAMIC';
}

function generateFallbackRoadmapResponse(req: RoadmapRequest): RoadmapResponse {
  const rawIdea = (req.projectIdea || "").trim();
  const domain = classifyProjectDomain(rawIdea);
  const displayTitle = rawIdea ? rawIdea.slice(0, 45).trim() : "Application";

  // 1. BLOGGING PLATFORM DOMAIN
  if (domain === "BLOGGING_PLATFORM") {
    return {
      mode: "roadmap",
      projectTitle: `${displayTitle} Implementation Blueprint`,
      componentHierarchy: [
        "App (holds: currentUser, authToken, posts, activePost, comments, categories, activeCategory, searchQuery, adminStats)",
        "  ├── Navbar (props: currentUser, onNavigate, onLogout, onOpenAuth)",
        "  ├── Authentication (state: authMode; dispatches: onLogin, onRegister)",
        "  │    ├── Login (props: onLogin, onSwitchToRegister)",
        "  │    └── Register (props: onRegister, onSwitchToLogin)",
        "  ├── BlogFeed (props: posts, activeCategory, searchQuery, onSelectPost, onOpenCreate)",
        "  │    ├── SearchBar (props: searchQuery, onSearchChange, onClearSearch)",
        "  │    ├── CategoryFilter (props: categories, activeCategory, onSelectCategory)",
        "  │    └── BlogPostCard (props: post, onReadPost, onEditPost, onDeletePost, currentUser)",
        "  ├── PostManagement (props: activePost, isOpen, onClose, onSavePost, onDeletePost)",
        "  │    ├── CreatePost (props: categories, onSubmitPost, onCancel)",
        "  │    ├── EditPost (props: post, categories, onUpdatePost, onCancel)",
        "  │    └── DeletePost (props: postId, postTitle, onConfirmDelete, onCancel)",
        "  ├── BlogDetails (props: post, currentUser, onBackToFeed, onEditPost)",
        "  │    └── CommentSection (props: postId, comments, onAddComment, onDeleteComment, currentUser)",
        "  ├── UserProfile (props: currentUser, userPosts, onUpdateProfile, onClose)",
        "  └── AdminDashboard (props: allPosts, allUsers, categories, onManagePost, onManageUser, onAddCategory)"
      ],
      phases: [
        {
          phaseName: "Phase 1: Project Setup, Navigation and Blog Feed",
          tasks: [
            {
              id: "p1-t1",
              title: "Initialize project structure, Tailwind styling, and responsive Navbar with brand logo and auth trigger",
              difficulty: "Easy",
              hint: "Create a persistent header with max-w-6xl mx-auto px-4, brand icon, search input, and dynamic login/user avatar button."
            },
            {
              id: "p1-t2",
              title: "Construct responsive BlogFeed grid layout with SearchBar and CategoryFilter pills",
              difficulty: "Easy",
              hint: "Use grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 with horizontal scrollable category pills (overflow-x-auto)."
            },
            {
              id: "p1-t3",
              title: "Assemble BlogPostCard component displaying title, excerpt, author avatar, date, and category badge",
              difficulty: "Easy",
              hint: "Design card with rounded-xl border, image thumbnail, reading duration badge, author metadata, and action menu."
            }
          ]
        },
        {
          phaseName: "Phase 2: Authentication, Post Management and Component Structure",
          tasks: [
            {
              id: "p2-t1",
              title: "Build Authentication modal with togglable Login and Register forms and client-side validation",
              difficulty: "Medium",
              hint: "Manage authMode ('login' | 'register') in state and validate email format and password minimum length before submission."
            },
            {
              id: "p2-t2",
              title: "Implement PostManagement modal with CreatePost form supporting title, category, and markdown editor",
              difficulty: "Medium",
              hint: "Build a controlled form with title input, category selector dropdown, tags input, and an auto-expanding content textarea."
            },
            {
              id: "p2-t3",
              title: "Build EditPost and DeletePost confirmation dialogs with author permission checks",
              difficulty: "Medium",
              hint: "Prefill existing post fields on edit and display a destructive modal with cancel/delete triggers guarded by user ID matching."
            }
          ]
        },
        {
          phaseName: "Phase 3: Comments, Search, Categories, Database and API Integration",
          tasks: [
            {
              id: "p3-t1",
              title: "Create BlogDetails view with CommentSection allowing registered users to post and delete comments",
              difficulty: "Medium",
              hint: "Render full post body with typography styling and an interactive comment thread with timestamp, author, and delete action."
            },
            {
              id: "p3-t2",
              title: "Implement dynamic search query and category filtering logic across all blog posts",
              difficulty: "Medium",
              hint: "Filter posts using posts.filter(p => (activeCategory === 'All' || p.category === activeCategory) && p.title.toLowerCase().includes(query))."
            },
            {
              id: "p3-t3",
              title: "Integrate REST API endpoints with MongoDB/Express backend for posts, comments, and auth persistence",
              difficulty: "Tricky",
              hint: "Set up async fetch calls for /api/posts and /api/auth with Authorization Bearer token headers and error handling."
            }
          ]
        },
        {
          phaseName: "Phase 4: Admin Dashboard, Security, Responsive Design, Accessibility and Deployment",
          tasks: [
            {
              id: "p4-t1",
              title: "Build AdminDashboard with metrics overview, user management table, and post moderation controls",
              difficulty: "Medium",
              hint: "Display total posts, users, and comments KPI cards alongside a moderation table with delete and role update actions."
            },
            {
              id: "p4-t2",
              title: "Enforce role-based access control (RBAC), protected routes, and sanitization against XSS",
              difficulty: "Tricky",
              hint: "Guard admin routes by verifying currentUser.role === 'admin' and sanitize markdown HTML output using DOMPurify."
            },
            {
              id: "p4-t3",
              title: "Audit responsive mobile navigation, touch targets, keyboard accessibility, and production deployment",
              difficulty: "Easy",
              hint: "Ensure hamburger menu works smoothly on 375px viewports, form controls have focus rings, and run npm run build."
            }
          ]
        }
      ]
    };
  }

  // 2. E-COMMERCE & ONLINE STORE DOMAIN
  if (domain === "ECOMMERCE_STORE") {
    return {
      mode: "roadmap",
      projectTitle: `${displayTitle} Implementation Blueprint`,
      componentHierarchy: [
        "App (holds: products, cartItems, wishlist, activeCategory, selectedProduct, currentOrder)",
        "  ├── Navbar (props: cartCount, wishlistCount, onSearch, onOpenCart, onOpenWishlist)",
        "  ├── CategoryFilterBar (props: categories, activeCategory, onSelectCategory)",
        "  ├── ProductListing (props: products, onSelectProduct, onAddToCart, onAddToWishlist)",
        "  │    └── ProductCard (props: product, onQuickView, onAddToCart, isWishlisted)",
        "  ├── ProductDetails (props: product, isOpen, onClose, onAddToCart)",
        "  ├── ShoppingCart (props: cartItems, isOpen, onClose, onUpdateQty, onCheckout)",
        "  ├── Wishlist (props: wishlistItems, onMoveToCart, onRemove)",
        "  ├── Checkout (state: shippingStep, orderSummary; dispatches: onPlaceOrder)",
        "  │    └── PaymentGateway (props: totalAmount, onProcessPayment)",
        "  ├── OrderTracking (props: activeOrders, orderStatus, onClose)",
        "  └── AdminDashboard (props: inventoryList, salesMetrics, onUpdatePrice)"
      ],
      phases: [
        {
          phaseName: "Phase 1: Store Setup & Product Catalog Layout (HTML/Tailwind)",
          tasks: [
            {
              id: "p1-t1",
              title: "Build responsive store Navbar with cart count badge and category links",
              difficulty: "Easy",
              hint: "Use flex items-center justify-between with a relative cart button having absolute -top-1 -right-1 text-xs badge."
            },
            {
              id: "p1-t2",
              title: "Implement responsive ProductListing grid with interactive ProductCard components",
              difficulty: "Easy",
              hint: "Use grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 with product image, price, rating, and Quick View button."
            },
            {
              id: "p1-t3",
              title: "Design slide-over ShoppingCart drawer shell with backdrop overlay",
              difficulty: "Easy",
              hint: "Use fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 with a dark semi-transparent backdrop."
            }
          ]
        },
        {
          phaseName: "Phase 2: Cart Structure & Global State Initialization",
          tasks: [
            {
              id: "p2-t1",
              title: "Model TypeScript interfaces for Product, CartItem, Wishlist, and Order",
              difficulty: "Easy",
              hint: "Define interface Product { id: string; title: string; price: number; image: string; category: string } and CartItem extending Product."
            },
            {
              id: "p2-t2",
              title: "Initialize centralized shopping cart state with quantity, subtotal, and tax calculations",
              difficulty: "Medium",
              hint: "Manage const [cart, setCart] = useState<CartItem[]>([]) in App and create onAddToCart helper that increments existing items."
            },
            {
              id: "p2-t3",
              title: "Build interactive ProductDetails modal with image gallery and variant picker",
              difficulty: "Medium",
              hint: "Render modal when selectedProduct is non-null with size/color option buttons and Add to Cart action."
            }
          ]
        },
        {
          phaseName: "Phase 3: Wishlist, LocalStorage & Checkout Integration",
          tasks: [
            {
              id: "p3-t1",
              title: "Implement Wishlist toggle state and move-to-cart functionality",
              difficulty: "Medium",
              hint: "Store wishlist item IDs in state and toggle using prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]."
            },
            {
              id: "p3-t2",
              title: "Synchronize shopping cart and wishlist items to browser localStorage",
              difficulty: "Tricky",
              hint: "Use useEffect to write on cart changes: localStorage.setItem('ecommerce_cart', JSON.stringify(cart)), and lazy state initializer."
            },
            {
              id: "p3-t3",
              title: "Build multi-step Checkout flow with shipping form and PaymentGateway simulation",
              difficulty: "Tricky",
              hint: "Create a 2-step checkout wizard with shipping inputs and a simulated 1.5s payment processing loading state."
            }
          ]
        },
        {
          phaseName: "Phase 4: Order Tracking, Admin Dashboard & Mobile Polish",
          tasks: [
            {
              id: "p4-t1",
              title: "Implement OrderTracking view with live timeline and receipt breakdown",
              difficulty: "Medium",
              hint: "Display step indicators (Order Placed -> Processing -> Shipped -> Delivered) using a flex stepper with check icons."
            },
            {
              id: "p4-t2",
              title: "Build AdminDashboard view with inventory stock levels and price updater",
              difficulty: "Medium",
              hint: "Create a tabular inventory list with input controls to modify stock and compute total inventory value."
            },
            {
              id: "p4-t3",
              title: "Audit mobile checkout touch targets, cart drawer swipe gestures, and form validation",
              difficulty: "Easy",
              hint: "Ensure buttons have minimum 44px height on mobile and modal dialogs trap focus with accessible aria-modal attributes."
            }
          ]
        }
      ]
    };
  }

  // 3. INVENTORY MANAGEMENT & WAREHOUSE DOMAIN
  if (domain === "INVENTORY_MANAGEMENT") {
    return {
      mode: "roadmap",
      projectTitle: `${displayTitle} Implementation Blueprint`,
      componentHierarchy: [
        "App (holds: inventoryItems, stockAlerts, warehouses, selectedSKU, suppliers, auditHistory)",
        "  ├── Navbar (props: lowStockCount, activeWarehouse, onSelectWarehouse)",
        "  ├── StockOverviewGrid (props: totalSKUs, lowStockItems, totalValuation, pendingOrders)",
        "  │    └── MetricCard (props: title, value, status, icon)",
        "  ├── WarehouseInventoryTable (props: items, onSelectSKU, onAdjustStock, onExportCSV)",
        "  │    ├── InventoryFilterBar (props: categoryFilter, searchSKU, onFilterChange)",
        "  │    └── StockItemRow (props: item, onQuickAdjust, isLowStock)",
        "  ├── StockAdjustmentModal (props: item, isOpen, onClose, onSaveAdjustment)",
        "  ├── ReorderAlertsPanel (props: alerts, onGeneratePurchaseOrder, onDismissAlert)",
        "  └── SupplierDirectory (props: suppliers, onContactSupplier, onAddSupplier)"
      ],
      phases: [
        {
          phaseName: "Phase 1: Project Setup & Warehouse Inventory Grid Layout",
          tasks: [
            {
              id: "p1-t1",
              title: "Build responsive warehouse navigation header with active facility selector and stock alert badge",
              difficulty: "Easy",
              hint: "Create a clean header with facility dropdown (Warehouse A / B) and a red pulsing low-stock notification pill."
            },
            {
              id: "p1-t2",
              title: "Design KPI metric overview cards for total SKUs, low-stock alerts, and total asset valuation",
              difficulty: "Easy",
              hint: "Use a 4-column responsive grid with tabular numbers and color-coded threshold status badges."
            },
            {
              id: "p1-t3",
              title: "Construct high-density warehouse inventory data table with SKU search and category filters",
              difficulty: "Easy",
              hint: "Build table with columns for SKU, Item Name, Category, In Stock, Reorder Point, and Location Bin."
            }
          ]
        },
        {
          phaseName: "Phase 2: SKU Data Modeling, Stock Levels and Filtering State",
          tasks: [
            {
              id: "p2-t1",
              title: "Define TypeScript interfaces for InventoryItem, WarehouseLocation, and StockAlert",
              difficulty: "Easy",
              hint: "Model interface InventoryItem with id, sku, name, quantity, reorderThreshold, binLocation, and unitCost."
            },
            {
              id: "p2-t2",
              title: "Implement multi-criteria filtering for out-of-stock items, categories, and SKU search",
              difficulty: "Medium",
              hint: "Filter inventory in memory using .filter() matching SKU string or quantity <= reorderThreshold."
            },
            {
              id: "p2-t3",
              title: "Build interactive StockAdjustmentModal for manual count audits and restocking entries",
              difficulty: "Medium",
              hint: "Manage adjustmentReason ('Received Shipment' | 'Damaged' | 'Cycle Count') and delta quantity inputs."
            }
          ]
        },
        {
          phaseName: "Phase 3: Stock Adjustments, Reorder Triggers and Audit History",
          tasks: [
            {
              id: "p3-t1",
              title: "Implement automated low-stock alert triggers when inventory drops below reorder threshold",
              difficulty: "Medium",
              hint: "Derive alerts dynamically from inventory items where item.quantity <= item.reorderThreshold."
            },
            {
              id: "p3-t2",
              title: "Build Purchase Order generator modal for automated reorder requests to suppliers",
              difficulty: "Tricky",
              hint: "Aggregate low-stock items by supplier and generate downloadable PO summaries with itemized costs."
            },
            {
              id: "p3-t3",
              title: "Synchronize inventory state, transaction logs, and warehouse preferences to localStorage",
              difficulty: "Medium",
              hint: "Persist inventory array and audit log to localStorage with timestamped transaction entries."
            }
          ]
        },
        {
          phaseName: "Phase 4: Barcode Simulation, Multi-Warehouse Switching and Polish",
          tasks: [
            {
              id: "p4-t1",
              title: "Implement barcode/QR code scan simulation for rapid item lookup and check-in",
              difficulty: "Medium",
              hint: "Provide an input field that autofocuses and triggers SKU lookup on Enter or 13-digit code pattern."
            },
            {
              id: "p4-t2",
              title: "Add client-side CSV export of current stock levels and inventory valuation",
              difficulty: "Easy",
              hint: "Generate CSV string from inventory items and trigger download via URL.createObjectURL."
            },
            {
              id: "p4-t3",
              title: "Audit mobile responsive table scrolling, barcode input focus, and dark mode contrast",
              difficulty: "Easy",
              hint: "Use overflow-x-auto for table scrolling on mobile viewports and ensure contrast ratios meet WCAG AA."
            }
          ]
        }
      ]
    };
  }

  // 4. SOCIAL NETWORKING APPLICATION DOMAIN
  if (domain === "SOCIAL_NETWORK") {
    return {
      mode: "roadmap",
      projectTitle: `${displayTitle} Implementation Blueprint`,
      componentHierarchy: [
        "App (holds: currentUser, posts, friends, friendRequests, activeFilter, notifications)",
        "  ├── Navbar (props: currentUser, unreadCount, onOpenNotifications, onLogout)",
        "  ├── SocialFeed (props: posts, onLikePost, onSharePost, onOpenComments)",
        "  │    ├── CreateStatusPost (dispatches: onPublishPost, userAvatar)",
        "  │    └── PostCard (props: post, onLike, onShare, onComment, currentUserId)",
        "  │         └── CommentThread (props: comments, onAddComment, currentUserId)",
        "  ├── UserNetworkSidebar (props: friends, suggestedUsers, onSendRequest)",
        "  ├── FriendRequestList (props: pendingRequests, onAccept, onDecline)",
        "  └── UserProfileModal (props: profileUser, isOwnProfile, onUpdateBio, onClose)"
      ],
      phases: [
        {
          phaseName: "Phase 1: Project Setup, Navigation and Social Feed Layout",
          tasks: [
            {
              id: "p1-t1",
              title: "Construct responsive 3-column social feed layout with desktop sidebar and feed viewport",
              difficulty: "Easy",
              hint: "Use grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto with sticky sidebars."
            },
            {
              id: "p1-t2",
              title: "Build CreateStatusPost card with user avatar, media attachment buttons, and post trigger",
              difficulty: "Easy",
              hint: "Design an unboxed textarea with placeholder 'What is on your mind?' and image/feeling icon buttons."
            },
            {
              id: "p1-t3",
              title: "Assemble interactive PostCard with like counter, comment toggle, and share action",
              difficulty: "Easy",
              hint: "Style heart like button with animation and reaction count badges below the post body."
            }
          ]
        },
        {
          phaseName: "Phase 2: User Profiles, Friend Network and Post Creation",
          tasks: [
            {
              id: "p2-t1",
              title: "Model TypeScript interfaces for User, Post, Comment, Reaction, and FriendRequest",
              difficulty: "Easy",
              hint: "Define interface Post { id: string; authorId: string; content: string; likes: string[]; timestamp: number }."
            },
            {
              id: "p2-t2",
              title: "Implement immutable post publishing with character limits and optimistic feed updates",
              difficulty: "Medium",
              hint: "Prepend new post to posts array using setPosts(prev => [newPost, ...prev]) and reset textarea."
            },
            {
              id: "p2-t3",
              title: "Build UserProfileModal with editable bio, follower counts, and author post history",
              difficulty: "Medium",
              hint: "Render modal showing user cover banner, avatar, bio text, and user-filtered posts."
            }
          ]
        },
        {
          phaseName: "Phase 3: Real-Time Interactions, Likes, Comments and Activity Feed",
          tasks: [
            {
              id: "p3-t1",
              title: "Implement toggleable heart likes and nested CommentThread interactions",
              difficulty: "Medium",
              hint: "Update post.likes array: if user already liked, filter out ID; otherwise push currentUser.id."
            },
            {
              id: "p3-t2",
              title: "Build FriendRequestList drawer with accept, ignore, and friend suggestion actions",
              difficulty: "Medium",
              hint: "Manage pendingRequests array and transfer user ID to friends list upon accepting."
            },
            {
              id: "p3-t3",
              title: "Synchronize user feed, published posts, and friend connections to localStorage",
              difficulty: "Medium",
              hint: "Save state in localStorage keyed by active user ID to simulate multi-session continuity."
            }
          ]
        },
        {
          phaseName: "Phase 4: Privacy Controls, Mobile Gestures, Accessibility and Deployment",
          tasks: [
            {
              id: "p4-t1",
              title: "Implement post privacy dropdown (Public, Friends Only, Private) and post filtering",
              difficulty: "Medium",
              hint: "Add privacy property to posts and filter feed according to friendship relationship."
            },
            {
              id: "p4-t2",
              title: "Build mobile bottom navigation bar with feed, search, and notification badges",
              difficulty: "Easy",
              hint: "Create fixed bottom-0 inset-x-0 bg-white border-t flex justify-around py-2 lg:hidden."
            },
            {
              id: "p4-t3",
              title: "Audit media upload previews, keyboard accessibility for reaction buttons, and polish",
              difficulty: "Easy",
              hint: "Ensure like/comment buttons have descriptive aria-label attributes and image tags have alt text."
            }
          ]
        }
      ]
    };
  }

  // 5. MESSAGING & CHAT APPLICATION DOMAIN
  if (domain === "MESSAGING_CHAT") {
    return {
      mode: "roadmap",
      projectTitle: `${displayTitle} Implementation Blueprint`,
      componentHierarchy: [
        "App (state: channels, activeChannelId, messages, currentUser, activeMembers, searchUser)",
        "  ├── SidebarNav (props: channels, activeChannelId, onSelectChannel, onOpenDirectMessages)",
        "  │    └── ChannelList (props: channels, activeChannelId, onSelectChannel)",
        "  ├── ChatWorkspace (props: activeChannel, messages, onSendMessage)",
        "  │    ├── ChatHeader (props: channelName, memberCount, onToggleMemberList)",
        "  │    ├── MessageFeed (props: messages, currentUserId, onDeleteMessage)",
        "  │    │    └── MessageBubble (props: message, isOwnMessage)",
        "  │    └── MessageInputBar (dispatches: onSendMessage, onUploadAttachment)",
        "  ├── ActiveMemberList (props: members, isOpen, onStartDirectMessage)",
        "  └── UserProfileModal (props: user, isOpen, onClose, onUpdateStatus)"
      ],
      phases: [
        {
          phaseName: "Phase 1: Project Setup & Workspace Layout (HTML/Tailwind)",
          tasks: [
            {
              id: "p1-t1",
              title: "Build desktop split-screen sidebar and message viewport layout",
              difficulty: "Easy",
              hint: "Use h-screen flex overflow-hidden with w-64 sidebar and flex-1 main chat container."
            },
            {
              id: "p1-t2",
              title: "Design message bubbles with timestamp, user avatar, and reply actions",
              difficulty: "Easy",
              hint: "Style incoming messages with gray bubbles and outgoing messages with indigo accent bubbles."
            },
            {
              id: "p1-t3",
              title: "Create fixed bottom message input bar with attachment and send buttons",
              difficulty: "Easy",
              hint: "Use an auto-resizing textarea with flex items-center gap-2 and send icon button."
            }
          ]
        },
        {
          phaseName: "Phase 2: Component Structure & State Initialization",
          tasks: [
            {
              id: "p2-t1",
              title: "Model TypeScript interfaces for Channel, Message, User, and Reaction",
              difficulty: "Easy",
              hint: "Define interface Message { id: string; channelId: string; senderId: string; text: string; timestamp: number }."
            },
            {
              id: "p2-t2",
              title: "Initialize message feed state and auto-scroll to latest message on send",
              difficulty: "Medium",
              hint: "Use a messagesEndRef with ref.current?.scrollIntoView({ behavior: 'smooth' }) on messages state updates."
            },
            {
              id: "p2-t3",
              title: "Wire channel switching state with unread message badges",
              difficulty: "Medium",
              hint: "Maintain unreadCount per channel and reset to 0 when user activates that channel."
            }
          ]
        },
        {
          phaseName: "Phase 3: Interactivity, Persistence, or API Integration",
          tasks: [
            {
              id: "p3-t1",
              title: "Implement message sending, deletion, and emoji reaction state",
              difficulty: "Medium",
              hint: "Update message array immutably and toggle emoji reactions with user ID lists."
            },
            {
              id: "p3-t2",
              title: "Synchronize active conversation history to browser localStorage",
              difficulty: "Medium",
              hint: "Save message history keyed by channel ID in localStorage so chats persist across reloads."
            },
            {
              id: "p3-t3",
              title: "Build simulated real-time incoming message responder bot",
              difficulty: "Tricky",
              hint: "Trigger simulated responses with setTimeout and typing indicators (TypingIndicator component)."
            }
          ]
        },
        {
          phaseName: "Phase 4: Responsive Breakpoints, Accessibility, and Polish",
          tasks: [
            {
              id: "p4-t1",
              title: "Build mobile slide-over channel drawer with swipe gestures",
              difficulty: "Medium",
              hint: "Convert fixed sidebar to a mobile off-canvas drawer that opens on menu button click."
            },
            {
              id: "p4-t2",
              title: "Add keyboard shortcuts (Enter to send, Shift+Enter for newline)",
              difficulty: "Easy",
              hint: "Handle onKeyDown on textarea: if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }."
            },
            {
              id: "p4-t3",
              title: "Implement live member search filter and online status indicators",
              difficulty: "Easy",
              hint: "Filter members list by name and pair status text with colored indicators for accessibility."
            }
          ]
        }
      ]
    };
  }

  // 6. LEARNING MANAGEMENT SYSTEM (LMS) DOMAIN
  if (domain === "LEARNING_MANAGEMENT_SYSTEM") {
    return {
      mode: "roadmap",
      projectTitle: `${displayTitle} Implementation Blueprint`,
      componentHierarchy: [
        "App (holds: courses, activeCourse, enrolledStudents, assignments, grades, userRole, currentUser)",
        "  ├── PortalNavbar (props: userRole, activeCourse, onSwitchRole, currentUser)",
        "  ├── CourseCurriculumManager (props: modules, lessons, onAddLesson, onReorder)",
        "  ├── AssignmentSubmissionPortal (props: assignments, onSubmitWork, isStudent)",
        "  │    └── AssignmentCard (props: assignment, onOpenSubmit, submissionStatus)",
        "  ├── GradingRubricModal (props: submission, onSaveGrade, isInstructor, isOpen, onClose)",
        "  ├── StudentRosterTable (props: students, onEnrollStudent, onExportGrades)",
        "  └── InstructorAnalytics (props: completionRates, averageScore, atRiskStudents)"
      ],
      phases: [
        {
          phaseName: "Phase 1: Project Setup & Portal Navigation Layout",
          tasks: [
            {
              id: "p1-t1",
              title: "Build responsive education portal layout with role toggle (Instructor vs Student)",
              difficulty: "Easy",
              hint: "Construct top navbar with role badge switcher and left-side navigation for curriculum and assignments."
            },
            {
              id: "p1-t2",
              title: "Construct course syllabus and modular curriculum breakdown view",
              difficulty: "Easy",
              hint: "Use an expandable accordion list for weekly units with lesson titles and duration badges."
            },
            {
              id: "p1-t3",
              title: "Design assignment submission cards with due dates and grading status tags",
              difficulty: "Easy",
              hint: "Style cards with due-date warnings (amber for upcoming, red for overdue) and submission state pill."
            }
          ]
        },
        {
          phaseName: "Phase 2: Role & Curriculum State Management",
          tasks: [
            {
              id: "p2-t1",
              title: "Model TypeScript interfaces for Course, Module, Assignment, Submission, and Grade",
              difficulty: "Easy",
              hint: "Define interface Submission { id: string; assignmentId: string; studentId: string; grade?: number; feedback?: string }."
            },
            {
              id: "p2-t2",
              title: "Implement curriculum editor allowing instructors to add and reorder learning modules",
              difficulty: "Medium",
              hint: "Manage modules array in state and provide up/down movement handlers for unit ordering."
            },
            {
              id: "p2-t3",
              title: "Build assignment upload dialogue with text input and file attachment mock",
              difficulty: "Medium",
              hint: "Create form validating submission body and updating student submission status to 'Submitted'."
            }
          ]
        },
        {
          phaseName: "Phase 3: Grading Rubric, Submissions & Database Integration",
          tasks: [
            {
              id: "p3-t1",
              title: "Build instructor GradingRubricModal with score input and markdown feedback textarea",
              difficulty: "Medium",
              hint: "Update submission record with grade: number and written feedback, computing weighted average."
            },
            {
              id: "p3-t2",
              title: "Implement student gradebook table displaying scores, class averages, and progress bar",
              difficulty: "Medium",
              hint: "Compute total percentage and GPA from completed assignments with visual progress bar."
            },
            {
              id: "p3-t3",
              title: "Integrate backend persistence for assignments, enrollments, and grading records",
              difficulty: "Tricky",
              hint: "Set up API calls with error boundaries and synchronize student progress to database or localStorage."
            }
          ]
        },
        {
          phaseName: "Phase 4: Analytics, Accessibility, Export and Polish",
          tasks: [
            {
              id: "p4-t1",
              title: "Build InstructorAnalytics panel with completion rates and student performance chart",
              difficulty: "Medium",
              hint: "Display distribution of grades using simple SVG bar charts and identify students needing attention."
            },
            {
              id: "p4-t2",
              title: "Add export functionality for gradebook records to CSV format",
              difficulty: "Easy",
              hint: "Format student names and assignment scores into CSV text and trigger client-side download."
            },
            {
              id: "p4-t3",
              title: "Audit keyboard navigation across syllabus tree and screen reader labels for score inputs",
              difficulty: "Easy",
              hint: "Add aria-expanded to curriculum accordions and label all form inputs explicitly."
            }
          ]
        }
      ]
    };
  }

  // 7. ONLINE COURSE PLATFORM DOMAIN
  if (domain === "COURSE_PLATFORM") {
    return {
      mode: "roadmap",
      projectTitle: `${displayTitle} Implementation Blueprint`,
      componentHierarchy: [
        "App (holds: course, activeLesson, playlist, quizAnswers, notes, certificate, completedLessonIds)",
        "  ├── CourseHeader (props: courseTitle, overallProgress, onBackToCatalog)",
        "  ├── VideoLessonPlayer (props: lesson, onLessonComplete, onTimeUpdate)",
        "  ├── CurriculumPlaylist (props: modules, activeLessonId, onSelectLesson, completedIds)",
        "  │    └── LessonRow (props: lesson, isActive, isCompleted, onSelect)",
        "  ├── QuizPlayer (props: quizQuestions, onSubmitQuiz, score, isPassed)",
        "  ├── LessonNotesDrawer (props: notes, onSaveNote, isOpen, onClose)",
        "  └── CertificateModal (props: studentName, courseTitle, isUnlocked, onClose)"
      ],
      phases: [
        {
          phaseName: "Phase 1: Project Setup & Course Theater Layout (HTML/Tailwind)",
          tasks: [
            {
              id: "p1-t1",
              title: "Build 2-column video player theater layout with sticky curriculum sidebar",
              difficulty: "Easy",
              hint: "Use aspect-video video viewport on lg:col-span-8 and scrollable lesson list on lg:col-span-4."
            },
            {
              id: "p1-t2",
              title: "Assemble interactive CurriculumPlaylist with completion checkmarks and duration badges",
              difficulty: "Easy",
              hint: "Highlight currently playing lesson row with accent background and display duration in minutes."
            },
            {
              id: "p1-t3",
              title: "Design course progress header with overall completion percentage bar",
              difficulty: "Easy",
              hint: "Calculate (completedCount / totalLessons) * 100 and render smooth Tailwind progress bar."
            }
          ]
        },
        {
          phaseName: "Phase 2: Lesson Progression State Management",
          tasks: [
            {
              id: "p2-t1",
              title: "Model TypeScript interfaces for Course, Lesson, Quiz, Note, and Certificate",
              difficulty: "Easy",
              hint: "Define interface Lesson { id: string; title: string; videoUrl: string; duration: number; quiz?: Quiz }."
            },
            {
              id: "p2-t2",
              title: "Implement lesson auto-completion tracking and active lesson switching",
              difficulty: "Medium",
              hint: "Add completedLessonId to array when video reaches end and automatically cue the next lesson."
            },
            {
              id: "p2-t3",
              title: "Build slide-over LessonNotesDrawer with timestamped personal notes",
              difficulty: "Medium",
              hint: "Store note entries with timestamp in seconds so user can jump to exact video position."
            }
          ]
        },
        {
          phaseName: "Phase 3: Interactive Quizzes, Persistence & Certificate Unlocking",
          tasks: [
            {
              id: "p3-t1",
              title: "Build interactive QuizPlayer with multiple-choice questions and instant feedback",
              difficulty: "Medium",
              hint: "Validate user selections against correct answers and show explanations for incorrect choices."
            },
            {
              id: "p3-t2",
              title: "Synchronize course progress, completed lessons, and notes to localStorage",
              difficulty: "Medium",
              hint: "Persist completedLessonIds array and resume playback from last viewed lesson on page reload."
            },
            {
              id: "p3-t3",
              title: "Generate printable completion CertificateModal when all lessons and quizzes pass",
              difficulty: "Tricky",
              hint: "Render printable SVG certificate with recipient name, completion date, and verification ID."
            }
          ]
        },
        {
          phaseName: "Phase 4: Video Shortcuts, Mobile Polish and Accessibility",
          tasks: [
            {
              id: "p4-t1",
              title: "Add keyboard shortcuts for video player (Space to pause, Left/Right arrow to seek)",
              difficulty: "Easy",
              hint: "Attach window onKeyDown listener when video is focused: handle Space and arrow seek offsets."
            },
            {
              id: "p4-t2",
              title: "Build mobile responsive collapsible curriculum drawer with touch gestures",
              difficulty: "Easy",
              hint: "Transform desktop sidebar into a bottom slide-up drawer on mobile viewports."
            },
            {
              id: "p4-t3",
              title: "Audit closed captions container and contrast accessibility for lesson text",
              difficulty: "Easy",
              hint: "Ensure captions track is supported and lesson titles meet WCAG AA text contrast standards."
            }
          ]
        }
      ]
    };
  }

  // 8. PROJECT MANAGEMENT PLATFORM (KANBAN & SPRINTS) DOMAIN
  if (domain === "PROJECT_MANAGEMENT") {
    return {
      mode: "roadmap",
      projectTitle: `${displayTitle} Implementation Blueprint`,
      componentHierarchy: [
        "App (holds: projects, activeProject, columns, tasks, teamMembers, activeSprint, searchQuery)",
        "  ├── WorkspaceHeader (props: activeProject, sprintName, teamMembers, onOpenSettings)",
        "  ├── KanbanBoard (props: columns, tasks, onMoveTask, onOpenTaskDetails, onAddTask)",
        "  │    ├── KanbanColumn (props: column, tasks, onAddTask, onDropTask)",
        "  │    │    └── KanbanTaskCard (props: task, assignees, onDragStart, onClick)",
        "  │    │         └── PriorityBadge (props: priority)",
        "  ├── TaskDetailModal (props: task, isOpen, onClose, onUpdateStatus, onAssignMember)",
        "  ├── MemberFilterBar (props: teamMembers, selectedMemberId, onSelectMember)",
        "  └── SprintMilestoneTracker (props: burndownData, sprintProgress, daysRemaining)"
      ],
      phases: [
        {
          phaseName: "Phase 1: Project Setup & Kanban Board Column Layout",
          tasks: [
            {
              id: "p1-t1",
              title: "Construct horizontal scrolling Kanban board layout with Backlog, In Progress, Review, and Done columns",
              difficulty: "Easy",
              hint: "Use flex gap-4 overflow-x-auto min-h-screen p-6 with fixed 320px column widths."
            },
            {
              id: "p1-t2",
              title: "Design KanbanTaskCard with priority tag, assignee avatar group, and task title",
              difficulty: "Easy",
              hint: "Style cards with border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-white shadow-xs."
            },
            {
              id: "p1-t3",
              title: "Build WorkspaceHeader with sprint date range, member filter pills, and new task button",
              difficulty: "Easy",
              hint: "Create header with project title, avatar stack with + invite button, and New Issue action."
            }
          ]
        },
        {
          phaseName: "Phase 2: Board State Management, Task Cards and Drag/Drop Actions",
          tasks: [
            {
              id: "p2-t1",
              title: "Model TypeScript interfaces for Project, KanbanColumn, TaskCard, and TeamMember",
              difficulty: "Easy",
              hint: "Define interface TaskCard { id: string; columnId: string; title: string; priority: 'Low'|'Medium'|'High'; assigneeId: string }."
            },
            {
              id: "p2-t2",
              title: "Implement column movement logic (drag-and-drop or select dropdown) to update task status",
              difficulty: "Medium",
              hint: "Update task columnId in state immutably: setTasks(prev => prev.map(t => t.id === id ? { ...t, columnId } : t))."
            },
            {
              id: "p2-t3",
              title: "Build TaskDetailModal for editing description, checklists, priority, and assignees",
              difficulty: "Medium",
              hint: "Render modal when task is selected with editable title, rich description, and subtask list."
            }
          ]
        },
        {
          phaseName: "Phase 3: Assignee Filtering, Task Detail Editing and Persistence",
          tasks: [
            {
              id: "p3-t1",
              title: "Implement live member filter bar and keyword search across board columns",
              difficulty: "Medium",
              hint: "Filter visible tasks per column using .filter(t => !selectedMember || t.assigneeId === selectedMember)."
            },
            {
              id: "p3-t2",
              title: "Synchronize board state, customized columns, and task cards to localStorage",
              difficulty: "Medium",
              hint: "Save tasks and columns in localStorage and load initial state using lazy initializer function."
            },
            {
              id: "p3-t3",
              title: "Build sprint burndown progress tracker computing completed vs remaining story points",
              difficulty: "Tricky",
              hint: "Calculate percentage of points in 'Done' column and plot simple visual sprint completion bar."
            }
          ]
        },
        {
          phaseName: "Phase 4: Sprint Burndown Metrics, Keyboard Accessibility and Polish",
          tasks: [
            {
              id: "p4-t1",
              title: "Add keyboard navigation for moving tasks between columns using keyboard shortcuts",
              difficulty: "Medium",
              hint: "Support pressing Alt + Left/Right arrows to shift focused task card to adjacent column."
            },
            {
              id: "p4-t2",
              title: "Implement quick task creation inline input directly at the bottom of each column",
              difficulty: "Easy",
              hint: "Render + Add card button that transforms into a compact input field with Enter to submit."
            },
            {
              id: "p4-t3",
              title: "Audit mobile touch interactions, card dragging boundaries, and ARIA landmarks",
              difficulty: "Easy",
              hint: "Ensure touch-action: pan-y on board and add aria-roledescription='draggable task' to cards."
            }
          ]
        }
      ]
    };
  }

  // 9. TASK MANAGEMENT (PERSONAL TODO) DOMAIN
  if (domain === "TASK_MANAGEMENT") {
    return {
      mode: "roadmap",
      projectTitle: `${displayTitle} Implementation Blueprint`,
      componentHierarchy: [
        "App (holds: tasks, activeFilter, searchQuery, selectedPriority, categories, productivityScore)",
        "  ├── Navbar (props: completedCount, totalCount, onOpenSettings)",
        "  ├── TaskInputBar (dispatches: onAddTask, priorities, categories)",
        "  ├── TaskFilterTabs (props: activeFilter, onSelectFilter, categories)",
        "  ├── TaskList (props: filteredTasks, onToggleComplete, onEditTask, onDeleteTask)",
        "  │    └── TaskItem (props: task, onToggle, onEdit, onDelete)",
        "  │         └── PriorityBadge (props: priority)",
        "  ├── BatchActionsBar (props: selectedCount, onMarkAllCompleted, onClearCompleted)",
        "  └── TaskMetricsSummary (props: productivityScore, streakDays)"
      ],
      phases: [
        {
          phaseName: "Phase 1: Project Setup & Responsive Task Dashboard Layout",
          tasks: [
            {
              id: "p1-t1",
              title: "Build clean, centered task manager container with responsive max-w-2xl layout",
              difficulty: "Easy",
              hint: "Use max-w-2xl mx-auto px-4 py-12 with polished typography and unboxed card styling."
            },
            {
              id: "p1-t2",
              title: "Construct TaskInputBar with priority selector dropdown and quick-add button",
              difficulty: "Easy",
              hint: "Combine text input with priority select (Low, Medium, High) in a flex row with shadow-xs."
            },
            {
              id: "p1-t3",
              title: "Assemble TaskFilterTabs (All, Active, Completed) and productivity score badge",
              difficulty: "Easy",
              hint: "Render pill buttons with active tab highlight and a circular completion progress ring."
            }
          ]
        },
        {
          phaseName: "Phase 2: State Initialization, Task Creation and Immutable Updates",
          tasks: [
            {
              id: "p2-t1",
              title: "Model TypeScript interface for TaskItem with priority, completion status, and tags",
              difficulty: "Easy",
              hint: "Define interface TaskItem { id: string; text: string; completed: boolean; priority: 'low'|'medium'|'high'; createdAt: number }."
            },
            {
              id: "p2-t2",
              title: "Implement immutable task creation, toggle completion, and deletion handlers",
              difficulty: "Medium",
              hint: "Use functional state updates: setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))."
            },
            {
              id: "p2-t3",
              title: "Build inline task title editing with Escape key to cancel and Enter to save",
              difficulty: "Medium",
              hint: "Switch task row to input element on double-click with autofocus and blur/enter save handler."
            }
          ]
        },
        {
          phaseName: "Phase 3: Filtering, Priority Sorting, LocalStorage and Search",
          tasks: [
            {
              id: "p3-t1",
              title: "Implement real-time search query and priority level filtering without redundant state",
              difficulty: "Medium",
              hint: "Compute visibleTasks using useMemo filtering by search term and active status tab."
            },
            {
              id: "p3-t2",
              title: "Synchronize tasks and user preferences to browser localStorage with error safety",
              difficulty: "Medium",
              hint: "Write tasks to localStorage inside useEffect and load safely with fallback empty array."
            },
            {
              id: "p3-t3",
              title: "Build BatchActionsBar for clearing completed tasks and marking all done in one click",
              difficulty: "Tricky",
              hint: "Show floating bottom bar when completed count > 0 with Clear Completed confirmation."
            }
          ]
        },
        {
          phaseName: "Phase 4: Keyboard Shortcuts, Drag-and-Drop Polish and Accessibility",
          tasks: [
            {
              id: "p4-t1",
              title: "Add global keyboard shortcut (slash / or N) to focus new task input instantly",
              difficulty: "Easy",
              hint: "Attach window keydown listener: if (e.key === '/' && document.activeElement !== input) inputRef.current?.focus()."
            },
            {
              id: "p4-t2",
              title: "Audit checkbox accessibility, strikethrough animations, and ARIA checked states",
              difficulty: "Easy",
              hint: "Use semantic <input type='checkbox'> paired with <label> and smooth text-decoration transition."
            },
            {
              id: "p4-t3",
              title: "Build encouraging empty state illustration with sample tasks button when list is clear",
              difficulty: "Easy",
              hint: "Display friendly celebration message when all tasks are finished with a Load Sample Tasks link."
            }
          ]
        }
      ]
    };
  }

  // 10. ARTICLE READER & DOCUMENTATION VIEWER DOMAIN
  if (domain === "ARTICLE_READER") {
    return {
      mode: "roadmap",
      projectTitle: `${displayTitle} Implementation Blueprint`,
      componentHierarchy: [
        "App (state: articles, activeCategory, searchQuery, readingArticle, bookmarks, readingProgress)",
        "  ├── HeaderNav (props: theme, bookmarksCount, onOpenBookmarks)",
        "  ├── CategoryFilterBar (props: categories, activeCategory, onSelectCategory)",
        "  ├── ArticleListing (props: articles, onSelectArticle, onBookmark)",
        "  │    └── ArticleCard (props: article, onReadArticle, isBookmarked)",
        "  ├── ArticleReader (props: article, onClose, onBookmark)",
        "  │    ├── TableOfContents (props: headings, activeSection, onScrollToSection)",
        "  │    ├── MarkdownRenderer (props: content, codeTheme)",
        "  │    └── ReadingProgressBar (props: progressPercentage)",
        "  └── BookmarkDrawer (props: bookmarkedArticles, isOpen, onClose, onSelectArticle)"
      ],
      phases: [
        {
          phaseName: "Phase 1: Project Setup & Typography Layout (HTML/Tailwind)",
          tasks: [
            {
              id: "p1-t1",
              title: "Setup editorial typographic scale and responsive header navigation",
              difficulty: "Easy",
              hint: "Use Tailwind's prose class with max-w-3xl mx-auto and refined display font pairing."
            },
            {
              id: "p1-t2",
              title: "Assemble responsive article cards with estimated reading times and author avatars",
              difficulty: "Easy",
              hint: "Compute reading time (words / 200) and display publication dates with clean unboxed text."
            },
            {
              id: "p1-t3",
              title: "Design reading layout container with floating table-of-contents sidebar",
              difficulty: "Easy",
              hint: "Use a 2-column layout on desktop (lg:grid-cols-12) with sticky sidebar on lg:col-span-3."
            }
          ]
        },
        {
          phaseName: "Phase 2: Component Structure & State Initialization",
          tasks: [
            {
              id: "p2-t1",
              title: "Model TypeScript interfaces for Article, Author, Category, and Bookmark",
              difficulty: "Easy",
              hint: "Define interface Article { id: string; title: string; content: string; slug: string; readTime: number }."
            },
            {
              id: "p2-t2",
              title: "Implement markdown parser with syntax highlighted code blocks",
              difficulty: "Medium",
              hint: "Render markdown tokens with pre and code tags styled with monospace typography and copy buttons."
            },
            {
              id: "p2-t3",
              title: "Wire category filter bar and search query filtering state",
              difficulty: "Medium",
              hint: "Filter articles by tag or title without reloading the page, updating the visible card count."
            }
          ]
        },
        {
          phaseName: "Phase 3: Interactivity, Persistence, or API Integration",
          tasks: [
            {
              id: "p3-t1",
              title: "Implement scroll-synchronized reading progress bar",
              difficulty: "Medium",
              hint: "Calculate (window.scrollY / (documentHeight - windowHeight)) * 100 in a scroll event listener."
            },
            {
              id: "p3-t2",
              title: "Synchronize bookmarked articles with browser localStorage",
              difficulty: "Medium",
              hint: "Store bookmark IDs in localStorage and render a dedicated drawer to quickly access saved reads."
            },
            {
              id: "p3-t3",
              title: "Implement dynamic TableOfContents with intersection observer section spy",
              difficulty: "Tricky",
              hint: "Use IntersectionObserver on heading tags to highlight the currently visible chapter in the sidebar."
            }
          ]
        },
        {
          phaseName: "Phase 4: Responsive Breakpoints, Accessibility, and Polish",
          tasks: [
            {
              id: "p4-t1",
              title: "Implement dark mode reader theme with high-contrast text compensation",
              difficulty: "Easy",
              hint: "Apply dark:prose-invert with slightly heavier font weight in dark mode for optimal legibility."
            },
            {
              id: "p4-t2",
              title: "Add one-click code block copy button with checkmark feedback",
              difficulty: "Easy",
              hint: "Use navigator.clipboard.writeText with a temporary 2-second check icon transition."
            },
            {
              id: "p4-t3",
              title: "Audit keyboard navigation across articles and drawer focus trap",
              difficulty: "Medium",
              hint: "Ensure pressing Escape closes the reading overlay and restores focus to the triggering card."
            }
          ]
        }
      ]
    };
  }

  // 11. RECIPE & CULINARY FINDER DOMAIN
  if (domain === "RECIPE_FINDER") {
    return {
      mode: "roadmap",
      projectTitle: `${displayTitle} Implementation Blueprint`,
      componentHierarchy: [
        "App (holds: recipes, searchQuery, selectedDietTag, activeRecipe, favorites, mealPlan)",
        "  ├── Navbar (props: favoritesCount, onOpenFavorites, onOpenMealPlan)",
        "  ├── SearchFilterBar (props: searchQuery, onSearchChange, onClearSearch)",
        "  ├── DietaryTagSelector (props: tags, selectedTag, onSelectTag)",
        "  ├── RecipeListing (props: recipes, onSelectRecipe, onToggleFavorite, isFavorite)",
        "  │    └── RecipeCard (props: recipe, onOpenDetails, onToggleFavorite)",
        "  ├── RecipeDetails (props: recipe, isOpen, onClose, onAddToMealPlan)",
        "  │    ├── IngredientsChecklist (props: ingredients, onToggleIngredient)",
        "  │    └── NutritionFacts (props: calories, protein, carbs, fat)",
        "  ├── FavoritesDrawer (props: favorites, isOpen, onClose, onSelectRecipe)",
        "  └── MealPlannerCalendar (props: mealPlan, onRemoveMeal, onGenerateGroceryList)"
      ],
      phases: [
        {
          phaseName: "Phase 1: Project Setup & Recipe Catalog Layout (HTML/Tailwind)",
          tasks: [
            {
              id: "p1-t1",
              title: "Build responsive search header with dietary tag pill filters",
              difficulty: "Easy",
              hint: "Use an input with search icon and a horizontal overflow-x-auto container with category buttons."
            },
            {
              id: "p1-t2",
              title: "Assemble responsive recipe cards with cooking time and difficulty tags",
              difficulty: "Easy",
              hint: "Create cards with aspect-video thumbnail images, prep time badges, and a bookmark favorite icon."
            },
            {
              id: "p1-t3",
              title: "Design modal shell for recipe details, ingredients list, and instructions",
              difficulty: "Easy",
              hint: "Build a responsive modal with a scrollable ingredients list and step-by-step preparation tabs."
            }
          ]
        },
        {
          phaseName: "Phase 2: Component Structure & State Initialization",
          tasks: [
            {
              id: "p2-t1",
              title: "Model TypeScript interfaces for Recipe, Ingredient, Nutrition, and FilterState",
              difficulty: "Easy",
              hint: "Define Recipe interface with id, name, ingredients: string[], prepTimeMinutes: number, and tags: string[]."
            },
            {
              id: "p2-t2",
              title: "Implement live ingredient search and multi-tag filtering logic",
              difficulty: "Medium",
              hint: "Filter recipes by name.toLowerCase().includes(query) and tags matching activeTag dynamically without redundant state."
            },
            {
              id: "p2-t3",
              title: "Build interactive IngredientsChecklist with strike-through completion state",
              difficulty: "Medium",
              hint: "Manage checked state as Record<string, boolean> to strike through ingredients as user shops or cooks."
            }
          ]
        },
        {
          phaseName: "Phase 3: Interactivity, Persistence, or API Integration",
          tasks: [
            {
              id: "p3-t1",
              title: "Implement bookmarking favorites and synchronize with localStorage",
              difficulty: "Medium",
              hint: "Toggle favorite recipe IDs in an array and persist to localStorage on every change."
            },
            {
              id: "p3-t2",
              title: "Integrate external recipe REST API (e.g., TheMealDB or Edamam)",
              difficulty: "Tricky",
              hint: "Fetch data asynchronously in useEffect with loading indicators and try/catch error boundaries."
            },
            {
              id: "p3-t3",
              title: "Build weekly MealPlanner calendar with automated grocery list generator",
              difficulty: "Tricky",
              hint: "Map recipes to days (Mon-Sun) and aggregate all ingredients into a consolidated shopping checklist."
            }
          ]
        },
        {
          phaseName: "Phase 4: Responsive Breakpoints, Accessibility, and Polish",
          tasks: [
            {
              id: "p4-t1",
              title: "Implement servings multiplier that dynamically recalculates ingredient amounts",
              difficulty: "Medium",
              hint: "Multiply ingredient quantities by (currentServings / defaultServings) using round-to-nearest fraction."
            },
            {
              id: "p4-t2",
              title: "Add nutrition facts badge panel with macronutrient progress bars",
              difficulty: "Easy",
              hint: "Display calories, protein, and carbs with visual progress bars and color-coded RDA percentages."
            },
            {
              id: "p4-t3",
              title: "Audit mobile recipe card layout, image lazy-loading, and printable view",
              difficulty: "Easy",
              hint: "Use loading='lazy' on images and add @media print CSS to allow clean recipe printing without UI clutter."
            }
          ]
        }
      ]
    };
  }

  // 12. ANALYTICS DASHBOARD & SAAS DOMAIN
  if (domain === "ANALYTICS_DASHBOARD") {
    return {
      mode: "roadmap",
      projectTitle: `${displayTitle} Implementation Blueprint`,
      componentHierarchy: [
        "App (state: metrics, dateRange, activeFilter, dataRecords, selectedRecord, userRole)",
        "  ├── SidebarNav (props: activeView, onNavigate, userRole)",
        "  ├── HeaderBar (props: dateRange, onDateRangeChange, onRefreshData)",
        "  ├── KPISummaryGrid (props: totalRevenue, activeUsers, churnRate, growthPercentage)",
        "  │    └── MetricCard (props: title, value, changeDelta, isPositive)",
        "  ├── AnalyticsChartContainer (props: chartData, activeMetric)",
        "  ├── DataTableSection (props: records, onSort, onFilter, onSelectRow)",
        "  │    ├── DataTableFilterBar (props: searchQuery, onSearchChange, onExportCSV)",
        "  └── ExportReportModal (props: records, isOpen, onClose, onDownload)"
      ],
      phases: [
        {
          phaseName: "Phase 1: Project Setup & Dashboard Grid Layout (HTML/Tailwind)",
          tasks: [
            {
              id: "p1-t1",
              title: "Construct responsive dashboard layout with collapsible navigation sidebar",
              difficulty: "Easy",
              hint: "Use h-screen flex bg-slate-50 dark:bg-slate-950 with w-64 desktop sidebar."
            },
            {
              id: "p1-t2",
              title: "Build KPI summary metric card grid with trend percentage indicators",
              difficulty: "Easy",
              hint: "Create a 4-column card grid using tabular-nums for numeric figures and green/red trend badges."
            },
            {
              id: "p1-t3",
              title: "Design high-density data table layout with sorting headers and pagination bar",
              difficulty: "Easy",
              hint: "Use overflow-x-auto with divide-y table rows having hover:bg-slate-50 row highlights."
            }
          ]
        },
        {
          phaseName: "Phase 2: Component Structure & State Initialization",
          tasks: [
            {
              id: "p2-t1",
              title: "Model TypeScript interfaces for MetricRecord, FilterCriteria, and UserRole",
              difficulty: "Easy",
              hint: "Define interface MetricRecord { id: string; timestamp: number; revenue: number; status: string }."
            },
            {
              id: "p2-t2",
              title: "Initialize date range picker state and multi-column sorting logic",
              difficulty: "Medium",
              hint: "Maintain sortKey and sortDirection in state, sorting array via [...records].sort() comparator."
            },
            {
              id: "p2-t3",
              title: "Build SVG-based lightweight trendline sparklines or bar chart visualizer",
              difficulty: "Medium",
              hint: "Render clean SVG paths with viewBox='0 0 100 30' plotting normalized coordinate points."
            }
          ]
        },
        {
          phaseName: "Phase 3: Interactivity, Persistence, or API Integration",
          tasks: [
            {
              id: "p3-t1",
              title: "Implement real-time table search, status filter, and pagination slice",
              difficulty: "Medium",
              hint: "Calculate pagedRecords using filteredRecords.slice((page - 1) * pageSize, page * pageSize)."
            },
            {
              id: "p3-t2",
              title: "Build client-side CSV and JSON report exporter",
              difficulty: "Tricky",
              hint: "Create a Blob with CSV content, generate a URL via URL.createObjectURL, and trigger download."
            },
            {
              id: "p3-t3",
              title: "Synchronize user dashboard preferences and saved filter presets to localStorage",
              difficulty: "Medium",
              hint: "Store active columns and date presets in localStorage for instant retrieval on page reload."
            }
          ]
        },
        {
          phaseName: "Phase 4: Responsive Breakpoints, Accessibility, and Polish",
          tasks: [
            {
              id: "p4-t1",
              title: "Audit tabular number alignment and dark mode optical surface contrast",
              difficulty: "Easy",
              hint: "Enforce tabular-nums on all metrics and use subtle 1px border lines without card clutter."
            },
            {
              id: "p4-t2",
              title: "Add keyboard navigation for table row selection and modal dialogs",
              difficulty: "Medium",
              hint: "Support arrow key row navigation and ensure modals trap focus with accessible aria-modal."
            },
            {
              id: "p4-t3",
              title: "Build loading skeleton placeholders matching exact table and metric geometry",
              difficulty: "Easy",
              hint: "Create skeleton rows with animate-pulse matching the 40px table row heights."
            }
          ]
        }
      ]
    };
  }

  // 13. DYNAMIC FEATURE-DRIVEN CUSTOM ARCHITECTURE (FOR ANY OTHER DOMAIN)
  // Intelligently analyzes entities, authentication, CRUD, search, and admin features
  const lowerPrompt = rawIdea.toLowerCase();
  const words = rawIdea.split(/\s+/).filter(w => w.length > 3 && !['with', 'that', 'from', 'have', 'this', 'using', 'make', 'build', 'create', 'include', 'project', 'platform', 'application', 'modern'].includes(w.toLowerCase()));
  const entityCandidate = words[0] || "Item";
  const cleanEntity = entityCandidate.charAt(0).toUpperCase() + entityCandidate.slice(1).replace(/[^a-zA-Z]/g, "");

  const hasAuth = /user registration|register|login|signup|auth|user profile/i.test(lowerPrompt);
  const hasCrud = /create|edit|delete|manage|add|update/i.test(lowerPrompt);
  const hasComments = /comment|review|rating|feedback/i.test(lowerPrompt);
  const hasSearch = /search|filter|category|tags/i.test(lowerPrompt);
  const hasAdmin = /admin|moderator|dashboard|reports/i.test(lowerPrompt);

  const hierarchy: string[] = [
    `App (holds: ${cleanEntity.toLowerCase()}List, activeFilter, searchQuery, selected${cleanEntity}${hasAuth ? ", currentUser" : ""})`,
    `  ├── TopNavbar (props: ${hasAuth ? "currentUser, " : ""}onOpenCreate, onFilterChange)`,
    ...(hasAuth ? [
      "  ├── Authentication (state: authMode; dispatches: onLogin, onRegister)",
      "  │    ├── LoginModal (props: onLogin, onSwitch)",
      "  │    └── RegisterModal (props: onRegister, onSwitch)"
    ] : []),
    ...(hasSearch ? [
      `  ├── ${cleanEntity}FilterBar (props: activeFilter, onSelectFilter, searchQuery, onSearchChange)`
    ] : []),
    `  ├── ${cleanEntity}Feed (props: ${cleanEntity.toLowerCase()}List, onSelect${cleanEntity}, onAction)`,
    `  │    └── ${cleanEntity}Card (props: itemData, onOpenDetails, onAction)`,
    `  ├── ${cleanEntity}DetailsModal (props: selectedItem, isOpen, onClose)`,
    ...(hasComments ? [
      `  │    └── ${cleanEntity}ReviewSection (props: itemId, reviews, onAddReview)`
    ] : []),
    ...(hasCrud ? [
      `  ├── ${cleanEntity}ManagementModal (props: item, isOpen, onClose, onSave, onDelete)`,
      `  │    ├── Create${cleanEntity}Form (dispatches: onCreate)`,
      `  │    └── Edit${cleanEntity}Form (props: item, dispatches: onUpdate)`
    ] : []),
    ...(hasAdmin ? [
      `  └── Admin${cleanEntity}Panel (props: allItems, onModerate, onExport)`
    ] : [])
  ];

  return {
    mode: "roadmap",
    projectTitle: `${displayTitle} Implementation Blueprint`,
    componentHierarchy: hierarchy,
    phases: [
      {
        phaseName: `Phase 1: Project Setup & ${cleanEntity} Feed Layout`,
        tasks: [
          {
            id: "p1-t1",
            title: `Build responsive viewport layout and ${cleanEntity} navigation bar`,
            difficulty: "Easy",
            hint: `Construct header with brand branding, search input trigger, and navigation links.`
          },
          {
            id: "p1-t2",
            title: `Assemble static ${cleanEntity} grid layout and card preview components`,
            difficulty: "Easy",
            hint: `Use responsive Tailwind grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3) with card borders.`
          },
          {
            id: "p1-t3",
            title: `Create modal dialog container for ${cleanEntity} details and inspect view`,
            difficulty: "Easy",
            hint: `Build a fixed backdrop overlay with centered responsive dialog and keyboard escape handler.`
          }
        ]
      },
      {
        phaseName: `Phase 2: ${hasAuth ? "Authentication & " : ""}${cleanEntity} Data Modeling and Structure`,
        tasks: [
          {
            id: "p2-t1",
            title: `Model TypeScript data interfaces for ${cleanEntity}${hasAuth ? ", User, and Session" : " and interaction state"}`,
            difficulty: "Easy",
            hint: `Define interface ${cleanEntity} { id: string; title: string; createdAt: number; status: string }.`
          },
          {
            id: "p2-t2",
            title: `Initialize primary ${cleanEntity.toLowerCase()}List state with immutable updater callbacks`,
            difficulty: "Medium",
            hint: `Manage state in App and pass down updater callbacks like onAdd, onDelete, and onUpdate.`
          },
          {
            id: "p2-t3",
            title: `Implement ${hasCrud ? `${cleanEntity} form input validation and creation handlers` : "interactive card action triggers and selection state"}`,
            difficulty: "Medium",
            hint: `Validate required fields before state dispatch and reset form fields upon completion.`
          }
        ]
      },
      {
        phaseName: `Phase 3: ${hasSearch ? "Search, " : ""}Interactivity, Persistence and API Integration`,
        tasks: [
          {
            id: "p3-t1",
            title: `Implement real-time ${cleanEntity.toLowerCase()} keyword search and status filtering logic`,
            difficulty: "Medium",
            hint: `Derive filtered list dynamically using .filter() to prevent stale synchronization bugs.`
          },
          {
            id: "p3-t2",
            title: `Synchronize ${cleanEntity.toLowerCase()} items and user preferences to browser localStorage`,
            difficulty: "Medium",
            hint: `Save to localStorage inside useEffect and load on mount with a safe JSON fallback.`
          },
          {
            id: "p3-t3",
            title: `Integrate REST API endpoints or external asynchronous data fetching`,
            difficulty: "Tricky",
            hint: `Set up async fetch calls with loading spinners and error alert boundaries.`
          }
        ]
      },
      {
        phaseName: `Phase 4: ${hasAdmin ? "Admin Dashboard, " : ""}Responsive Polish, Accessibility and Deployment`,
        tasks: [
          {
            id: "p4-t1",
            title: `Audit focus rings, keyboard navigation, and ARIA attributes for all interactive controls`,
            difficulty: "Medium",
            hint: `Add focus-visible:ring-2 focus-visible:ring-indigo-500 to buttons and inputs.`
          },
          {
            id: "p4-t2",
            title: `Test mobile responsiveness across 375px phone, tablet, and desktop viewports`,
            difficulty: "Easy",
            hint: `Ensure minimum 44px touch targets on mobile and prevent horizontal viewport overflow.`
          },
          {
            id: "p4-t3",
            title: `Build engaging empty state with quick-start action when list is empty`,
            difficulty: "Easy",
            hint: `Show a friendly prompt and an action button to create the first ${cleanEntity.toLowerCase()}.`
          }
        ]
      }
    ]
  };
}
