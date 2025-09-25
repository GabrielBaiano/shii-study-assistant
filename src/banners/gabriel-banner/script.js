function openGitHub() {
    // Abrir o GitHub do Gabriel no navegador padrão
    const { shell } = require('electron');
    shell.openExternal('https://github.com/GabrielBaiano');
}

// Adicionar efeito de hover suave
document.body.addEventListener('mouseenter', function() {
    this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
});

document.body.addEventListener('mouseleave', function() {
    this.style.boxShadow = 'none';
});
