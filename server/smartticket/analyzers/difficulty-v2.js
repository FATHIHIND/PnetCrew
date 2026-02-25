/**
 * Analyzer de Difficulté V2 - Système Réaliste PeopleNet
 * Calcule un score de difficulté sur 5 basé sur 6 critères professionnels
 */

/**
 * Configuration des modules PeopleNet
 */
const PEOPLENET_MODULES = [
  'Paie',
  'Absence',
  'Planning',
  'RH',
  'Contrat',
  'Règlements',
  'Formation',
  'Temps',
  'Recrutement',
  'Entretien',
  'Compétences'
];

/**
 * Mots-clés de risque fonctionnel
 */
const RISK_KEYWORDS = [
  'régression',
  'incohérence',
  'multi-client',
  'erreur paie',
  'calendrier',
  'salaire faux',
  'impact client',
  'blocage',
  'corruption',
  'perte de données',
  'calcul incorrect',
  'doublon',
  'non-conformité',
  'DSN',
  'URSSAF',
  'depuis mise à jour',
  'fonctionnait avant',
  'tous les clients',
  'généralisé',
  'crash',
  'timeout',
  'performance'
];

/**
 * Mots-clés de scénario
 */
const SCENARIO_KEYWORDS = [
  'étapes',
  'reproduire',
  'scénario',
  'steps to reproduce',
  'comment reproduire',
  'marche à suivre',
  'procédure',
  'manipulation',
  'test case'
];

/**
 * Analyse la difficulté d'un ticket avec système de scoring réaliste
 * @param {Object} ticket - Ticket à analyser
 * @returns {Object} Analyse complète avec score et critères
 */
export function analyzeTicketDifficulty(ticket) {
  console.log(`[DifficultyV2] Analyse du ticket ${ticket.id}`);

  const criteria = {
    modules: 0,
    riskWords: [],
    missingScenario: false,
    descriptionSize: 0,
    commentsCount: 0,
    reopened: 0
  };

  let rawScore = 0;

  // === Critère 1 : Modules PeopleNet impactés ===
  const modules = detectModules(ticket);
  criteria.modules = modules.length;

  if (modules.length === 2) {
    rawScore += 1;
  } else if (modules.length >= 3) {
    rawScore += 2;
  }

  console.log(`[DifficultyV2] Critère 1 - Modules: ${modules.length} modules → +${modules.length >= 3 ? 2 : modules.length === 2 ? 1 : 0}`);

  // === Critère 2 : Mots-clés de risque fonctionnel ===
  const riskWords = detectRiskKeywords(ticket);
  criteria.riskWords = riskWords;

  if (riskWords.length === 1) {
    rawScore += 1;
  } else if (riskWords.length >= 2) {
    rawScore += 2;
  }

  console.log(`[DifficultyV2] Critère 2 - Risques: ${riskWords.length} mots-clés → +${riskWords.length >= 2 ? 2 : riskWords.length === 1 ? 1 : 0}`);

  // === Critère 3 : Qualité du scénario ===
  const scenarioQuality = analyzeScenarioQuality(ticket);
  criteria.missingScenario = scenarioQuality === 'missing';

  if (scenarioQuality === 'partial') {
    rawScore += 1;
  } else if (scenarioQuality === 'missing') {
    rawScore += 2;
  }

  console.log(`[DifficultyV2] Critère 3 - Scénario: ${scenarioQuality} → +${scenarioQuality === 'missing' ? 2 : scenarioQuality === 'partial' ? 1 : 0}`);

  // === Critère 4 : Longueur description ===
  const descLength = (ticket.description || '').length;
  criteria.descriptionSize = descLength;

  if (descLength >= 300 && descLength < 1000) {
    rawScore += 1;
  } else if (descLength >= 1000) {
    rawScore += 2;
  }

  console.log(`[DifficultyV2] Critère 4 - Description: ${descLength} chars → +${descLength >= 1000 ? 2 : descLength >= 300 ? 1 : 0}`);

  // === Critère 5 : Nombre de commentaires ===
  const commentsCount = (ticket.comments || []).length;
  criteria.commentsCount = commentsCount;

  if (commentsCount >= 2 && commentsCount <= 4) {
    rawScore += 1;
  } else if (commentsCount >= 5) {
    rawScore += 2;
  }

  console.log(`[DifficultyV2] Critère 5 - Commentaires: ${commentsCount} → +${commentsCount >= 5 ? 2 : commentsCount >= 2 ? 1 : 0}`);

  // === Critère 6 : Ticket réouvert ===
  const reopenCount = countReopens(ticket);
  criteria.reopened = reopenCount;

  if (reopenCount === 1) {
    rawScore += 1;
  } else if (reopenCount >= 2) {
    rawScore += 2;
  }

  console.log(`[DifficultyV2] Critère 6 - Réouvertures: ${reopenCount} fois → +${reopenCount >= 2 ? 2 : reopenCount === 1 ? 1 : 0}`);

  // === Score final sur 5 ===
  const finalScore = calculateFinalScore(rawScore);
  const level = getDifficultyLevel(finalScore);

  console.log(`[DifficultyV2] Score brut: ${rawScore} → Score final: ${finalScore}/5 (${level})`);

  // === Détails du score (nouveau) ===
  const scoreDetails = generateScoreDetails(criteria, modules, riskWords);

  // === Risques détectés ===
  const risks = generateRisks(modules, riskWords, criteria);

  // === Résumé et recommandation ===
  const summary = generateSummary(ticket, modules, finalScore, criteria);
  const recommendation = generateRecommendation(criteria, modules, riskWords);

  return {
    ticketId: ticket.id,
    difficultyScore: finalScore,
    difficultyLevel: level,
    rawScore: rawScore,
    criteria: criteria,
    scoreDetails: scoreDetails,
    modules: modules,
    risks: risks,
    summary: summary,
    recommendation: recommendation
  };
}

