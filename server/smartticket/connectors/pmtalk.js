/**
 * Connecteur PMTalk
 * Récupère les tickets via API REST
 */

import axios from 'axios';

export class PMTalkConnector {
  constructor(config) {
    this.baseUrl = config.baseUrl || process.env.PMTALK_URL;
    this.apiKey = config.apiKey || process.env.PMTALK_API_KEY;
    this.workspace = config.workspace || process.env.PMTALK_WORKSPACE;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Récupère un ticket par son ID
   */
  async getTicket(ticketId) {
    try {
      console.log(`[PMTalk] Récupération ticket #${ticketId}`);

      const response = await this.client.get(`/api/v1/workspaces/${this.workspace}/tickets/${ticketId}`);
      return this.normalizeTicket(response.data);
    } catch (error) {
      console.error(`[PMTalk] Erreur récupération ticket #${ticketId}:`, error.message);

      if (process.env.NODE_ENV === 'development') {
        console.warn(`[PMTalk] Mode mock activé`);
        return this.getMockTicket(ticketId);
      }

      throw new Error(`Impossible de récupérer le ticket PMTalk #${ticketId}: ${error.message}`);
    }
  }

  /**
   * Récupère tous les tickets ouverts
   */
  async getOpenTickets(filters = {}) {
    try {
      console.log('[PMTalk] Récupération tickets ouverts');

      const params = {
        status: 'open,in_progress',
        limit: filters.limit || 100,
        offset: filters.offset || 0,
        ...filters
      };

      const response = await this.client.get(`/api/v1/workspaces/${this.workspace}/tickets`, { params });
      const tickets = response.data.tickets || [];

      return tickets.map(ticket => this.normalizeTicket(ticket));
    } catch (error) {
      console.error('[PMTalk] Erreur récupération tickets:', error.message);

      if (process.env.NODE_ENV === 'development') {
        return this.getMockTickets();
      }

      throw new Error(`Impossible de récupérer les tickets PMTalk: ${error.message}`);
    }
  }

  /**
   * Normalise un ticket PMTalk vers le format standard
   */
  normalizeTicket(rawTicket) {
    return {
      id: rawTicket.id?.toString() || rawTicket.ticket_id?.toString(),
      source: 'pmtalk',
      title: rawTicket.title || rawTicket.subject || '',
      description: rawTicket.description || rawTicket.body || '',
      category: rawTicket.category || rawTicket.type || 'Non catégorisé',
      priority: this.normalizePriority(rawTicket.priority),
      status: rawTicket.status || 'unknown',
      reporter: rawTicket.requester?.name || rawTicket.created_by || 'Inconnu',
      assigned_to: rawTicket.assignee?.name || rawTicket.assigned_to || null,
      created_at: rawTicket.created_at,
      updated_at: rawTicket.updated_at,
      comments: this.extractComments(rawTicket),
      history: this.extractHistory(rawTicket),
      attachments: this.extractAttachments(rawTicket),
      custom_fields: rawTicket.custom_fields || {},
      raw: rawTicket
    };
  }

  normalizePriority(priority) {
    if (!priority) return 'normal';

    const normalized = priority.toString().toLowerCase();
    const mapping = {
      'low': 'low',
      'medium': 'normal',
      'normal': 'normal',
      'high': 'high',
      'critical': 'urgent',
      'urgent': 'urgent'
    };

    return mapping[normalized] || 'normal';
  }

  extractComments(ticket) {
    const comments = ticket.comments || ticket.messages || [];
    return comments.map(comment => ({
      id: comment.id,
      author: comment.author?.name || comment.user || 'Inconnu',
      text: comment.text || comment.body || '',
      created_at: comment.created_at,
      type: 'comment'
    }));
  }

  extractHistory(ticket) {
    const activities = ticket.activities || ticket.history || [];
    return activities.map(activity => ({
      id: activity.id,
      field: activity.field_name || activity.field,
      old_value: activity.old_value,
      new_value: activity.new_value,
      user: activity.user?.name || 'Système',
      changed_at: activity.created_at
    }));
  }

  extractAttachments(ticket) {
    const files = ticket.attachments || ticket.files || [];
    return files.map(file => ({
      id: file.id,
      filename: file.name || file.filename,
      size: file.size,
      content_type: file.mime_type || file.type,
      download_url: file.url || file.download_url,
      created_at: file.created_at
    }));
  }

  getMockTicket(ticketId) {
    return {
      id: ticketId.toString(),
      source: 'pmtalk',
      title: 'Régression paie après mise à jour',
      description: `Après la mise à jour du module paie, plusieurs anomalies détectées.

Problèmes identifiés :
- Calcul primes incorrect
- Export SEPA bloqué
- Interface lente

Impact : 15 clients touchés
Urgence : critique`,
      category: 'Paie',
      priority: 'urgent',
      status: 'in_progress',
      reporter: 'Support Manager',
      assigned_to: 'Expert Paie',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      comments: [
        {
          id: '1',
          author: 'Expert Paie',
          text: 'Analyse en cours, possible lien avec les contrats multiples',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      history: [],
      attachments: [],
      custom_fields: {}
    };
  }

  getMockTickets() {
    return [this.getMockTicket('PM-789')];
  }
}

export default PMTalkConnector;
