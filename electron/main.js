const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
