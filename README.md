# 📚 SmartContext Doc

Extension Chrome Manifest V3 intelligente qui affiche automatiquement de la documentation contextuelle selon l'URL active, avec intégration n8n et Azure AI Foundry (Azure OpenAI).

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Chrome](https://img.shields.io/badge/Chrome-Manifest%20V3-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-orange)

---

## 🎯 Contexte & Objectif

**SmartContext Doc** résout un problème courant : **retrouver rapidement la bonne documentation** quand on travaille sur différents outils (Jira, Teams, GitHub, Azure DevOps, etc.).

### ✨ Fonctionnalités principales

- ✅ **Détection automatique** de l'URL active et affichage de la documentation pertinente
- ✅ **Résumés IA** générés par Azure AI Foundry (Azure OpenAI)
- ✅ **Checklists actionables** et erreurs fréquentes
- ✅ **FAQ** contextuelle
- ✅ **Intégration n8n** pour automatiser l'ajout de nouvelles documentations
- ✅ **Mode hors ligne** avec fallback sur mapping local
- ✅ **API REST** pour gestion centralisée du mapping

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     EXTENSION CHROME                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ background.js│  │  content.js  │  │    popup.js     │  │
│  │  (Service    │  │  (Contexte   │  │  (UI + Logic)   │  │
│  │   Worker)    │  │    Page)     │  │                 │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│                                            │                │
│                                            ↓                │
│                                    ┌───────────────┐        │
│                                    │ mapping.json  │        │
│                                    │   (Local)     │        │
│                                    └───────────────┘        │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ HTTP (fetch)
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      SERVEUR API (Express)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  server.js                                           │  │
│  │  • GET  /health                                      │  │
│  │  • GET  /mapping.json                                │  │
│  │  • GET  /summaries/:key                              │  │
│  │  • POST /ingest       (mise à jour mapping)          │  │
│  │  • POST /summarize    (génération résumé IA)         │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ↓                                  │
│            ┌──────────────────────────────┐                │
│            │   azure/summarize.js         │                │
│            │   (Azure AI Foundry)         │                │
│            └──────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                          ↑
                          │ Webhook POST
                          │
┌─────────────────────────────────────────────────────────────┐
│                         N8N WORKFLOW                        │
│  1. Webhook Trigger (Upload Doc)                           │
│  2. Normalize Metadata                                      │
│  3. HTTP POST → /ingest                                     │
│  4. HTTP POST → /summarize                                  │
│  5. Response                                                │
└─────────────────────────────────────────────────────────────┘
```

### 🔄 Flux de données

1. **L'utilisateur navigue** sur une URL (ex: `https://jira.atlassian.net/...`)
2. **L'extension** détecte l'URL via `background.js`
3. **Le popup** charge le mapping (local → serveur en fallback)
4. **Correspondance** : recherche du meilleur match dans le mapping
5. **Affichage** : documentation + résumé IA (si serveur disponible)

---

## 📋 Prérequis

### Logiciels requis

- **Node.js** ≥ 18.0.0 ([télécharger](https://nodejs.org))
- **Google Chrome** ou navigateur Chromium
- **n8n** (optionnel, pour automatisation) ([docs](https://n8n.io))
- **Compte Azure** avec accès à Azure AI Foundry (Azure OpenAI)

### Ressources Azure

1. **Créer une ressource Azure OpenAI** :
   - Aller sur [portal.azure.com](https://portal.azure.com)
   - Créer une ressource "Azure OpenAI"
   - Noter l'**endpoint** et la **clé API**

2. **Créer un deployment** :
   - Ouvrir [Azure AI Studio](https://oai.azure.com)
   - Aller dans "Deployments" → "Create new deployment"
   - Choisir un modèle (GPT-4 recommandé)
   - Noter le **nom du deployment**

---

## 🚀 Installation & Commandes

### 1️⃣ Installation du serveur

```bash
# Cloner ou extraire le projet
cd PnetCrew

# Installer les dépendances du serveur
cd server
npm install

# Copier et configurer les variables d'environnement
cp ../.env.example ../.env

# Éditer le .env avec vos credentials Azure
# nano ../.env  (ou notepad ../.env sous Windows)
```

Remplir le fichier `.env` :

```env
PORT=8787
AZURE_OPENAI_ENDPOINT=https://VOTRE-INSTANCE.openai.azure.com/
AZURE_OPENAI_API_KEY=votre_clef_api_azure
AZURE_OPENAI_DEPLOYMENT=gpt-4
```

### 2️⃣ Synchroniser le mapping

```bash
# Depuis le dossier server/
npm run sync-mapping
```

Cela copie `server/data/mapping.json` → `extension/mapping.json`.

### 3️⃣ Démarrer le serveur

```bash
# Mode développement (avec auto-reload)
npm run dev

# Mode production
npm start
```

Le serveur démarre sur **http://localhost:8787**

Tester avec :

```bash
curl http://localhost:8787/health
```

Réponse attendue :

```json
{
  "status": "ok",
  "timestamp": "2026-02-05T...",
  "version": "1.0.0"
}
```

### 4️⃣ Charger l'extension Chrome

1. Ouvrir Chrome et aller sur `chrome://extensions`
2. Activer le **Mode développeur** (coin supérieur droit)
3. Cliquer sur **Charger l'extension non empaquetée**
4. Sélectionner le dossier `extension/`
5. L'icône SmartContext Doc apparaît dans la barre d'outils

> **Note** : Les icônes sont des placeholders. Créez des images 16x16, 48x48, 128x128 nommées `icon16.png`, `icon48.png`, `icon128.png` et placez-les dans `extension/`.

---

## ⚙️ Configuration Azure AI Foundry

### Obtenir vos credentials

1. **Endpoint** :
   - Portail Azure → Votre ressource OpenAI → "Keys and Endpoint"
   - Copier l'URL (ex: `https://mon-instance.openai.azure.com/`)

2. **Clé API** :
   - Dans la même section, copier "Key 1" ou "Key 2"

3. **Deployment** :
   - Azure AI Studio → Deployments
   - Noter le nom exact du deployment (ex: `gpt-4`)

### Variables d'environnement

Fichier `.env` :

```env
AZURE_OPENAI_ENDPOINT=https://mon-instance.openai.azure.com/
AZURE_OPENAI_API_KEY=abc123...xyz789
AZURE_OPENAI_DEPLOYMENT=gpt-4
```

### Tester la connexion

```bash
cd server
node azure/summarize.js --sample jira
```

Si tout est configuré correctement, un résumé sera généré et affiché en JSON.

---

## 🔌 Utilisation n8n

### Importer le workflow

1. Ouvrir n8n (local ou cloud)
2. Aller dans **Workflows** → **Import from File**
3. Sélectionner `n8n/workflow.smartcontext.json`
4. Le workflow "SmartContext Doc - Upload & Summarize" est créé

### Configuration du workflow

1. **Webhook Node** :
   - Vérifier l'URL du webhook (ex: `http://localhost:5678/webhook/smartcontext/upload`)
   - Activer le workflow

2. **HTTP Nodes** :
   - Vérifier que l'URL du serveur est correcte : `http://localhost:8787`
   - Ajuster si le serveur tourne sur un autre port/host

### Tester le workflow

**Via le webhook** :

```bash
curl -X POST http://localhost:5678/webhook/smartcontext/upload \
  -H "Content-Type: application/json" \
  -d '{
    "key": "azdo",
    "title": "Guide Azure DevOps",
    "urlMatch": ["dev.azure.com", "visualstudio.com"],
    "docUrlOrPath": "docs/azdo_quickstart.pdf"
  }'
```

**Via le trigger manuel** :

1. Dans n8n, cliquer sur "Execute Workflow"
2. Fournir les données de test
3. Observer les résultats dans chaque node

### Résultat attendu

```json
{
  "status": "updated",
  "key": "azdo",
  "title": "Guide Azure DevOps",
  "mapping_updated": true,
  "summary_generated": true,
  "summary_excerpt": "Azure DevOps est une plateforme complète...",
  "timestamp": "2026-02-05T..."
}
```

---

## 🎬 Démonstration (Scénario pas à pas)

### Scénario 1 : Utilisation de base

1. **Démarrer le serveur** : `npm run dev` dans `server/`
2. **Ouvrir Chrome** et charger l'extension
3. **Naviguer vers** `https://jira.atlassian.net/...`
4. **Cliquer sur l'icône** SmartContext Doc
5. **Observer** :
   - URL détectée
   - Serveur en ligne (pastille verte)
   - Documentation "Guide Jira" affichée
   - Résumé IA, Checklist, FAQ (si résumé généré)

### Scénario 2 : Générer un résumé IA

```bash
# Depuis le dossier server/
curl -X POST http://localhost:8787/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "key": "jira",
    "docUrlOrPath": "docs/jira_guide.pdf"
  }'
```

Réponse :

```json
{
  "status": "success",
  "key": "jira",
  "summary": "Ce guide explique...",
  "message": "Résumé généré avec succès"
}
```

### Scénario 3 : Ajouter une nouvelle documentation

**Via l'API** :

```bash
curl -X POST http://localhost:8787/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "key": "slack",
    "title": "Guide Slack",
    "urlMatch": ["slack.com", "app.slack.com"],
    "docUrlOrPath": "docs/slack_guide.pdf",
    "tags": ["communication", "chat"]
  }'
```

**Via n8n** : Utiliser le webhook comme montré précédemment.

### Scénario 4 : Mode hors ligne

1. **Arrêter le serveur** : Ctrl+C dans le terminal du serveur
2. **Recharger le popup** de l'extension
3. **Observer** :
   - Pastille orange "Mode hors ligne"
   - Documentation chargée depuis `extension/mapping.json` (local)
   - Pas de résumé IA (serveur requis)

---

## 🎨 Personnalisation

### Ajouter de nouveaux mappings

**Éditer manuellement** `server/data/mapping.json` :

```json
{
  "key": "notion",
  "match": ["notion.so", "notion.site"],
  "title": "Guide Notion",
  "path": "docs/notion_guide.pdf",
  "tags": ["notes", "collaboration"]
}
```

Puis synchroniser :

```bash
npm run sync-mapping
```

### Modifier les patterns de matching

Dans `extension/popup.js`, fonction `findBestMatch()` :

```javascript
// Ajouter des bonus pour certains patterns
if (pattern.includes('mycompany.com')) {
  score += 20; // Priorité haute pour le domaine interne
}
```

### Personnaliser l'UI

Éditer `extension/popup.css` :

```css
:root {
  --primary-color: #your-color; /* Changer la couleur principale */
}
```

### Ajouter des champs au résumé IA

Dans `server/azure/summarize.js`, modifier le prompt :

```javascript
// Ajouter un nouveau champ
{
  "summary": "...",
  "checklist": [...],
  "tips": ["Astuce 1", "Astuce 2"],  // Nouveau champ
  "common_errors": [...]
}
```

---

## 🔒 Sécurité

### ✅ Bonnes pratiques

- **Ne JAMAIS** commiter le fichier `.env` dans Git
- **Utiliser des clés différentes** pour dev/prod
- **Régénérer les clés** si compromises (portail Azure)
- **Activer CORS** uniquement pour les origines de confiance en production

### 🔐 Rotation des clés

Si une clé API est compromise :

1. Aller sur [portal.azure.com](https://portal.azure.com)
2. Votre ressource OpenAI → Keys and Endpoint
3. Cliquer sur "Regenerate Key 1" (ou Key 2)
4. Mettre à jour `.env` avec la nouvelle clé
5. Redémarrer le serveur

### 🌐 CORS en production

Dans `server/server.js`, restreindre les origines :

```javascript
app.use(cors({
  origin: ['chrome-extension://votre-extension-id', 'https://votre-domaine.com']
}));
```

---

## 📝 Tests manuels

### ✅ Cas de test 1 : Jira

1. **URL** : `https://jira.atlassian.net/browse/PROJECT-123`
2. **Résultat attendu** : Popup affiche "Guide Jira"
3. **Validation** : Tags "process", "workflow", "tickets" visibles

### ✅ Cas de test 2 : GitHub

1. **URL** : `https://github.com/user/repo/pull/42`
2. **Résultat attendu** : Popup affiche "Cheatsheet GitHub"
3. **Validation** : Tags "git", "code review" visibles

### ✅ Cas de test 3 : Mise à jour via n8n

1. **Action** : POST vers webhook n8n avec nouveau mapping
2. **Résultat attendu** : `server/data/mapping.json` mis à jour
3. **Validation** : Popup reflète le nouveau mapping après rechargement

### ✅ Cas de test 4 : Résumé IA indisponible

1. **Action** : Configurer un mauvais endpoint Azure
2. **Résultat attendu** : Popup affiche la doc mais pas de résumé IA
3. **Validation** : Message "Résumé IA non disponible"

### ✅ Cas de test 5 : Hors ligne

1. **Action** : Arrêter le serveur
2. **Résultat attendu** : Popup affiche "Mode hors ligne" + doc depuis mapping local
3. **Validation** : Pastille orange, pas d'appel réseau échoué

---

## 📊 Endpoints API (Référence)

### GET /health

Vérifier l'état du serveur.

```bash
curl http://localhost:8787/health
```

**Réponse** :

```json
{
  "status": "ok",
  "timestamp": "2026-02-05T12:34:56.789Z",
  "version": "1.0.0"
}
```

### GET /mapping.json

Récupérer la liste complète des mappings.

```bash
curl http://localhost:8787/mapping.json
```

**Réponse** : Array de mappings (voir `server/data/mapping.json`)

### GET /summaries/:key

Récupérer le résumé IA pour une documentation.

```bash
curl http://localhost:8787/summaries/jira
```

**Réponse** :

```json
{
  "key": "jira",
  "summary": "Ce guide Jira couvre...",
  "checklist": ["Créer un projet", "Définir les workflows", ...],
  "common_errors": ["Oublier de fermer les tickets", ...],
  "faqs": [
    {"question": "Comment créer un epic?", "answer": "..."}
  ],
  "generated_at": "2026-02-05T...",
  "source": "azure-openai"
}
```

### POST /ingest

Ajouter ou mettre à jour un mapping.

```bash
curl -X POST http://localhost:8787/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "key": "notion",
    "title": "Guide Notion",
    "urlMatch": ["notion.so"],
    "docUrlOrPath": "docs/notion_guide.pdf",
    "tags": ["notes"]
  }'
```

**Réponse** :

```json
{
  "status": "updated",
  "key": "notion",
  "title": "Guide Notion",
  "message": "Mapping mis à jour avec succès"
}
```

### POST /summarize

Générer un résumé IA pour une documentation.

```bash
curl -X POST http://localhost:8787/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "key": "jira",
    "docUrlOrPath": "docs/jira_guide.pdf"
  }'
```

**Réponse** :

```json
{
  "status": "success",
  "key": "jira",
  "summary": "Ce guide explique...",
  "message": "Résumé généré avec succès"
}
```

---

## 🚧 Limites & Améliorations futures

### Limites actuelles

- **PDF non parsés automatiquement** : Nécessite `pdf-parse` ou équivalent
- **Pas de cache distribué** : Cache en mémoire uniquement (perdu au redémarrage)
- **Pas d'authentification** : API ouverte en local
- **Pas de gestion des versions** : Mapping écrasé à chaque mise à jour

### 🔮 Améliorations possibles

#### 1. **Spotlight contextuel**

Ajouter un raccourci clavier (ex: `Ctrl+Shift+D`) pour afficher la doc sans cliquer sur l'icône.

```javascript
// Dans background.js
chrome.commands.onCommand.addListener((command) => {
  if (command === 'show-doc') {
    // Ouvrir le popup programmatiquement
  }
});
```

#### 2. **Ask-Me-Anything (AMA)**

Permettre de poser des questions sur la documentation via Azure OpenAI.

```javascript
// Nouveau endpoint POST /ask
app.post('/ask', async (req, res) => {
  const { key, question } = req.body;
  // Charger le contexte de la doc + question
  // Appeler Azure OpenAI avec RAG
  // Retourner la réponse
});
```

#### 3. **Analytics d'usage**

Tracker quelles docs sont les plus consultées.

```javascript
// Nouveau endpoint POST /analytics/view
app.post('/analytics/view', (req, res) => {
  const { key, url } = req.body;
  // Stocker dans une DB ou fichier JSON
});
```

#### 4. **Multi-langues**

Détecter la langue du navigateur et adapter l'UI.

```javascript
const userLang = navigator.language || 'fr';
const i18n = {
  fr: { title: 'Documentation', ... },
  en: { title: 'Documentation', ... }
};
```

#### 5. **Synchronisation cloud**

Stocker le mapping et les résumés dans Azure Blob Storage ou MongoDB.

#### 6. **Notifications proactives**

Afficher une notification quand une nouvelle doc est disponible pour l'URL courante.

```javascript
chrome.notifications.create({
  type: 'basic',
  title: 'Nouvelle documentation disponible',
  message: 'Un guide pour cette page a été ajouté!'
});
```

---

## 🛠️ Développement

### Structure des fichiers

```
PnetCrew/
├── extension/              # Extension Chrome
│   ├── manifest.json       # Manifest V3
│   ├── background.js       # Service Worker
│   ├── content.js          # Script de contenu
│   ├── popup.html          # UI du popup
│   ├── popup.js            # Logique du popup
│   ├── popup.css           # Styles
│   ├── mapping.json        # Mapping local (fallback)
│   └── docs/               # Documents PDF
│
├── server/                 # Serveur API
│   ├── package.json
│   ├── server.js           # API Express
│   ├── azure/
│   │   └── summarize.js    # Intégration Azure AI
│   ├── data/
│   │   ├── mapping.json    # Source de vérité
│   │   └── summaries/      # Résumés générés
│   └── scripts/
│       └── sync-mapping.js # Sync extension ↔ serveur
│
├── n8n/
│   └── workflow.smartcontext.json  # Workflow n8n
│
├── .env.example            # Template variables d'env
├── .gitignore
└── README.md               # Ce fichier
```

### Scripts npm

| Commande | Description |
|----------|-------------|
| `npm start` | Démarrer le serveur (production) |
| `npm run dev` | Démarrer le serveur (développement avec nodemon) |
| `npm run sync-mapping` | Synchroniser le mapping extension ↔ serveur |
| `npm run summarize:sample` | Tester la génération de résumé |

### Débogage

**Extension Chrome** :

1. `chrome://extensions` → SmartContext Doc → "Inspecter les vues : service worker"
2. Voir les logs dans la console

**Popup** :

1. Clic droit sur l'icône → "Inspecter"
2. Voir la console et les network requests

**Serveur** :

1. Logs affichés directement dans le terminal
2. Ajouter des `console.log` dans `server.js` ou `summarize.js`

---

## 🤝 Support & Documentation

### Ressources utiles

- **Manifest V3** : [Chrome Extensions Docs](https://developer.chrome.com/docs/extensions/mv3/)
- **Azure OpenAI** : [Documentation Azure](https://learn.microsoft.com/azure/ai-services/openai/)
- **n8n** : [Documentation n8n](https://docs.n8n.io/)
- **Express.js** : [Documentation Express](https://expressjs.com/)

### FAQ Projet

**Q : Le serveur ne démarre pas**

R : Vérifiez que le port 8787 n'est pas utilisé : `netstat -ano | findstr 8787` (Windows) ou `lsof -i :8787` (Mac/Linux).

**Q : L'extension ne détecte pas l'URL**

R : Vérifiez les permissions dans `manifest.json` et rechargez l'extension.

**Q : Azure OpenAI retourne une erreur 401**

R : Clé API invalide. Vérifiez `.env` et régénérez la clé si nécessaire.

**Q : Le résumé IA ne s'affiche pas**

R : Vérifiez :
1. Serveur en ligne (`/health`)
2. Résumé généré (`GET /summaries/:key`)
3. Console du popup pour erreurs

**Q : n8n ne reçoit pas les webhooks**

R : Vérifiez que n8n tourne et que le webhook est activé (switch ON dans le workflow).

---

## 📜 Licence

MIT License - Libre d'utilisation, modification et distribution.

---

## 🙏 Crédits

Développé pour démontrer l'intégration de :
- Chrome Extensions (Manifest V3)
- Azure AI Foundry (Azure OpenAI)
- n8n (automation)
- Express.js (API REST)

---

## 📞 Contact & Contributions

Pour toute question, amélioration ou bug :

1. Ouvrir une issue sur le repository
2. Proposer une pull request
3. Contacter l'équipe de développement

**Bon développement ! 🚀**
