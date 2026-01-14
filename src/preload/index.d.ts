export interface Project {
  name: string
  path: string
}

export interface Session {
  name: string
  path: string
  mtime: number
}

declare global {
  interface Window {
    api: {
      listProjects: () => Promise<Project[]>
      listSessions: (projectPath: string) => Promise<Session[]>
      readSession: (sessionPath: string) => Promise<unknown[]>
      checkSubagentExists: (sessionPath: string, agentId: string) => Promise<boolean>
      readSubagentSession: (sessionPath: string, agentId: string) => Promise<unknown[]>
    }
  }
}
