const {
  app,
  BrowserWindow,
  screen,
  WebContentsView,
  BrowserView,
  globalShortcut,
  Tray,
  Menu,
} = require("electron");
const path = require("path");
const fs = require("fs");
const AutoLaunch = require("auto-launch");

// Importar o plugin nativo para stealth
let stealthManager;
try {
  stealthManager = require("../native/index.js");
  console.log("✅ Plugin nativo stealth carregado com sucesso");
} catch (error) {
  console.log("⚠️ Plugin nativo stealth não disponível:", error.message);
  stealthManager = null;
}

// -------------------------------------------
// GLOBAL VARIABLES
// -------------------------------------------
let mainWindow;
let tray;
let viewsConfig = {};
let viewsLayout = [];

// Global widgets control - defines which widgets are loaded
let ACTIVE_WIDGETS = ["organizer", "clock", "gemini"]; // Default values

// Global advanced settings
let ADVANCED_SETTINGS = {};

// Auto-launch instance
let autoLauncher;

// Scroll system variables
// TODO: Refatorar sistema de scroll - implementar scroll mais suave e eficiente
let scrollOffset = 0;
let maxScrollOffset = 0;
const scrollStep = 50; // Pixels to scroll per step
const pageScrollStep = 300; // Pixels to scroll for page up/down

// -------------------------------------------
// CONFIGURATION
// -------------------------------------------
// App configuration
const APP_CONFIG = {
  name: "Shii!",
  version: "2.0.0",
  window: {
    width: 400,
    alwaysOnTop: true,
    frame: false,
    resizable: false,
    skipTaskbar: true,
  },
};

// Layout constants
const LAYOUT_CONFIG = {
  topGap: 10, // Gap from top
  gap: 20, // Gap between widgets
  minHeight: 50, // Minimum height for widgets
};

// -------------------------------------------
// SETTINGS FUNCTIONS
// -------------------------------------------

// Resolve persisted config path (outside asar when packaged)
function getPersistPath(fileName) {
  try {
    // Sempre persistir em userData/config para comportamento consistente em dev e prod
    const userDir = app.getPath("userData");
    const dir = path.join(userDir, "config");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, fileName);
  } catch (_) {
    // Fallback para diretório local do app
    return path.join(__dirname, "config", fileName);
  }
}

// Load settings from file
function loadSettings() {
  try {
    const settingsPath = getPersistPath("settings.json");
    // Seed persisted file on first run when packaged
    if (!fs.existsSync(settingsPath)) {
      try {
        const bundled = path.join(__dirname, "config", "settings.json");
        if (fs.existsSync(bundled)) {
          fs.writeFileSync(settingsPath, fs.readFileSync(bundled, "utf8"), "utf8");
        }
      } catch (_) {}
    }
    const settingsData = fs.readFileSync(settingsPath, "utf8");
    const settings = JSON.parse(settingsData);

    console.log("📋 Settings loaded:", settings);
    return settings;
  } catch (error) {
    console.error("❌ Error loading settings:", error.message);
    // Return default settings if file doesn't exist
    return {
      activeWidgets: ["organizer", "clock", "gemini"],
      window: {
        frame: false,
        skipTaskbar: true,
        resizable: true,
        alwaysOnTop: true,
      },
    };
  }
}

// Save settings to file
function saveSettings(settings) {
  try {
    const settingsPath = getPersistPath("settings.json");
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log("💾 Settings saved:", settings);
    return true;
  } catch (error) {
    console.error("❌ Error saving settings:", error.message);
    return false;
  }
}

// Update active widgets in settings
function updateActiveWidgets(newActiveWidgets) {
  ACTIVE_WIDGETS = newActiveWidgets;

  // Load current settings
  const settings = loadSettings();

  // Update activeWidgets
  settings.activeWidgets = newActiveWidgets;

  // Save updated settings
  saveSettings(settings);

  console.log("✅ Active widgets updated:", newActiveWidgets);
}

// Load advanced settings from file
function loadAdvancedSettings() {
  try {
    const advancedSettingsPath = getPersistPath("advanced-settings.json");
    // Seed file when first run packaged
    if (!fs.existsSync(advancedSettingsPath)) {
      try {
        const bundled = path.join(__dirname, "config", "advanced-settings.json");
        if (fs.existsSync(bundled)) {
          fs.writeFileSync(
            advancedSettingsPath,
            fs.readFileSync(bundled, "utf8"),
            "utf8"
          );
        }
      } catch (_) {}
    }
    const advancedSettingsData = fs.readFileSync(advancedSettingsPath, "utf8");
    const advancedSettings = JSON.parse(advancedSettingsData);

    console.log("⚙️ Advanced settings loaded:", advancedSettings);
    return advancedSettings;
  } catch (error) {
    console.error("❌ Error loading advanced settings:", error.message);
    // Return default advanced settings if file doesn't exist
    return {
      shortcuts: {
        scrollUp: "ArrowUp",
        scrollDown: "ArrowDown",
        pageUp: "PageUp",
        pageDown: "PageDown",
        scrollToTop: "Home",
        scrollToBottom: "End",
        toggleStealth: "F1",
        nextWidget: "ArrowRight",
        previousWidget: "ArrowLeft",
      },
      viewSettings: {
        defaultWidth: 1200,
        alwaysOnTop: true,
        stealthMode: {
          enabled: true,
          autoStart: true,
        },
      },
      layout: {
        gap: 20,
        topGap: 10,
        minHeight: 50,
      },
    };
  }
}

// Save advanced settings to file
function saveAdvancedSettings(advancedSettings) {
  try {
    const advancedSettingsPath = getPersistPath("advanced-settings.json");
    fs.writeFileSync(
      advancedSettingsPath,
      JSON.stringify(advancedSettings, null, 2),
      "utf8"
    );
    console.log("✅ Advanced settings saved:", advancedSettings);
    return true;
  } catch (error) {
    console.error("❌ Error saving advanced settings:", error.message);
    return false;
  }
}

// -------------------------------------------
// STEALTH FUNCTIONS
// -------------------------------------------

// Aplicar stealth nas WebContentsView (tornar invisível)
function applyStealthToViews() {
  if (!stealthManager) {
    console.log("⚠️ Plugin nativo stealth não disponível");
    return false;
  }

  console.log("🕵️ Aplicando stealth nas WebContentsView...");

  let successCount = 0;

  // Aplicar stealth em todas as views ativas
  Object.entries(viewsConfig).forEach(([key, config]) => {
    if (config.view && config.view.webContents) {
      try {
        const webContents = config.view.webContents;

        // Obter o título da janela da WebContentsView
        const windowTitle = `WebContentsView-${key}`;

        // Para BrowserView, precisamos obter o handle da janela principal
        // e aplicar stealth nela, já que BrowserView não tem janela própria
        if (config.view.webContents.id) {
          console.log(`🔍 Aplicando stealth na BrowserView: ${key}`);

          // Para BrowserView, aplicamos stealth na janela principal
          const mainWindowTitle = mainWindow.getTitle() || "Stealth App";
          const result = stealthManager.applyStealthByTitle(mainWindowTitle);

          if (result) {
            successCount++;
            console.log(`✅ Stealth aplicado na BrowserView: ${key}`);
          } else {
            console.log(`❌ Falha ao aplicar stealth na BrowserView: ${key}`);
          }
        }
      } catch (error) {
        console.error(
          `❌ Erro ao aplicar stealth na view "${key}":`,
          error.message
        );
      }
    }
  });

  console.log(`✅ Stealth aplicado em ${successCount} views`);
  return successCount > 0;
}

