import { app, BrowserWindow, WebContentsView, screen, globalShortcut, ipcMain } from "electron";
import { initTray } from "./tray.js";
import { getSettingsFilePath, loadSettingsFromDisk, saveSettingsToDisk } from './utils/settings.js';
import { buildSources } from './utils/sources.js';
import { getPath, getPagesPath } from './utils/paths.js';

// Global state (we keep it tidy, promise)
let mainWindow;
let webContentViews = [];
let offset = 0;
let targetOffset = 0;
let scrolling = false;
let isAppVisible = true;
let settingsWindow = null;
let trayController = null;

// App settings
let appSettings = {
  alwaysOnTop: true,
  autoStart: false,
  scrollSpeed: 100,
  shortcuts: {
    // Tip: Change these in Settings; hardcoding is so 1999
    scrollUp: "CommandOrControl+Alt+Up",
    scrollDown: "CommandOrControl+Alt+Down",
    toggleLock: "CommandOrControl+Alt+L",
    toggleMinimize: "CommandOrControl+Alt+M",
  },
  userSites: [],
};

// Key constants
const UP = "Up";
const DOWN = "Down";

// Size and positioning configs - Math time! (fuck math!)
let CONTENT_WIDTH;
let CONTENT_HEIGHT;
let CONTENT_X;
let CONTENT_Y;

// Static sources list (edit here to add fixed entries first)
// Pro tip: keep things minimal; less is more—except for pizza slices.
const staticSources = [
  { label: 'Gemini', source: 'file://' + getPagesPath('gemini', 'index.html') },
];
const placeholderPage = 'file://' + getPagesPath('placeholder', 'index.html');

// Calculate window dimensions - Some fancy math to make it look professional
function calculateDimensions() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;

  // Height: from taskbar to the sky (or ceiling, whatever comes first)
  CONTENT_HEIGHT = workArea.height;

  // Width: 20% because we're not greedy... yet
  CONTENT_WIDTH = Math.floor(workArea.width * 0.2);

  // Position X: Right side with some breathing room (2% margin because we're classy)
  CONTENT_X =
    workArea.width - CONTENT_WIDTH - Math.floor(workArea.width * 0.02);

  // Position Y: Top of work area (respect the taskbar!)
  CONTENT_Y = workArea.y;
}

// Create the main window - The star of our show! 🌟
function createWindow() {
  calculateDimensions();

  // Create main window with exact content size (no more click-through bugs!)
  mainWindow = new BrowserWindow({
    width: CONTENT_WIDTH,
    height: CONTENT_HEIGHT,
    x: CONTENT_X,
    y: CONTENT_Y,
    show: false,
    transparent: false, // Solid window = no click-through shenanigans
    frame: false, // Borderless because frames are so 2010
    skipTaskbar: true, // Ninja mode: invisible in taskbar
    alwaysOnTop: appSettings.alwaysOnTop, // Boss mode enabled by default
    webPreferences: {
      nodeIntegration: false, // Security first!
      contextIsolation: true, // More security because we're paranoid
    },
  });

  // Build list of sources: static first, then user-configured
  const sources = buildSources(staticSources, appSettings.userSites, placeholderPage);

  // Create WebContentsViews for each source - It's like inception but with websites
  sources.forEach((entry, index) => { // ( made by AI need review )
    const view = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // Set initial size and position (now relative to window, not screen)
    view.setBounds({
      x: 0, // Relative to window now (learned our lesson from the click-through bug)
      y: index * CONTENT_HEIGHT, // Stack them like pancakes 🥞
      width: CONTENT_WIDTH,
      height: CONTENT_HEIGHT,
    });

    // Add view to window and keep track of it
    mainWindow.contentView.addChildView(view);
    webContentViews.push(view);

    // Load content based on type
    loadContent(view, entry);
  });

  mainWindow.show();

  // Setup keyboard shortcuts - Because clicking is for peasants
  setupKeyboardShortcuts(); // ( made by AI need review )

  // System tray
  trayController = initTray({
    getAppSettings: () => appSettings,
    toggleAlwaysOnTop,
    toggleAutoStart,
    setScrollSpeed,
    toggleWindowVisibility,
    openSettingsWindow,
    isAppVisible: () => isAppVisible,
  });

  // Register IPC handlers for settings
  registerSettingsIpc();
}

