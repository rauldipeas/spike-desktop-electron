const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron');
let mainWindow = null;
let tray = null;

function createWindow() {
  if (mainWindow) {
    mainWindow.show();
    return;
  }

  mainWindow = new BrowserWindow({
    icon: __dirname + '/spike-desktop-electron.png',
  });

  mainWindow.setMenu(null);
  mainWindow.loadURL('https://spikenow.com/web');

  mainWindow.webContents.on('before-input-event', (event, input) => {
    const isReload = (input.control && input.key.toLowerCase() === 'r') || input.key === 'F5';
    if (isReload) {
      event.preventDefault();
      mainWindow.reload();
    }
  });

  mainWindow.webContents.insertCSS(`
    body, * {
      font-family: "Ubuntu Sans", Noto Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Apple Color Emoji", sans-serif !important;
      font-size: 15px !important;
    }
  `);

  mainWindow.setTitle("📨 SpikeNow");

  mainWindow.webContents.on('new-window', () => {
    mainWindow.show();
    mainWindow.focus();
  });  

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.key.toLowerCase() === 'w') {
      event.preventDefault();
      mainWindow.close();
    }
  });
  
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.key.toLowerCase() === 'q') {
        app.isQuiting = true;
        app.quit();
    }
  });  

  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const trayIcon = nativeImage.createFromPath(__dirname + '/spike-desktop-electron.png');
  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Mostrar', click: () => mainWindow.show() },
    { label: 'Sair', click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);
  tray.setToolTip('SpikeNow');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow.isVisible()) mainWindow.hide();
    else mainWindow.show();
  });
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.commandLine.appendSwitch('log-level', '3');        // ERROR+
  app.commandLine.appendSwitch('disable-logging');       // corta Chromium logs
  // opcional, reduz erros GL/VSync em setups problemáticos:
  app.commandLine.appendSwitch('disable-gpu');

  app.whenReady().then(() => {
    createWindow();
    createTray();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('activate', () => {
    if (mainWindow === null) createWindow();
  });

  app.on('web-contents-created', (_, contents) => {
    contents.on('notification-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  });
  
}
