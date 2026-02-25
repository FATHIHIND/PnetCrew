/**
 * Script principal du popup SmartContext Doc
 * Gère l'affichage de la documentation contextuelle et les appels API
 */

// DÉSACTIVÉ : Import des modules vectoriels
// import { computeEmbedding, findSimilarTickets as findSimilarVectorTickets, countTickets } from './js/vector-db.js';
// import { runDiagnostic } from './js/diagnostic.js';

// Configuration
const CONFIG = {
  SERVER_URL: 'http://localhost:8787',
  SERVER_TIMEOUT: 3000,
  FALLBACK_TO_LOCAL: true
};

// État global
let currentUrl = '';
let mappingData = [];
let serverOnline = false;
let currentTabId = null;
let userSettings = {
  auto_ai_on_unknown_pages: true
};
let currentAISummary = null; // Stocke le résumé IA actuel pour génération PDF

/**
 * Initialisation au chargement du popup
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[SmartContext] Popup initialisé');

  // DÉSACTIVÉ : Diagnostic de la base vectorielle

  // Charger les paramètres utilisateur
  await loadUserSettings();

  // Récupérer l'URL actuelle
  await loadCurrentUrl();

  // Vérifier la connexion serveur
  await checkServerStatus();

  // Charger le mapping
  await loadMapping();

  // Rechercher et afficher la documentation
  await findAndDisplayDocumentation();

  // Charger l'analyse SmartTicket (difficulté du ticket)
  await loadTicketDifficulty(currentUrl);

  // Configurer les event listeners
  setupEventListeners();
});

/**
 * Charge les paramètres utilisateur depuis chrome.storage.sync
 */
async function loadUserSettings() {
  try {
    const result = await chrome.storage.sync.get(['auto_ai_on_unknown_pages']);
    if (result.auto_ai_on_unknown_pages !== undefined) {
      userSettings.auto_ai_on_unknown_pages = result.auto_ai_on_unknown_pages;
    }
    console.log('[SmartContext] Paramètres utilisateur:', userSettings);
  } catch (error) {
    console.error('[SmartContext] Erreur chargement paramètres:', error);
  }
}

/**
 * Récupère l'URL de l'onglet actif
 */
async function loadCurrentUrl() {
  try {
    // Méthode 1 : via chrome.tabs.query
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs && tabs.length > 0) {
      currentUrl = tabs[0].url || '';
      currentTabId = tabs[0].id;
      updateUrlDisplay(currentUrl);
      return;
    }

    // Méthode 2 : via message au background script
    chrome.runtime.sendMessage({ action: 'getCurrentUrl' }, (response) => {
      if (response && response.url) {
        currentUrl = response.url;
        updateUrlDisplay(currentUrl);
      }
    });
  } catch (error) {
    console.error('[SmartContext] Erreur chargement URL:', error);
    updateUrlDisplay('Erreur de chargement');
  }
}

/**
 * Met à jour l'affichage de l'URL
 */
function updateUrlDisplay(url) {
  const urlDisplay = document.getElementById('currentUrl');
  if (urlDisplay) {
    urlDisplay.textContent = url || 'URL non disponible';
    urlDisplay.title = url;
  }
}

/**
 * Vérifie si le serveur est accessible
 */
async function checkServerStatus() {
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.SERVER_TIMEOUT);

    const response = await fetch(`${CONFIG.SERVER_URL}/health`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      serverOnline = true;
      statusIndicator.className = 'status-indicator online';
      statusText.textContent = 'Serveur connecté';
      console.log('[SmartContext] Serveur en ligne');
    } else {
      throw new Error('Serveur non OK');
    }
  } catch (error) {
    serverOnline = false;
    statusIndicator.className = 'status-indicator offline';
    statusText.textContent = 'Mode hors ligne';
    console.log('[SmartContext] Serveur hors ligne, mode local activé');
  }
}

/**
 * Charge le mapping (serveur ou local)
 */
async function loadMapping() {
  // Tentative 1 : charger depuis le serveur si disponible
  if (serverOnline) {
    try {
      const response = await fetch(`${CONFIG.SERVER_URL}/mapping.json`);
      if (response.ok) {
        mappingData = await response.json();
        console.log('[SmartContext] Mapping chargé depuis serveur:', mappingData.length, 'entrées');
        return;
      }
    } catch (error) {
      console.log('[SmartContext] Échec chargement serveur, fallback local');
    }
  }

  // Tentative 2 : charger depuis le fichier local
  if (CONFIG.FALLBACK_TO_LOCAL) {
    try {
      const response = await fetch(chrome.runtime.getURL('mapping.json'));
      mappingData = await response.json();
      console.log('[SmartContext] Mapping chargé localement:', mappingData.length, 'entrées');
    } catch (error) {
      console.error('[SmartContext] Erreur chargement mapping local:', error);
      mappingData = [];
    }
  }
}

