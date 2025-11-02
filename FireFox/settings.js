// settings.js - VERSION AVEC MESSAGE AMÉLIORÉ

// Gestion de compatibilité cross-navigateur
function getBrowserAPI() {
    if (typeof browser !== 'undefined') {
        return browser;
    } else if (typeof chrome !== 'undefined') {
        return chrome;
    } else {
        console.error('API d\'extension non trouvée');
        return null;
    }
}

const browserAPI = getBrowserAPI();

// Reprise des données de traduction
const translations = {
    'en': {
        'settings_page_title': "Utility Settings",
        'ia_summarizer_label': "Enable AI Summarizer button on web pages",
        'ia_summarizer_desc': "(Adds a '✨' button to the left of all pages to generate a summary of the content.)"
    },
    'fr': {
        'settings_page_title': "Paramètres de l'Utilitaire",
        'ia_summarizer_label': "Activer le bouton de résumé IA sur les pages web",
        'ia_summarizer_desc': "(Ajoute un bouton '✨' à gauche de toutes les pages pour générer un résumé du contenu.)"
    },
    'es_es': {
        'settings_page_title': "Configuración de Utilidad",
        'ia_summarizer_label': "Habilitar el botón Resumidor de IA en páginas web",
        'ia_summarizer_desc': "(Agrega un botón '✨' a la izquierda de todas las páginas para generar un resumen del contenido.)"
    },
    'es_la': {
        'settings_page_title': "Ajustes de Utilidad",
        'ia_summarizer_label': "Habilitar el botón Resumidor de IA en páginas web",
        'ia_summarizer_desc': "(Agrega un botón '✨' a la izquierda de todas las páginas para generar un resumen del contenido.)"
    }
};

/**
 * Met à jour le contenu de la page de paramètres avec la langue sélectionnée.
 * @param {string} lang - Code de la langue.
 */
function updateContent(lang) {
    const langData = translations[lang];
    if (!langData) return;
    
    document.getElementById('settings-title').textContent = langData['settings_page_title'];
    
    // CORRECTION: Cible le <span> pour le label
    const labelSpan = document.getElementById('ia-summarizer-toggle').nextElementSibling;
    if (labelSpan) {
        labelSpan.textContent = langData['ia_summarizer_label'];
    }

    // CORRECTION: Cible le <small> par son ID
    const descSmall = document.getElementById('ia-summarizer-desc-text');
    if (descSmall) {
        descSmall.textContent = langData['ia_summarizer_desc'];
    }
}

/**
 * Change le thème (clair/sombre) et le sauve dans localStorage.
 */
function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// GESTION DU TOGGLE ET INITIALISATION
document.addEventListener('DOMContentLoaded', () => {
    console.log('Settings page loaded');
    
    // Initialisation du thème
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Initialisation de la langue
    const savedLang = localStorage.getItem('menuLang') || 'en';
    updateContent(savedLang);

    // Écouteur pour le thème
    document.getElementById('theme-toggle-settings').addEventListener('click', toggleTheme);
    
    const toggle = document.getElementById('ia-summarizer-toggle');

    if (!browserAPI) {
        console.error('API non disponible dans settings');
        return;
    }

    // Charger l'état sauvegardé de l'option IA
    browserAPI.storage.local.get('iaSummarizerEnabled', (data) => {
        console.log('Chargement paramètre IA:', data.iaSummarizerEnabled);
        toggle.checked = data.iaSummarizerEnabled || false;
    });

    // Sauvegarder l'état de l'option IA lors du changement
    toggle.addEventListener('change', () => {
        const isEnabled = toggle.checked;
        console.log('Changement paramètre IA:', isEnabled);
        browserAPI.storage.local.set({ 'iaSummarizerEnabled': isEnabled });
        
        // Message de confirmation amélioré
        const status = isEnabled ? 'activé' : 'désactivé';
        const message = isEnabled 
            ? "✅ Résumeur IA activé ! Le bouton '✨' apparaîtra automatiquement sur toutes les pages web."
            : "❌ Résumeur IA désactivé. Le bouton '✨' disparaîtra des pages web.";
        
        alert(message);
    });
});
