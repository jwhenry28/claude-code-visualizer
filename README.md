# Claude Session Viewer

A desktop application for visualizing and debugging Claude Code session recordings. Browse your Claude Code interaction history, inspect tool calls, and drill into nested subagent sessions.

## Features

- **Session Browser** - Navigate projects and sessions from `~/.claude/projects`
- **Message Visualization** - View user, assistant, and system messages with syntax-aware formatting
- **Tool Call Inspection** - Expandable views for Bash, Read, Write, Edit, Glob, Grep operations
- **Subagent Drilling** - Click into Task calls to view nested agent sessions in a slide-out panel
- **Extended Thinking** - Collapsible blocks showing Claude's reasoning process
- **Task Results** - Status badges, duration, token counts, and tool use statistics

## Installation

```bash
npm install
```

## Usage

```bash
# Development with hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Building Distributables

```bash
# Build for all platforms
npm run build:dist

# Platform-specific builds
npm run build:mac    # macOS (.dmg, .zip)
npm run build:win    # Windows (.exe installer, portable)
npm run build:linux  # Linux (.AppImage)
```

Built packages are output to `dist/`.

## Requirements

- Node.js
- Claude Code sessions in `~/.claude/projects` (created automatically when using Claude Code)

## Tech Stack

- Electron
- React
- TypeScript
- Vite (via electron-vite)
