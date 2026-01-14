"use strict";
const electron = require("electron");
const api = {
  listProjects: () => electron.ipcRenderer.invoke("list-projects"),
  listSessions: (projectPath) => electron.ipcRenderer.invoke("list-sessions", projectPath),
  readSession: (sessionPath) => electron.ipcRenderer.invoke("read-session", sessionPath)
};
electron.contextBridge.exposeInMainWorld("api", api);
