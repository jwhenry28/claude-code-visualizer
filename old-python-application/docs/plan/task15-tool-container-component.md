# Task 15: ToolContainer Component

**Files:**
- Create: `claude-code-visualizer/frontend/src/components/ToolContainer.jsx`
- Create: `claude-code-visualizer/frontend/src/components/ToolContainer.test.jsx`

**Step 1: Write the failing test**

Create `claude-code-visualizer/frontend/src/components/ToolContainer.test.jsx`:

```javascript
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ToolContainer from './ToolContainer'

describe('ToolContainer', () => {
  test('renders tool_use collapsed by default', () => {
    const toolUse = {
      type: 'tool_use',
      id: 'tool-123',
      name: 'Read',
      input: { file_path: '/test.txt' }
    }

    render(<ToolContainer content={toolUse} />)

    expect(screen.getByText('Read')).toBeInTheDocument()
    // Input should not be visible when collapsed
    expect(screen.queryByText('/test.txt')).not.toBeVisible()
  })

  test('expands tool_use on click', () => {
    const toolUse = {
      type: 'tool_use',
      id: 'tool-123',
      name: 'Read',
      input: { file_path: '/test.txt' }
    }

    render(<ToolContainer content={toolUse} />)

    fireEvent.click(screen.getByText('Read'))

    // Input should be visible when expanded
    expect(screen.getByText(/test\.txt/)).toBeVisible()
  })

  test('renders tool_result collapsed by default', () => {
    const toolResult = {
      type: 'tool_result',
      tool_use_id: 'tool-123',
      content: 'File contents here'
    }

    const toolUseMap = {
      'tool-123': { name: 'Read', id: 'tool-123' }
    }

    render(<ToolContainer content={toolResult} toolUseMap={toolUseMap} />)

    expect(screen.getByText('Read')).toBeInTheDocument()
    expect(screen.queryByText('File contents here')).not.toBeVisible()
  })

  test('shows agentId indicator for Task tool with subagent', () => {
    const toolUse = {
      type: 'tool_use',
      id: 'tool-456',
      name: 'Task',
      input: { prompt: 'Do something' }
    }

    const agentId = '2f346c7f'

    render(<ToolContainer content={toolUse} agentId={agentId} />)

    expect(screen.getByText('Task')).toBeInTheDocument()
    expect(screen.getByText('🔗')).toBeInTheDocument()
  })

  test('calls onSubagentClick when Task tool is clicked', () => {
    const toolUse = {
      type: 'tool_use',
      id: 'tool-456',
      name: 'Task',
      input: { prompt: 'Do something' }
    }

    const agentId = '2f346c7f'
    const handleClick = jest.fn()

    render(<ToolContainer content={toolUse} agentId={agentId} onSubagentClick={handleClick} />)

    fireEvent.click(screen.getByText('Task'))

    expect(handleClick).toHaveBeenCalledWith(agentId)
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npm test ToolContainer.test.jsx
```

Expected: FAIL - Component doesn't exist yet

**Step 3: Write minimal ToolContainer component**

Create `claude-code-visualizer/frontend/src/components/ToolContainer.jsx`:

```javascript
import React, { useState } from 'react'

function ToolContainer({ content, toolUseMap = {}, agentId, onSubagentClick }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const isToolUse = content.type === 'tool_use'
  const isToolResult = content.type === 'tool_result'

  const toolName = isToolUse
    ? content.name
    : (toolUseMap[content.tool_use_id]?.name || 'Unknown Tool')

  const hasSubagent = isToolUse && content.name === 'Task' && agentId
  const isClickable = hasSubagent

  const handleClick = () => {
    if (isClickable && onSubagentClick) {
      onSubagentClick(agentId)
    }
    setIsExpanded(!isExpanded)
  }

  const renderInput = () => {
    if (!isToolUse || !isExpanded) return null

    return (
      <div className="tool-input">
        <div className="tool-section-label">Input:</div>
        <pre>{JSON.stringify(content.input, null, 2)}</pre>
      </div>
    )
  }

  const renderResult = () => {
    if (!isToolResult || !isExpanded) return null

    let resultContent = content.content

    // Handle different result content formats
    if (Array.isArray(resultContent)) {
      resultContent = resultContent
        .map(item => {
          if (typeof item === 'string') return item
          if (item.type === 'text') return item.text
          return JSON.stringify(item)
        })
        .join('\n')
    }

    return (
      <div className="tool-result">
        <div className="tool-section-label">Result:</div>
        <pre>{resultContent}</pre>
      </div>
    )
  }

  return (
    <div className={`tool-container ${isToolUse ? 'tool-use' : 'tool-result'} ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div
        className={`tool-header ${isClickable ? 'clickable' : ''}`}
        onClick={handleClick}
      >
        <span className="tool-name">{toolName}</span>
        {hasSubagent && <span className="subagent-icon">🔗</span>}
        {agentId && <span className="agent-id">Agent: {agentId}</span>}
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div className="tool-content">
          {renderInput()}
          {renderResult()}
        </div>
      )}
    </div>
  )
}

export default ToolContainer
```

**Step 4: Add styles**

Add to `claude-code-visualizer/frontend/src/styles/main.css`:

```css
.tool-container {
  margin: 8px 0 8px 12px;
  border-radius: 4px;
  background: #fafafa;
}

.tool-container.tool-use {
  border-left: 3px solid #22c55e;
}

.tool-container.tool-result {
  border-left: 3px solid #f59e0b;
}

.tool-header {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  user-select: none;
}

.tool-header:hover {
  background: rgba(0,0,0,0.02);
}

.tool-header.clickable {
  cursor: pointer;
}

.tool-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.subagent-icon {
  font-size: 0.875rem;
}

.agent-id {
  font-size: 0.75rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 3px;
}

.expand-icon {
  margin-left: auto;
  color: #9ca3af;
  font-size: 0.75rem;
}

.tool-content {
  padding: 0 12px 12px;
}

.tool-section-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.tool-input pre,
.tool-result pre {
  margin: 0;
  padding: 8px;
  background: #1f2937;
  color: #f3f4f6;
  border-radius: 4px;
  font-size: 0.75rem;
  font-family: 'Courier New', monospace;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.tool-result {
  margin-top: 8px;
}
```

**Step 5: Run tests to verify they pass**

```bash
npm test ToolContainer.test.jsx
```

Expected: PASS - All tests should pass

**Step 6: Commit**

```bash
git add frontend/src/components/ToolContainer.jsx frontend/src/components/ToolContainer.test.jsx frontend/src/styles/main.css
git commit -m "feat: implement ToolContainer component with subagent linking"
```
