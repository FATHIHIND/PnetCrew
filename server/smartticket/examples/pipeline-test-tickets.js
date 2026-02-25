/**
 * Tickets d'exemple pour tester le pipeline complet
 */

export const PIPELINE_TEST_TICKETS = {
  // === TICKET REJETÉ (Score < 55) ===
  rejected_incomplete: {
    id: 'TEST-001',
    title: 'Bug planning',
    description: 'Bonjour, svp',
    category: 'Planning',
    priority: 'normal',
    status: 'new',
    created_at: '2026-02-10T10:00:00.000Z',
    updated_at: '2026-02-10T10:00:00.000Z',
    comments: [],
    attachments: [],
    history: []
  },

  // === TICKET ACCEPTÉ MAIS INCOMPLET (55 ≤ Score < 80) ===
  accepted_incomplete: {
    id: 'TEST-002',
    title: 'Erreur calcul absence multi-contrats',
    description: `Le calcul des absences ne fonctionne pas correctement pour les salariés ayant plusieurs contrats simultanés.

Le problème est que les absences sont comptabilisées en double, ce qui impacte la paie.

Attendu : Absence comptée 1 fois
Constaté : Absence comptée 2 fois`,
    category: 'Absence',
    priority: 'high',
    status: 'new',
    created_at: '2026-02-08T14:00:00.000Z',
    updated_at: '2026-02-10T09:00:00.000Z',
    comments: [
      { user: 'Support', text: 'Escaladé au L2', created_at: '2026-02-09T10:00:00.000Z' }
    ],
    attachments: [],
    history: []
  },

  // === TICKET COMPLET (Score ≥ 80) ===
  accepted_complete: {
    id: 'TEST-003',
    title: 'Incohérence calcul absence multi-contrats en production',
    description: `**Environnement** : Production

**Problème** : Le calcul des absences ne fonctionne pas correctement pour les salariés ayant plusieurs contrats simultanés.

**Étapes de reproduction** :
1. Créer un salarié avec 2 contrats simultanés (CDI + CDD)
2. Poser une absence de 2 jours sur le contrat principal
3. Générer la paie du mois
4. Constater que l'absence est déduite 2 fois au lieu d'1 seule

**Résultat attendu** : L'absence doit être comptabilisée 1 seule fois dans le calcul de la paie.

**Résultat constaté** : L'absence est comptabilisée 2 fois, ce qui fausse le calcul du net à payer.

**Message d'erreur** : Aucun message d'erreur, mais le montant du net à payer est incorrect.

**Capture d'écran** : Voir pièce jointe screenshot-paie-incorrecte.png`,
    category: 'Absence',
    priority: 'urgent',
    status: 'new',
    environment: 'Production',
    created_at: '2026-02-05T08:00:00.000Z',
    updated_at: '2026-02-10T10:00:00.000Z',
    comments: [
      { user: 'Support L1', text: 'Client bloqué, escalade immédiate', created_at: '2026-02-05T09:00:00.000Z' },
      { user: 'Support L2', text: 'Attente expert paie', created_at: '2026-02-06T14:00:00.000Z' },
      { user: 'Expert Paie', text: 'Bug confirmé, impact multi-clients', created_at: '2026-02-08T10:00:00.000Z' }
    ],
    attachments: [
      { name: 'screenshot-paie-incorrecte.png', size: 125000 }
    ],
    history: [
      { field: 'priority', old_value: 'high', new_value: 'urgent', changed_at: '2026-02-06T14:00:00.000Z' }
    ]
  },

  // === TICKET AVEC RÉGRESSION ===
  regression_ticket: {
    id: 'TEST-004',
    title: 'Régression paie après mise à jour V2024.2',
    description: `**Environnement** : Production

**Problème** : Depuis la mise à jour V2024.2 déployée le 01/02/2026, les bulletins de paie affichent des montants incorrects pour plusieurs clients.

**Étapes de reproduction** :
1. Générer la paie du mois de février
2. Éditer un bulletin de paie
3. Constater que les cotisations sociales sont mal calculées

**Résultat attendu** : Les cotisations doivent être calculées selon les taux en vigueur.

**Résultat constaté** : Les cotisations sont calculées avec d'anciens taux (V2024.1).

**Environnement** : Production, tous les clients en V2024.2

**Capture** : Voir capture bulletin-incorrect.png`,
    category: 'Paie',
    priority: 'urgent',
    status: 'new',
    environment: 'Production',
    created_at: '2026-02-03T07:00:00.000Z',
    updated_at: '2026-02-10T11:00:00.000Z',
    comments: [
      { user: 'Support', text: 'Régression confirmée sur V2024.2', created_at: '2026-02-03T09:00:00.000Z' },
      { user: 'Dev', text: 'Investigation en cours', created_at: '2026-02-04T14:00:00.000Z' },
      { user: 'Client', text: 'Demande de rollback urgent', created_at: '2026-02-05T08:00:00.000Z' }
    ],
    attachments: [
      { name: 'bulletin-incorrect.png', size: 89000 }
    ],
    history: []
  },

  // === TICKET SIMPLE (COSMETIC) ===
  simple_cosmetic: {
    id: 'TEST-005',
    title: 'Alignement colonne "Nom" dans planning',
    description: `**Environnement** : Test

**Problème** : La colonne "Nom" du planning n'est pas alignée correctement sur Google Chrome.

**Étapes de reproduction** :
1. Ouvrir le module Planning
2. Observer la colonne "Nom"
3. Constater le désalignement

**Résultat attendu** : La colonne doit être alignée à gauche.

**Résultat constaté** : La colonne est décalée vers la droite.

**Capture** : Voir screenshot-alignement.png`,
    category: 'Planning',
    priority: 'low',
    status: 'new',
    environment: 'Test',
    created_at: '2026-02-09T15:00:00.000Z',
    updated_at: '2026-02-09T15:00:00.000Z',
    comments: [],
    attachments: [
      { name: 'screenshot-alignement.png', size: 45000 }
    ],
    history: []
  }
};

export default PIPELINE_TEST_TICKETS;
