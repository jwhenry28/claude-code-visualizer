/// <reference path="../../../preload/index.d.ts" />
import { useState } from 'react'
import { useSubagent } from '../contexts/SubagentContext'

interface TaskResultProps {
  toolUseId: string
  content: Array<{ type: string; text?: string }>
  toolUseResult?: {
    status: string
    prompt?: string
    agentId?: string
    totalDurationMs?: number
    totalTokens?: number
    totalToolUseCount?: number
  }
  sessionPath: string | null
}

export function TaskResult({ toolUseId, content, toolUseResult, sessionPath }: TaskResultProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [loading, setLoading] = useState(false)
  const { subagentAvailability, openSubagent } = useSubagent()

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    const mins = Math.floor(ms / 60000)
    const secs = Math.floor((ms % 60000) / 1000)
    return `${mins}m ${secs}s`
  }

  const formatTokens = (tokens: number) => {
    if (tokens < 1000) return tokens.toString()
    return `${(tokens / 1000).toFixed(1)}k`
  }

  const status = toolUseResult?.status || 'completed'
  const isSuccess = status === 'completed'
  const agentId = toolUseResult?.agentId
  const isAvailable = agentId ? subagentAvailability.get(agentId) : false

  const textContent = content
    .filter(c => c.type === 'text' && c.text)
    .map(c => c.text)
    .join('\n')

  const handleShowSubagent = async () => {
    if (!agentId || !sessionPath) return
    setLoading(true)
    try {
      const messages = await window.api.readSubagentSession(sessionPath, agentId)
      openSubagent(
        agentId,
        'Task',
        '',
        messages as import('../types').SessionMessage[]
      )
    } catch (error) {
      console.error('Failed to load subagent session:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`task-result ${collapsed ? 'collapsed' : ''} ${isSuccess ? 'success' : 'error'}`}>
      <div className="task-result-header" onClick={() => setCollapsed(!collapsed)}>
        <span className="expand-icon">{collapsed ? '▶' : '▼'}</span>
        <span className="task-result-label">Task Result</span>
        <span className={`task-result-status ${status}`}>{status}</span>

        {toolUseResult && (
          <div className="task-result-stats">
            {toolUseResult.totalDurationMs && (
              <span className="stat">
                <span className="stat-icon">⏱</span>
                {formatDuration(toolUseResult.totalDurationMs)}
              </span>
            )}
            {toolUseResult.totalTokens && (
              <span className="stat">
                <span className="stat-icon">📊</span>
                {formatTokens(toolUseResult.totalTokens)} tokens
              </span>
            )}
            {toolUseResult.totalToolUseCount && (
              <span className="stat">
                <span className="stat-icon">🔧</span>
                {toolUseResult.totalToolUseCount} tools
              </span>
            )}
          </div>
        )}
      </div>

      <div className="task-result-body">
        {agentId && (
          <div className="task-result-meta">
            <span className="meta-label">Agent ID:</span>
            <code className="agent-id">{agentId}</code>
            <button
              className="show-subagent-btn"
              onClick={handleShowSubagent}
              disabled={!isAvailable || loading}
              title={!isAvailable ? 'Subagent session file not found' : undefined}
            >
              {loading ? 'Loading...' : 'Show Subagent Session'}
            </button>
          </div>
        )}

        <div className="task-result-content">
          <pre><code>{textContent}</code></pre>
        </div>
      </div>
    </div>
  )
}
