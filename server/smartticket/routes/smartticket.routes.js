/**
 * Routes API SmartTicket
 * Endpoints pour l'analyse de tickets
 */

import express from 'express';
import { SmartTicketService } from '../services/smartticket.js';
import { analyzeTicketDifficulty } from '../analyzers/difficulty-v2.js';
import { REALISTIC_TICKETS } from '../examples/realistic-tickets.js';
import { runFullAnalysis, validateTicket } from '../services/pipeline.js';
import { PIPELINE_TEST_TICKETS } from '../examples/pipeline-test-tickets.js';
// DÉSACTIVÉ : import { generateEmbedding } from '../services/embeddings.js';

const router = express.Router();

// Instance du service (singleton)
let smartTicketService = null;

// Cache pour le dernier résultat d'analyse
let lastAnalysisResult = null;

/**
 * Initialise le service avec configuration
 */
function initService(config = {}) {
  if (!smartTicketService) {
    smartTicketService = new SmartTicketService(config);
  }
  return smartTicketService;
}

/**
 * POST /smartticket/analyze
 * Analyse un ticket spécifique
 */
router.post('/analyze', async (req, res) => {
  const { ticketId, source } = req.body;

  // Validation
  if (!ticketId) {
    return res.status(400).json({
      error: 'ticketId manquant',
      required: ['ticketId', 'source (optional)']
    });
  }

  try {
    console.log(`[API] Analyse ticket #${ticketId} depuis ${source || 'mantis'}`);

    const service = initService({ useAI: false });
    const analysis = await service.analyzeTicket(ticketId, source || 'mantis');

    // Stocker le résultat pour /last-result
    lastAnalysisResult = {
      status: 'success',
      ...analysis
    };

    res.json(lastAnalysisResult);

  } catch (error) {
    console.error('[API] Erreur analyse ticket:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'analyse du ticket',
      message: error.message
    });
  }
});

/**
 * GET /smartticket/last-result
 * Récupère le dernier résultat d'analyse
 */
router.get('/last-result', (req, res) => {
  if (!lastAnalysisResult) {
    return res.status(404).json({
      error: 'Aucune analyse disponible',
      message: 'Veuillez d\'abord analyser un ticket avec POST /analyze'
    });
  }

  console.log(`[API] Récupération du dernier résultat: ticket #${lastAnalysisResult.ticketId}`);
  res.json(lastAnalysisResult);
});

/**
 * GET /smartticket/scan-all
 * Scanne tous les tickets ouverts
 */
router.get('/scan-all', async (req, res) => {
  const { source, limit } = req.query;

  try {
    console.log(`[API] Scan de tous les tickets depuis ${source || 'all'}`);

    const service = initService({ useAI: false });
    const result = await service.scanAllTickets(source || 'all', {
      limit: parseInt(limit) || 50
    });

    res.json({
      status: 'success',
      ...result
    });

  } catch (error) {
    console.error('[API] Erreur scan tickets:', error);
    res.status(500).json({
      error: 'Erreur lors du scan des tickets',
      message: error.message
    });
  }
});

/**
 * POST /smartticket/analyze-batch
 * Analyse plusieurs tickets en une seule requête
 */
router.post('/analyze-batch', async (req, res) => {
  const { tickets } = req.body; // [{ ticketId, source }]

  if (!tickets || !Array.isArray(tickets)) {
    return res.status(400).json({
      error: 'Format invalide',
      expected: { tickets: [{ ticketId, source }] }
    });
  }

  try {
    console.log(`[API] Analyse batch de ${tickets.length} tickets`);

    const service = initService({ useAI: false });
    const results = [];

    for (const ticket of tickets) {
      try {
        const analysis = await service.analyzeTicket(ticket.ticketId, ticket.source || 'mantis');
        results.push(analysis);
      } catch (error) {
        results.push({
          ticketId: ticket.ticketId,
          error: error.message
        });
      }
    }

    // Trier par difficulté
    const sorted = results
      .filter(r => !r.error)
      .sort((a, b) => b.difficultyScore - a.difficultyScore);

    res.json({
      status: 'success',
      total: results.length,
      analyzed: sorted.length,
      failed: results.length - sorted.length,
      tickets: sorted
    });

  } catch (error) {
    console.error('[API] Erreur analyse batch:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'analyse batch',
      message: error.message
    });
  }
});

/**
 * GET /smartticket/analyze (avec URL query param)
 * Analyse réaliste de la difficulté d'un ticket basé sur l'URL
 * Usage: GET /smartticket/analyze?url=https://example.com/ticket/123
 */