/**
 * Recherche et affiche la documentation correspondante
 */
async function findAndDisplayDocumentation() {
  // Vérifier si on est sur une page chrome:// (interdite)
  if (currentUrl.startsWith('chrome://') || currentUrl.startsWith('chrome-extension://')) {
    showNoDocumentation();
    return;
  }

  if (!currentUrl || !mappingData || mappingData.length === 0) {
    // Si auto-IA activé et serveur disponible, générer automatiquement
    if (userSettings.auto_ai_on_unknown_pages && serverOnline) {
      await autoGenerateAISummary();
    } else {
      showNoDocumentation();
    }
    return;
  }

  // Rechercher la meilleure correspondance
  const match = findBestMatch(currentUrl, mappingData);

  if (!match) {
    // Si auto-IA activé et serveur disponible, générer automatiquement
    if (userSettings.auto_ai_on_unknown_pages && serverOnline) {
      await autoGenerateAISummary();
    } else {
      showNoDocumentation();
    }
    return;
  }

  // Afficher la documentation
  displayDocumentation(match);

  // Afficher le bouton "Toujours afficher une aide IA"
  showAIBoostButton();

  // Charger le résumé IA si serveur disponible
  if (serverOnline) {
    await loadAISummary(match.key);
  }
}

/**
 * Trouve la meilleure correspondance dans le mapping
 * Utilise un système de poids basé sur les matches
 */
