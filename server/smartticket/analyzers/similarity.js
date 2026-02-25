/**
 * Détecteur de Tickets Similaires - Étape 4 du Pipeline
 * Trouve les tickets similaires dans la base (mock) avec explications intelligentes
 */

/**
 * Base de tickets mock pour comparaison (ENRICHIE)
 */
const MOCK_TICKETS_DB = [
  {
    id: '112020',
    title: 'Incohérence calcul absence pour multi-contrats',
    description: 'Les absences sont comptabilisées en double pour les salariés ayant plusieurs contrats simultanés.',
    summary: 'Bug de double comptabilisation des absences pour les salariés en multi-contrats',
    category: 'Absence',
    modules: ['Absence', 'Contrat'],
    keywords: ['absence', 'multi-contrats', 'calcul', 'doublon'],
    riskWords: ['incohérence', 'double comptabilisation']
  },
  {
    id: '110452',
    title: 'Erreur calcul planning après modification absence',
    description: 'Après modification d\'une absence, le planning ne se recalcule pas correctement.',
    summary: 'Le planning ne se met pas à jour automatiquement après modification d\'absence',
    category: 'Planning',
    modules: ['Planning', 'Absence'],
    keywords: ['planning', 'absence', 'calcul', 'modification'],
    riskWords: ['erreur calcul', 'non synchronisé']
  },
  {
    id: '109876',
    title: 'Bug affichage bulletin de paie',
    description: 'Le bulletin de paie ne s\'affiche pas correctement sur Chrome.',
    summary: 'Problème d\'affichage UI du bulletin de paie sur navigateur Chrome',
    category: 'Paie',
    modules: ['Paie'],
    keywords: ['paie', 'affichage', 'bulletin', 'chrome'],
    riskWords: ['bug affichage']
  },
  {
    id: '111525',
    title: 'Incohérence calcul absence multi-contrats',
    description: 'Le calcul des absences ne fonctionne pas correctement pour les salariés ayant plusieurs contrats simultanés.',
    summary: 'Calcul incorrect des absences en cas de multi-contrats',
    category: 'Absence',
    modules: ['Absence', 'Contrat', 'Planning'],
    keywords: ['absence', 'multi-contrats', 'incohérence', 'calcul'],
    riskWords: ['incohérence', 'calcul incorrect', 'multi-contrats']
  },
  {
    id: '108765',
    title: 'Régression paie après mise à jour V2024.2',
    description: 'Depuis la mise à jour V2024.2, les calculs de paie sont incorrects pour plusieurs clients.',
    summary: 'Régression fonctionnelle suite à la mise à jour V2024.2',
    category: 'Paie',
    modules: ['Paie'],
    keywords: ['paie', 'régression', 'calcul', 'mise à jour'],
    riskWords: ['régression', 'impact multi-clients']
  },
  {
    id: '107654',
    title: 'Planning ne se charge pas en production',
    description: 'Le module planning ne se charge pas en environnement production depuis ce matin.',
    summary: 'Blocage total du module Planning en production',
    category: 'Planning',
    modules: ['Planning'],
    keywords: ['planning', 'production', 'chargement', 'blocage'],
    riskWords: ['blocage', 'production']
  },
  {
    id: '106543',
    title: 'Erreur lors de la génération DSN',
    description: 'La génération du fichier DSN échoue avec une erreur technique.',
    summary: 'Échec de la génération du fichier DSN',
    category: 'Paie',
    modules: ['Paie', 'Export'],
    keywords: ['dsn', 'génération', 'erreur', 'paie'],
    riskWords: ['erreur génération', 'échec']
  },
  {
    id: '105432',
    title: 'Absence non prise en compte dans le calcul paie',
    description: 'Les absences saisies ne sont pas prises en compte lors du calcul de la paie.',
    summary: 'Les absences ne sont pas intégrées dans le calcul de la paie',
    category: 'Absence',
    modules: ['Absence', 'Paie'],
    keywords: ['absence', 'paie', 'calcul', 'non pris en compte'],
    riskWords: ['non pris en compte', 'calcul incorrect']
  }
];

/**
 * Trouve les tickets similaires avec explications intelligentes
 * @param {Object} ticket - Ticket à analyser
 * @returns {Object} Liste des tickets similaires avec scores et explications
 */
