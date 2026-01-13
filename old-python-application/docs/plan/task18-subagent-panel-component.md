# Task 18: SubagentPanel Component

**Files:**
- Create: `claude-code-visualizer/frontend/src/components/SubagentPanel.jsx`
- Modify: `claude-code-visualizer/frontend/src/App.jsx`

**Step 1: Write SubagentPanel component**

Create `claude-code-visualizer/frontend/src/components/SubagentPanel.jsx`:

```javascript
import React from 'react'
import SessionViewer from './SessionViewer'

function SubagentPanel({ projectName, agentId, onClose }) {
  if (!agentId) return null

  return (
    <div className="subagent-panel">
      <div className="subagent-header">
        <div className="subagent-title">
          <span className="subagent-label">Subagent:</span>
          <span className="subagent-id">{agentId}</span>
        </div>
        <button className="close-button" onClick={onClose}>
          ✕
        </button>
      </div>

      <SessionViewer
        projectName={projectName}
        sessionId={`agent-${agentId}`}
      />
    </div>
  )
}

export default SubagentPanel
```

**Step 2: Update API server to handle agent-* session format**

Modify `claude-code-visualizer/src/visualizer/server.py` to accept agent files in session endpoint:

```python
    @app.route('/api/session/<project_name>/<session_id>')
    def get_session_content(project_name: str, session_id: str):
        """
        Get raw JSONL content for a specific session or agent.

        Args:
            project_name: Name of the project
            session_id: Session UUID or 'agent-{agentId}' format

        Returns:
            Raw JSONL file content as text/plain
        """
        projects_path = Path(app.config['PROJECTS_DIR'])
        project_path = projects_path / project_name

        if not project_path.exists() or not project_path.is_dir():
            abort(404, description=f"Project '{project_name}' not found")

        # Handle both regular sessions and agent files
        session_file = project_path / f'{session_id}.jsonl'

        if not session_file.exists():
            abort(404, description=f"Session '{session_id}' not found")

        # Return raw JSONL content
        try:
            content = session_file.read_text()
            return content, 200, {'Content-Type': 'text/plain; charset=utf-8'}
        except Exception as e:
            abort(500, description=f"Error reading session file: {str(e)}")
```

**Step 3: Update App.jsx to use SubagentPanel**

Modify `claude-code-visualizer/frontend/src/App.jsx`:

```javascript
import React, { useState, useEffect } from 'react'
import ProjectList from './components/ProjectList'
import SessionViewer from './components/SessionViewer'
import SubagentPanel from './components/SubagentPanel'

function App() {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [selectedSubagent, setSelectedSubagent] = useState(null)
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
    setSelectedSubagent(null)
  }

  const handleSelectSession = (sessionId) => {
    setSelectedSession(sessionId)
    setSelectedSubagent(null)
  }

  const handleSubagentClick = (agentId) => {
    // Toggle subagent panel
    if (selectedSubagent === agentId) {
      setSelectedSubagent(null)
    } else {
      setSelectedSubagent(agentId)
    }
  }

  const handleCloseSubagent = () => {
    setSelectedSubagent(null)
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

      <div className={`main-content ${selectedSubagent ? 'with-subagent' : ''}`}>
        {selectedSession ? (
          <SessionViewer
            projectName={selectedProject}
            sessionId={selectedSession}
            onSubagentClick={handleSubagentClick}
          />
        ) : selectedProject ? (
          <p className="placeholder">Select a session to view timeline</p>
        ) : (
          <p className="placeholder">Select a project to view sessions</p>
        )}
      </div>

      {selectedSubagent && (
        <SubagentPanel
          projectName={selectedProject}
          agentId={selectedSubagent}
          onClose={handleCloseSubagent}
        />
      )}
    </div>
  )
}

export default App
```

**Step 4: Add subagent panel styles**

Add to `claude-code-visualizer/frontend/src/styles/main.css`:

```css
.main-content.with-subagent {
  width: 60%;
  flex: none;
}

.subagent-panel {
  width: 40%;
  border-left: 2px solid #3b82f6;
  background: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.subagent-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #eff6ff;
}

.subagent-title {
  display: flex;
  gap: 8px;
  align-items: center;
}

.subagent-label {
  font-weight: 600;
  color: #1e40af;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.subagent-id {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: #374151;
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #bfdbfe;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
}

.close-button:hover {
  color: #1f2937;
  background: rgba(0,0,0,0.05);
  border-radius: 4px;
}

.placeholder {
  color: #9ca3af;
  text-align: center;
  margin-top: 4rem;
}
```

**Step 5: Test backend changes**

```bash
cd claude-code-visualizer
pytest tests/backend/ -v
```

Expected: PASS - All backend tests should pass

**Step 6: Commit backend changes**

```bash
git add src/visualizer/server.py
git commit -m "feat: update session endpoint to handle agent files"
```

**Step 7: Test in browser**

```bash
cd frontend
npm run dev
```

Open http://localhost:5173 and verify:
- Clicking a Task tool with subagent opens subagent panel
- Subagent panel appears on right side
- Close button works
- Clicking same Task tool again toggles panel off

**Step 8: Commit frontend changes**

```bash
git add frontend/src/components/SubagentPanel.jsx frontend/src/App.jsx frontend/src/styles/main.css
git commit -m "feat: implement SubagentPanel component with toggle"
```
