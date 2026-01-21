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

// Handle manual update check
ipcMain.on('check-for-updates', () => {
  log.info('Checking for updates manually...');
  autoUpdater.checkForUpdatesAndNotify();
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Auto Updater Events
autoUpdater.on('update-available', () => {
  log.info('Update available.');
  if (mainWindow) mainWindow.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
  log.info('Update downloaded.');
  if (mainWindow) mainWindow.webContents.send('update_downloaded');

  // Ask user to restart now or later? 
  // For now, let's just install automatically on quit (default behavior)
  // Or force it:
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Actualización lista',
    message: 'Una nueva versión se ha descargado. Se instalará al cerrar la aplicación.',
    buttons: ['Reiniciar ahora', 'Después']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (err) => {
  log.error('Error in auto-updater: ' + err);
});
