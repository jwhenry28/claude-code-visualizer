# Task 11: ProjectList Component

**Files:**
- Create: `claude-code-visualizer/frontend/src/components/ProjectList.jsx`
- Create: `claude-code-visualizer/frontend/src/components/ProjectList.test.jsx`

**Step 1: Write the failing test**

Create `claude-code-visualizer/frontend/src/components/ProjectList.test.jsx`:

```javascript
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ProjectList from './ProjectList'

describe('ProjectList', () => {
  const mockProjects = [
    { name: 'project1', path: '/path/to/project1' },
    { name: 'project2', path: '/path/to/project2' },
  ]

  test('renders project names', () => {
    render(<ProjectList projects={mockProjects} selectedProject={null} onSelectProject={() => {}} />)

    expect(screen.getByText('project1')).toBeInTheDocument()
    expect(screen.getByText('project2')).toBeInTheDocument()
  })

  test('calls onSelectProject when project is clicked', () => {
    const handleSelect = jest.fn()
    render(<ProjectList projects={mockProjects} selectedProject={null} onSelectProject={handleSelect} />)

    fireEvent.click(screen.getByText('project1'))
    expect(handleSelect).toHaveBeenCalledWith('project1')
  })

  test('highlights selected project', () => {
    render(<ProjectList projects={mockProjects} selectedProject="project1" onSelectProject={() => {}} />)

    const project1 = screen.getByText('project1').closest('li')
    expect(project1).toHaveClass('selected')
  })

  test('renders empty state when no projects', () => {
    render(<ProjectList projects={[]} selectedProject={null} onSelectProject={() => {}} />)

    expect(screen.getByText(/No Claude Code projects found/i)).toBeInTheDocument()
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
cd frontend
npm test ProjectList.test.jsx
```

Expected: FAIL - Component doesn't exist yet

**Step 3: Write minimal ProjectList component**

Create `claude-code-visualizer/frontend/src/components/ProjectList.jsx`:

```javascript
import React from 'react'

function ProjectList({ projects, selectedProject, onSelectProject }) {
  if (projects.length === 0) {
    return (
      <div className="project-list empty">
        <p>No Claude Code projects found</p>
        <p className="hint">Run Claude Code first to create projects</p>
      </div>
    )
  }

  return (
    <div className="project-list">
      <h2>Projects</h2>
      <ul>
        {projects.map(project => (
          <li
            key={project.name}
            className={selectedProject === project.name ? 'selected' : ''}
            onClick={() => onSelectProject(project.name)}
          >
            {project.name}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ProjectList
```

**Step 4: Add styles**

Add to `claude-code-visualizer/frontend/src/styles/main.css`:

```css
.project-list {
  width: 250px;
  height: 100vh;
  background: white;
  border-right: 1px solid #e5e7eb;
  padding: 1rem;
  overflow-y: auto;
}

.project-list h2 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #374151;
}

.project-list ul {
  list-style: none;
}

.project-list li {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  background: #f9fafb;
  transition: background 0.2s;
}

.project-list li:hover {
  background: #f3f4f6;
}

.project-list li.selected {
  background: #dbeafe;
  color: #1e40af;
  font-weight: 500;
}

.project-list.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.project-list.empty .hint {
  font-size: 0.875rem;
  margin-top: 0.5rem;
}
```

**Step 5: Run tests to verify they pass**

```bash
npm test ProjectList.test.jsx
```

Expected: PASS - All tests should pass

**Step 6: Update App.jsx to use ProjectList**

Modify `claude-code-visualizer/frontend/src/App.jsx`:

```javascript
import React, { useState, useEffect } from 'react'
import ProjectList from './components/ProjectList'

function App() {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/projects')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch projects')
        return res.json()
      })
      .then(data => {
        setProjects(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const handleSelectProject = (projectName) => {
    setSelectedProject(projectName)
  }

  if (loading) return <div className="loading">Loading...</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <div className="app">
      <ProjectList
        projects={projects}
        selectedProject={selectedProject}
        onSelectProject={handleSelectProject}
      />
      <div className="main-content">
        {selectedProject ? (
          <p>Selected: {selectedProject}</p>
        ) : (
          <p>Select a project to view sessions</p>
        )}
      </div>
    </div>
  )
}

export default App
```

**Step 7: Update App layout styles**

Update `claude-code-visualizer/frontend/src/styles/main.css`:

```css
.app {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.loading, .error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  font-size: 1.25rem;
}

.error {
  color: #dc2626;
}
```

**Step 8: Test in browser**

```bash
npm run dev
```

Open http://localhost:5173 and verify:
- Projects list appears on the left
- Clicking a project highlights it
- Selected project name appears in main area

**Step 9: Commit**

```bash
git add frontend/src/components/ProjectList.jsx frontend/src/components/ProjectList.test.jsx frontend/src/App.jsx frontend/src/styles/main.css
git commit -m "feat: implement ProjectList component with selection"
```
