import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('settingsAPI', {
  get: () => ipcRenderer.invoke('settings:get'),
  update: (partial) => ipcRenderer.invoke('settings:update', partial),
  restart: () => ipcRenderer.invoke('app:restart'),
});


