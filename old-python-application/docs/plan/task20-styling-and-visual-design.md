# Task 20: Styling and Visual Design

**Files:**
- Modify: `claude-code-visualizer/frontend/src/styles/main.css`

**Step 1: Apply design system colors from specification**

Update color variables and ensure consistency with design doc:

```css
:root {
  /* Color palette from design spec */
  --color-user-border: #3b82f6;
  --color-assistant-border: #ef4444;
  --color-tool-use-border: #22c55e;
  --color-tool-result-border: #f59e0b;

  --color-bg-main: #f9fafb;
  --color-bg-white: #ffffff;
  --color-bg-light: #f3f4f6;
  --color-bg-dark: #1f2937;

  --color-text-primary: #1f2937;
  --color-text-secondary: #6b7280;
  --color-text-muted: #9ca3af;

  --color-match-highlight: #fef08a;
  --color-match-current: #fb923c;

  --color-error: #dc2626;
  --color-error-bg: #fee2e2;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 6px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
}

/* Apply color variables throughout */
.message-container.user {
  border-left: 4px solid var(--color-user-border);
}

.message-container.assistant {
  border-left: 4px solid var(--color-assistant-border);
}

.tool-container.tool-use {
  border-left: 3px solid var(--color-tool-use-border);
}

.tool-container.tool-result {
  border-left: 3px solid var(--color-tool-result-border);
}
```

**Step 2: Improve typography consistency**

```css
/* Typography system */
body {
  font-family: system-ui, -apple-system, 'Segoe UI', 'Roboto', sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-primary);
  background: var(--color-bg-main);
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  line-height: 1.3;
  margin: 0;
}

h2 {
  font-size: 1rem;
  color: var(--color-text-primary);
}

h3 {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

code, pre {
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
}
```

**Step 3: Add interactive state improvements**

```css
/* Button and interactive elements */
button {
  font-family: inherit;
  font-size: inherit;
  transition: all 0.2s ease;
}

button:focus-visible {
  outline: 2px solid var(--color-user-border);
  outline-offset: 2px;
}

/* Hover states */
.message-header:hover {
  background: rgba(0, 0, 0, 0.02);
  transition: background 0.2s ease;
}

.tool-header:hover {
  background: rgba(0, 0, 0, 0.02);
  transition: background 0.2s ease;
}

.project-list li:hover,
.session-list li:hover {
  background: var(--color-bg-light);
  transition: background 0.2s ease;
}

/* Selected states */
.project-list li.selected {
  background: #dbeafe;
  color: #1e40af;
  font-weight: 500;
  border-left: 3px solid var(--color-user-border);
  padding-left: calc(0.75rem - 3px);
}

.session-list li.selected {
  background: #dbeafe;
  border-left-color: var(--color-user-border);
}
```

**Step 4: Enhance code block styling**

```css
/* Code blocks with syntax-aware styling */
pre {
  background: var(--color-bg-dark);
  color: #f3f4f6;
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  line-height: 1.5;
  overflow-x: auto;
  margin: var(--spacing-sm) 0;
}

pre::-webkit-scrollbar {
  height: 6px;
}

pre::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

pre::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

/* JSON formatting in tool inputs/results */
.tool-input pre,
.tool-result pre {
  background: var(--color-bg-dark);
  color: #d1d5db;
  tab-size: 2;
}
```

**Step 5: Add focus and accessibility improvements**

```css
/* Focus indicators for accessibility */
*:focus-visible {
  outline: 2px solid var(--color-user-border);
  outline-offset: 2px;
}

/* Improve clickable area indicators */
.message-header,
.tool-header {
  cursor: pointer;
  user-select: none;
  border-radius: var(--radius-sm);
}

.message-header:active,
.tool-header:active {
  transform: scale(0.995);
}

/* Disabled state styling */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--color-bg-light);
}
```

**Step 6: Add thinking content visual distinction**

```css
/* Thinking blocks stand out visually */
.thinking-content {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #fbbf24;
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  position: relative;
}

.thinking-content::before {
  content: '💭';
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  font-size: 1.25rem;
  opacity: 0.3;
}

.thinking-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #92400e;
  margin-bottom: var(--spacing-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.thinking-content pre {
  background: rgba(255, 255, 255, 0.5);
  color: #78350f;
  border: none;
  font-size: 0.8125rem;
}
```

**Step 7: Polish search match highlighting**

```css
/* Search match styling */
.match {
  background: var(--color-match-highlight);
  padding: 2px 4px;
  border-radius: 2px;
  transition: all 0.2s ease;
}

.match.current {
  background: var(--color-match-current);
  border: 1px solid #f97316;
  box-shadow: 0 0 0 3px rgba(251, 146, 60, 0.2);
  animation: pulse 1s ease-in-out;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(251, 146, 60, 0.2);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(251, 146, 60, 0.1);
  }
}
```

**Step 8: Test visual design in browser**

```bash
npm run dev
```

Open http://localhost:5173 and verify:
- Colors match design specification
- Typography is consistent and readable
- Interactive states provide clear feedback
- Code blocks are well-formatted
- Search highlighting is clear
- Accessibility features work (tab navigation, focus states)

**Step 9: Test in different browsers**

Test in Chrome, Firefox, and Safari (if available) to ensure cross-browser compatibility.

**Step 10: Commit**

```bash
git add frontend/src/styles/main.css
git commit -m "feat: implement comprehensive visual design system"
```
