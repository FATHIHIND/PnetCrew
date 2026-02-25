/**
 * Service Principal SmartTicket
 * Orchestration de l'analyse complète
 */

import { MantisConnector } from '../connectors/mantis.js';
import { PMTalkConnector } from '../connectors/pmtalk.js';
import { DifficultyAnalyzer } from '../analyzers/difficulty.js';
import { RiskAnalyzer } from '../analyzers/risk.js';
import { TicketSummarizer } from '../analyzers/summarizer.js';

export class SmartTicketService {
  constructor(config = {}) {
    this.mantis = new MantisConnector(config.mantis || {});
    this.pmtalk = new PMTalkConnector(config.pmtalk || {});
    this.difficultyAnalyzer = new DifficultyAnalyzer();
    this.riskAnalyzer = new RiskAnalyzer();
    this.summarizer = new TicketSummarizer(config.useAI || false);
  }

  /**
   * Analyse complète d'un ticket
   * @param {string} ticketId - ID du ticket
   * @param {string} source - 'mantis' ou 'pmtalk'
   * @returns {Promise<Object>} Analyse complète
   */
  async analyzeTicket(ticketId, source = 'mantis') {
    console.log(`[SmartTicket] Analyse ticket #${ticketId} depuis ${source}`);

    try {
      // 1. Récupérer le ticket
      const ticket = await this.getTicketFromSource(ticketId, source);

      // 2. Analyser la difficulté
      const difficultyAnalysis = this.difficultyAnalyzer.analyze(ticket);

      // 3. Analyser les risques
      const riskAnalysis = this.riskAnalyzer.analyze(ticket);

      // 4. Générer le résumé
      const summary = await this.summarizer.generate(ticket, difficultyAnalysis, riskAnalysis);

      // 5. Construire le résultat final
      return {
        ticketId: ticket.id,
        source: ticket.source,
        title: ticket.title,
        difficultyScore: difficultyAnalysis.score,
        difficultyLevel: difficultyAnalysis.level,
        riskLevel: riskAnalysis.level,
        functionalArea: this.determineFunctionalArea(ticket),
        missingInformation: riskAnalysis.missingInformation.map(i => i.message),
        risks: riskAnalysis.risks.map(r => r.description),
        expertsNeeded: riskAnalysis.expertsNeeded.map(e => e.type),
        dependencies: riskAnalysis.dependencies,
        suggestedAction: summary.suggestedAction,
        summary: summary.summary,
        keyPoints: summary.keyPoints,
        metadata: {
          priority: ticket.priority,
          status: ticket.status,
          created_at: ticket.created_at,
          updated_at: ticket.updated_at,
          comments_count: ticket.comments.length,
          age_days: Math.floor((Date.now() - new Date(ticket.created_at)) / (1000 * 60 * 60 * 24))
        },
        analyzed_at: new Date().toISOString()
      };

    } catch (error) {
      console.error(`[SmartTicket] Erreur analyse ticket #${ticketId}:`, error);
      throw error;
    }
  }

  /**
   * Scanne tous les tickets ouverts
   * @param {string} source - 'mantis' ou 'pmtalk' ou 'all'
   * @param {Object} filters - Filtres optionnels
   * @returns {Promise<Array>} Liste d'analyses triée par difficulté
   */
  async scanAllTickets(source = 'all', filters = {}) {
    console.log(`[SmartTicket] Scan de tous les tickets depuis ${source}`);

    try {
      let tickets = [];

      // Récupérer les tickets selon la source
      if (source === 'all' || source === 'mantis') {
        const mantisTickets = await this.mantis.getOpenTickets(filters);
        tickets.push(...mantisTickets);
      }

      if (source === 'all' || source === 'pmtalk') {
        const pmtalkTickets = await this.pmtalk.getOpenTickets(filters);
        tickets.push(...pmtalkTickets);
      }

      console.log(`[SmartTicket] ${tickets.length} tickets récupérés`);

      // Analyser chaque ticket
      const analyses = [];
      for (const ticket of tickets) {
        try {
          const analysis = await this.analyzeFromTicketObject(ticket);
          analyses.push(analysis);
        } catch (error) {
          console.error(`[SmartTicket] Erreur analyse ticket #${ticket.id}:`, error.message);
        }
      }

      // Trier par difficulté décroissante
      const sorted = analyses.sort((a, b) => b.difficultyScore - a.difficultyScore);

      return {
        total: sorted.length,
        analyzed_at: new Date().toISOString(),
        tickets: sorted
      };

    } catch (error) {
      console.error('[SmartTicket] Erreur scan tickets:', error);
      throw error;
    }
  }

  /**
   * Analyse un ticket déjà récupéré
   */
  async analyzeFromTicketObject(ticket) {
    const difficultyAnalysis = this.difficultyAnalyzer.analyze(ticket);
    const riskAnalysis = this.riskAnalyzer.analyze(ticket);
    const summary = await this.summarizer.generate(ticket, difficultyAnalysis, riskAnalysis);

    return {
      ticketId: ticket.id,
      source: ticket.source,
      title: ticket.title,
      difficultyScore: difficultyAnalysis.score,
      difficultyLevel: difficultyAnalysis.level,
      riskLevel: riskAnalysis.level,
      functionalArea: this.determineFunctionalArea(ticket),
      suggestedAction: summary.suggestedAction,
      summary: summary.summary
    };
  }

  /**
   * Récupère un ticket depuis la source
   */
  async getTicketFromSource(ticketId, source) {
    if (source === 'mantis') {
      return await this.mantis.getTicket(ticketId);
    } else if (source === 'pmtalk') {
      return await this.pmtalk.getTicket(ticketId);
    } else {
      throw new Error(`Source inconnue: ${source}`);
    }
  }

  /**
   * Détermine le domaine fonctionnel principal
   */
  determineFunctionalArea(ticket) {
    const fullText = `${ticket.title} ${ticket.description} ${ticket.category}`.toLowerCase();
    const scores = {};

    const FUNCTIONAL_AREAS = {
      'Paie': ['paie', 'salaire', 'bulletin', 'cotisation'],
      'Absence': ['absence', 'congé', 'cp', 'rtt'],
      'Planning': ['planning', 'horaire', 'shift'],
      'Contrat': ['contrat', 'embauche', 'démission'],
      'Formation': ['formation', 'cpf', 'entretien']
    };

    for (const [area, keywords] of Object.entries(FUNCTIONAL_AREAS)) {
      const matches = keywords.filter(kw => fullText.includes(kw)).length;
      if (matches > 0) {
        scores[area] = matches;
      }
    }

    // Retourner le domaine avec le plus de matches
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : 'Autre';
  }
}

export default SmartTicketService;
