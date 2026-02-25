/**
 * Content Script pour SmartContext Doc
 * Injecté dans toutes les pages pour potentiellement extraire du contexte
 */

// Fonction pour extraire le contexte de la page (titre, mots-clés, etc.)
function extractPageContext() {
  const context = {
    url: window.location.href,
    title: document.title,
    hostname: window.location.hostname,
    pathname: window.location.pathname,
    timestamp: new Date().toISOString()
  };

  // Extraire meta keywords si disponibles
  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords) {
    context.keywords = metaKeywords.content;
  }

  // Extraire meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    context.description = metaDescription.content;
  }

  return context;
}

/**
 * Fonction pour extraire le texte visible de la page
 * Exclut les scripts, styles, et éléments cachés
 */
function extractPageText() {
  // Cloner le body pour ne pas modifier le DOM
  const bodyClone = document.body.cloneNode(true);

  // Supprimer les éléments non pertinents
  const elementsToRemove = bodyClone.querySelectorAll(
    'script, style, noscript, iframe, svg, canvas, video, audio, img, button, [hidden], [aria-hidden="true"]'
  );
  elementsToRemove.forEach(el => el.remove());

  // Extraire le texte visible
  let text = bodyClone.innerText || bodyClone.textContent || '';

  // Nettoyer : enlever les espaces multiples et lignes vides excessives
  text = text
    .replace(/\s+/g, ' ')           // Remplacer espaces multiples par un seul
    .replace(/\n\s*\n/g, '\n')      // Enlever lignes vides multiples
    .trim();

  // Limiter la taille (max 10000 caractères pour éviter payload trop lourd)
  const MAX_LENGTH = 10000;
  if (text.length > MAX_LENGTH) {
    text = text.substring(0, MAX_LENGTH) + '...';
  }

  return text;
}

/**
 * Fonction pour extraire le HTML principal de la page
 * Nettoie les scripts et styles pour réduire la taille
 */
function extractPageHTML() {
  // Cloner le body
  const bodyClone = document.body.cloneNode(true);

  // Supprimer les éléments non pertinents
  const elementsToRemove = bodyClone.querySelectorAll('script, style, noscript, iframe');
  elementsToRemove.forEach(el => el.remove());

  let html = bodyClone.innerHTML;

  // Limiter la taille (max 15000 caractères)
  const MAX_LENGTH = 15000;
  if (html.length > MAX_LENGTH) {
    html = html.substring(0, MAX_LENGTH) + '<!-- truncated -->';
  }

  return html;
}

// Écouter les messages depuis le popup ou background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageContext') {
    const context = extractPageContext();
    sendResponse(context);
  }

  if (request.action === 'getPageText') {
    try {
      const text = extractPageText();
      sendResponse({ text, success: true });
    } catch (error) {
      console.error('[SmartContext] Erreur extraction texte:', error);
      sendResponse({ text: '', success: false, error: error.message });
    }
  }

  if (request.action === 'getPageHTML') {
    try {
      const html = extractPageHTML();
      sendResponse({ html, success: true });
    } catch (error) {
      console.error('[SmartContext] Erreur extraction HTML:', error);
      sendResponse({ html: '', success: false, error: error.message });
    }
  }

  if (request.action === 'getFullPageData') {
    try {
      const context = extractPageContext();
      const text = extractPageText();
      const html = extractPageHTML();

      sendResponse({
        context,
        text,
        html,
        success: true
      });
    } catch (error) {
      console.error('[SmartContext] Erreur extraction complète:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  return true; // Indique une réponse asynchrone
});

// Notification discrète au chargement (optionnel, pour debug)
console.log('[SmartContext] Content script chargé sur:', window.location.href);

// Stocker le contexte dans le storage local pour accès rapide
const context = extractPageContext();
chrome.storage.local.set({ pageContext: context });