/**
 * Détecte les modules PeopleNet mentionnés dans le ticket
 */
function detectModules(ticket) {
  const modules = new Set();
  const fullText = `${ticket.title} ${ticket.description} ${ticket.category || ''}`.toLowerCase();

  PEOPLENET_MODULES.forEach(module => {
    if (fullText.includes(module.toLowerCase())) {
      modules.add(module);
    }
  });

  // Détection par mots-clés associés
  const moduleKeywords = {
    'Paie': ['salaire', 'bulletin', 'cotisation', 'net à payer', 'brut'],
    'Absence': ['congé', 'cp', 'rtt', 'maladie', 'absence'],
    'Planning': ['horaire', 'shift', 'rotation', 'calendrier', 'créneau'],
    'RH': ['employé', 'salarié', 'collaborateur', 'dossier'],
    'Contrat': ['embauche', 'démission', 'fin de contrat', 'cdi', 'cdd']
  };

  Object.entries(moduleKeywords).forEach(([module, keywords]) => {
    keywords.forEach(keyword => {
      if (fullText.includes(keyword)) {
        modules.add(module);
      }
    });
  });

  return Array.from(modules);
}

/**
 * Détecte les mots-clés de risque
 */
function detectRiskKeywords(ticket) {
  const foundKeywords = new Set();
  const fullText = `${ticket.title} ${ticket.description} ${(ticket.comments || []).map(c => c.text).join(' ')}`.toLowerCase();

  RISK_KEYWORDS.forEach(keyword => {
    if (fullText.includes(keyword.toLowerCase())) {
      foundKeywords.add(keyword);
    }
  });

  return Array.from(foundKeywords);
}

/**
 * Analyse la qualité du scénario de reproduction
 * @returns {string} 'clear', 'partial', ou 'missing'
 */
function analyzeScenarioQuality(ticket) {
  const fullText = `${ticket.title} ${ticket.description}`.toLowerCase();

  // Vérifier présence de mots-clés de scénario
  const hasScenarioKeywords = SCENARIO_KEYWORDS.some(keyword =>
    fullText.includes(keyword.toLowerCase())
  );

  if (!hasScenarioKeywords) {
    return 'missing';
  }

  // Si scénario présent mais description courte, probablement partiel
  if ((ticket.description || '').length < 200) {
    return 'partial';
  }

  return 'clear';
}

/**
 * Compte le nombre de réouvertures
 */
