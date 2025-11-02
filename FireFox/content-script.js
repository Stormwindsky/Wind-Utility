// content-script.js - VERSION COMPLÈTE CORRIGÉE POUR FIREFOX

console.log('Content script IA chargé pour:', window.location.href);

// API URL de base
const API_URL = "https://text.pollinations.ai/prompt/";

// Traduction de base pour le prompt de l'IA (en utilisant la langue de l'extension)
const PROMPTS = {
    'en': 'Summarize the following text in English: ',
    'fr': 'Résumez le texte suivant en français : ',
    'es_es': 'Resuma el siguiente texto en español de España: ',
    'es_la': 'Resuma el siguiente texto en español de Latinoamérica: '
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

/**
 * Récupère le texte de la page web.
 * @returns {string} Le texte brut de la page.
 */
function getPageText() {
    // Tente d'exclure les éléments non pertinents
    const elementsToIgnore = ['script', 'style', 'header', 'footer', 'nav', '.ia-summarizer-button-container', '.ia-summary-popup'];
    let text = '';
    
    document.body.childNodes.forEach(node => {
        if (node.nodeType === 3) { // TEXT_NODE
            text += node.textContent + ' ';
        } else if (node.nodeType === 1) { // ELEMENT_NODE
            const tagName = node.tagName.toLowerCase();
            const classList = node.className;
            if (!elementsToIgnore.includes(tagName) && !elementsToIgnore.some(cls => classList.includes(cls.substring(1)))) {
                text += node.textContent + ' ';
            }
        }
    });

    // Nettoyage de base
    return text.replace(/\s+/g, ' ').trim();
}

/**
 * Affiche le popup de résumé avec le contenu et les boutons d'action.
 * @param {string} content - Le résumé généré par l'IA.
 * @param {boolean} isError - Si le contenu est un message d'erreur.
 */
function showSummaryPopup(content, isError = false) {
    // Supprimer tout popup existant
    document.querySelectorAll('.ia-summary-popup').forEach(popup => popup.remove());

    const popup = document.createElement('div');
    popup.className = 'ia-summary-popup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 400px;
        max-height: 80vh;
        background: #1f1f1f; 
        color: #e0e0e0;
        border: 2px solid #4CAF50;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.7);
        z-index: 10001;
        display: flex;
        flex-direction: column;
        padding: 15px;
        font-family: Arial, sans-serif;
    `;

    // Contenu du résumé
    const contentBox = document.createElement('div');
    contentBox.style.cssText = `
        flex-grow: 1;
        overflow-y: auto;
        margin-bottom: 15px;
        padding: 10px;
        background: #121212;
        border-radius: 5px;
        white-space: pre-wrap;
        color: ${isError ? '#FF6347' : '#e0e0e0'};
    `;
    contentBox.textContent = content;

    // Conteneur des boutons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    `;
    
    // Bouton Copier
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copier';
    copyButton.style.cssText = `
        padding: 8px 15px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.2s;
    `;
    copyButton.onmouseover = () => copyButton.style.backgroundColor = '#45a049';
    copyButton.onmouseout = () => copyButton.style.backgroundColor = '#4CAF50';
    copyButton.onclick = () => {
        navigator.clipboard.writeText(content).then(() => {
            copyButton.textContent = 'Copié !';
            setTimeout(() => copyButton.textContent = 'Copier', 1500);
        }).catch(err => {
            console.error('Erreur de copie:', err);
        });
    };
    
    // Bouton Fermer (X)
    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.style.cssText = `
        width: 30px;
        height: 30px;
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        color: #e0e0e0;
        border: none;
        font-size: 1.2em;
        cursor: pointer;
    `;
    closeButton.onclick = () => popup.remove();

    popup.appendChild(closeButton);
    popup.appendChild(contentBox);
    if (!isError) {
        buttonContainer.appendChild(copyButton);
    }
    popup.appendChild(buttonContainer);

    document.body.appendChild(popup);
}

/**
 * Gère le clic sur le bouton IA.
 */
async function handleSummarizeClick(button) {
    button.textContent = '...'; // Indique le chargement
    button.disabled = true;

    try {
        // 1. Récupérer la langue sauvegardée
        const data = await new Promise(resolve => {
            browserAPI.storage.local.get('menuLang', resolve);
        });
        // Utiliser la langue sauvegardée, ou 'en' par défaut
        const lang = data.menuLang || 'en'; 
        const promptText = PROMPTS[lang] || PROMPTS['en'];

        // 2. Récupérer le texte de la page
        const pageText = getPageText();
        if (pageText.length < 50) {
            showSummaryPopup(`Erreur: Trop peu de texte trouvé sur la page pour générer un résumé (taille: ${pageText.length}).`, true);
            return;
        }

        // 3. Construire l'URL de l'API (avec URL encodé)
        // Utiliser seulement les 5000 premiers caractères pour éviter de dépasser la limite URL ou la limite de l'IA
        const textToSummarize = pageText.substring(0, 5000); 
        const fullPrompt = promptText + textToSummarize;
        const encodedPrompt = encodeURIComponent(fullPrompt);
        const requestUrl = API_URL + encodedPrompt;

        console.log('Requête IA envoyée:', requestUrl.substring(0, 100) + '...');

        // 4. Faire la requête
        const response = await fetch(requestUrl);
        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
        }
        
        const summary = await response.text();
        
        // 5. Afficher le popup
        showSummaryPopup(summary);

    } catch (error) {
        console.error('Erreur lors de la génération du résumé IA:', error);
        showSummaryPopup(`Erreur lors de la génération du résumé: ${error.message}. Veuillez réessayer.`, true);
    } finally {
        button.textContent = '✨'; // Rétablit le bouton
        button.disabled = false;
    }
}

