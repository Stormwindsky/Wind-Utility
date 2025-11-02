// content-script.js - VERSION COMPLÈTE CORRIGÉE AVEC SYNCHRONISATION DE LANGUE

console.log('Content script IA chargé pour:', window.location.href);

// API URL de base
const API_URL = "https://text.pollinations.ai/prompt/";

// Traduction de base pour le prompt de l'IA (en utilisant la langue de l'extension)
const PROMPTS = {
    'en': 'Summarize the following text in English in a clear and concise way: ',
    'fr': 'Résumez le texte suivant en français de manière claire et concise: ',
    'es_es': 'Resuma el siguiente texto en español de España de manera clara y concisa: ',
    'es_la': 'Resuma el siguiente texto en español de Latinoamérica de manera clara y concisa: '
};

// Variable pour stocker la langue courante
let currentLang = 'en';

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
 * Charge la langue depuis le stockage et met à jour la variable currentLang
 */
async function loadCurrentLanguage() {
    return new Promise(resolve => {
        browserAPI.storage.local.get('menuLang', (data) => {
            currentLang = data.menuLang || 'en';
            console.log('Langue chargée dans content-script:', currentLang);
            resolve(currentLang);
        });
    });
}

/**
 * Récupère le texte de la page web de manière plus intelligente.
 * @returns {string} Le texte brut de la page.
 */
