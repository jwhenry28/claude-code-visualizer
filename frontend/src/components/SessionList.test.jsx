import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import SessionList from './SessionList'

describe('SessionList', () => {
  const mockSessions = [
    {
      sessionId: 'session-1',
      preview: 'First session message',
      timestamp: 1701964800000,
      messageCount: 10
    },
    {
      sessionId: 'session-2',
      preview: 'Second session message',
      timestamp: 1701961200000,
      messageCount: 5
    },
  ]

  test('renders session previews', () => {
    render(<SessionList sessions={mockSessions} selectedSession={null} onSelectSession={() => {}} />)

    expect(screen.getByText(/First session message/)).toBeInTheDocument()
    expect(screen.getByText(/Second session message/)).toBeInTheDocument()
  })

  test('calls onSelectSession when session is clicked', () => {
    const handleSelect = jest.fn()
    render(<SessionList sessions={mockSessions} selectedSession={null} onSelectSession={handleSelect} />)

    fireEvent.click(screen.getByText(/First session message/))
    expect(handleSelect).toHaveBeenCalledWith('session-1')
  })

  test('highlights selected session', () => {
    render(<SessionList sessions={mockSessions} selectedSession="session-1" onSelectSession={() => {}} />)

    const session1 = screen.getByText(/First session message/).closest('li')
    expect(session1).toHaveClass('selected')
  })

  test('renders empty state when no sessions', () => {
    render(<SessionList sessions={[]} selectedSession={null} onSelectSession={() => {}} />)

    expect(screen.getByText(/No sessions found/i)).toBeInTheDocument()
  })

  test('formats timestamp', () => {
    render(<SessionList sessions={mockSessions} selectedSession={null} onSelectSession={() => {}} />)

    // Should show formatted date (e.g., "Dec 7, 10:00 AM")
    const timestamps = screen.getAllByText(/Dec \d+/)
    expect(timestamps.length).toBeGreaterThan(0)
  })
})
