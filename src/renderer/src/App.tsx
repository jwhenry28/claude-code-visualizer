import { useState, useEffect, useCallback } from 'react'
import { MessageList } from './components/MessageList'
import { SessionMessage } from './types'

interface Project {
  name: string
  path: string
}

interface Session {
  name: string
  path: string
  mtime: number
}

function App() {
  const [projects, setProjects] = useState<Project[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [messages, setMessages] = useState<SessionMessage[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [sidebarWidth, setSidebarWidth] = useState(300)
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    window.api.listProjects().then(setProjects)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return
    const newWidth = Math.max(200, Math.min(600, e.clientX))
    setSidebarWidth(newWidth)
  }, [isResizing])

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const handleProjectSelect = async (project: Project) => {
    setSelectedProject(project)
    setSelectedSession(null)
    setMessages([])
    const sessionList = await window.api.listSessions(project.path)
    setSessions(sessionList)
  }

  const handleSessionSelect = async (session: Session) => {
    setSelectedSession(session)
    const rawMessages = await window.api.readSession(session.path)
    setMessages(rawMessages as SessionMessage[])
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatProjectName = (name: string) => {
    // Convert -home-user-project to ~/project
    return name.replace(/^-home-[^-]+-/, '~/').replace(/-/g, '/')
  }

  return (
    <div className="app">
      <div className="sidebar" style={{ width: sidebarWidth }}>
        <h2>Projects</h2>
        <div className="project-list">
          {projects.map((project) => (
            <div
              key={project.path}
              className={`project-item ${selectedProject?.path === project.path ? 'selected' : ''}`}
              onClick={() => handleProjectSelect(project)}
              title={project.name}
            >
              {formatProjectName(project.name)}
            </div>
          ))}
        </div>

        {selectedProject && (
          <>
            <h2>Sessions</h2>
            <div className="session-list">
              {sessions.map((session) => (
                <div
                  key={session.path}
                  className={`session-item ${selectedSession?.path === session.path ? 'selected' : ''}`}
                  onClick={() => handleSessionSelect(session)}
                >
                  <div>{session.name.slice(0, 8)}...</div>
                  <div className="session-date">{formatDate(session.mtime)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div
        className="resize-handle"
        onMouseDown={() => setIsResizing(true)}
      />

      <div className="main-content">
        <div className="header">
          <h1>
            {selectedSession
              ? `Session: ${selectedSession.name}`
              : 'Claude Session Viewer'}
          </h1>
        </div>

        {messages.length > 0 ? (
          <MessageList messages={messages} />
        ) : (
          <div className="empty-state">
            {selectedProject
              ? 'Select a session to view'
              : 'Select a project to get started'}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
