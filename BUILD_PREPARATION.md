# Preparação para Build - Correções de Pathing

Este documento descreve as correções implementadas para preparar o Stealth App para a versão buildada.

## Problemas Identificados e Soluções

### 1. Função Helper `getAppPath()`
**Problema**: Paths hardcoded usando `__dirname` não funcionam corretamente em builds do Electron.

**Solução**: Criada função helper que detecta se o app está em modo de desenvolvimento ou buildado:

```javascript
function getAppPath(relativePath) {
  if (app.isPackaged) {
    // Em build: recursos estão em process.resourcesPath/app/
    return path.join(process.resourcesPath, 'app', relativePath);
  } else {
    // Em desenvolvimento: usar __dirname
    return path.join(__dirname, relativePath);
  }
}
```

### 2. Static Sources (Páginas Fixas)
**Arquivo**: `main.js` (linhas 77-81)
**Correção**: 
- Gemini: `getAppPath(path.join('src', 'pages', 'gemini', 'index.html'))`
- Pomodoro: `getAppPath(path.join('src', 'pages', 'pomodoro', 'index.html'))`
- Placeholder: `getAppPath(path.join('src', 'pages', 'placeholder', 'index.html'))`

### 3. Ícone do System Tray
**Arquivo**: `main.js` (linha 415)
**Correção**: `getAppPath("icon.png")`

### 4. Preload Script e Página de Configurações
**Arquivo**: `main.js` (linhas 510, 514)
**Correções**:
- Preload: `getAppPath("preload-settings.js")`
- Settings: `getAppPath(path.join("src", "pages", "settings", "index.html"))`

### 5. Módulo Nativo Stealth
**Arquivo**: `main.js` (linha 22)
**Correção**: `getAppPath(path.join("src", "native", "index.js"))`

### 6. Configuração de Banners
**Arquivo**: `src/banners/banners-config.js`
**Correções**:
- Gabriel Banner: `getAppPath(path.join('src', 'banners', 'gabriel-banner', 'index.html'))`
- Coffee Banner: `getAppPath(path.join('src', 'banners', 'coffee-banner', 'index.html'))`

## Estrutura de Arquivos Esperada no Build

```
app.asar/
├── main.js
├── preload-settings.js
├── icon.png
└── src/
    ├── pages/
    │   ├── gemini/
    │   ├── pomodoro/
    │   ├── placeholder/
    │   └── settings/
    ├── banners/
    │   ├── gabriel-banner/
    │   └── coffee-banner/
    └── native/
        └── index.js
```

## Configuração do Electron Builder

Para garantir que os arquivos sejam incluídos corretamente no build, verifique se o `package.json` ou `electron-builder.yml` inclui:

```json
{
  "build": {
    "files": [
      "**/*",
      "!node_modules/**/*",
      "!src/**/*.md"
    ],
    "extraResources": [
      {
        "from": "src",
        "to": "app/src"
      }
    ]
  }
}
```

## Testes Recomendados

1. **Desenvolvimento**: Verificar se o app funciona normalmente em modo dev
2. **Build Local**: Testar build local com `npm run build` ou `electron-builder`
3. **Instalação**: Testar instalação do pacote gerado
4. **Funcionalidades**: Verificar se todas as páginas, banners e funcionalidades carregam corretamente

## Notas Importantes

- A função `getAppPath()` deve ser definida antes de qualquer uso
- Todos os paths relativos agora usam a função helper
- O módulo `app` do Electron deve estar disponível para `app.isPackaged`
- Arquivos estáticos devem estar na estrutura correta para serem encontrados em build

## Status

✅ Todas as correções de pathing foram implementadas
✅ Código testado para ausência de erros de linting
✅ Documentação criada para referência futura
