# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Session Viewer is an Electron desktop application for visualizing and debugging Claude Code session recordings. It reads JSONL session files from `~/.claude/projects` and displays them in a hierarchical, navigable interface with support for drilling into nested subagent sessions.

## Development Commands

```bash
npm run dev        # Start development server with hot reload
npm run build      # Production build (to out/)
npm run preview    # Preview production build
npm run typecheck  # TypeScript type checking (no emit)
```

## Distribution Builds

```bash
npm run build:dist   # Build for all platforms
npm run build:mac    # macOS (.dmg, .zip)
npm run build:win    # Windows (.exe installer, portable)
npm run build:linux  # Linux (.AppImage)
```

Distributables output to `dist/`.

## Architecture

**Electron Three-Process Model:**
- `src/main/index.ts` - Main process: window management, file I/O, reads from `~/.claude/projects`
- `src/preload/index.ts` - IPC bridge: exposes `window.api` with `listProjects`, `listSessions`, `readSession`, `checkSubagentExists`, `readSubagentSession`
- `src/renderer/` - React frontend: visual session explorer

**React Component Hierarchy:**
```
App.tsx (layout, project/session selection)
├── MessageList.tsx (filters messages, excludes file-history-snapshot/summary/meta)
│   └── Message.tsx (renders by role: user/assistant/system)
│       ├── ThinkingBlock.tsx (collapsible extended thinking)
│       ├── ToolCall.tsx (Bash, Read, Write, Edit, Glob, Grep)
│       ├── TaskCall.tsx (subagent invocations, button to drill in)
│       └── TaskResult.tsx (status badge, stats, agent ID link)
└── SubagentPanel.tsx (slide-in modal for nested sessions)
```

**State Management:**
- `SubagentContext.tsx` provides panel state and navigation methods (`openSubagent`, `closeSubagent`)
- Component-level state for UI controls (collapsibles, selections)

**Data Flow:**
- Session files are JSONL format with `SessionMessage` objects
- Each message has `type` (user/assistant/system), optional `message.content` array, and metadata
- Subagent sessions live at `<sessionDir>/<sessionId>/subagents/agent-<id>.jsonl`

## Key Types

See `src/renderer/src/types.ts` for full definitions:
- `SessionMessage` - Top-level message wrapper with type, content, toolUseResult metadata
- `MessageContent` - Union of `TextContent`, `ThinkingContent`, `ToolUseContent`, `ToolResultContent`
- `ToolUseResultMeta` - Task execution stats (status, agentId, duration, tokens, tool count)
