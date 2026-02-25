# 🎟️ SmartTicket - Analyse Automatique de Tickets

## 📋 Vue d'ensemble

**SmartTicket** analyse automatiquement les tickets difficiles depuis Mantis et PMTalk pour :
- Calculer un score de difficulté (1 à 5)
- Détecter les risques fonctionnels
- Identifier les informations manquantes
- Suggérer des actions
- Prioriser les tickets par complexité

---

## 🏗️ Architecture

```
smartticket/
├── connectors/        # Connexions Mantis & PMTalk
│   ├── mantis.js
│   └── pmtalk.js
├── analyzers/         # Moteurs d'analyse
│   ├── difficulty.js  # Score de difficulté (1-5)
│   ├── risk.js        # Détection risques
│   └── summarizer.js  # Génération résumés
├── models/            # Modèles de données
├── services/          # Service principal
│   └── smartticket.js
├── routes/            # API REST
│   └── smartticket.routes.js
├── config/            # Configuration & règles
│   └── rules.js
└── examples/          # Exemples d'utilisation
```

---

## 🚀 Démarrage Rapide

### **1. Configuration**

Créer un fichier `.env` à la racine :

```env
# Mantis
MANTIS_URL=https://mantis.example.com
MANTIS_API_TOKEN=your_token
# OU
MANTIS_USERNAME=your_username
MANTIS_PASSWORD=your_password

# PMTalk
PMTALK_URL=https://pmtalk.example.com
PMTALK_API_KEY=your_api_key
PMTALK_WORKSPACE=your_workspace

# Azure OpenAI (optionnel pour résumés IA)
AZURE_OPENAI_ENDPOINT=https://your-instance.openai.azure.com/
AZURE_OPENAI_API_KEY=your_key
AZURE_OPENAI_DEPLOYMENT=gpt-4

# Mode développement (utilise des données mock)
NODE_ENV=development
```

### **2. Démarrer le Serveur**

```bash
cd server
npm run dev
```

### **3. Tester**

```bash
# Health check
curl http://localhost:8787/smartticket/health

# Analyser un ticket
curl -X POST http://localhost:8787/smartticket/analyze \
  -H "Content-Type: application/json" \
  -d '{"ticketId": "12345", "source": "mantis"}'
```

---

## 📡 API Endpoints

### **1. POST /smartticket/analyze**

Analyse un ticket spécifique.

**Request:**
```json
{
  "ticketId": "12345",
  "source": "mantis"  // ou "pmtalk"
}
```

**Response:**
```json
{
  "status": "success",
  "ticketId": "12345",
  "source": "mantis",
  "title": "Incohérence calcul absence multi-contrats",
  "difficultyScore": 4.5,
  "difficultyLevel": "critical",
  "riskLevel": "high",
  "functionalArea": "Absence",
  "missingInformation": [
    "Scénario de reproduction non fourni",
    "Aucune capture d'écran fournie"
  ],
  "risks": [
    "Risque d'intégrité des données",
    "Plusieurs clients affectés"
  ],
  "expertsNeeded": ["paie_expert", "planning_expert"],
  "dependencies": [
    {
      "type": "multi_module",
      "modules": ["absence", "paie"],
      "impact": "high"
    }
  ],
  "suggestedAction": "URGENT: Demander au client scénario de reproduction et contacter l'expert planning",
  "summary": "Ticket #12345 (mantis) - Priorité urgent\nProblème Absence : Incohérence calcul absence multi-contrats...",
  "keyPoints": [
    "[Absence] Incohérence calcul absence multi-contrats",
    "Complexité critical (score 4.5/5)",
    "Risques : Risque d'intégrité des données",
    "Experts requis : paie_expert, planning_expert"
  ],
  "metadata": {
    "priority": "urgent",
    "status": "assigned",
    "created_at": "2026-02-05T10:00:00.000Z",
    "updated_at": "2026-02-10T14:30:00.000Z",
    "comments_count": 3,
    "age_days": 5
  },
  "analyzed_at": "2026-02-10T15:00:00.000Z"
}
```

---

### **2. GET /smartticket/scan-all**

Scanne tous les tickets ouverts.

