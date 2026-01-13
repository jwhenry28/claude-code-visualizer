# Task 4: Flask Server Setup

**Files:**
- Create: `claude-code-visualizer/src/visualizer/server.py`
- Create: `claude-code-visualizer/tests/backend/test_server.py`

**Step 1: Write the failing test**

Create `claude-code-visualizer/tests/backend/test_server.py`:

```python
"""Tests for Flask server."""
import pytest
from visualizer.server import create_app


@pytest.fixture
def client():
    """Create test client."""
    app = create_app(projects_dir='/tmp/test-projects')
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_app_creation():
    """Test that app can be created."""
    app = create_app(projects_dir='/tmp/test')
    assert app is not None
    assert app.config['PROJECTS_DIR'] == '/tmp/test'


def test_health_endpoint(client):
    """Test health check endpoint."""
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json == {'status': 'ok'}


def test_cors_headers(client):
    """Test that CORS headers are set."""
    response = client.get('/health')
    assert 'Access-Control-Allow-Origin' in response.headers
```

**Step 2: Run tests to verify they fail**

```bash
pytest tests/backend/test_server.py -v
```

Expected: FAIL with "ModuleNotFoundError: No module named 'visualizer.server'" or ImportError

**Step 3: Write minimal Flask server implementation**

Create `claude-code-visualizer/src/visualizer/server.py`:

```python
"""Flask server for Claude Code Visualizer."""
from pathlib import Path
from flask import Flask, jsonify
from flask_cors import CORS


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

**Step 4: Update requirements.txt**

Add flask-cors to `claude-code-visualizer/requirements.txt`:

```txt
flask>=3.0.0
flask-cors>=4.0.0
click>=8.1.0
```

**Step 5: Install new dependency**

```bash
pip install flask-cors
```

**Step 6: Run tests to verify they pass**

```bash
pytest tests/backend/test_server.py -v
```

Expected: PASS - All tests should pass

**Step 7: Commit**

```bash
git add src/visualizer/server.py tests/backend/test_server.py requirements.txt
git commit -m "feat: set up Flask server with CORS support"
```
