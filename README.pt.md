<p align="center">
  <img src="https://github.com/GabrielBaiano/shii-study-assistant/blob/main/build/icon-256.png?raw=true" alt="Logo do Shii! App" width="200"/>
</p>

<h1 align="center">Shii!</h1>

<p align="center">
  <strong>Um cliente de desktop minimalista e seguro para a API do Google Gemini</strong><br>
  <em>Projetado para estudantes com foco em privacidade e produtividade</em>
</p>

<p align="center">
  <a href="/README.md" target="_blank">🇺🇸 English</a>
  &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="https://github.com/GabrielBaiano/shii-study-assistant/releases" target="_blank">📦 Downloads</a>
  &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="https://github.com/GabrielBaiano/stelthapp_test" target="_blank">📚 Versão Original</a>
  &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="https://github.com/GabrielBaiano/shii-study-assistant/issues/new?title=Sugestão%20ou%20Bug%20no%20Shii!&body=**Descreva%20sua%20ideia%20ou%20o%20problema%20aqui:**%0A%0A%0A**Passos%20para%20reproduzir%20(se%20for%20um%20bug):**%0A1.%20...%0A2.%20...%0A%0A**Qualquer%20outra%20informação%20relevante?**%0A" target="_blank">🐛 Reportar Bug</a>
</p>

<p align="center">
  <a href="https://github.com/GabrielBaiano/shii-study-assistant/stargazers">
    <img src="https://img.shields.io/github/stars/GabrielBaiano/shii-study-assistant?style=social" alt="GitHub stars">
  </a>
  <a href="https://github.com/GabrielBaiano/shii-study-assistant/issues">
    <img src="https://img.shields.io/github/issues/GabrielBaiano/shii-study-assistant" alt="GitHub issues">
  </a>
  <a href="https://github.com/GabrielBaiano/shii-study-assistant/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/GabrielBaiano/shii-study-assistant" alt="License">
  </a>
  <a href="https://github.com/GabrielBaiano/shii-study-assistant/releases">
    <img src="https://img.shields.io/github/v/release/GabrielBaiano/shii-study-assistant" alt="Latest Release">
  </a>
</p>

---

<p align="center">
  <img src="https://i.imgur.com/your-showcase-image.gif" alt="Demonstração do Shii! App"/>
</p>

**Shii!** é um cliente de desktop minimalista e seguro para a API do Google Gemini, projetado com foco em privacidade e produtividade para estudantes. Converse com a IA diretamente do seu computador com a funcionalidade única de proteção de tela, que torna a janela invisível para softwares de gravação e compartilhamento de tela.

