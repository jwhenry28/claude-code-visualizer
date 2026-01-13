# Claude Code Visualizer Design

**Date**: 2025-12-07
**Status**: Approved

## Overview

**claude-code-visualizer** is a Python-based local web application for debugging Claude Code sessions. The tool provides an aesthetically clean interface to explore session histories, navigate subagent trees, and search through conversation timelines.

The primary purpose is to debug Claude Code sessions to improve skills, commands, subagents, and other artifacts. Users can quickly identify patterns, errors, and performance issues across their Claude Code project history.

## Architecture

**Three-Tier Design** separating concerns:

1. **Python CLI Tool**: Entry point that discovers projects in `~/.claude/projects`, launches the web server, and optionally opens the browser. Supports flags like `--port`, `--no-browser`, and `--projects-dir` for configurability.

2. **Python Web Server**: Lightweight Flask/FastAPI server that:
   - Serves the static React frontend
   - Provides metadata endpoints (project list, session list with timestamps and previews)
   - Serves raw JSONL files on-demand for session viewing
   - Handles JSONL parsing for metadata only (session list), not full message content

3. **React Frontend**: Single-page application that:
   - Renders the project/session browser
   - Parses JSONL files line-by-line for timeline rendering
   - Handles UI state (expanded/collapsed sections, search, subagent panel)
   - Manages search highlighting and navigation

**Technology Stack**:
- Backend: Python 3.10+, Flask or FastAPI, minimal dependencies
- Frontend: React 18+, modern CSS (or Tailwind), no heavy UI frameworks
- Build: Vite for fast development and optimized production builds
- Deployment: Single-command launch, self-contained, no external databases

**Benefits of This Architecture**:
- Backend stays lightweight (no heavy parsing on server)
- Frontend handles rendering complexity with React's component model
- Clear separation allows independent backend/frontend development
- Easy to deploy as single Python package with embedded frontend

## Data Models & API Endpoints

**Backend Data Models**:

The Python server works with these core concepts:

- **Project**: A directory in `~/.claude/projects` containing JSONL session files
  - `name`: Directory name (e.g., "claude-skills-testing")
  - `path`: Absolute path to project directory

- **SessionMetadata**: Lightweight session info for the session list (parsed from first JSONL line only)
  - `sessionId`: UUID from filename (e.g., "c7d1fb1a-0885-4d8b-8427-0f09a0c1a94f")
  - `timestamp`: File modification time (from filesystem, not JSONL content)
  - `preview`: First user message text (parsed from first user message line, truncated to ~100 chars)
  - `messageCount`: Total number of JSONL lines in the file
  - `filePath`: Relative path to JSONL file

- **SubagentMetadata**: Links subagent files to their parent sessions
  - `agentId`: Short ID (e.g., "2f346c7f")
  - `parentSessionId`: UUID of parent session
  - `filePath`: Path to agent JSONL file (e.g., "agent-2f346c7f.jsonl")

**API Endpoints**:

```
GET /api/projects
→ Returns: [{name: "project1", path: "..."}, ...]

GET /api/sessions/:projectName
→ Returns: [SessionMetadata, ...] sorted by timestamp descending

GET /api/session/:projectName/:sessionId
→ Returns: Raw JSONL file contents (as text/plain)

GET /api/subagent/:projectName/:agentId
→ Returns: Raw JSONL file contents for the subagent session
```

The frontend receives raw JSONL and parses it client-side for rendering. Backend only parses enough to build session metadata for the list view. This keeps the backend simple and moves rendering complexity to the frontend where React excels.

## Frontend UI Structure

**Layout**: Three-column responsive layout with contextual visibility:

```
┌──────────────┬────────────────────────────┬──────────────────────┐
│   Projects   │    Session Timeline        │   Subagent Panel     │
│   (fixed)    │    (main content)          │   (conditional)      │
│              │                            │                      │
│  Project 1   │  [Search Bar]              │  [Only appears when  │
│  Project 2   │                            │   Task tool clicked] │
│▶ Project 3   │  ┌─ User Message ─────┐   │                      │
│  Project 4   │  │ text content...     │   │  ┌─ User Message ─┐ │
│              │  └─────────────────────┘   │  │ subagent text  │ │
│  Sessions:   │                            │  └────────────────┘ │
│  ─────────   │  ┌─ Assistant Message ┐   │                      │
│  Dec 7 9:05  │  │ thinking text...    │   │  ┌─ Assistant ───┐ │
│▶ "Please..." │  │ ▶ Read              │   │  │ text...        │ │
│              │  │ ▶ Task              │   │  │ ▶ Grep         │ │
│  Dec 7 8:32  │  └─────────────────────┘   │  └────────────────┘ │
│  "Add auth"  │                            │                      │
└──────────────┴────────────────────────────┴──────────────────────┘
```

