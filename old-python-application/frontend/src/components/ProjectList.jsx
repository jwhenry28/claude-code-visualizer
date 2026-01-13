import React from 'react'

function ProjectList({ projects, selectedProject, onSelectProject }) {
  if (projects.length === 0) {
    return (
      <div className="project-list empty">
        <p>No Claude Code projects found</p>
        <p className="hint">Run Claude Code first to create projects</p>
      </div>
    )
  }

  return (
    <div className="project-list">
      <h2>Projects</h2>
      <ul>
        {projects.map(project => (
          <li
            key={project.name}
            className={selectedProject === project.name ? 'selected' : ''}
            onClick={() => onSelectProject(project.name)}
          >
            {project.name}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ProjectList