// Remover stealth das WebContentsView
function removeStealthFromViews() {
  if (!stealthManager) {
    console.log("⚠️ Plugin nativo stealth não disponível");
    return false;
  }

  console.log("👁️ Removendo stealth das WebContentsView...");

  try {
    // Remover stealth de todas as janelas gerenciadas pelo stealthManager
    const result = stealthManager.removeStealthFromMultipleWindows();
    console.log(`✅ Stealth removido: ${result}`);
    return result;
  } catch (error) {
    console.error("❌ Erro ao remover stealth:", error.message);
    return false;
  }
}

// -------------------------------------------
// UTILITY FUNCTIONS
// -------------------------------------------
// Helper function to get correct path for both dev and build
function getAppPath(relativePath) {
  if (app.isPackaged) {
    // In packaged app
    return path.join(process.resourcesPath, relativePath);
  } else {
    // In development
    return path.join(__dirname, "..", "..", relativePath);
  }
}

// Initialize auto-launcher
function initializeAutoLauncher() {
  autoLauncher = new AutoLaunch({
    name: "Stealth Widget App",
    path: process.execPath,
    isHidden: true,
  });
  console.log("🚀 Auto-launcher inicializado");
}

// Enable auto-start with Windows
async function enableAutoStart() {
  try {
    if (!autoLauncher) initializeAutoLauncher();
    await autoLauncher.enable();
    console.log("✅ Auto-start habilitado");
    return { success: true, message: "Auto-start habilitado com sucesso" };
  } catch (error) {
    console.error("❌ Erro ao habilitar auto-start:", error);
    return { success: false, error: error.message };
  }
}

// Disable auto-start with Windows
async function disableAutoStart() {
  try {
    if (!autoLauncher) initializeAutoLauncher();
    await autoLauncher.disable();
    console.log("❌ Auto-start desabilitado");
    return { success: true, message: "Auto-start desabilitado com sucesso" };
  } catch (error) {
    console.error("❌ Erro ao desabilitar auto-start:", error);
    return { success: false, error: error.message };
  }
}

// Check if auto-start is enabled
async function isAutoStartEnabled() {
  try {
    if (!autoLauncher) initializeAutoLauncher();
    const enabled = await autoLauncher.isEnabled();
    console.log(
      `🔍 Auto-start status: ${enabled ? "habilitado" : "desabilitado"}`
    );
    return enabled;
  } catch (error) {
    console.error("❌ Erro ao verificar status do auto-start:", error);
    return false;
  }
}

// -------------------------------------------
// WIDGET FUNCTIONS
// -------------------------------------------
// Load all widgets configuration from JSON
function loadAllWidgetsConfig() {
  try {
    const widgetsPath = path.join(__dirname, "config", "widgets.json");
    const widgetsData = fs.readFileSync(widgetsPath, "utf8");
    const allWidgets = JSON.parse(widgetsData);

    // Process URLs to use absolute paths
    Object.keys(allWidgets).forEach((key) => {
      const widget = allWidgets[key];
      if (widget.url && widget.url.startsWith("file://src/")) {
        const relativePath = widget.url.replace("file://src/", "src/");
        widget.url = "file://" + getAppPath(relativePath);
      }
    });

    console.log("📋 All widgets loaded:", Object.keys(allWidgets));
    return allWidgets;
  } catch (error) {
    console.error("❌ Error loading widgets config:", error.message);
    return {};
  }
}

// Load widgets configuration (filtered by ACTIVE_WIDGETS)
function loadWidgetsConfig() {
  const allWidgets = loadAllWidgetsConfig();

  // Garantir que ACTIVE_WIDGETS é um array válido
  if (!Array.isArray(ACTIVE_WIDGETS) || ACTIVE_WIDGETS.length === 0) {
    ACTIVE_WIDGETS = ["organizer", "clock", "gemini"]; // fallback seguro
  }

  // Filter only active widgets based on ACTIVE_WIDGETS
  const filteredWidgets = {};
  ACTIVE_WIDGETS.forEach((key) => {
    if (allWidgets[key]) {
      filteredWidgets[key] = allWidgets[key];
    }
  });

  console.log("📋 Active widgets loaded:", Object.keys(filteredWidgets));
  return filteredWidgets;
}

// Resolve height in pixels - supports both pixels and percentages
function resolveHeightPx(cfg, winHeight, fallback = 100) {
  const h = cfg.height;
  if (typeof h === "number") return Math.max(0, Math.round(h));
  if (typeof h === "string" && h.trim().endsWith("%")) {
    const pct = parseFloat(h.trim().slice(0, -1));
    if (!isNaN(pct)) return Math.max(0, Math.round((pct / 100) * winHeight));
  }
  return fallback;
}

// Create BrowserView for a widget (unified for both static and dynamic)
function createWidgetView(widgetKey, widgetConfig) {
  try {
    console.log(
      `🔧 Creating BrowserView for widget "${widgetKey}" with config:`,
      widgetConfig
    );

    // Configuração básica de webPreferences
    const webPreferences = {
      nodeIntegration: false,
      contextIsolation: true,
      transparent: true, // Fundo transparente
      backgroundThrottling: false,
    };

    // Adiciona webPreferences específicas se existirem
    if (widgetConfig.webPreferences) {
      Object.assign(webPreferences, widgetConfig.webPreferences);
    }

    // Preload para página de configurações
    if (widgetKey === "settings") {
      webPreferences.preload = path.join(__dirname, "preload.js");
      webPreferences.contextIsolation = true;
      webPreferences.nodeIntegration = false;
    }

    console.log(`🔧 WebPreferences for "${widgetKey}":`, webPreferences);

    const view = new BrowserView({ webPreferences });
    console.log(`✅ BrowserView created for "${widgetKey}":`, view);

    // Melhor experiência de layout e foco para BrowserView
    try {
      view.setAutoResize({ width: true, height: false, horizontal: true, vertical: false });
    } catch (_) {}

    // Load the widget content
    if (widgetConfig.url) {
      try {
        console.log(`📂 Loading URL for "${widgetKey}": ${widgetConfig.url}`);

        // Sempre usa loadURL para arquivos locais
        // Define um userAgent mais comum para evitar bloqueios de sites
        try {
          const ua =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
          view.webContents.setUserAgent(ua);
        } catch (_) {}

        const targetUrl = widgetConfig.url;
        const tryLoad = (attempt = 1) => {
          console.log(`🌐 Loading [${widgetKey}] attempt ${attempt}: ${targetUrl}`);
          view.webContents.loadURL(targetUrl).catch((e) => {
            console.error(`❌ loadURL threw [${widgetKey}]`, e?.message || e);
          });
        };

        tryLoad(1);

        console.log(`📱 Widget "${widgetKey}" loaded: ${widgetConfig.url}`);

        // Diagnóstico e garantia de foco
        view.webContents.on("did-finish-load", () => {
          console.log(`✅ did-finish-load: ${widgetKey}`);
          try { view.webContents.focus(); } catch (_) {}
        });
        view.webContents.on("did-fail-load", (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
          console.error(`❌ did-fail-load [${widgetKey}] code=${errorCode} desc=${errorDescription} url=${validatedURL} main=${isMainFrame}`);
          // Retry simples para falhas transitórias de rede/DNS
          if (isMainFrame && [ -105, -137, -21, -2 ].includes(errorCode)) {
            setTimeout(() => tryLoad(2), 1500);
          }
        });
        view.webContents.on("render-process-gone", (event, details) => {
          console.error(`⚠️ render-process-gone [${widgetKey}]`, details);
        });
      } catch (loadError) {
        console.error(
          `❌ Error loading widget "${widgetKey}":`,
          loadError.message
        );
        console.error(`❌ Full error:`, loadError);
        return null;
      }
    } else {
      console.error(`❌ No URL provided for widget "${widgetKey}"`);
      return null;
    }

    return view;
  } catch (error) {
    console.error(
      `❌ Error creating BrowserView for "${widgetKey}":`,
      error.message
    );
    console.error(`❌ Full error:`, error);
    return null;
  }
}

