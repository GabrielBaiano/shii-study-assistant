// ===== VARIÁVEIS GLOBAIS DE CONFIGURAÇÃO =====
const CONFIG = {
  // Configurações de UI
  UI: {
    ANIMATION_DURATION: 200,
    DEBOUNCE_DELAY: 50,
    MAX_SITES_HEIGHT: 200,
    EMPTY_STATE_ICON: '📄'
  },
  
  // Configurações de validação
  VALIDATION: {
    URL_REGEX: /^https?:\/\//i,
    MIN_SCROLL_SPEED: 10,
    MAX_SCROLL_SPEED: 500,
    DEFAULT_SCROLL_SPEED: 100
  },
  
  // Configurações de shortcuts
  SHORTCUTS: {
    DEFAULT_SCROLL_UP: 'CommandOrControl+Alt+Up',
    DEFAULT_SCROLL_DOWN: 'CommandOrControl+Alt+Down',
    DEFAULT_TOGGLE_LOCK: 'CommandOrControl+Alt+L',
    DEFAULT_TOGGLE_MINIMIZE: 'CommandOrControl+Alt+M',
    DEFAULT_PAGE_LEFT: 'CommandOrControl+Alt+Left',
    DEFAULT_PAGE_RIGHT: 'CommandOrControl+Alt+Right'
  },
  
  // Configurações de stealth
  STEALTH: {
    DEFAULT_ENABLED: true,
    DEFAULT_AUTO_START: true,
    DEFAULT_SHOW_IN_TRAY: true
  },
  
  // Configurações de banners
  BANNERS: {
    DEFAULT_ENABLED: true,
    DEFAULT_HEIGHT: 15,
    DEFAULT_CONTAINER_HEIGHT: 15,
    DEFAULT_THEME: 'default',
    DEFAULT_ENABLED_BANNERS: ['gabriel-banner', 'coffee-banner']
  },
  
  
  // Mensagens
  MESSAGES: {
    INVALID_URL: 'Digite uma URL válida (https://...)',
    SITE_ADDED: 'Site adicionado com sucesso!',
    SITE_REMOVED: 'Site removido com sucesso!',
    SETTINGS_SAVED: 'Configurações salvas!',
    SHORTCUT_CAPTURED: 'Atalho capturado!',
    SHORTCUT_CANCELLED: 'Captura de atalho cancelada'
  },
  
  // Textos de interface
  TEXTS: {
    SECTIONS: {
      GENERAL: 'Geral',
      STEALTH: 'Modo Stealth',
      SCROLL: 'Navegação',
      SITES: 'Sites Personalizados',
      SHORTCUTS: 'Atalhos de Teclado'
    },
    SETTINGS: {
      ALWAYS_ON_TOP: 'Sempre no topo',
      ALWAYS_ON_TOP_DESC: 'Mantém a janela sempre visível sobre outras',
      AUTO_START: 'Iniciar com Windows',
      AUTO_START_DESC: 'Inicia automaticamente quando o Windows ligar',
      AUTO_START_METHOD: 'Método de inicialização',
      STEALTH_ENABLED: 'Ativar modo stealth',
      STEALTH_ENABLED_DESC: 'Oculta a janela de compartilhamento de tela',
      STEALTH_AUTO_START: 'Ativar stealth automaticamente',
      STEALTH_AUTO_START_DESC: 'Ativa o modo stealth ao iniciar o app',
      SCROLL_SPEED: 'Velocidade de rolagem',
      SCROLL_SPEED_DESC: 'Velocidade de navegação entre páginas',
      ADD_SITE: 'Adicionar site',
      ADD_SITE_PLACEHOLDER: 'https://exemplo.com',
      SITES_LIST: 'Sites adicionados',
      NO_SITES: 'Nenhum site adicionado',
      SHORTCUT_SCROLL_UP: 'Rolar para cima',
      SHORTCUT_SCROLL_DOWN: 'Rolar para baixo',
      SHORTCUT_TOGGLE_LOCK: 'Alternar fixação',
      SHORTCUT_TOGGLE_MINIMIZE: 'Minimizar/Restaurar'
    },
    BUTTONS: {
      ADD: 'Adicionar',
      REMOVE: 'Remover',
      SET: 'Definir',
      CLOSE: 'Fechar',
      SAVE: 'Salvar'
    }
  }
};

