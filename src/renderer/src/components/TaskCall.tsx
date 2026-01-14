import { useState } from 'react'
import { ToolUseContent } from '../types'

interface TaskCallProps {
  tool: ToolUseContent
}

export function TaskCall({ tool }: TaskCallProps) {
  const [collapsed, setCollapsed] = useState(false) // Start expanded for tasks

  const input = tool.input as {
    description?: string
    prompt?: string
    subagent_type?: string
    model?: string
    run_in_background?: boolean
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
      </div>
    </div>
  )
}
