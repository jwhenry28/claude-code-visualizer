import { SessionMessage } from '../types'
import { Message } from './Message'

interface MessageListProps {
  messages: SessionMessage[]
  sessionPath?: string | null
}

export function MessageList({ messages, sessionPath = null }: MessageListProps) {
  const displayMessages = messages.filter((msg) => {
    if (msg.type === 'file-history-snapshot') return false
    if (msg.type === 'summary') return false
    if (msg.isMeta) return false
    if ((msg.type === 'user' || msg.type === 'assistant') && msg.message) return true
    if (msg.type === 'system' && msg.content) return true
    return false
  })

  return (
    <div className="messages-container">
      {displayMessages.map((msg) => (
        <Message key={msg.uuid} message={msg} sessionPath={sessionPath} />
      ))}
    </div>
  )
}