// ===== ELEMENTOS DO DOM =====
const elements = {
  // Checkboxes
  alwaysOnTop: null,
  autoStart: null,
  stealthEnabled: null,
  stealthAutoStart: null,
  
  // Selects
  autoStartMethod: null,
  scrollSpeed: null,
  
  // Inputs
  siteInput: null,
  
  // Buttons
  addSiteBtn: null,
  closeBtn: null,
  
  // Lists
  sitesList: null,

  // JSON Shortcuts editor
  shortcutsJson: null,
  shortcutsJsonError: null,
  saveShortcutsJsonBtn: null,
  resetShortcutsJsonBtn: null,
  
  // Shortcut elements
  shortcutScrollUp: null,
  shortcutScrollDown: null,
  shortcutToggleLock: null,
  shortcutToggleMinimize: null,
  
  // Shortcut buttons
  remapScrollUpBtn: null,
  remapScrollDownBtn: null,
  remapToggleLockBtn: null,
  remapToggleMinimizeBtn: null
};

// ===== FUNÇÕES UTILITÁRIAS =====
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showNotification(message, type = 'info') {
  // Implementar notificação visual se necessário
  console.log(`[${type.toUpperCase()}] ${message}`);
}

function validateUrl(url) {
  return CONFIG.VALIDATION.URL_REGEX.test(url);
}

