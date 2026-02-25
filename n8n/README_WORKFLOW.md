# 📋 Workflow n8n SmartContext Doc v2.2

## 🎯 Vue d'ensemble

Workflow n8n complet avec **3 workflows automatisés** pour SmartContext Doc :

1. **Upload & Summarize** : Upload de documentation + génération résumé IA
2. **Auto Summarize** : Génération automatique de résumé pour n'importe quelle URL
3. **Export PDF** : Export de résumés en PDF avec encodage UTF-8

---

## 📊 Architecture du Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                  WORKFLOW 1: Upload & Summarize              │
├─────────────────────────────────────────────────────────────┤
│  Webhook Upload                                             │
│       ↓                                                      │
│  Normalize Metadata                                          │
│       ↓                                                      │
│  ┌─────────────┐         ┌──────────────────┐              │
│  │ HTTP Ingest │         │ HTTP Summarize   │              │
│  └─────────────┘         └──────────────────┘              │
│       ↓                           ↓                         │
│  Build Upload Response                                       │
│       ↓                                                      │
│  Respond JSON                                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               WORKFLOW 2: Auto Summarize                     │
├─────────────────────────────────────────────────────────────┤
│  Webhook Auto Summarize                                     │
│       ↓                                                      │
│  Prepare Auto Summarize                                      │
│       ↓                                                      │
│  HTTP Auto Summarize (/auto-summarize)                      │
│       ↓                                                      │
│  Build Auto Summary Response                                 │
│       ↓                                                      │
│  Respond JSON                                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  WORKFLOW 3: Export PDF                      │
├─────────────────────────────────────────────────────────────┤
│  Webhook Export PDF                                         │
│       ↓                                                      │
│  Prepare PDF Export                                          │
│       ↓                                                      │
│  HTTP Export PDF (/export/pdf)                              │
│       ↓                                                      │
│  Build PDF Response                                          │
│       ↓                                                      │
│  Respond Binary (PDF)                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Installation

### **1. Importer dans n8n**

```bash
# Méthode 1 : Via interface n8n
1. Ouvrir n8n (http://localhost:5678)
2. Cliquer "Workflows" → "Import from File"
3. Sélectionner n8n/workflow.smartcontext.json
4. Cliquer "Import"

# Méthode 2 : Via CLI
n8n import:workflow --input=n8n/workflow.smartcontext.json
```

### **2. Activer le Workflow**

```bash
1. Ouvrir le workflow "SmartContext Doc - Workflow Complet v2.2"
2. Cliquer sur le toggle "Active" en haut à droite
3. Le workflow est maintenant en écoute sur les webhooks
```

### **3. Vérifier les URLs des Webhooks**

```bash
# Les URLs seront affichées dans n8n
Webhook 1 (Upload):        http://localhost:5678/webhook/smartcontext/upload
Webhook 2 (Auto Summarize): http://localhost:5678/webhook/smartcontext/auto-summarize
Webhook 3 (Export PDF):     http://localhost:5678/webhook/smartcontext/export-pdf
```

---

## 📝 Utilisation

### **Workflow 1 : Upload & Summarize**

Uploader une documentation et générer automatiquement un résumé IA.

**Endpoint :** `POST http://localhost:5678/webhook/smartcontext/upload`

**Body (JSON) :**
```json
{
  "key": "notion",
  "title": "Guide Notion",
  "urlMatch": ["notion.so", "notion.com"],
  "docUrlOrPath": "docs/notion_guide.pdf",
  "tags": ["productivity", "collaboration"]
}
```

**Réponse :**
```json
{
  "status": "success",
  "workflow": "upload",
  "key": "notion",
  "title": "Guide Notion",
  "mapping_updated": true,
  "summary_generated": true,
  "summary_excerpt": "Notion est un outil tout-en-un pour...",
  "endpoints_called": ["/ingest", "/summarize"],
  "timestamp": "2026-02-10T14:30:00.000Z"
}
```

**Test avec curl :**
```bash
curl -X POST http://localhost:5678/webhook/smartcontext/upload \
  -H "Content-Type: application/json" \
  -d '{
    "key": "notion",
    "title": "Guide Notion",
    "urlMatch": ["notion.so"],
    "docUrlOrPath": "docs/notion.pdf"
  }'
```

---

### **Workflow 2 : Auto Summarize**

Générer automatiquement un résumé IA pour n'importe quelle URL (sans mapping).

**Endpoint :** `POST http://localhost:5678/webhook/smartcontext/auto-summarize`

**Body (JSON) :**
```json
{
  "url": "https://example.com",
  "text": "Contenu textuel extrait de la page...",
  "html": "<html>...</html>"
}
```

