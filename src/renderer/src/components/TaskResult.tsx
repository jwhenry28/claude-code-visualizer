import { useState } from 'react'

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
}

export function TaskResult({ toolUseId, content, toolUseResult }: TaskResultProps) {
  const [collapsed, setCollapsed] = useState(false)

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

  // Extract the main text content
  const textContent = content
    .filter(c => c.type === 'text' && c.text)
    .map(c => c.text)
    .join('\n')

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
        {toolUseResult?.agentId && (
          <div className="task-result-meta">
            <span className="meta-label">Agent ID:</span>
            <code className="agent-id">{toolUseResult.agentId}</code>
          </div>
        )}

        <div className="task-result-content">
          <pre><code>{textContent}</code></pre>
        </div>
      </div>
    </div>
  )
}