function findBestMatch(url, mapping) {
  let bestMatch = null;
  let bestScore = 0;

  const urlLower = url.toLowerCase();

  for (const entry of mapping) {
    let score = 0;

    // Vérifier chaque pattern de match
    for (const pattern of entry.match || []) {
      const patternLower = pattern.toLowerCase();

      // Match exact dans l'URL
      if (urlLower.includes(patternLower)) {
        score += 10;
      }

      // Match via regex si le pattern ressemble à une regex
      if (pattern.includes('*') || pattern.includes('.')) {
        try {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
          if (regex.test(url)) {
            score += 15;
          }
        } catch (e) {
          // Pattern invalide, on ignore
        }
      }
    }

    // Bonus pour match du hostname
    if (entry.match && entry.match.length > 0) {
      const hostname = new URL(url).hostname;
      if (entry.match.some(m => hostname.includes(m.toLowerCase()))) {
        score += 5;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  console.log('[SmartContext] Meilleur match:', bestMatch, 'score:', bestScore);
  return bestScore > 0 ? bestMatch : null;
}

/**
 * Affiche la documentation trouvée
 */
function displayDocumentation(doc) {
  const docSection = document.getElementById('docSection');
  const docContent = document.getElementById('docContent');

  if (!docSection || !docContent) return;

  docSection.style.display = 'block';

  // Construire le HTML de la carte
  const tagsHtml = doc.tags && doc.tags.length > 0
    ? `<div class="doc-card-tags">${doc.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>`
    : '';

  const docUrl = serverOnline
    ? `${CONFIG.SERVER_URL}/${doc.path}`
    : chrome.runtime.getURL(doc.path);

  docContent.innerHTML = `
    <div class="doc-card">
      <div class="doc-card-title">${doc.title || 'Documentation'}</div>
      <div class="doc-card-path">${doc.path || ''}</div>
      ${tagsHtml}
      <a href="${docUrl}" target="_blank" class="btn-open-doc">
        📄 Ouvrir la documentation
      </a>
    </div>
  `;

  // Masquer la section "aucune doc"
  const noDocSection = document.getElementById('noDocSection');
  if (noDocSection) {
    noDocSection.style.display = 'none';
  }
}

/**
 * Affiche le message "aucune documentation"
 */
function showNoDocumentation() {
  const docSection = document.getElementById('docSection');
  const noDocSection = document.getElementById('noDocSection');

  if (docSection) {
    docSection.style.display = 'none';
  }

  if (noDocSection) {
    noDocSection.style.display = 'block';
  }
}

/**
 * Charge le résumé IA depuis le serveur
 */
async function loadAISummary(key) {
  if (!key) return;

  try {
    const response = await fetch(`${CONFIG.SERVER_URL}/summaries/${key}`);

    if (!response.ok) {
      console.log('[SmartContext] Résumé IA non disponible pour:', key);
      return;
    }

    const data = await response.json();

    // Stocker pour génération PDF
    currentAISummary = data;

    // Afficher le résumé
    if (data.summary) {
      displaySummary(data.summary);
    }

    // Afficher la checklist
    if (data.checklist && data.checklist.length > 0) {
      displayChecklist(data.checklist);
    }

    // Erreurs fréquentes : section supprimée

    // FAQ : section supprimée

  } catch (error) {
    console.error('[SmartContext] Erreur chargement résumé IA:', error);
  }
}

/**
 * Affiche le résumé IA
 */
function displaySummary(summary) {
  const section = document.getElementById('summarySection');
  const content = document.getElementById('summaryContent');

  if (!section || !content) return;

  section.style.display = 'block';
  content.innerHTML = `<p>${summary}</p>`;

  // Bouton PDF supprimé
}

/**
 * Affiche la checklist
 */
function displayChecklist(checklist) {
  const section = document.getElementById('checklistSection');
  const content = document.getElementById('checklistContent');

  if (!section || !content) return;

  section.style.display = 'block';
  content.innerHTML = checklist.map(item => `<li>${item}</li>`).join('');
}

// Fonction displayCommonErrors supprimée - Section erreurs fréquentes retirée

// Fonction displayFAQs supprimée - Section FAQ retirée

/**
 * Génère automatiquement un résumé IA pour la page courante
 */
async function autoGenerateAISummary(forceGenerate = false) {
  if (!serverOnline) {
    console.log('[SmartContext] Serveur hors ligne, impossible de générer IA');
    if (forceGenerate) {
      alert('Le serveur est hors ligne. Impossible de générer l\'aide IA.');
    }
    return;
  }

  if (!currentTabId) {
    console.error('[SmartContext] Pas d\'ID d\'onglet disponible');
    return;
  }

  // Afficher la section AI auto
  const aiAutoSection = document.getElementById('aiAutoSection');
  const aiAutoLoader = document.getElementById('aiAutoLoader');
  const docSection = document.getElementById('docSection');
  const noDocSection = document.getElementById('noDocSection');

  if (aiAutoSection) {
    aiAutoSection.style.display = 'block';
  }
  if (aiAutoLoader) {
    aiAutoLoader.style.display = 'block';
  }
  if (!forceGenerate && docSection) {
    docSection.style.display = 'none';
  }
  if (noDocSection) {
    noDocSection.style.display = 'none';
  }

  try {
    // Extraire le contenu de la page via content script
    console.log('[SmartContext] Extraction du contenu de la page...');

    const response = await chrome.tabs.sendMessage(currentTabId, { action: 'getFullPageData' });

    if (!response || !response.success) {
      throw new Error('Impossible d\'extraire le contenu de la page');
    }

    const { text, html } = response;

    console.log('[SmartContext] Contenu extrait, appel API...');

    // Appeler l'endpoint /auto-summarize
    const apiResponse = await fetch(`${CONFIG.SERVER_URL}/auto-summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: currentUrl,
        text: text,
        html: html
      })
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(errorData.message || 'Erreur API');
    }

    const data = await apiResponse.json();

    console.log('[SmartContext] Résumé IA généré:', data);

    // Stocker pour génération PDF
    currentAISummary = data;

    // Masquer le loader
    if (aiAutoLoader) {
      aiAutoLoader.style.display = 'none';
    }

    // Afficher les résultats
    if (data.summary) {
      displaySummary(data.summary);
    }

    if (data.checklist && data.checklist.length > 0) {
      displayChecklist(data.checklist);
    }

    // Erreurs fréquentes : section supprimée

    // FAQ : section supprimée

  } catch (error) {
    console.error('[SmartContext] Erreur auto-génération IA:', error);

    if (aiAutoLoader) {
      aiAutoLoader.innerHTML = `
        <div class="error-message">
          ❌ Erreur lors de la génération de l'aide IA : ${error.message}
        </div>
      `;
    }

    // En cas d'erreur forcée, afficher la section no-doc
    if (forceGenerate) {
      if (aiAutoSection) aiAutoSection.style.display = 'none';
      showNoDocumentation();
    }
  }
}

/**
 * Affiche le bouton "Toujours afficher une aide IA"
 */
function showAIBoostButton() {
  const container = document.getElementById('aiBoostContainer');
  if (container) {
    container.style.display = 'block';
  }
}

/**
 * SUPPRIMÉ : Bouton téléchargement PDF
 */

/**
 * Génère et télécharge un PDF du résumé IA
 */
function generatePDF() {
  if (!currentAISummary) {
    alert('Aucun résumé IA disponible pour générer un PDF');
    return;
  }

  try {
    console.log('[SmartContext] Génération PDF...');

    // Initialiser jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Configuration des styles
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Fonction helper pour ajouter du texte avec retour à la ligne
    const addText = (text, fontSize, style = 'normal', color = [0, 0, 0]) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', style);
      doc.setTextColor(...color);

      const lines = doc.splitTextToSize(text, contentWidth);

      // Vérifier si on dépasse la page
      if (yPosition + (lines.length * fontSize * 0.4) > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      doc.text(lines, margin, yPosition);
      yPosition += lines.length * fontSize * 0.4 + 3;
    };

    const addSpacer = (height = 5) => {
      yPosition += height;
    };

    const addLine = () => {
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;
    };

    // === En-tête du document ===
    doc.setFillColor(37, 99, 235); // Bleu primaire
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('📚 SmartContext Doc', margin, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Documentation IA générée automatiquement', margin, 30);

    yPosition = 50;

    // === Métadonnées ===
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(margin, yPosition, contentWidth, 25, 3, 3, 'F');

    yPosition += 7;
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'bold');
    doc.text('URL:', margin + 5, yPosition);
    doc.setFont('helvetica', 'normal');
    const urlText = doc.splitTextToSize(currentUrl, contentWidth - 25);
    doc.text(urlText, margin + 20, yPosition);

    yPosition += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', margin + 5, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleString('fr-FR'), margin + 20, yPosition);

    yPosition += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Source:', margin + 5, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(currentAISummary.source || 'auto-summary', margin + 20, yPosition);

    yPosition += 15;
    addLine();

    // === Résumé ===
    if (currentAISummary.summary) {
      addText('🤖 Résumé', 16, 'bold', [37, 99, 235]);
      addSpacer(3);
      addText(currentAISummary.summary, 11, 'normal', [31, 41, 55]);
      addSpacer(8);
      addLine();
    }

    // === Checklist ===
    if (currentAISummary.checklist && currentAISummary.checklist.length > 0) {
      addText('✅ Checklist', 16, 'bold', [22, 163, 74]);
      addSpacer(3);

      currentAISummary.checklist.forEach((item, index) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(31, 41, 55);

        const lines = doc.splitTextToSize(`${index + 1}. ${item}`, contentWidth - 10);

        if (yPosition + (lines.length * 5) > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        // Puce verte
        doc.setFillColor(22, 163, 74);
        doc.circle(margin + 2, yPosition - 1, 1.5, 'F');

        doc.text(lines, margin + 7, yPosition);
        yPosition += lines.length * 5 + 2;
      });

      addSpacer(5);
      addLine();
    }

    // === Erreurs fréquentes ===
    if (currentAISummary.common_errors && currentAISummary.common_errors.length > 0) {
      addText('⚠️ Erreurs fréquentes', 16, 'bold', [220, 38, 38]);
      addSpacer(3);

      currentAISummary.common_errors.forEach((error, index) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(153, 27, 27);

        const lines = doc.splitTextToSize(`${index + 1}. ${error}`, contentWidth - 10);

        if (yPosition + (lines.length * 5) > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        // Puce rouge
        doc.setFillColor(220, 38, 38);
        doc.circle(margin + 2, yPosition - 1, 1.5, 'F');

        doc.text(lines, margin + 7, yPosition);
        yPosition += lines.length * 5 + 2;
      });

      addSpacer(5);
      addLine();
    }

    // === FAQ ===
    if (currentAISummary.faqs && currentAISummary.faqs.length > 0) {
      addText('❓ FAQ', 16, 'bold', [37, 99, 235]);
      addSpacer(3);

      currentAISummary.faqs.forEach((faq, index) => {
        const question = faq.question || faq.q || '';
        const answer = faq.answer || faq.a || '';

        // Question
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235);

        const questionLines = doc.splitTextToSize(`Q${index + 1}: ${question}`, contentWidth - 5);

        if (yPosition + (questionLines.length * 5 + 10) > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        doc.text(questionLines, margin + 3, yPosition);
        yPosition += questionLines.length * 5 + 2;

        // Réponse
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(75, 85, 99);

        const answerLines = doc.splitTextToSize(answer, contentWidth - 5);
        doc.text(answerLines, margin + 3, yPosition);
        yPosition += answerLines.length * 5 + 5;
      });

      addSpacer(5);
    }

    // === Footer ===
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Généré par SmartContext Doc - Page ${i}/${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // === Téléchargement ===
    const filename = `smartcontext-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

    console.log('[SmartContext] PDF généré:', filename);

    // Notification visuelle
    const button = document.getElementById('btnDownloadPDF');
    if (button) {
      const originalText = button.textContent;
      button.textContent = '✅ PDF téléchargé !';
      button.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';

      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
      }, 2000);
    }

  } catch (error) {
    console.error('[SmartContext] Erreur génération PDF:', error);
    alert('Erreur lors de la génération du PDF : ' + error.message);
  }
}

/**
 * Configure les event listeners des boutons
 */
function setupEventListeners() {
  // Bouton Actualiser
  const btnRefresh = document.getElementById('btnRefresh');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', async () => {
      console.log('[SmartContext] Actualisation...');
      location.reload();
    });
  }

  // Bouton Signaler
  const btnReport = document.getElementById('btnReport');
  if (btnReport) {
    btnReport.addEventListener('click', () => {
      console.log('[SmartContext] Documentation manquante signalée pour:', currentUrl);
      alert(`Documentation manquante signalée pour:\n${currentUrl}\n\nCette fonctionnalité sera disponible prochainement.`);
    });
  }

  // Bouton Paramètres
  const btnSettings = document.getElementById('btnSettings');
  if (btnSettings) {
    btnSettings.addEventListener('click', async () => {
      console.log('[SmartContext] Ouverture des paramètres');

      const autoAIStatus = userSettings.auto_ai_on_unknown_pages ? 'Activé ✅' : 'Désactivé ❌';
      const choice = confirm(
        `⚙️ Paramètres SmartContext Doc\n\n` +
        `📡 Serveur: ${CONFIG.SERVER_URL}\n` +
        `🌐 Mode hors ligne: ${CONFIG.FALLBACK_TO_LOCAL ? 'Activé' : 'Désactivé'}\n` +
        `🤖 IA auto (pages inconnues): ${autoAIStatus}\n\n` +
        `Voulez-vous ${userSettings.auto_ai_on_unknown_pages ? 'DÉSACTIVER' : 'ACTIVER'} l'IA automatique ?`
      );

      if (choice) {
        // Inverser le paramètre
        userSettings.auto_ai_on_unknown_pages = !userSettings.auto_ai_on_unknown_pages;
        await chrome.storage.sync.set({ auto_ai_on_unknown_pages: userSettings.auto_ai_on_unknown_pages });
        console.log('[SmartContext] Paramètre IA auto mis à jour:', userSettings.auto_ai_on_unknown_pages);
        alert(`IA automatique ${userSettings.auto_ai_on_unknown_pages ? 'activée' : 'désactivée'} avec succès !`);
      }
    });
  }

  // Bouton "Toujours afficher une aide IA intelligente"
  const btnAIBoost = document.getElementById('btnAIBoost');
  if (btnAIBoost) {
    btnAIBoost.addEventListener('click', async () => {
      console.log('[SmartContext] Aide IA boost demandée');
      await autoGenerateAISummary(true);
    });
  }

  // Bouton "Générer une aide IA pour cette page"
  const btnGenerateAI = document.getElementById('btnGenerateAI');
  if (btnGenerateAI) {
    btnGenerateAI.addEventListener('click', async () => {
      console.log('[SmartContext] Génération IA manuelle demandée');
      await autoGenerateAISummary(true);
    });
  }

  // Bouton "Télécharger PDF" : SUPPRIMÉ
}

