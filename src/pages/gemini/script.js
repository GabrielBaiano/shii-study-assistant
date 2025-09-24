const API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=";

// Elementos DOM
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const apiKeyInput = document.getElementById('api-key');
const toggleApiKey = document.getElementById('toggle-api-key');
const imageButton = document.getElementById('image-button');
const fileInput = document.getElementById('file-input');
const imagePreview = document.getElementById('image-preview');
const previewImg = document.getElementById('preview-img');
const imageSize = document.getElementById('image-size');
const removeImage = document.getElementById('remove-image');
const commandInfo = document.getElementById('command-info');
const messageCount = document.getElementById('message-count');
const apiStatus = document.getElementById('api-status');

// Estado da aplicação
let currentImage = null;
let messageCounter = 0;
let isApiKeyVisible = false;

// Configuração do marked
marked.setOptions({
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: 'hljs language-'
});

// Carrega API key salva
window.addEventListener('DOMContentLoaded', () => {
  const savedKey = localStorage.getItem('googleApiKey');
  if (savedKey) {
    apiKeyInput.value = savedKey;
    updateApiStatus();
  }
  updateSendButton();
});

// Toggle visibilidade da API key
toggleApiKey.addEventListener('click', () => {
  isApiKeyVisible = !isApiKeyVisible;
  apiKeyInput.type = isApiKeyVisible ? 'text' : 'password';
  toggleApiKey.textContent = isApiKeyVisible ? '🙈' : '👁';
});

// Salva API key
apiKeyInput.addEventListener('input', () => {
  localStorage.setItem('googleApiKey', apiKeyInput.value.trim());
  updateApiStatus();
  updateSendButton();
});

// Atualiza status da API
function updateApiStatus() {
  const hasKey = apiKeyInput.value.trim().length > 0;
  apiStatus.textContent = hasKey ? 'API Key configurada' : 'API Key não configurada';
}

// Atualiza botão de envio
function updateSendButton() {
  const hasApiKey = apiKeyInput.value.trim().length > 0;
  const hasMessage = messageInput.value.trim().length > 0;
  const hasImage = currentImage !== null;
  
  sendButton.disabled = !hasApiKey || (!hasMessage && !hasImage);
}

// Auto-resize do textarea
messageInput.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
  updateSendButton();
  
  // Mostra/esconde info de comandos
  const value = messageInput.value;
  if (value.startsWith('/')) {
    commandInfo.style.display = 'block';
  } else {
    commandInfo.style.display = 'none';
  }
});

// Enter para enviar (Shift+Enter para nova linha)
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage();
  }
});

// Botão de envio
sendButton.addEventListener('click', handleSendMessage);

// Seleção de imagem
imageButton.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith('image/')) {
    handleImageSelect(file);
  }
});

// Remover imagem
removeImage.addEventListener('click', () => {
  currentImage = null;
  imagePreview.style.display = 'none';
  fileInput.value = '';
  updateSendButton();
});

// Cole de imagem
document.addEventListener('paste', (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault();
      const file = item.getAsFile();
      if (file) {
        handleImageSelect(file);
      }
      break;
    }
  }
});

// Manipula seleção de imagem
function handleImageSelect(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    currentImage = e.target.result.split(',')[1]; // Remove data:image/...;base64,
    previewImg.src = e.target.result;
    imageSize.textContent = `${(file.size / 1024).toFixed(1)} KB`;
    imagePreview.style.display = 'flex';
    updateSendButton();
  };
  reader.readAsDataURL(file);
}

// Manipula envio de mensagem
function handleSendMessage() {
  const message = messageInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    alert('Por favor, insira sua Google AI API Key.');
    return;
  }

  // Comandos
  if (message.startsWith('/')) {
    handleCommand(message);
    return;
  }

  if (!message && !currentImage) return;

  const finalMessage = message || 'Analise esta imagem';
  sendToGemini(finalMessage, apiKey, currentImage);
  
  messageInput.value = '';
  messageInput.style.height = 'auto';
  currentImage = null;
  imagePreview.style.display = 'none';
  fileInput.value = '';
  commandInfo.style.display = 'none';
  updateSendButton();
}