// Load content intelligently
function loadContent(view, entry) {
  const src = typeof entry === 'string' ? entry : entry.source;
  if (src.startsWith("http://") || src.startsWith("https://")) {
    view.webContents.loadURL(src);
  } else if (src.startsWith("file://")) {
    view.webContents.loadFile(src.replace("file://", ""));
  } else {
    // Assume it's a local file path
    view.webContents.loadFile(src);
  }
}

// Reposition all views - Like playing Tetris but with websites
function repositionAllCardViews() {
  webContentViews.forEach((view, index) => {
    view.setBounds({
      x: 0, // Always at the left edge of our window
      y: index * CONTENT_HEIGHT + offset, // Stack with current scroll offset
      width: CONTENT_WIDTH,
      height: CONTENT_HEIGHT,
    });
  });
}

// Smooth scrolling animation - Smoother than a jazz saxophone 🎷
function animateScroll() {
  if (scrolling) return; // Already scrolling, don't be greedy
  scrolling = true;

  const step = () => {
    const diff = targetOffset - offset;
    if (Math.abs(diff) < 1) {
      // Close enough, let's call it a day
      offset = targetOffset;
      repositionAllCardViews();
      scrolling = false;
      return;
    }
    // Smooth easing with 20% step - feels natural, like butter
    offset += diff * 0.2;
    repositionAllCardViews();
    setTimeout(step, 16); // ~60fps because we're fancy
  };

  step();
}

// Scroll down: move cards up (confusing but trust the process)
function scrollDown() {
  const totalHeight = webContentViews.length * CONTENT_HEIGHT;
  const minOffset = Math.min(0, CONTENT_HEIGHT - totalHeight);
  targetOffset -= appSettings.scrollSpeed; // TODO: Make this configurable in settings
  if (targetOffset < minOffset) targetOffset = minOffset; // Don't scroll past the end
  animateScroll();
}

// Scroll up: move cards down (physics is weird, deal with it)
function scrollUp() {
  targetOffset += appSettings.scrollSpeed;
  if (targetOffset > 0) targetOffset = 0; // Don't scroll past the beginning
  animateScroll();
}

// Create system tray - The control center of your digital empire 👑
function createSystemTray() {
  // Load your custom icon - make sure icon.png exists in your project root!
  let trayIconPath;
  try {
    trayIconPath = getPath("icon.png");
    // Test if file exists by trying to create image
    const icon = nativeImage.createFromPath(trayIconPath);
    if (icon.isEmpty()) {
      throw new Error("Icon file not found or invalid");
    }
    tray = new Tray(icon);
  } catch (error) {
    console.log("Custom icon not found, using default Electron icon");
    // Fallback: use empty icon (will show default system icon)
    tray = new Tray(nativeImage.createEmpty());
  }

  // Set tooltip - appears on hover
  tray.setToolTip("Your Awesome Feed App"); // TODO: Change this to your actual app name

  // Create context menu - this is where the magic happens
  updateTrayMenu();

  // Single click behavior - toggle window visibility
  tray.on("click", () => {
    toggleWindowVisibility();
  });

  console.log("System tray created successfully! 🎉");
}

// Update tray menu - Call this whenever settings change
// Tray menu is managed in tray.js

// Create or focus the Settings window
function openSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    if (!settingsWindow.isVisible()) settingsWindow.show();
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 420,
    height: 360,
    resizable: false,
    minimizable: false,
    maximizable: false,
    show: true,
    title: "Settings",
    parent: mainWindow,
    modal: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: getPath("preload-settings.js"),
    },
  });

  settingsWindow.loadFile(getPagesPath("settings", "index.html"));

  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
}

// IPC handlers for settings page
function registerSettingsIpc() {
  // Return current settings
  ipcMain.handle("settings:get", async () => {
    return appSettings;
  });

  // Update settings (partial update)
  ipcMain.handle("settings:update", async (_event, partial) => {
    if (typeof partial !== "object" || partial === null) return appSettings;

    const previous = { ...appSettings };
    appSettings = {
      ...appSettings,
      ...partial,
      shortcuts: { ...(appSettings.shortcuts || {}), ...(partial.shortcuts || {}) },
    };

    // Apply side-effects
    if (previous.alwaysOnTop !== appSettings.alwaysOnTop) {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setAlwaysOnTop(appSettings.alwaysOnTop);
      }
    }

    if (previous.scrollSpeed !== appSettings.scrollSpeed) {
      // No immediate side-effect required beyond using new value
    }

    // Re-register global shortcuts if changed
    if (JSON.stringify(previous.shortcuts) !== JSON.stringify(appSettings.shortcuts)) {
      registerGlobalShortcuts();
    }

    // Persist settings to disk
    saveSettingsToDisk(appSettings);
    if (trayController) trayController.updateTrayMenu();
    return appSettings;
  });

  // Restart app on demand
  ipcMain.handle("app:restart", async () => {
    app.relaunch();
    app.exit(0);
  });
}

