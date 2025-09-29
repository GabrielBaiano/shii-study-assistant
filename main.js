const { app, BrowserWindow, WebContentsView, screen, globalShortcut, ipcMain, Tray, Menu, nativeImage, shell } = require("electron");
const fs = require("fs");
const path = require("path");
const { defaultBanners, bannerSettings } = require("./src/banners/banners-config");

// Helper function to get correct path for both dev and build
function getAppPath(relativePath) {
  // In development, __dirname points to the project root
  // In build, __dirname points to the app.asar directory
  if (app.isPackaged) {
    // In packaged app, resources are in app.asar.unpacked or in the same directory
    // Try multiple possible locations for the app resources
    const possiblePaths = [
      path.join(process.resourcesPath, 'app', relativePath),
      path.join(process.resourcesPath, relativePath),
      path.join(__dirname, relativePath),
      path.join(process.resourcesPath, 'app.asar.unpacked', relativePath)
    ];
    
    // Return the first path that exists, or the first one if none exist
    for (const possiblePath of possiblePaths) {
      try {
        if (fs.existsSync(possiblePath)) {
          console.log(`✅ Found resource at: ${possiblePath}`);
          return possiblePath;
        }
      } catch (e) {
        // Continue to next path
      }
    }
    
    console.log(`⚠️ Resource not found, using fallback path: ${possiblePaths[0]}`);
    return possiblePaths[0];
  } else {
    // In development, use __dirname
    return path.join(__dirname, relativePath);
  }
}

// Importar módulo stealth nativo
let stealthManager;
try {
  const stealthPath = getAppPath(path.join("src", "native", "index.js"));
  stealthManager = require(stealthPath);
  console.log("✅ Módulo stealth nativo carregado com sucesso");
} catch (error) {
  console.log("⚠️ Módulo stealth não disponível:", error.message);
  stealthManager = null;
}

// Global state
let mainWindow;
let webContentViews = [];
let bannerViews = []; // Array para armazenar os banners
let offset = 0;
let targetOffset = 0;
let scrolling = false;
let isAppVisible = true;
let settingsWindow = null;
let tray = null;

// App settings with defaults
let appSettings = {
  alwaysOnTop: true,
  autoStart: false,
  scrollSpeed: 100,
  shortcuts: {
    scrollUp: "CommandOrControl+Alt+Up",
    scrollDown: "CommandOrControl+Alt+Down",
    toggleLock: "CommandOrControl+Alt+L",
    toggleMinimize: "CommandOrControl+Alt+M",
    pageLeft: "CommandOrControl+Alt+Left",
    pageRight: "CommandOrControl+Alt+Right",
    lock: "CommandOrControl+Alt+L",
    minimize: "CommandOrControl+Alt+M",
  },
  userSites: [],
  banners: {
    enabled: true,
    enabledBanners: ['gabriel-banner', 'coffee-banner'], // IDs dos banners habilitados
    height: 15, // altura total do banner (ocupa todo o espaço)
    containerHeight: 15, // espaço total que o banner pode consumir
    theme: 'default'
  },
  stealth: {
    enabled: true, // Status do modo stealth (ativado por padrão)
    autoStart: true, // Ativar automaticamente ao iniciar o app
    showInTray: true // Mostrar status no tray
  },
};

// Size and positioning configs
let CONTENT_WIDTH;
let CONTENT_HEIGHT;
let CONTENT_X;
let CONTENT_Y;

// Static sources list (edit here to add fixed entries first)
const staticSources = [
  { label: 'Gemini', source: 'file://' + getAppPath(path.join('src', 'pages', 'gemini', 'index.html')) },
  { label: 'Pomodoro', source: 'file://' + getAppPath(path.join('src', 'pages', 'pomodoro', 'index.html')) },
];
const placeholderPage = 'file://' + getAppPath(path.join('src', 'pages', 'placeholder', 'index.html'));

// Settings helpers
function getSettingsFilePath() {
  try {
    const dir = app.getPath('userData');
    return path.join(dir, 'settings.json');
  } catch {
    return path.join(__dirname, 'settings.json');
  }
}

// Apply settings changes dynamically without restart
function applySettingsChanges(previous, current) {
  console.log('🔄 Aplicando mudanças de configuração dinamicamente...');
  
  // Always on top changes
  if (previous.alwaysOnTop !== current.alwaysOnTop) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setAlwaysOnTop(current.alwaysOnTop);
      console.log(`✅ Always on top ${current.alwaysOnTop ? 'ativado' : 'desativado'}`);
    }
  }

  // Auto-start changes
  if (previous.autoStart !== current.autoStart) {
    setAutoStart(current.autoStart);
    console.log(`✅ Auto-start ${current.autoStart ? 'ativado' : 'desativado'}`);
  }

  // Banner settings changes
  if (JSON.stringify(previous.banners) !== JSON.stringify(current.banners)) {
    console.log('🎯 Configurações de banners alteradas, recriando...');
    recreateBannerViews();
  }

  // User sites changes (new pages added/removed)
  if (JSON.stringify(previous.userSites) !== JSON.stringify(current.userSites)) {
    console.log('📄 Páginas do usuário alteradas, recriando todas as views...');
    // Delay para garantir que a janela esteja pronta
    setTimeout(() => {
      recreateAllViews();
    }, 100);
  }

  // Stealth settings changes
  if (JSON.stringify(previous.stealth) !== JSON.stringify(current.stealth)) {
    console.log('🕵️ Configurações de stealth alteradas...');
    if (current.stealth.enabled && stealthManager) {
      enableStealthMode();
    } else if (!current.stealth.enabled && stealthManager) {
      disableStealthMode();
    }
  }

  // Scroll speed changes
  if (previous.scrollSpeed !== current.scrollSpeed) {
    console.log(`✅ Velocidade de scroll alterada para: ${current.scrollSpeed}px`);
  }

  console.log('✅ Todas as mudanças aplicadas dinamicamente!');
}