**Réponse :**
```json
{
  "status": "success",
  "workflow": "auto-summarize",
  "url": "https://example.com",
  "summary_generated": true,
  "summary": "Cette page présente...",
  "checklist": [
    "Action 1 à effectuer",
    "Action 2 à effectuer"
  ],
  "common_errors": [
    "Erreur fréquente 1",
    "Erreur fréquente 2"
  ],
  "faqs": [
    {
      "question": "Question 1?",
      "answer": "Réponse 1"
    }
  ],
  "generated_at": "2026-02-10T14:30:00.000Z",
  "source": "auto-summary",
  "is_temporary": true,
  "endpoint_called": "/auto-summarize",
  "timestamp": "2026-02-10T14:30:00.000Z"
}
```

**Test avec curl :**
```bash
curl -X POST http://localhost:5678/webhook/smartcontext/auto-summarize \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://github.com",
    "text": "GitHub is where over 100 million developers..."
  }'
```

---

### **Workflow 3 : Export PDF**

Exporter un résumé IA en PDF avec encodage UTF-8 correct.

**Endpoint :** `POST http://localhost:5678/webhook/smartcontext/export-pdf`

**Body (JSON) :**
```json
{
  "url": "https://example.com",
  "title": "Mon résumé IA",
  "summary": "Résumé avec accents français : éèàçœ",
  "checklist": [
    "Vérifier les accents",
    "Tester les symboles €°"
  ],
  "common_errors": [
    "Erreur d'encodage avec Ã©"
  ],
  "faqs": [
    {
      "question": "Comment ça fonctionne?",
      "answer": "C'est très simple..."
    }
  ]
}
```

**Réponse :**
- **Type :** Fichier PDF en streaming
- **Headers :**
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename=smartcontext-export.pdf`

**Test avec curl :**
```bash
curl -X POST http://localhost:5678/webhook/smartcontext/export-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "Résumé avec accents : éèàçœ €",
    "checklist": ["Test 1", "Test 2"]
  }' \
  --output export.pdf
```

---

## 🔧 Configuration

### **Modifier l'URL du Serveur SmartContext**

Si votre serveur SmartContext n'est pas sur `localhost:8787`, modifiez les nodes HTTP :

```javascript
// Dans chaque node HTTP (HTTP - Update Mapping, HTTP - Generate AI Summary, etc.)
// Changer l'URL :
"url": "=http://VOTRE-SERVEUR:PORT/endpoint"

// Exemple pour serveur distant :
"url": "=https://smartcontext.example.com/ingest"
```

### **Ajuster les Timeouts**

```javascript
// Dans les nodes HTTP, section "options"
"options": {
  "timeout": 60000  // 60 secondes (modifiable)
}
```

### **Ajouter des Headers Personnalisés**

```javascript
// Dans les nodes HTTP, ajouter dans "options"
"options": {
  "headers": {
    "entries": [
      {
        "name": "Authorization",
        "value": "Bearer YOUR_TOKEN"
      }
    ]
  }
}
```

---

## 📊 Monitoring

### **Visualiser les Exécutions**

```bash
1. Ouvrir n8n
2. Aller dans "Executions" (menu gauche)
3. Filtrer par workflow "SmartContext Doc - Workflow Complet v2.2"
4. Cliquer sur une exécution pour voir les détails
```

### **Logs de Débogage**

Chaque node "Function" contient des logs :

```javascript
// Exemple dans "Normalize Metadata"
console.log('[n8n] Métadonnées normalisées:', normalized);

// Exemple dans "Build Upload Response"
console.log('[n8n] Réponse construite:', response);
```

---

## 🐛 Troubleshooting

### **Problème 1 : Webhook non accessible**

**Cause :** n8n n'est pas démarré ou workflow pas activé.

**Solution :**
```bash
# Démarrer n8n
npx n8n

# Ou avec Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Vérifier que le workflow est activé (toggle "Active")
```

### **Problème 2 : Erreur "Connection refused" vers serveur SmartContext**

**Cause :** Le serveur SmartContext n'est pas démarré.

**Solution :**
```bash
cd server
npm run dev
```

### **Problème 3 : PDF vide ou corrompu**

**Cause :** Les données envoyées sont incomplètes.

**Solution :**
```bash
# Vérifier que tous les champs requis sont présents
curl -X POST http://localhost:5678/webhook/smartcontext/export-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "Au moins le résumé doit être fourni",
    "checklist": []
  }' \
  --output test.pdf