function normalizeShortcut(e) {
  const parts = [];
  if (e.ctrlKey || e.metaKey) parts.push('CommandOrControl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  
  let key = e.key;
  if (key === ' ') key = 'Space';
  if (key.startsWith('Arrow')) key = key.replace('Arrow', '');
  if (key.length === 1) key = key.toUpperCase();
  
  const ignore = ['Control', 'Alt', 'Shift', 'Meta'];
  if (!ignore.includes(key)) parts.push(key);
  
  return parts.join('+');
}

// ===== FUNÇÕES DE INTERFACE =====
function initializeElements() {
  // Checkboxes
  elements.alwaysOnTop = document.getElementById('alwaysOnTop');
  elements.autoStart = document.getElementById('autoStart');
  elements.stealthEnabled = document.getElementById('stealthEnabled');
  elements.stealthAutoStart = document.getElementById('stealthAutoStart');
  
  // Selects
  elements.scrollSpeed = document.getElementById('scrollSpeed');
  
  // Inputs
  elements.siteInput = document.getElementById('siteInput');
  
  // Buttons
  elements.addSiteBtn = document.getElementById('addSiteBtn');
  elements.closeBtn = document.getElementById('closeBtn');
  
  // Lists
  elements.sitesList = document.getElementById('sitesList');

  // JSON Shortcuts editor
  elements.shortcutsJson = document.getElementById('shortcutsJson');
  elements.shortcutsJsonError = document.getElementById('shortcutsJsonError');
  elements.saveShortcutsJsonBtn = document.getElementById('saveShortcutsJsonBtn');
  elements.resetShortcutsJsonBtn = document.getElementById('resetShortcutsJsonBtn');
  
  // Shortcut elements
  elements.shortcutScrollUp = document.getElementById('shortcutScrollUp');
  elements.shortcutScrollDown = document.getElementById('shortcutScrollDown');
  elements.shortcutToggleLock = document.getElementById('shortcutToggleLock');
  elements.shortcutToggleMinimize = document.getElementById('shortcutToggleMinimize');
  
  // Shortcut buttons
  elements.remapScrollUpBtn = document.getElementById('remapScrollUpBtn');
  elements.remapScrollDownBtn = document.getElementById('remapScrollDownBtn');
  elements.remapToggleLockBtn = document.getElementById('remapToggleLockBtn');
  elements.remapToggleMinimizeBtn = document.getElementById('remapToggleMinimizeBtn');
}

function setupEventListeners() {
  // Checkboxes
  elements.alwaysOnTop?.addEventListener('change', () => {
    updateSettings({ alwaysOnTop: elements.alwaysOnTop.checked });
  });
  
  elements.autoStart?.addEventListener('change', () => {
    updateSettings({ autoStart: elements.autoStart.checked });
  });
  
  elements.stealthEnabled?.addEventListener('change', async () => {
    const enabled = elements.stealthEnabled.checked;
    await updateSettings({
      stealth: {
        enabled: enabled,
        autoStart: elements.stealthAutoStart?.checked || false,
        showInTray: CONFIG.STEALTH.DEFAULT_SHOW_IN_TRAY
      }
    });
    
    // Ativar/desativar stealth imediatamente
    if (enabled) {
      try {
        await window.stealthAPI?.enable();
        showNotification('Modo stealth ativado!', 'success');
      } catch (error) {
        console.error('Erro ao ativar stealth:', error);
        showNotification('Erro ao ativar modo stealth', 'error');
      }
    } else {
      try {
        await window.stealthAPI?.disable();
        showNotification('Modo stealth desativado!', 'success');
      } catch (error) {
        console.error('Erro ao desativar stealth:', error);
        showNotification('Erro ao desativar modo stealth', 'error');
      }
    }
  });
  
  elements.stealthAutoStart?.addEventListener('change', () => {
    updateSettings({
      stealth: {
        enabled: elements.stealthEnabled?.checked || false,
        autoStart: elements.stealthAutoStart.checked,
        showInTray: CONFIG.STEALTH.DEFAULT_SHOW_IN_TRAY
      }
    });
  });
  
  
  elements.scrollSpeed?.addEventListener('change', () => {
    updateSettings({ scrollSpeed: Number(elements.scrollSpeed.value) });
  });
  
  // Buttons
  elements.closeBtn?.addEventListener('click', () => window.close());
  elements.addSiteBtn?.addEventListener('click', addSite);

  // Shortcuts JSON buttons
  elements.saveShortcutsJsonBtn?.addEventListener('click', saveShortcutsFromJson);
  elements.resetShortcutsJsonBtn?.addEventListener('click', loadShortcutsJsonIntoEditor);
  
  // Shortcut buttons
  elements.remapScrollUpBtn?.addEventListener('click', () => {
    captureShortcut('Scroll Up', (combo) => {
      updateSettings({ shortcuts: { scrollUp: combo } });
      elements.shortcutScrollUp.textContent = combo;
    });
  });
  
  elements.remapScrollDownBtn?.addEventListener('click', () => {
    captureShortcut('Scroll Down', (combo) => {
      updateSettings({ shortcuts: { scrollDown: combo } });
      elements.shortcutScrollDown.textContent = combo;
    });
  });
  
  elements.remapToggleLockBtn?.addEventListener('click', () => {
    captureShortcut('Toggle Lock', (combo) => {
      updateSettings({ shortcuts: { toggleLock: combo } });
      elements.shortcutToggleLock.textContent = combo;
    });
  });
  
  elements.remapToggleMinimizeBtn?.addEventListener('click', () => {
    captureShortcut('Minimize/Restore', (combo) => {
      updateSettings({ shortcuts: { toggleMinimize: combo } });
      elements.shortcutToggleMinimize.textContent = combo;
    });
  });
  
  // Enter key para adicionar site
  elements.siteInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addSite();
    }
  });
}

// ===== FUNÇÕES DE CONFIGURAÇÃO =====
const updateSettings = debounce(async (partial) => {
  try {
    await window.settingsAPI?.update(partial);
    showNotification(CONFIG.MESSAGES.SETTINGS_SAVED, 'success');
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    showNotification('Erro ao salvar configurações', 'error');
  }
}, CONFIG.UI.DEBOUNCE_DELAY);

