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