function getPageText() {
    console.log('Extraction du texte de la page...');
    
    // Approche plus sélective pour extraire le contenu principal
    const selectorsToTry = [
        'main',
        'article',
        '[role="main"]',
        '.content',
        '.main-content',
        '.post-content',
        '.entry-content',
        '#content',
        '#main-content',
        'body'
    ];

    let content = '';
    
    // Essayer d'abord les sélecteurs de contenu principal
    for (const selector of selectorsToTry) {
        const element = document.querySelector(selector);
        if (element && element.textContent && element.textContent.trim().length > 100) {
            console.log(`Contenu trouvé avec le sélecteur: ${selector}`);
            content = element.textContent;
            break;
        }
    }

    // Si pas assez de contenu, utiliser le body mais filtrer
    if (content.length < 100) {
        console.log('Utilisation du body avec filtrage...');
        const elementsToIgnore = ['script', 'style', 'nav', 'header', 'footer', 'aside', '.ad', '.advertisement', '.sidebar', '.menu', '.navigation'];
        const bodyClone = document.body.cloneNode(true);
        
        // Supprimer les éléments non désirés
        elementsToIgnore.forEach(selector => {
            bodyClone.querySelectorAll(selector).forEach(el => el.remove());
        });
        
        content = bodyClone.textContent;
    }

    // Nettoyage avancé du texte
    content = content
        .replace(/\s+/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/[ ]{2,}/g, ' ')
        .trim();

    console.log(`Texte extrait: ${content.length} caractères`);
    return content;
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
        width: 500px;
        max-height: 80vh;
        background: #1f1f1f; 
        color: #e0e0e0;
        border: 2px solid #4CAF50;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.7);
        z-index: 10001;
        display: flex;
        flex-direction: column;
        padding: 20px;
        font-family: Arial, sans-serif;
    `;

    // Contenu du résumé
    const contentBox = document.createElement('div');
    contentBox.style.cssText = `
        flex-grow: 1;
        overflow-y: auto;
        margin-bottom: 15px;
        padding: 15px;
        background: #121212;
        border-radius: 5px;
        white-space: pre-wrap;
        line-height: 1.4;
        color: ${isError ? '#FF6347' : '#e0e0e0'};
        max-height: 400px;
    `;
    contentBox.textContent = content;

    // Conteneur des boutons (seulement le bouton Copier)
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    `;
    
    // Bouton Copier (seulement si pas d'erreur)
    if (!isError) {
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
        buttonContainer.appendChild(copyButton);
    }

    popup.appendChild(contentBox);
    popup.appendChild(buttonContainer);

    document.body.appendChild(popup);

    // Fermer en cliquant à l'extérieur
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10000;
    `;
    overlay.onclick = () => {
        popup.remove();
        overlay.remove();
    };
    document.body.appendChild(overlay);
}

/**
 * Gère le clic sur le bouton IA avec meilleure gestion des erreurs.
 */
async function handleSummarizeClick(button) {
    const originalText = button.textContent;
    button.textContent = '⏳';
    button.disabled = true;

    try {
        // 1. CHARGER LA LANGUE ACTUELLE À CHAQUE FOIS
        await loadCurrentLanguage();
        const promptText = PROMPTS[currentLang] || PROMPTS['en'];
        console.log('Utilisation de la langue:', currentLang, 'Prompt:', promptText);

        // 2. Récupérer le texte de la page
        const pageText = getPageText();
        console.log(`Texte extrait: ${pageText.length} caractères`);
        
        if (pageText.length < 100) {
            showSummaryPopup(`Erreur: Trop peu de texte trouvé sur la page pour générer un résumé (${pageText.length} caractères). Essayez sur une page avec plus de contenu textuel.`, true);
            return;
        }

        // 3. Préparer le texte pour l'API (limiter la taille)
        const textToSummarize = pageText.substring(0, 3000); // Réduit pour éviter les timeouts
        const fullPrompt = promptText + textToSummarize;
        const encodedPrompt = encodeURIComponent(fullPrompt);
        const requestUrl = API_URL + encodedPrompt;

        console.log('Envoi de la requête à l\'API...');

        // 4. Faire la requête avec timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes timeout

        try {
            const response = await fetch(requestUrl, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
            }
            
            const summary = await response.text();
            
            // Vérifier si la réponse est valide
            if (!summary || summary.length < 10) {
                throw new Error('Réponse de l\'API vide ou trop courte');
            }
            
            console.log('Résumé généré avec succès:', summary.length, 'caractères');
            
            // 5. Afficher le popup
            showSummaryPopup(summary);

        } catch (fetchError) {
            if (fetchError.name === 'AbortError') {
                throw new Error('Timeout: L\'API a mis trop de temps à répondre');
            }
            throw fetchError;
        }

    } catch (error) {
        console.error('Erreur lors de la génération du résumé IA:', error);
        
        let errorMessage = `Erreur lors de la génération du résumé: ${error.message}. `;
        
        if (error.message.includes('500')) {
            errorMessage += "Le service d'IA est temporairement indisponible. Veuillez réessayer dans quelques minutes.";
        } else if (error.message.includes('Timeout')) {
            errorMessage += "La requête a pris trop de temps. Le service peut être surchargé.";
        } else if (error.message.includes('API')) {
            errorMessage += "Problème de connexion avec le service d'IA.";
        }
        
        showSummaryPopup(errorMessage, true);
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
}

/**
 * Injecte le bouton de résumé IA sur la page web.
 */
function injectSummarizerButton() {
    // Éviter les injections multiples
    const existingButton = document.querySelector('.ia-summarizer-button-container');
    if (existingButton) {
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
    button.title = 'Résumer avec IA';
    button.style.cssText = `
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        font-size: 1.5em;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
    `;
    
    button.onmouseover = () => {
        button.style.backgroundColor = '#45a049';
        button.style.transform = 'scale(1.1)';
        button.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.4)';
    };
    
    button.onmouseout = () => {
        button.style.backgroundColor = '#4CAF50';
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
    };
    
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
 * Supprime le bouton de résumé IA.
 */
function removeSummarizerButton() {
    const existingButton = document.querySelector('.ia-summarizer-button-container');
    if (existingButton) {
        existingButton.remove();
        console.log('Bouton IA retiré');
    }
    // Supprimer aussi les popups
    document.querySelectorAll('.ia-summary-popup').forEach(popup => popup.remove());
}

/**
 * Vérifie et applique l'état de l'option IA.
 */
function checkAndApplyIASetting() {
    if (!browserAPI) {
        console.error('API d\'extension non disponible');
        return;
    }
    
    browserAPI.storage.local.get('iaSummarizerEnabled', (data) => {
        const isEnabled = data.iaSummarizerEnabled || false;
        console.log('État IA détecté:', isEnabled);
        
        if (isEnabled) {
            // Attendre que le DOM soit prêt
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(injectSummarizerButton, 500);
                });
            } else {
                setTimeout(injectSummarizerButton, 500);
            }
        } else {
            removeSummarizerButton();
        }
    });
}

/**
 * Fonction principale d'initialisation.
 */
function initContentScript() {
    if (!browserAPI) {
        console.error('API d\'extension non disponible');
        return;
    }
    
    console.log('Initialisation du content script...');
    
    // Charger la langue initiale
    loadCurrentLanguage();
    
    // Vérifier l'état au chargement - L'ICÔNE S'AFFICHE DIRECTEMENT SI ACTIVÉE
    checkAndApplyIASetting();
    
    // Écouter les changements de settings en temps réel
    browserAPI.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            // Changement de l'option IA
            if (changes.iaSummarizerEnabled) {
                const isEnabled = changes.iaSummarizerEnabled.newValue;
                console.log('Changement d\'état IA détecté:', isEnabled);
                
                if (isEnabled) {
                    setTimeout(injectSummarizerButton, 100);
                } else {
                    removeSummarizerButton();
                }
            }
            
            // NOUVEAU : Écouter les changements de langue
            if (changes.menuLang) {
                currentLang = changes.menuLang.newValue || 'en';
                console.log('Changement de langue détecté dans content-script:', currentLang);
            }
        }
    });
    
    // Réinjecter si la page change (SPA)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            console.log('URL changée, réinjection du bouton...');
            setTimeout(() => {
                browserAPI.storage.local.get('iaSummarizerEnabled', (data) => {
                    if (data.iaSummarizerEnabled) {
                        removeSummarizerButton();
                        setTimeout(injectSummarizerButton, 1000);
                    }
                });
            }, 500);
        }
    }).observe(document, { subtree: true, childList: true });
}

// Lancement immédiat - L'ICÔNE APPARAÎT DIRECTEMENT SI L'OPTION EST ACTIVÉE
initContentScript();
