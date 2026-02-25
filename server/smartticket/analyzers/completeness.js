/**
 * Analyzer de Complétude - Étape 1 du Pipeline
 * Évalue si un ticket contient toutes les informations nécessaires
 */

/**
 * Évalue la complétude d'un ticket
 * @param {Object} ticket - Ticket à évaluer
 * @returns {Object} Résultat de l'évaluation avec score et décision
 */
export function evaluateCompleteness(ticket) {
  console.log(`[Completeness] Évaluation du ticket ${ticket.id}`);

  let score = 0;
  const missingElements = [];
  const detectedElements = [];

  // === Élément 1 : Description claire (30 pts) ===
  const descriptionScore = evaluateDescription(ticket.description);
  score += descriptionScore;

  if (descriptionScore === 30) {
    detectedElements.push('Description claire');
  } else if (descriptionScore > 0) {
    detectedElements.push('Description partielle');
    missingElements.push('Description claire complète');
  } else {
    missingElements.push('Description claire');
  }

  console.log(`[Completeness] Description: ${descriptionScore}/30 pts`);

  // === Élément 2 : Étapes de reproduction (25 pts) ===
  const stepsScore = evaluateReproductionSteps(ticket);
  score += stepsScore;

  if (stepsScore === 25) {
    detectedElements.push('Étapes de reproduction');
  } else {
    missingElements.push('Étapes de reproduction');
  }

  console.log(`[Completeness] Étapes de reproduction: ${stepsScore}/25 pts`);

  // === Élément 3 : Environnement (15 pts) ===
  const envScore = evaluateEnvironment(ticket);
  score += envScore;

  if (envScore === 15) {
    detectedElements.push('Environnement');
  } else {
    missingElements.push('Environnement');
  }

  console.log(`[Completeness] Environnement: ${envScore}/15 pts`);

  // === Élément 4 : Comportement attendu / Message d'erreur (15 pts) ===
  const expectedScore = evaluateExpectedBehavior(ticket);
  score += expectedScore;

  if (expectedScore === 15) {
    detectedElements.push('Comportement attendu');
  } else {
    missingElements.push('Comportement attendu / Message d\'erreur');
  }

  console.log(`[Completeness] Comportement attendu: ${expectedScore}/15 pts`);

  // === Élément 5 : Preuves (10 pts) ===
  const proofScore = evaluateProof(ticket);
  score += proofScore;

  if (proofScore === 10) {
    detectedElements.push('Preuve (capture)');
  } else {
    missingElements.push('Preuve (capture d\'écran)');
  }

  console.log(`[Completeness] Preuve: ${proofScore}/10 pts`);

  // === Score final et décision ===
  const result = makeDecision(score, missingElements, detectedElements);

  console.log(`[Completeness] Score final: ${score}/100 → Décision: ${result.decision}`);

  return result;
}

/**
 * Évalue la description (30 pts)
 */
function evaluateDescription(description) {
  if (!description || description.trim().length === 0) {
    return 0;
  }

  const text = description.trim().toLowerCase();
  const wordCount = text.split(/\s+/).length;

  // Vérifier mots inutiles
  const uselessWords = ['bonjour', 'svp', 'merci', 'salut', 'hello', 'urgent'];
  const isUseless = uselessWords.some(word => text === word || text.startsWith(word + ' ') && wordCount < 5);

  if (isUseless) {
    return 5; // Description trop courte/inutile
  }

  // Vérifier longueur
  if (wordCount < 20) {
    return 10; // Description trop courte
  }

  // Description acceptable
  if (wordCount >= 20 && wordCount < 50) {
    return 20; // Description moyenne
  }

  // Description complète
  return 30;
}

/**
 * Évalue les étapes de reproduction (25 pts)
 */
