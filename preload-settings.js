const { contextBridge, ipcRenderer } = require('electron');
console.log('Preload script loading...');

contextBridge.exposeInMainWorld('settingsAPI', {
  get: () => {
    console.log('settingsAPI.get called from preload');
    return ipcRenderer.invoke('settings:get');
  },
  update: (partial) => {
    console.log('settingsAPI.update called from preload with:', partial);
    return ipcRenderer.invoke('settings:update', partial);
  },
  restart: () => {
    console.log('settingsAPI.restart called from preload');
    return ipcRenderer.invoke('app:restart');
  },
});

console.log('Preload script loaded successfully!');