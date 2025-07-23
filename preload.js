const { contextBridge, ipcRenderer } = require('electron');

window.Notification = class extends Notification {
  constructor(title, options) {
    super(title, options);
    this.onclick = () => {
      ipcRenderer.send('notification-click');
    };
  }
};