/**
 * Connecteur Mantis BugTracker
 * Récupère les tickets via API REST ou scraping
 */

import axios from 'axios';

export class MantisConnector {
  constructor(config) {
    this.baseUrl = config.baseUrl || process.env.MANTIS_URL;
    this.apiToken = config.apiToken || process.env.MANTIS_API_TOKEN;
    this.username = config.username || process.env.MANTIS_USERNAME;
    this.password = config.password || process.env.MANTIS_PASSWORD;

    // Client HTTP avec authentification
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Authorization': this.apiToken ? `Bearer ${this.apiToken}` : undefined,
        'Content-Type': 'application/json'
      }
    });

    // Authentification Basic si pas de token
    if (!this.apiToken && this.username && this.password) {
      this.client.defaults.auth = {
        username: this.username,
        password: this.password
      };
    }
  }

  /**
   * Récupère un ticket par son ID
   * @param {string|number} ticketId - ID du ticket
   * @returns {Promise<Object>} Ticket normalisé
   */
  async getTicket(ticketId) {
    try {
      console.log(`[Mantis] Récupération ticket #${ticketId}`);

      // API Mantis : /api/rest/issues/{id}
      const response = await this.client.get(`/api/rest/issues/${ticketId}`);
      const ticket = response.data.issues?.[0] || response.data;

      return this.normalizeTicket(ticket);
    } catch (error) {
      console.error(`[Mantis] Erreur récupération ticket #${ticketId}:`, error.message);

      // Fallback : mode mock pour développement
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Mantis] Mode mock activé pour ticket #${ticketId}`);
        return this.getMockTicket(ticketId);
      }

      throw new Error(`Impossible de récupérer le ticket Mantis #${ticketId}: ${error.message}`);
    }
  }

  /**
   * Récupère tous les tickets ouverts
   * @param {Object} filters - Filtres optionnels (status, priority, etc.)
   * @returns {Promise<Array>} Liste de tickets normalisés
   */
  async getOpenTickets(filters = {}) {
    try {
      console.log('[Mantis] Récupération tickets ouverts');

      // Construire les paramètres de requête
      const params = {
        filter_id: 'open', // Filtre prédéfini pour tickets ouverts
        page_size: filters.limit || 100,
        page: filters.page || 1,
        ...filters
      };

      const response = await this.client.get('/api/rest/issues', { params });
      const tickets = response.data.issues || [];

      return tickets.map(ticket => this.normalizeTicket(ticket));
    } catch (error) {
      console.error('[Mantis] Erreur récupération tickets ouverts:', error.message);

      // Fallback : mode mock
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Mantis] Mode mock activé pour tickets ouverts');
        return this.getMockTickets();
      }

      throw new Error(`Impossible de récupérer les tickets Mantis: ${error.message}`);
    }
  }

  /**
   * Normalise un ticket Mantis vers le format standard
   * @param {Object} rawTicket - Ticket brut de l'API Mantis
   * @returns {Object} Ticket normalisé
   */
  normalizeTicket(rawTicket) {
    return {
      id: rawTicket.id?.toString(),
      source: 'mantis',
      title: rawTicket.summary || rawTicket.title || '',
      description: rawTicket.description || '',
      category: rawTicket.category?.name || rawTicket.category || 'Non catégorisé',
      priority: this.normalizePriority(rawTicket.priority),
      status: rawTicket.status?.name || rawTicket.status || 'unknown',
      reporter: rawTicket.reporter?.name || rawTicket.reporter || 'Inconnu',
      assigned_to: rawTicket.handler?.name || rawTicket.assigned_to || null,
      created_at: rawTicket.created_at || rawTicket.date_submitted,
      updated_at: rawTicket.updated_at || rawTicket.last_updated,
      comments: this.extractComments(rawTicket),
      history: this.extractHistory(rawTicket),
      attachments: this.extractAttachments(rawTicket),
      custom_fields: rawTicket.custom_fields || {},
      raw: rawTicket // Conserver les données brutes pour debug
    };
  }

  /**
   * Normalise la priorité vers un format standard
   */
  normalizePriority(priority) {
    if (!priority) return 'normal';

    const value = typeof priority === 'object' ? priority.name || priority.label : priority;
    const normalized = value.toString().toLowerCase();

    const mapping = {
      'none': 'low',
      'low': 'low',
      'normal': 'normal',
      'high': 'high',
      'urgent': 'urgent',
      'immediate': 'urgent',
      'critique': 'urgent'
    };

    return mapping[normalized] || 'normal';
  }

  /**
   * Extrait les commentaires du ticket
   */
  extractComments(ticket) {
    const notes = ticket.notes || [];
    return notes.map(note => ({
      id: note.id,
      author: note.reporter?.name || 'Inconnu',
      text: note.text || '',
      created_at: note.created_at,
      type: note.note_type || 'comment'
    }));
  }

  /**
   * Extrait l'historique des modifications
   */
  extractHistory(ticket) {
    const history = ticket.history || [];
    return history.map(entry => ({
      id: entry.id,
      field: entry.field?.name || entry.field,
      old_value: entry.old_value,
      new_value: entry.new_value,
      user: entry.user?.name || 'Système',
      changed_at: entry.created_at
    }));
  }

  /**
   * Extrait les pièces jointes
   */
  extractAttachments(ticket) {
    const attachments = ticket.attachments || [];
    return attachments.map(att => ({
      id: att.id,
      filename: att.filename,
      size: att.size,
      content_type: att.content_type,
      download_url: att.download_url || `${this.baseUrl}/file_download.php?file_id=${att.id}`,
      created_at: att.created_at
    }));
  }

  /**
   * Ticket mock pour développement sans API
   */
  getMockTicket(ticketId) {
    return {
      id: ticketId.toString(),
      source: 'mantis',
      title: 'Incohérence calcul absence multi-contrats',
      description: `Le calcul des absences ne fonctionne pas correctement pour les salariés ayant plusieurs contrats simultanés.

Contexte :
- Client : ABC Corp
- Module : Absence & Planning
- Version : PeopleNet 2024.1

Symptômes :
- Les absences sont comptabilisées en double
- Le solde de congés est incorrect
- Régression depuis la mise à jour

Besoins :
- Analyser le calcul pour multi-contrats
- Vérifier l'impact sur la paie
- Tester avec scénario complexe`,
      category: 'Absence',
      priority: 'urgent',
      status: 'assigned',
      reporter: 'Client ABC',
      assigned_to: 'Support L2',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      comments: [
        {
          id: '1',
          author: 'Support L1',
          text: 'Ticket escaladé car touche plusieurs modules',
          created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          author: 'Support L2',
          text: 'Demande de scénario reproductible au client',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          author: 'Client ABC',
          text: 'Toujours en attente, problème bloquant',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      history: [
        {
          field: 'status',
          old_value: 'new',
          new_value: 'assigned',
          user: 'Support L1',
          changed_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          field: 'priority',
          old_value: 'normal',
          new_value: 'urgent',
          user: 'Support L2',
          changed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      attachments: [],
      custom_fields: {}
    };
  }

  /**
   * Tickets mock pour développement
   */
  getMockTickets() {
    return [
      this.getMockTicket('12345'),
      {
        ...this.getMockTicket('12346'),
        title: 'Erreur export paie format SEPA',
        description: 'L\'export SEPA génère des erreurs de format',
        category: 'Paie',
        priority: 'high',
        comments: []
      },
      {
        ...this.getMockTicket('12347'),
        title: 'Planning : décalage affichage weekend',
        description: 'Le planning affiche incorrectement les weekends',
        category: 'Planning',
        priority: 'normal',
        comments: [{
          id: '1',
          author: 'Client',
          text: 'Problème intermittent',
          created_at: new Date().toISOString()
        }]
      }
    ];
  }
}

export default MantisConnector;
