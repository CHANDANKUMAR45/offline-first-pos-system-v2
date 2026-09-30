const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const { registerIpcHandlers } = require('./ipc-handlers');
const { runMigrations } = require('../database/migrations');
const { closeConnection } = require('../database/connection');

// Determine if we're in development
const isDev = !app.isPackaged;

let mainWindow;
let syncInterval;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Hybrid POS System',
    icon: path.join(__dirname, '../build/win-icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
    backgroundColor: '#0f172a',
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  // Show window when ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Register all IPC handlers
registerIpcHandlers(ipcMain);

app.whenReady().then(() => {
  try {
    const logPath = require('./logger').initializeLogging(app.getPath('userData'));
    console.log(`[App] Logging to ${logPath}`);
    runMigrations();
    createWindow();

    const { triggerSync } = require('./sync-service');
    triggerSync();

    syncInterval = setInterval(async () => {
      try {
        await triggerSync();
      } catch (err) {
        console.error('[Auto-Sync Error]', err);
      }
    }, 30000);
  } catch (error) {
    console.error('[Startup Error]', error);
    dialog.showErrorBox(
      'Hybrid POS could not start',
      'The local database could not be opened. Your existing data has not been removed.'
    );
    app.quit();
  }
});

app.on('before-quit', () => {
  clearInterval(syncInterval);
  closeConnection();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
