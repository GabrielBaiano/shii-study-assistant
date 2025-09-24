const path = require('path');

// Carregar o módulo nativo
let affinityAddon;
try {
  affinityAddon = require(path.join(__dirname, 'build', 'Release', 'affinity_addon.node'));
  console.log('✅ Módulo nativo affinity carregado com sucesso');
} catch (error) {
  console.log('⚠️ Módulo nativo não disponível:', error.message);
  affinityAddon = null;
}

class StealthManager {
  constructor() {
    this.isStealthMode = false;
    this.stealthedWindows = new Set();
  }

  /**
   * Aplicar stealth em uma janela pelo título
   * @param {string} title - Título da janela
   * @returns {boolean} - Sucesso da operação
   */
  applyStealthByTitle(title) {
    if (!affinityAddon) {
      console.log('⚠️ Módulo nativo não disponível');
      return false;
    }

    try {
      console.log(`🔍 Procurando janela: "${title}"`);
      
      // Obter handle da janela pelo título
      const hwnd = affinityAddon.getWindowByTitle(title);
      
      if (hwnd === null) {
        console.log(`❌ Janela não encontrada: "${title}"`);
        return false;
      }

      console.log(`✅ Janela encontrada: "${title}" (HWND: ${hwnd})`);
      
      // Aplicar stealth
      const result = affinityAddon.setWindowDisplayAffinity(hwnd);
      
      if (result) {
        this.stealthedWindows.add(title);
        this.isStealthMode = true;
        console.log(`✅ Stealth aplicado com sucesso em: "${title}"`);
      } else {
        console.log(`❌ Falha ao aplicar stealth em: "${title}"`);
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Erro ao aplicar stealth em "${title}":`, error.message);
      return false;
    }
  }

  /**
   * Remover stealth de uma janela pelo título
   * @param {string} title - Título da janela
   * @returns {boolean} - Sucesso da operação
   */
  removeStealthByTitle(title) {
    if (!affinityAddon) {
      console.log('⚠️ Módulo nativo não disponível');
      return false;
    }

    try {
      console.log(`👁️ Removendo stealth de: "${title}"`);
      
      // Obter handle da janela pelo título
      const hwnd = affinityAddon.getWindowByTitle(title);
      
      if (hwnd === null) {
        console.log(`❌ Janela não encontrada: "${title}"`);
        return false;
      }

      // Remover stealth
      const result = affinityAddon.removeWindowDisplayAffinity(hwnd);
      
      if (result) {
        this.stealthedWindows.delete(title);
        console.log(`✅ Stealth removido com sucesso de: "${title}"`);
      } else {
        console.log(`❌ Falha ao remover stealth de: "${title}"`);
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Erro ao remover stealth de "${title}":`, error.message);
      return false;
    }
  }

  /**
   * Aplicar stealth em múltiplas janelas
   * @param {Array<string>} titles - Array de títulos das janelas
   * @returns {boolean} - Sucesso da operação
   */
  applyStealthToMultipleWindows(titles) {
    if (!Array.isArray(titles) || titles.length === 0) {
      console.log('⚠️ Nenhuma janela para aplicar stealth');
      return false;
    }

    console.log(`🕵️ Aplicando stealth em ${titles.length} janelas...`);
    
    let successCount = 0;
    for (const title of titles) {
      try {
        const result = this.applyStealthByTitle(title);
        if (result) successCount++;
      } catch (error) {
        console.error(`❌ Erro ao processar janela "${title}":`, error.message);
      }
    }

    this.isStealthMode = successCount > 0;
    console.log(`✅ Stealth aplicado em ${successCount}/${titles.length} janelas`);
    
    return this.isStealthMode;
  }

  /**
   * Remover stealth de múltiplas janelas
   * @returns {boolean} - Sucesso da operação
   */
  removeStealthFromMultipleWindows() {
    if (this.stealthedWindows.size === 0) {
      console.log('⚠️ Nenhuma janela em modo stealth');
      return true;
    }

    console.log(`👁️ Removendo stealth de ${this.stealthedWindows.size} janelas...`);
    
    let successCount = 0;
    for (const title of this.stealthedWindows) {
      try {
        const result = this.removeStealthByTitle(title);
        if (result) successCount++;
      } catch (error) {
        console.error(`❌ Erro ao remover stealth de "${title}":`, error.message);
      }
    }

    this.isStealthMode = false;
    this.stealthedWindows.clear();
    console.log(`✅ Stealth removido de ${successCount} janelas`);
    
    return true;
  }

  /**
   * Verificar se está em modo stealth
   * @returns {boolean} - Status do modo stealth
   */
  isStealthActive() {
    return this.isStealthMode;
  }

  /**
   * Obter número de janelas com stealth aplicado
   * @returns {number} - Número de janelas
   */
  getStealthedWindowsCount() {
    return this.stealthedWindows.size;
  }
}

module.exports = new StealthManager();