router.get('/analyze', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      error: 'URL manquante',
      message: 'Veuillez fournir un paramètre ?url=...'
    });
  }

  try {
    console.log(`[API] Analyse difficulté V2 pour URL: ${url}`);

    // Extraction de l'ID du ticket depuis l'URL
    const ticketId = extractTicketIdFromUrl(url);

    let ticket = null;

    // Essayer de récupérer le ticket depuis les exemples réalistes
    if (ticketId && REALISTIC_TICKETS[ticketId]) {
      ticket = REALISTIC_TICKETS[ticketId];
      console.log(`[API] Ticket réaliste trouvé: ${ticketId}`);
    }
    // Essayer de mapper l'ID numérique vers un ticket exemple
    else if (ticketId) {
      ticket = getRealisticTicketById(ticketId);
      console.log(`[API] Ticket mappé: ${ticketId} → ${ticket ? ticket.id : 'non trouvé'}`);
    }

    // Si on a un ticket, l'analyser avec le système réaliste
    if (ticket) {
      const analysis = analyzeTicketDifficulty(ticket);

      // Stocker pour /last-result
      lastAnalysisResult = {
        status: 'success',
        ...analysis
      };

      // Retourner l'analyse complète
      return res.json(analysis);
    }

    // Sinon, créer un ticket générique basé sur l'URL
    const genericTicket = createGenericTicketFromUrl(url);
    const analysis = analyzeTicketDifficulty(genericTicket);

    return res.json(analysis);

  } catch (error) {
    console.error('[API] Erreur analyse URL:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'analyse',
      message: error.message
    });
  }
});

/**
 * Extrait l'ID du ticket depuis l'URL
 */
function extractTicketIdFromUrl(url) {
  // Pattern Mantis: view.php?id=12345
  const mantisMatch = url.match(/view\.php\?id=(\d+)/);
  if (mantisMatch) {
    return mantisMatch[1];
  }

  // Pattern PMTalk: /ticket/12345 ou /issues/12345
  const pmtalkMatch = url.match(/\/(ticket|issue)s?\/([A-Z]+-\d+|\d+)/i);
  if (pmtalkMatch) {
    return pmtalkMatch[2];
  }

  // Pattern générique: /12345 ou #12345
  const genericMatch = url.match(/[/#](\d{3,})/);
  if (genericMatch) {
    return genericMatch[1];
  }

  // Chercher un ID dans les query params
  const urlObj = new URL(url);
  if (urlObj.searchParams.has('id')) {
    return urlObj.searchParams.get('id');
  }

  // Chercher des mots-clés de tickets réalistes dans l'URL
  const urlLower = url.toLowerCase();
  if (urlLower.includes('simple') || urlLower.includes('ui')) {
    return 'simple_ui';
  }
  if (urlLower.includes('moderate') || urlLower.includes('bug')) {
    return 'moderate_bug';
  }
  if (urlLower.includes('111525') || (urlLower.includes('complex') && urlLower.includes('multi'))) {
    return 'complex_multi_module';
  }
  if (urlLower.includes('111888') || urlLower.includes('regression')) {
    return 'critical_regression';
  }
  if (urlLower.includes('112000') || urlLower.includes('nightmare') || urlLower.includes('corruption')) {
    return 'nightmare_ticket';
  }

  return null;
}

/**
 * Mappe un ID numérique vers un ticket réaliste
 */
function getRealisticTicketById(ticketId) {
  // Mapping ID → Ticket exemple
  const mapping = {
    '100001': REALISTIC_TICKETS.simple_ui,
    '100002': REALISTIC_TICKETS.moderate_bug,
    '111525': REALISTIC_TICKETS.complex_multi_module,
    '111888': REALISTIC_TICKETS.critical_regression,
    '112000': REALISTIC_TICKETS.nightmare_ticket
  };

  return mapping[ticketId] || null;
}

/**
 * Crée un ticket générique basé sur l'URL
 */
function createGenericTicketFromUrl(url) {
  const urlLower = url.toLowerCase();

  // Détection de mots-clés pour construire un ticket réaliste
  let title = 'Problème détecté';
  let description = 'Problème signalé via URL.';
  let priority = 'normal';
  const comments = [];

  // Titre basé sur mots-clés
  if (urlLower.includes('error') || urlLower.includes('erreur')) {
    title = 'Erreur signalée';
    description = 'Une erreur a été détectée dans l\'application.';
  }
  if (urlLower.includes('crash')) {
    title = 'Crash application';
    description = 'L\'application plante de manière inattendue.';
    priority = 'high';
  }
  if (urlLower.includes('regression') || urlLower.includes('régression')) {
    title = 'Régression fonctionnelle détectée';
    description = 'Fonctionnalité qui fonctionnait avant mais ne fonctionne plus depuis mise à jour.';
    priority = 'high';
    comments.push({ user: 'Support', text: 'Régression confirmée', created_at: new Date().toISOString() });
  }
  if (urlLower.includes('multi-client') || urlLower.includes('multiple')) {
    title = 'Problème multi-clients';
    description = 'Plusieurs clients sont affectés par ce problème.';
    priority = 'urgent';
    comments.push({ user: 'Support', text: 'Impact multi-clients confirmé', created_at: new Date().toISOString() });
    comments.push({ user: 'Manager', text: 'Escalade immédiate', created_at: new Date().toISOString() });
  }
  if (urlLower.includes('paie') || urlLower.includes('salaire')) {
    title = 'Problème calcul paie';
    description = 'Erreur détectée dans le calcul de la paie.';
    priority = 'urgent';
  }

  // Ticket générique
  return {
    id: 'GENERIC-' + Date.now(),
    source: 'generic',
    title: title,
    description: description,
    category: 'Général',
    priority: priority,
    status: 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    comments: comments,
    history: []
  };
}

/**
 * GET /smartticket/full-analysis (NOUVEAU - Pipeline complet)
 * Exécute le pipeline complet en 4 étapes :
 * 1. Complétude (barrière)
 * 2. Résumé
 * 3. Difficulté
 * 4. Similarité
 */
router.get('/full-analysis', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      error: 'URL manquante',
      message: 'Veuillez fournir un paramètre ?url=...'
    });
  }

  try {
    console.log(`[API] Pipeline complet pour URL: ${url}`);

    // Extraction de l'ID du ticket
    const ticketId = extractTicketIdFromUrl(url);

    let ticket = null;

    // Chercher dans les tickets de test du pipeline
    if (ticketId && PIPELINE_TEST_TICKETS[ticketId]) {
      ticket = PIPELINE_TEST_TICKETS[ticketId];
      console.log(`[API] Ticket pipeline trouvé: ${ticketId}`);
    }
    // Sinon chercher dans les tickets réalistes
    else if (ticketId && REALISTIC_TICKETS[ticketId]) {
      ticket = REALISTIC_TICKETS[ticketId];
      console.log(`[API] Ticket réaliste trouvé: ${ticketId}`);
    }
    // Mapper ID numérique
    else if (ticketId) {
      ticket = getRealisticTicketById(ticketId) || getPipelineTestTicketById(ticketId);
      console.log(`[API] Ticket mappé: ${ticketId} → ${ticket ? ticket.id : 'non trouvé'}`);
    }

    // Créer ticket générique si nécessaire
    if (!ticket) {
      ticket = createGenericTicketFromUrl(url);
    }

    // Valider le ticket
    ticket = validateTicket(ticket);

    // Exécuter le pipeline complet
    const result = await runFullAnalysis(ticket);

    // Stocker pour /last-result
    lastAnalysisResult = {
      status: 'success',
      ...result
    };

    return res.json(result);

  } catch (error) {
    console.error('[API] Erreur pipeline complet:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'analyse complète',
      message: error.message
    });
  }
});

