# Task 16: SessionViewer Component

**Files:**
- Create: `claude-code-visualizer/frontend/src/components/SessionViewer.jsx`
- Create: `claude-code-visualizer/frontend/src/components/SessionViewer.test.jsx`

**Step 1: Write the failing test**

Create `claude-code-visualizer/frontend/src/components/SessionViewer.test.jsx`:

```javascript
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import SessionViewer from './SessionViewer'

global.fetch = jest.fn()

describe('SessionViewer', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  test('fetches and renders session content', async () => {
    const jsonl = `{"uuid":"msg-1","message":{"role":"user","content":"Test message"}}\n`

    fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(jsonl)
    })

    render(<SessionViewer projectName="test-project" sessionId="session-123" />)

    await waitFor(() => {
      expect(screen.getByText('User Message')).toBeInTheDocument()
      expect(screen.getByText('Test message')).toBeInTheDocument()
    })
  })

  test('shows loading state', () => {
    fetch.mockImplementationOnce(() => new Promise(() => {})) // Never resolves

    render(<SessionViewer projectName="test-project" sessionId="session-123" />)

    expect(screen.getByText(/Loading/i)).toBeInTheDocument()
  })

  test('shows error state on fetch failure', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'))

    render(<SessionViewer projectName="test-project" sessionId="session-123" />)

    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument()
    })
  })

  test('renders tools within assistant messages', async () => {
    const jsonl = `{"uuid":"msg-1","message":{"role":"assistant","content":[{"type":"text","text":"Let me help"},{"type":"tool_use","id":"tool-1","name":"Read","input":{}}]}}\n`

    fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(jsonl)
    })

    render(<SessionViewer projectName="test-project" sessionId="session-123" />)

    await waitFor(() => {
      expect(screen.getByText('Let me help')).toBeInTheDocument()
      expect(screen.getByText('Read')).toBeInTheDocument()
    })
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npm test SessionViewer.test.jsx
```

Expected: FAIL - Component doesn't exist yet

**Step 3: Write minimal SessionViewer component**

Create `claude-code-visualizer/frontend/src/components/SessionViewer.jsx`:

```javascript
import React, { useState, useEffect } from 'react'
import MessageContainer from './MessageContainer'
import ToolContainer from './ToolContainer'
import { parseJSONL, buildToolUseMap } from '../utils/jsonlParser'

function SessionViewer({ projectName, sessionId, onSubagentClick }) {
  const [messages, setMessages] = useState([])
  const [toolUseMap, setToolUseMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!projectName || !sessionId) return

    setLoading(true)
    setError(null)

    fetch(`/api/session/${projectName}/${sessionId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch session')
        return res.text()
      })
      .then(jsonlText => {
        const parsed = parseJSONL(jsonlText)
        setMessages(parsed)
        setToolUseMap(buildToolUseMap(parsed))
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [projectName, sessionId])

  const extractAgentId = (toolUseId) => {
    // Find the tool result for this tool use and extract agentId
    for (const message of messages) {
      const content = message.message?.content
      if (!Array.isArray(content)) continue

      for (const block of content) {
        if (block.type === 'tool_result' && block.tool_use_id === toolUseId) {
          // Look for agentId in toolUseResult
          if (message.toolUseResult?.agentId) {
            return message.toolUseResult.agentId
          }
        }
      }
    }
    return null
  }

  const renderTools = (content) => {
    if (!Array.isArray(content)) return null

    return content
      .filter(block => block.type === 'tool_use' || block.type === 'tool_result')
      .map((block, index) => {
        const agentId = block.type === 'tool_use' ? extractAgentId(block.id) : null

        return (
          <ToolContainer
            key={block.id || `tool-${index}`}
            content={block}
            toolUseMap={toolUseMap}
            agentId={agentId}
            onSubagentClick={onSubagentClick}
          />
        )
      })
  }

  if (loading) {
    return <div className="session-viewer loading">Loading session...</div>
  }

  if (error) {
    return <div className="session-viewer error">Error: {error}</div>
  }

  if (messages.length === 0) {
    return <div className="session-viewer empty">No messages in this session</div>
  }

  return (
    <div className="session-viewer">
      <div className="timeline">
        {messages.map(message => {
          const content = message.message?.content

          return (
            <MessageContainer key={message.uuid} message={message}>
              {renderTools(content)}
            </MessageContainer>
          )
        })}
      </div>
    </div>
  )
}

export default SessionViewer
```

**Step 4: Add styles**

Add to `claude-code-visualizer/frontend/src/styles/main.css`:

```css
.session-viewer {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.session-viewer.loading,
.session-viewer.error,
.session-viewer.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
}

.session-viewer.error {
  color: #dc2626;
}

.timeline {
  max-width: 1200px;
  margin: 0 auto;
}
```

**Step 5: Run tests to verify they pass**

```bash
npm test SessionViewer.test.jsx
```

Expected: PASS - All tests should pass

**Step 6: Update App.jsx to use SessionViewer**

Modify `claude-code-visualizer/frontend/src/App.jsx`:

```javascript
import React, { useState, useEffect } from 'react'
import ProjectList from './components/ProjectList'
import SessionViewer from './components/SessionViewer'

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
          <SessionViewer
            projectName={selectedProject}
            sessionId={selectedSession}
          />
        ) : selectedProject ? (
          <p className="placeholder">Select a session to view timeline</p>
        ) : (
          <p className="placeholder">Select a project to view sessions</p>
        )}
      </div>
    </div>
  )
}

export default App
```

**Step 7: Test in browser**

```bash
npm run dev
```

Open http://localhost:5173 and verify:
- Selecting a session loads and renders messages
- User and assistant messages are displayed
- Tools are shown within messages

**Step 8: Commit**

```bash
git add frontend/src/components/SessionViewer.jsx frontend/src/components/SessionViewer.test.jsx frontend/src/App.jsx frontend/src/styles/main.css
git commit -m "feat: implement SessionViewer component with timeline rendering"
```
