export interface ToolUseContent {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, unknown>
}

export interface TextContent {
  type: 'text'
  text: string
}

export interface ThinkingContent {
  type: 'thinking'
  thinking: string
}

export interface ToolResultContent {
  type: 'tool_result'
  tool_use_id: string
  content: string | { type: string; text?: string }[]
}

export type MessageContent = ToolUseContent | TextContent | ThinkingContent | ToolResultContent | string

export interface Message {
  role: 'user' | 'assistant'
  content: MessageContent | MessageContent[]
}

export interface ToolUseResultMeta {
  status: string
  prompt?: string
  agentId?: string
  totalDurationMs?: number
  totalTokens?: number
  totalToolUseCount?: number
  content?: { type: string; text?: string }[]
}

export interface SessionMessage {
  type: 'user' | 'assistant' | 'system' | 'summary' | 'file-history-snapshot'
  uuid: string
  parentUuid: string | null
  timestamp: string
  message?: Message
  content?: string  // For system messages
  summary?: string  // For summary messages
  subtype?: string  // For system messages (e.g., 'local_command')
  isMeta?: boolean
  sessionId?: string
  cwd?: string
  version?: string
  gitBranch?: string
  toolUseResult?: ToolUseResultMeta  // For task results
}
