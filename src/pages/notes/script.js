// Configuração do marked
marked.setOptions({
  highlight: function (code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: 'hljs language-'
});

const STORAGE_KEY = 'notes_markdown_content_v1';

const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');

function render() {
  const value = editor.value;
  preview.innerHTML = marked.parse(value || '');
  // aplica highlight em caso de atualização dinâmica
  preview.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
}

function load() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && typeof saved === 'string') {
    editor.value = saved;
  } else {
    editor.value = '# Anotações\n\nComece a escrever seu markdown aqui!';
  }
  render();
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, editor.value); } catch (_) {}
}

// Eventos
editor.addEventListener('input', () => { render(); save(); });

clearBtn.addEventListener('click', () => {
  if (confirm('Limpar todas as anotações?')) {
    editor.value = '';
    save();
    render();
  }
});

downloadBtn.addEventListener('click', () => {
  const blob = new Blob([editor.value || ''], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'notes.md';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// atalhos
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    clearBtn.click();
  }
});

// Inicialização
load();

