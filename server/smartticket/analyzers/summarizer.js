/**
 * Générateur de Résumés Intelligents
 * Avec support optionnel Azure OpenAI
 */

import { summarize } from '../../azure/summarize.js';

export class TicketSummarizer {
  constructor(useAI = false) {
    this.useAI = useAI && process.env.AZURE_OPENAI_API_KEY;
  }

  /**
   * Génère un résumé intelligent du ticket
   * @param {Object} ticket - Ticket normalisé
   * @param {Object} difficultyAnalysis - Résultat de l'analyse de difficulté
   * @param {Object} riskAnalysis - Résultat de l'analyse de risque
   * @returns {Promise<Object>} { summary, suggestedAction, keyPoints }
   */
  async generate(ticket, difficultyAnalysis, riskAnalysis) {
    if (this.useAI) {
      return await this.generateWithAI(ticket, difficultyAnalysis, riskAnalysis);
    } else {
      return this.generateHeuristic(ticket, difficultyAnalysis, riskAnalysis);
    }
  }

  /**
   * Génération heuristique (sans IA)
   */
  generateHeuristic(ticket, difficultyAnalysis, riskAnalysis) {
    const keyPoints = [];

    // 1. Point principal du ticket
    keyPoints.push(this.extractMainPoint(ticket));

    // 2. Points de complexité
    if (difficultyAnalysis.score >= 3) {
      keyPoints.push(`Complexité ${difficultyAnalysis.level} (score ${difficultyAnalysis.score}/5)`);
    }

    // 3. Risques identifiés
    if (riskAnalysis.risks.length > 0) {
      const riskSummary = riskAnalysis.risks
        .slice(0, 2) // Garder les 2 principaux
        .map(r => r.description)
        .join(', ');
      keyPoints.push(`Risques : ${riskSummary}`);
    }

    // 4. Experts nécessaires
    if (riskAnalysis.expertsNeeded.length > 0) {
      const experts = riskAnalysis.expertsNeeded.map(e => e.type).join(', ');
      keyPoints.push(`Experts requis : ${experts}`);
    }

    // 5. Informations manquantes
    if (riskAnalysis.missingInformation.length > 0) {
      const missing = riskAnalysis.missingInformation.map(i => i.message).join(', ');
      keyPoints.push(`Info manquante : ${missing}`);
    }

    // Construire le résumé final
    const summary = this.buildSummaryText(ticket, keyPoints);

    // Action suggérée
    const suggestedAction = this.determineSuggestedAction(
      ticket,
      difficultyAnalysis,
      riskAnalysis
    );

    return {
      summary: summary,
      keyPoints: keyPoints,
      suggestedAction: suggestedAction,
      generatedBy: 'heuristic'
    };
  }

  /**
   * Génération avec Azure OpenAI (optionnel)
   */
  async generateWithAI(ticket, difficultyAnalysis, riskAnalysis) {
    try {
      console.log('[Summarizer] Génération avec Azure OpenAI');

      const context = `
Ticket #${ticket.id} - ${ticket.title}

Description:
${ticket.description}

Analyse:
- Difficulté: ${difficultyAnalysis.score}/5 (${difficultyAnalysis.level})
- Risques: ${riskAnalysis.level}
- ${riskAnalysis.risks.length} risques identifiés
- ${riskAnalysis.missingInformation.length} informations manquantes

Commentaires: ${ticket.comments.length}
`;

      const result = await summarize({
        key: `ticket_${ticket.id}`,
        text: context,
        isAutoSummary: true
      });

      return {
        summary: result.summary,
        keyPoints: result.checklist || [],
        suggestedAction: result.common_errors?.[0] || this.determineSuggestedAction(ticket, difficultyAnalysis, riskAnalysis),
        generatedBy: 'azure_openai'
      };

    } catch (error) {
      console.error('[Summarizer] Erreur Azure OpenAI, fallback heuristique:', error.message);
      return this.generateHeuristic(ticket, difficultyAnalysis, riskAnalysis);
    }
  }

  /**
   * Extrait le point principal du ticket
   */
  extractMainPoint(ticket) {
    const title = ticket.title;
    const category = ticket.category;

    // Chercher le verbe d'action dans le titre
    const actionVerbs = ['impossible', 'ne fonctionne pas', 'erreur', 'problème', 'bug', 'régression'];
    const hasAction = actionVerbs.some(verb => title.toLowerCase().includes(verb));

    if (hasAction) {
      return `[${category}] ${title}`;
    } else {
      return `Problème ${category} : ${title}`;
    }
  }

  /**
   * Construit le texte du résumé
   */
  buildSummaryText(ticket, keyPoints) {
    const parts = [];

    // Intro
    parts.push(`Ticket #${ticket.id} (${ticket.source}) - Priorité ${ticket.priority}`);

    // Description synthétique
    const shortDesc = this.shortenDescription(ticket.description, 150);
    parts.push(shortDesc);

    // Points clés
    if (keyPoints.length > 0) {
      parts.push('\nPoints clés:');
      keyPoints.forEach((point, index) => {
        parts.push(`${index + 1}. ${point}`);
      });
    }

    // Statut
    parts.push(`\nStatut: ${ticket.status} | Assigné: ${ticket.assigned_to || 'Non assigné'}`);

    return parts.join('\n');
  }

  /**
   * Raccourcit une description
   */
  shortenDescription(description, maxLength) {
    if (!description) return 'Pas de description fournie';

    const cleaned = description
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleaned.length <= maxLength) return cleaned;

    return cleaned.substring(0, maxLength) + '...';
  }

  /**
   * Détermine l'action suggérée
   */
  determineSuggestedAction(ticket, difficultyAnalysis, riskAnalysis) {
    const actions = [];

    // 1. Informations manquantes = priorité absolue
    if (riskAnalysis.missingInformation.length > 0) {
      const highPriority = riskAnalysis.missingInformation.filter(i => i.priority === 'high');
      if (highPriority.length > 0) {
        return `URGENT: Demander au client ${highPriority.map(i => i.message.toLowerCase()).join(' et ')}`;
      }
    }

    // 2. Risques critiques = escalader
    const criticalRisks = riskAnalysis.risks.filter(r => r.severity === 'critical');
    if (criticalRisks.length > 0) {
      return `ESCALADER IMMÉDIATEMENT au L3 - Risques critiques : ${criticalRisks.map(r => r.type).join(', ')}`;
    }

    // 3. Experts nécessaires
    if (riskAnalysis.expertsNeeded.length > 0) {
      const expertTypes = riskAnalysis.expertsNeeded.map(e => e.type).join(' et ');
      return `Contacter l'expert ${expertTypes} avant de procéder`;
    }

    // 4. Haute difficulté sans risque immédiat
    if (difficultyAnalysis.score >= 4) {
      return `Ticket complexe (${difficultyAnalysis.score}/5) : Allouer du temps d'analyse approfondie (min 4h)`;
    }

    // 5. Dépendances multi-modules
    if (riskAnalysis.dependencies.length > 0) {
      const modules = riskAnalysis.dependencies[0].modules.join(', ');
      return `Analyser les interactions entre modules : ${modules}`;
    }

    // 6. Cas standard
    return `Reproduire le problème en environnement de test et documenter les résultats`;
  }
}

export default TicketSummarizer;