// Atualização imediata (sem debounce) para ações críticas como adicionar/remover sites
async function updateSettingsImmediate(partial) {
  try {
    await window.settingsAPI?.update(partial);
    showNotification(CONFIG.MESSAGES.SETTINGS_SAVED, 'success');
  } catch (error) {
    console.error('Erro ao salvar configurações (imediato):', error);
    showNotification('Erro ao salvar configurações', 'error');
  }
}

async function loadSettings() {
  try {
    const settings = await window.settingsAPI?.get();
    if (!settings) return;
    
    // Carregar configurações básicas
    if (elements.alwaysOnTop) elements.alwaysOnTop.checked = !!settings.alwaysOnTop;
    if (elements.autoStart) elements.autoStart.checked = !!settings.autoStart;
    if (elements.scrollSpeed) elements.scrollSpeed.value = String(settings.scrollSpeed || CONFIG.VALIDATION.DEFAULT_SCROLL_SPEED);
    
    // Carregar configurações de stealth
    if (elements.stealthEnabled) elements.stealthEnabled.checked = !!(settings.stealth?.enabled);
    if (elements.stealthAutoStart) elements.stealthAutoStart.checked = !!(settings.stealth?.autoStart);
    
    // Carregar shortcuts
    const shortcuts = settings.shortcuts || {};
    if (elements.shortcutScrollUp) elements.shortcutScrollUp.textContent = shortcuts.scrollUp || CONFIG.SHORTCUTS.DEFAULT_SCROLL_UP;
    if (elements.shortcutScrollDown) elements.shortcutScrollDown.textContent = shortcuts.scrollDown || CONFIG.SHORTCUTS.DEFAULT_SCROLL_DOWN;
    if (elements.shortcutToggleLock) elements.shortcutToggleLock.textContent = shortcuts.toggleLock || CONFIG.SHORTCUTS.DEFAULT_TOGGLE_LOCK;
    if (elements.shortcutToggleMinimize) elements.shortcutToggleMinimize.textContent = shortcuts.toggleMinimize || CONFIG.SHORTCUTS.DEFAULT_TOGGLE_MINIMIZE;

    // Editor JSON de atalhos
    loadShortcutsJsonIntoEditor(shortcuts);
    
    // Carregar sites
    renderSites(settings.userSites || []);
    
    console.log('✅ Configurações carregadas com sucesso');
    
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    showNotification('Erro ao carregar configurações', 'error');
  }
}

