# 📁 Structure du Projet SmartContext Doc

Vue d'ensemble complète de tous les fichiers du projet.

## 🗂️ Arborescence Complète

```
PnetCrew/
│
├── 📄 README.md                      # Documentation principale (LIRE EN PREMIER)
├── 📄 QUICKSTART.md                  # Guide de démarrage rapide (5 minutes)
├── 📄 TESTING.md                     # Guide de tests complets
├── 📄 CLAUDE.md                      # Guide pour Claude Code
├── 📄 PROJECT_STRUCTURE.md           # Ce fichier
│
├── 📄 package.json                   # Scripts npm globaux
├── 📄 .env.example                   # Template variables d'environnement
├── 📄 .gitignore                     # Fichiers ignorés par Git
│
├── 🚀 start-server.bat               # Script démarrage Windows
├── 🚀 start-server.sh                # Script démarrage Linux/Mac
│
├── 📂 extension/                     # EXTENSION CHROME
│   ├── 📄 manifest.json              # Configuration Manifest V3
│   ├── 📄 background.js              # Service Worker (détection URL)
│   ├── 📄 content.js                 # Script de contenu (contexte page)
│   ├── 📄 popup.html                 # Interface utilisateur popup
│   ├── 📄 popup.js                   # Logique JavaScript popup
│   ├── 📄 popup.css                  # Styles CSS popup
│   ├── 📄 mapping.json               # Mapping local (fallback hors ligne)
│   ├── 📄 ICONS_README.txt           # Instructions pour créer les icônes
│   ├── 🖼️ icon16.png                 # Icône 16x16 (À CRÉER)
│   ├── 🖼️ icon48.png                 # Icône 48x48 (À CRÉER)
│   ├── 🖼️ icon128.png                # Icône 128x128 (À CRÉER)
│   └── 📂 docs/                      # Documents de démonstration
│       ├── 📄 README.txt             # Instructions placeholders PDF
│       ├── 📄 jira_guide.pdf         # (Placeholder - À REMPLACER)
│       ├── 📄 teams_best_practices.pdf  # (Placeholder - À REMPLACER)
│       ├── 📄 github_cheatsheet.pdf  # (Placeholder - À REMPLACER)
│       ├── 📄 azdo_quickstart.pdf    # (Placeholder - À REMPLACER)
│       └── 📄 confluence_guide.pdf   # (Placeholder - À REMPLACER)
│
├── 📂 server/                        # SERVEUR API NODE.JS
│   ├── 📄 package.json               # Dépendances et scripts npm
│   ├── 📄 server.js                  # API Express principale
│   │
│   ├── 📂 azure/                     # Intégration Azure AI Foundry
│   │   └── 📄 summarize.js           # Génération résumés IA
│   │
│   ├── 📂 data/                      # Données persistantes
│   │   ├── 📄 mapping.json           # Source de vérité (mappings)
│   │   └── 📂 summaries/             # Cache résumés IA (généré auto)
│   │       └── 📄 {key}.json         # Résumés par clé (ex: jira.json)
│   │
│   └── 📂 scripts/                   # Scripts utilitaires
│       └── 📄 sync-mapping.js        # Synchronisation mappings
│
└── 📂 n8n/                           # WORKFLOW N8N
    └── 📄 workflow.smartcontext.json # Workflow prêt à importer

```

## 📋 Description des Fichiers Principaux

### 📚 Documentation

| Fichier | Description | Priorité |
|---------|-------------|----------|
| `README.md` | Documentation complète du projet | ⭐⭐⭐⭐⭐ |
| `QUICKSTART.md` | Guide de démarrage rapide | ⭐⭐⭐⭐ |
| `TESTING.md` | Guide des tests manuels et automatisés | ⭐⭐⭐ |
| `CLAUDE.md` | Guide pour Claude Code (contexte projet) | ⭐⭐⭐ |
| `PROJECT_STRUCTURE.md` | Structure complète du projet (ce fichier) | ⭐⭐ |

### 🔧 Configuration

| Fichier | Description | À Modifier |
|---------|-------------|-----------|
| `.env.example` | Template variables d'environnement | ✅ Copier vers `.env` |
| `.gitignore` | Fichiers exclus de Git | ❌ Pas nécessaire |
| `package.json` (root) | Scripts npm globaux | ❌ Sauf ajout features |
| `server/package.json` | Dépendances serveur | ❌ Sauf ajout dépendances |

### 🎨 Extension Chrome

| Fichier | Rôle | Complexité |
|---------|------|-----------|
| `manifest.json` | Configuration extension, permissions | ⭐ Simple |
| `background.js` | Service Worker, écoute changements URL | ⭐⭐ Moyen |
| `content.js` | Script injecté dans pages, extraction contexte | ⭐ Simple |
| `popup.html` | Structure interface utilisateur | ⭐ Simple |
| `popup.js` | Logique principale (matching, affichage) | ⭐⭐⭐ Complexe |
| `popup.css` | Styles responsifs et thème | ⭐⭐ Moyen |
| `mapping.json` | Liste des correspondances URL → docs | ⭐ Simple |

### 🖥️ Serveur API

| Fichier | Rôle | Complexité |
|---------|------|-----------|
| `server.js` | API REST Express (endpoints) | ⭐⭐⭐ Complexe |
| `azure/summarize.js` | Intégration Azure OpenAI | ⭐⭐⭐⭐ Très complexe |
| `data/mapping.json` | Source de vérité mappings | ⭐ Simple |
| `scripts/sync-mapping.js` | Synchronisation extension ↔ serveur | ⭐⭐ Moyen |

