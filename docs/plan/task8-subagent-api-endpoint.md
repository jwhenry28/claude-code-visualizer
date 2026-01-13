# Task 8: Subagent API Endpoint

**Files:**
- Modify: `claude-code-visualizer/src/visualizer/server.py`
- Modify: `claude-code-visualizer/tests/backend/test_server.py`

**Step 1: Create test fixture with subagent file**

Add to `claude-code-visualizer/tests/backend/test_server.py`:

```python
@pytest.fixture
def temp_project_with_subagent(temp_project_with_sessions):
    """Add subagent file to project."""
    project_path = Path(temp_project_with_sessions) / 'test-project'

    # Create subagent file
    agent_file = project_path / 'agent-2f346c7f.jsonl'
    agent_file.write_text(json.dumps({
        "uuid": "agent-msg-001",
        "message": {"role": "user", "content": "Subagent message"}
    }) + '\n')

    yield str(temp_project_with_sessions)


@pytest.fixture
def client_with_subagent(temp_project_with_subagent):
    """Create test client with subagent."""
    app = create_app(projects_dir=temp_project_with_subagent)
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client
```

**Step 2: Write the failing test**

Add to `claude-code-visualizer/tests/backend/test_server.py`:

```python
def test_get_subagent_nonexistent(client_with_subagent):
    """Test GET /api/subagent/:projectName/:agentId with nonexistent agent."""
    response = client_with_subagent.get('/api/subagent/test-project/nonexistent')
    assert response.status_code == 404


def test_get_subagent_success(client_with_subagent):
    """Test GET /api/subagent/:projectName/:agentId returns JSONL content."""
    response = client_with_subagent.get('/api/subagent/test-project/2f346c7f')
    assert response.status_code == 200
    assert response.content_type == 'text/plain; charset=utf-8'

    # Verify content is JSONL
    content = response.data.decode('utf-8')
    lines = [line for line in content.strip().split('\n') if line]
    assert len(lines) == 1

    # Verify first line is valid JSON
    message = json.loads(lines[0])
    assert 'uuid' in message
    assert 'message' in message
    assert message['message']['content'] == "Subagent message"


def test_get_subagent_nonexistent_project(client_with_subagent):
    """Test GET /api/subagent/:projectName/:agentId with nonexistent project."""
    response = client_with_subagent.get('/api/subagent/nonexistent/some-agent')
    assert response.status_code == 404
```

**Step 3: Run tests to verify they fail**

```bash
pytest tests/backend/test_server.py::test_get_subagent_nonexistent -v
pytest tests/backend/test_server.py::test_get_subagent_success -v
pytest tests/backend/test_server.py::test_get_subagent_nonexistent_project -v
```

Expected: FAIL with 404 Not Found (endpoint doesn't exist yet)

**Step 4: Implement subagent endpoint**

Modify `claude-code-visualizer/src/visualizer/server.py`:

Add the new endpoint after the `get_session_content` function:

```python
    @app.route('/api/subagent/<project_name>/<agent_id>')
    def get_subagent_content(project_name: str, agent_id: str):
        """
        Get raw JSONL content for a specific subagent.

        Args:
            project_name: Name of the project
            agent_id: Agent short ID (e.g., '2f346c7f')

        Returns:
            Raw JSONL file content as text/plain
        """
        projects_path = Path(app.config['PROJECTS_DIR'])
        project_path = projects_path / project_name

        if not project_path.exists() or not project_path.is_dir():
            abort(404, description=f"Project '{project_name}' not found")

        agent_file = project_path / f'agent-{agent_id}.jsonl'

        if not agent_file.exists():
            abort(404, description=f"Subagent '{agent_id}' not found")

        # Return raw JSONL content
        try:
            content = agent_file.read_text()
            return content, 200, {'Content-Type': 'text/plain; charset=utf-8'}
        except Exception as e:
            abort(500, description=f"Error reading subagent file: {str(e)}")
```

**Step 5: Run tests to verify they pass**

```bash
pytest tests/backend/test_server.py::test_get_subagent_nonexistent -v
pytest tests/backend/test_server.py::test_get_subagent_success -v
pytest tests/backend/test_server.py::test_get_subagent_nonexistent_project -v
```

Expected: PASS - All tests should pass

**Step 6: Run all backend tests**

```bash
pytest tests/backend/ -v
```

Expected: PASS - All backend tests should pass

**Step 7: Commit**

```bash
git add src/visualizer/server.py tests/backend/test_server.py
git commit -m "feat: implement GET /api/subagent/:projectName/:agentId endpoint"
```