// -------------------------------------------
// LAYOUT FUNCTIONS
// -------------------------------------------
// Layout views function
function layoutViews() {
  if (!mainWindow) return;

  const [winWidth, winHeight] = mainWindow.getSize();
  const { topGap, gap } = LAYOUT_CONFIG;

  let cursorY = topGap;
  viewsLayout = []; // Reset: clear old positions

  console.log("🔄 Laying out widgets...");

  Object.entries(viewsConfig).forEach(([key, cfg]) => {
    const v = cfg.view;

    if (!v) return;

    const heightPx = cfg.visible ? resolveHeightPx(cfg, winHeight, 100) : 0;

    // Set bounds with scroll offset
    v.setBounds({
      x: 0,
      y: cursorY - scrollOffset,
      width: winWidth,
      height: heightPx,
    });

    // Store coordinates in layout
    viewsLayout.push({
      key,
      y: cursorY,
      height: heightPx,
    });

    console.log(`📐 Widget "${key}": y=${cursorY}, height=${heightPx}`);

    cursorY += heightPx + gap; // Advance cursor
  });

  // Calculate max scroll offset
  const totalContentHeight = cursorY;
  maxScrollOffset = Math.max(
    0,
    totalContentHeight - winHeight + LAYOUT_CONFIG.topGap
  );

  // Clamp scroll offset to valid range
  scrollOffset = Math.max(0, Math.min(scrollOffset, maxScrollOffset));

  console.log(
    `✅ Layout complete. Total height: ${cursorY}px, Scroll offset: ${scrollOffset}px`
  );
}

// -------------------------------------------
// SCROLL FUNCTIONS
// -------------------------------------------
function scrollUp(amount = scrollStep) {
  scrollOffset = Math.max(0, scrollOffset - amount);
  layoutViews();
  console.log(`📜 Scrolled up by ${amount}px. New offset: ${scrollOffset}px`);
}

function scrollDown(amount = scrollStep) {
  scrollOffset = Math.min(maxScrollOffset, scrollOffset + amount);
  layoutViews();
  console.log(`📜 Scrolled down by ${amount}px. New offset: ${scrollOffset}px`);
}

function scrollToTop() {
  scrollOffset = 0;
  layoutViews();
  console.log(`📜 Scrolled to top`);
}

function scrollToBottom() {
  scrollOffset = maxScrollOffset;
  layoutViews();
  console.log(`📜 Scrolled to bottom`);
}

function pageUp() {
  scrollUp(pageScrollStep);
}

function pageDown() {
  scrollDown(pageScrollStep);
}

// Scroll to next widget (horizontal navigation)
function scrollToNextWidget() {
  if (!mainWindow || viewsLayout.length === 0) return;

  const [winWidth, winHeight] = mainWindow.getSize();
  const windowTop = scrollOffset;
  const windowBottom = scrollOffset + winHeight;

  console.log(`🔄 Scrolling to next widget. Current offset: ${scrollOffset}px`);
  console.log(`📏 Window bounds: top=${windowTop}px, bottom=${windowBottom}px`);

  // Find the next widget that is not fully visible or not visible at all
  let targetWidget = null;

  for (let i = 0; i < viewsLayout.length; i++) {
    const widget = viewsLayout[i];
    const widgetTop = widget.y;
    const widgetBottom = widget.y + widget.height;

    // Check if widget is below current viewport
    if (widgetTop >= windowBottom) {
      targetWidget = widget;
      break;
    }

    // Check if widget is partially visible at the bottom
    if (widgetTop < windowBottom && widgetBottom > windowBottom) {
      targetWidget = widget;
      break;
    }
  }

  if (targetWidget) {
    // Calculate new scroll offset to position widget with half gap at bottom
    // Position the widget so there's half the gap between its bottom and window bottom
    const halfGap = LAYOUT_CONFIG.gap / 2;
    const newOffset = Math.max(
      0,
      targetWidget.y + targetWidget.height - winHeight + halfGap
    );
    scrollOffset = Math.min(newOffset, maxScrollOffset);
    layoutViews();
    console.log(
      `⬇️ Scrolled to next widget "${targetWidget.key}" at offset ${scrollOffset}px (positioned with ${halfGap}px gap at bottom)`
    );
  } else {
    // If no next widget found, scroll to bottom
    scrollToBottom();
    console.log(`⬇️ No next widget found, scrolled to bottom`);
  }
}

// Scroll to previous widget (horizontal navigation)
function scrollToPreviousWidget() {
  if (!mainWindow || viewsLayout.length === 0) return;

  const [winWidth, winHeight] = mainWindow.getSize();
  const windowTop = scrollOffset;
  const windowBottom = scrollOffset + winHeight;

  console.log(
    `🔄 Scrolling to previous widget. Current offset: ${scrollOffset}px`
  );
  console.log(`📏 Window bounds: top=${windowTop}px, bottom=${windowBottom}px`);

  // Find the previous widget that is not fully visible or not visible at all
  let targetWidget = null;

  // Search from bottom to top
  for (let i = viewsLayout.length - 1; i >= 0; i--) {
    const widget = viewsLayout[i];
    const widgetTop = widget.y;
    const widgetBottom = widget.y + widget.height;

    // Check if widget is above current viewport
    if (widgetBottom <= windowTop) {
      targetWidget = widget;
      break;
    }

    // Check if widget is partially visible at the top
    if (widgetTop < windowTop && widgetBottom > windowTop) {
      targetWidget = widget;
      break;
    }
  }

  if (targetWidget) {
    // Calculate new scroll offset to make the widget fully visible at the top
    const newOffset = Math.max(0, targetWidget.y - LAYOUT_CONFIG.topGap);
    scrollOffset = Math.min(newOffset, maxScrollOffset);
    layoutViews();
    console.log(
      `⬆️ Scrolled to previous widget "${targetWidget.key}" at offset ${scrollOffset}px`
    );
  } else {
    // If no previous widget found, scroll to top
    scrollToTop();
    console.log(`⬆️ No previous widget found, scrolled to top`);
  }
}

