"use strict";
const electron = require("electron");
const path = require("path");
const promises = require("fs/promises");
const os = require("os");
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
    if (process.env["ELECTRON_RENDERER_URL"]) {
      mainWindow.webContents.openDevTools();
    }
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
function getClaudeProjectsDir() {
  return path.join(os.homedir(), ".claude", "projects");
}
async function listProjects() {
  const projectsDir = getClaudeProjectsDir();
  try {
    const entries = await promises.readdir(projectsDir);
    const projects = [];
    for (const entry of entries) {
      const fullPath = path.join(projectsDir, entry);
      const stats = await promises.stat(fullPath);
      if (stats.isDirectory()) {
        projects.push({ name: entry, path: fullPath });
      }
    }
    return projects.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error listing projects:", error);
    return [];
  }
}
async function listSessions(projectPath) {
  try {
    const entries = await promises.readdir(projectPath);
    const sessions = [];
    for (const entry of entries) {
      if (entry.endsWith(".jsonl")) {
        const fullPath = path.join(projectPath, entry);
        const stats = await promises.stat(fullPath);
        sessions.push({
          name: entry.replace(".jsonl", ""),
          path: fullPath,
          mtime: stats.mtimeMs
        });
      }
    }
    return sessions.sort((a, b) => b.mtime - a.mtime);
  } catch (error) {
    console.error("Error listing sessions:", error);
    return [];
  }
}
async function readSession(sessionPath) {
  try {
    const content = await promises.readFile(sessionPath, "utf-8");
    const lines = content.trim().split("\n");
    return lines.map((line) => JSON.parse(line));
  } catch (error) {
    console.error("Error reading session:", error);
    return [];
  }
}
electron.ipcMain.handle("list-projects", async () => {
  return listProjects();
});
electron.ipcMain.handle("list-sessions", async (_, projectPath) => {
  return listSessions(projectPath);
});
electron.ipcMain.handle("read-session", async (_, sessionPath) => {
  return readSession(sessionPath);
});
electron.app.whenReady().then(() => {
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
