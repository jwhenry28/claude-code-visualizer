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
