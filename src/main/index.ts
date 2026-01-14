import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join, dirname, basename } from 'path'
import { readdir, readFile, stat } from 'fs/promises'
import { homedir } from 'os'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    // Open DevTools in dev mode
    if (process.env['ELECTRON_RENDERER_URL']) {
      mainWindow.webContents.openDevTools()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the renderer
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Get Claude projects directory
function getClaudeProjectsDir(): string {
  return join(homedir(), '.claude', 'projects')
}

// List all project directories
async function listProjects(): Promise<{ name: string; path: string }[]> {
  const projectsDir = getClaudeProjectsDir()
  try {
    const entries = await readdir(projectsDir)
    const projects: { name: string; path: string }[] = []

    for (const entry of entries) {
      const fullPath = join(projectsDir, entry)
      const stats = await stat(fullPath)
      if (stats.isDirectory()) {
        projects.push({ name: entry, path: fullPath })
      }
    }

    return projects.sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error('Error listing projects:', error)
    return []
  }
}

// List session files in a project
async function listSessions(projectPath: string): Promise<{ name: string; path: string; mtime: number }[]> {
  try {
    const entries = await readdir(projectPath)
    const sessions: { name: string; path: string; mtime: number }[] = []

    for (const entry of entries) {
      if (entry.endsWith('.jsonl')) {
        const fullPath = join(projectPath, entry)
        const stats = await stat(fullPath)
        sessions.push({
          name: entry.replace('.jsonl', ''),
          path: fullPath,
          mtime: stats.mtimeMs
        })
      }
    }

    // Sort by modification time, newest first
    return sessions.sort((a, b) => b.mtime - a.mtime)
  } catch (error) {
    console.error('Error listing sessions:', error)
    return []
  }
}

// Read and parse a session file
async function readSession(sessionPath: string): Promise<unknown[]> {
  try {
    const content = await readFile(sessionPath, 'utf-8')
    const lines = content.trim().split('\n')
    return lines.map(line => JSON.parse(line))
  } catch (error) {
    console.error('Error reading session:', error)
    return []
  }
}

// Set up IPC handlers
ipcMain.handle('list-projects', async () => {
  return listProjects()
})

ipcMain.handle('list-sessions', async (_, projectPath: string) => {
  return listSessions(projectPath)
})

ipcMain.handle('read-session', async (_, sessionPath: string) => {
  return readSession(sessionPath)
})

ipcMain.handle('check-subagent-exists', async (_, sessionPath: string, agentId: string) => {
  const dir = dirname(sessionPath)
  const sessionId = basename(sessionPath, '.jsonl')
  const subagentPath = join(dir, sessionId, 'subagents', `agent-${agentId}.jsonl`)
  try {
    await stat(subagentPath)
    return true
  } catch {
    return false
  }
})

ipcMain.handle('read-subagent-session', async (_, sessionPath: string, agentId: string) => {
  const dir = dirname(sessionPath)
  const sessionId = basename(sessionPath, '.jsonl')
  const subagentPath = join(dir, sessionId, 'subagents', `agent-${agentId}.jsonl`)
  return readSession(subagentPath)
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
