# Workflow n8n SmartContext V3.0

## 📋 Vue d'ensemble

Workflow n8n mis à jour pour supporter le **pipeline SmartTicket V3.0** avec analyse complète en 4 étapes séquentielles.

### ✨ Nouveautés V3.0

- ✅ **Pipeline SmartTicket complet** - Analyse en 4 étapes (complétude, résumé, difficulté, similarité)
- ✅ **Barrière de complétude** - Arrêt automatique si ticket rejeté (score < 55)
- ✅ **Tickets similaires** - Recherche et explications intelligentes
- ❌ **Sections supprimées** - FAQ et erreurs fréquentes retirées du système

---

## 🔧 Installation

### 1. Importer le workflow dans n8n

```bash
# Dans n8n
# 1. Aller dans "Workflows"
# 2. Cliquer sur "Import from File"
# 3. Sélectionner: n8n/workflow.smartcontext.json
```

### 2. Configurer les endpoints

Par défaut, le workflow pointe vers `http://localhost:8787`. Si votre serveur utilise un autre port :

```javascript
// Dans chaque nœud HTTP Request, modifier l'URL :
http://localhost:VOTRE_PORT/...
```

---

## 📡 Endpoints disponibles

### 1. Upload de documentation

**Webhook:** `POST /smartcontext/upload`

**Body:**
```json
{
  "key": "jira",
  "title": "Guide Jira",
  "urlMatch": ["jira.atlassian.net", "*.jira.com"],
  "docUrlOrPath": "docs/jira_guide.pdf",
  "tags": ["process", "workflow"]
}
```

**Actions:**
- Normalise les métadonnées
- Appelle `/ingest` pour mettre à jour le mapping
- Appelle `/summarize` pour générer le résumé IA
- Retourne le statut complet

---

### 2. Auto-Summarize (page quelconque)

**Webhook:** `POST /smartcontext/auto-summarize`

**Body:**
```json
{
  "url": "https://example.com/page",
  "text": "Contenu de la page...",
  "html": "<html>...</html>"
}
```

**Actions:**
- Prépare les données
- Appelle `/auto-summarize` pour générer un résumé temporaire
- Retourne le résumé + checklist (sans FAQ ni erreurs)

---

### 3. 🆕 Analyse SmartTicket (Pipeline V3.0)

**Webhook:** `POST /smartcontext/smartticket/analyze`

**Body:**
```json
{
  "url": "https://mantis.example.com/view.php?id=111525",
  "ticketId": "111525",
  "source": "mantis"
}
```

**Actions:**
- Prépare les données
- Appelle `/smartticket/full-analysis?url=...`
- Exécute le pipeline complet en 4 étapes :
  1. **Complétude** (barrière si score < 55)
  2. **Résumé IA** (si accepté)
  3. **Difficulté** (si accepté)
  4. **Similarité** (si accepté)

**Réponse:**
```json
{
  "status": "accepted_complete",
  "workflow": "smartticket-analysis",
  "pipeline_version": "3.0",

  "completeness": {
    "score": 85,
    "status": "complete",
    "message": "Ticket complet et bien structuré",
    "missingElements": []
  },

  "summary": {
    "summary": "Résumé du ticket...",
    "checklist": ["Item 1", "Item 2"]
  },

  "difficulty": {
    "level": "Complexe",
    "score": 7.2,
    "priority": "Urgent",
    "modules": ["Paie", "RH"],
    "risks": ["Risque 1", "Risque 2"],
    "recommendation": "Recommandation..."
  },

  "similar_tickets": [
    {
      "id": "112020",
      "similarity": 87,
      "title": "Ticket similaire...",
      "explanation": "Modules communs : Paie • Mots-clés : calcul, erreur"
    }
  ],

  "ticket_rejected": false,
  "timestamp": "2026-02-10T12:00:00.000Z"
}
```

**Si ticket rejeté (score < 55):**
```json
{
  "status": "rejected",
  "ticket_rejected": true,

  "completeness": {
    "score": 45,
    "status": "rejected",
    "message": "Ticket incomplet - informations critiques manquantes",
    "missingElements": ["Description détaillée", "Étapes de reproduction"]
  },

  "summary": null,
  "difficulty": null,
  "similar_tickets": []
}
```

---

## 🎯 Cas d'usage

### Exemple 1 : Automatiser l'ajout de documentation

```bash
curl -X POST http://localhost:5678/webhook/smartcontext/upload \
  -H "Content-Type: application/json" \
  -d '{
    "key": "github",
    "title": "Cheatsheet GitHub",
    "urlMatch": ["github.com"],
    "docUrlOrPath": "docs/github.pdf"
  }'
```

### Exemple 2 : Analyser un ticket Mantis

