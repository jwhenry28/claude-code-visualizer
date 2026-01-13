import React, { useState } from 'react'

function ToolContainer({ content, toolUseMap = {}, agentId, onSubagentClick }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const isToolUse = content.type === 'tool_use'
  const isToolResult = content.type === 'tool_result'

  const toolName = isToolUse
    ? content.name
    : (toolUseMap[content.tool_use_id]?.name || 'Unknown Tool')

  const hasSubagent = isToolUse && content.name === 'Task' && agentId
  const isClickable = hasSubagent

  const handleClick = () => {
    if (isClickable && onSubagentClick) {
      onSubagentClick(agentId)
    }
    setIsExpanded(!isExpanded)
  }

  const renderInput = () => {
    if (!isToolUse || !isExpanded) return null

    return (
      <div className="tool-input">
        <div className="tool-section-label">Input:</div>
        <pre>{JSON.stringify(content.input, null, 2)}</pre>
      </div>
    )
  }

  const renderResult = () => {
    if (!isToolResult || !isExpanded) return null

    let resultContent = content.content

    // Handle different result content formats
    if (Array.isArray(resultContent)) {
      resultContent = resultContent
        .map(item => {
          if (typeof item === 'string') return item
          if (item.type === 'text') return item.text
          return JSON.stringify(item)
        })
        .join('\n')
    }

    return (
      <div className="tool-result">
        <div className="tool-section-label">Result:</div>
        <pre>{resultContent}</pre>
      </div>
    )
  }

  return (
    <div className={`tool-container ${isToolUse ? 'tool-use' : 'tool-result'} ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div
        className={`tool-header ${isClickable ? 'clickable' : ''}`}
        onClick={handleClick}
      >
        <span className="tool-name">{toolName}</span>
        {hasSubagent && <span className="subagent-icon">🔗</span>}
        {agentId && <span className="agent-id">Agent: {agentId}</span>}
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div className="tool-content">
          {renderInput()}
          {renderResult()}
        </div>
      )}
    </div>
  )
}

export default ToolContainer