/**
 * Injecte le bouton de résumé IA sur la page web.
 */
function injectSummarizerButton() {
    // Éviter les injections multiples
    if (document.querySelector('.ia-summarizer-button-container')) {
        console.log('Bouton IA déjà présent');
        return;
    }

    // Créer le conteneur pour le bouton
    const container = document.createElement('div');
    container.className = 'ia-summarizer-button-container';
    container.style.cssText = `
        position: fixed;
        top: 50%;
        left: 10px;
        transform: translateY(-50%);
        z-index: 10000;
        pointer-events: auto;
    `;

    // Créer le bouton
    const button = document.createElement('button');
    button.textContent = '✨';
    button.style.cssText = `
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        font-size: 1.5em;
        cursor: pointer;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
        transition: background-color 0.2s, transform 0.1s;
        pointer-events: auto;
    `;
    
    button.onmouseover = () => button.style.backgroundColor = '#45a049';
    button.onmouseout = () => button.style.backgroundColor = '#4CAF50';
    button.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleSummarizeClick(button);
    };

    container.appendChild(button);
    document.body.appendChild(container);
    
    console.log('Bouton IA injecté avec succès sur:', window.location.href);
}

/**
 * Fonction principale pour vérifier les settings et injecter.
 */
function initContentScript() {
    if (!browserAPI) {
        console.error('API d\'extension non disponible');
        return;
    }
    
    console.log('Content script chargé, vérification des paramètres IA...');
    
    browserAPI.storage.local.get('iaSummarizerEnabled', (data) => {
        console.log('Paramètre IA récupéré:', data.iaSummarizerEnabled);
        if (data.iaSummarizerEnabled) {
            // Attendre que le DOM soit complètement chargé
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(injectSummarizerButton, 100);
                });
            } else {
                setTimeout(injectSummarizerButton, 100);
            }
        }
    });
    
    // Écouter les changements de settings
    browserAPI.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.iaSummarizerEnabled) {
            const isEnabled = changes.iaSummarizerEnabled.newValue;
            const existingButton = document.querySelector('.ia-summarizer-button-container');
            
            console.log('Changement détecté - IA activée:', isEnabled);
            
            if (isEnabled && !existingButton) {
                setTimeout(injectSummarizerButton, 100);
            } else if (!isEnabled && existingButton) {
                existingButton.remove();
                document.querySelectorAll('.ia-summary-popup').forEach(popup => popup.remove());
                console.log('Bouton IA retiré');
            }
        }
    });
}

// Lancement
initContentScript();