function loadSettingsFromDisk() {
  try {
    const p = getSettingsFilePath();
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf-8');
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    }
  } catch (e) {
    console.warn('Failed to load settings:', e);
  }
  return {};
}

function saveSettingsToDisk(settings) {
  try {
    const p = getSettingsFilePath();
    fs.writeFileSync(p, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}

// Build sources from static and user-configured
function buildSources(staticSources, userSites, placeholderPage) {
  const combined = [...staticSources];
  
  if (userSites && Array.isArray(userSites)) {
    userSites.forEach(site => {
      if (typeof site === 'string' && site.trim()) {
        combined.push({ label: site, source: site });
      }
    });
  }
  
  return combined.length > 0 ? combined : [{ label: 'Placeholder', source: placeholderPage }];
}

// Calculate window dimensions
function calculateDimensions() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;
  
  CONTENT_HEIGHT = workArea.height;
  CONTENT_WIDTH = Math.floor(workArea.width * 0.2);
  CONTENT_X = workArea.width - CONTENT_WIDTH - Math.floor(workArea.width * 0.02);
  CONTENT_Y = workArea.y;
}

// Create the main window
function createWindow() {
  calculateDimensions();

  mainWindow = new BrowserWindow({
    width: CONTENT_WIDTH,
    height: CONTENT_HEIGHT,
    x: CONTENT_X,
    y: CONTENT_Y,
    show: false,
    transparent: false,
    frame: false,
    skipTaskbar: true,
    resizable: false,
    alwaysOnTop: appSettings.alwaysOnTop,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Build list of sources: static first, then user-configured
  const sources = buildSources(staticSources, appSettings.userSites, placeholderPage);

  // Create WebContentsViews for each source
  sources.forEach((entry, index) => {
    const view = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    view.setBounds({
      x: 0,
      y: index * CONTENT_HEIGHT,
      width: CONTENT_WIDTH,
      height: CONTENT_HEIGHT,
    });

    mainWindow.contentView.addChildView(view);
    webContentViews.push(view);
    loadContent(view, entry);
  });

  // Create banner views between content views
  createBannerViews(sources);

  mainWindow.show();
  
  // Setup keyboard shortcuts
  registerGlobalShortcuts();
  
  // System tray
  createSystemTray();
  
  // Register IPC handlers for settings
  registerSettingsIpc();
  
  // Register IPC handlers for stealth
  registerStealthIpc();
  
  // Register stealth API for settings page
  registerStealthAPI();
  
  // Mouse wheel support
  mainWindow.webContents.on("wheel", (event, delta) => {
    if (delta.deltaY > 0) {
      scrollDown();
    } else {
      scrollUp();
    }
  });
}

// Load content intelligently
function loadContent(view, entry) {
  const src = typeof entry === 'string' ? entry : entry.source;
  console.log(`📄 Loading content for: ${entry.label || 'Unknown'}`);
  console.log(`📄 Source: ${src}`);
  
  try {
    if (src.startsWith("http://") || src.startsWith("https://")) {
      console.log(`🌐 Loading URL: ${src}`);
      view.webContents.loadURL(src);
    } else if (src.startsWith("file://")) {
      const filePath = src.replace("file://", "");
      console.log(`📁 Loading file: ${filePath}`);
      console.log(`📁 File exists: ${fs.existsSync(filePath)}`);
      view.webContents.loadFile(filePath);
    } else {
      console.log(`📁 Loading file (no protocol): ${src}`);
      console.log(`📁 File exists: ${fs.existsSync(src)}`);
      view.webContents.loadFile(src);
    }
    
    // Add error handling
    view.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error(`❌ Failed to load: ${validatedURL}`);
      console.error(`❌ Error: ${errorDescription} (${errorCode})`);
    });
    
    view.webContents.on('did-finish-load', () => {
      console.log(`✅ Successfully loaded: ${entry.label || 'Unknown'}`);
    });
    
  } catch (error) {
    console.error(`❌ Error loading content: ${error.message}`);
  }
}

// Recreate all views (pages and banners) when settings change
function recreateAllViews() {
  console.log('🔄 Recriando todas as views com novas configurações...');
  
  // Check if mainWindow exists
  if (!mainWindow || mainWindow.isDestroyed()) {
    console.log('❌ MainWindow não existe ou foi destruída, não é possível recriar views');
    return;
  }
  
  try {
    // Remove existing content views and properly destroy them
    webContentViews.forEach(view => {
      if (view && !view.webContents.isDestroyed()) {
        // Stop all media and clear resources
        try {
          view.webContents.executeJavaScript(`
            // Stop all audio/video
            const videos = document.querySelectorAll('video');
            videos.forEach(video => {
              video.pause();
              video.currentTime = 0;
              video.src = '';
            });
            
            const audios = document.querySelectorAll('audio');
            audios.forEach(audio => {
              audio.pause();
              audio.currentTime = 0;
              audio.src = '';
            });
            
            // Clear all timers and intervals
            const highestTimeoutId = setTimeout(() => {}, 0);
            for (let i = 0; i < highestTimeoutId; i++) {
              clearTimeout(i);
            }
            
            const highestIntervalId = setInterval(() => {}, 0);
            for (let i = 0; i < highestIntervalId; i++) {
              clearInterval(i);
            }
          `).catch(() => {
            // Ignore errors if page is already destroyed
          });
        } catch (error) {
          console.log('⚠️ Erro ao limpar mídia da view:', error.message);
        }
        
        // Remove from content view
        mainWindow.contentView.removeChildView(view);
        
        // Destroy the webContents
        if (!view.webContents.isDestroyed()) {
          view.webContents.destroy();
        }
      }
    });
    webContentViews = [];
    
    // Remove existing banner views and properly destroy them
    bannerViews.forEach(bannerData => {
      if (bannerData.view && !bannerData.view.webContents.isDestroyed()) {
        // Stop any media in banners
        try {
          bannerData.view.webContents.executeJavaScript(`
            // Stop any media in banners
            const videos = document.querySelectorAll('video');
            videos.forEach(video => {
              video.pause();
              video.currentTime = 0;
              video.src = '';
            });
            
            const audios = document.querySelectorAll('audio');
            audios.forEach(audio => {
              audio.pause();
              audio.currentTime = 0;
              audio.src = '';
            });
          `).catch(() => {
            // Ignore errors if page is already destroyed
          });
        } catch (error) {
          console.log('⚠️ Erro ao limpar mídia do banner:', error.message);
        }
        
        mainWindow.contentView.removeChildView(bannerData.view);
        
        // Destroy the webContents
        if (!bannerData.view.webContents.isDestroyed()) {
          bannerData.view.webContents.destroy();
        }
      }
    });
    bannerViews = [];
    
    // Reset scroll position
    offset = 0;
    targetOffset = 0;
    
    // Recreate all content views
    const sources = buildSources(staticSources, appSettings.userSites, placeholderPage);
    console.log(`📄 Recriando ${sources.length} páginas...`);
    
    sources.forEach((entry, index) => {
      const view = new WebContentsView({
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      view.setBounds({
        x: 0,
        y: index * CONTENT_HEIGHT,
        width: CONTENT_WIDTH,
        height: CONTENT_HEIGHT,
      });

      mainWindow.contentView.addChildView(view);
      webContentViews.push(view);
      loadContent(view, entry);
    });
    
    // Recreate banner views
    createBannerViews(sources);
    
    // Reposition all views
    repositionAllCardViews();
    
    console.log('✅ Todas as views recriadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao recriar views:', error.message);
  }
}

// Recreate banner views when settings change
function recreateBannerViews() {
  console.log('🎯 Recriando banners com novas configurações...');
  
  // Remove existing banner views
  bannerViews.forEach(bannerData => {
    if (bannerData.view && !bannerData.view.webContents.isDestroyed()) {
      mainWindow.contentView.removeChildView(bannerData.view);
    }
  });
  bannerViews = [];
  
  // Recreate with current settings
  const sources = buildSources(staticSources, appSettings.userSites, placeholderPage);
  createBannerViews(sources);
  
  // Reposition all views
  repositionAllCardViews();
  
  console.log('✅ Banners recriados com sucesso!');
}

// Create banner views between content views
function createBannerViews(sources) {
  console.log('🎯 Creating banner views...');
  console.log('🎯 Banners enabled:', appSettings.banners.enabled);
  console.log('🎯 Global banners enabled:', bannerSettings.globalEnabled);
  
  if (!appSettings.banners.enabled || !bannerSettings.globalEnabled) {
    console.log('🎯 Banners disabled, skipping...');
    return;
  }

  const enabledBanners = defaultBanners.filter(banner => 
    banner.enabled && appSettings.banners.enabledBanners.includes(banner.id)
  );

  console.log('🎯 Enabled banners:', enabledBanners.length);
  console.log('🎯 Banner settings:', appSettings.banners);

  if (enabledBanners.length === 0) {
    console.log('🎯 No enabled banners found');
    return;
  }

  let bannerIndex = 0;
  
  // Adicionar banners entre as views baseado na frequência
  for (let i = 0; i < sources.length - 1; i++) {
    const banner = enabledBanners[bannerIndex % enabledBanners.length];
    
    // Verificar se deve mostrar o banner baseado na frequência
    if (banner.frequency > 0 && (i + 1) % banner.frequency === 0) {
      const bannerView = new WebContentsView({
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
        },
      });

      // Posição Y: depois da view atual + altura do banner acumulada
      const currentViewY = (i + 1) * CONTENT_HEIGHT;
      const bannerY = currentViewY + (bannerViews.length * appSettings.banners.height);

      bannerView.setBounds({
        x: 0,
        y: bannerY,
        width: CONTENT_WIDTH,
        height: appSettings.banners.containerHeight || appSettings.banners.height,
      });

      mainWindow.contentView.addChildView(bannerView);
      bannerViews.push({
        view: bannerView,
        config: banner,
        position: i + 1
      });

      // Carregar conteúdo do banner
      console.log(`🎯 Loading banner: ${banner.name}`);
      console.log(`🎯 Banner path: ${banner.path}`);
      
      if (banner.path.startsWith("http://") || banner.path.startsWith("https://")) {
        console.log(`🌐 Loading banner URL: ${banner.path}`);
        bannerView.webContents.loadURL(banner.path);
      } else {
        console.log(`📁 Loading banner file: ${banner.path}`);
        console.log(`📁 Banner file exists: ${fs.existsSync(banner.path)}`);
        bannerView.webContents.loadFile(banner.path);
      }

      bannerIndex++;
    }
  }
}

// Reposition all views including banners
function repositionAllCardViews() {
  let totalBannerHeight = 0;
  
  webContentViews.forEach((view, index) => {
    if (!view.webContents.isDestroyed()) {
      view.setBounds({
        x: 0,
        y: index * CONTENT_HEIGHT + offset + totalBannerHeight,
        width: CONTENT_WIDTH,
        height: CONTENT_HEIGHT,
      });
      
      // Adicionar altura dos banners que vêm após esta view
      const bannersAfterThisView = bannerViews.filter(banner => banner.position === index + 1);
      totalBannerHeight += bannersAfterThisView.length * (appSettings.banners.containerHeight || appSettings.banners.height);
    }
  });

  // Reposicionar banners
  bannerViews.forEach((bannerData, index) => {
    if (!bannerData.view.webContents.isDestroyed()) {
      const viewsBeforeBanner = bannerData.position;
      const bannersBeforeThis = bannerViews.filter((b, i) => i < index);
      const bannerHeightBefore = bannersBeforeThis.length * (appSettings.banners.containerHeight || appSettings.banners.height);
      
      bannerData.view.setBounds({
        x: 0,
        y: viewsBeforeBanner * CONTENT_HEIGHT + offset + bannerHeightBefore,
        width: CONTENT_WIDTH,
        height: appSettings.banners.containerHeight || appSettings.banners.height,
      });
    }
  });
}

// Fast page navigation animation
function animatePageNavigation(targetY) {
  if (scrolling) return;
  scrolling = true;
  
  const startOffset = offset;
  const startTime = Date.now();
  const duration = 150; // Fast animation - 150ms
  
  function step() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease-out animation for smooth stop
    const easeOut = 1 - Math.pow(1 - progress, 3);
    offset = startOffset + (targetY - startOffset) * easeOut;
    
    repositionAllCardViews();
    
    if (progress < 1) {
      setTimeout(step, 16); // ~60fps using setTimeout instead of requestAnimationFrame
    } else {
      offset = targetY;
      targetOffset = targetY;
      repositionAllCardViews();
      scrolling = false;
    }
  }
  
  setTimeout(step, 16);
}

// Navigate to next/previous page instantly
function navigateToPage(direction) {
  if (webContentViews.length === 0) return;
  
  const currentPage = Math.round(-offset / CONTENT_HEIGHT);
  let targetPage;
  
  if (direction === 'right') {
    targetPage = Math.min(currentPage + 1, webContentViews.length - 1);
  } else {
    targetPage = Math.max(currentPage - 1, 0);
  }
  
  const newTargetOffset = -targetPage * CONTENT_HEIGHT;
  targetOffset = newTargetOffset;
  animatePageNavigation(newTargetOffset);
}

// Smooth scrolling animation
function animateScroll() {
  if (scrolling) return;
  scrolling = true;

  const step = () => {
    const diff = targetOffset - offset;
    if (Math.abs(diff) < 1) {
      offset = targetOffset;
      repositionAllCardViews();
      scrolling = false;
      return;
    }
    offset += diff * 0.2;
    repositionAllCardViews();
    setTimeout(step, 16);
  };

  step();
}

// Scroll down
function scrollDown() {
  const totalViewsHeight = webContentViews.length * CONTENT_HEIGHT;
  const totalBannersHeight = bannerViews.length * (appSettings.banners.containerHeight || appSettings.banners.height);
  const totalHeight = totalViewsHeight + totalBannersHeight;
  const minOffset = Math.min(0, CONTENT_HEIGHT - totalHeight);
  targetOffset -= appSettings.scrollSpeed;
  if (targetOffset < minOffset) targetOffset = minOffset;
  animateScroll();
}

// Scroll up
function scrollUp() {
  targetOffset += appSettings.scrollSpeed;
  if (targetOffset > 0) targetOffset = 0;
  animateScroll();
}

// Create system tray
function createSystemTray() {
  let trayIconPath;
  try {
    trayIconPath = getAppPath("icon.png");
    const icon = nativeImage.createFromPath(trayIconPath);
    if (icon.isEmpty()) {
      throw new Error("Icon file not found or invalid");
    }
    tray = new Tray(icon);
  } catch (error) {
    console.log("Custom icon not found, using default Electron icon");
    tray = new Tray(nativeImage.createEmpty());
  }

  tray.setToolTip("Stealth App");
  updateTrayMenu();

  tray.on("click", () => {
    toggleWindowVisibility();
  });
}

// Update tray menu
function updateTrayMenu() {
  const checkbox = (on) => (on ? '☑' : '☐');
  
  // Status do stealth
  let stealthStatus = '❌ Desconhecido';
  if (stealthManager) {
    if (appSettings.stealth.enabled) {
      const windowCount = stealthManager.getStealthedWindowsCount();
      stealthStatus = `🕵️ Ativo (${windowCount} janelas)`;
    } else {
      stealthStatus = '👁️ Inativo';
    }
  } else {
    stealthStatus = '⚠️ Indisponível';
  }
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Settings', click: () => openSettingsWindow() },
    { type: 'separator' },
    { label: `Stealth Mode: ${stealthStatus}`, enabled: false },
    { type: 'separator' },
    {
      label: 'Settings',
      type: 'submenu',
      submenu: [
        {
          label: `Always on Top ${checkbox(appSettings.alwaysOnTop)}`,
          click: () => toggleAlwaysOnTop(),
        },
        {
          label: `Start with Windows ${checkbox(appSettings.autoStart)}`,
          click: () => toggleAutoStart(),
        },
        { type: 'separator' },
        {
          label: 'Scroll Speed',
          type: 'submenu',
          submenu: [
            { label: `Slow (50px) ${appSettings.scrollSpeed === 50 ? '●' : '○'}`, click: () => setScrollSpeed(50) },
            { label: `Normal (100px) ${appSettings.scrollSpeed === 100 ? '●' : '○'}`, click: () => setScrollSpeed(100) },
            { label: `Fast (200px) ${appSettings.scrollSpeed === 200 ? '●' : '○'}`, click: () => setScrollSpeed(200) },
          ],
        },
      ],
    },
    { type: 'separator' },
    { label: isAppVisible ? 'Hide Window' : 'Show Window', click: () => toggleWindowVisibility() },
    { type: 'separator' },
    { role: 'quit', label: 'Quit' },
  ]);

  tray.setContextMenu(contextMenu);
}