function countReopens(ticket) {
  if (!ticket.history || !Array.isArray(ticket.history)) {
    return 0;
  }

  let count = 0;
  ticket.history.forEach(entry => {
    if (entry.field === 'status' &&
        (entry.new_value === 'reopened' || entry.new_value === 'réouvert')) {
      count++;
    }
  });

  return count;
}

/**
 * Convertit le score brut en score final sur 5
 */
function calculateFinalScore(rawScore) {
  if (rawScore <= 2) return 1;
  if (rawScore <= 4) return 2;
  if (rawScore <= 6) return 3;
  if (rawScore <= 8) return 4;
  return 5;
}

/**
 * Obtient le niveau de difficulté en texte
 */
function getDifficultyLevel(finalScore) {
  if (finalScore <= 2) return 'Faible';
  if (finalScore === 3) return 'Moyenne';
  return 'Élevée';
}

/**
 * Génère la liste des risques
 */
function generateRisks(modules, riskWords, criteria) {
  const risks = [];

  // Risque multi-modules
  if (modules.length >= 2) {
    risks.push(`Cross-module (${modules.length} modules impactés)`);
  }

  // Risque scénario manquant
  if (criteria.missingScenario) {
    risks.push('Scénario de reproduction manquant');
  } else if (criteria.missingScenario === false && criteria.descriptionSize < 200) {
    risks.push('Description insuffisante');
  }

  // Risques fonctionnels détectés
  if (riskWords.includes('régression')) {
    risks.push('Régression fonctionnelle');
  }
  if (riskWords.includes('multi-client') || riskWords.includes('tous les clients')) {
    risks.push('Impact multi-clients');
  }
  if (riskWords.includes('erreur paie') || riskWords.includes('salaire faux') || riskWords.includes('calcul incorrect')) {
    risks.push('Impact financier');
  }
  if (riskWords.includes('corruption') || riskWords.includes('perte de données')) {
    risks.push('Risque d\'intégrité des données');
  }
  if (riskWords.includes('blocage')) {
    risks.push('Blocage fonctionnel');
  }

  // Risque réouverture
  if (criteria.reopened >= 2) {
    risks.push(`Ticket réouvert ${criteria.reopened} fois`);
  }

  // Risque complexité (nombreux commentaires)
  if (criteria.commentsCount >= 5) {
    risks.push('Nombreux échanges (ticket complexe)');
  }

  return risks;
}

/**
 * Génère le résumé du ticket
 */
function generateSummary(ticket, modules, finalScore, criteria) {
  const levelText = getDifficultyLevel(finalScore);
  const modulesText = modules.length > 0 ? modules.join(' & ') : 'Module non identifié';

  let summary = `Ticket #${ticket.id} - Difficulté ${levelText} (${finalScore}/5). `;

  if (modules.length >= 2) {
    summary += `Complexité ${modulesText} avec interactions entre modules. `;
  } else if (modules.length === 1) {
    summary += `Module ${modulesText}. `;
  }

  if (criteria.riskWords.length > 0) {
    summary += `Risques détectés : ${criteria.riskWords.slice(0, 3).join(', ')}. `;
  }

  if (criteria.reopened > 0) {
    summary += `Ticket réouvert ${criteria.reopened} fois. `;
  }

  return summary.trim();
}

/**
 * Génère le détail du score par critère (NOUVEAU)
 */
