/**
 * Analyseur de Difficulté de Ticket
 * Calcule un score de difficulté de 1 à 5
 */

import {
  COMPLEXITY_SIGNALS,
  FUNCTIONAL_AREAS,
  DIFFICULTY_THRESHOLDS,
  PRIORITY_WEIGHTS
} from '../config/rules.js';

export class DifficultyAnalyzer {
  /**
   * Analyse la difficulté d'un ticket
   * @param {Object} ticket - Ticket normalisé
   * @returns {Object} { score, level, factors, details }
   */
  analyze(ticket) {
    const factors = {
      baseScore: 1.0,
      lengthFactor: 0,
      complexityKeywords: 0,
      commentsCount: 0,
      historyComplexity: 0,
      functionalAreaMultiplier: 1.0,
      priorityWeight: 1.0,
      ageFactor: 0
    };

    // 1. Analyser la longueur de la description
    factors.lengthFactor = this.analyzeLengthComplexity(ticket.description);

    // 2. Détecter les mots-clés de complexité
    factors.complexityKeywords = this.detectComplexityKeywords(ticket);

    // 3. Analyser le nombre de commentaires
    factors.commentsCount = this.analyzeCommentsComplexity(ticket.comments);

    // 4. Analyser l'historique (réouvertures, changements)
    factors.historyComplexity = this.analyzeHistoryComplexity(ticket.history);

    // 5. Multiplicateur selon le domaine fonctionnel
    factors.functionalAreaMultiplier = this.getFunctionalAreaMultiplier(ticket);

    // 6. Poids selon la priorité
    factors.priorityWeight = PRIORITY_WEIGHTS[ticket.priority] || 1.0;

    // 7. Facteur d'âge du ticket
    factors.ageFactor = this.analyzeAgeFactor(ticket.created_at);

    // Calcul du score final
    const rawScore = factors.baseScore
      + factors.lengthFactor
      + factors.complexityKeywords
      + factors.commentsCount
      + factors.historyComplexity
      + factors.ageFactor;

    const finalScore = Math.min(5, Math.max(1,
      rawScore * factors.functionalAreaMultiplier * factors.priorityWeight
    ));

    // Arrondir au 0.5 près
    const roundedScore = Math.round(finalScore * 2) / 2;

    return {
      score: roundedScore,
      level: this.getLevel(roundedScore),
      factors: factors,
      details: this.generateDetails(factors, roundedScore)
    };
  }

  /**
   * Analyse la complexité liée à la longueur
   */
  analyzeLengthComplexity(description) {
    if (!description) return -0.5; // Pas de description = manque d'info

    const wordCount = description.split(/\s+/).length;

    if (wordCount > DIFFICULTY_THRESHOLDS.DESCRIPTION_LENGTH.VERY_LONG) {
      return 1.0; // Ticket très détaillé = complexe
    } else if (wordCount > DIFFICULTY_THRESHOLDS.DESCRIPTION_LENGTH.LONG) {
      return 0.5;
    } else if (wordCount < DIFFICULTY_THRESHOLDS.DESCRIPTION_LENGTH.SHORT) {
      return -0.5; // Trop court = manque de contexte
    }

    return 0;
  }

  /**
   * Détecte les mots-clés de complexité
   */
  detectComplexityKeywords(ticket) {
    const fullText = `${ticket.title} ${ticket.description}`.toLowerCase();
    let score = 0;

    // Mots-clés haute complexité
    const highCount = COMPLEXITY_SIGNALS.HIGH_COMPLEXITY.filter(keyword =>
      fullText.includes(keyword.toLowerCase())
    ).length;
    score += highCount * 0.5;

    // Mots-clés complexité moyenne
    const mediumCount = COMPLEXITY_SIGNALS.MEDIUM_COMPLEXITY.filter(keyword =>
      fullText.includes(keyword.toLowerCase())
    ).length;
    score += mediumCount * 0.3;

    // Mots-clés faible complexité (réduit le score)
    const lowCount = COMPLEXITY_SIGNALS.LOW_COMPLEXITY.filter(keyword =>
      fullText.includes(keyword.toLowerCase())
    ).length;
    if (lowCount > 0 && highCount === 0) {
      score -= 0.5; // Probablement un ticket cosmétique
    }

    return Math.min(2.0, score); // Cap à +2
  }

