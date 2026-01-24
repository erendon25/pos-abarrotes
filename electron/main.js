const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false // For simple migration, though true is safer
    },
    icon: path.join(__dirname, '../public/icon.png') // Updated icon path
  });

  mainWindow.setMenu(null); // Remove the default menu bar

  // In production, load the local index.html
  // In development, load the vite dev server
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (process.env.ELECTRON_START_URL) {
    mainWindow.webContents.openDevTools();
  } else {
    // In production, check for updates
    // Check for updates 2 seconds after launch to ensure window is ready
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 2000);
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Handle silent printing
  ipcMain.on('print-silent', (event, htmlContent) => {
    const workerWindow = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: true }
    });

    // Load content using base64 to avoid encoding issues
    const htmlBase64 = Buffer.from(htmlContent).toString('base64');
    workerWindow.loadURL(`data:text/html;base64,${htmlBase64}`);

    workerWindow.webContents.on('did-finish-load', () => {
      workerWindow.webContents.print({
        silent: true,
        printBackground: true
      }, (success, errorType) => {
        if (!success) console.error("Print failed:", errorType);
        workerWindow.close();
      });
    });
  });
});

let isManualCheck = false;

// Handle manual update check
ipcMain.on('check-for-updates', () => {
  log.info('Checking for updates manually...');
  isManualCheck = true;
  autoUpdater.checkForUpdatesAndNotify();
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Auto Updater Events
// Auto Updater Events
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for updates...');
  if (mainWindow) mainWindow.webContents.send('checking_for_update');
});

autoUpdater.on('update-available', () => {
  log.info('Update available.');
  if (mainWindow) mainWindow.webContents.send('update_available');
});

autoUpdater.on('update-not-available', () => {
  log.info('Update not available.');
  if (mainWindow) mainWindow.webContents.send('update_not_available');
  isManualCheck = false;
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  log.info(log_message);

  if (mainWindow) mainWindow.webContents.send('download_progress', progressObj);
});

autoUpdater.on('update-downloaded', () => {
  log.info('Update downloaded.');
  if (mainWindow) mainWindow.webContents.send('update_downloaded');
  isManualCheck = false;
});

autoUpdater.on('error', (err) => {
  log.error('Error in auto-updater: ' + err);
  if (mainWindow) mainWindow.webContents.send('update_error', err.toString());
  isManualCheck = false;
});

// Handle Restart Request from Renderer
ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});
