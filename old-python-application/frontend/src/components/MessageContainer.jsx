import React, { useState } from 'react'
import { extractTextContent, extractThinkingContent } from '../utils/jsonlParser'

function formatTimestamp(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function MessageContainer({ message, children }) {
  console.log(message)
  const [isExpanded, setIsExpanded] = useState(true)

  const role = message.message?.role || 'unknown'
  const model = message.message?.model
  const timestamp = formatTimestamp(message.timestamp)

  const textContent = extractTextContent(message)
  const thinkingContent = extractThinkingContent(message)

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  const label = role === 'user' ? 'User Message' : 'Assistant Message'

  return (
    <div className={`message-container ${role} ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="message-header" onClick={handleToggle}>
        <span className="message-label">{label}</span>
        {model && <span className="message-model">{model}</span>}
        {timestamp && <span className="message-timestamp">{timestamp}</span>}
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div className="message-content">
          {thinkingContent && (
            <div className="thinking-content">
              <div className="thinking-label">Thinking</div>
              <pre>{thinkingContent}</pre>
            </div>
          )}

          {textContent && (
            <div className="text-content">
              {textContent}
            </div>
          )}

          {children}
        </div>
      )}
    </div>
  )
}

export default MessageContainer