// -------------------------------------------
// SHORTCUT FUNCTIONS
// -------------------------------------------
// Register keyboard shortcuts for scrolling
function registerScrollShortcuts() {
  console.log("⌨️ Registering scroll shortcuts...");

  try {
    // Unregister all existing shortcuts first
    globalShortcut.unregisterAll();

    const shortcuts = ADVANCED_SETTINGS.shortcuts || {};

    // Scroll up/down
    const scrollUpKey = shortcuts.scrollUp || "Up";
    globalShortcut.register(`CommandOrControl+Alt+${scrollUpKey}`, () => {
      scrollUp();
    });

    const scrollDownKey = shortcuts.scrollDown || "Down";
    globalShortcut.register(`CommandOrControl+Alt+${scrollDownKey}`, () => {
      scrollDown();
    });

    // Page up/down
    const pageUpKey = shortcuts.pageUp || "PageUp";
    globalShortcut.register(`CommandOrControl+Alt+${pageUpKey}`, () => {
      pageUp();
    });

    const pageDownKey = shortcuts.pageDown || "PageDown";
    globalShortcut.register(`CommandOrControl+Alt+${pageDownKey}`, () => {
      pageDown();
    });

    // Home/End
    const scrollToTopKey = shortcuts.scrollToTop || "Home";
    globalShortcut.register(`CommandOrControl+Alt+${scrollToTopKey}`, () => {
      scrollToTop();
    });

    const scrollToBottomKey = shortcuts.scrollToBottom || "End";
    globalShortcut.register(`CommandOrControl+Alt+${scrollToBottomKey}`, () => {
      scrollToBottom();
    });

    // Widget navigation shortcuts (Left/Right arrows)
    globalShortcut.register("CommandOrControl+Alt+Right", () => {
      console.log("➡️ Next widget shortcut triggered");
      scrollToNextWidget();
    });

    globalShortcut.register("CommandOrControl+Alt+Left", () => {
      console.log("⬅️ Previous widget shortcut triggered");
      scrollToPreviousWidget();
    });

    // Toggle stealth shortcut
    const toggleStealthKey = shortcuts.toggleStealth || "F1";
    globalShortcut.register(toggleStealthKey, () => {
      console.log("🕵️ Toggle stealth shortcut triggered");
      // Toggle stealth functionality
      const currentStealthState =
        ADVANCED_SETTINGS.viewSettings?.stealthMode?.enabled ?? true;
      const newStealthState = !currentStealthState;

      // Update settings
      ADVANCED_SETTINGS.viewSettings.stealthMode.enabled = newStealthState;
      saveAdvancedSettings(ADVANCED_SETTINGS);

      // Apply/remove stealth
      if (newStealthState) {
        applyStealthToViews();
      } else {
        removeStealthFromViews();
      }

      console.log(
        `🕵️ Stealth ${newStealthState ? "enabled" : "disabled"} via shortcut`
      );
    });

    // Toggle always on top shortcut
    globalShortcut.register("CommandOrControl+Alt+T", () => {
      console.log("🔝 Toggle always on top shortcut triggered");
      if (mainWindow) {
        const currentState = mainWindow.isAlwaysOnTop();
        mainWindow.setAlwaysOnTop(!currentState);

        // Update advanced settings
        ADVANCED_SETTINGS.viewSettings.alwaysOnTop = !currentState;
        saveAdvancedSettings(ADVANCED_SETTINGS);

        console.log(
          `🔝 Always on top ${!currentState ? "enabled" : "disabled"}`
        );
      }
    });

    // Minimize/restore window shortcut
    globalShortcut.register("CommandOrControl+Alt+M", () => {
      console.log("📦 Minimize/restore window shortcut triggered");
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
          console.log("📦 Window restored");
        } else {
          mainWindow.minimize();
          console.log("📦 Window minimized");
        }
      }
    });

    console.log("✅ All shortcuts registered");
  } catch (error) {
    console.error("❌ Error registering shortcuts:", error);
  }
}

// -------------------------------------------
// INITIALIZATION FUNCTIONS
// -------------------------------------------
// Initialize widgets
function initializeWidgets() {
  console.log("🚀 Initializing widgets...");

  // Remove all existing views and destroy their webContents
  Object.values(viewsConfig).forEach((config) => {
    if (config.view && mainWindow) {
      const view = config.view;
      // Remove da janela principal
      mainWindow.removeBrowserView(view);

      // Destroi o webContents para parar todos os processos
      if (view.webContents && !view.webContents.isDestroyed()) {
        console.log(`🔥 Destruindo webContents durante reinicialização`);
        view.webContents.destroy();
      }
    }
  });

  // Clear viewsConfig
  viewsConfig = {};

  // Load widgets configuration
  const widgets = loadWidgetsConfig();

  // Create views for each widget
  Object.entries(widgets).forEach(([key, widgetConfig]) => {
    if (widgetConfig.visible) {
      const view = createWidgetView(key, widgetConfig);
      if (view) {
        // Store in viewsConfig
        viewsConfig[key] = {
          ...widgetConfig,
          view: view,
        };

        // Add to main window
        mainWindow.addBrowserView(view);
        console.log(`✅ Widget "${key}" adicionado à janela principal`);
      }
    }
  });

  // Load external userSites from persisted settings (model: { key, url, height, name })
  try {
    const persisted = loadSettings();
    const rawSites = Array.isArray(persisted.userSites) ? persisted.userSites : [];

    // Migration: various legacy forms -> { key, url, height, name }
    let needsPersist = false;
    const sites = rawSites.map((entry, idx) => {
      if (typeof entry === "string") {
        needsPersist = true;
        return { key: `web_${idx + 1}` , url: entry, height: 800, name: "" };
      }
      const url = entry?.url || "";
      const height = Math.max(100, Number(entry?.height) || 800);
      let key = entry?.key;
      if (!key) { key = `web_${idx + 1}`; needsPersist = true; }
      const name = typeof entry?.name === "string" ? entry.name : "";
      return { key, url, height, name };
    });

    if (needsPersist) {
      const updated = { ...persisted, userSites: sites };
      saveSettings(updated);
      console.log("🔧 Migrated userSites to {key,url,height,name} format and persisted");
    }

    sites.forEach((site) => {
      if (!site || !site.url) return;
      const key = site.key;
      const heightPx = Math.max(100, Number(site.height) || 800);
      const view = createWidgetView(key, {
        url: site.url,
        height: heightPx,
        visible: true,
      });
      if (view && mainWindow) {
        viewsConfig[key] = { url: site.url, height: heightPx, visible: true, view };
        mainWindow.addBrowserView(view);
        console.log(`✅ External site view added: ${site.url} (key=${key}, h=${heightPx})`);
      }
    });
  } catch (e) {
    console.warn("⚠️ Unable to load userSites:", e?.message);
  }

  console.log(`✅ Initialized ${Object.keys(viewsConfig).length} widgets`);

  // Layout the views
  layoutViews();
}

