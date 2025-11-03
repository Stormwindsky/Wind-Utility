// content-script.js - VERSION COMPLÈTE AVEC ANTI SCAM .CO

console.log('Content script IA chargé pour:', window.location.href);

// API URL de base
const API_URL = "https://text.pollinations.ai/prompt/";

// Traduction de base pour le prompt de l'IA (en utilisant la langue de l'extension)
const PROMPTS = {
    'en': 'Summarize the following text in English in a clear and concise way: ',
    'fr': 'Résumez le texte suivant en français de manière claire et concise: ',
    'es_es': 'Resuma el siguiente texto en español de España de manière claire et concise: ',
    'es_la': 'Resuma el siguiente texto en español de Latinoamérica de manière claire et concise: '
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
        console.log('Bouton IA supprimé');
    }
}

// ==================== FONCTIONNALITÉ GAMEJOLT ====================

/**
 * Supprime l'élément Joltydex de Gamejolt
 */
function removeGamejoltJoltydex() {
    const element = document.querySelector('div.-item.-control a.-control-item span.jolticon-joltydex');
    if (element) {
        const parentControl = element.closest('div.-item.-control');
        if (parentControl) {
            parentControl.remove();
            console.log('Élément Joltydex supprimé de Gamejolt');
            return true;
        }
    }
    return false;
}

/**
 * Surveille les changements du DOM pour supprimer l'élément Joltydex
 */
