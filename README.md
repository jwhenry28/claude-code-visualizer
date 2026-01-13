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

### Quick Setup (One Command)

```bash
./scripts/install-locally.sh
```

This will:
1. Install backend dependencies with `pip install -e ".[dev]"`
2. Install frontend dependencies with `npm install`
3. Build the frontend for production
4. Copy built frontend to the package
5. Make the CLI available as `claude-visualizer`

After running, you can immediately use:
```bash
claude-visualizer
```

### Manual Setup

If you prefer to install manually:

```bash
# Backend
pip install -e ".[dev]"

# Frontend
cd frontend
npm install

# Build and copy frontend
cd frontend
npm run build
cd ..
mkdir -p src/visualizer/static
cp -r frontend/dist/* src/visualizer/static/
```

### Development Mode (Hot Reload)

For active development with auto-reload:

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
