# Task 22: Packaging and Deployment

**Files:**
- Modify: `claude-code-visualizer/pyproject.toml`
- Create: `claude-code-visualizer/MANIFEST.in`
- Create: `claude-code-visualizer/README.md`
- Modify: `claude-code-visualizer/src/visualizer/server.py`

**Step 1: Build frontend for production**

```bash
cd claude-code-visualizer/frontend
npm run build
```

Expected: Production build created in `frontend/dist/`

**Step 2: Configure Flask to serve static files**

Modify `claude-code-visualizer/src/visualizer/server.py` to serve built frontend:

```python
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

    @app.route('/')
    def index():
        """Serve frontend index.html."""
        return send_from_directory(app.static_folder, 'index.html')

    @app.route('/<path:path>')
    def serve_static(path):
        """Serve static files (JS, CSS, etc)."""
        if os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        # If file doesn't exist, serve index.html (for client-side routing)
        return send_from_directory(app.static_folder, 'index.html')

    # ... (rest of the API endpoints remain the same)

    return app
```

**Step 3: Create MANIFEST.in for package data**

Create `claude-code-visualizer/MANIFEST.in`:

```
include README.md
include LICENSE
include requirements.txt
recursive-include src/visualizer/static *
```

**Step 4: Update pyproject.toml for packaging**

Modify `claude-code-visualizer/pyproject.toml`:

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
license = {text = "MIT"}
authors = [
    {name = "Your Name", email = "your.email@example.com"}
]
keywords = ["claude", "debugging", "visualization", "development-tools"]
classifiers = [
    "Development Status :: 3 - Alpha",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
]
dependencies = [
    "flask>=3.0.0",
    "flask-cors>=4.0.0",
    "click>=8.1.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-cov>=4.1.0",
    "black>=23.0.0",
    "flake8>=6.0.0",
]

[project.scripts]
claude-visualizer = "visualizer.cli:main"

[project.urls]
Homepage = "https://github.com/yourusername/claude-code-visualizer"
Documentation = "https://github.com/yourusername/claude-code-visualizer/blob/main/README.md"
Repository = "https://github.com/yourusername/claude-code-visualizer"
Issues = "https://github.com/yourusername/claude-code-visualizer/issues"

[tool.setuptools.packages.find]
where = ["src"]

[tool.setuptools.package-data]
visualizer = ["static/**/*"]

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_functions = ["test_*"]

[tool.black]
line-length = 100
target-version = ['py310']
```

**Step 5: Create comprehensive README**

Create `claude-code-visualizer/README.md`:

```markdown
# Claude Code Visualizer

A local web application for debugging Claude Code sessions. Explore session histories, navigate subagent trees, and search through conversation timelines with an intuitive interface.

## Features

- **Project Browser**: View all Claude Code projects from `~/.claude/projects`
- **Session Timeline**: Explore messages with collapsible containers
- **Subagent Navigation**: Click Task tools to view subagent execution
- **Search**: Find text across sessions with regex support
- **Clean UI**: Color-coded messages, tools, and results

## Installation

```bash
pip install claude-code-visualizer
```

## Usage

Launch the visualizer:

```bash
claude-visualizer
```

