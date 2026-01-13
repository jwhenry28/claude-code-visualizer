# Task 21: Error Handling

**Files:**
- Modify: `claude-code-visualizer/src/visualizer/server.py`
- Modify: `claude-code-visualizer/frontend/src/App.jsx`
- Modify: `claude-code-visualizer/frontend/src/components/SessionViewer.jsx`
- Create: `claude-code-visualizer/frontend/src/components/ErrorBoundary.jsx`

**Step 1: Add error boundary for React**

Create `claude-code-visualizer/frontend/src/components/ErrorBoundary.jsx`:

```javascript
import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.state = { hasError: true, error, errorInfo }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>An unexpected error occurred while rendering this component.</p>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>
            <summary>Error details</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button onClick={() => window.location.reload()}>
            Reload Application
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
```

**Step 2: Wrap App with ErrorBoundary**

Modify `claude-code-visualizer/frontend/src/main.jsx`:

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './styles/main.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
```

**Step 3: Improve backend error responses**

Modify `claude-code-visualizer/src/visualizer/server.py` to add comprehensive error handling:

```python
"""Flask server for Claude Code Visualizer."""
from pathlib import Path
from flask import Flask, jsonify, abort
from flask_cors import CORS
from visualizer.scanner import scan_projects, scan_sessions
from visualizer.parser import parse_session_preview
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_app(projects_dir: str) -> Flask:
    """
    Create and configure Flask application.

    Args:
        projects_dir: Path to Claude projects directory

    Returns:
        Configured Flask app
    """
    app = Flask(__name__)
    app.config['PROJECTS_DIR'] = projects_dir

    # Enable CORS for local development
    CORS(app)

    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 errors."""
        return jsonify({'error': 'Not found', 'message': str(error)}), 404

    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 errors."""
        logger.error(f'Internal error: {error}')
        return jsonify({'error': 'Internal server error', 'message': str(error)}), 500

    @app.route('/health')
    def health():
        """Health check endpoint."""
        return jsonify({'status': 'ok'})

    @app.route('/api/projects')
    def get_projects():
        """
        Get list of all Claude Code projects.

        Returns:
            JSON array of projects with name and path
        """
        try:
            projects_path = Path(app.config['PROJECTS_DIR'])
            if not projects_path.exists():
                logger.warning(f'Projects directory not found: {projects_path}')
                return jsonify([])

            projects = scan_projects(projects_path)
            return jsonify(projects)
        except Exception as e:
            logger.error(f'Error scanning projects: {e}')
            abort(500, description=f'Error scanning projects: {str(e)}')

    @app.route('/api/sessions/<project_name>')
    def get_sessions(project_name: str):
        """
        Get list of sessions for a specific project.

        Args:
            project_name: Name of the project

        Returns:
            JSON array of session metadata
        """
        try:
            projects_path = Path(app.config['PROJECTS_DIR'])
            project_path = projects_path / project_name

            if not project_path.exists() or not project_path.is_dir():
                abort(404, description=f"Project '{project_name}' not found")

            sessions = scan_sessions(project_path)

            # Enhance with preview text
            enhanced_sessions = []
            for session in sessions:
                try:
                    jsonl_file = project_path / session['filePath']
                    preview_metadata = parse_session_preview(jsonl_file, session['sessionId'])
                    enhanced_sessions.append({
                        **session,
                        'preview': preview_metadata['preview']
                    })
                except Exception as e:
                    logger.warning(f'Error parsing session {session["sessionId"]}: {e}')
                    # Include session with error preview
                    enhanced_sessions.append({
                        **session,
                        'preview': '(Error loading preview)'
                    })

            return jsonify(enhanced_sessions)
        except Exception as e:
            if e.code == 404:
                raise
            logger.error(f'Error loading sessions for {project_name}: {e}')
            abort(500, description=f'Error loading sessions: {str(e)}')

    @app.route('/api/session/<project_name>/<session_id>')
    def get_session_content(project_name: str, session_id: str):
        """
        Get raw JSONL content for a specific session.

        Args:
            project_name: Name of the project
            session_id: Session UUID or 'agent-{agentId}' format

        Returns:
            Raw JSONL file content as text/plain
        """
        try:
            projects_path = Path(app.config['PROJECTS_DIR'])
            project_path = projects_path / project_name

            if not project_path.exists() or not project_path.is_dir():
                abort(404, description=f"Project '{project_name}' not found")

            session_file = project_path / f'{session_id}.jsonl'

            if not session_file.exists():
                abort(404, description=f"Session '{session_id}' not found")

            content = session_file.read_text()
            return content, 200, {'Content-Type': 'text/plain; charset=utf-8'}
        except Exception as e:
            if hasattr(e, 'code') and e.code == 404:
                raise
            logger.error(f'Error reading session {session_id}: {e}')
            abort(500, description=f'Error reading session file: {str(e)}')

    @app.route('/api/subagent/<project_name>/<agent_id>')
    def get_subagent_content(project_name: str, agent_id: str):
        """
        Get raw JSONL content for a specific subagent.

        Args:
            project_name: Name of the project
            agent_id: Agent short ID

        Returns:
            Raw JSONL file content as text/plain
        """
        try:
            projects_path = Path(app.config['PROJECTS_DIR'])
            project_path = projects_path / project_name

            if not project_path.exists() or not project_path.is_dir():
                abort(404, description=f"Project '{project_name}' not found")

            agent_file = project_path / f'agent-{agent_id}.jsonl'

            if not agent_file.exists():
                abort(404, description=f"Subagent '{agent_id}' not found")

            content = agent_file.read_text()
            return content, 200, {'Content-Type': 'text/plain; charset=utf-8'}
        except Exception as e:
            if hasattr(e, 'code') and e.code == 404:
                raise
            logger.error(f'Error reading subagent {agent_id}: {e}')
            abort(500, description=f'Error reading subagent file: {str(e)}')

    return app