/**
 * Mappe un ID vers un ticket de test du pipeline
 */
function getPipelineTestTicketById(ticketId) {
  const mapping = {
    'TEST-001': PIPELINE_TEST_TICKETS.rejected_incomplete,
    'TEST-002': PIPELINE_TEST_TICKETS.accepted_incomplete,
    'TEST-003': PIPELINE_TEST_TICKETS.accepted_complete,
    'TEST-004': PIPELINE_TEST_TICKETS.regression_ticket,
    'TEST-005': PIPELINE_TEST_TICKETS.simple_cosmetic
  };

  return mapping[ticketId] || null;
}

/**
 * GET /smartticket/fetch-ticket (NOUVEAU)
 * Récupère les détails d'un ticket similaire pour comparaison
 * Usage: GET /smartticket/fetch-ticket?id=112020
 */
router.get('/fetch-ticket', async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      error: 'ID manquant',
      message: 'Veuillez fournir un paramètre ?id=...'
    });
  }

  try {
    console.log(`[API] Récupération ticket similaire: ${id}`);

    // Chercher dans la base mock de similarity.js
    const { fetchTicketDetails } = await import('../analyzers/similarity.js');
    const ticketDetails = fetchTicketDetails(id);

    if (!ticketDetails) {
      return res.status(404).json({
        error: 'Ticket non trouvé',
        message: `Le ticket #${id} n'existe pas dans la base`
      });
    }

    return res.json(ticketDetails);

  } catch (error) {
    console.error('[API] Erreur fetch ticket:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du ticket',
      message: error.message
    });
  }
});

/**
 * DÉSACTIVÉ : POST /smartticket/embedding (base vectorielle désactivée)
 */
/*
router.post('/embedding', async (req, res) => {
  // Code désactivé
});
*/

/**
 * GET /smartticket/health
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'smartticket',
    version: '1.0.0',
    features: {
      mantis_connector: true,
      pmtalk_connector: true,
      difficulty_analysis: true,
      risk_analysis: true,
      ai_summarization: !!process.env.AZURE_OPENAI_API_KEY,
      vector_embeddings: false // Désactivé
    }
  });
});

export default router;