// -------------------------------------------
// WINDOW FUNCTIONS
// -------------------------------------------
// Calculate window dimensions and position
function calculateWindowDimensions() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;

  // Use default width from APP_CONFIG
  const windowWidth = APP_CONFIG.window.width;
  const windowHeight = workArea.height; // Usar toda a altura da work area
  const x = workArea.width - windowWidth - 20; // 20px margin from right
  const y = workArea.y; // Começar do topo da work area (sem margem)

  return { width: windowWidth, height: windowHeight, x, y };
}

// Create the main window
function createMainWindow() {
  console.log("🚀 Creating main window...");

  const dimensions = calculateWindowDimensions();

  mainWindow = new BrowserWindow({
    width: dimensions.width,
    height: dimensions.height,
    x: dimensions.x,
    y: dimensions.y,
    show: false,
    transparent: true,
    frame: APP_CONFIG.window.frame,
    skipTaskbar: APP_CONFIG.window.skipTaskbar,
    resizable: APP_CONFIG.window.resizable,
    alwaysOnTop:
      ADVANCED_SETTINGS.viewSettings?.alwaysOnTop ??
      APP_CONFIG.window.alwaysOnTop,
    invisibile: true,
    backgroundColor: "#00000000",
    title: "Stealth Widget App", // Título específico para o plugin nativo
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the main page
  const mainPagePath = getAppPath(
    path.join("src", "pages", "placeholder", "index.html")
  );
  mainWindow.loadFile(mainPagePath);

  // Show window when ready
  mainWindow.once("ready-to-show", () => {
    console.log("✅ Main window ready");
    mainWindow.show();

    // Initialize widgets after window is ready
    setTimeout(() => {
      initializeWidgets();

      // Aplicar stealth após os widgets serem inicializados (se habilitado nas configurações)
      if (ADVANCED_SETTINGS.viewSettings?.stealthMode?.autoStart !== false) {
        setTimeout(() => {
          console.log("🕵️ Aplicando stealth na janela principal...");
          const stealthResult = applyStealthToViews();
          if (stealthResult) {
            console.log("✅ Stealth aplicado com sucesso na inicialização");
          } else {
            console.log("⚠️ Falha ao aplicar stealth na inicialização");
          }
        }, 500); // Delay adicional para garantir que os widgets estejam carregados
      } else {
        console.log("🕵️ Stealth auto-start desabilitado nas configurações");
      }
    }, 100); // Small delay to ensure window is fully ready
  });

  // Handle window close - minimize to tray instead of closing
  mainWindow.on("close", (event) => {
    // Prevent default close behavior
    event.preventDefault();

    // Hide window instead of closing
    if (mainWindow) {
      mainWindow.hide();
      console.log("📦 Window hidden to tray");
    }
  });

  // Handle window closed (when app is actually quitting)
  mainWindow.on("closed", () => {
    // Remover stealth antes de fechar
    if (stealthManager) {
      console.log("👁️ Removendo stealth antes de fechar...");
      removeStealthFromViews();
    }
    mainWindow = null;
  });
}

// -------------------------------------------
// IPC HANDLERS
// -------------------------------------------
const { ipcMain } = require("electron");

// Handler para obter widgets ativos
ipcMain.handle("get-active-widgets", () => {
  return ACTIVE_WIDGETS;
});

// Handler para obter configuração de widgets
ipcMain.handle("get-widgets-config", () => {
  return viewsConfig;
});

// Handler para obter todos os widgets disponíveis
ipcMain.handle("get-all-widgets-config", () => {
  return loadAllWidgetsConfig();
});

// ===== Settings persistence (basic settings + userSites) =====
ipcMain.handle("settings:get", () => {
  return loadSettings();
});

ipcMain.handle("settings:update", async (event, partial) => {
  try {
    const current = loadSettings();
    const merged = {
      ...current,
      ...partial,
      stealth: { ...(current.stealth || {}), ...(partial?.stealth || {}) },
      shortcuts: { ...(current.shortcuts || {}), ...(partial?.shortcuts || {}) },
    };

    if (partial?.alwaysOnTop !== undefined && mainWindow) {
      mainWindow.setAlwaysOnTop(!!partial.alwaysOnTop);
    }

    if (partial?.autoStart !== undefined) {
      try {
        if (partial.autoStart) {
          await enableAutoStart();
        } else {
          await disableAutoStart();
        }
      } catch (_) {}
    }

    const ok = saveSettings(merged);
    return ok ? { success: true, settings: merged } : { success: false };
  } catch (error) {
    console.error("Erro em settings:update:", error);
    return { success: false, error: error.message };
  }
});

// Handler para adicionar widget à lista ativa
ipcMain.handle("add-active-widget", (event, widgetKey) => {
  console.log(`🔧 Tentando adicionar widget "${widgetKey}"`);

  if (!ACTIVE_WIDGETS.includes(widgetKey)) {
    const newActiveWidgets = [...ACTIVE_WIDGETS, widgetKey];
    updateActiveWidgets(newActiveWidgets);
    console.log("✅ Widget adicionado à lista ativa:", widgetKey);

    // Carrega a configuração do widget
    const allWidgets = loadAllWidgetsConfig();
    console.log(`📋 Widgets disponíveis:`, Object.keys(allWidgets));
    console.log(`🔍 Procurando por "${widgetKey}" nos widgets disponíveis`);

    if (allWidgets[widgetKey]) {
      console.log(`✅ Configuração encontrada para "${widgetKey}"`);
      viewsConfig[widgetKey] = allWidgets[widgetKey];

      // Cria a view usando BrowserView unificado
      const view = createWidgetView(widgetKey, viewsConfig[widgetKey]);
      console.log(
        `🔍 BrowserView criada para "${widgetKey}":`,
        view ? "SUCCESS" : "FAILED"
      );

      if (view && mainWindow) {
        viewsConfig[widgetKey].view = view;
        mainWindow.addBrowserView(view);
        console.log(`✅ Widget "${widgetKey}" carregado dinamicamente`);

        // Atualiza o layout
        layoutViews();

        return { success: true };
      } else {
        console.error(
          `❌ Erro ao criar BrowserView para widget "${widgetKey}"`
        );
        console.error(`   - view:`, view);
        console.error(`   - mainWindow:`, mainWindow ? "EXISTS" : "NULL");
        // Remove da lista se falhou
        const newActiveWidgets = ACTIVE_WIDGETS.filter((w) => w !== widgetKey);
        updateActiveWidgets(newActiveWidgets);
        delete viewsConfig[widgetKey];
        return { success: false, error: "Erro ao criar view do widget" };
      }
    } else {
      console.error(`❌ Configuração não encontrada para "${widgetKey}"`);
      // Remove da lista se falhou
      const newActiveWidgets = ACTIVE_WIDGETS.filter((w) => w !== widgetKey);
      updateActiveWidgets(newActiveWidgets);
      return { success: false, error: "Configuração do widget não encontrada" };
    }
  }
  return { success: false, error: "Widget já está ativo" };
});

// Handler para remover widget da lista ativa
ipcMain.handle("remove-active-widget", (event, widgetKey) => {
  console.log(`🔧 Tentando remover widget "${widgetKey}"`);

  const index = ACTIVE_WIDGETS.indexOf(widgetKey);
  if (index > -1 && widgetKey !== "organizer") {
    // Proteção: não permite remover organizador
    const newActiveWidgets = ACTIVE_WIDGETS.filter((w) => w !== widgetKey);
    updateActiveWidgets(newActiveWidgets);
    console.log("❌ Widget removido da lista ativa:", widgetKey);

    // Remove a view do layout e destroi completamente
    if (viewsConfig[widgetKey] && viewsConfig[widgetKey].view) {
      const view = viewsConfig[widgetKey].view;
      console.log(
        `🔍 Removendo view para "${widgetKey}":`,
        view ? "EXISTS" : "NULL"
      );

      if (mainWindow && view) {
        // Remove da janela principal
        mainWindow.removeBrowserView(view);
        console.log(
          `✅ BrowserView removida da janela principal para "${widgetKey}"`
        );

        // Destroi completamente o webContents para parar todos os processos (áudio, vídeo, etc.)
        if (view.webContents && !view.webContents.isDestroyed()) {
          console.log(`🔥 Destruindo webContents para "${widgetKey}"`);
          view.webContents.destroy();
          console.log(`✅ WebContents destruído para "${widgetKey}"`);
        }
      } else {
        console.error(`❌ Erro ao remover BrowserView para "${widgetKey}"`);
        console.error(`   - mainWindow:`, mainWindow ? "EXISTS" : "NULL");
        console.error(`   - view:`, view ? "EXISTS" : "NULL");
      }
      delete viewsConfig[widgetKey];
    } else {
      console.log(`ℹ️ Nenhuma view encontrada para "${widgetKey}"`);
    }

    // Remove o rótulo persistido (se existir) e a entrada de userSites
    try {
      const settings = loadSettings();
      if (settings.widgetLabels && settings.widgetLabels[widgetKey]) {
        delete settings.widgetLabels[widgetKey];
      }
      if (Array.isArray(settings.userSites)) {
        settings.userSites = settings.userSites.filter((s) => (s?.key || "") !== widgetKey);
      }
      saveSettings(settings);
    } catch (_) {}

    // Recarrega o layout
    layoutViews();

    return { success: true };
  }
  console.log(
    `❌ Widget "${widgetKey}" não pode ser removido (não encontrado ou é organizador)`
  );
  return {
    success: false,
    error: "Widget não encontrado ou não pode ser removido",
  };
});

// Handler para reordenar views
ipcMain.handle("reorder-views", (event, newOrder) => {
  console.log("🔄 Reordenando widgets:", newOrder);

  // Atualiza a ordem dos widgets ativos
  updateActiveWidgets(newOrder);

  // Reorganiza viewsConfig baseado na nova ordem
  const reorderedConfig = {};
  newOrder.forEach((key) => {
    if (viewsConfig[key]) {
      reorderedConfig[key] = viewsConfig[key];
    }
  });
  viewsConfig = reorderedConfig;

  // Recarrega o layout
  layoutViews();

  return { success: true };
});

// Handler para aplicar/remover stealth
ipcMain.handle("toggle-stealth", (event, action) => {
  console.log(`🔧 Toggle stealth: ${action}`);

  if (!stealthManager) {
    return { success: false, error: "Plugin nativo stealth não disponível" };
  }

  try {
    let result = false;

    if (action === "enable") {
      result = applyStealthToViews();
      ADVANCED_SETTINGS.viewSettings.stealthMode.enabled = true;
      console.log(`✅ Stealth ${result ? "aplicado" : "não aplicado"}`);
    } else if (action === "disable") {
      result = removeStealthFromViews();
      ADVANCED_SETTINGS.viewSettings.stealthMode.enabled = false;
      console.log(`✅ Stealth ${result ? "removido" : "não removido"}`);
    } else {
      return {
        success: false,
        error: 'Ação inválida. Use "enable" ou "disable"',
      };
    }

    // Update tray menu with new stealth status
    updateTrayStealthStatus();

    return { success: result };
  } catch (error) {
    console.error("❌ Erro ao toggle stealth:", error.message);
    return { success: false, error: error.message };
  }
});

// Handler para obter status do stealth
ipcMain.handle("get-stealth-status", () => {
  if (!stealthManager) {
    return { active: false, count: 0 };
  }

  return {
    active: stealthManager.isStealthActive(),
    count: stealthManager.getStealthedWindowsCount(),
  };
});

// Handler para adicionar views de URLs externas
ipcMain.handle("add-view", (event, { key, config }) => {
  console.log(
    `🔧 Tentando adicionar view externa "${key}" com config:`,
    config
  );

  try {
    // Adiciona à lista de widgets ativos
    if (!ACTIVE_WIDGETS.includes(key)) {
      const newActiveWidgets = [...ACTIVE_WIDGETS, key];
      updateActiveWidgets(newActiveWidgets);
      console.log("✅ Widget externo adicionado à lista ativa:", key);
    }

    // Armazena a configuração
    viewsConfig[key] = {
      ...config,
      view: null,
    };

    // Cria a BrowserView para a URL externa
    const view = createWidgetView(key, config);
    console.log(
      `🔍 BrowserView criada para "${key}":`,
      view ? "SUCCESS" : "FAILED"
    );

    if (view && mainWindow) {
      viewsConfig[key].view = view;
      mainWindow.addBrowserView(view);
      console.log(`✅ Widget externo "${key}" carregado dinamicamente`);

      // Atualiza o layout
      layoutViews();

      // Persiste dados em settings (rótulo e lista userSites)
      try {
        const settings = loadSettings();
        const labels = settings.widgetLabels || {};
        if (config && typeof config.name === "string" && config.name.trim()) {
          labels[key] = config.name.trim();
          settings.widgetLabels = labels;
        }
        // Atualiza userSites com a entrada completa
        const sites = Array.isArray(settings.userSites) ? settings.userSites : [];
        if (!sites.some((s) => (s?.key || "") === key)) {
          sites.push({ key, url: config.url, height: config.height, name: config.name || "" });
          settings.userSites = sites;
        }
        saveSettings(settings);
      } catch (_) {}

      return { success: true };
    } else {
      console.error(`❌ Erro ao criar view para widget externo "${key}"`);
      console.error(`   - view:`, view);
      console.error(`   - mainWindow:`, mainWindow ? "EXISTS" : "NULL");

      // Remove da lista se falhou
      const newActiveWidgets = ACTIVE_WIDGETS.filter((w) => w !== key);
      updateActiveWidgets(newActiveWidgets);
      delete viewsConfig[key];

      return { success: false, error: "Erro ao criar view do widget externo" };
    }
  } catch (error) {
    console.error(`❌ Erro ao adicionar view externa "${key}":`, error.message);

    // Remove da lista se falhou
    const newActiveWidgets = ACTIVE_WIDGETS.filter((w) => w !== key);
    updateActiveWidgets(newActiveWidgets);
    delete viewsConfig[key];

    return { success: false, error: error.message };
  }
});

// Compat: APIs chamadas pela página de settings
ipcMain.handle("stealth:api:enable", () => {
  const result = applyStealthToViews();
  if (ADVANCED_SETTINGS?.viewSettings?.stealthMode) {
    ADVANCED_SETTINGS.viewSettings.stealthMode.enabled = true;
    saveAdvancedSettings(ADVANCED_SETTINGS);
    updateTrayStealthStatus();
  }
  return { success: !!result };
});

ipcMain.handle("stealth:api:disable", () => {
  const result = removeStealthFromViews();
  if (ADVANCED_SETTINGS?.viewSettings?.stealthMode) {
    ADVANCED_SETTINGS.viewSettings.stealthMode.enabled = false;
    saveAdvancedSettings(ADVANCED_SETTINGS);
    updateTrayStealthStatus();
  }
  return { success: !!result };
});

// Handler para recarregar widgets após mudanças
ipcMain.handle("reload-widgets", () => {
  console.log("🔄 Recarregando widgets...");

  // Destroi todas as views existentes
  Object.values(viewsConfig).forEach((config) => {
    if (config.view && mainWindow) {
      const view = config.view;

      // Para BrowserView, remove via removeBrowserView e destrói webContents
      if (view.webContents && view.webContents.id) {
        // É uma BrowserView
        mainWindow.removeBrowserView(view);

        // Destroi o webContents para parar todos os processos
        if (!view.webContents.isDestroyed()) {
          console.log(`🔥 Destruindo webContents durante reload`);
          view.webContents.destroy();
        }
      }
    }
  });

  // Limpa a configuração
  viewsConfig = {};

  // Recarrega widgets
  initializeWidgets();

  return { success: true };
});

// Handler para obter configurações avançadas
ipcMain.handle("get-advanced-settings", () => {
  return ADVANCED_SETTINGS;
});

// Handler para salvar configurações avançadas
ipcMain.handle("save-advanced-settings", (event, newSettings) => {
  console.log("💾 Salvando configurações avançadas:", newSettings);

  try {
    ADVANCED_SETTINGS = { ...ADVANCED_SETTINGS, ...newSettings };
    const success = saveAdvancedSettings(ADVANCED_SETTINGS);

    if (success) {
      // Re-registrar shortcuts se as configurações de teclas mudaram
      if (newSettings.shortcuts) {
        console.log("⌨️ Re-registrando shortcuts com novas configurações...");
        globalShortcut.unregisterAll();
        registerScrollShortcuts();
      }

      // Recriar janela se configurações de view mudaram
      if (newSettings.viewSettings && mainWindow) {
        console.log("🔄 Recriando janela com novas configurações...");
        const newDimensions = calculateWindowDimensions();
        mainWindow.setBounds({
          width: newDimensions.width,
          height: newDimensions.height,
          x: newDimensions.x,
          y: newDimensions.y,
        });

        // Atualizar alwaysOnTop se mudou
        if (newSettings.viewSettings.alwaysOnTop !== undefined) {
          mainWindow.setAlwaysOnTop(newSettings.viewSettings.alwaysOnTop);
        }
      }

      return { success: true };
    } else {
      return { success: false, error: "Erro ao salvar configurações" };
    }
  } catch (error) {
    console.error("❌ Erro ao salvar configurações avançadas:", error.message);
    return { success: false, error: error.message };
  }
});

// Handler para obter status do stealth
ipcMain.handle("get-stealth-mode-status", () => {
  return {
    enabled: ADVANCED_SETTINGS.viewSettings?.stealthMode?.enabled ?? true,
    autoStart: ADVANCED_SETTINGS.viewSettings?.stealthMode?.autoStart ?? true,
  };
});

// Handler para toggle always on top
ipcMain.handle("toggle-always-on-top", () => {
  if (mainWindow) {
    const currentState = mainWindow.isAlwaysOnTop();
    mainWindow.setAlwaysOnTop(!currentState);

    // Update advanced settings
    ADVANCED_SETTINGS.viewSettings.alwaysOnTop = !currentState;
    saveAdvancedSettings(ADVANCED_SETTINGS);

    console.log(`🔝 Always on top ${!currentState ? "enabled" : "disabled"}`);
    return { success: true, alwaysOnTop: !currentState };
  }
  return { success: false, error: "Main window not available" };
});

// Handler para minimizar janela
ipcMain.handle("minimize-window", () => {
  if (mainWindow) {
    mainWindow.minimize();
    console.log("📦 Window minimized");
    return { success: true };
  }
  return { success: false, error: "Main window not available" };
});

// Handler para obter status do always on top
ipcMain.handle("get-always-on-top-status", () => {
  if (mainWindow) {
    return { alwaysOnTop: mainWindow.isAlwaysOnTop() };
  }
  return { alwaysOnTop: false };
});

// Auto-start handlers
ipcMain.handle("enable-auto-start", async () => {
  return await enableAutoStart();
});

ipcMain.handle("disable-auto-start", async () => {
  return await disableAutoStart();
});

ipcMain.handle("get-auto-start-status", async () => {
  const enabled = await isAutoStartEnabled();
  return { enabled };
});

ipcMain.handle("toggle-auto-start", async (event, action) => {
  console.log(`🚀 Toggle auto-start: ${action}`);

  if (action === "enable") {
    return await enableAutoStart();
  } else if (action === "disable") {
    return await disableAutoStart();
  } else {
    return {
      success: false,
      error: 'Ação inválida. Use "enable" ou "disable"',
    };
  }
});

// -------------------------------------------
// TRAY FUNCTIONS
// -------------------------------------------

// Force quit function to properly close the app
function forceQuit() {
  console.log("🚪 Forçando quit completo do app...");

  // Clean up stealth first
  if (stealthManager) {
    console.log("👁️ Removendo stealth antes de sair...");
    removeStealthFromViews();
  }

  // Clean up all views and their webContents
  Object.values(viewsConfig).forEach((config) => {
    if (
      config.view &&
      config.view.webContents &&
      !config.view.webContents.isDestroyed()
    ) {
      console.log("🔥 Destruindo webContents durante quit...");
      config.view.webContents.destroy();
    }
  });

  // Clear viewsConfig
  viewsConfig = {};

  // Clean up shortcuts
  globalShortcut.unregisterAll();

  // Clean up tray
  if (tray) {
    tray.destroy();
    tray = null;
    console.log("🧹 System tray cleaned up");
  }

  // Force quit the app
  app.exit(0);
}

// Create system tray
function createTray() {
  console.log("🔧 Creating system tray...");

  // Use the smallest icon from the build folder
  let iconPath;
  if (app.isPackaged) {
    // In production, use the icon from extraResources
    iconPath = path.join(process.resourcesPath, "build", "icon-16.png");
  } else {
    // In development, use the icon from build folder
    iconPath = path.join(__dirname, "..", "..", "build", "icon-16.png");
  }

  // Create tray with icon
  try {
    tray = new Tray(iconPath);
    console.log("✅ System tray created successfully");
  } catch (error) {
    console.error("❌ Error creating system tray:", error);
    console.log("🔧 Trying with fallback icon...");
    // Fallback to a different icon if the main one fails
    const fallbackIconPath = app.isPackaged
      ? path.join(process.resourcesPath, "build", "icon.png")
      : path.join(__dirname, "..", "..", "build", "icon.png");
    try {
      tray = new Tray(fallbackIconPath);
      console.log("✅ System tray created with fallback icon");
    } catch (fallbackError) {
      console.error(
        "❌ Failed to create tray with fallback icon:",
        fallbackError
      );
      return;
    }
  }

  // Create context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Stealth Widget App",
      enabled: false,
    },
    { type: "separator" },
    {
      label: `Stealth: ${
        ADVANCED_SETTINGS.viewSettings?.stealthMode?.enabled
          ? "Ativo"
          : "Inativo"
      }`,
      enabled: false,
      id: "stealth-status",
    },
    { type: "separator" },
    {
      label: "Iniciar com Windows",
      type: "checkbox",
      checked: false,
      id: "auto-start-status",
      click: async () => {
        try {
          // Get current status
          const currentStatus = await isAutoStartEnabled();
          const newAction = currentStatus ? "disable" : "enable";

          // Toggle auto-start
          const result =
            newAction === "enable"
              ? await enableAutoStart()
              : await disableAutoStart();

          if (result.success) {
            // Update tray menu
            updateTrayAutoStartStatus();
          }
        } catch (error) {
          console.error("Erro ao alternar auto-start:", error);
        }
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        forceQuit();
      },
    },
  ]);

  // Set tooltip
  tray.setToolTip("Stealth Widget App - Clique para minimizar/restaurar");

  // Set context menu
  tray.setContextMenu(contextMenu);

  // Handle tray click (minimize/restore window)
  tray.on("click", () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.minimize();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  console.log("✅ System tray created successfully");
}

