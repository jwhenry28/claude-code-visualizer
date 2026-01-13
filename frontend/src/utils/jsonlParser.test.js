import { parseJSONL, buildToolUseMap, extractTextContent, extractThinkingContent } from './jsonlParser'

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
