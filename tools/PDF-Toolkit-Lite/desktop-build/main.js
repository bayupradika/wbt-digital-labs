const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let mainWindow;
const LICENSE_PATH = path.join(app.getPath('userData'), 'wbt_license.key');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "WBT Document Toolkit Pro",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.setMenuBarVisibility(false);
  checkLicense();
}

function verifyKey(key) {
  try {
    const parts = key.split('-');
    if (parts.length !== 3 || parts[0] !== 'WBT') return false;
    
    const part1 = parts[1];
    const part2 = parts[2];
    
    const secret = "WBT_SECRET_2026";
    const hash = crypto.createHash('sha1').update(part1 + secret).digest('hex').substring(0, 4).toUpperCase();
    
    return hash === part2;
  } catch(e) {
    return false;
  }
}

function checkLicense() {
  if (fs.existsSync(LICENSE_PATH)) {
    const savedKey = fs.readFileSync(LICENSE_PATH, 'utf-8');
    if (verifyKey(savedKey)) {
      mainWindow.loadFile(path.join(__dirname, '../index.html'));
      return;
    }
  }
  
  mainWindow.loadFile(path.join(__dirname, 'activation.html'));
}

ipcMain.on('activate-license', (event, key) => {
  if (verifyKey(key)) {
    fs.writeFileSync(LICENSE_PATH, key);
    dialog.showMessageBoxSync(mainWindow, { type: 'info', title: 'Aktivasi Berhasil', message: 'Terima kasih telah membeli WBT Document Toolkit Pro! Aplikasi kini siap digunakan selamanya.' });
    mainWindow.loadFile(path.join(__dirname, '../index.html'));
  } else {
    dialog.showErrorBox('Aktivasi Gagal', 'Kunci lisensi tidak valid! Pastikan Anda memasukkan kode yang Anda dapatkan dari Email pembelian Mayar.id.');
  }
});

ipcMain.on('open-buy-link', () => {
  shell.openExternal('https://mayar.id/pay/wbt-desktop-pro'); // Ganti dengan link Mayar Anda
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