**Column Behaviors**:

1. **Projects Panel (Left, ~250px fixed)**:
   - Lists all projects from `~/.claude/projects`
   - Click a project to expand its session list below
   - Only one project expanded at a time
   - Session list shows: timestamp + first user message preview (~50 chars)
   - Sessions sorted newest first (by file mtime)
   - Active session highlighted

2. **Session Timeline (Center, flexible width)**:
   - Only visible when a session is selected
   - Fixed search bar at top (input + prev/next arrows + regex checkbox)
   - Scrollable timeline of messages below
   - Each message is a collapsible section with colored left border
   - User messages (blue border), Assistant messages (red border)

3. **Subagent Panel (Right, ~40% width)**:
   - Only appears when user clicks a Task tool use that has an agentId
   - Disappears when clicking another session or clicking same Task tool again (toggle)
   - Shows same timeline structure as main session
   - Has its own search bar (searches only subagent content)

**Component Reuse**: Session Timeline and Subagent Panel use the same `SessionViewer` React component, just instantiated with different session data. This ensures consistency and reduces code duplication.

## Message Timeline Rendering

**Message Structure**: Each JSONL line becomes a timeline entry. The frontend parses the `message` field to determine rendering.

**Top-Level Containers** (collapsible sections):

1. **User Message Container** (blue left border, open by default):
   - Header shows: "User Message" label + timestamp
   - Consolidated text content from `message.content` (all text blocks concatenated)
   - Nested Tool Result subcontainers (collapsed by default)

2. **Assistant Message Container** (red left border, open by default):
   - Header shows: "Assistant Message" label + timestamp + model name
   - Consolidated thinking/text content (all text blocks concatenated)
   - Nested Tool Use subcontainers (collapsed by default)

**Nested Subcontainers** (within message containers):

3. **Tool Use Subcontainer** (green left border, collapsed by default):
   - Header shows: Tool name only when collapsed (e.g., "Read", "Task", "Bash")
   - When expanded: shows tool name + full input parameters as formatted JSON
   - If tool is Task with agentId: clickable indicator (link icon) to open subagent panel

4. **Tool Result Subcontainer** (yellow left border, collapsed by default):
   - Header shows: Tool name + result status when collapsed
   - When expanded: shows full result content, including subagent summary if `toolUseResult` present

**Collapsed State**: Shows only the colored border bar (4px width) + text label. Clicking anywhere expands.

**Expanded State**: Border remains, label becomes section header, content visible below with padding.

**Hybrid Message Handling**: Messages can have mixed content arrays (text + tools). The renderer:

1. Extracts and consolidates all `{"type": "text"}` blocks, concatenates text, renders as single block at top
2. Renders each `{"type": "tool_use"}` or `{"type": "tool_result"}` as separate nested subcontainer below the text

Example hybrid message rendering:

```
┌─ Assistant Message ────────────────────────────────────────┐
│ I'll help you develop a comprehensive design doc for the   │
│ claude-code-visualizer project. Let me invoke the          │
│ brainstorming skill to explore and refine this design      │
│ collaboratively.                                            │
│                                                             │
│ ▶ Skill                                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Text always appears first, then tool subcontainers in the order they appear in the content array.

## Search & Navigation

**Search Interface**: Fixed search bar at the top of each SessionViewer component:

```
┌──────────────────────────────────────────────────────────────────┐
│ [Search: _____________] [< Prev] [Next >] [2/15] [☐ Regex]      │
└──────────────────────────────────────────────────────────────────┘
```

**Search Behavior**:

1. **Input**: Text field + Regex checkbox
   - Unchecked (default): case-insensitive substring match
   - Checked: interprets input as regex pattern (show error message if invalid regex)
   - Searches through all message text content (user messages, assistant messages, tool inputs, tool results)

2. **Match Highlighting**:
   - All matches highlighted in yellow background
   - Current match highlighted in orange background with darker border
   - Match counter shows current position and total (e.g., "2/15")

3. **Navigation**:
   - Prev/Next arrows cycle through matches
   - Auto-scrolls current match into view
   - Auto-expands collapsed sections containing the current match
   - Previously auto-expanded sections stay open when navigating away (don't auto-collapse)

4. **Search Scope**:
   - Each SessionViewer has independent search (main session vs subagent panel)
   - Real-time highlighting as user types (debounced ~300ms)
   - Search only runs on currently loaded session

**Implementation**: Custom React state tracking match positions, managing scroll behavior, and handling expand/collapse state for sections containing matches.

## Subagent Integration & Linking

**Subagent Detection**: When parsing assistant messages, identify Task tool uses that spawned subagents:

1. **In Main Session Timeline**: Look for tool_use with `name: "Task"`
2. **Find Corresponding Tool Result**: Match via `tool_use_id` in subsequent messages
3. **Check for agentId**: If tool result contains `toolUseResult.agentId`, mark as subagent-spawning tool

**Visual Indicator**: Task tool uses with subagents get special treatment:

```
┌─ Assistant Message ──────────────────────────────────┐
│ Let me invoke the brainstorming skill...             │
│                                                       │
│ ▶ Task 🔗                                            │
│   ↳ Agent: 2f346c7f                                  │
└───────────────────────────────────────────────────────┘
```

When collapsed: Shows "Task 🔗" with link icon
When expanded: Shows full Task parameters + agentId indicator + clickable area

**Click Behavior**:

1. User clicks anywhere on the Task tool subcontainer (collapsed or expanded)
2. Frontend calls `/api/subagent/:projectName/:agentId` to fetch JSONL
3. Subagent panel slides in from right (40% width, pushes main session to 60%)
4. Subagent timeline renders using same SessionViewer component
5. Clicking the same Task tool again toggles panel closed
6. Clicking a different Task tool replaces subagent panel content

**Subagent Panel Header**: Shows context breadcrumb:

```
┌─ Subagent: 2f346c7f ─────────────────────── [✕] ─┐
│ Parent: Extract NAMES command docs                │
│ [Search bar...]                                    │
└────────────────────────────────────────────────────┘
```

**Subagent Nesting**: Claude Code does not allow subagents to spawn other subagents. The primary agent may spawn subagents, but subagents may not spawn further subagents. This means the UI will have a maximum of 2 columns (main session + one subagent panel).

## JSONL Parsing & Message Processing

**Frontend Parsing Strategy**: When a session is loaded, parse JSONL line-by-line:

```javascript
// Pseudocode flow
const lines = jsonlText.split('\n').filter(line => line.trim())
const messages = lines.map(line => JSON.parse(line))

// Build timeline by processing each message
const timeline = messages.map(msg => ({
  uuid: msg.uuid,
  parentUuid: msg.parentUuid,
  timestamp: msg.timestamp,
  type: msg.message.role, // 'user' or 'assistant'
  model: msg.message.model, // for assistant messages
  content: parseContent(msg.message.content),
  metadata: extractMetadata(msg)
}))
```

**Content Parsing**: Handle different content formats:

1. **String content**: `message.content: "text here"` → render as single text block
2. **Array content**: `message.content: [{type: "text"}, {type: "tool_use"}]` → extract text blocks, render tool blocks as subcontainers
3. **Tool Use**: `{type: "tool_use", name: "...", input: {...}}` → render as collapsible subcontainer
4. **Tool Result**: `{type: "tool_result", tool_use_id: "...", content: [...]}` → render as collapsible subcontainer, link to corresponding tool_use via ID

**Linking Tool Uses to Results**: Build a map during parsing:

- Key: `tool_use_id` from tool result
- Value: Reference to tool use message
- Used to show result status inline with tool use, and to find agentId for Task tools

**Metadata Extraction**: Capture useful debugging info:
- Token usage (`msg.message.usage`)
- Request ID (`msg.requestId`)
- Duration (`msg.toolUseResult.totalDurationMs` for tool results)
- Display in expanded tool sections for debugging context

This parsing happens entirely in the frontend, keeping the backend simple and allowing rich client-side rendering with React.

## Visual Design & Styling

**Color Scheme**: Clean, readable color palette with distinct message types:

**Message Borders & Labels**:
- User Messages: Blue left border (`#3b82f6`, 4px) + "User Message" label
- Assistant Messages: Red left border (`#ef4444`, 4px) + "Assistant Message" label
- Tool Use subcontainers: Green left border (`#22c55e`, 3px) + tool name label
- Tool Result subcontainers: Yellow/amber left border (`#f59e0b`, 3px) + tool name label

