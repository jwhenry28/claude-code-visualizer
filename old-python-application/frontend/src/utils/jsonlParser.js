/**
 * Parse JSONL string into array of message objects.
 * Skips empty lines and malformed JSON.
 *
 * @param {string} jsonlText - Raw JSONL content
 * @returns {Array} Array of parsed message objects
 */
export function parseJSONL(jsonlText) {
  if (!jsonlText || jsonlText.trim() === '') {
    return []
  }

  const lines = jsonlText.split('\n')
  const messages = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    try {
      const parsed = JSON.parse(trimmed)
      messages.push(parsed)
    } catch (error) {
      // Skip malformed lines
      console.warn('Skipping malformed JSONL line:', trimmed.substring(0, 50))
    }
  }

  return messages
}

/**
 * Build a map from tool_use_id to tool use content blocks.
 * Used to link tool results back to their corresponding tool uses.
 *
 * @param {Array} messages - Array of parsed messages
 * @returns {Object} Map of tool_use_id -> tool use content block
 */
export function buildToolUseMap(messages) {
  const toolMap = {}

  for (const message of messages) {
    const content = message.message?.content

    if (!content) continue

    // Handle array content format
    if (Array.isArray(content)) {
      for (const block of content) {
        if (block.type === 'tool_use' && block.id) {
          toolMap[block.id] = block
        }
      }
    }
  }

  return toolMap
}

/**
 * Extract all text content from a message.
 * Handles both string and array content formats.
 *
 * @param {Object} message - Message object
 * @returns {string} Consolidated text content
 */
export function extractTextContent(message) {
  const content = message.message?.content

  if (!content) return ''

  // String content
  if (typeof content === 'string') {
    return content
  }

  // Array content - concatenate all text blocks
  if (Array.isArray(content)) {
    const textBlocks = content
      .filter(block => block.type === 'text')
      .map(block => block.text || '')

    return textBlocks.join('\n\n')
  }

  return ''
}

/**
 * Extract thinking content from assistant message.
 *
 * @param {Object} message - Message object
 * @returns {string} Thinking content or empty string
 */
export function extractThinkingContent(message) {
  const content = message.message?.content

  if (!content || !Array.isArray(content)) return ''

  const thinkingBlocks = content
    .filter(block => block.type === 'thinking')
    .map(block => block.thinking || '')

  return thinkingBlocks.join('\n\n')
}
