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
