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
