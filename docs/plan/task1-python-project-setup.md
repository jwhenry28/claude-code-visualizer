# Task 1: Python Project Setup

**Files:**
- Create: `claude-code-visualizer/pyproject.toml`
- Create: `claude-code-visualizer/requirements.txt`
- Create: `claude-code-visualizer/setup.py`
- Create: `claude-code-visualizer/src/visualizer/__init__.py`
- Create: `claude-code-visualizer/src/visualizer/__main__.py`
- Create: `claude-code-visualizer/src/visualizer/cli.py`
- Create: `claude-code-visualizer/tests/backend/__init__.py`
- Create: `claude-code-visualizer/.gitignore`

**Step 1: Create project directory structure**

```bash
mkdir -p claude-code-visualizer/src/visualizer
mkdir -p claude-code-visualizer/tests/backend
cd claude-code-visualizer
```

**Step 2: Write pyproject.toml**

Create `claude-code-visualizer/pyproject.toml`:

```toml
[build-system]
requires = ["setuptools>=45", "wheel", "setuptools_scm[toml]>=6.2"]
build-backend = "setuptools.build_meta"

[project]
name = "claude-code-visualizer"
version = "0.1.0"
description = "Local web application for debugging Claude Code sessions"
readme = "README.md"
requires-python = ">=3.10"
authors = [
    {name = "Your Name", email = "your.email@example.com"}
]
dependencies = [
    "flask>=3.0.0",
    "click>=8.1.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-cov>=4.1.0",
]

[project.scripts]
claude-visualizer = "visualizer.cli:main"

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_functions = ["test_*"]
```

**Step 3: Write requirements.txt**

Create `claude-code-visualizer/requirements.txt`:

```txt
flask>=3.0.0
click>=8.1.0
```

**Step 4: Write setup.py for backward compatibility**

Create `claude-code-visualizer/setup.py`:

```python
from setuptools import setup

setup()
```

**Step 5: Create package __init__.py**

Create `claude-code-visualizer/src/visualizer/__init__.py`:

```python
"""Claude Code Visualizer - Debug Claude Code sessions with a local web UI."""

__version__ = "0.1.0"
```

**Step 6: Write CLI entry point test**

Create `claude-code-visualizer/tests/backend/test_cli.py`:

```python
"""Tests for CLI entry point."""
import sys
from unittest.mock import patch, MagicMock
import pytest
from visualizer.cli import main, parse_args


def test_parse_args_defaults():
    """Test that parse_args returns correct defaults."""
    with patch('sys.argv', ['claude-visualizer']):
        args = parse_args()
        assert args.port == 3000
        assert args.host == 'localhost'
        assert args.no_browser is False
        assert args.projects_dir is None


def test_parse_args_custom_port():
    """Test that custom port is parsed correctly."""
    with patch('sys.argv', ['claude-visualizer', '--port', '8080']):
        args = parse_args()
        assert args.port == 8080


def test_parse_args_no_browser():
    """Test that --no-browser flag is parsed correctly."""
    with patch('sys.argv', ['claude-visualizer', '--no-browser']):
        args = parse_args()
        assert args.no_browser is True


def test_parse_args_custom_projects_dir():
    """Test that custom projects directory is parsed correctly."""
    with patch('sys.argv', ['claude-visualizer', '--projects-dir', '/custom/path']):
        args = parse_args()
        assert args.projects_dir == '/custom/path'
```

**Step 7: Run tests to verify they fail**

```bash
cd claude-code-visualizer
pip install -e ".[dev]"
pytest tests/backend/test_cli.py -v
```

Expected: FAIL with "ModuleNotFoundError: No module named 'visualizer.cli'"

**Step 8: Write minimal CLI implementation**

Create `claude-code-visualizer/src/visualizer/cli.py`:

```python
"""Command-line interface for Claude Code Visualizer."""
import sys
from pathlib import Path
import click


@click.command()
@click.option('--port', default=3000, type=int, help='Port number for web server (default: 3000)')
@click.option('--host', default='localhost', help='Host to bind server to (default: localhost)')
@click.option('--no-browser', is_flag=True, help="Don't automatically open browser on launch")
@click.option('--projects-dir', type=click.Path(exists=True), help='Custom path to Claude projects directory')
@click.version_option(version='0.1.0')
def main(port, host, no_browser, projects_dir):
    """Launch Claude Code Visualizer web application."""
    # Determine projects directory
    if projects_dir is None:
        projects_dir = Path.home() / '.claude' / 'projects'
    else:
        projects_dir = Path(projects_dir)

    # Validate projects directory exists
    if not projects_dir.exists():
        click.echo(f"Error: Claude projects directory not found at {projects_dir}", err=True)
        click.echo("Please check if Claude Code has been run, or use --projects-dir flag", err=True)
        sys.exit(1)

    click.echo(f"Claude Code Visualizer v0.1.0")
    click.echo(f"\nWatching: {projects_dir}")
    click.echo(f"Server will run at: http://{host}:{port}")

    # Server launch will be implemented in later tasks
    click.echo("\nServer not yet implemented")


def parse_args():
    """Parse command-line arguments for testing."""
    import argparse
    parser = argparse.ArgumentParser(description='Launch Claude Code Visualizer')
    parser.add_argument('--port', type=int, default=3000, help='Port number for web server')
    parser.add_argument('--host', default='localhost', help='Host to bind server to')
    parser.add_argument('--no-browser', action='store_true', help="Don't automatically open browser")
    parser.add_argument('--projects-dir', help='Custom path to Claude projects directory')
    return parser.parse_args()


if __name__ == '__main__':
    main()
```

**Step 9: Create __main__.py for python -m execution**

Create `claude-code-visualizer/src/visualizer/__main__.py`:

```python
"""Allow execution via python -m visualizer."""
from visualizer.cli import main

if __name__ == '__main__':
    main()
```

**Step 10: Create .gitignore**

Create `claude-code-visualizer/.gitignore`:

```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Testing
.pytest_cache/
.coverage
htmlcov/

# IDEs
.vscode/
.idea/
*.swp
*.swo

# Frontend
frontend/node_modules/
frontend/dist/
frontend/.vite/

# Environment
.env
venv/
env/
```

**Step 11: Run tests to verify they pass**

```bash
pytest tests/backend/test_cli.py -v
```

Expected: PASS - All tests should pass

**Step 12: Verify CLI can be invoked**

```bash
python -m visualizer --help
```

Expected: Should display help message with all options

**Step 13: Commit**

```bash
git add .
git commit -m "feat: set up Python project structure with CLI entry point"
```
