/**
 * SmartTicket - Popup Script
 * Affiche l'analyse du dernier ticket analysé
 */

const API_URL = 'http://localhost:8787/smartticket/last-result';

// État de l'application
let currentData = null;

// Éléments DOM
const elements = {
  loading: document.getElementById('loading'),
  error: document.getElementById('error'),
  content: document.getElementById('content'),
  errorMessage: document.getElementById('error-message'),
  retryBtn: document.getElementById('retry-btn'),

  // Ticket info
  ticketId: document.getElementById('ticketId'),
  ticketTitle: document.getElementById('ticketTitle'),

  // Difficulty
  difficultyBadge: document.getElementById('difficultyBadge'),
  difficultyScore: document.getElementById('difficultyScore'),
  difficultyBar: document.getElementById('difficultyBar'),

  // Modules
  modulesList: document.getElementById('modulesList'),

  // Risks
  risksList: document.getElementById('risksList'),

  // Summary
  summary: document.getElementById('summary'),

  // Metadata
  priority: document.getElementById('priority'),
  statusValue: document.getElementById('status-value'),
  age: document.getElementById('age')
};

/**
 * Initialisation
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[SmartTicket] Initialisation de la popup');
  loadData();

  // Retry button
  elements.retryBtn.addEventListener('click', loadData);
});

/**
 * Charge les données depuis l'API
 */
async function loadData() {
  showLoading();

  try {
    console.log('[SmartTicket] Récupération des données depuis', API_URL);

    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Aucune analyse disponible. Veuillez d\'abord analyser un ticket.');
      }
      throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[SmartTicket] Données reçues:', data);

    currentData = data;
    displayData(data);
    showContent();

  } catch (error) {
    console.error('[SmartTicket] Erreur chargement:', error);
    showError(error.message);
  }
}

/**
 * Affiche les données dans la popup
 */
function displayData(data) {
  // Ticket header
  elements.ticketId.textContent = `#${data.ticketId || '—'}`;
  elements.ticketTitle.textContent = data.title || 'Titre non disponible';

  // Difficulty
  displayDifficulty(data.difficultyScore, data.difficultyLevel);

  // Modules impactés
  displayModules(data);

  // Risques
  displayRisks(data.risks);

  // Résumé IA
  displaySummary(data.summary);

  // Metadata
  displayMetadata(data.metadata);
}

/**
 * Affiche la difficulté avec badge et barre
 */
function displayDifficulty(score, level) {
  // Score
  elements.difficultyScore.textContent = score ? score.toFixed(1) : '—';

  // Badge
  const levelText = getLevelText(level);
  const levelClass = getLevelClass(level);

  elements.difficultyBadge.textContent = levelText;
  elements.difficultyBadge.className = `difficulty-badge ${levelClass}`;

  // Barre (5 segments)
  const segments = elements.difficultyBar.querySelectorAll('.segment');
  const filledCount = Math.ceil((score / 5) * 5); // 0-5 segments

  segments.forEach((segment, index) => {
    if (index < filledCount) {
      segment.classList.add('filled', levelClass);
    } else {
      segment.classList.remove('filled', 'low', 'medium', 'high', 'very-high', 'critical');
    }
  });
}

/**
 * Affiche les modules impactés
 */
function displayModules(data) {
  const modules = extractModules(data);

  if (modules.length === 0) {
    elements.modulesList.innerHTML = '<span class="no-data">Aucun module identifié</span>';
    return;
  }

  elements.modulesList.innerHTML = modules
    .map(module => `<span class="module-tag">${module}</span>`)
    .join('');
}

/**
 * Extrait les modules depuis dependencies ou functionalArea
 */
function extractModules(data) {
  const modules = new Set();

  // Depuis dependencies
  if (data.dependencies && Array.isArray(data.dependencies)) {
    data.dependencies.forEach(dep => {
      if (dep.modules && Array.isArray(dep.modules)) {
        dep.modules.forEach(m => modules.add(m));
      }
    });
  }

  // Depuis functionalArea
  if (data.functionalArea && data.functionalArea !== 'Autre') {
    modules.add(data.functionalArea);
  }

  return Array.from(modules);
}

/**
 * Affiche les risques
 */
function displayRisks(risks) {
  if (!risks || risks.length === 0) {
    elements.risksList.innerHTML = '<li class="no-data">Aucun risque identifié</li>';
    return;
  }

  elements.risksList.innerHTML = risks
    .map(risk => `<li>${escapeHtml(risk)}</li>`)
    .join('');
}

/**
 * Affiche le résumé IA
 */
function displaySummary(summary) {
  if (!summary) {
    elements.summary.innerHTML = '<p class="no-data">Résumé non disponible</p>';
    return;
  }

  // Nettoyer et formater le résumé
  const cleaned = summary
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('<br><br>');

  elements.summary.innerHTML = `<p>${cleaned}</p>`;
}

/**
 * Affiche les métadonnées
 */
function displayMetadata(metadata) {
  if (!metadata) {
    elements.priority.textContent = '—';
    elements.statusValue.textContent = '—';
    elements.age.textContent = '—';
    return;
  }

  // Priorité
  elements.priority.textContent = metadata.priority || '—';
  elements.priority.style.color = getPriorityColor(metadata.priority);

  // Statut
  elements.statusValue.textContent = metadata.status || '—';

  // Âge
  if (metadata.age_days !== undefined) {
    elements.age.textContent = `${metadata.age_days} jour${metadata.age_days > 1 ? 's' : ''}`;
  } else {
    elements.age.textContent = '—';
  }
}

/**
 * Obtient le texte du niveau de difficulté
 */
function getLevelText(level) {
  const levelMap = {
    'low': 'Faible',
    'medium': 'Moyen',
    'high': 'Élevé',
    'very_high': 'Très Élevé',
    'very-high': 'Très Élevé',
    'critical': 'Critique'
  };
  return levelMap[level] || level || 'Inconnu';
}

/**
 * Obtient la classe CSS pour le niveau
 */
function getLevelClass(level) {
  const classMap = {
    'low': 'low',
    'medium': 'medium',
    'high': 'high',
    'very_high': 'very-high',
    'very-high': 'very-high',
    'critical': 'critical'
  };
  return classMap[level] || 'medium';
}

/**
 * Obtient la couleur pour la priorité
 */
function getPriorityColor(priority) {
  const colorMap = {
    'urgent': '#c53030',
    'high': '#ed8936',
    'normal': '#4a5568',
    'low': '#48bb78'
  };
  return colorMap[priority] || '#4a5568';
}

/**
 * Échappe le HTML pour éviter XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Affiche l'état de chargement
 */
function showLoading() {
  elements.loading.classList.remove('hidden');
  elements.error.classList.add('hidden');
  elements.content.classList.add('hidden');
}

/**
 * Affiche une erreur
 */
function showError(message) {
  elements.loading.classList.add('hidden');
  elements.error.classList.remove('hidden');
  elements.content.classList.add('hidden');
  elements.errorMessage.textContent = message;
}

/**
 * Affiche le contenu
 */
function showContent() {
  elements.loading.classList.add('hidden');
  elements.error.classList.add('hidden');
  elements.content.classList.remove('hidden');
}
