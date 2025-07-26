const { app, BrowserWindow, Tray, Menu, nativeImage, Notification, ipcMain, session, nativeTheme } = require('electron');
const { exec } = require('child_process');
const path = require('path');

let mainWindow = null;
let tray = null;
let lastCount = 0;

const icons = {
  mono: path.join(__dirname, '..', 'resources', 'mono-tray.png'),
  monoBadge: path.join(__dirname, '..', 'resources', 'mono-tray-badge.png'),
  color: path.join(__dirname, '..', 'resources', 'color-tray.png'),
  colorBadge: path.join(__dirname, '..', 'resources', 'color-tray-badge.png')
};

const alertSound = path.join(process.resourcesPath, 'alert.mp3');

function playAlert() {
  exec(`ffplay -nodisp -autoexit "${alertSound}"`, (error) => {
    if (error) console.error('Erro ao tocar som:', error);
  });
}

function getIconPath(count) {
  const isDark = nativeTheme.shouldUseDarkColors;
  if (isDark) {
    return count > 0 ? icons.monoBadge : icons.mono;
  } else {
    return count > 0 ? icons.colorBadge : icons.color;
  }
}

function updateTrayIcon(count) {
  if (!tray) return;
  const iconPath = getIconPath(count);
  tray.setImage(nativeImage.createFromPath(iconPath));
  tray.setToolTip(count > 0 ? `Spike - ${count} nova(s) mensagem(ns)` : 'Spike');
}

function createWindow() {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    icon: icons.mono,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setMenu(null);
  mainWindow.loadURL('https://spikenow.com/web');

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow.webContents.getURL()) {
      event.preventDefault();
      require('electron').shell.openExternal(url);
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.setTitle("📬 Spike");

    mainWindow.webContents.executeJavaScript(`
      if (!window._observerAttached) {
        window._observerAttached = true;

        const notifyBadge = () => {
          const badges = document.querySelectorAll('div.thread:not(.nobadge) div.badge');
          let total = 0;
          badges.forEach(badge => {
            const txt = badge.textContent.trim();
            const val = txt === '' ? 1 : parseInt(txt);
            total += val;
          });
          window.electronAPI.notify(total);
          window.electronAPI.updateTrayBadge(total);
        };

        const observer = new MutationObserver(() => {
          notifyBadge();
        });

        observer.observe(document.body, { childList: true, subtree: true });
        notifyBadge();
      }
    `);
  });

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

  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('show', () => {
    lastCount = 0;
    updateTrayIcon(0);
  });
}

function createTray() {
  tray = new Tray(nativeImage.createFromPath(getIconPath(0)));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Mostrar', click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Sair', click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Spike');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) mainWindow.hide();
      else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

ipcMain.removeAllListeners('notify');
ipcMain.on('notify', (event, count) => {
  if (mainWindow && mainWindow.isVisible()) {
    lastCount = count;
    return;
  }

  if (count > lastCount) {
    const notif = new Notification({
      title: 'Spike',
      body: `${count} nova(s) mensagem(ns)`
    });

    notif.on('click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        lastCount = 0;
        updateTrayIcon(0);
      }
    });

    playAlert();
    notif.show();
  }
  lastCount = count;
});

ipcMain.on('update-tray-badge', (event, count) => {
  updateTrayIcon(count);
});

nativeTheme.on('updated', () => {
  updateTrayIcon(lastCount);
});

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

  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
  app.commandLine.appendSwitch('log-level', '3');
  app.commandLine.appendSwitch('disable-logging');
  app.commandLine.appendSwitch('disable-gpu');

  app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler((_, permission, callback) => {
      if (permission === 'notifications') return callback(false);
      callback(true);
    });
    createWindow();
    createTray();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('activate', () => {
    if (mainWindow === null) createWindow();
  });
}