**Parameters:**
- `source` (query) : "mantis", "pmtalk", ou "all" (défaut: "all")
- `limit` (query) : Nombre max de tickets (défaut: 50)

**Example:**
```bash
curl "http://localhost:8787/smartticket/scan-all?source=mantis&limit=20"
```

**Response:**
```json
{
  "status": "success",
  "total": 15,
  "analyzed_at": "2026-02-10T15:00:00.000Z",
  "tickets": [
    {
      "ticketId": "12345",
      "source": "mantis",
      "title": "Incohérence calcul absence",
      "difficultyScore": 4.5,
      "difficultyLevel": "critical",
      "riskLevel": "high",
      "functionalArea": "Absence",
      "suggestedAction": "URGENT: ...",
      "summary": "..."
    },
    {
      "ticketId": "12346",
      "difficultyScore": 3.5,
      ...
    }
  ]
}
```

---

### **3. POST /smartticket/analyze-batch**

Analyse plusieurs tickets en une requête.

**Request:**
```json
{
  "tickets": [
    { "ticketId": "12345", "source": "mantis" },
    { "ticketId": "12346", "source": "mantis" },
    { "ticketId": "PM-789", "source": "pmtalk" }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "total": 3,
  "analyzed": 3,
  "failed": 0,
  "tickets": [
    { "ticketId": "12345", "difficultyScore": 4.5, ... },
    { "ticketId": "PM-789", "difficultyScore": 4.0, ... },
    { "ticketId": "12346", "difficultyScore": 3.5, ... }
  ]
}
```

---

## 🧮 Analyse de Difficulté

### **Facteurs Pris en Compte**

| Facteur | Impact | Description |
|---------|--------|-------------|
| **Longueur description** | +0.5 à +1.0 | Plus de 500 mots = complexe |
| **Mots-clés complexité** | +0.3 à +0.5 | "incohérence", "régression", "multi-client" |
| **Nombre commentaires** | +0.5 à +1.0 | >10 commentaires = échanges longs |
| **Réouvertures** | +0.5 à +2.0 | >3 réouvertures = très problématique |
| **Âge du ticket** | +0.5 à +1.0 | >30 jours = bloqué |
| **Domaine fonctionnel** | ×1.0 à ×1.5 | Paie ×1.3, Multi-modules ×1.5 |
| **Priorité** | ×0.8 à ×1.5 | Urgent ×1.5 |

### **Score Final**

- **1.0 - 1.5** : Low (cosmétique, simple)
- **1.5 - 2.5** : Medium (standard)
- **2.5 - 3.5** : High (complexe)
- **3.5 - 4.5** : Very High (très complexe)
- **4.5 - 5.0** : Critical (extrêmement complexe)

---

## ⚠️ Analyse de Risques

### **Types de Risques Détectés**

| Risque | Sévérité | Mots-clés |
|--------|----------|-----------|
| **DATA_INTEGRITY** | Critical | "perte de données", "corruption", "doublon" |
| **FINANCIAL_IMPACT** | Critical | "calcul incorrect", "paie fausse", "charges" |
| **LEGAL_COMPLIANCE** | Critical | "non-conformité", "URSSAF", "DSN" |
| **MULTI_CLIENT** | High | "tous les clients", "généralisé" |
| **REGRESSION** | High | "depuis mise à jour", "fonctionnait avant" |

### **Experts Requis**

- **PAIE_EXPERT** : Calculs paie, cotisations, DSN
- **PLANNING_EXPERT** : Algorithmes planning, contraintes
- **DATABASE_EXPERT** : Requêtes SQL, performance, migration
- **TECH_EXPERT** : Erreurs serveur, timeout, crash

---

## 📝 Exemples Concrets

### **Exemple 1 : Ticket Simple (Score 1.5)**

**Input:**
```json
{
  "id": "100",
  "title": "Alignement colonne dans planning",
  "description": "La colonne 'Nom' n'est pas alignée correctement",
  "category": "Planning",
  "priority": "low",
  "comments": []
}
```

**Output:**
```json
{
  "difficultyScore": 1.5,
  "difficultyLevel": "low",
  "riskLevel": "low",
  "functionalArea": "Planning",
  "suggestedAction": "Reproduire le problème en environnement de test"
}
```

