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
