# Task 13: JSONL Parser Utility

**Files:**
- Create: `claude-code-visualizer/frontend/src/utils/jsonlParser.js`
- Create: `claude-code-visualizer/frontend/src/utils/jsonlParser.test.js`

**Step 1: Write the failing test**

Create `claude-code-visualizer/frontend/src/utils/jsonlParser.test.js`:

```javascript
import { parseJSONL, buildToolUseMap } from './jsonlParser'

describe('parseJSONL', () => {
  test('parses valid JSONL string', () => {
    const jsonl = `{"uuid":"msg-1","message":{"role":"user","content":"Hello"}}\n{"uuid":"msg-2","message":{"role":"assistant","content":"Hi"}}`

    const messages = parseJSONL(jsonl)

    expect(messages).toHaveLength(2)
    expect(messages[0].uuid).toBe('msg-1')
    expect(messages[1].uuid).toBe('msg-2')
  })

  test('skips empty lines', () => {
    const jsonl = `{"uuid":"msg-1","message":{"role":"user","content":"Hello"}}\n\n{"uuid":"msg-2","message":{"role":"assistant","content":"Hi"}}`

    const messages = parseJSONL(jsonl)

    expect(messages).toHaveLength(2)
  })

  test('skips malformed JSON lines', () => {
    const jsonl = `{"uuid":"msg-1","message":{"role":"user","content":"Hello"}}\n{invalid json}\n{"uuid":"msg-2","message":{"role":"assistant","content":"Hi"}}`

    const messages = parseJSONL(jsonl)

    expect(messages).toHaveLength(2)
    expect(messages[0].uuid).toBe('msg-1')
    expect(messages[1].uuid).toBe('msg-2')
  })

  test('returns empty array for empty string', () => {
    const messages = parseJSONL('')
    expect(messages).toEqual([])
  })
})

describe('buildToolUseMap', () => {
  test('maps tool_use_id to tool use content', () => {
    const messages = [
      {
        uuid: 'msg-1',
        message: {
          role: 'assistant',
          content: [
            { type: 'tool_use', id: 'tool-123', name: 'Read', input: {} }
          ]
        }
      },
      {
        uuid: 'msg-2',
        message: {
          role: 'user',
          content: [
            { type: 'tool_result', tool_use_id: 'tool-123', content: 'result' }
          ]
        }
      }
    ]

    const toolMap = buildToolUseMap(messages)

    expect(toolMap['tool-123']).toBeDefined()
    expect(toolMap['tool-123'].name).toBe('Read')
    expect(toolMap['tool-123'].id).toBe('tool-123')
  })

  test('handles messages without tools', () => {
    const messages = [
      {
        uuid: 'msg-1',
        message: {
          role: 'user',
          content: 'Simple message'
        }
      }
    ]

    const toolMap = buildToolUseMap(messages)

    expect(Object.keys(toolMap)).toHaveLength(0)
  })

  test('handles array content with multiple tools', () => {
    const messages = [
      {
        uuid: 'msg-1',
        message: {
          role: 'assistant',
          content: [
            { type: 'text', text: 'Let me help' },
            { type: 'tool_use', id: 'tool-1', name: 'Read', input: {} },
            { type: 'tool_use', id: 'tool-2', name: 'Bash', input: {} }
          ]
        }
      }
    ]

    const toolMap = buildToolUseMap(messages)

    expect(Object.keys(toolMap)).toHaveLength(2)
    expect(toolMap['tool-1'].name).toBe('Read')
    expect(toolMap['tool-2'].name).toBe('Bash')
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npm test jsonlParser.test.js
```

Expected: FAIL - Module doesn't exist yet

**Step 3: Write minimal parser implementation**

Create `claude-code-visualizer/frontend/src/utils/jsonlParser.js`:

```javascript
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
```

**Step 4: Run tests to verify they pass**

```bash
npm test jsonlParser.test.js
```

Expected: PASS - All tests should pass

**Step 5: Add tests for new utility functions**

Add to `claude-code-visualizer/frontend/src/utils/jsonlParser.test.js`:

```javascript
import { extractTextContent, extractThinkingContent } from './jsonlParser'

describe('extractTextContent', () => {
  test('extracts string content', () => {
    const message = {
      message: { content: 'Simple text' }
    }

    expect(extractTextContent(message)).toBe('Simple text')
  })

  test('extracts and concatenates text blocks from array', () => {
    const message = {
      message: {
        content: [
          { type: 'text', text: 'First part' },
          { type: 'tool_use', name: 'Read' },
          { type: 'text', text: 'Second part' }
        ]
      }
    }

    expect(extractTextContent(message)).toBe('First part\n\nSecond part')
  })

  test('returns empty string for no content', () => {
    const message = { message: {} }
    expect(extractTextContent(message)).toBe('')
  })
})

describe('extractThinkingContent', () => {
  test('extracts thinking blocks', () => {
    const message = {
      message: {
        content: [
          { type: 'thinking', thinking: 'Let me think...' },
          { type: 'text', text: 'Response' }
        ]
      }
    }

    expect(extractThinkingContent(message)).toBe('Let me think...')
  })

  test('returns empty string when no thinking blocks', () => {
    const message = {
      message: {
        content: [{ type: 'text', text: 'Response' }]
      }
    }

    expect(extractThinkingContent(message)).toBe('')
  })
})
```

**Step 6: Run all tests again**

```bash
npm test jsonlParser.test.js
```

Expected: PASS - All tests should pass

**Step 7: Commit**

```bash
git add frontend/src/utils/jsonlParser.js frontend/src/utils/jsonlParser.test.js
git commit -m "feat: implement JSONL parser utility with text extraction"
```