function observeGamejoltDOM() {
    const observer = new MutationObserver((mutations) => {
        removeGamejoltJoltydex();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Essayer une suppression initiale
    setTimeout(removeGamejoltJoltydex, 1000);
}

// ==================== FONCTIONNALITÉ NO MORE PAY TO WIN ====================

/**
 * Supprime les éléments "Pay to Win" de Gamejolt (boosts, Joltbux, etc.)
 */
function removeGamejoltPayToWin() {
    let removedCount = 0;
    
    // 1. Supprimer la section complète des boosts
    const boostSections = document.querySelectorAll('div.fill-offset');
    boostSections.forEach(section => {
        if (section.textContent.includes('Boosts') || 
            section.querySelector('h2')?.textContent.includes('Boosts')) {
            section.remove();
            removedCount++;
            console.log('Section Boosts supprimée');
        }
    });
    
    // 2. Supprimer les éléments Joltbux
    const joltbuxElements = document.querySelectorAll('a[style*="border-radius: 12px; background-color: var(--theme-bg-offset)"]');
    joltbuxElements.forEach(element => {
        if (element.textContent.includes('Joltbux') || element.textContent.includes('Coins')) {
            element.remove();
            removedCount++;
            console.log('Élément Joltbux/Coins supprimé');
        }
    });
    
    // 3. Supprimer les boutons "Get Joltbux" et "Get Coins"
    const getButtons = document.querySelectorAll('button');
    getButtons.forEach(button => {
        if (button.textContent.includes('Get Joltbux') || button.textContent.includes('Get Coins')) {
            button.closest('a')?.remove() || button.remove();
            removedCount++;
            console.log('Bouton Get Joltbux/Coins supprimé');
        }
    });
    
    // 4. Supprimer les modals d'achat de Joltbux
    const modalElements = document.querySelectorAll('.modal-body, [class*="modal"]');
    modalElements.forEach(modal => {
        if (modal.textContent.includes('Joltbux') && modal.textContent.includes('$')) {
            modal.remove();
            removedCount++;
            console.log('Modal d\'achat Joltbux supprimé');
        }
    });
    
    // 5. Supprimer les indicateurs de prix avec Joltbux
    const priceIndicators = document.querySelectorAll('div[style*="border-radius: 50px"]');
    priceIndicators.forEach(indicator => {
        if (indicator.innerHTML.includes('joltbux') || indicator.innerHTML.includes('Joltbux') ||
            indicator.querySelector('img[src*="6d379ea8.png"]')) {
            indicator.remove();
            removedCount++;
            console.log('Indicateur de prix Joltbux supprimé');
        }
    });
    
    if (removedCount > 0) {
        console.log(`NO MORE PAY TO WIN: ${removedCount} éléments supprimés`);
        return true;
    }
    return false;
}

/**
 * Surveille les changements du DOM pour supprimer les éléments Pay to Win
 */
function observeGamejoltPayToWin() {
    const observer = new MutationObserver((mutations) => {
        removeGamejoltPayToWin();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Essayer une suppression initiale
    setTimeout(removeGamejoltPayToWin, 1000);
    setTimeout(removeGamejoltPayToWin, 3000); // Double vérification
}

// ==================== FONCTIONNALITÉ ANTI SCAM .CO ====================

/**
 * Vérifie si l'URL actuelle est un domaine .co et affiche un avertissement si nécessaire
 */
function checkCoDomain() {
    const currentUrl = window.location.href;
    const domain = window.location.hostname;
    
    // Vérifier si le domaine se termine par .co (mais pas .com, .org, etc.)
    if (domain.endsWith('.co') && !domain.endsWith('.com') && !domain.endsWith('.org.co') && !domain.endsWith('.net.co')) {
        console.log('Domaine .co détecté:', domain);
        showCoWarning(domain, currentUrl);
        return true;
    }
    return false;
}

/**
 * Affiche un avertissement pour les sites .co
 * @param {string} domain - Le domaine détecté
 * @param {string} url - L'URL complète
 */
function showCoWarning(domain, url) {
    // Éviter les avertissements multiples
    if (document.querySelector('.anti-scam-co-warning')) {
        return;
    }

    // Messages selon la langue
    const warningMessages = {
        'en': {
            title: '⚠️ ANTI SCAM WARNING - .CO DOMAIN DETECTED',
            message: `You are about to visit a website with the domain "${domain}".\n\nDomains ending in .co are often used by fraudulent sites to impersonate legitimate websites (for example: "google.co" instead of "google.com").\n\nThese sites may attempt to:\n• Steal your personal information\n• Install malware\n• Trick you into paying for fake services\n\nAre you sure you want to continue?`,
            cancel: 'CANCEL (Go Back)',
            proceed: 'PROCEED AT MY OWN RISK'
        },
        'fr': {
            title: '⚠️ AVERTISSEMENT ANTI SCAM - DOMAINE .CO DÉTECTÉ',
            message: `Vous êtes sur le point de visiter un site web avec le domaine "${domain}".\n\nLes domaines se terminant par .co sont souvent utilisés par des sites frauduleux pour imiter des sites légitimes (par exemple : "google.co" au lieu de "google.com").\n\nCes sites peuvent tenter de :\n• Voler vos informations personnelles\n• Installer des logiciels malveillants\n• Vous tromper pour payer des services faux\n\nÊtes-vous sûr de vouloir continuer ?`,
            cancel: 'ANNULER (Retour)',
            proceed: 'CONTINUER À MES RISQUES'
        },
        'es_es': {
            title: '⚠️ ADVERTENCIA ANTI SCAM - DOMINIO .CO DETECTADO',
            message: `Está a punto de visitar un sitio web con el dominio "${domain}".\n\nLos dominios que terminan en .co son utilizados frecuentemente por sitios fraudulentos para suplantar sitios legítimos (por ejemplo: "google.co" en lugar de "google.com").\n\nEstos sitios pueden intentar:\n• Robar su información personal\n• Instalar malware\n• Engañarle para que pague por servicios falsos\n\n¿Está seguro de que desea continuar?`,
            cancel: 'CANCELAR (Volver)',
            proceed: 'CONTINUAR BAJO MI RESPONSABILIDAD'
        },
        'es_la': {
            title: '⚠️ ADVERTENCIA ANTI SCAM - DOMINIO .CO DETECTADO',
            message: `Está a punto de visitar un sitio web con el dominio "${domain}".\n\nLos dominios que terminan en .co son utilizados frecuentemente por sitios fraudulentos para suplantar sitios legítimos (por ejemplo: "google.co" en lugar de "google.com").\n\nEstos sitios pueden intentar:\n• Robar su información personal\n• Instalar malware\n• Engañarle para que pague por servicios falsos\n\n¿Está seguro de que desea continuar?`,
            cancel: 'CANCELAR (Volver)',
            proceed: 'CONTINUAR BAJO MI RESPONSABILIDAD'
        }
    };

    const messages = warningMessages[currentLang] || warningMessages['en'];

    // Créer le popup d'avertissement
    const warningOverlay = document.createElement('div');
    warningOverlay.className = 'anti-scam-co-warning';
    warningOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 100000;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: Arial, sans-serif;
    `;

    const warningPopup = document.createElement('div');
    warningPopup.style.cssText = `
        background: #2a0f0f;
        color: #ff6b6b;
        border: 3px solid #ff4444;
        border-radius: 15px;
        padding: 30px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 0 30px rgba(255, 0, 0, 0.5);
        text-align: center;
    `;

    const title = document.createElement('h2');
    title.textContent = messages.title;
    title.style.cssText = `
        color: #ff4444;
        margin-top: 0;
        font-size: 1.4em;
    `;

    const message = document.createElement('div');
    message.textContent = messages.message;
    message.style.cssText = `
        margin: 20px 0;
        line-height: 1.6;
        white-space: pre-line;
        text-align: left;
        background: rgba(255, 0, 0, 0.1);
        padding: 15px;
        border-radius: 8px;
        border-left: 4px solid #ff4444;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 15px;
        justify-content: center;
        margin-top: 25px;
    `;

    const cancelButton = document.createElement('button');
    cancelButton.textContent = messages.cancel;
    cancelButton.style.cssText = `
        padding: 12px 25px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        font-size: 1em;
        transition: background 0.3s;
    `;
    cancelButton.onmouseover = () => cancelButton.style.background = '#45a049';
    cancelButton.onmouseout = () => cancelButton.style.background = '#4CAF50';
    cancelButton.onclick = () => {
        // Retourner à la page précédente
        window.history.back();
        warningOverlay.remove();
    };

    const proceedButton = document.createElement('button');
    proceedButton.textContent = messages.proceed;
    proceedButton.style.cssText = `
        padding: 12px 25px;
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        font-size: 1em;
        transition: background 0.3s;
    `;
    proceedButton.onmouseover = () => proceedButton.style.background = '#cc3333';
    proceedButton.onmouseout = () => proceedButton.style.background = '#ff4444';
    proceedButton.onclick = () => {
        warningOverlay.remove();
    };

    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(proceedButton);

    warningPopup.appendChild(title);
    warningPopup.appendChild(message);
    warningPopup.appendChild(buttonContainer);
    warningOverlay.appendChild(warningPopup);
    document.body.appendChild(warningOverlay);

    // Empêcher la fermeture en cliquant à l'extérieur
    warningOverlay.onclick = (e) => {
        if (e.target === warningOverlay) {
            e.stopPropagation();
        }
    };
}

// ==================== INITIALISATION ====================

/**
 * Initialise les fonctionnalités en fonction des paramètres
 */
async function initializeFeatures() {
    // Charger les paramètres
    const settings = await new Promise(resolve => {
        browserAPI.storage.local.get(['iaSummarizerEnabled', 'gamejoltCleanerEnabled', 'gamejoltPayToWinEnabled', 'antiScamCoEnabled'], resolve);
    });

    console.log('Paramètres chargés:', settings);

    // Initialiser le résumé IA si activé
    if (settings.iaSummarizerEnabled) {
        console.log('Résumé IA activé - injection du bouton');
        injectSummarizerButton();
    }

    // Initialiser le nettoyeur Gamejolt si activé et sur Gamejolt.com
    if (settings.gamejoltCleanerEnabled && window.location.hostname.includes('gamejolt.com')) {
        console.log('Nettoyeur Gamejolt activé - suppression de l\'élément Joltydex');
        observeGamejoltDOM();
    }

    // Initialiser le nettoyeur Pay to Win si activé et sur Gamejolt.com
    if (settings.gamejoltPayToWinEnabled && window.location.hostname.includes('gamejolt.com')) {
        console.log('NO MORE PAY TO WIN activé - suppression des éléments payants');
        observeGamejoltPayToWin();
    }

    // Initialiser l'Anti Scam .co si activé
    if (settings.antiScamCoEnabled) {
        console.log('Anti Scam .co activé - vérification du domaine');
        // Charger la langue d'abord
        await loadCurrentLanguage();
        // Vérifier le domaine après un court délai pour s'assurer que la page est chargée
        setTimeout(checkCoDomain, 100);
    }
}

// Démarrer l'initialisation
initializeFeatures();

// Écouter les changements de paramètres
browserAPI.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.iaSummarizerEnabled) {
            if (changes.iaSummarizerEnabled.newValue) {
                injectSummarizerButton();
            } else {
                removeSummarizerButton();
            }
        }
        
        if (changes.gamejoltCleanerEnabled && window.location.hostname.includes('gamejolt.com')) {
            if (changes.gamejoltCleanerEnabled.newValue) {
                observeGamejoltDOM();
            }
        }

        if (changes.gamejoltPayToWinEnabled && window.location.hostname.includes('gamejolt.com')) {
            if (changes.gamejoltPayToWinEnabled.newValue) {
                observeGamejoltPayToWin();
            }
        }

        if (changes.antiScamCoEnabled) {
            if (changes.antiScamCoEnabled.newValue) {
                // Recharger la langue et vérifier le domaine
                loadCurrentLanguage().then(() => {
                    setTimeout(checkCoDomain, 100);
                });
            }
        }
    }
});
