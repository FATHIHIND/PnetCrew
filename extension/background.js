/**
 * Service Worker background script pour SmartContext Doc
 * Écoute les changements d'onglets et transmet l'URL au popup
 * Initialise la base vectorielle IndexedDB au démarrage
 */

// DÉSACTIVÉ : Import des modules pour la base vectorielle
// import { loadAndNormalizeTickets } from './js/excel-loader.js';
// import { initializeVectorDB, countTickets } from './js/vector-db.js';

// État global pour stocker l'URL courante
let currentTabUrl = '';
let currentTabId = null;

// Écouter les changements d'onglets actifs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    currentTabUrl = tab.url || '';
    currentTabId = tab.id;
    console.log('[SmartContext] Tab activé:', currentTabUrl);

    // Stocker l'URL dans le storage pour accès rapide
    await chrome.storage.local.set({
      currentUrl: currentTabUrl,
      currentTabId: currentTabId
    });
  } catch (error) {
    console.error('[SmartContext] Erreur onActivated:', error);
  }
});

// Écouter les mises à jour d'URL dans l'onglet courant
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url && tabId === currentTabId) {
    currentTabUrl = changeInfo.url;
    console.log('[SmartContext] URL mise à jour:', currentTabUrl);

    await chrome.storage.local.set({
      currentUrl: currentTabUrl,
      currentTabId: currentTabId
    });
  }
});

// Répondre aux messages depuis le popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCurrentUrl') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        sendResponse({ url: tabs[0].url || '' });
      } else {
        sendResponse({ url: currentTabUrl });
      }
    });
    return true; // Indique une réponse asynchrone
  }

  if (request.action === 'ping') {
    sendResponse({ status: 'ok' });
    return true;
  }

  // DÉSACTIVÉ : Obtenir le statut de la base vectorielle
  // if (request.action === 'getVectorDBStatus') { ... }

  // DÉSACTIVÉ : Forcer la réinitialisation de la base vectorielle
  // if (request.action === 'reinitializeVectorDB') { ... }
});

// DÉSACTIVÉ : Initialisation de la base vectorielle
/*
async function initializeVectorDatabase(force = false) {
  // Code désactivé
}
*/

// Initialisation au démarrage
chrome.runtime.onStartup.addListener(() => {
  console.log('[SmartContext] Service Worker démarré');
  // DÉSACTIVÉ : initializeVectorDatabase()
});

chrome.runtime.onInstalled.addListener(async () => {
  console.log('[SmartContext] Extension installée/mise à jour');

  // Initialiser les paramètres par défaut
  try {
    const result = await chrome.storage.sync.get(['auto_ai_on_unknown_pages']);

    // Si le paramètre n'existe pas encore, le définir par défaut à true
    if (result.auto_ai_on_unknown_pages === undefined) {
      await chrome.storage.sync.set({ auto_ai_on_unknown_pages: true });
      console.log('[SmartContext] Paramètre auto_ai_on_unknown_pages initialisé à true');
    }

    // DÉSACTIVÉ : Initialisation base vectorielle
    // console.log('[SmartContext] 🚀 Démarrage initialisation base vectorielle...');
    // await initializeVectorDatabase();

  } catch (error) {
    console.error('[SmartContext] Erreur initialisation:', error);
  }
});

console.log('[SmartContext] Background script chargé');
