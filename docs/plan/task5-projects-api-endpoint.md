# Task 5: Projects API Endpoint

**Files:**
- Modify: `claude-code-visualizer/src/visualizer/server.py`
- Modify: `claude-code-visualizer/tests/backend/test_server.py`

**Step 1: Write the failing test**

Add to `claude-code-visualizer/tests/backend/test_server.py`:

```python
import tempfile
from pathlib import Path


@pytest.fixture
def temp_projects_dir():
    """Create temporary projects directory with sample projects."""
    with tempfile.TemporaryDirectory() as tmpdir:
        tmppath = Path(tmpdir)

        # Create sample projects
        (tmppath / 'project1').mkdir()
        (tmppath / 'project2').mkdir()

        yield str(tmppath)


@pytest.fixture
def client_with_projects(temp_projects_dir):
    """Create test client with sample projects."""
    app = create_app(projects_dir=temp_projects_dir)
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_get_projects_empty(client):
    """Test GET /api/projects with empty directory."""
    response = client.get('/api/projects')
    assert response.status_code == 200
    assert response.json == []


def test_get_projects_with_data(client_with_projects):
    """Test GET /api/projects with sample projects."""
    response = client_with_projects.get('/api/projects')
    assert response.status_code == 200

    projects = response.json
    assert len(projects) == 2
    assert projects[0]['name'] == 'project1'
    assert projects[1]['name'] == 'project2'
    assert 'path' in projects[0]
    assert 'path' in projects[1]
```

**Step 2: Run tests to verify they fail**

```bash
pytest tests/backend/test_server.py::test_get_projects_empty -v
pytest tests/backend/test_server.py::test_get_projects_with_data -v
```

Expected: FAIL with 404 Not Found (endpoint doesn't exist yet)

**Step 3: Implement projects endpoint**

Modify `claude-code-visualizer/src/visualizer/server.py`:

```python
"""Flask server for Claude Code Visualizer."""
from pathlib import Path
from flask import Flask, jsonify
from flask_cors import CORS
from visualizer.scanner import scan_projects


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
pytest tests/backend/test_server.py::test_get_projects_empty -v
pytest tests/backend/test_server.py::test_get_projects_with_data -v
```

Expected: PASS - Both tests should pass

**Step 5: Test endpoint manually (optional)**

```bash
# In one terminal, start server
python -m visualizer

# In another terminal, test endpoint
curl http://localhost:3000/api/projects
```

Expected: JSON array of projects

**Step 6: Commit**

```bash
git add src/visualizer/server.py tests/backend/test_server.py
git commit -m "feat: implement GET /api/projects endpoint"
```
