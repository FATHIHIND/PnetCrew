/**
 * Générateur de Résumé - Étape 2 du Pipeline
 * Produit un résumé clair et structuré du ticket
 */

/**
 * Génère un résumé structuré du ticket
 * @param {Object} ticket - Ticket à résumer
 * @returns {string} Résumé en 4-6 lignes
 */
export function generateSummary(ticket) {
  console.log(`[Summarizer] Génération du résumé pour ticket ${ticket.id}`);

  const lines = [];

  // Ligne 1 : Titre et ID
  lines.push(`**Ticket #${ticket.id}** : ${ticket.title}`);

  // Ligne 2 : Module concerné
  const module = detectModule(ticket);
  if (module) {
    lines.push(`**Module** : ${module}`);
  }

  // Ligne 3 : Problème principal
  const problem = extractProblem(ticket);
  if (problem) {
    lines.push(`**Problème** : ${problem}`);
  }

  // Ligne 4 : Impact
  const impact = detectImpact(ticket);
  if (impact) {
    lines.push(`**Impact** : ${impact}`);
  }

  // Ligne 5 : Contexte supplémentaire
  const context = extractContext(ticket);
  if (context) {
    lines.push(`**Contexte** : ${context}`);
  }

  const summary = lines.join('\n');

  console.log(`[Summarizer] Résumé généré (${lines.length} lignes)`);

  return summary;
}

/**
 * Détecte le module principal
 */
function detectModule(ticket) {
  const fullText = `${ticket.title} ${ticket.description} ${ticket.category || ''}`.toLowerCase();

  const modules = {
    'Paie': ['paie', 'salaire', 'bulletin', 'cotisation'],
    'Absence': ['absence', 'congé', 'cp', 'rtt'],
    'Planning': ['planning', 'horaire', 'shift', 'calendrier'],
    'RH': ['rh', 'ressources humaines', 'employé', 'salarié'],
    'Contrat': ['contrat', 'embauche', 'démission']
  };

  for (const [moduleName, keywords] of Object.entries(modules)) {
    if (keywords.some(keyword => fullText.includes(keyword))) {
      return moduleName;
    }
  }

  return ticket.category || 'Non spécifié';
}

/**
 * Extrait le problème principal
 */
function extractProblem(ticket) {
  const desc = ticket.description || '';

  // Essayer d'extraire la première phrase significative
  const sentences = desc.split(/[.!?]\s+/);
  const firstSentence = sentences[0]?.trim();

  if (firstSentence && firstSentence.length > 20 && firstSentence.length < 150) {
    return firstSentence;
  }

  // Sinon, prendre les 100 premiers caractères
  if (desc.length > 100) {
    return desc.substring(0, 100) + '...';
  }

  return desc || ticket.title;
}

/**
 * Détecte l'impact
 */
function detectImpact(ticket) {
  const fullText = `${ticket.title} ${ticket.description}`.toLowerCase();

  // Impact multi-clients
  if (fullText.includes('multi-client') || fullText.includes('tous les clients') || fullText.includes('plusieurs clients')) {
    return 'Multi-clients (critique)';
  }

  // Impact production
  if (fullText.includes('production') || fullText.includes('prod')) {
    return 'Production bloquée';
  }

  // Impact financier
  if (fullText.includes('paie') || fullText.includes('salaire') || fullText.includes('erreur de calcul')) {
    return 'Impact financier';
  }

  // Impact selon priorité
  const priority = (ticket.priority || '').toLowerCase();
  if (priority === 'urgent') {
    return 'Critique - Traitement urgent';
  }
  if (priority === 'high') {
    return 'Important - Traitement rapide souhaité';
  }

  return 'Impact modéré';
}

/**
 * Extrait le contexte supplémentaire
 */
function extractContext(ticket) {
  const parts = [];

  // Nombre de commentaires
  if (ticket.comments && ticket.comments.length > 0) {
    parts.push(`${ticket.comments.length} échange(s)`);
  }

  // Âge du ticket
  if (ticket.created_at) {
    const age = Math.floor((Date.now() - new Date(ticket.created_at)) / (1000 * 60 * 60 * 24));
    if (age > 7) {
      parts.push(`Ouvert depuis ${age} jours`);
    }
  }

  // Réouverture
  if (ticket.history && ticket.history.some(h => h.new_value === 'reopened')) {
    parts.push('Ticket réouvert');
  }

  return parts.length > 0 ? parts.join(', ') : null;
}

export default {
  generateSummary
};
