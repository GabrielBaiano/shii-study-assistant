let isPhase1 = true;
const textElement = document.querySelector('.text');
const heartIcon = document.querySelector('.heart-icon');
const coffeeIcon = document.querySelector('.coffee-icon');

// Alternar entre as duas frases a cada 3 segundos (sincronizado com a animação)
setInterval(() => {
    if (isPhase1) {
        // Mudar para fase 2: Buy me a coffee
        textElement.className = 'text phase2';
        heartIcon.style.opacity = '0';
        coffeeIcon.style.opacity = '1';
    } else {
        // Mudar para fase 1: You like my app?
        textElement.className = 'text phase1';
        heartIcon.style.opacity = '1';
        coffeeIcon.style.opacity = '0';
    }
    isPhase1 = !isPhase1;
}, 3000);

function openCoffeePage() {
    // Abrir página do Buy Me a Coffee no navegador padrão
    const { shell } = require('electron');
    shell.openExternal('https://www.buymeacoffee.com/gabrielbaiano');
}

// Adicionar efeito de hover suave
document.body.addEventListener('mouseenter', function() {
    this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
});

document.body.addEventListener('mouseleave', function() {
    this.style.boxShadow = 'none';
});

// Efeito de clique
document.body.addEventListener('mousedown', function() {
    this.style.transform = 'scale(0.98)';
});

document.body.addEventListener('mouseup', function() {
    this.style.transform = 'scale(1.02)';
});