**Backgrounds**:
- Main background: Light gray (`#f9fafb`)
- Message containers (expanded): White (`#ffffff`) with subtle shadow
- Message containers (collapsed): Light background (`#f3f4f6`)
- Code/JSON blocks: Dark gray (`#1f2937`) with syntax highlighting

**Interactive States**:
- Hover: Slight background color change on collapsible headers
- Clickable Task tools with subagents: Add link icon + hover cursor pointer
- Search matches: Yellow highlight (`#fef08a`)
- Current search match: Orange highlight (`#fb923c`) with darker border

**Typography**:
- Headers/Labels: Sans-serif, medium weight (e.g., Inter, system-ui)
- Message content: Sans-serif, regular weight
- Code/JSON: Monospace (e.g., 'Fira Code', 'Courier New')
- Timestamps: Smaller, muted color (`#6b7280`)

**Spacing**:
- Message containers: 12px vertical gap between each
- Content padding: 16px inside expanded messages
- Tool subcontainers: 8px vertical gap, indented 12px from parent

**Collapse/Expand Behavior**:
- When collapsed: Only colored border bar (4px) + label visible, minimal height
- When expanded: Border remains, label becomes header, full content shown with padding
- Smooth transitions between states (200ms CSS transition)

## Error Handling & Edge Cases

**Backend Error Scenarios**:

1. **Missing ~/.claude/projects directory**:
   - CLI shows friendly error: "Claude projects directory not found at ~/.claude/projects"
   - Suggest checking if Claude Code has been run, or use `--projects-dir` flag

2. **Empty projects directory**:
   - Show empty state in UI: "No Claude Code projects found"
   - Display helpful message about running Claude Code first

3. **Malformed JSONL files**:
   - Skip unparseable lines with console warning
   - Show partial session with error indicator
   - Don't crash entire app on one bad file

4. **Missing subagent file**:
   - Task tool shows agentId but file doesn't exist
   - Display error message in subagent panel: "Subagent file not found (agent-{agentId}.jsonl)"

**Frontend Error Scenarios**:

1. **Failed API requests**:
   - Show toast notification with error message
   - Allow retry button for transient failures

2. **Invalid regex in search**:
   - Show inline error message below search bar
   - Don't crash, just disable search until regex is valid

3. **Missing tool result for tool use**:
   - Tool use shows but no corresponding result (session ended mid-execution)
   - Display status indicator: "No result (session incomplete)"

