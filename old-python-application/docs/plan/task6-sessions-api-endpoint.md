# Task 6: Sessions API Endpoint

**Files:**
- Modify: `claude-code-visualizer/src/visualizer/server.py`
- Modify: `claude-code-visualizer/tests/backend/test_server.py`

**Step 1: Write the failing test**

Add to `claude-code-visualizer/tests/backend/test_server.py`:

```python
import json


@pytest.fixture
def temp_project_with_sessions(temp_projects_dir):
    """Create temporary project with session files."""
    project_path = Path(temp_projects_dir) / 'test-project'
    project_path.mkdir()

    # Create sample session files
    session1 = project_path / 'c7d1fb1a-0885-4d8b-8427-0f09a0c1a94f.jsonl'
    session1.write_text(json.dumps({
        "uuid": "msg-001",
        "message": {"role": "user", "content": "First message"}
    }) + '\n')

    session2 = project_path / 'a1b2c3d4-1234-5678-9012-abcdef123456.jsonl'
    session2.write_text(json.dumps({
        "uuid": "msg-002",
        "message": {"role": "user", "content": "Second message"}
    }) + '\n')

    # Create agent file (should be excluded)
    agent_file = project_path / 'agent-abc123.jsonl'
    agent_file.write_text('{"message": "agent"}\n')

    yield str(temp_projects_dir)


@pytest.fixture
def client_with_sessions(temp_project_with_sessions):
    """Create test client with sessions."""
    app = create_app(projects_dir=temp_project_with_sessions)
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_get_sessions_nonexistent_project(client_with_sessions):
    """Test GET /api/sessions/:projectName with nonexistent project."""
    response = client_with_sessions.get('/api/sessions/nonexistent')
    assert response.status_code == 404


def test_get_sessions_with_data(client_with_sessions):
    """Test GET /api/sessions/:projectName with sample sessions."""
    response = client_with_sessions.get('/api/sessions/test-project')
    assert response.status_code == 200

    sessions = response.json
    assert len(sessions) == 2

    # Verify session structure
    for session in sessions:
        assert 'sessionId' in session
        assert 'preview' in session
        assert 'messageCount' in session
        assert 'filePath' in session
        assert 'timestamp' in session

    # Verify agent files are excluded
    session_ids = [s['sessionId'] for s in sessions]
    assert 'agent-abc123' not in session_ids


def test_get_sessions_sorted_by_timestamp(client_with_sessions):
    """Test that sessions are sorted by timestamp (newest first)."""
    response = client_with_sessions.get('/api/sessions/test-project')
    sessions = response.json

    # Sessions should be sorted by timestamp descending
    if len(sessions) > 1:
        for i in range(len(sessions) - 1):
            assert sessions[i]['timestamp'] >= sessions[i + 1]['timestamp']
```

**Step 2: Run tests to verify they fail**

```bash
pytest tests/backend/test_server.py::test_get_sessions_nonexistent_project -v
pytest tests/backend/test_server.py::test_get_sessions_with_data -v
pytest tests/backend/test_server.py::test_get_sessions_sorted_by_timestamp -v
```

Expected: FAIL with 404 Not Found (endpoint doesn't exist yet)

**Step 3: Implement sessions endpoint**

Modify `claude-code-visualizer/src/visualizer/server.py`:

```python
"""Flask server for Claude Code Visualizer."""
from pathlib import Path
from flask import Flask, jsonify, abort
from flask_cors import CORS
from visualizer.scanner import scan_projects, scan_sessions
from visualizer.parser import parse_session_preview


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
        projects_path = Path(app.config['PROJECTS_DIR'])
        projects = scan_projects(projects_path)
        return jsonify(projects)

    @app.route('/api/sessions/<project_name>')
    def get_sessions(project_name: str):
        """
        Get list of sessions for a specific project.

        Args:
            project_name: Name of the project

        Returns:
            JSON array of session metadata
        """
        projects_path = Path(app.config['PROJECTS_DIR'])
        project_path = projects_path / project_name

        if not project_path.exists() or not project_path.is_dir():
            abort(404, description=f"Project '{project_name}' not found")

        # Scan sessions and add previews
        sessions = scan_sessions(project_path)

        # Enhance with preview text from parser
        enhanced_sessions = []
        for session in sessions:
            jsonl_file = project_path / session['filePath']
            preview_metadata = parse_session_preview(jsonl_file, session['sessionId'])

            # Merge metadata
            enhanced_sessions.append({
                **session,
                'preview': preview_metadata['preview']
            })

        return jsonify(enhanced_sessions)

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

**Step 4: Run tests to verify they pass**

```bash
pytest tests/backend/test_server.py::test_get_sessions_nonexistent_project -v
pytest tests/backend/test_server.py::test_get_sessions_with_data -v
pytest tests/backend/test_server.py::test_get_sessions_sorted_by_timestamp -v
```

Expected: PASS - All tests should pass

**Step 5: Commit**

```bash
git add src/visualizer/server.py tests/backend/test_server.py
git commit -m "feat: implement GET /api/sessions/:projectName endpoint"
```