```bash
curl -X POST http://localhost:5678/webhook/smartcontext/smartticket/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://mantis.example.com/view.php?id=111525",
    "ticketId": "111525",
    "source": "mantis"
  }'
```

### Exemple 3 : Générer un résumé pour une page web

```bash
curl -X POST http://localhost:5678/webhook/smartcontext/auto-summarize \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://docs.example.com/guide",
    "text": "Contenu de la documentation..."
  }'
```

---

## 🔄 Pipeline SmartTicket V3.0 - Détails

### Étape 1 : Complétude (Barrière)

**Endpoint:** `/smartticket/full-analysis` (interne)

**Critères d'évaluation:**
- Titre présent et descriptif
- Description détaillée
- Catégorie définie
- Priorité assignée
- Étapes de reproduction (si bug)
- Impact business documenté

**Seuils:**
- `< 55` → **REJETÉ** - Arrêt du pipeline
- `55-79` → **INCOMPLET** - Continue mais signalé
- `≥ 80` → **COMPLET** - Continue normalement

### Étape 2 : Résumé IA (si accepté)

Génère via Azure OpenAI :
- Résumé contextuel (120-180 mots)
- Checklist d'actions (5 items)

### Étape 3 : Difficulté (si accepté)

Analyse la complexité du ticket :
- Score de difficulté (0-10)
- Niveau (Simple, Modéré, Complexe, Critique, Cauchemar)
- Priorité
- Modules impactés
- Risques détectés
- Recommandation

### Étape 4 : Similarité (si accepté)

Recherche de tickets similaires avec explications intelligentes :
- 5 critères d'analyse (modules, mots-clés, catégorie, anomalies, patterns)
- Score de similarité (0-100%)
- Explications détaillées par ticket

---

## 🧪 Tests

### Test 1 : Vérifier le serveur

```bash
curl http://localhost:8787/health
```

### Test 2 : Workflow complet (ticket accepté)

```bash
# Analyser un ticket complet
curl -X POST http://localhost:5678/webhook/smartcontext/smartticket/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://mantis.example.com/view.php?id=111525"
  }'

# Réponse attendue : status = "accepted_complete" avec toutes les sections
```

### Test 3 : Workflow avec ticket rejeté

```bash
# Analyser un ticket incomplet
curl -X POST http://localhost:5678/webhook/smartcontext/smartticket/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://mantis.example.com/view.php?id=TEST-001"
  }'

# Réponse attendue : status = "rejected" avec seulement completeness
```

---

## 📊 Monitoring

### Logs n8n

Les logs sont visibles dans l'interface n8n :
1. Cliquer sur le workflow
2. Onglet "Executions"
3. Sélectionner une exécution pour voir le détail

### Logs serveur

```bash
# Dans le terminal où tourne le serveur
cd server
npm run dev

# Les logs affichent les appels API et les résultats
```

---

## 🚀 Amélioration future

### Idées d'évolution

1. **Gestion d'erreurs avancée**
   - Retry automatique en cas d'échec
   - Notifications Slack/Email si erreur

2. **Batch processing**
   - Analyser plusieurs tickets en une fois
   - Endpoint `/smartticket/analyze-batch`

3. **Cache intelligent**
   - Éviter de re-analyser les mêmes tickets
   - Invalider le cache après X jours

4. **Webhooks sortants**
   - Notifier un système externe après analyse
   - Intégration Jira/Mantis pour mise à jour auto

---

## 📝 Notes importantes

### Changements V3.0

- ❌ **Sections supprimées** : `common_errors` et `faqs` ne sont plus générées
- ✅ **Nouveau champ** : `completeness` avec barrière de validation
- ✅ **Nouveau champ** : `similar_tickets` avec explications intelligentes
- ✅ **Pipeline séquentiel** : Arrêt immédiat si ticket rejeté

### Compatibilité

- **n8n version** : Testé sur n8n v1.0+
- **Node.js version** : Serveur nécessite Node.js 18+
- **Azure OpenAI** : Optionnel (fonctionne sans si résumés désactivés)

---

## 🆘 Support

### Problèmes courants

**Erreur : "Cannot connect to localhost:8787"**
- Vérifier que le serveur est démarré : `cd server && npm run dev`

**Erreur : "Ticket not found"**
- Vérifier que l'ID du ticket existe dans les exemples (`REALISTIC_TICKETS` ou `PIPELINE_TEST_TICKETS`)

**Réponse vide pour similarité**
- Normal si la base de tickets mock est vide
- Ajouter des tickets dans `server/smartticket/analyzers/similarity.js`

### Contact

- Issues GitHub : [Créer une issue](https://github.com/votre-repo/issues)
- Documentation serveur : Voir `README.md` à la racine du projet

---

**Version:** 3.0.0
**Date:** 2026-02-10
**Auteur:** PnetCrew
