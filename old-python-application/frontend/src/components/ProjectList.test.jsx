import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ProjectList from './ProjectList'

describe('ProjectList', () => {
  const mockProjects = [
    { name: 'project1', path: '/path/to/project1' },
    { name: 'project2', path: '/path/to/project2' },
  ]

  test('renders project names', () => {
    render(<ProjectList projects={mockProjects} selectedProject={null} onSelectProject={() => {}} />)

    expect(screen.getByText('project1')).toBeInTheDocument()
    expect(screen.getByText('project2')).toBeInTheDocument()
  })

  test('calls onSelectProject when project is clicked', () => {
    const handleSelect = jest.fn()
    render(<ProjectList projects={mockProjects} selectedProject={null} onSelectProject={handleSelect} />)

    fireEvent.click(screen.getByText('project1'))
    expect(handleSelect).toHaveBeenCalledWith('project1')
  })

  test('highlights selected project', () => {
    render(<ProjectList projects={mockProjects} selectedProject="project1" onSelectProject={() => {}} />)

    const project1 = screen.getByText('project1').closest('li')
    expect(project1).toHaveClass('selected')
  })

  test('renders empty state when no projects', () => {
    render(<ProjectList projects={[]} selectedProject={null} onSelectProject={() => {}} />)

    expect(screen.getByText(/No Claude Code projects found/i)).toBeInTheDocument()
  })
})
