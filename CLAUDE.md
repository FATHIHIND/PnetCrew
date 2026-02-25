# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SmartContext Doc** est une extension Chrome Manifest V3 avec serveur Node.js qui affiche automatiquement de la documentation contextuelle selon l'URL active. Le projet intègre Azure AI Foundry (Azure OpenAI) pour générer des résumés IA et n8n pour l'automatisation.

## Development Commands

### Serveur API (Node.js/Express)

```bash
# Installer les dépendances
cd server && npm install

# Synchroniser le mapping extension ↔ serveur
npm run sync-mapping

# Démarrer le serveur (développement avec auto-reload)
npm run dev

# Démarrer le serveur (production)
npm start

# Tester la génération de résumé IA
npm run summarize:sample
node azure/summarize.js --sample jira
```

### Extension Chrome

```bash
# Charger l'extension
# 1. Ouvrir chrome://extensions
# 2. Activer "Mode développeur"
# 3. "Charger l'extension non empaquetée" → sélectionner /extension

# Recharger l'extension après modifications
# Cliquer sur l'icône de rechargement dans chrome://extensions
```

### Tests API

```bash
# Health check
curl http://localhost:8787/health

# Récupérer le mapping
curl http://localhost:8787/mapping.json

# Récupérer un résumé
curl http://localhost:8787/summaries/jira

# Ajouter/MAJ un mapping
curl -X POST http://localhost:8787/ingest \
  -H "Content-Type: application/json" \
  -d '{"key":"slack","title":"Guide Slack","urlMatch":["slack.com"],"docUrlOrPath":"docs/slack.pdf"}'

# Générer un résumé IA
curl -X POST http://localhost:8787/summarize \
  -H "Content-Type: application/json" \
  -d '{"key":"jira","docUrlOrPath":"docs/jira_guide.pdf"}'
```

## Architecture

### Structure des dossiers

```
PnetCrew/
├── extension/          # Extension Chrome (Manifest V3)
│   ├── manifest.json   # Configuration extension
│   ├── background.js   # Service Worker (détection URL)
│   ├── content.js      # Script de contenu (contexte page)
│   ├── popup.html/js/css  # Interface utilisateur
│   ├── mapping.json    # Mapping local (fallback hors ligne)
│   └── docs/           # Documents PDF de démonstration
│
├── server/             # API REST Node.js/Express
│   ├── server.js       # Endpoints API (/health, /mapping, /summaries, /ingest, /summarize)
│   ├── azure/
│   │   └── summarize.js   # Intégration Azure AI Foundry (génération résumés)
│   ├── data/
│   │   ├── mapping.json   # Source de vérité (mappings URL → docs)
│   │   └── summaries/     # Résumés générés (cache persistant)
│   └── scripts/
│       └── sync-mapping.js  # Synchronisation mapping
│
├── n8n/
│   └── workflow.smartcontext.json  # Workflow n8n (import prêt)
│
├── .env.example        # Template variables d'environnement
└── README.md           # Documentation complète
```

### Flux de données

1. **Détection URL** : `background.js` écoute les changements d'onglets
2. **Matching** : `popup.js` charge le mapping et trouve la correspondance (regex + poids)
3. **Affichage** : Popup affiche la doc + résumé IA (si serveur disponible)
4. **Génération IA** : `azure/summarize.js` appelle Azure OpenAI pour créer résumés/checklists/FAQ
5. **Automatisation** : n8n peut mettre à jour le mapping via webhook

### Composants clés

- **Extension** : Manifest V3, service worker, content script, popup
- **Serveur** : Express + CORS, sert mapping et résumés, intègre Azure AI
- **Azure AI** : Génération de résumés structurés (summary, checklist, common_errors, faqs)
- **n8n** : Workflow pour automatiser l'ajout de docs et génération de résumés

## Configuration

### Variables d'environnement (.env)

```env
PORT=8787
AZURE_OPENAI_ENDPOINT=https://VOTRE-INSTANCE.openai.azure.com/
AZURE_OPENAI_API_KEY=votre_clef_api
AZURE_OPENAI_DEPLOYMENT=gpt-4
```

### Mapping (mapping.json)

