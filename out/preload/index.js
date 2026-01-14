"use strict";
const electron = require("electron");
const api = {
  listProjects: () => electron.ipcRenderer.invoke("list-projects"),
  listSessions: (projectPath) => electron.ipcRenderer.invoke("list-sessions", projectPath),
  readSession: (sessionPath) => electron.ipcRenderer.invoke("read-session", sessionPath),
  checkSubagentExists: (sessionPath, agentId) => electron.ipcRenderer.invoke("check-subagent-exists", sessionPath, agentId),
  readSubagentSession: (sessionPath, agentId) => electron.ipcRenderer.invoke("read-subagent-session", sessionPath, agentId)
};
electron.contextBridge.exposeInMainWorld("api", api);
