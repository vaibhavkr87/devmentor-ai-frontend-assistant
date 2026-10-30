export interface ConceptGuide {
  id: string;
  category: 'React Mental Model' | 'CSS Layout Mastery' | 'JavaScript Fundamentals' | 'Accessibility & HTML';
  title: string;
  summary: string;
  badExample?: string;
  goodExample?: string;
  keyTakeaway: string;
}

export const CONCEPT_GUIDES: ConceptGuide[] = [
  {
    id: 'state-immutability',
    category: 'React Mental Model',
    title: 'Never Mutate React State Directly',
    summary: 'React compares state references using Object.is. If you push into an array or reassign an object property, the memory reference remains identical, so React skips re-rendering.',
    badExample: `// ❌ Mutating the existing array in memory
const handleAdd = (item) => {
  items.push(item);
  setItems(items); // React thinks nothing changed!
};`,
    goodExample: `// ✅ Creating a new array reference
const handleAdd = (item) => {
  setItems(prevItems => [...prevItems, item]);
};`,
    keyTakeaway: 'Always create a new array or object with the spread operator (...) or pure functions like .filter() and .map().'
  },
  {
    id: 'useeffect-rules',
    category: 'React Mental Model',
    title: 'The useEffect Mental Model & Dependency Array',
    summary: 'useEffect synchronizes your component with an external system (timers, DOM events, server fetches). It is NOT just a lifecycle hook.',
    badExample: `// ❌ Missing dependency array triggers infinite loop
useEffect(() => {
  fetchData().then(data => setData(data));
});`,
    goodExample: `// ✅ Empty array runs once on mount; return cleanup on unmount
useEffect(() => {
  let isMounted = true;
  fetchData().then(data => {
    if (isMounted) setData(data);
  });
  return () => { isMounted = false; };
}, []);`,
    keyTakeaway: 'Every reactive value (props, state) used inside useEffect must be listed in its dependency array.'
  },
  {
    id: 'flexbox-centering-overflow',
    category: 'CSS Layout Mastery',
    title: 'Flexbox Centering & Mobile Overflow Prevention',
    summary: 'Flex containers by default have flex-wrap: nowrap. Without min-w-0 or responsive flex-col, child items will force the viewport to overflow horizontally on small screens.',
    badExample: `<!-- ❌ Fixed width blowout on 375px mobile -->
<div class="flex flex-row">
  <div class="w-[500px]">Content overflows screen!</div>
</div>`,
    goodExample: `<!-- ✅ Mobile-first flex direction with flexible widths -->
<div class="flex flex-col md:flex-row items-center justify-center gap-4">
  <div class="w-full md:w-1/2 min-w-0">Responsive content!</div>
</div>`,
    keyTakeaway: 'Default to flex-col on mobile, add flex-wrap, and use min-w-0 on flex children to allow text truncation.'
  },
  {
    id: 'zindex-stacking-context',
    category: 'CSS Layout Mastery',
    title: 'Understanding Stacking Contexts',
    summary: 'A z-index: 9999 element will still render BEHIND a z-index: 1 element if the first elements parent creates a separate stacking context with lower z-index.',
    badExample: `<!-- Parent A has z-index: 1. Child z-index: 9999 cannot escape Parent A! -->
<div style="position: relative; z-index: 1;">
  <div style="position: absolute; z-index: 9999;">Menu</div>
</div>
<div style="position: relative; z-index: 2;">Content</div>`,
    goodExample: `<!-- Lift parent stacking context or render portaled to document.body -->
<div style="position: relative; z-index: 10;">
  <div style="position: absolute; z-index: 20;">Menu</div>
</div>
<div style="position: relative; z-index: 5;">Content</div>`,
    keyTakeaway: 'z-index values are only compared between sibling elements within the same parent stacking context.'
  },
  {
    id: 'semantic-html-button',
    category: 'Accessibility & HTML',
    title: 'Always Use <button> Instead of <div onClick>',
    summary: 'A <div> has no keyboard accessibility, cannot be focused via Tab, does not respond to Enter or Space keys, and is invisible to screen readers as an interactive control.',
    badExample: `<!-- ❌ Inaccessible: no focus, no Enter key, no screen reader role -->
<div onClick={handleClick} class="cursor-pointer bg-blue-500 text-white p-2">
  Submit
</div>`,
    goodExample: `<!-- ✅ Accessible: native keyboard navigation & ARIA semantics built-in -->
<button type="button" onClick={handleClick} class="bg-indigo-600 text-white px-4 py-2 rounded-lg focus-visible:ring-2">
  Submit
</button>`,
    keyTakeaway: 'If an action triggers JavaScript without navigating to a URL, use <button>. If it navigates, use <a>.'
  }
];