export function findSimilarTickets(ticket) {
  console.log(`[Similarity] Recherche de tickets similaires pour ${ticket.id}`);

  // Extraire les mots-clés du ticket
  const ticketKeywords = extractKeywords(ticket);

  // Calculer la similarité avec chaque ticket de la base
  const similarities = MOCK_TICKETS_DB
    .filter(mockTicket => mockTicket.id !== ticket.id) // Exclure le ticket lui-même
    .map(mockTicket => {
      const similarity = calculateSimilarity(ticketKeywords, mockTicket);
      const explanation = explainSimilarity(ticket, mockTicket);

      return {
        id: mockTicket.id,
        title: mockTicket.title,
        category: mockTicket.category,
        similarity: similarity,
        explanation: explanation.reasons,
        explanationText: explanation.text
      };
    })
    .filter(result => result.similarity > 0.3) // Seuil minimum de similarité
    .sort((a, b) => b.similarity - a.similarity) // Trier par similarité décroissante
    .slice(0, 3); // Garder les 3 meilleurs

  console.log(`[Similarity] ${similarities.length} ticket(s) similaire(s) trouvé(s)`);

  return {
    similarTickets: similarities,
    count: similarities.length
  };
}

/**
 * Récupère les détails complets d'un ticket depuis la base mock
 * @param {string} id - ID du ticket
 * @returns {Object|null} Détails du ticket ou null si non trouvé
 */
export function fetchTicketDetails(id) {
  console.log(`[Similarity] Récupération détails ticket #${id}`);

  const ticket = MOCK_TICKETS_DB.find(t => t.id === id);

  if (!ticket) {
    console.log(`[Similarity] Ticket #${id} non trouvé dans la base`);
    return null;
  }

  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    summary: ticket.summary,
    category: ticket.category,
    modules: ticket.modules,
    keywords: ticket.keywords,
    riskWords: ticket.riskWords
  };
}

/**
 * Explique pourquoi deux tickets sont similaires (NOUVEAU)
 * @param {Object} baseTicket - Ticket de référence
 * @param {Object} similarTicket - Ticket à comparer
 * @returns {Object} { reasons: Array, text: string }
 */
export function explainSimilarity(baseTicket, similarTicket) {
  const reasons = [];
  let explanationText = '';

  // 1. Modules communs
  const baseModules = detectModules(baseTicket);
  const similarModules = similarTicket.modules || [];

  const commonModules = baseModules.filter(m => similarModules.includes(m));

  if (commonModules.length > 0) {
    reasons.push(`Modules communs : ${commonModules.join(', ')}`);
  }

  // 2. Mots-clés communs
  const baseKeywords = extractKeywords(baseTicket);
  const similarKeywords = similarTicket.keywords || [];

  const commonKeywords = baseKeywords.filter(kw => similarKeywords.includes(kw));

  if (commonKeywords.length > 0) {
    reasons.push(`Termes communs : ${commonKeywords.slice(0, 3).map(k => `'${k}'`).join(', ')}`);
  }

  // 3. Catégories proches
  const baseCategory = baseTicket.category || detectCategory(baseTicket);
  const similarCategory = similarTicket.category || '';

  if (baseCategory === similarCategory) {
    reasons.push(`Catégorie identique : ${baseCategory}`);
  }

  // 4. Risk words (anomalies similaires)
  const baseRiskWords = extractRiskWords(baseTicket);
  const similarRiskWords = similarTicket.riskWords || [];

  const commonRiskWords = baseRiskWords.filter(rw =>
    similarRiskWords.some(srw => srw.toLowerCase().includes(rw.toLowerCase()) || rw.toLowerCase().includes(srw.toLowerCase()))
  );

  if (commonRiskWords.length > 0) {
    reasons.push(`Anomalies similaires : ${commonRiskWords.slice(0, 2).join(', ')}`);
  }

  // 5. Patterns fonctionnels
  const baseFunctionalPattern = detectFunctionalPattern(baseTicket);
  const similarFunctionalPattern = detectFunctionalPattern(similarTicket);

  if (baseFunctionalPattern && baseFunctionalPattern === similarFunctionalPattern) {
    reasons.push(`Problème fonctionnel comparable : ${baseFunctionalPattern}`);
  }

  // Générer le texte d'explication
  if (reasons.length === 0) {
    explanationText = 'Similarité basée sur les mots-clés généraux';
  } else if (reasons.length === 1) {
    explanationText = reasons[0];
  } else {
    explanationText = reasons.join(' • ');
  }

  return {
    reasons: reasons,
    text: explanationText
  };
}

/**
 * Détecte les modules impactés par un ticket
 */
function detectModules(ticket) {
  const text = `${ticket.title} ${ticket.description}`.toLowerCase();
  const modules = [];

  const modulePatterns = {
    'Paie': /paie|salaire|bulletin|cotisation|net à payer/i,
    'Absence': /absence|congé|maladie|rtt|cp/i,
    'Planning': /planning|horaire|pointage|badge/i,
    'Contrat': /contrat|embauche|cdi|cdd|multi-contrat/i,
    'RH': /rh|recrutement|formation|entretien/i,
    'Export': /dsn|export|fichier|génération/i
  };

  for (const [module, pattern] of Object.entries(modulePatterns)) {
    if (pattern.test(text)) {
      modules.push(module);
    }
  }

  return modules;
}

