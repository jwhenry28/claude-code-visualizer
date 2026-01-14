import { contextBridge, ipcRenderer } from 'electron'

export interface Project {
  name: string
  path: string
}

export interface Session {
  name: string
  path: string
  mtime: number
}

const api = {
  listProjects: (): Promise<Project[]> => ipcRenderer.invoke('list-projects'),
  listSessions: (projectPath: string): Promise<Session[]> => ipcRenderer.invoke('list-sessions', projectPath),
  readSession: (sessionPath: string): Promise<unknown[]> => ipcRenderer.invoke('read-session', sessionPath),
  checkSubagentExists: (sessionPath: string, agentId: string): Promise<boolean> =>
    ipcRenderer.invoke('check-subagent-exists', sessionPath, agentId),
  readSubagentSession: (sessionPath: string, agentId: string): Promise<unknown[]> =>
    ipcRenderer.invoke('read-subagent-session', sessionPath, agentId)
}

contextBridge.exposeInMainWorld('api', api)
