import { SessionMessage } from '../types'
import { Message } from './Message'

interface MessageListProps {
  messages: SessionMessage[]
}

export function MessageList({ messages }: MessageListProps) {
  // Filter to only show meaningful messages
  const displayMessages = messages.filter((msg) => {
    // Skip file history snapshots
    if (msg.type === 'file-history-snapshot') return false
    // Skip summary messages (they're metadata)
    if (msg.type === 'summary') return false
    // Skip meta messages
    if (msg.isMeta) return false
    // Include user/assistant messages that have content
    if ((msg.type === 'user' || msg.type === 'assistant') && msg.message) return true
    // Include system messages that have content
    if (msg.type === 'system' && msg.content) return true
    return false
  })

  return (
    <div className="messages-container">
      {displayMessages.map((msg) => (
        <Message key={msg.uuid} message={msg} />
      ))}
    </div>
  )
}
