// Tray setup lives here so main.js can breathe.
// Exports a small controller with the created tray and a function to refresh the menu.

import path from 'path';
import { Tray, Menu, nativeImage } from 'electron';

function initTray({
  getAppSettings,
  toggleAlwaysOnTop,
  toggleAutoStart,
  setScrollSpeed,
  toggleWindowVisibility,
  openSettingsWindow,
  isAppVisible,
}) {
  let tray;

  function createTray() {
    // Try to use the project icon; if not found, Electron will improvise
    let trayIconPath;
    try {
      trayIconPath = path.join(__dirname, 'icon.png');
      const icon = nativeImage.createFromPath(trayIconPath);
      tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
    } catch {
      tray = new Tray(nativeImage.createEmpty());
    }

    tray.setToolTip('Your Awesome Feed App');
    tray.on('click', () => toggleWindowVisibility());
    updateTrayMenu();
    return tray;
  }

  function updateTrayMenu() {
    const settings = getAppSettings();
    const checkbox = (on) => (on ? '☑' : '☐');

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Open Settings', click: () => openSettingsWindow() },
      { type: 'separator' },
      {
        label: 'Settings',
        type: 'submenu',
        submenu: [
          {
            label: `Always on Top ${checkbox(settings.alwaysOnTop)}`,
            click: () => toggleAlwaysOnTop(),
          },
          {
            label: `Auto Start ${checkbox(settings.autoStart)}`,
            click: () => toggleAutoStart(),
          },
          { type: 'separator' },
          {
            label: 'Scroll Speed',
            type: 'submenu',
            submenu: [
              { label: `Slow (50px) ${settings.scrollSpeed === 50 ? '●' : '○'}`, click: () => setScrollSpeed(50) },
              { label: `Normal (100px) ${settings.scrollSpeed === 100 ? '●' : '○'}`, click: () => setScrollSpeed(100) },
              { label: `Fast (200px) ${settings.scrollSpeed === 200 ? '●' : '○'}`, click: () => setScrollSpeed(200) },
            ],
          },
        ],
      },
      { type: 'separator' },
      { label: isAppVisible() ? 'Hide Window' : 'Show Window', click: () => toggleWindowVisibility() },
      { type: 'separator' },
      { role: 'quit', label: 'Quit' },
    ]);

    if (!tray) createTray();
    tray.setContextMenu(contextMenu);
  }

  return { tray: createTray(), updateTrayMenu };
}

export { initTray };


