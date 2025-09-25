// Sistema de configuração de banners publicitários
// Este arquivo permite customizar completamente os banners do app

const { app } = require('electron');
const path = require('path');

// Helper function to get correct path for both dev and build
function getAppPath(relativePath) {
  // In development, __dirname points to src/banners/ directory
  // In build, __dirname points to the app.asar directory
  if (app && app.isPackaged) {
    // In packaged app, resources are in app.asar.unpacked or in the same directory
    // Try multiple possible locations for the app resources
    const possiblePaths = [
      path.join(process.resourcesPath, 'app', relativePath),
      path.join(process.resourcesPath, relativePath),
      path.join(process.resourcesPath, 'app.asar.unpacked', relativePath)
    ];
    
    // Return the first path that exists, or the first one if none exist
    for (const possiblePath of possiblePaths) {
      try {
        if (fs.existsSync(possiblePath)) {
          console.log(`✅ Found banner resource at: ${possiblePath}`);
          return possiblePath;
        }
      } catch (e) {
        // Continue to next path
      }
    }
    
    console.log(`⚠️ Banner resource not found, using fallback path: ${possiblePaths[0]}`);
    return possiblePaths[0];
  } else {
    // In development, go up from src/banners/ to project root, then add relativePath
    const projectRoot = path.join(__dirname, '..', '..');
    return path.join(projectRoot, relativePath);
  }
}

const defaultBanners = [
    {
        id: 'gabriel-banner',
        name: 'Made by GabrielBaiano',
        path: getAppPath(path.join('src', 'banners', 'gabriel-banner', 'index.html')),
        enabled: true,
        height: 20, // altura em pixels
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
        height: 20,
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
    defaultHeight: 20,
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