// Manipula comandos
function handleCommand(command) {
  const cmd = command.toLowerCase().trim();
  
  if (cmd === '/clear') {
    clearChat();
    messageInput.value = '';
    commandInfo.style.display = 'none';
    updateSendButton();
  }
}

// Limpa o chat
function clearChat() {
  chatContainer.innerHTML = `
    <div class="welcome-message">
      <div class="ai-icon">✨</div>
      <p>Chat limpo!</p>
      <p>Envie uma nova mensagem para continuar.</p>
    </div>
  `;
  messageCounter = 0;
  updateMessageCount();
}

// Adiciona mensagem ao chat
function addMessage(sender, content, isLoading = false) {
  // Remove mensagem de boas-vindas se existir
  const welcomeMessage = chatContainer.querySelector('.welcome-message');
  if (welcomeMessage) {
    welcomeMessage.remove();
  }

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}-message ${isLoading ? 'loading-message' : ''}`;
  
  const avatar = document.createElement('div');
  avatar.className = `message-avatar ${sender}-avatar`;
  avatar.textContent = sender === 'user' ? 'U' : 'AI';
  
  const header = document.createElement('div');
  header.className = 'message-header';
  header.appendChild(avatar);
  header.appendChild(document.createTextNode(sender === 'user' ? 'Você' : 'Gemini AI'));
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
  if (isLoading) {
    contentDiv.innerHTML = '<span class="loading-dots">Pensando</span>';
  } else {
    // Parse markdown
    contentDiv.innerHTML = marked.parse(content);
    
    // Adiciona botões de copiar em blocos de código
    contentDiv.querySelectorAll('pre').forEach((pre, index) => {
      const code = pre.querySelector('code');
      if (code) {
        const language = code.className.match(/language-(\w+)/)?.[1] || 'text';
        
        const header = document.createElement('div');
        header.className = 'code-header';
        header.innerHTML = `
          <span>${language}</span>
          <button class="copy-button" data-code="${index}">Copiar</button>
        `;
        
        pre.insertBefore(header, code);
      }
    });

    // Aplica highlight
    contentDiv.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
  }
  
  messageDiv.appendChild(header);
  messageDiv.appendChild(contentDiv);
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  if (!isLoading) {
    messageCounter++;
    updateMessageCount();
  }

  return messageDiv;
}

// Event delegation para botões de copiar
chatContainer.addEventListener('click', (e) => {
  if (e.target.classList.contains('copy-button')) {
    const pre = e.target.closest('pre');
    const code = pre.querySelector('code');
    if (code) {
      navigator.clipboard.writeText(code.textContent).then(() => {
        e.target.textContent = 'Copiado!';
        e.target.classList.add('copied');
        setTimeout(() => {
          e.target.textContent = 'Copiar';
          e.target.classList.remove('copied');
        }, 2000);
      });
    }
  }
});

// Atualiza contador de mensagens
function updateMessageCount() {
  messageCount.textContent = `${messageCounter} mensagens`;
}

// Envia para Gemini AI
async function sendToGemini(prompt, apiKey, imageBase64 = null) {
  // Adiciona mensagem do usuário
  let userMessage = prompt;
  if (imageBase64) {
    userMessage += ' 📷';
  }
  addMessage('user', userMessage);

  // Adiciona mensagem de loading
  const loadingMessage = addMessage('ai', '', true);

  try {
    const body = {
      contents: [{
        parts: [
          { text: prompt },
          ...(imageBase64 ? [{ 
            inlineData: { 
              mimeType: "image/png", 
              data: imageBase64 
            } 
          }] : [])
        ]
      }]
    };

    const response = await fetch(`${API_URL}${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    // Remove mensagem de loading
    chatContainer.removeChild(loadingMessage);

    let aiResponse = 'Desculpe, não consegui processar sua solicitação.';
    
    if (data.candidates?.length && data.candidates[0].content?.parts?.length) {
      aiResponse = data.candidates[0].content.parts[0].text;
    } else if (data.error) {
      aiResponse = `Erro da API: ${data.error.message}`;
    }

    addMessage('ai', aiResponse);

  } catch (error) {
    chatContainer.removeChild(loadingMessage);
    addMessage('ai', `Erro de conexão: ${error.message}`);
  }
}

// Inicialização
updateSendButton();
updateApiStatus();