### 🤖 Automatisation

| Fichier | Rôle | Utilisation |
|---------|------|-----------|
| `n8n/workflow.smartcontext.json` | Workflow n8n prêt à importer | Import dans n8n |
| `start-server.bat` | Script démarrage Windows | Double-clic |
| `start-server.sh` | Script démarrage Linux/Mac | `./start-server.sh` |

## 🎯 Fichiers à Créer / Personnaliser

### 🔴 OBLIGATOIRES (pour fonctionner)

1. **`.env`** (copier depuis `.env.example`)
   ```env
   AZURE_OPENAI_ENDPOINT=https://votre-instance.openai.azure.com/
   AZURE_OPENAI_API_KEY=votre_clef
   AZURE_OPENAI_DEPLOYMENT=gpt-4
   ```

2. **Icônes extension** (dans `extension/`)
   - `icon16.png` (16x16)
   - `icon48.png` (48x48)
   - `icon128.png` (128x128)
   - Voir `extension/ICONS_README.txt` pour instructions

### 🟡 RECOMMANDÉS (pour tester complètement)

3. **Documents PDF** (dans `extension/docs/`)
   - `jira_guide.pdf`
   - `teams_best_practices.pdf`
   - `github_cheatsheet.pdf`
   - `azdo_quickstart.pdf`
   - `confluence_guide.pdf`
   - Voir `extension/docs/README.txt` pour instructions

## 📊 Tailles de Fichiers (Approximatif)

| Type | Nombre | Taille totale |
|------|--------|---------------|
| Documentation (.md) | 5 | ~80 KB |
| Code JavaScript | 6 | ~50 KB |
| Code CSS | 1 | ~8 KB |
| HTML | 1 | ~3 KB |
| Configuration (JSON) | 5 | ~15 KB |
| Scripts shell | 2 | ~4 KB |
| **TOTAL (sans node_modules)** | **20** | **~160 KB** |

Avec `node_modules` : ~40 MB (après `npm install`)

## 🔄 Flux de Données

```
1. USER navigue sur URL
         ↓
2. EXTENSION détecte (background.js)
         ↓
3. POPUP charge mapping (popup.js)
   ├─ Local (extension/mapping.json) [FALLBACK]
   └─ Serveur (GET /mapping.json) [PREFERRED]
         ↓
4. MATCHING (findBestMatch)
         ↓
5. AFFICHAGE doc + résumé IA
   └─ GET /summaries/:key (si serveur disponible)
         ↓
6. USER clique "Ouvrir doc"
   └─ Ouvre PDF/URL
```

## 🛠️ Commandes Essentielles

### Installation
```bash
npm run install:all          # Installer dépendances serveur
```

### Développement
```bash
npm run server:dev           # Démarrer serveur (dev avec auto-reload)
npm run sync                 # Synchroniser mapping
npm run test:summarize       # Tester génération résumé
```

### Production
```bash
npm run server               # Démarrer serveur (production)
```

### Tests
```bash
# Health check
curl http://localhost:8787/health

# Liste mappings
curl http://localhost:8787/mapping.json

# Récupérer résumé
curl http://localhost:8787/summaries/jira
```

## 📦 Dépendances NPM

### Production
```json
{
  "express": "^4.18.2",       // Framework web
  "cors": "^2.8.5",           // Cross-Origin Resource Sharing
  "dotenv": "^16.3.1",        // Variables d'environnement
  "axios": "^1.6.2",          // Client HTTP
  "pdf-parse": "^1.1.1",      // Extraction texte PDF
  "form-data": "^4.0.0"       // Multipart/form-data
}
```

### Développement
```json
{
  "nodemon": "^3.0.2"         // Auto-reload serveur
}
```

## 🔐 Sécurité

### ✅ Fichiers à TOUJOURS commiter
- Tous les `.js`, `.html`, `.css`, `.json` (sauf `.env`)
- Documentation (`.md`, `.txt`)
- Scripts (`.bat`, `.sh`)
- `.env.example`

### ❌ Fichiers à NE JAMAIS commiter
- `.env` (contient clés API)
- `node_modules/`
- `server/data/summaries/*.json` (cache généré)
- Clés privées (`.key`, `.pem`)

## 📈 Évolution du Projet

### Version 1.0.0 (Actuelle)
- ✅ Extension Chrome Manifest V3
- ✅ Serveur API Express
- ✅ Intégration Azure AI Foundry
- ✅ Workflow n8n
- ✅ Mode hors ligne
- ✅ Documentation complète

### Version 1.1.0 (Future)
- ⏳ Spotlight contextuel (raccourci clavier)
- ⏳ Ask-Me-Anything (RAG avancé)
- ⏳ Analytics d'usage
- ⏳ Multi-langues (i18n)

### Version 2.0.0 (Future)
- ⏳ Synchronisation cloud (Azure Blob)
- ⏳ Authentification utilisateurs
- ⏳ Base de données (MongoDB/PostgreSQL)
- ⏳ Dashboard web d'administration

## 🤝 Contribution

Pour ajouter un fichier au projet :

1. **Respecter la structure** des dossiers existante
2. **Documenter** dans les README appropriés
3. **Tester** avant de commiter
4. **Mettre à jour** cette documentation si nécessaire

---

**Structure générée le : 2026-02-05**
**Version du projet : 1.0.0**
