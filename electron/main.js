const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 900,
    backgroundColor: '#0a0a0f',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadURL('http://localhost:5173')
}

app.whenReady().then(createWindow)

ipcMain.handle('open-osu', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'OSU Beatmap', extensions: ['osu'] }],
    properties: ['openFile']
  })
  if (!filePaths[0]) return null
  return {
    path: filePaths[0],
    content: fs.readFileSync(filePaths[0], 'utf-8')
  }
})

ipcMain.handle('open-audio', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'Audio', extensions: ['mp3', 'ogg', 'wav'] }],
    properties: ['openFile']
  })
  if (!filePaths[0]) return null
  return {
    path: filePaths[0],
    buffer: fs.readFileSync(filePaths[0]).buffer
  }
})