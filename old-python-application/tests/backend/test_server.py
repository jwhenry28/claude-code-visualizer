"""Tests for Flask server."""
import pytest
import tempfile
import json
from pathlib import Path
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
