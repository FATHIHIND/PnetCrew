/**
 * Analyseur de Risques Fonctionnels
 * Détecte les risques métier et techniques
 */

import {
  RISK_PATTERNS,
  EXPERT_TRIGGERS,
  MISSING_INFO_PATTERNS,
  FUNCTIONAL_AREAS
} from '../config/rules.js';

export class RiskAnalyzer {
  /**
   * Détecte les risques fonctionnels d'un ticket
   * @param {Object} ticket - Ticket normalisé
   * @returns {Object} { level, risks, dependencies, experts, missingInfo }
   */
  analyze(ticket) {
    const fullText = `${ticket.title} ${ticket.description}`.toLowerCase();
    const risks = [];
    const experts = [];
    const missingInfo = [];
    const dependencies = [];

    // 1. Détecter les risques par pattern
    for (const [riskType, patterns] of Object.entries(RISK_PATTERNS)) {
      const matches = patterns.filter(pattern =>
        fullText.includes(pattern.toLowerCase())
      );

      if (matches.length > 0) {
        risks.push({
          type: riskType.toLowerCase(),
          severity: this.getRiskSeverity(riskType),
          keywords: matches,
          description: this.getRiskDescription(riskType)
        });
      }
    }

    // 2. Détecter les experts nécessaires
    for (const [expertType, triggers] of Object.entries(EXPERT_TRIGGERS)) {
      const matches = triggers.filter(trigger =>
        fullText.includes(trigger.toLowerCase())
      );

      if (matches.length > 0) {
        experts.push({
          type: expertType.toLowerCase(),
          reason: matches[0],
          urgency: risks.some(r => r.severity === 'high') ? 'high' : 'medium'
        });
      }
    }

    // 3. Détecter les informations manquantes
    for (const pattern of MISSING_INFO_PATTERNS) {
      if (pattern.pattern && pattern.pattern.test(fullText)) {
        if (pattern.missing) {
          missingInfo.push({
            type: pattern.type,
            message: pattern.message,
            priority: 'high'
          });
        }
      }
    }

    // Vérifier si le scénario de reproduction est fourni
    if (!fullText.match(/étapes|reproduire|scénario|comment faire/i)) {
      missingInfo.push({
        type: 'scenario',
        message: 'Scénario de reproduction non fourni',
        priority: 'high'
      });
    }

    // Vérifier si des captures sont mentionnées
    if (!fullText.match(/capture|screenshot|image|pièce jointe/i) &&
        (!ticket.attachments || ticket.attachments.length === 0)) {
      missingInfo.push({
        type: 'screenshot',
        message: 'Aucune capture d\'écran fournie',
        priority: 'medium'
      });
    }

    // 4. Détecter les dépendances entre modules
    dependencies.push(...this.detectModuleDependencies(ticket));

    // 5. Calculer le niveau de risque global
    const riskLevel = this.calculateOverallRiskLevel(risks, experts, missingInfo);

    return {
      level: riskLevel,
      risks: risks,
      dependencies: dependencies,
      expertsNeeded: experts,
      missingInformation: missingInfo,
      recommendations: this.generateRecommendations(risks, experts, missingInfo)
    };
  }

  /**
   * Détermine la sévérité d'un type de risque
   */
  getRiskSeverity(riskType) {
    const severityMapping = {
      DATA_INTEGRITY: 'critical',
      FINANCIAL_IMPACT: 'critical',
      LEGAL_COMPLIANCE: 'critical',
      MULTI_CLIENT: 'high',
      REGRESSION: 'high'
    };

    return severityMapping[riskType] || 'medium';
  }

  /**
   * Description du risque
   */
  getRiskDescription(riskType) {
    const descriptions = {
      DATA_INTEGRITY: 'Risque d\'intégrité des données',
      FINANCIAL_IMPACT: 'Impact financier pour le client',
      LEGAL_COMPLIANCE: 'Risque de non-conformité légale',
      MULTI_CLIENT: 'Plusieurs clients affectés',
      REGRESSION: 'Régression fonctionnelle'
    };

    return descriptions[riskType] || 'Risque fonctionnel';
  }

  /**
   * Détecte les dépendances entre modules
   */
  detectModuleDependencies(ticket) {
    const fullText = `${ticket.title} ${ticket.description}`.toLowerCase();
    const detectedModules = [];

    for (const [areaName, areaConfig] of Object.entries(FUNCTIONAL_AREAS)) {
      const matches = areaConfig.keywords.filter(kw =>
        fullText.includes(kw.toLowerCase())
      ).length;

      if (matches > 0) {
        detectedModules.push({
          area: areaName.toLowerCase(),
          modules: areaConfig.modules,
          confidence: matches > 2 ? 'high' : 'medium'
        });
      }
    }

    // Si plusieurs modules détectés, c'est une dépendance
    if (detectedModules.length > 1) {
      return [{
        type: 'multi_module',
        modules: detectedModules.map(d => d.area),
        description: `Interaction entre ${detectedModules.map(d => d.area).join(', ')}`,
        impact: 'high'
      }];
    }

    return [];
  }

  /**
   * Calcule le niveau de risque global
   */
  calculateOverallRiskLevel(risks, experts, missingInfo) {
    // Compter les risques critiques
    const criticalRisks = risks.filter(r => r.severity === 'critical').length;
    const highRisks = risks.filter(r => r.severity === 'high').length;

    if (criticalRisks >= 2) return 'critical';
    if (criticalRisks >= 1 || highRisks >= 2) return 'high';
    if (highRisks >= 1 || experts.length >= 2) return 'medium';
    if (missingInfo.length >= 3) return 'medium';

    return 'low';
  }

  /**
   * Génère des recommandations
   */
  generateRecommendations(risks, experts, missingInfo) {
    const recommendations = [];

    if (missingInfo.length > 0) {
      const highPriorityMissing = missingInfo.filter(i => i.priority === 'high');
      if (highPriorityMissing.length > 0) {
        recommendations.push({
          action: 'request_information',
          priority: 'immediate',
          message: `Demander au client : ${highPriorityMissing.map(i => i.message).join(', ')}`
        });
      }
    }

    if (experts.length > 0) {
      const urgentExperts = experts.filter(e => e.urgency === 'high');
      if (urgentExperts.length > 0) {
        recommendations.push({
          action: 'contact_expert',
          priority: 'immediate',
          message: `Contacter immédiatement l'expert : ${urgentExperts.map(e => e.type).join(', ')}`
        });
      }
    }

    const criticalRisks = risks.filter(r => r.severity === 'critical');
    if (criticalRisks.length > 0) {
      recommendations.push({
        action: 'escalate',
        priority: 'immediate',
        message: 'Escalader au support L3 - risques critiques identifiés'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        action: 'standard_process',
        priority: 'normal',
        message: 'Suivre le processus standard de traitement'
      });
    }

    return recommendations;
  }
}

export default RiskAnalyzer;