  /**
   * Analyse la complexité via les commentaires
   */
  analyzeCommentsComplexity(comments) {
    if (!comments || comments.length === 0) return 0;

    const count = comments.length;

    if (count > DIFFICULTY_THRESHOLDS.COMMENTS_COUNT.MANY) {
      return 1.0; // Beaucoup d'échanges = complexe
    } else if (count > DIFFICULTY_THRESHOLDS.COMMENTS_COUNT.MODERATE) {
      return 0.5;
    }

    return 0;
  }

  /**
   * Analyse la complexité via l'historique
   */
  analyzeHistoryComplexity(history) {
    if (!history || history.length === 0) return 0;

    let score = 0;

    // Compter les réouvertures
    const reopenings = history.filter(h =>
      h.field === 'status' &&
      h.old_value && h.old_value.match(/closed|resolved/i) &&
      h.new_value && h.new_value.match(/open|reopened/i)
    ).length;

    if (reopenings >= DIFFICULTY_THRESHOLDS.REOPENINGS.MULTIPLE) {
      score += 2.0; // Plusieurs réouvertures = très problématique
    } else if (reopenings >= DIFFICULTY_THRESHOLDS.REOPENINGS.ONCE) {
      score += 0.5;
    }

    // Changements de priorité vers le haut = complexité
    const priorityIncreases = history.filter(h =>
      h.field === 'priority' &&
      this.isPriorityIncrease(h.old_value, h.new_value)
    ).length;

    score += priorityIncreases * 0.3;

    return Math.min(2.5, score);
  }

  /**
   * Détermine le multiplicateur selon le domaine fonctionnel
   */
  getFunctionalAreaMultiplier(ticket) {
    const fullText = `${ticket.title} ${ticket.description} ${ticket.category}`.toLowerCase();
    let maxMultiplier = 1.0;
    let matchedAreas = [];

    for (const [areaName, areaConfig] of Object.entries(FUNCTIONAL_AREAS)) {
      const matches = areaConfig.keywords.filter(keyword =>
        fullText.includes(keyword.toLowerCase())
      ).length;

      if (matches > 0) {
        matchedAreas.push(areaName);
        maxMultiplier = Math.max(maxMultiplier, areaConfig.complexity_multiplier);
      }
    }

    // Si plusieurs domaines fonctionnels = multiplicateur MULTI_MODULE
    if (matchedAreas.length > 2) {
      return FUNCTIONAL_AREAS.MULTI_MODULE.complexity_multiplier;
    }

    return maxMultiplier;
  }

  /**
   * Analyse le facteur d'âge
   */
  analyzeAgeFactor(createdAt) {
    if (!createdAt) return 0;

    const ageInDays = (Date.now() - new Date(createdAt)) / (1000 * 60 * 60 * 24);

    if (ageInDays > DIFFICULTY_THRESHOLDS.AGE_DAYS.VERY_OLD) {
      return 1.0; // Ticket très ancien = bloqué/complexe
    } else if (ageInDays > DIFFICULTY_THRESHOLDS.AGE_DAYS.OLD) {
      return 0.5;
    }

    return 0;
  }

  /**
   * Vérifie si une priorité a augmenté
   */
  isPriorityIncrease(oldValue, newValue) {
    const priorityOrder = { 'low': 1, 'normal': 2, 'high': 3, 'urgent': 4 };
    const oldPriority = priorityOrder[oldValue?.toLowerCase()] || 2;
    const newPriority = priorityOrder[newValue?.toLowerCase()] || 2;
    return newPriority > oldPriority;
  }

  /**
   * Détermine le niveau de difficulté
   */
  getLevel(score) {
    if (score >= 4.5) return 'critical';
    if (score >= 3.5) return 'very_high';
    if (score >= 2.5) return 'high';
    if (score >= 1.5) return 'medium';
    return 'low';
  }

  /**
   * Génère des détails explicatifs
   */
  generateDetails(factors, finalScore) {
    const details = [];

    if (factors.complexityKeywords > 0.5) {
      details.push('Mots-clés de haute complexité détectés');
    }

    if (factors.commentsCount >= 1.0) {
      details.push('Nombreux échanges (>10 commentaires)');
    }

    if (factors.historyComplexity >= 2.0) {
      details.push('Plusieurs réouvertures du ticket');
    }

    if (factors.ageFactor >= 1.0) {
      details.push('Ticket ancien (>30 jours)');
    }

    if (factors.functionalAreaMultiplier >= 1.5) {
      details.push('Touche plusieurs modules fonctionnels');
    }

    if (factors.lengthFactor < 0) {
      details.push('Description courte, informations possiblement manquantes');
    }

    if (details.length === 0) {
      details.push('Ticket de complexité standard');
    }

    return details;
  }
}

export default DifficultyAnalyzer;
