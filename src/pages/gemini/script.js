const API_URL =
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=";
const chatForm = document.getElementById("chat-form");
const promptInput = document.getElementById("prompt-input");
const chatContainer = document.getElementById("chat-container");
const apiKeyInput = document.getElementById("api-key");

window.addEventListener("DOMContentLoaded", () => {
  const savedKey = localStorage.getItem("googleApiKey");
  if (savedKey) apiKeyInput.value = savedKey;
});

apiKeyInput.addEventListener("input", () => {
  localStorage.setItem("googleApiKey", apiKeyInput.value.trim());
});

function addMessage(sender, message) {
  const div = document.createElement("div");
  div.classList.add("chat-message", sender);
  const content = document.createElement("div");
  content.classList.add("message-content");

  // Converte Markdown -> HTML
  content.innerHTML = marked.parse(message);

  // Aplica highlight.js no código
  content.querySelectorAll("pre code").forEach((block) => {
    hljs.highlightElement(block);
  });

  div.appendChild(content);
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendToGemini(prompt, apiKey, imageBase64 = null) {
  addMessage("user", prompt + (imageBase64 ? " [Imagem enviada]" : ""));
  const loadingDiv = document.createElement("div");
  loadingDiv.classList.add("chat-message", "model");
  loadingDiv.innerHTML = `<div class="message-content loading"><p>Digitando...</p></div>`;
  chatContainer.appendChild(loadingDiv);

  try {
    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            ...(imageBase64
              ? [{ inlineData: { mimeType: "image/png", data: imageBase64 } }]
              : []),
          ],
        },
      ],
    };

    const res = await fetch(`${API_URL}${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    chatContainer.removeChild(loadingDiv);

    let modelText = "Erro: resposta vazia.";
    if (data.candidates?.length && data.candidates[0].content?.parts?.length) {
      modelText = data.candidates[0].content.parts[0].text;
    }
    addMessage("model", modelText);
  } catch (err) {
    chatContainer.removeChild(loadingDiv);
    addMessage("model", "Erro: " + err.message);
  }
}

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const prompt = promptInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) return alert("Insira sua API Key.");
  if (prompt) {
    sendToGemini(prompt, apiKey);
    promptInput.value = "";
  }
});

document.addEventListener("paste", (e) => {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) return alert("Insira sua API Key.");
  if (e.clipboardData) {
    const item = Array.from(e.clipboardData.items).find((i) =>
      i.type.startsWith("image/")
    );
    if (item) {
      const file = item.getAsFile();
      const reader = new FileReader();
      reader.onload = function (evt) {
        const base64 = evt.target.result.split(",")[1];
        sendToGemini(
          "Explique este problema do leetcode em português e mostre o código resposta:",
          apiKey,
          base64
        );
      };
      reader.readAsDataURL(file);
    }
  }
});
