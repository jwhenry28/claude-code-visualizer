import { useState } from 'react'

interface ThinkingBlockProps {
  content: string
}

export function ThinkingBlock({ content }: ThinkingBlockProps) {
  const [collapsed, setCollapsed] = useState(true)

  return (
    <div className={`thinking-block ${collapsed ? 'collapsed' : ''}`}>
      <div className="thinking-header" onClick={() => setCollapsed(!collapsed)}>
        <span className="expand-icon">{collapsed ? '▶' : '▼'}</span>
        <span className="thinking-label">Thinking</span>
        {collapsed && (
          <span className="thinking-preview">
            {content.slice(0, 60)}...
          </span>
        )}
      </div>
      <div className="thinking-body">
        <div className="text-content">{content}</div>
      </div>
    </div>
  )
}