// ===== FUNÇÕES DE SITES =====
function renderSites(sites) {
  if (!elements.sitesList) return;
  
  elements.sitesList.innerHTML = '';
  
  if (sites.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <div class="empty-state-icon">${CONFIG.UI.EMPTY_STATE_ICON}</div>
      <div>${CONFIG.TEXTS.SETTINGS.NO_SITES}</div>
    `;
    elements.sitesList.appendChild(emptyState);
    return;
  }
  
  sites.forEach((siteEntry, index) => {
    const isString = typeof siteEntry === 'string';
    const url = isString ? siteEntry : (siteEntry?.url || '');
    const name = !isString && typeof siteEntry?.name === 'string' ? siteEntry.name : '';
    const height = !isString && siteEntry?.height ? siteEntry.height : 800;
    const displayLabel = (name && name.trim()) ? name.trim() : url;
    const siteItem = document.createElement('div');
    siteItem.className = 'site-item';
    siteItem.innerHTML = `
      <span class="site-url">${displayLabel}</span>
      <span class="site-height" style="margin-left:8px;opacity:.7">h:${height}px</span>
      <button class="remove-button" data-index="${index}">${CONFIG.TEXTS.BUTTONS.REMOVE}</button>
    `;
    
    siteItem.querySelector('.remove-button').addEventListener('click', () => {
      removeSite(index);
    });
    
    elements.sitesList.appendChild(siteItem);
  });
}

async function addSite() {
  const url = elements.siteInput?.value?.trim();
  
  if (!url) {
    showNotification('Digite uma URL', 'warning');
    return;
  }
  
  if (!validateUrl(url)) {
    showNotification(CONFIG.MESSAGES.INVALID_URL, 'error');
    return;
  }
  
  try {
    const settings = await window.settingsAPI?.get();
    const currentSites = settings?.userSites || [];
    // Preserva campos existentes (key, name, height) e migra strings
    const normalized = currentSites.map((entry, idx) => {
      if (typeof entry === 'string') {
        return { key: `web_${idx + 1}`, url: entry, height: 800, name: '' };
      }
      return {
        key: entry?.key || `web_${idx + 1}`,
        url: entry?.url || '',
        height: Math.max(100, Number(entry?.height) || 800),
        name: typeof entry?.name === 'string' ? entry.name : ''
      };
    });
    if (!normalized.find((e) => e.url === url)) {
      const newKey = `web_${normalized.length + 1}`;
      normalized.push({ key: newKey, url, height: 800, name: '' });
    }
    // Salvar imediatamente
    await updateSettingsImmediate({ userSites: normalized });
    renderSites(normalized);
    elements.siteInput.value = '';
    showNotification(CONFIG.MESSAGES.SITE_ADDED, 'success');
  } catch (error) {
    console.error('Erro ao adicionar site:', error);
    showNotification('Erro ao adicionar site', 'error');
  }
}

async function removeSite(index) {
  try {
    const settings = await window.settingsAPI?.get();
    const currentSites = settings?.userSites || [];
    // Preserva objetos completos e migra strings
    const normalized = currentSites.map((entry, idx) => {
      if (typeof entry === 'string') {
        return { key: `web_${idx + 1}`, url: entry, height: 800, name: '' };
      }
      return {
        key: entry?.key || `web_${idx + 1}`,
        url: entry?.url || '',
        height: Math.max(100, Number(entry?.height) || 800),
        name: typeof entry?.name === 'string' ? entry.name : ''
      };
    });
    const updated = normalized.filter((_, i) => i !== index);
    
    // Salvar imediatamente
    await updateSettingsImmediate({ userSites: updated });
    renderSites(updated);
    showNotification(CONFIG.MESSAGES.SITE_REMOVED, 'success');
  } catch (error) {
    console.error('Erro ao remover site:', error);
    showNotification('Erro ao remover site', 'error');
  }
}

// ===== FUNÇÕES DE SHORTCUTS =====
function captureShortcut(label, onComplete) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;
  
  overlay.innerHTML = `
    <div style="
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      padding: 24px;
      text-align: center;
      min-width: 300px;
      box-shadow: var(--shadow);
    ">
      <div style="font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">
        Pressione as teclas para ${label}
      </div>
      <div style="font-size: 12px; color: var(--text-muted);">
        Pressione Esc para cancelar
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  function onKeyDown(e) {
    if (e.key === 'Escape') {
      cleanup();
      showNotification(CONFIG.MESSAGES.SHORTCUT_CANCELLED, 'info');
      return;
    }
    
    const combo = normalizeShortcut(e);
    if (combo) {
      cleanup();
      onComplete(combo);
      showNotification(CONFIG.MESSAGES.SHORTCUT_CAPTURED, 'success');
    }
  }
  
  function cleanup() {
    window.removeEventListener('keydown', onKeyDown, true);
    overlay.remove();
  }
  
  window.addEventListener('keydown', onKeyDown, true);
}

// ===== FUNÇÕES: Shortcuts via JSON =====
const VALID_SHORTCUT_KEYS = ['scrollUp', 'scrollDown', 'toggleLock', 'toggleMinimize'];

function loadShortcutsJsonIntoEditor(existing) {
  if (!elements.shortcutsJson) return;
  try {
    const toUse = existing || (window.__lastLoadedSettingsShortcuts || {});
    const pretty = JSON.stringify(toUse, null, 2);
    elements.shortcutsJson.value = pretty;
    if (elements.shortcutsJsonError) {
      elements.shortcutsJsonError.style.display = 'none';
      elements.shortcutsJsonError.textContent = '';
    }
  } catch (_) {
    // no-op
  }
}

function validateShortcutCombo(combo) {
  // Aceita tokens separados por '+' como CommandOrControl, Alt, Shift e uma tecla final (letra, número, palavra)
  if (typeof combo !== 'string' || !combo.trim()) return false;
  const parts = combo.split('+').map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return false;
  // Deve conter uma tecla final que não seja apenas modificador
  const ignore = ['Control', 'Alt', 'Shift', 'Meta', 'CommandOrControl'];
  const hasRealKey = parts.some(p => !ignore.includes(p));
  return hasRealKey;
}

async function saveShortcutsFromJson() {
  if (!elements.shortcutsJson) return;
  const raw = elements.shortcutsJson.value;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || Array.isArray(parsed) || !parsed) {
      throw new Error('O JSON deve ser um objeto com chaves de atalhos.');
    }

    // Validar chaves
    const keys = Object.keys(parsed);
    const invalidKeys = keys.filter(k => !VALID_SHORTCUT_KEYS.includes(k));
    if (invalidKeys.length > 0) {
      throw new Error(`Chaves inválidas: ${invalidKeys.join(', ')}. Válidas: ${VALID_SHORTCUT_KEYS.join(', ')}`);
    }

    // Validar combinações
    const invalidCombos = keys.filter(k => !validateShortcutCombo(String(parsed[k] || '')));
    if (invalidCombos.length > 0) {
      throw new Error(`Combinações inválidas para: ${invalidCombos.join(', ')}`);
    }

    // Mesclar com defaults para não perder atalhos não enviados
    const current = await window.settingsAPI?.get();
    const base = current?.shortcuts || {};
    const merged = { ...base, ...parsed };

    await updateSettingsImmediate({ shortcuts: merged });
    if (elements.shortcutsJsonError) {
      elements.shortcutsJsonError.style.display = 'none';
      elements.shortcutsJsonError.textContent = '';
    }
    showNotification('Atalhos salvos com sucesso!', 'success');

    // Atualiza UI textual existente
    if (elements.shortcutScrollUp) elements.shortcutScrollUp.textContent = merged.scrollUp || CONFIG.SHORTCUTS.DEFAULT_SCROLL_UP;
    if (elements.shortcutScrollDown) elements.shortcutScrollDown.textContent = merged.scrollDown || CONFIG.SHORTCUTS.DEFAULT_SCROLL_DOWN;
    if (elements.shortcutToggleLock) elements.shortcutToggleLock.textContent = merged.toggleLock || CONFIG.SHORTCUTS.DEFAULT_TOGGLE_LOCK;
    if (elements.shortcutToggleMinimize) elements.shortcutToggleMinimize.textContent = merged.toggleMinimize || CONFIG.SHORTCUTS.DEFAULT_TOGGLE_MINIMIZE;
  } catch (error) {
    if (elements.shortcutsJsonError) {
      elements.shortcutsJsonError.style.display = 'block';
      elements.shortcutsJsonError.textContent = error.message || 'JSON inválido.';
    }
    showNotification('Erro ao salvar atalhos (JSON inválido)', 'error');
  }
}

// ===== INICIALIZAÇÃO =====
function initializeSettings() {
  // Expor API de stealth
  window.stealthAPI = {
    enable: () => window.electronAPI?.invoke('stealth:api:enable'),
    disable: () => window.electronAPI?.invoke('stealth:api:disable')
  };
  
  // Inicializar elementos e eventos
  initializeElements();
  setupEventListeners();
  
  // Carregar configurações
  loadSettings();
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSettings);
} else {
  initializeSettings();
}
//Test 1313414124