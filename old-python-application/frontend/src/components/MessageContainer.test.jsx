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
    expect(screen.getByText('Test')).toBeInTheDocument()

    // Click to collapse
    fireEvent.click(header)
    expect(screen.queryByText('Test')).not.toBeInTheDocument()

    // Click to expand
    fireEvent.click(header)
    expect(screen.getByText('Test')).toBeInTheDocument()
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