// Update stealth status in tray menu
function updateTrayStealthStatus() {
  if (tray) {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Stealth Widget App",
        enabled: false,
      },
      { type: "separator" },
      {
        label: `Stealth: ${
          ADVANCED_SETTINGS.viewSettings?.stealthMode?.enabled
            ? "Ativo"
            : "Inativo"
        }`,
        enabled: false,
        id: "stealth-status",
      },
      { type: "separator" },
      {
        label: "Iniciar com Windows",
        type: "checkbox",
        checked: false,
        id: "auto-start-status",
        click: async () => {
          try {
            // Get current status
            const currentStatus = await isAutoStartEnabled();
            const newAction = currentStatus ? "disable" : "enable";

            // Toggle auto-start
            const result =
              newAction === "enable"
                ? await enableAutoStart()
                : await disableAutoStart();

            if (result.success) {
              // Update tray menu
              updateTrayAutoStartStatus();
            }
          } catch (error) {
            console.error("Erro ao alternar auto-start:", error);
          }
        },
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          forceQuit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);
  }
}

// Update auto-start status in tray menu
async function updateTrayAutoStartStatus() {
  if (tray) {
    try {
      const enabled = await isAutoStartEnabled();
      const contextMenu = Menu.buildFromTemplate([
        {
          label: "Stealth Widget App",
          enabled: false,
        },
        { type: "separator" },
        {
          label: `Stealth: ${
            ADVANCED_SETTINGS.viewSettings?.stealthMode?.enabled
              ? "Ativo"
              : "Inativo"
          }`,
          enabled: false,
          id: "stealth-status",
        },
        { type: "separator" },
        {
          label: "Iniciar com Windows",
          type: "checkbox",
          checked: enabled,
          id: "auto-start-status",
          click: async () => {
            try {
              // Get current status
              const currentStatus = await isAutoStartEnabled();
              const newAction = currentStatus ? "disable" : "enable";

              // Toggle auto-start
              const result =
                newAction === "enable"
                  ? await enableAutoStart()
                  : await disableAutoStart();

              if (result.success) {
                // Update tray menu
                updateTrayAutoStartStatus();
              }
            } catch (error) {
              console.error("Erro ao alternar auto-start:", error);
            }
          },
        },
        { type: "separator" },
        {
          label: "Quit",
          click: () => {
            forceQuit();
          },
        },
      ]);

      tray.setContextMenu(contextMenu);
    } catch (error) {
      console.error("Erro ao atualizar status do auto-start no tray:", error);
    }
  }
}

