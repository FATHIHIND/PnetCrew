/**
 * Tickets réalistes PeopleNet pour tests
 * Couvrent différents niveaux de difficulté
 */

export const REALISTIC_TICKETS = {
  // === Ticket Difficulté 1/5 (Score brut 0-2) ===
  simple_ui: {
    id: '100001',
    source: 'mantis',
    title: 'Alignement colonne dans Planning',
    description: 'La colonne "Nom" du planning n\'est pas alignée correctement sur Chrome.',
    category: 'Planning',
    priority: 'low',
    status: 'new',
    created_at: '2026-02-05T10:00:00.000Z',
    updated_at: '2026-02-05T10:00:00.000Z',
    comments: [],
    history: []
  },

  // === Ticket Difficulté 2/5 (Score brut 3-4) ===
  moderate_bug: {
    id: '100002',
    source: 'mantis',
    title: 'Erreur calcul heures supplémentaires',
    description: `Les heures supplémentaires ne sont pas calculées correctement pour les salariés en forfait jour.

Scénario:
1. Créer un employé en forfait jour
2. Ajouter des heures supplémentaires
3. Constater que le calcul est faux

Attendu: Calcul correct selon convention collective
Constaté: Heures supplémentaires = 0`,
    category: 'Planning',
    priority: 'normal',
    status: 'assigned',
    created_at: '2026-02-03T14:00:00.000Z',
    updated_at: '2026-02-06T09:00:00.000Z',
    comments: [
      { user: 'Support L1', text: 'Escaladé au L2', created_at: '2026-02-04T10:00:00.000Z' },
      { user: 'Dev', text: 'En cours d\'investigation', created_at: '2026-02-06T09:00:00.000Z' }
    ],
    history: []
  },

  // === Ticket Difficulté 3/5 (Score brut 5-6) ===
  complex_multi_module: {
    id: '111525',
    source: 'mantis',
    title: 'Incohérence calcul absence multi-contrats',
    description: `Le calcul des absences ne fonctionne pas correctement pour les salariés ayant plusieurs contrats simultanés.

Contexte:
- Client: ABC Corp (150 salariés)
- Module: Absence & Planning
- Version: V2024.1
- Environnement: Production

Problème:
Les absences sont comptabilisées en double pour les salariés multi-contrats, ce qui impacte le calcul de la paie.

Étapes de reproduction:
1. Créer un salarié avec 2 contrats simultanés (CDI + CDD)
2. Poser une absence sur le contrat principal
3. Générer la paie
4. Constater que l'absence est déduite 2 fois au lieu d'1

Impact: 15 clients affectés selon base de support`,
    category: 'Absence',
    priority: 'high',
    status: 'assigned',
    created_at: '2026-01-15T10:00:00.000Z',
    updated_at: '2026-02-08T14:30:00.000Z',
    comments: [
      { user: 'Support L1', text: 'Client mécontent, escaladé L2', created_at: '2026-01-16T09:00:00.000Z' },
      { user: 'Support L2', text: 'Attente expert paie', created_at: '2026-01-18T14:00:00.000Z' },
      { user: 'Expert Paie', text: 'Confirme le bug, impact paie important', created_at: '2026-01-20T11:00:00.000Z' },
      { user: 'Dev', text: 'Investigation en cours sur module Absence', created_at: '2026-02-01T10:00:00.000Z' }
    ],
    history: [
      { field: 'priority', old_value: 'normal', new_value: 'high', changed_at: '2026-01-18T14:00:00.000Z' }
    ]
  },

  // === Ticket Difficulté 4/5 (Score brut 7-8) ===
  critical_regression: {
    id: '111888',
    source: 'mantis',
    title: 'Régression calcul paie multi-client depuis V2024.2',
    description: `Régression majeure détectée sur le calcul de paie après mise à jour V2024.2.

Symptômes:
- Bulletins de paie avec montants erronés
- Cotisations sociales mal calculées
- Impact sur DSN et déclarations URSSAF

Clients impactés: TOUS les clients en V2024.2 (estimation 200+ clients)

Contexte technique:
- Modules: Paie + Absence + Planning + Contrat
- Régression apparue depuis mise en production V2024.2 le 25/01/2026
- Fonctionnait correctement en V2024.1

Scénario partiel fourni par client:
1. Générer la paie du mois
2. Constater des écarts sur net à payer

Informations manquantes:
- Scénario exact de reproduction non fourni
- Captures d'écran manquantes
- Logs serveur non transmis

URGENT: Blocage production pour tous les clients.`,
    category: 'Paie',
    priority: 'urgent',
    status: 'reopened',
    created_at: '2026-01-26T08:00:00.000Z',
    updated_at: '2026-02-09T16:45:00.000Z',
    comments: [
      { user: 'Support L1', text: 'URGENT - Client bloqué en production', created_at: '2026-01-26T08:30:00.000Z' },
      { user: 'Support L2', text: 'Escalade immédiate au L3', created_at: '2026-01-26T09:00:00.000Z' },
      { user: 'Support L3', text: 'Régression confirmée, rollback impossible', created_at: '2026-01-26T11:00:00.000Z' },
      { user: 'Expert Paie', text: 'Impact financier majeur, DSN à risque', created_at: '2026-01-27T10:00:00.000Z' },
      { user: 'Dev Lead', text: 'Analyse des commits entre V2024.1 et V2024.2', created_at: '2026-01-28T14:00:00.000Z' },
      { user: 'Client', text: 'Demande de compensation financière', created_at: '2026-02-01T09:00:00.000Z' },
      { user: 'Dev', text: 'Correctif proposé en test', created_at: '2026-02-05T16:00:00.000Z' },
      { user: 'QA', text: 'Tests NOK, ticket réouvert', created_at: '2026-02-08T10:00:00.000Z' }
    ],
    history: [
      { field: 'priority', old_value: 'high', new_value: 'urgent', changed_at: '2026-01-26T09:00:00.000Z' },
      { field: 'status', old_value: 'new', new_value: 'assigned', changed_at: '2026-01-26T09:00:00.000Z' },
      { field: 'status', old_value: 'assigned', new_value: 'resolved', changed_at: '2026-02-05T16:00:00.000Z' },
      { field: 'status', old_value: 'resolved', new_value: 'reopened', changed_at: '2026-02-08T10:00:00.000Z' }
    ]
  },

  // === Ticket Difficulté 5/5 (Score brut 9+) ===
  nightmare_ticket: {
    id: '112000',
    source: 'mantis',
    title: 'Corruption données Planning + Absence après migration V2024.3 - Multi-client bloqué',
    description: `CRITIQUE: Corruption massive de données Planning et Absence après migration V2024.3.

IMPACT:
- 50+ clients bloqués en production
- Perte de données planning pour 10 000+ salariés
- Absences non comptabilisées → impact paie imminent
- Risque de non-conformité URSSAF et DSN
- Risque juridique (salaires incorrects)

SYMPTÔMES:
- Planning: horaires affichés incohérents, créneaux doublons, calendrier corrompu
- Absence: CP/RTT perdus, soldes incorrects, historique absent
- Paie: calcul impossible car données absences manquantes
- RH: dossiers salariés incomplets
- Contrat: dates de fin incorrectes

CONTEXTE TECHNIQUE:
- Migration V2024.3 effectuée le 01/02/2026
- Script de migration SQL échoué partiellement
- Rollback impossible (données déjà modifiées)
- Backup restauré mais données corrompues persistent
- Modules impactés: Planning, Absence, Paie, RH, Contrat

SCENARIO NON DISPONIBLE (impossible à reproduire, corruption déjà présente)

HISTORIQUE:
- Ticket ouvert 5 fois déjà
- 3 correctifs échoués
- Intervention expert BDD nécessaire
- Audit complet de la base de données requis

URGENCE ABSOLUE: Clients menacent de résiliation de contrat.`,
    category: 'Planning',
    priority: 'urgent',
    status: 'reopened',
    created_at: '2026-02-01T07:00:00.000Z',
    updated_at: '2026-02-09T18:00:00.000Z',
    comments: [
      { user: 'Support L1', text: 'ALERTE ROUGE - 50 clients impactés', created_at: '2026-02-01T07:15:00.000Z' },
      { user: 'Support L2', text: 'Escalade urgente Direction Technique', created_at: '2026-02-01T08:00:00.000Z' },
      { user: 'CTO', text: 'Cellule de crise activée', created_at: '2026-02-01T09:00:00.000Z' },
      { user: 'Expert BDD', text: 'Corruption détectée sur 15 tables', created_at: '2026-02-01T14:00:00.000Z' },
      { user: 'Expert Planning', text: 'Algorithme recalcul planning défaillant', created_at: '2026-02-02T10:00:00.000Z' },
      { user: 'Expert Absence', text: 'Soldes CP perdus, recalcul manuel requis', created_at: '2026-02-02T11:00:00.000Z' },
      { user: 'Expert Paie', text: 'BLOCAGE PAIE - Impossible de calculer sans absences', created_at: '2026-02-03T09:00:00.000Z' },
      { user: 'Dev Lead', text: 'Script de réparation SQL en cours', created_at: '2026-02-04T16:00:00.000Z' },
      { user: 'QA', text: 'Tests KO - données toujours corrompues', created_at: '2026-02-06T10:00:00.000Z' },
      { user: 'Client VIP', text: 'Demande résiliation contrat si non résolu sous 48h', created_at: '2026-02-07T14:00:00.000Z' },
      { user: 'Direction', text: 'Réunion crise prévue demain 9h', created_at: '2026-02-08T17:00:00.000Z' },
      { user: 'Expert BDD', text: 'Nouveau script proposé, test en cours', created_at: '2026-02-09T15:00:00.000Z' }
    ],
    history: [
      { field: 'priority', old_value: 'high', new_value: 'urgent', changed_at: '2026-02-01T08:00:00.000Z' },
      { field: 'status', old_value: 'new', new_value: 'assigned', changed_at: '2026-02-01T09:00:00.000Z' },
      { field: 'status', old_value: 'assigned', new_value: 'reopened', changed_at: '2026-02-02T10:00:00.000Z' },
      { field: 'status', old_value: 'reopened', new_value: 'assigned', changed_at: '2026-02-04T16:00:00.000Z' },
      { field: 'status', old_value: 'assigned', new_value: 'reopened', changed_at: '2026-02-06T10:00:00.000Z' },
      { field: 'status', old_value: 'reopened', new_value: 'assigned', changed_at: '2026-02-09T15:00:00.000Z' }
    ]
  }
};

export default REALISTIC_TICKETS;
