const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } = require('electron');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const ip = require('ip');
const loudness = require('loudness');

const dataPath = path.join(__dirname, 'data.json');
let mainWindow;
let tray = null;
let serverApp = express();
const PORT = 3000;

// ... (keep existing server code) ...

// Helper for generating unique cool ID with dynamic X shifting
function generateCoolId(existingIds) {
  let id;
  let attempts = 0;
  // Shift X position every 90,000 IDs (pos 0 to 5)
  const posIndex = Math.min(Math.floor((existingIds ? existingIds.size : 0) / 90000), 5);
  
  do {
    const randomNum = Math.floor(10000 + Math.random() * 90000).toString();
    if (posIndex === 0) {
      id = `X${randomNum}`;
    } else if (posIndex === 5) {
      id = `${randomNum}X`;
    } else {
      id = randomNum.slice(0, posIndex) + 'X' + randomNum.slice(posIndex);
    }
    attempts++;
    // Fallback if current position bracket is heavily saturated
    if (attempts > 50) {
      const randPos = Math.floor(Math.random() * 6);
      const randNum2 = Math.floor(10000 + Math.random() * 90000).toString();
      id = randPos === 0 ? `X${randNum2}` : randPos === 5 ? `${randNum2}X` : randNum2.slice(0, randPos) + 'X' + randNum2.slice(randPos);
    }
  } while (existingIds && existingIds.has(id));
  return id;
}

// Read JSON Helper
function getTasks() {
  if (!fs.existsSync(dataPath)) return { tasks: [] };
  let data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  // Ensure data.tasks exists
  if (!data.tasks) data.tasks = [];

  // Auto-migrate old IDs to uniform cool format (6 chars, exactly one X)
  let changed = false;
  const existingIds = new Set(data.tasks.map(t => t.id));
  data.tasks.forEach(task => {
    if (!task.id || !/^\d*X\d*$/.test(task.id) || task.id.length !== 6) {
      if (task.id) existingIds.delete(task.id);
      const newId = generateCoolId(existingIds);
      existingIds.add(newId);
      task.id = newId;
      changed = true;
    }
  });
  if (changed) saveTasks(data);
  return data;
}

function saveTasks(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// Express Server Setup
serverApp.use(cors());
serverApp.use(express.json());
serverApp.use(express.static(path.join(__dirname))); // Serve frontend files

serverApp.get('/api/tasks', (req, res) => {
  res.json(getTasks());
});

serverApp.post('/api/tasks', (req, res) => {
  const data = getTasks();
  const existingIds = new Set(data.tasks.map(t => t.id));
  const newId = generateCoolId(existingIds);
  const newTask = { id: newId, ...req.body, status: req.body.status || 'progress' };
  data.tasks.push(newTask);
  saveTasks(data);
  res.json(newTask);
});

serverApp.put('/api/tasks/:id', (req, res) => {
  const data = getTasks();
  const index = data.tasks.findIndex(t => t.id === req.params.id);
  if (index > -1) {
    data.tasks[index] = { ...data.tasks[index], ...req.body };
    saveTasks(data);
    res.json(data.tasks[index]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

serverApp.post('/api/tasks/:id/status', (req, res) => {
  const data = getTasks();
  const index = data.tasks.findIndex(t => t.id === req.params.id);
  if (index > -1) {
    data.tasks[index].status = req.body.status;
    saveTasks(data);
    res.json(data.tasks[index]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

serverApp.delete('/api/tasks/:id', (req, res) => {
  const data = getTasks();
  data.tasks = data.tasks.filter(t => t.id !== req.params.id);
  saveTasks(data);
  res.json({ success: true });
});

serverApp.listen(PORT, '0.0.0.0', () => {
  console.log(`Sync Server running on http://${ip.address()}:${PORT}`);
});

// Electron Setup
function createWindow() {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true,
    backgroundColor: '#0a0a0a'
  });

  mainWindow.loadFile('index.html');
  
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('server-ip', ip.address());
  });
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// --- Background Task Monitor ---
let notified30Mins = new Set();
let notified5Mins = new Set();

function checkTasks() {
  const data = getTasks();
  const now = new Date();
  let changed = false;

  data.tasks.forEach(task => {
    if (task.status !== 'progress') return;

    const taskTime = new Date(`${task.date}T${task.time}`);
    const diffMs = taskTime - now;
    const diffMins = Math.floor(diffMs / 60000);

    // If time is up -> failed
    if (diffMins < 0) {
      task.status = 'failed';
      changed = true;
      return;
    }

    // 30 mins popup
    if (diffMins <= 30 && diffMins > 5 && !notified30Mins.has(task.id)) {
      notified30Mins.add(task.id);
      showPopup(task, '30min'); 
    }

    // 5 mins alarm & popup
    if (diffMins <= 5 && diffMins >= 0 && !notified5Mins.has(task.id)) {
      notified5Mins.add(task.id);
      forceVolumeAndShowPopup(task);
    }
  });

  if (changed) saveTasks(data);
}

function showPopup(task, soundType = false) {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const popup = new BrowserWindow({
    width: 400,
    height: 250,
    x: (width - 400) / 2,
    y: (height - 250) / 2,
    alwaysOnTop: true,
    skipTaskbar: true,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  popup.loadFile('popup.html');
  
  // Send task info to popup
  popup.webContents.on('did-finish-load', () => {
    popup.webContents.send('task-info', task, soundType);
  });
}

async function forceVolumeAndShowPopup(task) {
  try {
    const vol = await loudness.getVolume();
    const muted = await loudness.getMuted();
    if (vol < 30 || muted) {
      await loudness.setMuted(false);
      await loudness.setVolume(30);
    }
  } catch (err) {
    console.error('Error setting volume:', err);
  }
  showPopup(task, '5min'); 
}

ipcMain.on('mark-success-from-popup', (event, taskId) => {
  const data = getTasks();
  const task = data.tasks.find(t => t.id === taskId);
  if (task) {
    task.status = 'success';
    saveTasks(data);
  }
  createWindow();
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // If a second instance is launched, open the main window of the first instance
    if (!commandLine.includes('--hidden')) {
      createWindow();
    }
  });

  app.whenReady().then(() => {
    // Setup System Tray
    const icon = nativeImage.createEmpty(); // Transparent icon if no icon.png exists
    tray = new Tray(icon);
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Open Activity Tracker', click: () => { createWindow(); } },
      { label: 'Quit System', click: () => { app.quit(); } }
    ]);
    tray.setToolTip('Activity Tracker (Background Process Active)');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
      createWindow();
    });

    if (!process.argv.includes('--hidden')) {
      createWindow();
    }
    
    setInterval(checkTasks, 60000); // Check every minute
  });

  app.on('window-all-closed', () => {
    // Prevent app from quitting when UI is closed. It stays alive in the tray.
  });
}
