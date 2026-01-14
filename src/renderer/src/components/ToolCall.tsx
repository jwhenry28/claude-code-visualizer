import { useState } from 'react'
import { ToolUseContent } from '../types'

interface ToolCallProps {
  tool: ToolUseContent
}

export function ToolCall({ tool }: ToolCallProps) {
  const [collapsed, setCollapsed] = useState(true)

  const formatInput = (input: Record<string, unknown>) => {
    // For common tools, show a summary
    if (tool.name === 'Bash' && input.command) {
      return String(input.command)
    }
    if (tool.name === 'Read' && input.file_path) {
      return `Reading: ${input.file_path}`
    }
    if (tool.name === 'Write' && input.file_path) {
      return `Writing: ${input.file_path}`
    }
    if (tool.name === 'Edit' && input.file_path) {
      return `Editing: ${input.file_path}`
    }
    if (tool.name === 'Glob' && input.pattern) {
      return `Pattern: ${input.pattern}`
    }
    if (tool.name === 'Grep' && input.pattern) {
      return `Searching: ${input.pattern}`
    }
    if (tool.name === 'Task' && input.prompt) {
      return `Task: ${String(input.prompt).slice(0, 100)}...`
    }

    return JSON.stringify(input, null, 2)
  }

  const getPreview = () => {
    if (tool.name === 'Bash' && tool.input.command) {
      const cmd = String(tool.input.command)
      return cmd.slice(0, 50) + (cmd.length > 50 ? '...' : '')
    }
    if (tool.name === 'Read' && tool.input.file_path) {
      return String(tool.input.file_path)
    }
    if (tool.name === 'Task' && tool.input.description) {
      return String(tool.input.description)
    }
    return ''
  }

  return (
    <div className={`tool-call ${collapsed ? 'collapsed' : ''}`}>
      <div className="tool-call-header" onClick={() => setCollapsed(!collapsed)}>
        <span className="expand-icon">{collapsed ? '▶' : '▼'}</span>
        <span className="tool-name">{tool.name}</span>
        {collapsed && (
          <span style={{ color: '#888', fontSize: '13px', marginLeft: '8px' }}>
            {getPreview()}
          </span>
        )}
      </div>
      <div className="tool-call-body">
        <div className="tool-input">
          <h4>Input</h4>
          <pre><code>{formatInput(tool.input)}</code></pre>
        </div>
      </div>
    </div>
  )
}