function evaluateReproductionSteps(ticket) {
  const fullText = `${ticket.title} ${ticket.description}`.toLowerCase();

  const stepKeywords = [
    'étapes',
    'steps',
    'reproduire',
    'reproduce',
    'scénario',
    'scenario',
    'comment reproduire',
    'how to reproduce',
    'marche à suivre',
    'procédure',
    'pour reproduire',
    'to reproduce'
  ];

  // Vérifier présence des mots-clés
  const hasStepKeyword = stepKeywords.some(keyword => fullText.includes(keyword));

  if (!hasStepKeyword) {
    return 0;
  }

  // Vérifier si c'est détaillé (présence de numéros ou listes)
  const hasNumbering = /\d+[\.\)]\s/.test(ticket.description || '');
  const hasBullets = /[-*•]\s/.test(ticket.description || '');

  if (hasNumbering || hasBullets) {
    return 25; // Étapes détaillées
  }

  return 15; // Étapes mentionnées mais pas détaillées
}

/**
 * Évalue l'environnement (15 pts)
 */
function evaluateEnvironment(ticket) {
  const fullText = `${ticket.title} ${ticket.description} ${ticket.environment || ''}`.toLowerCase();

  const envKeywords = [
    'prod',
    'production',
    'test',
    'recette',
    'préprod',
    'preprod',
    'développement',
    'dev',
    'staging',
    'environnement'
  ];

  const hasEnv = envKeywords.some(keyword => fullText.includes(keyword));

  return hasEnv ? 15 : 0;
}

/**
 * Évalue le comportement attendu / message d'erreur (15 pts)
 */
function evaluateExpectedBehavior(ticket) {
  const fullText = `${ticket.title} ${ticket.description}`.toLowerCase();

  const behaviorKeywords = [
    'attendu',
    'expected',
    'should',
    'devrait',
    'erreur',
    'error',
    'message d\'erreur',
    'error message',
    'résultat attendu',
    'comportement attendu',
    'expected behavior',
    'au lieu de',
    'instead of',
    'constaté'
  ];

  const hasBehavior = behaviorKeywords.some(keyword => fullText.includes(keyword));

  return hasBehavior ? 15 : 0;
}

/**
 * Évalue la présence de preuves (10 pts)
 */
function evaluateProof(ticket) {
  const fullText = `${ticket.title} ${ticket.description}`.toLowerCase();

  // Vérifier pièces jointes
  if (ticket.attachments && ticket.attachments.length > 0) {
    return 10;
  }

  // Vérifier mentions de captures
  const proofKeywords = [
    'voir capture',
    'capture d\'écran',
    'screenshot',
    'voir pièce jointe',
    'voir image',
    'cf capture',
    'voir fichier',
    'attached',
    'pj'
  ];

  const hasProofMention = proofKeywords.some(keyword => fullText.includes(keyword));

  return hasProofMention ? 10 : 0;
}

/**
 * Prend la décision selon le score
 */
function makeDecision(score, missingElements, detectedElements) {
  let level = '';
  let decision = '';
  let message = '';

  if (score < 55) {
    // 🔴 Ticket rejeté
    level = 'Rejected';
    decision = 'Rejected';
    message = '🔴 Désolé, je ne peux pas traiter ce ticket. Il manque des informations essentielles (description précise ou étapes de reproduction).';
  } else if (score < 80) {
    // 🟠 Ticket accepté mais incomplet
    level = 'Incomplete';
    decision = 'Accepted-Incomplete';
    message = '🟠 Ticket transmis, mais il manque des éléments tels qu\'une capture d\'écran ou l\'environnement. Cela aiderait le support.';
  } else {
    // 🟢 Ticket parfait
    level = 'Complete';
    decision = 'Accepted-Complete';
    message = '🟢 Ticket complet. Analyse avancée en cours.';
  }

  return {
    completenessScore: score,
    level: level,
    decision: decision,
    message: message,
    missingElements: missingElements,
    detectedElements: detectedElements,
    breakdown: {
      description: Math.min(30, score >= 30 ? 30 : Math.floor(score * 0.3)),
      reproductionSteps: score >= 55 ? 25 : 0,
      environment: score >= 70 ? 15 : 0,
      expectedBehavior: score >= 85 ? 15 : 0,
      proof: score >= 90 ? 10 : 0
    }
  };
}

export default {
  evaluateCompleteness
};
