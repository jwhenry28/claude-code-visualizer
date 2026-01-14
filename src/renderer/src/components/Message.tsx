import { SessionMessage, MessageContent, ToolUseContent, TextContent, ThinkingContent, ToolResultContent } from '../types'
import { ThinkingBlock } from './ThinkingBlock'
import { ToolCall } from './ToolCall'
import { TaskCall } from './TaskCall'
import { TaskResult } from './TaskResult'

interface MessageProps {
  message: SessionMessage
}

export function Message({ message }: MessageProps) {
  // Handle system messages differently
  if (message.type === 'system') {
    return (
      <div className="message system">
        <div className="message-header">
          <span className="message-role system">system</span>
          <span className="message-timestamp">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          {message.subtype && (
            <span className="message-subtype">{message.subtype}</span>
          )}
        </div>
        <div className="message-content">
          <div className="text-content">{message.content}</div>
        </div>
      </div>
    )
  }

  const role = message.message?.role || message.type
  const content = message.message?.content
  const timestamp = new Date(message.timestamp).toLocaleTimeString()
  const toolUseResult = message.toolUseResult

  const renderContent = (content: MessageContent | MessageContent[] | undefined) => {
    if (!content) return null

    // Handle string content
    if (typeof content === 'string') {
      return <div className="text-content">{content}</div>
    }

    // Handle array of content blocks
    if (Array.isArray(content)) {
      return content.map((block, index) => {
        if (typeof block === 'string') {
          return <div key={index} className="text-content">{block}</div>
        }

        if (block.type === 'text') {
          return <div key={index} className="text-content">{(block as TextContent).text}</div>
        }

        if (block.type === 'thinking') {
          return <ThinkingBlock key={index} content={(block as ThinkingContent).thinking} />
        }

        if (block.type === 'tool_use') {
          const toolBlock = block as ToolUseContent
          if (toolBlock.name === 'Task') {
            return <TaskCall key={index} tool={toolBlock} />
          }
          return <ToolCall key={index} tool={toolBlock} />
        }

        if (block.type === 'tool_result') {
          const resultBlock = block as ToolResultContent
          // If this message has toolUseResult metadata, it's a Task result
          if (toolUseResult) {
            const resultContent = Array.isArray(resultBlock.content)
              ? resultBlock.content
              : [{ type: 'text', text: String(resultBlock.content) }]
            return (
              <TaskResult
                key={index}
                toolUseId={resultBlock.tool_use_id}
                content={resultContent}
                toolUseResult={toolUseResult}
              />
            )
          }
          // Regular tool result - skip for now (could add ToolResult component later)
          return null
        }

        return null
      })
    }

    // Handle single content block
    if (typeof content === 'object') {
      if (content.type === 'text') {
        return <div className="text-content">{(content as TextContent).text}</div>
      }
      if (content.type === 'thinking') {
        return <ThinkingBlock content={(content as ThinkingContent).thinking} />
      }
      if (content.type === 'tool_use') {
        const toolContent = content as ToolUseContent
        if (toolContent.name === 'Task') {
          return <TaskCall tool={toolContent} />
        }
        return <ToolCall tool={toolContent} />
      }
      if (content.type === 'tool_result' && toolUseResult) {
        const resultContent = content as ToolResultContent
        const contentArray = Array.isArray(resultContent.content)
          ? resultContent.content
          : [{ type: 'text', text: String(resultContent.content) }]
        return (
          <TaskResult
            toolUseId={resultContent.tool_use_id}
            content={contentArray}
            toolUseResult={toolUseResult}
          />
        )
      }
    }

    return null
  }

  return (
    <div className={`message ${role}`}>
      <div className="message-header">
        <span className={`message-role ${role}`}>{role}</span>
        <span className="message-timestamp">{timestamp}</span>
      </div>
      <div className="message-content">
        {renderContent(content)}
      </div>
    </div>
  )
}
