const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Enable WebGL & Hardware Acceleration for Three.js 60 FPS performance
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

let mainWindow;

function createDesktopGameWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 860,
    minWidth: 1280,
    minHeight: 720,
    title: "Core Stone 3D FPS - Standalone PC Desktop Game",
    backgroundColor: '#020617',
    autoHideMenuBar: true, // Native game look without top browser menu bar
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false, // Allows loading local audio, 3D models, and textures directly from disk
      backgroundThrottling: false
    }
  });

  mainWindow.maximize(); // Start maximized for immersive widescreen experience
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createDesktopGameWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createDesktopGameWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Native Desktop IPC Handlers for Local Game Saves & Expansion Loader
ipcMain.handle('save-game-data', async (event, data) => {
  const savePath = path.join(app.getPath('userData'), 'core_stone_save.json');
  fs.writeFileSync(savePath, JSON.stringify(data, null, 2));
  return { status: 'saved', path: savePath };
});

ipcMain.handle('load-game-data', async () => {
  const savePath = path.join(app.getPath('userData'), 'core_stone_save.json');
  if (fs.existsSync(savePath)) {
    return JSON.parse(fs.readFileSync(savePath, 'utf8'));
  }
  return null;
});
