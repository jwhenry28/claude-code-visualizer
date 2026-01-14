import { SessionMessage } from '../types'
import { MessageList } from './MessageList'

interface SubagentPanelProps {
  subagentType: string
  description: string
  messages: SessionMessage[]
  onClose: () => void
}

export function SubagentPanel({ subagentType, description, messages, onClose }: SubagentPanelProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div
      className="subagent-overlay"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="subagent-backdrop" onClick={onClose} />
      <div className="subagent-panel">
        <div className="subagent-panel-header">
          <span className="subagent-type-badge">{subagentType}</span>
          <span className="subagent-description" title={description}>
            {description}
          </span>
          <button className="subagent-close-btn" onClick={onClose} aria-label="Close panel">
            &times;
          </button>
        </div>
        <div className="subagent-panel-body">
          <MessageList messages={messages} />
        </div>
      </div>
    </div>
  )
}
