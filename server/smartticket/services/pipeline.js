/**
 * Pipeline SmartTicket - Orchestrateur des 4 étapes
 * Exécute l'analyse complète dans l'ordre :
 * 1. Complétude (barrière)
 * 2. Résumé
 * 3. Difficulté
 * 4. Similarité
 */

import { evaluateCompleteness } from '../analyzers/completeness.js';
import { generateSummary } from '../analyzers/summarizer-v2.js';
import { analyzeTicketDifficulty } from '../analyzers/difficulty-v2.js';
import { findSimilarTickets } from '../analyzers/similarity.js';

/**
 * Exécute le pipeline complet d'analyse
 * @param {Object} ticket - Ticket à analyser
 * @returns {Object} Résultat complet de l'analyse
 */
export async function runFullAnalysis(ticket) {
  console.log(`[Pipeline] Démarrage analyse complète pour ticket ${ticket.id}`);

  const result = {
    ticketId: ticket.id,
    timestamp: new Date().toISOString(),
    pipeline: {
      step1_completeness: null,
      step2_summary: null,
      step3_difficulty: null,
      step4_similarity: null
    }
  };

  try {
    // === ÉTAPE 1 : Analyse de complétude (BARRIÈRE) ===
    console.log('[Pipeline] Étape 1/4 : Analyse de complétude');
    const completeness = evaluateCompleteness(ticket);
    result.pipeline.step1_completeness = completeness;

    // 🔴 SI REJETÉ → ARRÊT IMMÉDIAT
    if (completeness.decision === 'Rejected') {
      console.log('[Pipeline] ❌ Ticket rejeté, arrêt du pipeline');
      result.status = 'rejected';
      result.completeness = completeness;
      result.message = completeness.message;
      return result;
    }

    console.log(`[Pipeline] ✅ Ticket accepté (${completeness.decision}), poursuite du pipeline`);

    // === ÉTAPE 2 : Génération du résumé ===
    console.log('[Pipeline] Étape 2/4 : Génération du résumé');
    const summary = generateSummary(ticket);
    result.pipeline.step2_summary = summary;

    // === ÉTAPE 3 : Analyse de difficulté ===
    console.log('[Pipeline] Étape 3/4 : Analyse de difficulté');
    const difficulty = analyzeTicketDifficulty(ticket);
    result.pipeline.step3_difficulty = difficulty;

    // === ÉTAPE 4 : Détection de tickets similaires ===
    console.log('[Pipeline] Étape 4/4 : Détection de tickets similaires');
    const similarity = findSimilarTickets(ticket);
    result.pipeline.step4_similarity = similarity;

    // === ASSEMBLAGE DU RÉSULTAT FINAL ===
    result.status = completeness.decision === 'Accepted-Complete' ? 'complete' : 'incomplete';
    result.completeness = completeness;
    result.summary = summary;
    result.difficulty = {
      difficultyScore: difficulty.difficultyScore,
      difficultyLevel: difficulty.difficultyLevel,
      risks: difficulty.risks,
      modules: difficulty.modules,
      scoreDetails: difficulty.scoreDetails,
      recommendation: difficulty.recommendation
    };
    result.similarTickets = similarity.similarTickets;

    console.log(`[Pipeline] ✅ Pipeline terminé avec succès (${result.status})`);

    return result;

  } catch (error) {
    console.error('[Pipeline] ❌ Erreur durant l\'analyse:', error);

    result.status = 'error';
    result.error = {
      message: error.message,
      stack: error.stack
    };

    return result;
  }
}

/**
 * Valide qu'un ticket a les champs minimum requis
 */
export function validateTicket(ticket) {
  if (!ticket) {
    throw new Error('Ticket manquant');
  }

  if (!ticket.id) {
    throw new Error('Ticket ID manquant');
  }

  // Ajouter des valeurs par défaut si nécessaires
  ticket.title = ticket.title || 'Sans titre';
  ticket.description = ticket.description || '';
  ticket.priority = ticket.priority || 'normal';
  ticket.status = ticket.status || 'new';
  ticket.comments = ticket.comments || [];
  ticket.attachments = ticket.attachments || [];
  ticket.history = ticket.history || [];

  return ticket;
}

export default {
  runFullAnalysis,
  validateTicket
};
