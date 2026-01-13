# Task 7: Session Content API Endpoint

**Files:**
- Modify: `claude-code-visualizer/src/visualizer/server.py`
- Modify: `claude-code-visualizer/tests/backend/test_server.py`

**Step 1: Write the failing test**

Add to `claude-code-visualizer/tests/backend/test_server.py`:

```python
def test_get_session_content_nonexistent(client_with_sessions):
    """Test GET /api/session/:projectName/:sessionId with nonexistent session."""
    response = client_with_sessions.get('/api/session/test-project/nonexistent-uuid')
    assert response.status_code == 404


def test_get_session_content_success(client_with_sessions):
    """Test GET /api/session/:projectName/:sessionId returns JSONL content."""
    response = client_with_sessions.get(
        '/api/session/test-project/c7d1fb1a-0885-4d8b-8427-0f09a0c1a94f'
    )
    assert response.status_code == 200
    assert response.content_type == 'text/plain; charset=utf-8'

    # Verify content is JSONL
    content = response.data.decode('utf-8')
    lines = [line for line in content.strip().split('\n') if line]
    assert len(lines) == 1  # Our fixture has one message

    # Verify first line is valid JSON
    import json
    message = json.loads(lines[0])
    assert 'uuid' in message
    assert 'message' in message


def test_get_session_content_nonexistent_project(client_with_sessions):
    """Test GET /api/session/:projectName/:sessionId with nonexistent project."""
    response = client_with_sessions.get('/api/session/nonexistent/some-uuid')
    assert response.status_code == 404
```

**Step 2: Run tests to verify they fail**

```bash
pytest tests/backend/test_server.py::test_get_session_content_nonexistent -v
pytest tests/backend/test_server.py::test_get_session_content_success -v
pytest tests/backend/test_server.py::test_get_session_content_nonexistent_project -v
```

Expected: FAIL with 404 Not Found (endpoint doesn't exist yet)

**Step 3: Implement session content endpoint**

Modify `claude-code-visualizer/src/visualizer/server.py`:

Add the new endpoint after the `get_sessions` function:

```python
    @app.route('/api/session/<project_name>/<session_id>')
    def get_session_content(project_name: str, session_id: str):
        """
        Get raw JSONL content for a specific session.

        Args:
            project_name: Name of the project
            session_id: Session UUID

        Returns:
            Raw JSONL file content as text/plain
        """
        projects_path = Path(app.config['PROJECTS_DIR'])
        project_path = projects_path / project_name

        if not project_path.exists() or not project_path.is_dir():
            abort(404, description=f"Project '{project_name}' not found")

        session_file = project_path / f'{session_id}.jsonl'

        if not session_file.exists():
            abort(404, description=f"Session '{session_id}' not found")

        # Return raw JSONL content
        try:
            content = session_file.read_text()
            return content, 200, {'Content-Type': 'text/plain; charset=utf-8'}
        except Exception as e:
            abort(500, description=f"Error reading session file: {str(e)}")
```

**Step 4: Run tests to verify they pass**

```bash
pytest tests/backend/test_server.py::test_get_session_content_nonexistent -v
pytest tests/backend/test_server.py::test_get_session_content_success -v
pytest tests/backend/test_server.py::test_get_session_content_nonexistent_project -v
```

Expected: PASS - All tests should pass

**Step 5: Commit**

```bash
git add src/visualizer/server.py tests/backend/test_server.py
git commit -m "feat: implement GET /api/session/:projectName/:sessionId endpoint"
```
