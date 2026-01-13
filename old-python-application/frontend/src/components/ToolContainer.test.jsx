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
    expect(screen.queryByText('/test.txt')).not.toBeInTheDocument()
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
    expect(screen.getByText(/test\.txt/)).toBeInTheDocument()
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
    expect(screen.queryByText('File contents here')).not.toBeInTheDocument()
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
