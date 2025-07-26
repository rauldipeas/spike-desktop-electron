const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  notify: (count) => ipcRenderer.send('notify', count),
  updateTrayBadge: (count) => ipcRenderer.send('update-tray-badge', count)
});

// Bloqueia notificações nativas da página
window.Notification = class {
  constructor() {}
  static requestPermission() { return Promise.resolve('denied'); }
  static get permission() { return 'denied'; }
};