// Register all global shortcuts based on current settings
function registerGlobalShortcuts() {
  globalShortcut.unregisterAll();

  const s = appSettings.shortcuts || {};

  if (s.scrollUp) {
    globalShortcut.register(s.scrollUp, () => { scrollUp(); });
  }
  if (s.scrollDown) {
    globalShortcut.register(s.scrollDown, () => { scrollDown(); });
  }
  if (s.toggleLock) {
    globalShortcut.register(s.toggleLock, () => { toggleAlwaysOnTop(); });
  }
  if (s.toggleMinimize) {
    globalShortcut.register(s.toggleMinimize, () => { toggleMinimizeRestore(); });
  }
}

// Toggle always on top
function toggleAlwaysOnTop() {
  appSettings.alwaysOnTop = !appSettings.alwaysOnTop;
  mainWindow.setAlwaysOnTop(appSettings.alwaysOnTop);
  if (trayController) trayController.updateTrayMenu();
}

// Toggle auto start (placeholder)
function toggleAutoStart() {
  appSettings.autoStart = !appSettings.autoStart;
  if (trayController) trayController.updateTrayMenu();

  // TODO: Implement actual auto-start functionality
  // Hint: Use electron-auto-launch package or registry manipulation
}

// Set scroll speed
function setScrollSpeed(speed) {
  appSettings.scrollSpeed = speed;
  if (trayController) trayController.updateTrayMenu();
}

// Toggle window visibility
function toggleWindowVisibility() {
  if (isAppVisible) {
    mainWindow.hide();
    isAppVisible = false;
  } else {
    mainWindow.show();
    isAppVisible = true;
  }
  if (trayController) trayController.updateTrayMenu();
}
// Setup keyboard shortcuts - Because mouse is for amateurs 🖱️
function setupKeyboardShortcuts() {
  // Register according to configurable shortcuts
  registerGlobalShortcuts();

  // Mouse wheel support
  mainWindow.webContents.on("wheel", (event, delta) => {
    if (delta.deltaY > 0) {
      scrollDown();
    } else {
      scrollUp();
    }
  });
}

// Toggle minimize/restore of main window
function toggleMinimizeRestore() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
    mainWindow.show();
    isAppVisible = true;
  } else {
    mainWindow.minimize();
    isAppVisible = false;
  }
  if (trayController) trayController.updateTrayMenu();
}

// App event handlers - The lifecycle of our beautiful creation 🌱
app.whenReady().then(() => {
  // Load settings from disk before creating windows
  appSettings = { ...appSettings, ...loadSettingsFromDisk() };
  createWindow();

  app.on("activate", () => {
    // macOS behavior: recreate window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Handle window close events - Don't actually quit, just hide (sneaky!)
app.on("window-all-closed", (event) => {
  // Prevent default quit behavior
  event.preventDefault();

  // Hide to tray instead of quitting
  if (mainWindow) {
    mainWindow.hide();
    isAppVisible = false;
    if (trayController) trayController.updateTrayMenu();
  }

  // Note: App will only quit when user clicks "Quit" in tray menu
});

app.on("before-quit", () => {
  // Cleanup before quitting - be a good citizen
  globalShortcut.unregisterAll();
});

// Utility functions for debugging and future expansion 🔧

// Add new content dynamically - For when you discover a new favorite website
function addNewContent(source) {
  const view = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const index = webContentViews.length;
  view.setBounds({
    x: 0, // Window-relative positioning
    y: index * CONTENT_HEIGHT + offset,
    width: CONTENT_WIDTH,
    height: CONTENT_HEIGHT,
  });

  mainWindow.contentView.addChildView(view);
  webContentViews.push(view);
  loadContent(view, source);

  // TODO: Save the new source to your config file so it persists
}

// Export useful functions - For when you want to control this from other files
export {
  scrollUp,
  scrollDown,
  addNewContent,
  toggleWindowVisibility,
  toggleAlwaysOnTop,
};

// Simple JSON persistence for settings
// settings helpers come from utils/settings.js