Format :
```json
{
  "key": "jira",
  "match": ["jira", "atlassian.net"],
  "title": "Guide Jira",
  "path": "docs/jira_guide.pdf",
  "tags": ["process", "workflow"],
  "updated_at": "ISO-8601"
}
```

Logique de matching (`popup.js`) :
- Score basé sur présence des patterns dans l'URL
- Bonus pour match exact du hostname
- Regex supporté (ex: `.*github.com/pull.*`)

## Code Important

### Extension - Matching URL (popup.js:findBestMatch)

La fonction `findBestMatch()` utilise un système de scoring :
- +10 points : pattern trouvé dans l'URL (includes)
- +15 points : pattern regex match
- +5 points : pattern dans le hostname

### Serveur - Endpoints (server.js)

- `GET /health` : Health check
- `GET /mapping.json` : Liste des mappings
- `GET /summaries/:key` : Résumé pour une doc (cache mémoire + disque)
- `POST /ingest` : Ajouter/MAJ mapping (sync automatique vers extension)
- `POST /summarize` : Générer résumé IA via Azure

### Azure AI - Génération (azure/summarize.js)

- Fonction `summarize({ key, text, pdfPath, url })`
- Extrait texte PDF (via pdf-parse si dispo, sinon fallback)
- Prompt ingénieré pour obtenir JSON structuré
- Gestion erreurs + fallback si Azure indisponible

## Développement

### Ajouter un nouveau mapping

1. **Via API** :
   ```bash
   curl -X POST http://localhost:8787/ingest -H "Content-Type: application/json" \
     -d '{"key":"notion","title":"Guide Notion","urlMatch":["notion.so"],"docUrlOrPath":"docs/notion.pdf"}'
   ```

2. **Via fichier** :
   - Éditer `server/data/mapping.json`
   - Exécuter `npm run sync-mapping`

### Modifier le prompt Azure

Éditer `azure/summarize.js`, fonction `buildPrompt()`. Le prompt demande un JSON avec :
- `summary` : 120-180 mots
- `checklist` : 5 points d'action
- `common_errors` : 3 erreurs fréquentes
- `faqs` : 3 questions/réponses

### Personnaliser l'UI

- `popup.css` : Variables CSS dans `:root`
- `popup.html` : Structure des sections
- `popup.js` : Logique d'affichage (fonctions `display*()`)

## Débogage

### Extension
- Service Worker logs : `chrome://extensions` → "Inspecter les vues : service worker"
- Popup logs : Clic droit sur icône → "Inspecter"

### Serveur
- Logs dans le terminal où `npm run dev` est lancé
- Ajouter `console.log()` dans `server.js` ou `summarize.js`

### Problèmes courants

1. **Extension ne détecte pas l'URL** : Vérifier permissions dans `manifest.json` (host_permissions)
2. **Serveur 401 Azure** : Clé API invalide dans `.env`
3. **Résumé non affiché** : Vérifier `/summaries/:key` retourne bien les données
4. **Mode hors ligne non actif** : `CONFIG.FALLBACK_TO_LOCAL` doit être `true` dans `popup.js`

## Tests

### Scénarios de test

1. **Jira** : URL `https://jira.atlassian.net/...` → affiche "Guide Jira"
2. **GitHub** : URL `https://github.com/...` → affiche "Cheatsheet GitHub"
3. **Hors ligne** : Arrêter serveur → doc affichée depuis mapping local
4. **Mise à jour n8n** : POST webhook → mapping mis à jour → popup reflète changement

## Notes importantes

- **Manifest V3** : Utilise service worker (pas background page)
- **CORS** : Activé pour dev, à restreindre en prod
- **Sécurité** : Ne jamais commiter `.env`, clés API sensibles
- **Cache** : Résumés en mémoire + disque (`server/data/summaries/`)
- **Synchronisation** : `sync-mapping.js` copie server → extension

## Améliorations futures

- Spotlight contextuel (raccourci clavier)
- Ask-Me-Anything (questions sur la doc via IA)
- Analytics d'usage (docs les plus consultées)
- Notifications proactives (nouvelle doc disponible)
- Synchronisation cloud (Azure Blob, MongoDB)
