# Task 19: App Layout Integration

**Files:**
- Modify: `claude-code-visualizer/frontend/src/App.jsx`
- Modify: `claude-code-visualizer/frontend/src/styles/main.css`

**Step 1: Verify current layout**

The three-column layout should already be functional from previous tasks:
- Left: ProjectList with SessionList
- Center: SessionViewer with timeline
- Right: SubagentPanel (conditional)

**Step 2: Add responsive behavior and polish**

Update `claude-code-visualizer/frontend/src/styles/main.css` to improve layout:

```css
/* Root and body setup */
html, body, #root {
  height: 100%;
  overflow: hidden;
}

/* App container - three column flex layout */
.app {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #f9fafb;
}

/* Project list - fixed width left column */
.project-list {
  width: 250px;
  height: 100vh;
  background: white;
  border-right: 1px solid #e5e7eb;
  padding: 1rem;
  overflow-y: auto;
  flex-shrink: 0;
}

/* Main content - flexible center column */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.3s ease;
}

.main-content.with-subagent {
  width: 60%;
  flex: none;
}

/* Session viewer fills main content */
.session-viewer {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Timeline scrolls independently */
.timeline {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

/* Subagent panel - conditional right column */
.subagent-panel {
  width: 40%;
  border-left: 2px solid #3b82f6;
  background: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

/* Ensure nested session viewer in subagent panel works */
.subagent-panel .session-viewer {
  flex: 1;
  overflow: hidden;
}

.subagent-panel .timeline {
  flex: 1;
  overflow-y: auto;
}
```

**Step 3: Add smooth transitions**

Enhance the transition when opening/closing subagent panel:

```css
/* Smooth panel transitions */
.subagent-panel {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Smooth main content width transition */
.main-content {
  transition: width 0.3s ease-out;
}
```

**Step 4: Add loading and empty states styling**

```css
.loading,
.error,
.placeholder,
.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 2rem;
}

.loading {
  color: #6b7280;
  font-size: 1.125rem;
}

.error {
  color: #dc2626;
  font-size: 1.125rem;
}

.placeholder {
  color: #9ca3af;
  font-size: 1rem;
}

.empty {
  color: #9ca3af;
  font-size: 0.875rem;
}
```

**Step 5: Ensure scroll behavior is correct**

Add smooth scrolling and proper overflow handling:

```css
/* Smooth scrolling for all scrollable areas */
.project-list,
.timeline,
.subagent-panel .timeline {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

/* Custom scrollbar styling (optional but nice) */
.timeline::-webkit-scrollbar,
.project-list::-webkit-scrollbar {
  width: 8px;
}

.timeline::-webkit-scrollbar-track,
.project-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.timeline::-webkit-scrollbar-thumb,
.project-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.timeline::-webkit-scrollbar-thumb:hover,
.project-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
```

**Step 6: Test layout in browser**

```bash
npm run dev
```

Open http://localhost:5173 and verify:
- Three-column layout works correctly
- Panels have proper scroll behavior
- Opening subagent panel smoothly transitions layout
- Closing subagent panel restores main content width
- All areas scroll independently

**Step 7: Test responsive behavior**

Resize browser window and verify:
- Layout remains functional at different sizes
- Scroll areas work correctly
- No overflow issues

**Step 8: Commit**

```bash
git add frontend/src/styles/main.css
git commit -m "feat: polish app layout with smooth transitions and scroll behavior"
```