> 📚 **Evolução do Projeto**: Esta é a versão aprimorada do [StelthApp](https://github.com/GabrielBaiano/stelthapp_test) com recursos melhorados, documentação aprimorada e design focado em estudantes. Confira a versão original para comparação!

## 🎓 Funcionalidades Principais

* **🕵️ Modo Stealth Avançado**: Ative o modo de proteção para que o conteúdo da janela não possa ser capturado por ferramentas de gravação ou em transmissões ao vivo. Ideal para privacidade durante sessões de estudo.
* **🚀 Inicialização Automática**: Configure o app para iniciar automaticamente com o Windows para acesso instantâneo.
* **🎛️ System Tray Simplificado**: Interface de bandeja do sistema limpa com apenas as funções essenciais - status do stealth, inicialização automática e quit.
* **⌨️ Atalhos Globais**: Use `Ctrl+Alt+↑/↓` para rolar, `Ctrl+Alt+L` para alternar stealth, `Ctrl+Alt+T` para sempre no topo.
* **📱 Widgets Integrados**: Relógio, Pomodoro, Gemini AI, Organizador e mais widgets úteis para estudo.
* **🔒 Terminação Segura**: Sistema aprimorado de encerramento que garante que todos os processos sejam finalizados corretamente.

## 🛠️ Tecnologias Utilizadas

* **Framework**: Electron
* **Linguagem**: JavaScript
* **Módulo Nativo**: C++ com `node-addon-api` para a funcionalidade de proteção de tela.
* **Interface**: HTML, CSS
* **Empacotamento**: electron-builder
* **Bibliotecas**: `marked.js` (Markdown), `highlight.js` (Destaque de Código)

## 🚀 Instalação Rápida

### 📥 Download e Instalação

1. **Download**: Acesse a **[Página de Releases](https://github.com/GabrielBaiano/shii-study-assistant/releases)** e baixe a versão mais recente
2. **Instalação**: Execute o instalador (usuários Windows podem ver aviso do SmartScreen - clique em "Mais informações" → "Executar assim mesmo")
3. **API Key**: Obtenha sua chave gratuita em **[Google AI Studio](https://aistudio.google.com/)**
4. **Primeiro Uso**: Abra o Shii! e cole sua API key para começar a conversar com o Gemini

### ⚡ Primeiros Passos

- **💬 Chat**: Comece digitando para conversar com a IA do Google Gemini
- **🕵️ Modo Stealth**: Ative o modo stealth para se esconder de gravações de tela
- **🚀 Auto-Start**: Configure para iniciar com o Windows no menu da bandeja
- **⌨️ Atalhos**: Use `Ctrl+Alt+↑/↓` para rolar, `Ctrl+Alt+L` para stealth, `Ctrl+Alt+T` para sempre no topo

## 🌐 Adicionando Seus Próprios Sites

O Shii! permite que você adicione seus próprios sites de estudo e ferramentas de duas formas:

### Método 1: Modo Desenvolvedor (Usuários Avançados)

1. Clone o repositório e navegue até a pasta do projeto
2. Abra o diretório `src/pages/`
3. Crie uma nova pasta para seu site (ex: `meu-site-estudo/`)
4. Crie um arquivo `index.html` com o conteúdo do seu site
5. Atualize a configuração principal da aplicação para incluir sua nova página
6. Compile e execute a aplicação

### Método 2: Links Rápidos (Método Fácil)

1. Abra o aplicativo Shii!
2. Vá para Configurações
3. Adicione URLs de sites na seção "Links Personalizados"
4. Seus sites aparecerão como botões de acesso rápido na interface principal

### Tipos de Sites Suportados:
- Plataformas de estudo (Coursera, Khan Academy, etc.)
- Apps de anotações (Notion, Obsidian, etc.)
- Ferramentas de pesquisa (Google Scholar, PubMed, etc.)
- Apps de produtividade (Todoist, Trello, etc.)
- Qualquer site que funcione em um navegador

## 💻 Para Desenvolvedores

Se você deseja clonar o repositório e rodar o projeto localmente:

```bash
# 1. Clone o repositório
git clone https://github.com/GabrielBaiano/shii-study-assistant.git

# 2. Navegue até a pasta do projeto
cd shii-study-assistant

# 3. Instale as dependências
npm install

# 4. Rode em modo de desenvolvimento
npm start

# 5. Para criar o build completo
npm run build

# 6. Para criar apenas o pacote (sem ZIP)
npm run pack
```

## 🔒 Privacidade e Segurança

O Shii! é construído pensando na privacidade dos estudantes:
- Nenhuma coleta ou rastreamento de dados
- Todas as conversas com IA ficam no seu dispositivo
- Proteção de tela previne compartilhamento acidental durante apresentações
- Código aberto - você pode verificar o que o app faz

## 🆕 Novidades da Versão 2.0.0

### ✨ Principais Melhorias
- **🎛️ System Tray Redesenhado**: Interface simplificada com apenas funções essenciais
- **🚀 Auto-Start Integrado**: Opção para iniciar automaticamente com o Windows
- **🔒 Encerramento Aprimorado**: Sistema de quit que garante finalização completa do app
- **⌨️ Atalhos Melhorados**: Sistema de atalhos globais mais robusto e confiável
- **📱 Widgets Otimizados**: Páginas não arrastáveis para melhor experiência de uso
- **🏗️ Arquitetura Limpa**: Remoção de arquivos não utilizados e reorganização do projeto

### 🛠️ Melhorias Técnicas
- **📦 Build Otimizado**: Configuração aprimorada do electron-builder
- **🔧 Recursos Incluídos**: Páginas HTML e ícones corretamente empacotados
- **⚡ Performance**: Melhor tratamento de erros e inicialização mais rápida
- **🧹 Código Limpo**: Remoção de dependências de teste e arquivos desnecessários

## 📚 Perfeito para Estudantes

- **Sessões de Estudo**: Converse com IA para ajuda com tarefas e pesquisas
- **Apresentações**: Proteção de tela garante que suas conversas com IA fiquem privadas
- **Pesquisa**: Acesso rápido a ferramentas de estudo e sites
- **Produtividade**: Ferramentas integradas para anotações e gerenciamento de tarefas
- **🚀 Acesso Rápido**: Inicialização automática para acesso instantâneo ao app

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para enviar um Pull Request.

## 📄 Licença

Este projeto está licenciado sob a Licença ISC.

---

<p align="center">
  Feito com ❤️ por <a href="https://github.com/GabrielBaiano" target="_blank">GabrielBaiano</a>
</p>
