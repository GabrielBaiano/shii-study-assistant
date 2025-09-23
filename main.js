const {
  app,
  BrowserWindow,
  WebContentsView,
  screen,
  globalShortcut,
  Tray,
  Menu,
  nativeImage,
} = require("electron");
const path = require("path");

// Disclamer - My main language is not English. Please excuse any grammatical errors in comments.

// Global variables - because who doesn't love some good old global state? 🤷‍♂️
let mainWindow;
let tray; // The mighty system tray - your app's best friend
let webContentViews = [];
let offset = 0;
let targetOffset = 0;
let scrolling = false;
let isAppVisible = true; // Keep track of window visibility like a stalker

// App settings - You'll probably want to save these to a file later (hint hint)
let appSettings = {
  alwaysOnTop: true, // Because my app is obviously more important than everything else
  autoStart: false, // TODO: Implement this when you feel like it
  scrollSpeed: 100, // TODO: Make this configurable in the future
};

// Key constants
const UP = "Up";
const DOWN = "Down";

// Size and positioning configs - Math time! (fuck math)
let CONTENT_WIDTH;
let CONTENT_HEIGHT;
let CONTENT_X;
let CONTENT_Y;

// Content sources - Add your favorite websites here!
// Pro tip: Don't add NSFW stuff in my app pls !
const contentSources = [
  "https://www.google.com",
  "https://www.github.com",
  "https://www.stackoverflow.com", // Your real programming teacher
  "https://www.youtube.com",
  "https://www.twitter.com",

  // 'file://' + path.join(__dirname, 'local-page.html') // Uncomment when you create this file
];

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

  // Create WebContentsViews for each source - It's like inception but with websites
  contentSources.forEach((source, index) => {
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

    // Load content based on type (smart loading, we're basically AI now)
    loadContent(view, source);
  });

  mainWindow.show();

  // Setup keyboard shortcuts - Because clicking is for peasants
  setupKeyboardShortcuts();

  // Create system tray - The real MVP
  createSystemTray();
}

// Load content intelligently - We're basically web developers now 💻
function loadContent(view, source) {
  if (source.startsWith("http://") || source.startsWith("https://")) {
    // Load web URL - The internet is our oyster
    view.webContents.loadURL(source);
  } else if (source.startsWith("file://")) {
    // Load local file - Old school but gold school
    view.webContents.loadFile(source.replace("file://", ""));
  } else {
    // Assume it's a local file without prefix - YOLO loading
    view.webContents.loadFile(source);
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
    trayIconPath = path.join(__dirname, "icon.png");
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
function updateTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Settings",
      type: "submenu",
      submenu: [
        {
          label: `Always on Top ${getSettingCheckbox(appSettings.alwaysOnTop)}`,
          click: () => toggleAlwaysOnTop(),
        },
        {
          label: `Auto Start ${getSettingCheckbox(appSettings.autoStart)}`,
          click: () => toggleAutoStart(),
          // TODO: Implement auto-start functionality when you feel motivated
        },
        { type: "separator" },
        {
          label: "Scroll Speed",
          type: "submenu",
          submenu: [
            {
              label: `Slow (50px) ${
                appSettings.scrollSpeed === 50 ? "●" : "○"
              }`,
              click: () => setScrollSpeed(50),
            },
            {
              label: `Normal (100px) ${
                appSettings.scrollSpeed === 100 ? "●" : "○"
              }`,
              click: () => setScrollSpeed(100),
            },
            {
              label: `Fast (200px) ${
                appSettings.scrollSpeed === 200 ? "●" : "○"
              }`,
              click: () => setScrollSpeed(200),
            },
          ],
        },
      ],
    },
    { type: "separator" },
    {
      label: isAppVisible ? "Hide Window" : "Show Window",
      click: () => toggleWindowVisibility(),
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.quit(); // Goodbye cruel world 👋
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

// Get checkbox symbol for settings - Because visual feedback is important
function getSettingCheckbox(setting) {
  return setting ? "☑" : "☐"; // TODO: Maybe use better symbols if these don't work on all systems
}

// Toggle always on top - Make your window the boss or let it be humble
function toggleAlwaysOnTop() {
  appSettings.alwaysOnTop = !appSettings.alwaysOnTop;
  mainWindow.setAlwaysOnTop(appSettings.alwaysOnTop);
  updateTrayMenu(); // Refresh menu to show new state

  // TODO: Save settings to file so they persist between app restarts
}

// Toggle auto start - For when you want your app to be clingy
function toggleAutoStart() {
  appSettings.autoStart = !appSettings.autoStart;
  updateTrayMenu();

  // TODO: Implement actual auto-start functionality
  // Hint: Use electron-auto-launch package or registry manipulation
}

// Set scroll speed - Because everyone has different scrolling preferences
function setScrollSpeed(speed) {
  appSettings.scrollSpeed = speed;
  updateTrayMenu();

  // TODO: Save this setting to a config file
}

// Toggle window visibility - Hide and seek champion 🙈
function toggleWindowVisibility() {
  if (isAppVisible) {
    mainWindow.hide();
    isAppVisible = false;
  } else {
    mainWindow.show();
    isAppVisible = true;
  }
  updateTrayMenu(); // Update menu text
}
// Setup keyboard shortcuts - Because mouse is for amateurs 🖱️
function setupKeyboardShortcuts() {
  // Global shortcuts - work even when app is not focused (power user mode)
  globalShortcut.register("CommandOrControl+Up", () => {
    scrollUp();
  });

  globalShortcut.register("CommandOrControl+Down", () => {
    scrollDown();
  });

  // Simple arrow keys - only work when window is focused
  globalShortcut.register("Up", () => {
    scrollUp();
  });

  globalShortcut.register("Down", () => {
    scrollDown();
  });

  // Mouse wheel support - because some people actually use mice
  mainWindow.webContents.on("wheel", (event, delta) => {
    if (delta.deltaY > 0) {
      scrollDown();
    } else {
      scrollUp();
    }
  });
}

// App event handlers - The lifecycle of our beautiful creation 🌱
app.whenReady().then(() => {
  createWindow();

  // Give the window a moment to load before creating tray
  setTimeout(() => {
    createSystemTray();
  }, 1000);

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
    updateTrayMenu();
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
module.exports = {
  scrollUp,
  scrollDown,
  addNewContent,
  toggleWindowVisibility,
  toggleAlwaysOnTop,
};

/*
 * TODO List for Future You 📝:
 *
 * 1. Create a proper tray icon (16x16 PNG) and put it in assets/tray-icon.png
 * 2. Implement settings persistence (save to JSON file or electron-store)
 * 3. Add auto-start functionality (use electron-auto-launch)
 * 4. Create a settings window with proper UI
 * 5. Add keyboard shortcut customization
 * 6. Implement content source management (add/remove from GUI)
 * 7. Add themes/dark mode support
 * 8. Consider adding content filtering or search
 * 9. Maybe add notification support?
 * 10. Test on different screen resolutions and multi-monitor setups
 *
 * Remember: Good code is like a good joke - if you have to explain it, it's probably bad! 😄
 */