// -------------------------------------------
// PROCESS CONFIGURATION
// -------------------------------------------
// Configure process name and identification
function configureProcessIdentity() {
  try {
    // Set process title for better identification in Task Manager
    process.title = `Stealth Widget App v${APP_CONFIG.version}`;

    console.log(`🏷️ Process configured: ${process.title}`);
    console.log(`📋 Process ID: ${process.pid}`);
  } catch (error) {
    console.error("❌ Error configuring process identity:", error.message);
  }
}

// -------------------------------------------
// APP EVENTS
// -------------------------------------------
// App event handlers
app.whenReady().then(() => {
  console.log("🚀 App is ready, starting initialization...");
  console.log("📦 App is packaged:", app.isPackaged);
  console.log("📂 Resources path:", process.resourcesPath);

  // Configure process identity first
  configureProcessIdentity();

  // Load advanced settings first
  ADVANCED_SETTINGS = loadAdvancedSettings();
  console.log("⚙️ Advanced settings loaded:", ADVANCED_SETTINGS);

  // Load settings and update ACTIVE_WIDGETS (com fallback)
  const settings = loadSettings();
  ACTIVE_WIDGETS = Array.isArray(settings.activeWidgets)
    ? settings.activeWidgets
    : ["organizer", "clock", "gemini"]; // fallback seguro se ausente
  console.log("🎯 Active widgets loaded from settings:", ACTIVE_WIDGETS);

  // Initialize auto-launcher
  initializeAutoLauncher();

  createMainWindow();

  // Create system tray
  createTray();

  // Register scroll shortcuts
  registerScrollShortcuts();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Handle window close events
app.on("window-all-closed", (event) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.hide();
  }
});

app.on("will-quit", () => {
  // Clean up shortcuts
  globalShortcut.unregisterAll();

  // Clean up tray
  if (tray) {
    tray.destroy();
    tray = null;
    console.log("🧹 System tray cleaned up");
  }
});

app.on("before-quit", (event) => {
  console.log("👋 App is quitting...");

  // Prevent default quit behavior to allow cleanup
  event.preventDefault();

  // Force quit with proper cleanup
  forceQuit();
});

// Export for potential external use
module.exports = {
  createMainWindow,
  getAppPath,
};