/**
 * Détecte la catégorie d'un ticket
 */
function detectCategory(ticket) {
  const text = `${ticket.title} ${ticket.description}`.toLowerCase();

  if (/paie|salaire|bulletin/.test(text)) return 'Paie';
  if (/absence|congé/.test(text)) return 'Absence';
  if (/planning|horaire/.test(text)) return 'Planning';
  if (/contrat/.test(text)) return 'Contrat';
  if (/rh|recrutement/.test(text)) return 'RH';

  return 'Général';
}

/**
 * Extrait les mots-clés de risque (incohérence, régression, blocage...)
 */
function extractRiskWords(ticket) {
  const text = `${ticket.title} ${ticket.description}`.toLowerCase();
  const riskWords = [];

  const riskPatterns = [
    'incohérence',
    'régression',
    'blocage',
    'erreur',
    'bug',
    'calcul incorrect',
    'double comptabilisation',
    'non pris en compte',
    'ne fonctionne pas',
    'multi-clients'
  ];

  for (const pattern of riskPatterns) {
    if (text.includes(pattern)) {
      riskWords.push(pattern);
    }
  }

  return riskWords;
}

/**
 * Détecte le pattern fonctionnel (ex: "recalcul absence/planning")
 */
function detectFunctionalPattern(ticket) {
  const text = `${ticket.title} ${ticket.description}`.toLowerCase();

  if (/calcul.*absence.*planning/.test(text) || /planning.*absence/.test(text)) {
    return 'Recalcul Absence/Planning';
  }

  if (/absence.*paie/.test(text) || /paie.*absence/.test(text)) {
    return 'Intégration Absence dans Paie';
  }

  if (/multi-contrat/.test(text)) {
    return 'Gestion multi-contrats';
  }

  if (/régression/.test(text)) {
    return 'Régression fonctionnelle';
  }

  return null;
}

/**
 * Extrait les mots-clés d'un ticket
 */
function extractKeywords(ticket) {
  const text = `${ticket.title} ${ticket.description}`.toLowerCase();

  // Mots vides à ignorer
  const stopWords = [
    'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du',
    'et', 'ou', 'mais', 'pour', 'dans', 'sur', 'avec',
    'est', 'sont', 'a', 'ont', 'pas', 'ne', 'que',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'
  ];

  // Extraire les mots (min 3 caractères)
  const words = text
    .match(/\b[a-zàâäéèêëïîôùûü]{3,}\b/gi) || [];

  // Filtrer les mots vides
  const keywords = words
    .filter(word => !stopWords.includes(word.toLowerCase()))
    .map(word => word.toLowerCase());

  // Compter les occurrences
  const frequency = {};
  keywords.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Retourner les mots triés par fréquence
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
}

/**
 * Calcule le score de similarité entre deux tickets
 * @param {Array} ticketKeywords - Mots-clés du ticket source
 * @param {Object} mockTicket - Ticket de comparaison
 * @returns {number} Score de similarité (0-1)
 */
function calculateSimilarity(ticketKeywords, mockTicket) {
  let score = 0;

  // Poids par type de match
  const CATEGORY_WEIGHT = 0.3;
  const KEYWORD_WEIGHT = 0.5;
  const TITLE_WEIGHT = 0.2;

  // 1. Similarité de catégorie
  if (mockTicket.category) {
    const categoryMatch = ticketKeywords.some(kw =>
      mockTicket.category.toLowerCase().includes(kw)
    );
    if (categoryMatch) {
      score += CATEGORY_WEIGHT;
    }
  }

  // 2. Similarité des mots-clés
  const commonKeywords = ticketKeywords.filter(kw =>
    mockTicket.keywords.includes(kw)
  );

  if (commonKeywords.length > 0) {
    const keywordSimilarity = commonKeywords.length / Math.max(ticketKeywords.length, mockTicket.keywords.length);
    score += keywordSimilarity * KEYWORD_WEIGHT;
  }

  // 3. Similarité du titre
  const titleWords = mockTicket.title.toLowerCase().split(/\s+/);
  const titleMatches = ticketKeywords.filter(kw =>
    titleWords.some(word => word.includes(kw) || kw.includes(word))
  );

  if (titleMatches.length > 0) {
    const titleSimilarity = titleMatches.length / ticketKeywords.length;
    score += titleSimilarity * TITLE_WEIGHT;
  }

  // Arrondir à 2 décimales
  return Math.round(score * 100) / 100;
}

export default {
  findSimilarTickets,
  fetchTicketDetails,
  explainSimilarity
};