---

### **Exemple 2 : Ticket Complexe (Score 4.5)**

**Input:**
```json
{
  "id": "12345",
  "title": "Incohérence calcul absence multi-contrats",
  "description": "Le calcul des absences ne fonctionne pas pour les salariés multi-contrats. Impact: 15 clients. Régression depuis V2024.1. Les absences sont comptabilisées en double et impactent la paie.",
  "category": "Absence",
  "priority": "urgent",
  "comments": [
    { "text": "Escaladé au L2" },
    { "text": "Attente expert paie" },
    { "text": "Client mécontent" }
  ],
  "history": [
    { "field": "status", "old_value": "closed", "new_value": "reopened" },
    { "field": "priority", "old_value": "normal", "new_value": "urgent" }
  ],
  "created_at": "2026-01-15T10:00:00.000Z"
}
```

**Output:**
```json
{
  "difficultyScore": 4.5,
  "difficultyLevel": "critical",
  "riskLevel": "critical",
  "functionalArea": "Absence",
  "risks": [
    "Risque d'intégrité des données",
    "Impact financier pour le client",
    "Plusieurs clients affectés",
    "Régression fonctionnelle"
  ],
  "expertsNeeded": ["paie_expert", "planning_expert"],
  "missingInformation": [
    "Scénario de reproduction non fourni"
  ],
  "suggestedAction": "ESCALADER IMMÉDIATEMENT au L3 - Risques critiques : data_integrity, financial_impact",
  "dependencies": [
    {
      "type": "multi_module",
      "modules": ["absence", "paie"],
      "impact": "high"
    }
  ]
}
```

---

## 🧪 Mode Développement

En développement (`NODE_ENV=development`), des données mock sont utilisées :

```bash
# Pas besoin de configuration Mantis/PMTalk
export NODE_ENV=development
npm run dev

# Tester avec des tickets mock
curl -X POST http://localhost:8787/smartticket/analyze \
  -H "Content-Type: application/json" \
  -d '{"ticketId": "12345", "source": "mantis"}'
```

---

## 🤖 Intégration Azure OpenAI (Optionnel)

Activez l'IA pour des résumés plus intelligents :

```env
AZURE_OPENAI_ENDPOINT=https://your-instance.openai.azure.com/
AZURE_OPENAI_API_KEY=your_key
AZURE_OPENAI_DEPLOYMENT=gpt-4
```

**Avantages :**
- Résumés plus naturels
- Détection de nuances complexes
- Suggestions d'actions plus précises

---

## 📊 Cas d'Usage

### **1. Dashboard de Tickets Difficiles**

```javascript
// Récupérer les 10 tickets les plus difficiles
const response = await fetch('http://localhost:8787/smartticket/scan-all?limit=100');
const data = await response.json();

const top10 = data.tickets.slice(0, 10);
// Afficher dans un dashboard
```

### **2. Alert

e Auto pour Tickets Critiques**

```javascript
// Analyser un nouveau ticket
const analysis = await analyzeTicket(ticketId);

if (analysis.riskLevel === 'critical') {
  sendAlert('Nouveau ticket critique détecté!', analysis);
}
```

### **3. Routage Intelligent**

```javascript
// Router automatiquement vers le bon expert
const analysis = await analyzeTicket(ticketId);

if (analysis.expertsNeeded.includes('paie_expert')) {
  assignToExpert(ticketId, 'Expert Paie');
}
```

---

## ✅ Tests

```bash
# Test health check
npm run test:smartticket:health

# Test analyse simple
npm run test:smartticket:analyze

# Test scan complet
npm run test:smartticket:scan
```

---

## 🎯 Prochaines Étapes

- [x] Connecteurs Mantis & PMTalk
- [x] Analyse difficulté (1-5)
- [x] Analyse risques
- [x] Génération résumés
- [x] API REST
- [ ] Interface web (dashboard)
- [ ] Webhooks pour notifications
- [ ] ML pour améliorer les prédictions

---

**Version:** 1.0.0
**Auteur:** Claude Sonnet 4.5 via Claude Code CLI
**Date:** 2026-02-10
