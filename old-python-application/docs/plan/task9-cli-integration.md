# Task 9: CLI Integration

**Files:**
- Modify: `claude-code-visualizer/src/visualizer/cli.py`
- Modify: `claude-code-visualizer/tests/backend/test_cli.py`

**Step 1: Write the failing test**

Modify `claude-code-visualizer/tests/backend/test_cli.py`:

```python
"""Tests for CLI entry point."""
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock, call
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


@patch('visualizer.cli.run_server')
@patch('visualizer.cli.webbrowser.open')
@patch('visualizer.cli.scan_projects')
def test_main_starts_server_and_opens_browser(mock_scan, mock_browser, mock_server):
    """Test that main() starts server and opens browser by default."""
    with tempfile.TemporaryDirectory() as tmpdir:
        mock_scan.return_value = [{'name': 'project1', 'path': str(Path(tmpdir) / 'project1')}]

        with patch('sys.argv', ['claude-visualizer', '--projects-dir', tmpdir]):
            with patch('visualizer.cli.click.echo'):
                # Mock run_server to not actually start
                main.callback(
                    port=3000,
                    host='localhost',
                    no_browser=False,
                    projects_dir=tmpdir
                )

        # Verify browser was opened
        mock_browser.assert_called_once_with('http://localhost:3000')

        # Verify server was started
        mock_server.assert_called_once()


@patch('visualizer.cli.run_server')
@patch('visualizer.cli.webbrowser.open')
@patch('visualizer.cli.scan_projects')
def test_main_no_browser_flag(mock_scan, mock_browser, mock_server):
    """Test that --no-browser flag prevents browser opening."""
    with tempfile.TemporaryDirectory() as tmpdir:
        mock_scan.return_value = []

        with patch('sys.argv', ['claude-visualizer', '--no-browser', '--projects-dir', tmpdir]):
            with patch('visualizer.cli.click.echo'):
                main.callback(
                    port=3000,
                    host='localhost',
                    no_browser=True,
                    projects_dir=tmpdir
                )

        # Verify browser was NOT opened
        mock_browser.assert_not_called()

        # Verify server was still started
        mock_server.assert_called_once()
```

**Step 2: Run tests to verify they fail**

```bash
pytest tests/backend/test_cli.py::test_main_starts_server_and_opens_browser -v
pytest tests/backend/test_cli.py::test_main_no_browser_flag -v
```

Expected: FAIL - Tests expect browser opening and server start that aren't implemented

**Step 3: Implement CLI integration**

Modify `claude-code-visualizer/src/visualizer/cli.py`:

```python
"""Command-line interface for Claude Code Visualizer."""
import sys
import webbrowser
from pathlib import Path
import click
from visualizer.server import run_server
from visualizer.scanner import scan_projects


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

    # Scan for projects
    projects = scan_projects(projects_dir)

    click.echo(f"Claude Code Visualizer v0.1.0\n")
    click.echo(f"Watching: {projects_dir}")
    click.echo(f"Projects found: {len(projects)}\n")
    click.echo(f"Server running at: http://{host}:{port}")
    click.echo("Press Ctrl+C to stop\n")

    # Open browser if not disabled
    if not no_browser:
        url = f'http://{host}:{port}'
        click.echo(f"Opening browser at {url}...")
        webbrowser.open(url)

    # Start server (blocking call)
    try:
        run_server(host=host, port=port, projects_dir=projects_dir)
    except KeyboardInterrupt:
        click.echo("\n\nServer stopped")
        sys.exit(0)


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

**Step 4: Run tests to verify they pass**

```bash
pytest tests/backend/test_cli.py::test_main_starts_server_and_opens_browser -v
pytest tests/backend/test_cli.py::test_main_no_browser_flag -v
```

Expected: PASS - All CLI tests should pass

**Step 5: Test CLI manually**

```bash
python -m visualizer --help
```

Expected: Should display help with all options

**Step 6: Run all backend tests**

```bash
pytest tests/backend/ -v
```

Expected: PASS - All backend tests should pass

**Step 7: Commit**

```bash
git add src/visualizer/cli.py tests/backend/test_cli.py
git commit -m "feat: integrate CLI with server launch and browser opening"
```
