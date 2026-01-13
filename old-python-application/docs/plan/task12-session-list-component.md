# Task 12: SessionList Component

**Files:**
- Create: `claude-code-visualizer/frontend/src/components/SessionList.jsx`
- Create: `claude-code-visualizer/frontend/src/components/SessionList.test.jsx`

**Step 1: Write the failing test**

Create `claude-code-visualizer/frontend/src/components/SessionList.test.jsx`:

```javascript
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import SessionList from './SessionList'

describe('SessionList', () => {
  const mockSessions = [
    {
      sessionId: 'session-1',
      preview: 'First session message',
      timestamp: 1701964800000,
      messageCount: 10
    },
    {
      sessionId: 'session-2',
      preview: 'Second session message',
      timestamp: 1701961200000,
      messageCount: 5
    },
  ]

  test('renders session previews', () => {
    render(<SessionList sessions={mockSessions} selectedSession={null} onSelectSession={() => {}} />)

    expect(screen.getByText(/First session message/)).toBeInTheDocument()
    expect(screen.getByText(/Second session message/)).toBeInTheDocument()
  })

  test('calls onSelectSession when session is clicked', () => {
    const handleSelect = jest.fn()
    render(<SessionList sessions={mockSessions} selectedSession={null} onSelectSession={handleSelect} />)

    fireEvent.click(screen.getByText(/First session message/))
    expect(handleSelect).toHaveBeenCalledWith('session-1')
  })

  test('highlights selected session', () => {
    render(<SessionList sessions={mockSessions} selectedSession="session-1" onSelectSession={() => {}} />)

    const session1 = screen.getByText(/First session message/).closest('li')
    expect(session1).toHaveClass('selected')
  })

  test('renders empty state when no sessions', () => {
    render(<SessionList sessions={[]} selectedSession={null} onSelectSession={() => {}} />)

    expect(screen.getByText(/No sessions found/i)).toBeInTheDocument()
  })

  test('formats timestamp', () => {
    render(<SessionList sessions={mockSessions} selectedSession={null} onSelectSession={() => {}} />)

    // Should show formatted date (e.g., "Dec 7, 10:00 AM")
    expect(screen.getByText(/Dec \d+/)).toBeInTheDocument()
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npm test SessionList.test.jsx
```

Expected: FAIL - Component doesn't exist yet

**Step 3: Write minimal SessionList component**

Create `claude-code-visualizer/frontend/src/components/SessionList.jsx`:

```javascript
import React from 'react'

function formatTimestamp(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function SessionList({ sessions, selectedSession, onSelectSession }) {
  if (sessions.length === 0) {
    return (
      <div className="session-list empty">
        <p>No sessions found in this project</p>
      </div>
    )
  }

  return (
    <div className="session-list">
      <h3>Sessions</h3>
      <ul>
        {sessions.map(session => (
          <li
            key={session.sessionId}
            className={selectedSession === session.sessionId ? 'selected' : ''}
            onClick={() => onSelectSession(session.sessionId)}
          >
            <div className="session-timestamp">
              {formatTimestamp(session.timestamp)}
            </div>
            <div className="session-preview">
              {session.preview}
            </div>
            <div className="session-meta">
              {session.messageCount} messages
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SessionList
```

**Step 4: Add styles**

Add to `claude-code-visualizer/frontend/src/styles/main.css`:

```css
.session-list {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.session-list h3 {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.session-list ul {
  list-style: none;
}

.session-list li {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  background: #f9fafb;
  transition: background 0.2s;
  border-left: 3px solid transparent;
}

.session-list li:hover {
  background: #f3f4f6;
}

.session-list li.selected {
  background: #dbeafe;
  border-left-color: #3b82f6;
}

.session-timestamp {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.session-preview {
  font-size: 0.875rem;
  color: #1f2937;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-meta {
  font-size: 0.75rem;
  color: #9ca3af;
}

.session-list.empty {
  padding: 1rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}
```

**Step 5: Run tests to verify they pass**

```bash
npm test SessionList.test.jsx
```

Expected: PASS - All tests should pass

**Step 6: Update ProjectList to show SessionList**

Modify `claude-code-visualizer/frontend/src/components/ProjectList.jsx`:

```javascript
import React from 'react'
import SessionList from './SessionList'

function ProjectList({ projects, selectedProject, onSelectProject, sessions, selectedSession, onSelectSession }) {
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

      {selectedProject && (
        <SessionList
          sessions={sessions}
          selectedSession={selectedSession}
          onSelectSession={onSelectSession}
        />
      )}
    </div>
  )
}

export default ProjectList
```

**Step 7: Update App.jsx to fetch and display sessions**

Modify `claude-code-visualizer/frontend/src/App.jsx`:

```javascript
import React, { useState, useEffect } from 'react'
import ProjectList from './components/ProjectList'

function App() {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
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

  useEffect(() => {
    if (selectedProject) {
      fetch(`/api/sessions/${selectedProject}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch sessions')
          return res.json()
        })
        .then(data => {
          setSessions(data)
        })
        .catch(err => {
          console.error('Error fetching sessions:', err)
          setSessions([])
        })
    } else {
      setSessions([])
    }
  }, [selectedProject])

  const handleSelectProject = (projectName) => {
    setSelectedProject(projectName)
    setSelectedSession(null)
  }

  const handleSelectSession = (sessionId) => {
    setSelectedSession(sessionId)
  }

  if (loading) return <div className="loading">Loading...</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <div className="app">
      <ProjectList
        projects={projects}
        selectedProject={selectedProject}
        onSelectProject={handleSelectProject}
        sessions={sessions}
        selectedSession={selectedSession}
        onSelectSession={handleSelectSession}
      />
      <div className="main-content">
        {selectedSession ? (
          <p>Selected session: {selectedSession}</p>
        ) : selectedProject ? (
          <p>Select a session to view timeline</p>
        ) : (
          <p>Select a project to view sessions</p>
        )}
      </div>
    </div>
  )
}

export default App
```

**Step 8: Test in browser**

```bash
npm run dev
```

Open http://localhost:5173 and verify:
- Selecting a project loads its sessions
- Sessions show timestamp, preview, and message count
- Clicking a session highlights it

**Step 9: Commit**

```bash
git add frontend/src/components/SessionList.jsx frontend/src/components/SessionList.test.jsx frontend/src/components/ProjectList.jsx frontend/src/App.jsx frontend/src/styles/main.css
git commit -m "feat: implement SessionList component with timestamp and preview"
```
