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
