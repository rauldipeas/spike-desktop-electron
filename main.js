const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;

function createWindow() {
  if (mainWindow) {
    mainWindow.show();
    return;
  }

  mainWindow = new BrowserWindow({
    icon: path.join(__dirname, 'mono-tray.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.setMenu(null);
  mainWindow.loadURL('https://spikenow.com/web');

  // Estilo com fontes e tamanho legível
  mainWindow.webContents.on('did-finish-load', () => {
    // mainWindow.webContents.insertCSS(`
    //  body, * {
    //    font-family: "Segoe UI Symbol", "Noto Color Emoji", "Segoe UI Emoji", "Apple Color Emoji" !important;
    //    font-size: 15px !important;
    //  }
    //`);
    mainWindow.setTitle("📬 Spike");
  });

  // Atalhos de teclado
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const key = input.key.toLowerCase();
    if (input.control && key === 'w') {
      event.preventDefault();
      mainWindow.hide();
    } else if (input.control && key === 'r') {
      event.preventDefault();
      mainWindow.reload();
    } else if (input.control && key === 'q') {
      app.isQuiting = true;
      app.quit();
    } else if (input.key === 'F5') {
      event.preventDefault();
      mainWindow.reload();
    }
  });

  // Impede fechamento completo
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const trayIcon = nativeImage.createFromPath(path.join(__dirname, 'mono-tray.png'));
  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Mostrar', click: () => mainWindow.show() },
    { label: 'Sair', click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);
  tray.setToolTip('Spike');
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

  // Reduz logs/avisos/erros
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
  app.commandLine.appendSwitch('log-level', '3');
  app.commandLine.appendSwitch('disable-logging');
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

  // Clica na notificação → ativa janela
  app.on('web-contents-created', (_, contents) => {
    contents.on('notification-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  });
  
  let notificationCount = 0;
  
  function newNotification() {
    notificationCount++;
    app.setBadgeCount(notificationCount);
    tray.setToolTip(`Spike - ${notificationCount} novas mensagens`);
    playSound();
  }
  
  // Chame newNotification() quando receber uma notificação.

  function playSound() {
    if (mainWindow) {
      mainWindow.webContents.executeJavaScript(`
        new Audio('file://${__dirname}/alert.mp3').play();
      `);
    }
  }

}
