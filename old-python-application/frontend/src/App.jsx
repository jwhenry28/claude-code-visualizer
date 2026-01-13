import React, { useState, useEffect } from 'react'
import ProjectList from './components/ProjectList'
import SessionList from './components/SessionList'
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
      />

      {selectedProject && (
        <SessionList
          sessions={sessions}
          selectedSession={selectedSession}
          onSelectSession={handleSelectSession}
        />
      )}

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
