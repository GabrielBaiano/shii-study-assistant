<p align="center">
  <img src="/icon.png" alt="Logo do Shii! App" width="200"/>
</p>

<h1 align="center">Shii!</h1>

<p align="center">
  <a href="/README.md" target="_blank">English</a>
  &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="https://github.com/GabrielBaiano/shii/issues/new?title=Sugestão%20ou%20Bug%20no%20Shii!&body=**Descreva%20sua%20ideia%20ou%20o%20problema%20aqui:**%0A%0A%0A**Passos%20para%20reproduzir%20(se%20for%20um%20bug):**%0A1.%20...%0A2.%20...%0A%0A**Qualquer%20outra%20informação%20relevante?**%0A" target="_blank">Reportar Bug / Sugestão</a>
  &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="https://www.linkedin.com/in/gabriel-nascimento-gama-5b0b30185/" target="_blank">LinkedIn</a>
</p>

---

<p align="center">
  <img src="https://i.imgur.com/your-showcase-image.gif" alt="Demonstração do Shii! App"/>
</p>

**Shii!** é um cliente de desktop minimalista e seguro para a API do Google Gemini, projetado com foco em privacidade e produtividade para estudantes. Converse com a IA diretamente do seu computador com a funcionalidade única de proteção de tela, que torna a janela invisível para softwares de gravação e compartilhamento de tela.

## 🎓 Funcionalidades Principais

* **Proteção de Compartilhamento de Tela**: Ative o modo de proteção para que o conteúdo da janela não possa ser capturado por ferramentas de gravação ou em transmissões ao vivo. Ideal para privacidade durante sessões de estudo.
* **Experiência de Desktop Nativa**: Interface limpa e sem distrações, construída com Electron para rodar perfeitamente no seu sistema operacional.
* **Design Focado em Estudantes**: Otimizado para estudantes que precisam de acesso rápido à assistência de IA mantendo a privacidade.
* **Integração de Sites Personalizados**: Adicione seus próprios sites de estudo e ferramentas ao app para uma experiência personalizada.

## 🛠️ Tecnologias Utilizadas

* **Framework**: Electron
* **Linguagem**: JavaScript
* **Módulo Nativo**: C++ com `node-addon-api` para a funcionalidade de proteção de tela.
* **Interface**: HTML, CSS
* **Empacotamento**: electron-builder
* **Bibliotecas**: `marked.js` (Markdown), `highlight.js` (Destaque de Código)

## 📖 Como Usar e Instalar

A instalação é simples e direta.

1. Acesse a **[Página de Releases aqui](https://github.com/GabrielBaiano/shii/tags)**.
2. Baixe o instalador mais recente para o seu sistema operacional (ex: `Shii-Setup-X.X.X.exe` para Windows).
3. Execute o instalador.
   * **Observação para Windows:** O SmartScreen pode exibir um aviso de "Editor Desconhecido". Isso é normal. Clique em "Mais informações" e depois em "Executar assim mesmo".
4. Entre em **[Google AI Studio](https://aistudio.google.com/)** para pegar sua API key.

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
git clone https://github.com/GabrielBaiano/shii.git

# 2. Navegue até a pasta do projeto
cd shii

# 3. Instale as dependências
npm install

# 4. Rode em modo de desenvolvimento
npm start

# 5. Para criar os instaladores
npm run package
```

## 🔒 Privacidade e Segurança

O Shii! é construído pensando na privacidade dos estudantes:
- Nenhuma coleta ou rastreamento de dados
- Todas as conversas com IA ficam no seu dispositivo
- Proteção de tela previne compartilhamento acidental durante apresentações
- Código aberto - você pode verificar o que o app faz

## 📚 Perfeito para Estudantes

- **Sessões de Estudo**: Converse com IA para ajuda com tarefas e pesquisas
- **Apresentações**: Proteção de tela garante que suas conversas com IA fiquem privadas
- **Pesquisa**: Acesso rápido a ferramentas de estudo e sites
- **Produtividade**: Ferramentas integradas para anotações e gerenciamento de tarefas

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para enviar um Pull Request.

## 📄 Licença

Este projeto está licenciado sob a Licença ISC.

---

<p align="center">
  Feito com ❤️ por <a href="https://github.com/GabrielBaiano" target="_blank">GabrielBaiano</a>
</p>