function generateScoreDetails(criteria, modules, riskWords) {
  const details = [];

  // Critère 1 : Modules impactés
  if (modules.length >= 2) {
    const impact = modules.length === 2 ? 1 : 2;
    details.push({
      criterion: 'Modules impactés',
      value: modules.length,
      impact: impact,
      description: `${modules.length} modules détectés`
    });
  }

  // Critère 2 : Mots-clés de risque
  if (riskWords.length > 0) {
    const impact = riskWords.length === 1 ? 1 : 2;
    details.push({
      criterion: 'Mots-clés de risque',
      value: riskWords,
      impact: impact,
      description: riskWords.join(', ')
    });
  }

  // Critère 3 : Scénario manquant
  if (criteria.missingScenario) {
    details.push({
      criterion: 'Scénario manquant',
      value: true,
      impact: 2,
      description: 'Aucun scénario de reproduction fourni'
    });
  } else if (criteria.descriptionSize < 200) {
    details.push({
      criterion: 'Scénario partiel',
      value: true,
      impact: 1,
      description: 'Scénario peu détaillé'
    });
  }

  // Critère 4 : Longueur description
  if (criteria.descriptionSize >= 1000) {
    details.push({
      criterion: 'Description longue',
      value: criteria.descriptionSize,
      impact: 2,
      description: `${criteria.descriptionSize} caractères`
    });
  } else if (criteria.descriptionSize >= 300) {
    details.push({
      criterion: 'Description détaillée',
      value: criteria.descriptionSize,
      impact: 1,
      description: `${criteria.descriptionSize} caractères`
    });
  }

  // Critère 5 : Nombre de commentaires
  if (criteria.commentsCount >= 5) {
    details.push({
      criterion: 'Nombreux commentaires',
      value: criteria.commentsCount,
      impact: 2,
      description: `${criteria.commentsCount} échanges`
    });
  } else if (criteria.commentsCount >= 2) {
    details.push({
      criterion: 'Commentaires multiples',
      value: criteria.commentsCount,
      impact: 1,
      description: `${criteria.commentsCount} échanges`
    });
  }

  // Critère 6 : Ticket réouvert
  if (criteria.reopened >= 2) {
    details.push({
      criterion: 'Ticket réouvert',
      value: criteria.reopened,
      impact: 2,
      description: `Réouvert ${criteria.reopened} fois`
    });
  } else if (criteria.reopened === 1) {
    details.push({
      criterion: 'Ticket réouvert',
      value: criteria.reopened,
      impact: 1,
      description: 'Réouvert 1 fois'
    });
  }

  return details;
}

/**
 * Génère les recommandations d'action (AMÉLIORÉ)
 */
function generateRecommendation(criteria, modules, riskWords) {
  const recommendations = [];

  // === Scénario manquant ===
  if (criteria.missingScenario) {
    recommendations.push('Demander un scénario de reproduction détaillé au client');
  }

  // === Multi-modules ===
  if (modules.length >= 3) {
    recommendations.push(`Vérifier les interactions entre ${modules.slice(0, 3).join(', ')}`);
    recommendations.push('Tester une paie de contrôle pour valider la cohérence');
  } else if (modules.length === 2) {
    recommendations.push(`Vérifier la cohérence ${modules[0]}/${modules[1]}`);
  }

  // === Risques fonctionnels spécifiques ===
  if (riskWords.includes('régression')) {
    recommendations.push('Identifier la version où la régression est apparue et comparer le code');
  }
  if (riskWords.includes('multi-client') || riskWords.includes('tous les clients') || riskWords.includes('généralisé')) {
    recommendations.push('Estimer le nombre de clients impactés et prioriser en conséquence');
  }
  if (riskWords.includes('erreur paie') || riskWords.includes('salaire faux') || riskWords.includes('calcul incorrect')) {
    recommendations.push('⚠️ Contacter l\'expert paie et vérifier l\'impact financier');
  }
  if (riskWords.includes('corruption') || riskWords.includes('perte de données')) {
    recommendations.push('⚠️ CRITIQUE : Vérifier l\'intégrité de la base de données et restaurer backup si nécessaire');
  }
  if (riskWords.includes('blocage')) {
    recommendations.push('Débloquer le client en priorité avec un workaround si possible');
  }

  // === Réouvertures ===
  if (criteria.reopened >= 2) {
    recommendations.push('Analyser pourquoi le ticket a été réouvert plusieurs fois (correctif incomplet ?)');
    recommendations.push('Impliquer un expert senior pour résolution définitive');
  } else if (criteria.reopened === 1) {
    recommendations.push('Vérifier que le correctif couvre tous les cas d\'usage');
  }

  // === Complexité (nombreux commentaires) ===
  if (criteria.commentsCount >= 5) {
    recommendations.push('Consolider les informations dispersées dans les commentaires');
  }

  // === Recommandation par défaut ===
  if (recommendations.length === 0) {
    recommendations.push('Reproduire le problème en environnement de test');
  }

  return recommendations.join('. ');
}

export default {
  analyzeTicketDifficulty
};
