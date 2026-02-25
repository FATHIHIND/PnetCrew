/**
 * Configuration des règles d'analyse SmartTicket
 * Mots-clés, patterns, et heuristiques pour PeopleNet
 */

export const FUNCTIONAL_AREAS = {
  PAIE: {
    keywords: ['paie', 'salaire', 'bulletin', 'cotisation', 'charges', 'dads', 'dsn', 'sepa', 'virement', 'primes', 'heures sup'],
    modules: ['Paie', 'Rémunération'],
    complexity_multiplier: 1.3 // La paie est complexe
  },
  ABSENCE: {
    keywords: ['absence', 'congé', 'cp', 'rtt', 'maladie', 'arrêt', 'repos', 'férié', 'solde'],
    modules: ['Absence', 'Gestion temps'],
    complexity_multiplier: 1.1
  },
  PLANNING: {
    keywords: ['planning', 'horaire', 'shift', 'roulement', 'équipe', 'astreinte', 'pointage'],
    modules: ['Planning', 'Gestion temps'],
    complexity_multiplier: 1.2
  },
  CONTRAT: {
    keywords: ['contrat', 'embauche', 'démission', 'licenciement', 'avenant', 'cdd', 'cdi', 'intérim'],
    modules: ['Contrat', 'RH'],
    complexity_multiplier: 1.0
  },
  FORMATION: {
    keywords: ['formation', 'cpf', 'entretien annuel', 'compétence', 'certification'],
    modules: ['Formation', 'Carrière'],
    complexity_multiplier: 0.9
  },
  MULTI_MODULE: {
    keywords: ['multi-contrat', 'plusieurs modules', 'impact global', 'dépendance'],
    complexity_multiplier: 1.5 // Multi-modules = très complexe
  }
};

export const COMPLEXITY_SIGNALS = {
  // Mots-clés indiquant une haute complexité
  HIGH_COMPLEXITY: [
    'incohérence',
    'régression',
    'critique',
    'bloquant',
    'multi-client',
    'multi-contrat',
    'plusieurs modules',
    'impact global',
    'corruption de données',
    'perte de données',
    'calcul incorrect',
    'doublon',
    'cumul',
    'depuis mise à jour',
    'ne fonctionne plus'
  ],

  // Mots-clés indiquant une complexité moyenne
  MEDIUM_COMPLEXITY: [
    'intermittent',
    'parfois',
    'aléatoire',
    'selon contexte',
    'conditions spécifiques',
    'certains clients',
    'quelques cas'
  ],

  // Signaux de faible complexité
  LOW_COMPLEXITY: [
    'affichage',
    'libellé',
    'traduction',
    'orthographe',
    'alignement',
    'couleur',
    'cosmétique'
  ]
};

export const RISK_PATTERNS = {
  // Risques fonctionnels élevés
  DATA_INTEGRITY: [
    'perte de données',
    'corruption',
    'doublon',
    'écrasement',
    'suppression',
    'inconsistance'
  ],

  FINANCIAL_IMPACT: [
    'calcul incorrect',
    'montant erroné',
    'paie fausse',
    'charges incorrectes',
    'export comptable',
    'impact financier'
  ],

  LEGAL_COMPLIANCE: [
    'non-conformité',
    'dads',
    'dsn',
    'urssaf',
    'inspection travail',
    'légal',
    'réglementation'
  ],

  MULTI_CLIENT: [
    'tous les clients',
    'plusieurs clients',
    'multi-client',
    'généralisé',
    'impact large'
  ],

  REGRESSION: [
    'régression',
    'depuis mise à jour',
    'fonctionnait avant',
    'nouvelle version',
    'après patch'
  ]
};

export const MISSING_INFO_PATTERNS = [
  {
    pattern: /pas de (capture|screenshot|copie écran)/i,
    type: 'screenshot',
    message: 'Capture d\'écran manquante'
  },
  {
    pattern: /comment reproduire|étapes|scénario/i,
    missing: true,
    type: 'scenario',
    message: 'Scénario de reproduction non fourni'
  },
  {
    pattern: /quel client|quelle société/i,
    type: 'client_info',
    message: 'Information client manquante'
  },
  {
    pattern: /quelle version|environnement/i,
    type: 'environment',
    message: 'Information d\'environnement manquante'
  }
];

export const EXPERT_TRIGGERS = {
  // Situations nécessitant un expert paie
  PAIE_EXPERT: [
    'calcul paie',
    'cotisations',
    'charges sociales',
    'dads',
    'dsn',
    'export comptable'
  ],

  // Situations nécessitant un expert planning
  PLANNING_EXPERT: [
    'algorithme planning',
    'optimisation horaire',
    'contraintes planning',
    'roulement équipe'
  ],

  // Situations nécessitant un expert base de données
  DATABASE_EXPERT: [
    'requête sql',
    'performance base',
    'corruption données',
    'migration'
  ],

  // Situations nécessitant un expert technique
  TECH_EXPERT: [
    'erreur serveur',
    'timeout',
    'memory leak',
    'crash',
    'stack trace'
  ]
};

export const DIFFICULTY_THRESHOLDS = {
  // Nombre de mots dans la description
  DESCRIPTION_LENGTH: {
    VERY_LONG: 500,  // > 500 mots = +1 difficulté
    LONG: 200,       // > 200 mots = +0.5
    SHORT: 50        // < 50 mots = -0.5 (peut-être trop vague)
  },

  // Nombre de commentaires
  COMMENTS_COUNT: {
    MANY: 10,        // > 10 commentaires = +1
    MODERATE: 5,     // > 5 commentaires = +0.5
    FEW: 2           // < 2 commentaires = ticket récent
  },

  // Nombre de réouvertures dans l'historique
  REOPENINGS: {
    MULTIPLE: 3,     // > 3 réouvertures = +2 (très problématique)
    ONCE: 1          // 1 réouverture = +0.5
  },

  // Âge du ticket (jours)
  AGE_DAYS: {
    VERY_OLD: 30,    // > 30 jours = +1 (ticket bloqué)
    OLD: 14,         // > 14 jours = +0.5
    RECENT: 3        // < 3 jours = ticket récent
  }
};

export const PRIORITY_WEIGHTS = {
  'urgent': 1.5,
  'high': 1.2,
  'normal': 1.0,
  'low': 0.8
};

export const ACTION_TEMPLATES = {
  MISSING_INFO: {
    fr: 'Demander au client : {missing_info}',
    en: 'Request from client: {missing_info}'
  },
  EXPERT_NEEDED: {
    fr: 'Contacter l\'expert {expert_type} : {reason}',
    en: 'Contact {expert_type} expert: {reason}'
  },
  REPRODUCE_FIRST: {
    fr: 'Reproduire le problème en environnement de test avec le scénario fourni',
    en: 'Reproduce the issue in test environment with provided scenario'
  },
  CHECK_DEPENDENCIES: {
    fr: 'Vérifier les dépendances entre {modules}',
    en: 'Check dependencies between {modules}'
  },
  ESCALATE: {
    fr: 'Escalader au support L3 - complexité élevée',
    en: 'Escalate to L3 support - high complexity'
  }
};

export default {
  FUNCTIONAL_AREAS,
  COMPLEXITY_SIGNALS,
  RISK_PATTERNS,
  MISSING_INFO_PATTERNS,
  EXPERT_TRIGGERS,
  DIFFICULTY_THRESHOLDS,
  PRIORITY_WEIGHTS,
  ACTION_TEMPLATES
};