// Create or focus the Settings window
function openSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    if (!settingsWindow.isVisible()) settingsWindow.show();
    settingsWindow.focus();
    return;
  }

  // Calcular posição central da tela
  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;
  const windowWidth = 500;
  const windowHeight = 600;
  const x = Math.round((workArea.width - windowWidth) / 2);
  const y = Math.round((workArea.height - windowHeight) / 2);

  settingsWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: x,
    y: y,
    resizable: false,
    minimizable: false,
    maximizable: false,
    show: true,
    title: "Configurações - Shii!",
    parent: mainWindow,
    modal: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: getAppPath("preload-settings.js"),
    },
  });

  settingsWindow.loadFile(getAppPath(path.join("src", "pages", "settings", "index.html")));

  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
}

// IPC handlers for settings page
function registerSettingsIpc() {
  ipcMain.handle("settings:get", async () => {
    console.log('Settings requested, returning:', appSettings);
    return appSettings;
  });

  ipcMain.handle("settings:update", async (_event, partial) => {
    console.log('Settings update received:', partial);
    if (typeof partial !== "object" || partial === null) return appSettings;

    const previous = { ...appSettings };
    appSettings = {
      ...appSettings,
      ...partial,
      shortcuts: { ...(appSettings.shortcuts || {}), ...(partial.shortcuts || {}) },
    };

    // Apply side-effects dynamically
    applySettingsChanges(previous, appSettings);

    // Re-register global shortcuts if changed
    if (JSON.stringify(previous.shortcuts) !== JSON.stringify(appSettings.shortcuts)) {
      registerGlobalShortcuts();
    }

    // Persist settings to disk
    saveSettingsToDisk(appSettings);
    updateTrayMenu();
    console.log('Settings updated and saved:', appSettings);
    return appSettings;
  });

  // Add new page handler
  ipcMain.handle("app:addPage", async (event, url) => {
    try {
      console.log(`📄 Adicionando nova página via IPC: ${url}`);
      addNewPageFromSettings(url);
      return { success: true, message: 'Página adicionada com sucesso!' };
    } catch (error) {
      console.error('❌ Erro ao adicionar página:', error.message);
      return { success: false, message: error.message };
    }
  });

  // Remove page handler
  ipcMain.handle("app:removePage", async (event, url) => {
    try {
      console.log(`📄 Removendo página via IPC: ${url}`);
      
      if (appSettings.userSites) {
        const index = appSettings.userSites.indexOf(url);
        if (index > -1) {
          appSettings.userSites.splice(index, 1);
          saveSettingsToDisk(appSettings);
          recreateAllViews();
          return { success: true, message: 'Página removida com sucesso!' };
        }
      }
      
      return { success: false, message: 'Página não encontrada' };
    } catch (error) {
      console.error('❌ Erro ao remover página:', error.message);
      return { success: false, message: error.message };
    }
  });

  // Reload all views handler
  ipcMain.handle("app:reloadViews", async () => {
    try {
      console.log('🔄 Recarregando todas as views via IPC...');
      recreateAllViews();
      return { success: true, message: 'Views recarregadas com sucesso!' };
    } catch (error) {
      console.error('❌ Erro ao recarregar views:', error.message);
      return { success: false, message: error.message };
    }
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
  if (s.toggleLock || s.lock) {
    globalShortcut.register(s.toggleLock || s.lock, () => { toggleAlwaysOnTop(); });
  }
  if (s.toggleMinimize || s.minimize) {
    globalShortcut.register(s.toggleMinimize || s.minimize, () => { toggleMinimizeRestore(); });
  }
  if (s.pageLeft) {
    globalShortcut.register(s.pageLeft, () => { navigateToPage('left'); });
  }
  if (s.pageRight) {
    globalShortcut.register(s.pageRight, () => { navigateToPage('right'); });
  }
}

// Toggle always on top
function toggleAlwaysOnTop() {
  appSettings.alwaysOnTop = !appSettings.alwaysOnTop;
  mainWindow.setAlwaysOnTop(appSettings.alwaysOnTop);
  updateTrayMenu();
  saveSettingsToDisk(appSettings);
}

// Toggle auto start
function toggleAutoStart() {
  appSettings.autoStart = !appSettings.autoStart;
  setAutoStart(appSettings.autoStart);
  updateTrayMenu();
  saveSettingsToDisk(appSettings);
}

// Set auto start with Windows
function setAutoStart(enabled) {
  try {
    // Método padrão usando registry
    console.log(`🔄 Configurando auto-start: ${enabled ? 'ativar' : 'desativar'}`);
    console.log(`🔄 Exec path: ${process.execPath}`);
    
    const options = {
      openAtLogin: enabled,
      openAsHidden: false,
      name: 'Shii!',
      path: process.execPath,
      args: []
    };
    
    console.log(`🔄 Opções de auto-start:`, options);
    
    // Verificar se o app está empacotado
    if (app.isPackaged) {
      console.log('📦 App empacotado, configurando auto-start...');
      app.setLoginItemSettings(options);
    } else {
      console.log('⚠️ App em desenvolvimento, auto-start não configurado');
      return false;
    }
    
    // Verificar se foi configurado corretamente
    const currentSettings = app.getLoginItemSettings();
    console.log(`🔄 Configuração atual:`, currentSettings);
    
    if (currentSettings.openAtLogin === enabled) {
      console.log(`✅ Auto-start ${enabled ? 'ativado' : 'desativado'} via registry`);
      return true;
    } else {
      console.log(`❌ Falha ao configurar auto-start. Esperado: ${enabled}, Atual: ${currentSettings.openAtLogin}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao configurar auto-start:', error.message);
    return false;
  }
}

// Check if auto-start is enabled
function isAutoStartEnabled() {
  try {
    if (!app.isPackaged) {
      console.log('⚠️ App em desenvolvimento, auto-start não disponível');
      return false;
    }
    
    const loginItemSettings = app.getLoginItemSettings();
    console.log(`🔍 Verificando auto-start atual:`, loginItemSettings);
    return loginItemSettings.openAtLogin;
  } catch (error) {
    console.error('❌ Erro ao verificar auto-start:', error.message);
    return false;
  }
}

// ===== FUNÇÕES PARA PASTA DE INICIALIZAÇÃO DO WINDOWS =====

// Obter caminho da pasta de inicialização do Windows
function getStartupFolderPath() {
  const os = require('os');
  const homeDir = os.homedir();
  return path.join(homeDir, 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
}

// Obter caminho do executável atual
function getExecutablePath() {
  return process.execPath;
}

// Obter nome do arquivo de atalho
function getShortcutName() {
  return 'Shii!.lnk';
}


// Set scroll speed
function setScrollSpeed(speed) {
  appSettings.scrollSpeed = speed;
  updateTrayMenu();
  saveSettingsToDisk(appSettings);
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
  updateTrayMenu();
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
  updateTrayMenu();
}

// Add new content dynamically
function addNewContent(source) {
  console.log('📄 Adicionando nova página dinamicamente...');
  
  const view = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const index = webContentViews.length;
  view.setBounds({
    x: 0,
    y: index * CONTENT_HEIGHT + offset,
    width: CONTENT_WIDTH,
    height: CONTENT_HEIGHT,
  });

  mainWindow.contentView.addChildView(view);
  webContentViews.push(view);
  loadContent(view, source);
  
  // Reposition all views to account for new content
  repositionAllCardViews();
  
  console.log('✅ Nova página adicionada com sucesso!');
}

// Add new page from settings (called when user adds a site)
function addNewPageFromSettings(url) {
  console.log(`📄 Adicionando nova página: ${url}`);
  
  // Add to user sites
  if (!appSettings.userSites) {
    appSettings.userSites = [];
  }
  
  appSettings.userSites.push(url);
  
  // Save settings
  saveSettingsToDisk(appSettings);
  
  // Recreate all views to include new page
  recreateAllViews();
  
  console.log('✅ Nova página adicionada e views recriadas!');
}

// App event handlers
app.whenReady().then(() => {
  console.log('🚀 App is ready, starting initialization...');
  console.log('📁 App is packaged:', app.isPackaged);
  console.log('📁 Resources path:', process.resourcesPath);
  console.log('📁 Exec path:', process.execPath);
  
  // Load settings from disk before creating windows
  const diskSettings = loadSettingsFromDisk();
  console.log('Loaded settings from disk:', diskSettings);
  
  // Sync auto-start setting with Windows registry or startup folder
  if (diskSettings.autoStart !== undefined) {
    const actualAutoStart = isAutoStartEnabled();
    if (diskSettings.autoStart !== actualAutoStart) {
      console.log(`🔄 Sincronizando auto-start: config=${diskSettings.autoStart}, sistema=${actualAutoStart}`);
      setAutoStart(diskSettings.autoStart);
    }
  }
  
  
  // Ensure all required shortcuts exist
  if (!diskSettings.shortcuts) diskSettings.shortcuts = {};
  if (!diskSettings.shortcuts.pageLeft) diskSettings.shortcuts.pageLeft = "CommandOrControl+Alt+Left";
  if (!diskSettings.shortcuts.pageRight) diskSettings.shortcuts.pageRight = "CommandOrControl+Alt+Right";
  if (!diskSettings.shortcuts.lock && !diskSettings.shortcuts.toggleLock) diskSettings.shortcuts.lock = "CommandOrControl+Alt+L";
  if (!diskSettings.shortcuts.minimize && !diskSettings.shortcuts.toggleMinimize) diskSettings.shortcuts.minimize = "CommandOrControl+Alt+M";
  if (!diskSettings.userSites) diskSettings.userSites = [];
  if (!diskSettings.banners) diskSettings.banners = {
    enabled: true,
    enabledBanners: ['gabriel-banner', 'coffee-banner'],
    height: 15,
    containerHeight: 15,
    theme: 'default'
  };
  
  // Merge settings properly, preserving defaults
  appSettings = {
    ...appSettings,
    ...diskSettings,
    shortcuts: { ...appSettings.shortcuts, ...(diskSettings.shortcuts || {}) },
    banners: { ...appSettings.banners, ...(diskSettings.banners || {}) },
    stealth: { ...appSettings.stealth, ...(diskSettings.stealth || {}) }
  };
  
  // Forçar atualização dos banners para as novas configurações
  if (appSettings.banners && (appSettings.banners.height === 10 || appSettings.banners.height === 20 || appSettings.banners.height === 30)) {
    appSettings.banners.height = 15;
    appSettings.banners.containerHeight = 15;
    saveSettingsToDisk(appSettings);
  }

  // Initialize stealth settings if not present
  if (!appSettings.stealth) {
    appSettings.stealth = {
      enabled: true, // Ativado por padrão
      autoStart: true, // Auto-start por padrão
      showInTray: true
    };
    saveSettingsToDisk(appSettings);
  }

  // Auto-start stealth if enabled
  if (appSettings.stealth.enabled && stealthManager) {
    setTimeout(async () => {
      console.log('🕵️ Ativando stealth automaticamente...');
      await enableStealthMode();
    }, 2000); // Delay maior para garantir que a janela esteja pronta
  }
  
  console.log('Final appSettings:', appSettings);
  
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Handle window close events
app.on("window-all-closed", (event) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.hide();
    isAppVisible = false;
    updateTrayMenu();
  }
});

app.on("before-quit", () => {
  globalShortcut.unregisterAll();
});

// ===== FUNÇÕES STEALTH =====

// Registrar handlers IPC para stealth
function registerStealthIpc() {
  if (!stealthManager) {
    console.log("⚠️ Módulo stealth não disponível, handlers IPC não registrados");
    return;
  }

  // Ativar modo stealth
  ipcMain.handle('stealth:enable', async (event) => {
    try {
      if (!mainWindow) {
        throw new Error('Janela principal não encontrada');
      }

      // Obter handle da janela do Electron
      const windowHandle = mainWindow.getNativeWindowHandle();
      const result = stealthManager.enableStealthMode(windowHandle);
      
      console.log('🕵️ Modo stealth ativado:', result);
      return { success: result, message: result ? 'Modo stealth ativado' : 'Falha ao ativar modo stealth' };
    } catch (error) {
      console.error('❌ Erro ao ativar modo stealth:', error.message);
      return { success: false, message: error.message };
    }
  });

  // Desativar modo stealth
  ipcMain.handle('stealth:disable', async (event) => {
    try {
      const result = stealthManager.disableStealthMode();
      
      console.log('👁️ Modo stealth desativado:', result);
      return { success: result, message: result ? 'Modo stealth desativado' : 'Falha ao desativar modo stealth' };
    } catch (error) {
      console.error('❌ Erro ao desativar modo stealth:', error.message);
      return { success: false, message: error.message };
    }
  });

  // Verificar status do modo stealth
  ipcMain.handle('stealth:status', async (event) => {
    try {
      const isActive = stealthManager.isStealthActive();
      return { 
        success: true, 
        isActive: isActive,
        message: isActive ? 'Modo stealth ativo' : 'Modo stealth inativo'
      };
    } catch (error) {
      console.error('❌ Erro ao verificar status do stealth:', error.message);
      return { success: false, message: error.message };
    }
  });

  // Obter janela por título
  ipcMain.handle('stealth:getWindowByTitle', async (event, title) => {
    try {
      const handle = stealthManager.getWindowByTitle(title);
      return { 
        success: true, 
        handle: handle,
        message: handle ? 'Janela encontrada' : 'Janela não encontrada'
      };
    } catch (error) {
      console.error('❌ Erro ao obter janela por título:', error.message);
      return { success: false, message: error.message };
    }
  });

  console.log("✅ Handlers IPC do stealth registrados");
}

// Registrar API de stealth para a página de configurações
function registerStealthAPI() {
  if (!stealthManager) {
    console.log("⚠️ Módulo stealth não disponível, API não registrada");
    return;
  }

  // Ativar stealth
  ipcMain.handle('stealth:api:enable', async (event) => {
    try {
      if (!mainWindow) {
        throw new Error('Janela principal não encontrada');
      }

      const windowHandle = mainWindow.getNativeWindowHandle();
      const result = stealthManager.enableStealthMode(windowHandle);
      
      if (result) {
        appSettings.stealth.enabled = true;
        saveSettingsToDisk(appSettings);
        updateTrayMenu(); // Atualizar tray
        console.log('🕵️ Stealth ativado via API');
      }
      
      return { success: result, message: result ? 'Stealth ativado' : 'Falha ao ativar stealth' };
    } catch (error) {
      console.error('❌ Erro ao ativar stealth via API:', error.message);
      return { success: false, message: error.message };
    }
  });

  // Desativar stealth
  ipcMain.handle('stealth:api:disable', async (event) => {
    try {
      const result = stealthManager.disableStealthMode();
      
      if (result) {
        appSettings.stealth.enabled = false;
        saveSettingsToDisk(appSettings);
        updateTrayMenu(); // Atualizar tray
        console.log('👁️ Stealth desativado via API');
      }
      
      return { success: result, message: result ? 'Stealth desativado' : 'Falha ao desativar stealth' };
    } catch (error) {
      console.error('❌ Erro ao desativar stealth via API:', error.message);
      return { success: false, message: error.message };
    }
  });

  console.log("✅ API de stealth registrada para configurações");
}

// Função para ativar modo stealth (pode ser chamada externamente)
async function enableStealthMode() {
  if (!stealthManager) {
    console.log("⚠️ Módulo stealth não disponível");
    return false;
  }

  try {
    // Coletar títulos de todas as views
    const viewTitles = [];
    
    // Adicionar título da janela principal
    if (mainWindow) {
      const mainTitle = mainWindow.getTitle();
      if (mainTitle) {
        viewTitles.push(mainTitle);
        console.log("🔍 Título da janela principal:", mainTitle);
      }
    }
    
    // Adicionar títulos das views de conteúdo
    webContentViews.forEach((view, index) => {
      if (view && view.webContents) {
        const viewTitle = `View ${index + 1}`; // Título genérico para views
        viewTitles.push(viewTitle);
        console.log(`🔍 Título da view ${index + 1}:`, viewTitle);
      }
    });
    
    // Adicionar títulos dos banners
    bannerViews.forEach((banner, index) => {
      if (banner && banner.view) {
        const bannerTitle = `Banner ${index + 1}`; // Título genérico para banners
        viewTitles.push(bannerTitle);
        console.log(`🔍 Título do banner ${index + 1}:`, bannerTitle);
      }
    });

    if (viewTitles.length === 0) {
      console.log("⚠️ Nenhuma view encontrada para aplicar stealth");
      return false;
    }

    console.log(`🕵️ Aplicando stealth em ${viewTitles.length} janelas...`);
    
    const result = stealthManager.applyStealthToMultipleWindows(viewTitles);
    console.log("🕵️ Resultado do stealth:", result);
    
    if (result) {
      appSettings.stealth.enabled = true;
      saveSettingsToDisk(appSettings);
      updateTrayMenu();
      console.log(`✅ Stealth ativado em ${stealthManager.getStealthedWindowsCount()} janelas!`);
    } else {
      console.log("❌ Falha ao ativar stealth");
    }
    
    return result;
  } catch (error) {
    console.error("❌ Erro ao ativar modo stealth:", error.message);
    return false;
  }
}

// Função para desativar modo stealth (pode ser chamada externamente)
async function disableStealthMode() {
  if (!stealthManager) {
    console.log("⚠️ Módulo stealth não disponível");
    return false;
  }

  try {
    const result = stealthManager.removeStealthFromMultipleWindows();
    
    if (result) {
      appSettings.stealth.enabled = false;
      saveSettingsToDisk(appSettings);
      updateTrayMenu();
      console.log("✅ Stealth desativado de todas as janelas!");
    }
    
    return result;
  } catch (error) {
    console.error("❌ Erro ao desativar modo stealth:", error.message);
    return false;
  }
}

// Export useful functions
module.exports = {
  scrollUp,
  scrollDown,
  addNewContent,
  toggleWindowVisibility,
  toggleAlwaysOnTop,
  enableStealthMode,
  disableStealthMode,
};