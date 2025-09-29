// Sistema de configuração de banners publicitários
// Este arquivo permite customizar completamente os banners do app

const { app } = require('electron');
const path = require('path');
const fs = require('fs');

// Helper function to get correct path for both dev and build
function getAppPath(relativePath) {
  console.log(`🔍 Getting banner path for: ${relativePath}`);
  console.log(`📁 App is packaged: ${app ? app.isPackaged : 'unknown'}`);
  console.log(`📁 Resources path: ${process.resourcesPath}`);
  console.log(`📁 Current dirname: ${__dirname}`);
  
  if (app && app.isPackaged) {
    // In packaged app, try multiple possible locations
    const possiblePaths = [
      // Try in extraResources (most reliable for ZIP)
      path.join(process.resourcesPath, relativePath),
      // Try in app.asar.unpacked
      path.join(process.resourcesPath, 'app.asar.unpacked', relativePath),
      // Try in app subdirectory
      path.join(process.resourcesPath, 'app', relativePath),
      // Try relative to current directory
      path.join(__dirname, relativePath),
      // Try with src prefix
      path.join(process.resourcesPath, 'src', relativePath.replace('src/', ''))
    ];
    
    console.log(`🔍 Checking ${possiblePaths.length} possible paths...`);
    
    // Return the first path that exists
    for (let i = 0; i < possiblePaths.length; i++) {
      const possiblePath = possiblePaths[i];
      try {
        console.log(`🔍 [${i+1}/${possiblePaths.length}] Checking: ${possiblePath}`);
        if (fs.existsSync(possiblePath)) {
          console.log(`✅ Found banner resource at: ${possiblePath}`);
          return possiblePath;
        } else {
          console.log(`❌ Not found: ${possiblePath}`);
        }
      } catch (e) {
        console.log(`❌ Error checking path ${possiblePath}:`, e.message);
      }
    }
    
    // If nothing found, return the first path as fallback
    console.log(`⚠️ No banner path found, using fallback: ${possiblePaths[0]}`);
    return possiblePaths[0];
  } else {
    // In development, go up from src/banners/ to project root
    const projectRoot = path.join(__dirname, '..', '..');
    const devPath = path.join(projectRoot, relativePath);
    console.log(`🔧 Development path: ${devPath}`);
    return devPath;
  }
}

const defaultBanners = [
    {
        id: 'gabriel-banner',
        name: 'Made by GabrielBaiano',
        path: getAppPath(path.join('src', 'banners', 'gabriel-banner', 'index.html')),
        enabled: true,
        height: 15, // altura em pixels
        position: 'between_views', // 'between_views', 'top', 'bottom'
        frequency: 2, // aparece a cada X views (0 = desabilitado, 1 = entre todas as views)
        customCSS: '', // CSS personalizado opcional
        customJS: '', // JavaScript personalizado opcional
        clickAction: {
            type: 'url', // 'url', 'function', 'disabled'
            value: 'https://github.com/GabrielBaiano'
        }
    },
    {
        id: 'coffee-banner',
        name: 'Buy me a coffee',
        path: getAppPath(path.join('src', 'banners', 'coffee-banner', 'index.html')),
        enabled: true,
        height: 15,
        position: 'between_views',
        frequency: 3, // aparece a cada 3 views
        customCSS: '',
        customJS: '',
        clickAction: {
            type: 'url',
            value: 'https://www.buymeacoffee.com/gabrielbaiano'
        }
    }
];

// Configurações globais dos banners
const bannerSettings = {
    globalEnabled: true, // habilita/desabilita todos os banners
    defaultHeight: 15,
    animationDuration: 300, // duração da animação em ms
    spacing: 0, // espaço extra entre banners e views
    respectScrolling: true, // se os banners devem seguir o scroll
    themes: {
        default: {
            background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
            textColor: 'white',
            fontSize: '12px'
        },
        dark: {
            background: 'linear-gradient(45deg, #1a1a1a 0%, #2d2d2d 100%)',
            textColor: '#ffffff',
            fontSize: '12px'
        },
        colorful: {
            background: 'linear-gradient(45deg, #ff6b6b 0%, #ffa500 100%)',
            textColor: 'white',
            fontSize: '12px'
        },
        minimal: {
            background: '#f5f5f5',
            textColor: '#333333',
            fontSize: '12px'
        }
    },
    currentTheme: 'default'
};

// Função para criar banners customizados
function createCustomBanner(config) {
    return {
        id: config.id || 'custom-' + Date.now(),
        name: config.name || 'Custom Banner',
        path: config.path || '',
        enabled: config.enabled !== false,
        height: config.height || bannerSettings.defaultHeight,
        position: config.position || 'between_views',
        frequency: config.frequency || 1,
        customCSS: config.customCSS || '',
        customJS: config.customJS || '',
        clickAction: config.clickAction || { type: 'disabled' },
        content: config.content || '', // HTML content direto
        style: config.style || {} // estilos inline
    };
}

// Função para gerar HTML de banner customizado
function generateBannerHTML(banner, theme = bannerSettings.themes[bannerSettings.currentTheme]) {
    const styles = {
        height: `${banner.height}px`,
        background: banner.style.background || theme.background,
        color: banner.style.textColor || theme.textColor,
        fontSize: banner.style.fontSize || theme.fontSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: banner.clickAction.type !== 'disabled' ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        fontWeight: 'bold',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
        ...banner.style
    };

    const styleString = Object.entries(styles)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
        .join('; ');

    const clickHandler = banner.clickAction.type === 'url' 
        ? `onclick="window.open('${banner.clickAction.value}', '_blank')"` 
        : banner.clickAction.type === 'function' 
        ? `onclick="${banner.clickAction.value}"` 
        : '';

    return `
        <div style="${styleString}" ${clickHandler}>
            ${banner.content || banner.name}
            ${banner.customCSS ? `<style>${banner.customCSS}</style>` : ''}
            ${banner.customJS ? `<script>${banner.customJS}</script>` : ''}
        </div>
    `;
}

// Função para validar configuração de banner
function validateBannerConfig(config) {
    const errors = [];
    
    if (!config.id) errors.push('ID é obrigatório');
    if (!config.name) errors.push('Nome é obrigatório');
    if (!config.path && !config.content) errors.push('Path ou content é obrigatório');
    if (config.height && (config.height < 1 || config.height > 100)) {
        errors.push('Altura deve estar entre 1 e 100 pixels');
    }
    if (config.frequency && (config.frequency < 0 || config.frequency > 10)) {
        errors.push('Frequência deve estar entre 0 e 10');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

module.exports = {
    defaultBanners,
    bannerSettings,
    createCustomBanner,
    generateBannerHTML,
    validateBannerConfig
};
