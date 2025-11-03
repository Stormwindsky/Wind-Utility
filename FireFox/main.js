// main.js - VERSION COMPLÈTE CORRIGÉE AVEC SYNCHRONISATION DE LANGUE

// ==================== DONNÉES DE TRADUCTION (i18n) ====================
const translations = {
    'en': {
        'menu_title': "Wind Utility Menu",
        'page_title': "Main Menu",
        'option1': "StormExplorer Page",
        'option2': "Settings",
        'option3': "Notes & Credits",
        'notes_title': "Notes & Credits",
        'notes_intro': "This is a utility extension for Stormwindsky's projects.",
        'notes_section_credits': "Credits",
        'notes_developer': "Developer: Stormwindsky",
        'notes_template': "Template and architecture by: Your Name/Source",
        'notes_section_notes': "Version Notes",
        'notes_v1_0': "Version 1.0: Initial launch of the main menu and StormExplorer Page option.",
        'settings_page_title': "Utility Settings"
    },
    'fr': {
        'menu_title': "Menu Wind Utility",
        'page_title': "Menu Principal",
        'option1': "Page StormExplorer",
        'option2': "Paramètres",
        'option3': "Notes & Crédits",
        'notes_title': "Notes & Crédits",
        'notes_intro': "Ceci est une extension d'utilitaire pour les projets de Stormwindsky.",
        'notes_section_credits': "Crédits",
        'notes_developer': "Développeur : Stormwindsky",
        'notes_template': "Template et architecture par : Votre nom/la source",
        'notes_section_notes': "Notes de version",
        'notes_v1_0': "Version 1.0 : Lancement initial du menu principal et de l'option StormExplorer Page.",
        'settings_page_title': "Paramètres de l'Utilitaire"
    },
    'es_es': {
        'menu_title': "Menú Wind Utility",
        'page_title': "Menú Principal",
        'option1': "Página StormExplorer",
        'option2': "Configuración",
        'option3': "Notas y Créditos",
        'notes_title': "Notas y Créditos",
        'notes_intro': "Esta es una extensión de utilidad para los proyectos de Stormwindsky.",
        'notes_section_credits': "Créditos",
        'notes_developer': "Desarrollador: Stormwindsky",
        'notes_template': "Plantilla y arquitectura por: Su Nombre/Fuente",
        'notes_section_notes': "Notas de Versión",
        'notes_v1_0': "Versión 1.0: Lanzamiento inicial del menú principal y la opción Página StormExplorer.",
        'settings_page_title': "Configuración de Utilidad"
    },
    'es_la': {
        'menu_title': "Menú Wind Utility",
        'page_title': "Menú Principal",
        'option1': "Página StormExplorer",
        'option2': "Ajustes",
        'option3': "Notas y Créditos",
        'notes_title': "Notas y Créditos",
        'notes_intro': "Esta es una extensión de utilidad para les projets de Stormwindsky.",
        'notes_section_credits': "Créditos",
        'notes_developer': "Desarrollador: Stormwindsky",
        'notes_template': "Plantilla y arquitectura por: Su Nombre/Fuente",
        'notes_section_notes': "Notas de Versión",
        'notes_v1_0': "Versión 1.0: Lanzamiento inicial del menú principal y la opción Página StormExplorer.",
        'settings_page_title': "Ajustes de Utilidad"
    }
};

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

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Affiche une vue spécifique (menu principal ou notes) et masque les autres.
 * @param {string} viewId - L'ID de la vue à afficher ('main-menu' ou 'notes-view').
 */
function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        if (view.id === viewId) {
            view.classList.remove('hidden');
        } else {
            view.classList.add('hidden');
        }
    });
}

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
    
    // Met à jour les éléments spéciaux (titre de la pop-up)
    document.getElementById('page-title').textContent = langData['page_title'];
    document.getElementById('menu-title').textContent = langData['menu_title'];
}

// ==================== GESTION DU THÈME ====================

/**
 * Change le thème (clair/sombre) et le sauve dans localStorage.
 */
function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// ==================== ÉCOUTEURS D'ÉVÉNEMENTS ====================

// 1. SELECTEUR DE LANGUE
document.getElementById('lang-select').addEventListener('change', (e) => {
    const newLang = e.target.value;
    // Sauvegarde la langue dans localStorage ET dans le storage de l'extension
    localStorage.setItem('menuLang', newLang);
    
    // NOUVELLE LIGNE : Sauvegarde également dans le storage de l'extension pour synchronisation
    if (browserAPI && browserAPI.storage) {
        browserAPI.storage.local.set({ menuLang: newLang });
    }
    
    updateContent(newLang);
});

// 2. OPTION 1 : STORMEXPLORER PAGE (OUVERTURE DANS UN NOUVEL ONGLET)
document.getElementById('option-1').addEventListener('click', (e) => {
    e.preventDefault();
    const externalURL = "https://www.stormwindsky.com/Stormwindsky's%20Collection.html";

    // UTILISE L'API BROWSER.TABS.CREATE (pour Firefox/Chrome)
    if (browserAPI && browserAPI.tabs) {
         browserAPI.tabs.create({ url: externalURL });
    } else {
        // Fallback
        window.open(externalURL, '_blank'); 
    }

    // Fermer la pop-up après avoir ouvert l'onglet
    window.close();
});

// 3. OPTION 2 : SETTINGS/OPTIONS (Ouverture de la page d'options)
document.getElementById('option-2').addEventListener('click', (e) => {
    e.preventDefault();
    // Ouvre la page des options
    if (browserAPI && browserAPI.runtime && browserAPI.runtime.openOptionsPage) {
        browserAPI.runtime.openOptionsPage();
    } else if (browserAPI && browserAPI.runtime && browserAPI.runtime.getURL) {
        // Fallback pour Chrome (ou autre navigateur)
        window.open(browserAPI.runtime.getURL('settings.html'));
    } else {
        // Fallback ultime
        window.open('settings.html', '_blank');
    }
    window.close();
});

// 4. OPTION 3 : NOTES & CRÉDITS
document.getElementById('option-3').addEventListener('click', (e) => {
    e.preventDefault();
    showView('notes-view');
});

// 5. BOUTON DE FERMETURE (X) pour Notes & Crédits
document.getElementById('close-notes').addEventListener('click', () => {
    showView('main-menu');
});

// 6. BOUTON DE THÈME (ajouté pour la pop-up principale)
document.getElementById('theme-toggle-main').addEventListener('click', toggleTheme);

// ==================== INITIALISATION AU CHARGEMENT DU DOM ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Main menu loaded');
    
    // 1. Tente de charger le thème précédemment sauvegardé ou utilise 'dark' par défaut
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // 2. Tente de charger la langue précédemment sauvegardée ou utilise l'anglais par défaut
    const langSelect = document.getElementById('lang-select');
    const savedLang = localStorage.getItem('menuLang') || 'en';

    // Sélectionne l'option correcte dans le <select>
    if (langSelect.querySelector(`option[value="${savedLang}"]`)) {
        langSelect.value = savedLang;
    }

    // Met à jour le contenu avec la langue par défaut/sauvegardée
    updateContent(langSelect.value);

    // 3. SYNCHRONISATION : Sauvegarde la langue dans le storage de l'extension au démarrage
    if (browserAPI && browserAPI.storage) {
        browserAPI.storage.local.set({ menuLang: savedLang });
    }

    // Assurez-vous que le menu principal est visible au démarrage
    showView('main-menu');
});
