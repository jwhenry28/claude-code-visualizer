"""Flask server for Claude Code Visualizer."""
from pathlib import Path
from flask import Flask, jsonify, abort, send_from_directory
from flask_cors import CORS
from visualizer.scanner import scan_projects, scan_sessions
from visualizer.parser import parse_session_preview
import logging
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_frontend_path():
    """Get path to built frontend files."""
    # In development, use frontend/dist
    # In production, frontend is bundled with package
    package_dir = Path(__file__).parent
    frontend_dist = package_dir / 'static'

    if not frontend_dist.exists():
        # Fall back to development path
        frontend_dist = package_dir.parent.parent / 'frontend' / 'dist'

    return frontend_dist


def create_app(projects_dir: str) -> Flask:
    """
    Create and configure Flask application.

    Args:
        projects_dir: Path to Claude projects directory

    Returns:
        Configured Flask app
    """
    frontend_path = get_frontend_path()
    app = Flask(__name__, static_folder=str(frontend_path), static_url_path='')
    app.config['PROJECTS_DIR'] = projects_dir

    # Enable CORS for local development
    CORS(app)

    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 errors."""
        return jsonify({'error': 'Not found', 'message': str(error)}), 404

    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 errors."""
        logger.error(f'Internal error: {error}')
        return jsonify({'error': 'Internal server error', 'message': str(error)}), 500

    @app.route('/health')
    def health():
        """Health check endpoint."""
        return jsonify({'status': 'ok'})

    @app.route('/api/projects')
    def get_projects():
        """
        Get list of all Claude Code projects.

        Returns:
            JSON array of projects with name and path
        """
        try:
            projects_path = Path(app.config['PROJECTS_DIR'])
            if not projects_path.exists():
                logger.warning(f'Projects directory not found: {projects_path}')
                return jsonify([])

            projects = scan_projects(projects_path)
            return jsonify(projects)
        except Exception as e:
            logger.error(f'Error scanning projects: {e}')
            abort(500, description=f'Error scanning projects: {str(e)}')

    @app.route('/api/sessions/<project_name>')
    def get_sessions(project_name: str):
        """
        Get list of sessions for a specific project.

        Args:
            project_name: Name of the project

        Returns:
            JSON array of session metadata
        """
        try:
            projects_path = Path(app.config['PROJECTS_DIR'])
            project_path = projects_path / project_name

            if not project_path.exists() or not project_path.is_dir():
                abort(404, description=f"Project '{project_name}' not found")

            sessions = scan_sessions(project_path)

            # Enhance with preview text
            enhanced_sessions = []
            for session in sessions:
                try:
                    jsonl_file = project_path / session['filePath']
                    preview_metadata = parse_session_preview(jsonl_file, session['sessionId'])
                    enhanced_sessions.append({
                        **session,
                        'preview': preview_metadata['preview']
                    })
                except Exception as e:
                    logger.warning(f'Error parsing session {session["sessionId"]}: {e}')
                    # Include session with error preview
                    enhanced_sessions.append({
                        **session,
                        'preview': '(Error loading preview)'
                    })

            return jsonify(enhanced_sessions)
        except Exception as e:
            if hasattr(e, 'code') and e.code == 404:
                raise
            logger.error(f'Error loading sessions for {project_name}: {e}')
            abort(500, description=f'Error loading sessions: {str(e)}')

    @app.route('/api/session/<project_name>/<session_id>')
    def get_session_content(project_name: str, session_id: str):
        """
        Get raw JSONL content for a specific session or agent.

        Args:
            project_name: Name of the project
            session_id: Session UUID or 'agent-{agentId}' format

        Returns:
            Raw JSONL file content as text/plain
        """
        try:
            projects_path = Path(app.config['PROJECTS_DIR'])
            project_path = projects_path / project_name

            if not project_path.exists() or not project_path.is_dir():
                abort(404, description=f"Project '{project_name}' not found")

            # Handle both regular sessions and agent files
            session_file = project_path / f'{session_id}.jsonl'

            if not session_file.exists():
                abort(404, description=f"Session '{session_id}' not found")

            content = session_file.read_text()
            return content, 200, {'Content-Type': 'text/plain; charset=utf-8'}
        except Exception as e:
            if hasattr(e, 'code') and e.code == 404:
                raise
            logger.error(f'Error reading session {session_id}: {e}')
            abort(500, description=f'Error reading session file: {str(e)}')

    @app.route('/api/subagent/<project_name>/<agent_id>')
    def get_subagent_content(project_name: str, agent_id: str):
        """
        Get raw JSONL content for a specific subagent.

        Args:
            project_name: Name of the project
            agent_id: Agent short ID

        Returns:
            Raw JSONL file content as text/plain
        """
        try:
            projects_path = Path(app.config['PROJECTS_DIR'])
            project_path = projects_path / project_name

            if not project_path.exists() or not project_path.is_dir():
                abort(404, description=f"Project '{project_name}' not found")

            agent_file = project_path / f'agent-{agent_id}.jsonl'

            if not agent_file.exists():
                abort(404, description=f"Subagent '{agent_id}' not found")

            content = agent_file.read_text()
            return content, 200, {'Content-Type': 'text/plain; charset=utf-8'}
        except Exception as e:
            if hasattr(e, 'code') and e.code == 404:
                raise
            logger.error(f'Error reading subagent {agent_id}: {e}')
            abort(500, description=f'Error reading subagent file: {str(e)}')

    @app.route('/')
    def index():
        """Serve frontend index.html."""
        return send_from_directory(app.static_folder, 'index.html')

    @app.route('/<path:path>')
    def serve_static(path):
        """Serve static files (JS, CSS, etc)."""
        # Don't serve static files for API routes
        if path.startswith('api/') or path.startswith('health'):
            return not_found('API endpoint not found')

        if os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        # If file doesn't exist, serve index.html (for client-side routing)
        return send_from_directory(app.static_folder, 'index.html')

    return app


def run_server(host: str, port: int, projects_dir: Path, debug: bool = False):
    """
    Run Flask development server.

    Args:
        host: Host to bind to
        port: Port to bind to
        projects_dir: Path to Claude projects directory
        debug: Enable debug mode
    """
    app = create_app(str(projects_dir))
    app.run(host=host, port=port, debug=debug)