/**
 * === SMARTTICKET - ANALYSE DE DIFFICULTÉ ===
 * Charge et affiche l'analyse de difficulté du ticket depuis l'API SmartTicket
 */

/**
 * Charge l'analyse COMPLÈTE du ticket depuis l'API (Pipeline V3.0)
 * @param {string} url - URL de la page courante
 */
async function loadTicketDifficulty(url) {
  if (!serverOnline) {
    console.log('[SmartTicket] Serveur hors ligne, analyse non disponible');
    return;
  }

  if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    console.log('[SmartTicket] URL non compatible avec SmartTicket');
    return;
  }

  try {
    console.log('[SmartTicket] Chargement analyse COMPLÈTE (pipeline V3.0) pour:', url);

    // NOUVEAU : Appel au pipeline complet /full-analysis
    const response = await fetch(`${CONFIG.SERVER_URL}/smartticket/full-analysis?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      // Si 404 ou autre erreur, on masque simplement les sections
      console.log('[SmartTicket] Pas d\'analyse disponible pour cette URL');
      return;
    }

    const data = await response.json();

    console.log('[SmartTicket] Données pipeline reçues:', data);

    // Afficher les résultats du pipeline
    displayPipelineResult(data);

  } catch (error) {
    console.error('[SmartTicket] Erreur chargement analyse:', error);
    // En cas d'erreur réseau, on masque les sections sans afficher d'erreur
  }
}

/**
 * Affiche le résultat du pipeline complet (V3.0)
 * @param {Object} data - Résultat du pipeline { status, completeness, summary, difficulty, similarTickets }
 */
function displayPipelineResult(data) {
  if (!data) {
    console.log('[SmartTicket] Données invalides, sections masquées');
    return;
  }

  // 1. TOUJOURS afficher la section Complétude en premier
  if (data.completeness) {
    displayCompleteness(data.completeness);
  }

  // 2. SI REJETÉ → ARRÊT IMMÉDIAT, masquer tout le reste
  if (data.status === 'rejected') {
    console.log('[SmartTicket] Ticket REJETÉ - Affichage complétude uniquement');

    // Masquer toutes les autres sections
    hideSection('summarySection');
    hideSection('checklistSection');
    // hideSection('errorsSection'); // Section supprimée
    // hideSection('faqSection'); // Section supprimée
    hideSection('difficultySection');
    hideSection('similarSection');

    return; // ARRÊT
  }

  // 3. Si accepté (incomplete ou complete), afficher le reste
  console.log('[SmartTicket] Ticket ACCEPTÉ - Affichage complet du pipeline');

  // Afficher le résumé si disponible
  if (data.summary) {
    displayTicketSummary(data.summary);
  }

  // Afficher la difficulté
  if (data.difficulty) {
    displayTicketDifficulty(data.difficulty);
  }

  // Afficher les tickets similaires depuis le backend (méthode originale)
  if (data.similarTickets && data.similarTickets.length > 0) {
    displaySimilarTickets(data.similarTickets);
  }
}

/**
 * Affiche les données d'analyse de difficulté dans la popup
 * @param {Object} data - { difficultyScore, modules, risks, scoreDetails, recommendation }
 */
function displayTicketDifficulty(data) {
  if (!data || typeof data.difficultyScore === 'undefined') {
    console.log('[SmartTicket] Données invalides, section masquée');
    return;
  }

  // Afficher la section
  const section = document.getElementById('difficultySection');
  if (section) {
    section.style.display = 'block';
  }

  // 1. Badge et score
  updateDifficultyBadge(data.difficultyScore);

  // 2. Barre de difficulté (5 segments)
  updateDifficultyBar(data.difficultyScore);

  // 3. Détails du score
  updateScoreDetails(data.scoreDetails);

  // 5. Modules impactés
  updateModulesList(data.modules);

  // 6. Risques détectés
  updateRisksList(data.risks);

  // 7. Recommandation
  updateRecommendation(data.recommendation);
}

/**
 * Met à jour le badge de difficulté avec couleur et texte
 * @param {number} score - Score de difficulté (1-5)
 */
function updateDifficultyBadge(score) {
  const badge = document.getElementById('difficultyBadge');
  const textElement = document.getElementById('difficultyText');
  const scoreDisplay = document.getElementById('difficultyScoreDisplay');

  if (!badge || !textElement || !scoreDisplay) return;

  // Déterminer le niveau et la classe
  let level = '';
  let className = '';
  let emoji = '';

  if (score >= 1 && score < 3) {
    level = 'Faible';
    className = 'difficulty-low';
    emoji = '✓';
  } else if (score >= 3 && score < 4) {
    level = 'Moyenne';
    className = 'difficulty-medium';
    emoji = '⚠️';
  } else if (score >= 4 && score <= 5) {
    level = 'Élevée';
    className = 'difficulty-high';
    emoji = '🔥';
  } else {
    level = 'Inconnue';
    className = '';
    emoji = '❓';
  }

  // Appliquer la classe
  badge.className = `difficulty-badge ${className}`;

  // Mettre à jour le texte
  textElement.textContent = `Difficulté : ${level} ${emoji}`;

  // Afficher le score
  scoreDisplay.textContent = score.toFixed(1);
}

/**
 * Met à jour la barre de difficulté (5 segments)
 * Active les segments jusqu'au score arrondi
 * @param {number} score - Score de difficulté (1-5)
 */
function updateDifficultyBar(score) {
  const segments = document.querySelectorAll('.difficulty-bar .segment');

  if (!segments || segments.length === 0) return;

  // Désactiver tous les segments d'abord
  segments.forEach(segment => {
    segment.classList.remove('active');
  });

  // Activer les segments jusqu'au score (arrondi à l'entier supérieur)
  const activeCount = Math.ceil(score);

  for (let i = 0; i < activeCount && i < segments.length; i++) {
    segments[i].classList.add('active');
  }

  console.log(`[SmartTicket] Barre mise à jour: ${activeCount}/5 segments actifs`);
}

/**
 * Met à jour la liste des modules impactés
 * @param {Array<string>} modules - Liste des modules
 */
function updateModulesList(modules) {
  const container = document.getElementById('modulesList');

  if (!container) return;

  if (!modules || modules.length === 0) {
    container.innerHTML = '<span class="no-modules">Aucun module identifié</span>';
    return;
  }

  // Créer les badges de modules
  const badgesHtml = modules
    .map(module => `<span class="module-badge">${escapeHtml(module)}</span>`)
    .join('');

  container.innerHTML = badgesHtml;

  console.log(`[SmartTicket] ${modules.length} module(s) affiché(s)`);
}

/**
 * Met à jour la liste des risques détectés
 * @param {Array<string>} risks - Liste des risques
 */
function updateRisksList(risks) {
  const list = document.getElementById('risksList');

  if (!list) return;

  if (!risks || risks.length === 0) {
    list.innerHTML = '<li class="no-risk">Aucun risque identifié</li>';
    return;
  }

  // Créer les éléments de liste
  const itemsHtml = risks
    .map(risk => `<li>${escapeHtml(risk)}</li>`)
    .join('');

  list.innerHTML = itemsHtml;

  console.log(`[SmartTicket] ${risks.length} risque(s) affiché(s)`);
}

// Fonction updatePriorityBadge supprimée - Badge priorité retiré

/**
 * Met à jour les détails du score
 * @param {Array} scoreDetails - Liste des critères avec impacts
 */
function updateScoreDetails(scoreDetails) {
  const section = document.getElementById('scoreDetailsSection');
  const list = document.getElementById('scoreDetailsList');

  if (!section || !list) return;

  if (!scoreDetails || scoreDetails.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';

  // Créer les éléments de liste
  const itemsHtml = scoreDetails.map(detail => {
    const valueText = Array.isArray(detail.value)
      ? detail.value.join(', ')
      : detail.description || detail.value;

    return `
      <li>
        <span class="detail-label">📌 ${escapeHtml(detail.criterion)}</span>
        <span class="detail-impact">+${detail.impact}</span>
      </li>
    `;
  }).join('');

  list.innerHTML = itemsHtml;

  console.log(`[SmartTicket] ${scoreDetails.length} détails de score affichés`);
}

/**
 * Met à jour la recommandation
 * @param {string} recommendation - Texte de recommandation
 */
function updateRecommendation(recommendation) {
  const section = document.getElementById('recommendationSection');
  const box = document.getElementById('recommendationBox');

  if (!section || !box) return;

  if (!recommendation) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';

  // Afficher la recommandation (avec retours à la ligne sur les points)
  const formattedText = recommendation.split('. ').map(sentence => {
    if (sentence.trim().length === 0) return '';
    return sentence.trim() + '.';
  }).filter(s => s).join('<br><br>');

  box.innerHTML = `<p>${formattedText}</p>`;

  console.log(`[SmartTicket] Recommandation affichée`);
}

/**
 * Affiche la section Complétude (Étape 1 du pipeline)
 * @param {Object} completeness - { completenessScore, level, decision, message, missingElements, detectedElements }
 */
function displayCompleteness(completeness) {
  const section = document.getElementById('completenessSection');
  const badge = document.getElementById('completenessBadge');
  const message = document.getElementById('completenessMessage');
  const missingList = document.getElementById('missingElementsList');
  const scoreDetails = document.getElementById('completenessScoreDetails');

  if (!section || !badge || !message || !missingList || !scoreDetails) return;

  // Afficher la section
  section.style.display = 'block';

  // Badge selon le niveau
  let badgeClass = '';
  let badgeText = '';

  if (completeness.decision === 'Rejected') {
    badgeClass = 'badge-danger';
    badgeText = `🔴 REJETÉ (Score: ${completeness.completenessScore}/100)`;
  } else if (completeness.decision === 'Accepted-Incomplete') {
    badgeClass = 'badge-warning';
    badgeText = `🟠 ACCEPTÉ INCOMPLET (Score: ${completeness.completenessScore}/100)`;
  } else if (completeness.decision === 'Accepted-Complete') {
    badgeClass = 'badge-success';
    badgeText = `🟢 COMPLET (Score: ${completeness.completenessScore}/100)`;
  } else {
    badgeClass = 'badge';
    badgeText = `Score: ${completeness.completenessScore}/100`;
  }

  badge.className = `badge ${badgeClass}`;
  badge.textContent = badgeText;

  // Message
  message.textContent = completeness.message || '';

  // Liste des éléments manquants et détectés
  let listHtml = '';

  if (completeness.missingElements && completeness.missingElements.length > 0) {
    listHtml += completeness.missingElements
      .map(item => `<li>❌ ${escapeHtml(item)}</li>`)
      .join('');
  }

  if (completeness.detectedElements && completeness.detectedElements.length > 0) {
    listHtml += completeness.detectedElements
      .map(item => `<li class="detected">✅ ${escapeHtml(item)}</li>`)
      .join('');
  }

  missingList.innerHTML = listHtml || '<li class="detected">Tous les éléments sont présents</li>';

  // Score details
  scoreDetails.textContent = `Niveau : ${completeness.level || 'N/A'}`;

  console.log(`[SmartTicket] Complétude affichée: ${completeness.decision} (${completeness.completenessScore})`);
}

/**
 * Affiche le résumé du ticket (Étape 2 du pipeline)
 * @param {string} summary - Résumé structuré
 */
function displayTicketSummary(summary) {
  const section = document.getElementById('summarySection');
  const content = document.getElementById('summaryContent');

  if (!section || !content) return;

  section.style.display = 'block';

  // Convertir les sauts de ligne en HTML
  const formattedSummary = summary.replace(/\n/g, '<br>');

  content.innerHTML = `<p>${formattedSummary}</p>`;

  console.log(`[SmartTicket] Résumé affiché`);
}

// DÉSACTIVÉ : Recherche vectorielle
/*
async function displaySimilarTicketsFromVectorDB(ticketData) {
  // Code désactivé
}
*/

/**
 * Affiche les tickets similaires avec explications intelligentes (Étape 4 du pipeline)
 * @param {Array} similarTickets - [{ id, title, category, similarity, explanation, explanationText }]
 */
function displaySimilarTickets(similarTickets) {
  const section = document.getElementById('similarSection');
  const list = document.getElementById('similarTicketsList');

  if (!section || !list) return;

  if (!similarTickets || similarTickets.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';

  // Créer la liste HTML avec explications
  const listHtml = similarTickets.map(ticket => {
    const similarityPercent = (ticket.similarity * 100).toFixed(0);

    // URL Mantis reconstituée
    const mantisUrl = `https://mantis-pd.cegid.fr/mantis-client/view.php?id=${ticket.id}`;

    // Explication courte
    const explanationText = ticket.explanationText || 'Similarité détectée';

    // Badge de similarité avec couleur
    let similarityClass = 'similarity-low';
    let similarityIcon = '🔵';
    if (ticket.similarity >= 0.7) {
      similarityClass = 'similarity-high';
      similarityIcon = '🔴';
    } else if (ticket.similarity >= 0.5) {
      similarityClass = 'similarity-medium';
      similarityIcon = '🟠';
    }

    return `
      <li class="similar-ticket-item">
        <div class="similar-header">
          <strong><a href="${mantisUrl}" target="_blank" class="ticket-link">#${escapeHtml(ticket.id)}</a></strong>
          <span class="similarity-badge ${similarityClass}">${similarityIcon} ${similarityPercent}%</span>
        </div>
        <div class="similar-title">${escapeHtml(ticket.title)}</div>
        <div class="similar-explanation">
          <small>💡 ${escapeHtml(explanationText)}</small>
        </div>
      </li>
    `;
  }).join('');

  list.innerHTML = listHtml;

  console.log(`[SmartTicket] ${similarTickets.length} ticket(s) similaire(s) affiché(s) avec explications`);
}

/**
 * Masque une section
 * @param {string} sectionId - ID de la section à masquer
 */
function hideSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.style.display = 'none';
  }
}

/**
 * Échappe le HTML pour éviter XSS
 * @param {string} text - Texte à échapper
 * @returns {string} Texte échappé
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

console.log('[SmartContext] popup.js chargé');
