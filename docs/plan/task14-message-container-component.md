# Task 14: MessageContainer Component

**Files:**
- Create: `claude-code-visualizer/frontend/src/components/MessageContainer.jsx`
- Create: `claude-code-visualizer/frontend/src/components/MessageContainer.test.jsx`

**Step 1: Write the failing test**

Create `claude-code-visualizer/frontend/src/components/MessageContainer.test.jsx`:

```javascript
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import MessageContainer from './MessageContainer'

describe('MessageContainer', () => {
  test('renders user message', () => {
    const message = {
      uuid: 'msg-1',
      timestamp: '2025-12-07T10:00:00Z',
      message: {
        role: 'user',
        content: 'Test message'
      }
    }

    render(<MessageContainer message={message} />)

    expect(screen.getByText('User Message')).toBeInTheDocument()
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  test('renders assistant message with model', () => {
    const message = {
      uuid: 'msg-2',
      timestamp: '2025-12-07T10:00:05Z',
      message: {
        role: 'assistant',
        model: 'claude-sonnet-4-5',
        content: 'Response text'
      }
    }

    render(<MessageContainer message={message} />)

    expect(screen.getByText('Assistant Message')).toBeInTheDocument()
    expect(screen.getByText(/claude-sonnet-4-5/)).toBeInTheDocument()
    expect(screen.getByText('Response text')).toBeInTheDocument()
  })

  test('toggles collapse on click', () => {
    const message = {
      uuid: 'msg-1',
      message: { role: 'user', content: 'Test' }
    }

    render(<MessageContainer message={message} />)

    const header = screen.getByText('User Message')

    // Should be expanded by default
    expect(screen.getByText('Test')).toBeVisible()

    // Click to collapse
    fireEvent.click(header)
    expect(screen.queryByText('Test')).not.toBeVisible()

    // Click to expand
    fireEvent.click(header)
    expect(screen.getByText('Test')).toBeVisible()
  })

  test('applies correct border color for user message', () => {
    const message = {
      uuid: 'msg-1',
      message: { role: 'user', content: 'Test' }
    }

    const { container } = render(<MessageContainer message={message} />)

    const messageDiv = container.querySelector('.message-container.user')
    expect(messageDiv).toBeInTheDocument()
  })

  test('applies correct border color for assistant message', () => {
    const message = {
      uuid: 'msg-2',
      message: { role: 'assistant', content: 'Test' }
    }

    const { container } = render(<MessageContainer message={message} />)

    const messageDiv = container.querySelector('.message-container.assistant')
    expect(messageDiv).toBeInTheDocument()
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npm test MessageContainer.test.jsx
```

Expected: FAIL - Component doesn't exist yet

**Step 3: Write minimal MessageContainer component**

Create `claude-code-visualizer/frontend/src/components/MessageContainer.jsx`:

```javascript
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
```

**Step 4: Add styles**

Add to `claude-code-visualizer/frontend/src/styles/main.css`:

```css
.message-container {
  margin-bottom: 12px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.message-container.user {
  border-left: 4px solid #3b82f6;
}

.message-container.assistant {
  border-left: 4px solid #ef4444;
}

.message-container.collapsed {
  background: #f3f4f6;
  box-shadow: none;
}

.message-header {
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  user-select: none;
}

.message-header:hover {
  background: rgba(0,0,0,0.02);
}

.message-label {
  font-weight: 600;
  color: #374151;
  flex-shrink: 0;
}

.message-model {
  font-size: 0.75rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 4px;
}

.message-timestamp {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-left: auto;
}

.expand-icon {
  color: #9ca3af;
  font-size: 0.75rem;
}

.message-content {
  padding: 0 16px 16px;
}

.thinking-content {
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
}

.thinking-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.thinking-content pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: #78350f;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.text-content {
  line-height: 1.6;
  color: #1f2937;
  white-space: pre-wrap;
}
```

**Step 5: Run tests to verify they pass**

```bash
npm test MessageContainer.test.jsx
```

Expected: PASS - All tests should pass

**Step 6: Commit**

```bash
git add frontend/src/components/MessageContainer.jsx frontend/src/components/MessageContainer.test.jsx frontend/src/styles/main.css
git commit -m "feat: implement MessageContainer component with collapse/expand"
```