This will:
1. Scan `~/.claude/projects` for Claude Code sessions
2. Start a local web server (default: http://localhost:3000)
3. Open your browser automatically

### Command-Line Options

```bash
claude-visualizer --help
```

Options:
- `--port PORT`: Port number for web server (default: 3000)
- `--host HOST`: Host to bind server to (default: localhost)
- `--no-browser`: Don't automatically open browser
- `--projects-dir PATH`: Custom path to Claude projects directory

### Examples

```bash
# Use custom port
claude-visualizer --port 8080

# Use custom projects directory
claude-visualizer --projects-dir /path/to/projects

# Run without opening browser
claude-visualizer --no-browser
```

## Development

### Setup

1. Clone the repository
2. Install dependencies:

```bash
# Backend
pip install -e ".[dev]"

# Frontend
cd frontend
npm install
```

### Running Locally

```bash
# Terminal 1: Backend
python -m visualizer

# Terminal 2: Frontend (with hot reload)
cd frontend
npm run dev
```

Visit http://localhost:5173 for the frontend dev server (proxies API to backend).

### Testing

```bash
# Backend tests
pytest tests/backend/ -v

# Frontend tests
cd frontend
npm test
```

### Building

```bash
# Build frontend
cd frontend
npm run build

# Build Python package
python -m build
```

## Architecture

- **Backend**: Python 3.10+ with Flask, serving JSONL files and metadata
- **Frontend**: React 18+ with Vite, rendering timelines and handling search
- **Data**: Reads from `~/.claude/projects` filesystem (no database required)

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR on GitHub.
```

**Step 6: Create LICENSE file**

Create `claude-code-visualizer/LICENSE`:

```
MIT License

Copyright (c) 2025 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**Step 7: Copy built frontend to package static directory**

```bash
cd claude-code-visualizer
mkdir -p src/visualizer/static
cp -r frontend/dist/* src/visualizer/static/
```

**Step 8: Build the package**

```bash
pip install build twine
python -m build
```

Expected: Creates `dist/claude-code-visualizer-0.1.0.tar.gz` and `.whl` files

**Step 9: Test the built package**

```bash
# Create test virtual environment
python -m venv test-venv
source test-venv/bin/activate  # or `test-venv\Scripts\activate` on Windows

# Install from built package
pip install dist/claude-code-visualizer-0.1.0-py3-none-any.whl

# Test CLI
claude-visualizer --help

# Test running (if you have ~/.claude/projects)
claude-visualizer --no-browser
```

**Step 10: Create deployment script**

Create `claude-code-visualizer/scripts/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "Building frontend..."
cd frontend
npm run build
cd ..

echo "Copying frontend to package..."
mkdir -p src/visualizer/static
cp -r frontend/dist/* src/visualizer/static/

echo "Building Python package..."
python -m build

echo "Checking package with twine..."
twine check dist/*

echo "Build complete! Package ready in dist/"
echo ""
echo "To publish to PyPI:"
echo "  twine upload dist/*"
```

Make executable:

```bash
chmod +x scripts/deploy.sh
```

**Step 11: Document release process**

Create `claude-code-visualizer/RELEASING.md`:

```markdown
# Release Process

## Prerequisites

- Bump version in `pyproject.toml`
- Update `CHANGELOG.md` with release notes
- Ensure all tests pass

## Build and Test

```bash
./scripts/deploy.sh
pip install dist/claude-code-visualizer-*.whl
claude-visualizer --help
```

## Publish to PyPI

```bash
twine upload dist/*
```

## Create GitHub Release

1. Tag the release: `git tag v0.1.0`
2. Push tag: `git push origin v0.1.0`
3. Create release on GitHub with changelog
4. Upload wheel and tarball as release assets
```

**Step 12: Verify package contents**

```bash
tar -tzf dist/claude-code-visualizer-0.1.0.tar.gz | head -20
```

Expected: Should include `src/visualizer/static/*` files

**Step 13: Run final integration test**

Install and test the package in a clean environment:

```bash
# Clean venv
deactivate
rm -rf test-venv
python -m venv test-venv
source test-venv/bin/activate

# Install
pip install dist/claude-code-visualizer-0.1.0-py3-none-any.whl

# Test
claude-visualizer --version
claude-visualizer --help
```

**Step 14: Commit**

```bash
git add pyproject.toml MANIFEST.in README.md LICENSE src/visualizer/server.py scripts/ RELEASING.md
git commit -m "feat: configure packaging for PyPI distribution"
```

**Step 15: Create release tag**

```bash
git tag -a v0.1.0 -m "Release version 0.1.0"
git push origin v0.1.0
```

## Package Distribution

The package is now ready for distribution via PyPI. Users can install with:

```bash
pip install claude-code-visualizer
```

And run with:

```bash
claude-visualizer
```
