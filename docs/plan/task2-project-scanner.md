# Task 2: Project Scanner

**Files:**
- Create: `claude-code-visualizer/src/visualizer/scanner.py`
- Create: `claude-code-visualizer/tests/backend/test_scanner.py`
- Create: `claude-code-visualizer/tests/backend/fixtures/.gitkeep`

**Step 1: Write the failing test**

Create `claude-code-visualizer/tests/backend/test_scanner.py`:

```python
"""Tests for project and session scanner."""
import tempfile
from pathlib import Path
import pytest
from visualizer.scanner import scan_projects, scan_sessions


def test_scan_projects_empty_directory():
    """Test scanning empty projects directory."""
    with tempfile.TemporaryDirectory() as tmpdir:
        projects = scan_projects(Path(tmpdir))
        assert projects == []


def test_scan_projects_with_projects():
    """Test scanning directory with projects."""
    with tempfile.TemporaryDirectory() as tmpdir:
        tmppath = Path(tmpdir)

        # Create project directories
        (tmppath / 'project1').mkdir()
        (tmppath / 'project2').mkdir()
        (tmppath / '.hidden').mkdir()  # Should be ignored
        (tmppath / 'file.txt').touch()  # Should be ignored

        projects = scan_projects(tmppath)

        assert len(projects) == 2
        assert projects[0]['name'] == 'project1'
        assert projects[0]['path'] == str(tmppath / 'project1')
        assert projects[1]['name'] == 'project2'
        assert projects[1]['path'] == str(tmppath / 'project2')


def test_scan_sessions_empty_project():
    """Test scanning project with no session files."""
    with tempfile.TemporaryDirectory() as tmpdir:
        sessions = scan_sessions(Path(tmpdir))
        assert sessions == []


def test_scan_sessions_with_jsonl_files():
    """Test scanning project with JSONL session files."""
    with tempfile.TemporaryDirectory() as tmpdir:
        tmppath = Path(tmpdir)

        # Create session files
        session1 = tmppath / 'c7d1fb1a-0885-4d8b-8427-0f09a0c1a94f.jsonl'
        session1.write_text('{"message": "test1"}\n')

        session2 = tmppath / 'a1b2c3d4-1234-5678-9012-abcdef123456.jsonl'
        session2.write_text('{"message": "test2"}\n')

        # Create non-session files (should be ignored)
        (tmppath / 'agent-2f346c7f.jsonl').write_text('{"message": "agent"}\n')
        (tmppath / 'README.md').write_text('# Readme')

        sessions = scan_sessions(tmppath)

        assert len(sessions) == 2
        # Should be sorted by modification time (newest first)
        assert all('sessionId' in s for s in sessions)
        assert all('filePath' in s for s in sessions)
        assert all('messageCount' in s for s in sessions)


def test_scan_sessions_excludes_agent_files():
    """Test that agent files are excluded from session list."""
    with tempfile.TemporaryDirectory() as tmpdir:
        tmppath = Path(tmpdir)

        # Create agent file (should be ignored)
        (tmppath / 'agent-abc123.jsonl').write_text('{"message": "agent"}\n')

        sessions = scan_sessions(tmppath)
        assert sessions == []
```

**Step 2: Run tests to verify they fail**

```bash
pytest tests/backend/test_scanner.py -v
```

Expected: FAIL with "ModuleNotFoundError: No module named 'visualizer.scanner'"

**Step 3: Write minimal scanner implementation**

Create `claude-code-visualizer/src/visualizer/scanner.py`:

```python
"""Scanner for Claude Code projects and session files."""
from pathlib import Path
from typing import List, Dict
import re


def scan_projects(projects_dir: Path) -> List[Dict[str, str]]:
    """
    Scan projects directory and return list of projects.

    Args:
        projects_dir: Path to ~/.claude/projects directory

    Returns:
        List of project dicts with 'name' and 'path' keys
    """
    if not projects_dir.exists():
        return []

    projects = []
    for item in sorted(projects_dir.iterdir()):
        # Only include directories, exclude hidden directories
        if item.is_dir() and not item.name.startswith('.'):
            projects.append({
                'name': item.name,
                'path': str(item.resolve())
            })

    return projects


def scan_sessions(project_dir: Path) -> List[Dict]:
    """
    Scan project directory and return session metadata.

    Args:
        project_dir: Path to a specific project directory

    Returns:
        List of session metadata dicts, sorted by modification time (newest first)
    """
    if not project_dir.exists():
        return []

    # UUID pattern for main session files (excludes agent-*.jsonl files)
    uuid_pattern = re.compile(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jsonl$'
    )

    sessions = []
    for jsonl_file in project_dir.glob('*.jsonl'):
        # Only include main session files (UUID pattern), exclude agent files
        if uuid_pattern.match(jsonl_file.name):
            # Count lines for message count
            message_count = sum(1 for line in jsonl_file.read_text().splitlines() if line.strip())

            sessions.append({
                'sessionId': jsonl_file.stem,  # Remove .jsonl extension
                'filePath': jsonl_file.name,
                'messageCount': message_count,
                'timestamp': jsonl_file.stat().st_mtime
            })

    # Sort by modification time, newest first
    sessions.sort(key=lambda s: s['timestamp'], reverse=True)

    return sessions
```

**Step 4: Run tests to verify they pass**

```bash
pytest tests/backend/test_scanner.py -v
```

Expected: PASS - All tests should pass

**Step 5: Commit**

```bash
git add src/visualizer/scanner.py tests/backend/test_scanner.py
git commit -m "feat: implement project and session scanner"
```
