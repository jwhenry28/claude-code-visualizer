/// <reference path="../../../preload/index.d.ts" />
import { useState } from 'react'
import { ToolUseContent } from '../types'
import { useSubagent } from '../contexts/SubagentContext'

interface TaskCallProps {
  tool: ToolUseContent
  toolUseId: string
  sessionPath: string | null
}

export function TaskCall({ tool, toolUseId, sessionPath }: TaskCallProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [loading, setLoading] = useState(false)
  const { agentIdMap, subagentAvailability, openSubagent } = useSubagent()

  const input = tool.input as {
    description?: string
    prompt?: string
    subagent_type?: string
    model?: string
    run_in_background?: boolean
  }

  const agentId = agentIdMap.get(toolUseId)
  const isAvailable = agentId ? subagentAvailability.get(agentId) : false

  const handleShowSubagent = async () => {
    if (!agentId || !sessionPath) return
    setLoading(true)
    try {
      const messages = await window.api.readSubagentSession(sessionPath, agentId)
      openSubagent(
        agentId,
        input.subagent_type || 'Task',
        input.description || '',
        messages as import('../types').SessionMessage[]
      )
    } catch (error) {
      console.error('Failed to load subagent session:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`task-call ${collapsed ? 'collapsed' : ''}`}>
      <div className="task-call-header" onClick={() => setCollapsed(!collapsed)}>
        <span className="expand-icon">{collapsed ? '▶' : '▼'}</span>
        <span className="task-label">Task</span>
        {input.subagent_type && (
          <span className="task-subagent">{input.subagent_type}</span>
        )}
        {input.description && (
          <span className="task-description">{input.description}</span>
        )}
      </div>
      <div className="task-call-body">
        {input.subagent_type && (
          <div className="task-field">
            <h4>Subagent Type</h4>
            <div className="task-value">{input.subagent_type}</div>
          </div>
        )}
        {input.description && (
          <div className="task-field">
            <h4>Description</h4>
            <div className="task-value">{input.description}</div>
          </div>
        )}
        {input.prompt && (
          <div className="task-field">
            <h4>Prompt</h4>
            <pre className="task-prompt"><code>{input.prompt}</code></pre>
          </div>
        )}
        {input.model && (
          <div className="task-field">
            <h4>Model</h4>
            <div className="task-value">{input.model}</div>
          </div>
        )}
        {input.run_in_background && (
          <div className="task-field">
            <h4>Background</h4>
            <div className="task-value">Yes</div>
          </div>
        )}
        {agentId && (
          <button
            className="show-subagent-btn"
            onClick={handleShowSubagent}
            disabled={!isAvailable || loading}
            title={!isAvailable ? 'Subagent session file not found' : undefined}
          >
            {loading ? 'Loading...' : 'Show Subagent Session'}
          </button>
        )}
      </div>
    </div>
  )
}
