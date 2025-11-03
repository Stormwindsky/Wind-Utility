// settings.js - VERSION COMPLÈTE AVEC ANTI SCAM .CO

console.log('Settings page loaded');

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

// ==================== DONNÉES DE TRADUCTION (i18n) ====================
const translations = {
    'en': {
        'settings_page_title': "Utility Settings",
        'ia_summarizer_label': "Enable AI summary button on web pages",
        'ia_summarizer_desc': "(Adds a '✨' button to the left of all pages to generate a summary of the content.)",
        'gamejolt_cleaner_label': "Gamejolt Cleaner (removes Joltydex element)",
        'gamejolt_cleaner_desc': "(Removes the Joltydex icon from the navigation bar on Gamejolt.com)",
        'gamejolt_pay_to_win_label': 'NO MORE "PAY TO WIN" (removes boosts and Joltbux)',
        'gamejolt_pay_to_win_desc': '(Removes all boost sections, Joltbux and paid elements on Gamejolt.com)',
        'anti_scam_co_label': 'Anti Scam .co (.co sites warning)',
        'anti_scam_co_desc': '(Warns when visiting .co sites, often used for phishing)'
    },
    'fr': {
        'settings_page_title': "Paramètres de l'Utilitaire",
        'ia_summarizer_label': "Activer le bouton de résumé IA sur les pages web",
        'ia_summarizer_desc': "(Ajoute un bouton '✨' à gauche de toutes les pages pour générer un résumé du contenu.)",
        'gamejolt_cleaner_label': "Nettoyeur Gamejolt (supprime l'élément Joltydex)",
        'gamejolt_cleaner_desc': "(Supprime l'icône Joltydex de la barre de navigation sur Gamejolt.com)",
        'gamejolt_pay_to_win_label': 'NO MORE "PAY TO WIN" (supprime les boosts et Joltbux)',
        'gamejolt_pay_to_win_desc': '(Supprime toutes les sections de boosts, Joltbux et éléments payants sur Gamejolt.com)',
        'anti_scam_co_label': 'Anti Scam .co (avertissement sites .co)',
        'anti_scam_co_desc': '(Avertit lors de la visite de sites en .co, souvent utilisés pour le phishing)'
    },
    'es_es': {
        'settings_page_title': "Configuración de Utilidad",
        'ia_summarizer_label': "Activar el botón de resumen IA en páginas web",
        'ia_summarizer_desc': "(Añade un botón '✨' a la izquierda de todas las páginas para generar un resumen del contenido.)",
        'gamejolt_cleaner_label': "Limpiador Gamejolt (elimina el elemento Joltydex)",
        'gamejolt_cleaner_desc': "(Elimina el icono Joltydex de la barre de navegación en Gamejolt.com)",
        'gamejolt_pay_to_win_label': 'NO MORE "PAY TO WIN" (elimina boosts y Joltbux)',
        'gamejolt_pay_to_win_desc': '(Elimina todas las secciones de boosts, Joltbux y elementos de pago en Gamejolt.com)',
        'anti_scam_co_label': 'Anti Scam .co (advertencia sitios .co)',
        'anti_scam_co_desc': '(Advierte al visitar sitios .co, a menudo utilizados para phishing)'
    },
    'es_la': {
        'settings_page_title': "Ajustes de Utilidad",
        'ia_summarizer_label': "Activar el botón de resumen IA en páginas web",
        'ia_summarizer_desc': "(Añade un botón '✨' a la izquierda de todas las páginas para generar un resumen del contenido.)",
        'gamejolt_cleaner_label': "Limpiador Gamejolt (elimina el elemento Joltydex)",
        'gamejolt_cleaner_desc': "(Elimina el icono Joltydex de la barre de navegación en Gamejolt.com)",
        'gamejolt_pay_to_win_label': 'NO MORE "PAY TO WIN" (elimina boosts y Joltbux)',
        'gamejolt_pay_to_win_desc': '(Elimina todas las secciones de boosts, Joltbux y elementos de pago en Gamejolt.com)',
        'anti_scam_co_label': 'Anti Scam .co (advertencia sitios .co)',
        'anti_scam_co_desc': '(Advierte al visitar sitios .co, a menudo utilizados para phishing)'
    }
};

/**
 * Met à jour tous les éléments i18n avec la langue sélectionnée.
 * @param {string} lang - Code de la langue ('en', 'fr', 'es_es', ou 'es_la').
 */
function updateContent(lang) {
    const langData = translations[lang];
    if (!langData) return;

    // Met à jour les éléments avec l'attribut data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (langData[key]) {
            element.textContent = langData[key];
        }
    });
    
    // Met à jour les éléments spéciaux (titre de la page)
    document.getElementById('settings-page-title').textContent = langData['settings_page_title'];
    document.getElementById('settings-title').textContent = langData['settings_page_title'];
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

// ==================== GESTION DES PARAMÈTRES ====================

/**
 * Charge les paramètres depuis le stockage et met à jour l'interface.
 */
function loadSettings() {
    browserAPI.storage.local.get(['iaSummarizerEnabled', 'gamejoltCleanerEnabled', 'gamejoltPayToWinEnabled', 'antiScamCoEnabled'], (data) => {
        console.log('Paramètres chargés:', data);
        
        // Mettre à jour les cases à cocher
        document.getElementById('ia-summarizer-toggle').checked = data.iaSummarizerEnabled || false;
        document.getElementById('gamejolt-cleaner-toggle').checked = data.gamejoltCleanerEnabled || false;
        document.getElementById('gamejolt-pay-to-win-toggle').checked = data.gamejoltPayToWinEnabled || false;
        document.getElementById('anti-scam-co-toggle').checked = data.antiScamCoEnabled || false;
    });
}

/**
 * Sauvegarde un paramètre dans le stockage.
 * @param {string} key - Clé du paramètre.
 * @param {any} value - Valeur du paramètre.
 */
function saveSetting(key, value) {
    const setting = {};
    setting[key] = value;
    browserAPI.storage.local.set(setting);
    console.log(`Paramètre sauvegardé: ${key} = ${value}`);
}

// ==================== ÉCOUTEURS D'ÉVÉNEMENTS ====================

// 1. TOGGLE RÉSUMÉ IA
document.getElementById('ia-summarizer-toggle').addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    saveSetting('iaSummarizerEnabled', isEnabled);
});

// 2. TOGGLE NETTOYEUR GAMEJOLT
document.getElementById('gamejolt-cleaner-toggle').addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    saveSetting('gamejoltCleanerEnabled', isEnabled);
});

// 3. TOGGLE NO MORE PAY TO WIN
document.getElementById('gamejolt-pay-to-win-toggle').addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    saveSetting('gamejoltPayToWinEnabled', isEnabled);
});

// 4. TOGGLE ANTI SCAM .CO (NOUVELLE FONCTIONNALITÉ)
document.getElementById('anti-scam-co-toggle').addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    saveSetting('antiScamCoEnabled', isEnabled);
});

// 5. BOUTON DE THÈME
document.getElementById('theme-toggle-settings').addEventListener('click', toggleTheme);

// ==================== INITIALISATION ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Settings page initialized');
    
    // 1. Charger le thème sauvegardé
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // 2. Charger la langue sauvegardée
    const savedLang = localStorage.getItem('menuLang') || 'en';
    updateContent(savedLang);

    // 3. Charger les paramètres
    loadSettings();
});
