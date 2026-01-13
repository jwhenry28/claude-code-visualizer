import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import SessionViewer from './SessionViewer'

global.fetch = jest.fn()

describe('SessionViewer', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  test('fetches and renders session content', async () => {
    const jsonl = `{"uuid":"msg-1","message":{"role":"user","content":"Test message"}}\n`

    fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(jsonl)
    })

    render(<SessionViewer projectName="test-project" sessionId="session-123" />)

    await waitFor(() => {
      expect(screen.getByText('User Message')).toBeInTheDocument()
      expect(screen.getByText('Test message')).toBeInTheDocument()
    })
  })

  test('shows loading state', () => {
    fetch.mockImplementationOnce(() => new Promise(() => {})) // Never resolves

    render(<SessionViewer projectName="test-project" sessionId="session-123" />)

    expect(screen.getByText(/Loading/i)).toBeInTheDocument()
  })

  test('shows error state on fetch failure', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'))

    render(<SessionViewer projectName="test-project" sessionId="session-123" />)

    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument()
    })
  })

  test('renders tools within assistant messages', async () => {
    const jsonl = `{"uuid":"msg-1","message":{"role":"assistant","content":[{"type":"text","text":"Let me help"},{"type":"tool_use","id":"tool-1","name":"Read","input":{}}]}}\n`

    fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(jsonl)
    })

    render(<SessionViewer projectName="test-project" sessionId="session-123" />)

    await waitFor(() => {
      expect(screen.getByText('Let me help')).toBeInTheDocument()
      expect(screen.getByText('Read')).toBeInTheDocument()
    })
  })
})