# Vérifier le PDF généré
file test.pdf  # Devrait afficher "PDF document"
```

### **Problème 4 : Timeout après 60 secondes**

**Cause :** Azure OpenAI prend trop de temps.

**Solution :**
```javascript
// Augmenter le timeout dans le node HTTP correspondant
"options": {
  "timeout": 120000  // 120 secondes
}
```

---

## 🔄 Intégration Continue

### **Déclencher via Autre Workflow**

```javascript
// Dans un autre workflow n8n, appeler ce webhook
{
  "parameters": {
    "url": "http://localhost:5678/webhook/smartcontext/upload",
    "method": "POST",
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={{ JSON.stringify($json) }}"
  },
  "name": "Trigger SmartContext Upload",
  "type": "n8n-nodes-base.httpRequest"
}
```

### **Déclencher via Cron**

Ajouter un node "Cron" au début du workflow :

```javascript
{
  "parameters": {
    "triggerTimes": {
      "item": [
        {
          "hour": 2,
          "minute": 0
        }
      ]
    }
  },
  "name": "Schedule Daily 2AM",
  "type": "n8n-nodes-base.cron"
}
```

### **Déclencher via Zapier/Make**

```bash
# URL webhook à utiliser dans Zapier/Make
POST http://localhost:5678/webhook/smartcontext/upload

# Ou via ngrok pour accès externe
ngrok http 5678
# Utiliser l'URL ngrok dans Zapier
```

---

## 📈 Améliorations Futures

### **Court Terme**
- [ ] Ajouter validation des données entrantes
- [ ] Ajouter retry automatique en cas d'erreur
- [ ] Ajouter notification Slack/Email en cas d'échec

### **Moyen Terme**
- [ ] Ajouter workflow pour bulk upload (plusieurs docs)
- [ ] Ajouter workflow pour mise à jour périodique des résumés
- [ ] Intégrer webhooks de GitHub/GitLab pour auto-update

### **Long Terme**
- [ ] Ajouter AI-powered routing (choisir le bon workflow automatiquement)
- [ ] Ajouter versioning des résumés
- [ ] Intégrer avec bases de données (PostgreSQL, MongoDB)

---

## 📚 Exemples d'Utilisation

### **Exemple 1 : Upload Automatique depuis Google Drive**

```
Google Drive Trigger (nouveau fichier PDF)
    ↓
Extract File Info
    ↓
HTTP Request → smartcontext/upload
    ↓
Send Notification (Email/Slack)
```

### **Exemple 2 : Génération Résumé depuis RSS Feed**

```
RSS Feed Trigger (nouvel article)
    ↓
HTTP Fetch (récupérer contenu article)
    ↓
Extract Text
    ↓
HTTP Request → smartcontext/auto-summarize
    ↓
Save to Notion/Airtable
```

### **Exemple 3 : Export PDF Automatique**

```
Schedule Trigger (tous les jours)
    ↓
Fetch Summaries from Database
    ↓
Loop on Each Summary
    ↓
HTTP Request → smartcontext/export-pdf
    ↓
Upload to Google Drive
    ↓
Send Email with PDF attached
```

---

## 🎯 Résumé des Endpoints

| Workflow | Endpoint | Méthode | Description |
|----------|----------|---------|-------------|
| **Upload** | `/webhook/smartcontext/upload` | POST | Upload doc + génération résumé |
| **Auto Summarize** | `/webhook/smartcontext/auto-summarize` | POST | Résumé automatique pour URL |
| **Export PDF** | `/webhook/smartcontext/export-pdf` | POST | Export résumé en PDF UTF-8 |

---

## ✅ Checklist de Validation

Avant de considérer le workflow opérationnel :

- [x] Workflow importé dans n8n
- [x] Workflow activé (toggle "Active")
- [x] Serveur SmartContext démarré (`npm run dev`)
- [x] Test Workflow 1 (Upload) avec curl
- [x] Test Workflow 2 (Auto Summarize) avec curl
- [x] Test Workflow 3 (Export PDF) avec curl
- [ ] Vérifier les logs d'exécution dans n8n
- [ ] Tester en conditions réelles (production)
- [ ] Configurer monitoring/alertes

---

## 📞 Support

**Questions ?** Consultez :
- [Documentation n8n](https://docs.n8n.io/)
- [SmartContext Doc README](../README.md)
- [CHANGELOG_AI_AUTO.md](../CHANGELOG_AI_AUTO.md)
- [SOLUTION_PDF_ENCODING.md](../SOLUTION_PDF_ENCODING.md)

---

**Version :** 2.2.0
**Dernière mise à jour :** 2026-02-10
**Auteur :** Claude Sonnet 4.5 via Claude Code CLI