4. **Orphaned messages** (parentUuid doesn't match any existing uuid):
   - Display in timeline order by timestamp anyway
   - Show warning icon indicating broken chain

**Performance Considerations**:

1. **Large session files** (thousands of messages):
   - Implement virtual scrolling for timeline (only render visible messages)
   - Lazy-load message content when scrolling into view
   - Search may be slow - show loading spinner during search

2. **Many projects/sessions**:
   - Paginate or virtual scroll session lists if needed
   - Cache parsed metadata to avoid re-parsing on every load

## Configuration & CLI Options

**CLI Command**: `claude-visualizer [OPTIONS]`

**Supported Options**:

```
--port PORT              Port number for web server (default: 3000)
--no-browser            Don't automatically open browser on launch
--projects-dir PATH     Custom path to Claude projects directory
                        (default: ~/.claude/projects)
--host HOST             Host to bind server to (default: localhost)
--help                  Show help message and exit
--version               Show version and exit
```

**Launch Behavior**:

1. Parse command-line arguments
2. Validate projects directory exists and is readable
3. Scan for projects (subdirectories in projects-dir)
4. Parse session metadata (file list, mtimes, first user message previews)
5. Start web server on specified port
6. If `--no-browser` not set: open `http://localhost:{port}` in default browser
7. Display server info in terminal:
   ```
   Claude Code Visualizer v0.1.0

   Watching: /home/user/.claude/projects
   Projects found: 5

   Server running at: http://localhost:3000
   Press Ctrl+C to stop
   ```

**Server Shutdown**:
- Graceful shutdown on Ctrl+C
- Close all connections, clean up resources
- Display "Server stopped" message

**Environment Variables** (optional future enhancement):
- `CLAUDE_PROJECTS_DIR`: Default projects directory
- `VISUALIZER_PORT`: Default port

## Testing Strategy

**Backend Testing**:

1. **Unit Tests** (pytest):
   - JSONL parsing: Test parsing valid/malformed JSONL files
   - Session metadata extraction: Test file scanning, mtime retrieval, preview generation
   - Subagent linking: Test agentId extraction and file path resolution
   - API endpoints: Test each endpoint returns correct data structure
   - Error handling: Test missing files, invalid paths, permission errors

2. **Integration Tests**:
   - End-to-end API flow: Load projects → load sessions → load JSONL content
   - Test with fixture JSONL files (sample sessions with known structure)
   - Verify correct handling of edge cases (empty projects, missing subagents)

**Frontend Testing**:

1. **Unit Tests** (Jest + React Testing Library):
   - SessionViewer component: Test rendering messages, expand/collapse behavior
   - JSONL parser: Test parsing various message formats (text, tools, hybrid)
   - Search functionality: Test text search, regex search, match navigation
   - Tool linking: Test tool_use to tool_result matching

2. **Component Tests**:
   - Project list rendering and selection
   - Session list with previews
   - Message timeline with nested tool containers
   - Subagent panel opening/closing
   - Search highlighting and auto-expansion

3. **E2E Tests** (Playwright or Cypress):
   - Full user flow: Launch app → select project → select session → expand message → search → open subagent
   - Test navigation between sessions
   - Test search across multiple messages

**Manual Testing**:

- Test with real Claude Code sessions from various projects
- Verify performance with large session files (1000+ messages)
- Test browser compatibility (Chrome, Firefox, Safari)
- Visual regression testing for UI consistency

**Test Fixtures**:

Create sample JSONL files representing:
- Simple session (user message + assistant response)
- Session with tool uses (Read, Bash, Edit)
- Session with subagent Task tool
- Hybrid messages (text + tools)
- Error cases (malformed JSON, missing fields)

## Project Structure & File Organization

**Directory Layout**:

```
claude-code-visualizer/
├── pyproject.toml                 # Python package config
├── README.md                      # Installation and usage docs
├── setup.py                       # Package installation
├── requirements.txt               # Python dependencies
│
├── src/
│   └── visualizer/
│       ├── __init__.py
│       ├── __main__.py           # CLI entry point
│       ├── cli.py                # Argument parsing, server launch
│       ├── server.py             # Flask/FastAPI server, API routes
│       ├── scanner.py            # Project/session scanning logic
│       └── parser.py             # JSONL metadata parsing
│
├── frontend/
│   ├── package.json              # Node dependencies
│   ├── vite.config.js            # Vite build config
│   ├── index.html
│   │
│   ├── src/
│   │   ├── App.jsx               # Root component
│   │   ├── main.jsx              # Entry point
│   │   │
│   │   ├── components/
│   │   │   ├── ProjectList.jsx
│   │   │   ├── SessionList.jsx
│   │   │   ├── SessionViewer.jsx      # Main timeline viewer
│   │   │   ├── MessageContainer.jsx   # User/Assistant messages
│   │   │   ├── ToolContainer.jsx      # Tool use/result subcontainers
│   │   │   ├── SearchBar.jsx
│   │   │   └── SubagentPanel.jsx
│   │   │
│   │   ├── utils/
│   │   │   ├── jsonlParser.js         # Parse JSONL to message objects
│   │   │   ├── searchUtils.js         # Search/highlight logic
│   │   │   └── linkingUtils.js        # Tool use → result linking
│   │   │
│   │   └── styles/
│   │       └── main.css               # Global styles
│   │
│   └── dist/                     # Built frontend (gitignored)
│
├── tests/
│   ├── backend/
│   │   ├── test_parser.py
│   │   ├── test_scanner.py
│   │   ├── test_api.py
│   │   └── fixtures/             # Sample JSONL files
│   │
│   └── frontend/
│       ├── components/
│       └── utils/
│
└── docs/
    ├── plans/
    │   └── 2025-12-07-claude-code-visualizer-design.md
    └── claude-code-project-notes.md
```

**Key Files**:

- `src/visualizer/__main__.py`: Enables `python -m visualizer` execution
- `src/visualizer/cli.py`: Uses argparse for CLI, calls server.start()
- `src/visualizer/server.py`: Flask/FastAPI app with static file serving + API routes
- `frontend/src/App.jsx`: Main layout with three-column structure
- `frontend/src/components/SessionViewer.jsx`: Reusable timeline component for main + subagent

**Build Process**:

1. Development:
   - `npm run dev` in frontend/ for hot reload
   - `python -m visualizer` for backend (configure to proxy API requests to backend)

2. Production:
   - `npm run build` creates optimized bundle in frontend/dist/
   - Python package includes built frontend in distribution

## Deployment & Packaging

**Python Package Distribution**:

1. **Package Name**: `claude-code-visualizer` on PyPI
2. **Installation**: `pip install claude-code-visualizer`
3. **Entry Point**: Creates `claude-visualizer` command in PATH
4. **Dependencies**:
   - Flask or FastAPI (lightweight server)
   - Click or argparse (CLI)
   - Minimal requirements - no heavy dependencies

**Packaging Strategy**:

1. **Include Built Frontend**:
   - Run `npm run build` before packaging
   - Include `frontend/dist/` in Python package via `MANIFEST.in`
   - Server serves static files from package resources

2. **Package Structure**:
   ```python
   # setup.py or pyproject.toml
   entry_points={
       'console_scripts': [
           'claude-visualizer=visualizer.cli:main',
       ],
   }
   package_data={
       'visualizer': ['frontend/dist/**/*'],
   }
   ```

3. **Version Management**:
   - Single source of truth for version number
   - Display in CLI `--version` and frontend footer

**Distribution Workflow**:

1. Developer runs `npm run build` in frontend/
2. Built files copied to `src/visualizer/static/`
3. Python package built with `python -m build`
4. Published to PyPI with `twine upload`

**User Installation Flow**:

```bash
# Install
pip install claude-code-visualizer

# Run
claude-visualizer

# Or with options
claude-visualizer --port 8080 --no-browser
```

**Future Distribution Options**:
- Docker image for isolated environment
- Standalone executable (PyInstaller) for non-Python users
- Homebrew formula for macOS users

## Future Enhancements & Scope

**Initial Release (v0.1.0)**: Core functionality described in this design

**Out of Scope for Initial Release**:

1. **Session Comparison**: Side-by-side comparison of two sessions
2. **Analytics Dashboard**: Token usage graphs, tool usage statistics, session duration trends
3. **Export Functionality**: Export sessions to PDF, markdown, or shareable HTML
4. **Filtering**: Filter messages by type, tool name, date range, or model
5. **Annotations**: User-added comments/notes on specific messages
6. **Live Session Monitoring**: Watch active Claude Code sessions in real-time
7. **Session Editing**: Modify/replay sessions with different parameters
8. **Multi-user Support**: Authentication, sharing sessions across team

**Potential Future Features**:

1. **Performance Metrics**:
   - Token usage breakdown by message
   - Cost estimation based on usage
   - Tool execution time visualization
   - Cache hit/miss analysis from usage metadata

2. **Advanced Search**:
   - Search across all sessions in a project
   - Filter by tool type, model, date range
   - Save search queries as bookmarks

3. **Timeline Visualization**:
   - Graphical timeline showing message flow
   - Visual tree of subagent spawns
   - Gantt chart for tool execution timing

4. **Better Subagent Handling**:
   - Multiple subagent panels open simultaneously
   - Subagent spawn tree visualization
   - Jump to parent from subagent

5. **Content Enhancements**:
   - Syntax highlighting for code in messages
   - Rendered markdown preview
   - Image display for tool results containing images
   - Diff view for Edit tool operations

**Simplifications in Initial Release**:

- No authentication/multi-user (local-only tool)
- No persistence (stateless - reload loses UI state)
- No session editing capabilities
- Single session view only (no tabs or comparison)
- Basic text search only (no fuzzy matching, no search across projects)

## Implementation Notes

**Key Design Decisions**:

1. **Hybrid parsing approach**: Backend parses metadata for session lists, frontend parses full JSONL for rendering. This balances performance (fast initial load) with flexibility (rich client-side rendering).

2. **Component reuse**: SessionViewer component powers both main timeline and subagent panel, reducing code and ensuring consistency.

3. **Filesystem-based timestamps**: Using file mtime instead of parsing JSONL timestamps avoids scanning all files on startup, making project loading fast.

4. **Default collapse states**: User/Assistant messages open by default, tools/system collapsed. Keeps conversation flow visible while hiding technical details until needed.

5. **No subagent nesting**: Claude Code architecture limits subagents to single level, simplifying UI to max 2 columns.

6. **Local-only tool**: No authentication, server, or cloud features. Simple pip install and run locally.

**Success Criteria**:

- Users can quickly find problematic sessions
- Search allows rapid navigation to specific issues
- Subagent debugging is intuitive
- Tool performs well with large sessions (1000+ messages)
- Installation and usage requires minimal setup
