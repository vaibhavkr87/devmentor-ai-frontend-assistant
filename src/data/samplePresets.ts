import type { TechStack } from '../types/index.ts';

export interface SampleBug {
  id: string;
  name: string;
  techStack: TechStack;
  category: 'Runtime / Logic' | 'Visual / Layout';
  code: string;
  errorDescription: string;
}

export const SAMPLE_BUGS: SampleBug[] = [
  {
    id: 'infinite-useeffect',
    name: 'Infinite useEffect Re-render Loop',
    techStack: 'React + Tailwind CSS',
    category: 'Runtime / Logic',
    code: `import { useState, useEffect } from 'react';

export default function UserCounter() {
  const [count, setCount] = useState(0);

  // Trying to increment every second, but tab freezes!
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(count + 1);
    }, 1000);
    // Missing dependencies and cleanup!
  });

  return (
    <div className="p-4 bg-slate-800 text-white rounded-lg">
      <h2 className="text-lg font-semibold">Active Counter</h2>
      <p className="text-3xl font-mono mt-2">{count}</p>
    </div>
  );
}`,
    errorDescription: "Console shows: 'Warning: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate.' The browser tab lags and becomes unresponsive."
  },
  {
    id: 'map-undefined',
    name: 'Cannot read properties of undefined (reading "map")',
    techStack: 'React + Tailwind CSS',
    category: 'Runtime / Logic',
    code: `import { useState, useEffect } from 'react';

export default function StudentRoster() {
  // Initialized without default value
  const [students, setStudents] = useState();

  useEffect(() => {
    fetch('/api/students')
      .then(res => res.json())
      .then(data => setStudents(data.roster));
  }, []);

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <h3 className="text-base font-bold text-slate-800">Enrolled Students</h3>
      <ul className="mt-4 space-y-2">
        {students.map((student) => (
          <li key={student.id} className="text-sm text-slate-600">
            {student.name}
          </li>
        ))}
      </ul>
    </div>
  );
}`,
    errorDescription: "Uncaught TypeError: Cannot read properties of undefined (reading 'map'). Crashes as soon as the page loads before data has fetched."
  },
  {
    id: 'flex-overflow-mobile',
    name: 'Cards Won\'t Center & Overflow Mobile',
    techStack: 'React + Tailwind CSS',
    category: 'Visual / Layout',
    code: `<div className="w-full bg-slate-100 p-8">
  <h2 className="text-2xl font-bold mb-4">Featured Services</h2>
  {/* Flex row without wrap, min-width causes horizontal blowout */}
  <div className="flex flex-row gap-6">
    <div className="min-w-[380px] p-6 bg-white rounded-xl shadow-sm">
      <h3 className="text-lg font-bold">Fast Delivery</h3>
      <p className="text-slate-600 mt-2">Guaranteed shipping within 24 hours anywhere nationwide.</p>
    </div>
    <div className="min-w-[380px] p-6 bg-white rounded-xl shadow-sm">
      <h3 className="text-lg font-bold">24/7 Support</h3>
      <p className="text-slate-600 mt-2">Dedicated frontend mentors ready to assist anytime.</p>
    </div>
    <div className="min-w-[380px] p-6 bg-white rounded-xl shadow-sm">
      <h3 className="text-lg font-bold">Flexible Plans</h3>
      <p className="text-slate-600 mt-2">Upgrade or downgrade anytime without cancellation fees.</p>
    </div>
  </div>
</div>`,
    errorDescription: "On mobile screen (375px), the cards cause horizontal scrollbar blowout and cannot be centered. Users have to scroll horizontally off-screen to view cards."
  },
  {
    id: 'zindex-stacking',
    name: 'CSS z-index Not Stacking Above Sibling',
    techStack: 'Vanilla HTML/CSS/JS',
    category: 'Visual / Layout',
    code: `<div class="container">
  <div class="sidebar" style="position: relative; z-index: 10;">
    <div class="dropdown-menu" style="position: absolute; top: 100%; left: 0; z-index: 9999; background: white; padding: 12px; border: 1px solid #ccc;">
      Dropdown Item 1<br>Dropdown Item 2
    </div>
  </div>
  <div class="main-content" style="position: relative; z-index: 20; background: #f3f4f6; height: 300px;">
    <h2>Main Dashboard View</h2>
    <p>Content that covers the dropdown!</p>
  </div>
</div>`,
    errorDescription: "Even though .dropdown-menu has z-index: 9999, it is rendered underneath .main-content. Why is z-index being ignored?"
  },
  {
    id: 'direct-state-mutation',
    name: 'State Mutation with .push() Doesn\'t Re-render',
    techStack: 'React + Tailwind CSS',
    category: 'Runtime / Logic',
    code: `import { useState } from 'react';

export default function TodoList() {
  const [todos, setTodos] = useState(['Buy groceries', 'Walk the dog']);
  const [input, setInput] = useState('');

  const handleAdd = () => {
    // Mutating state directly
    todos.push(input);
    setTodos(todos);
    setInput('');
  };

  return (
    <div className="p-6">
      <input 
        value={input} 
        onChange={(e) => setInput(e.target.value)} 
        className="border p-2 rounded" 
      />
      <button onClick={handleAdd} className="ml-2 px-4 py-2 bg-indigo-600 text-white rounded">
        Add
      </button>
      <ul className="mt-4">
        {todos.map((todo, idx) => <li key={idx}>{todo}</li>)}
      </ul>
    </div>
  );
}`,
    errorDescription: "When clicking 'Add', the new todo does not appear on screen. But if I console.log(todos), the array contains the new item. Why is React not updating the screen?"
  }
];

export interface SampleProjectIdea {
  id: string;
  title: string;
  techStack: TechStack;
  description: string;
}

export const SAMPLE_PROJECT_IDEAS: SampleProjectIdea[] = [
  {
    id: 'habit-tracker',
    title: 'Daily Habit Tracker with Streaks & LocalStorage',
    techStack: 'React + Tailwind CSS',
    description: 'A responsive daily habit tracker where users can create habits, check them off for today, view consecutive day streak counters, toggle dark mode, and persist all progress in localStorage.'
  },
  {
    id: 'recipe-finder',
    title: 'Recipe Search & Favorites with Modal View',
    techStack: 'React + Tailwind CSS',
    description: 'A recipe finder application where users search meals by ingredient, filter by dietary tag (vegan, gluten-free), click a recipe card to view an ingredients modal, and bookmark favorites.'
  },
  {
    id: 'interactive-kanban',
    title: 'Minimalist Kanban Task Board',
    techStack: 'React + Tailwind CSS',
    description: 'A 3-column Kanban board (To Do, In Progress, Done) with quick task creation, drag or move actions between columns, priority difficulty badges, and clean search filter.'
  },
  {
    id: 'vanilla-calculator',
    title: 'Vanilla JS Scientific Calculator with History',
    techStack: 'Vanilla HTML/CSS/JS',
    description: 'A clean, responsive mobile-friendly calculator built purely with semantic HTML, modern CSS Grid, and native JavaScript event delegation, complete with calculation tape history.'
  }
];