def run_server(host: str, port: int, projects_dir: Path, debug: bool = False):
    """
    Run Flask development server.

    Args:
        host: Host to bind to
        port: Port to bind to
        projects_dir: Path to Claude projects directory
        debug: Enable debug mode
    """
    app = create_app(str(projects_dir))
    app.run(host=host, port=port, debug=debug)
```

**Step 4: Add frontend error handling for missing files**

Modify `claude-code-visualizer/frontend/src/components/SessionViewer.jsx` to handle 404 errors gracefully:

```javascript
  useEffect(() => {
    if (!projectName || !sessionId) return

    setLoading(true)
    setError(null)

    fetch(`/api/session/${projectName}/${sessionId}`)
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Session file not found. It may have been deleted.')
          }
          throw new Error(`Failed to fetch session (${res.status})`)
        }
        return res.text()
      })
      .then(jsonlText => {
        const parsed = parseJSONL(jsonlText)
        if (parsed.length === 0) {
          setError('Session file is empty or contains no valid messages')
          setLoading(false)
          return
        }
        setMessages(parsed)
        setToolUseMap(buildToolUseMap(parsed))
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [projectName, sessionId])
```

**Step 5: Add error boundary styling**

Add to `claude-code-visualizer/frontend/src/styles/main.css`:

```css
.error-boundary {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 2rem;
  text-align: center;
  background: #fef2f2;
  color: #dc2626;
}

.error-boundary h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #991b1b;
}

.error-boundary p {
  font-size: 1rem;
  margin-bottom: 1.5rem;
  color: #7f1d1d;
}

.error-boundary details {
  margin-top: 1rem;
  text-align: left;
  background: white;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #fecaca;
  max-width: 600px;
  font-family: monospace;
  font-size: 0.75rem;
  color: #991b1b;
}

.error-boundary button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}

.error-boundary button:hover {
  background: #b91c1c;
}
```

**Step 6: Test error scenarios**

Test each error scenario in browser:

1. Missing projects directory:
   ```bash
   python -m visualizer --projects-dir /nonexistent/path
   ```

2. Empty projects directory:
   ```bash
   mkdir -p /tmp/empty-projects
   python -m visualizer --projects-dir /tmp/empty-projects
   ```

3. Malformed JSONL file (create manually for testing)

4. Network error (stop backend while frontend is running)

5. 404 error (try to load non-existent session)

**Step 7: Run all tests**

```bash
# Backend tests
pytest tests/backend/ -v

# Frontend tests (if any error handling tests were added)
cd frontend
npm test
```

**Step 8: Commit**

```bash
git add src/visualizer/server.py frontend/src/components/ErrorBoundary.jsx frontend/src/main.jsx frontend/src/components/SessionViewer.jsx frontend/src/styles/main.css
git commit -m "feat: add comprehensive error handling for backend and frontend"
```
