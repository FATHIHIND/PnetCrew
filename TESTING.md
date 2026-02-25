# 🧪 Guide de Tests - SmartContext Doc

Documentation complète des tests manuels et automatisés.

## 📋 Tests Manuels

### Test 1 : Installation et démarrage

**Objectif** : Vérifier que le projet se lance correctement.

**Étapes** :
1. Cloner/extraire le projet
2. Exécuter `npm run install:all`
3. Copier `.env.example` → `.env`
4. Remplir les credentials Azure
5. Exécuter `npm run sync`
6. Exécuter `npm run server:dev`

**Résultat attendu** :
```
╔════════════════════════════════════════════╗
║     SmartContext Doc - Serveur API        ║
╚════════════════════════════════════════════╝

🚀 Serveur démarré sur http://localhost:8787
```

**Critères de succès** :
- ✅ Pas d'erreur lors de `npm install`
- ✅ Serveur démarre sans erreur
- ✅ `curl http://localhost:8787/health` retourne `{"status":"ok"}`

---

### Test 2 : Chargement extension Chrome

**Objectif** : Vérifier que l'extension se charge correctement dans Chrome.

**Étapes** :
1. Ouvrir Chrome : `chrome://extensions`
2. Activer "Mode développeur"
3. Cliquer "Charger l'extension non empaquetée"
4. Sélectionner le dossier `extension/`

**Résultat attendu** :
- Extension "SmartContext Doc v1.0.0" apparaît dans la liste
- Icône visible dans la barre d'outils

**Critères de succès** :
- ✅ Extension chargée sans erreur
- ✅ Pas de warnings dans la console de l'extension
- ✅ Icône cliquable

---

### Test 3 : Détection URL - Jira

**Objectif** : Vérifier que la doc Jira s'affiche sur une URL Jira.

**Étapes** :
1. Naviguer vers `https://jira.atlassian.net/browse/TEST-123`
2. Cliquer sur l'icône SmartContext Doc

**Résultat attendu** :
```
Popup affiche :
- URL : https://jira.atlassian.net/browse/TEST-123
- Serveur : Connecté (pastille verte)
- Documentation : "Guide Jira"
- Tags : "process", "workflow", "tickets"
- Bouton "Ouvrir la documentation"
```

**Critères de succès** :
- ✅ URL détectée correctement
- ✅ Mapping "jira" trouvé
- ✅ Titre et tags affichés
- ✅ Pas d'erreur dans la console

---

### Test 4 : Détection URL - GitHub

**Objectif** : Vérifier que la doc GitHub s'affiche sur une URL GitHub.

**Étapes** :
1. Naviguer vers `https://github.com/torvalds/linux/pull/1`
2. Cliquer sur l'icône SmartContext Doc

**Résultat attendu** :
```
Popup affiche :
- Documentation : "Cheatsheet GitHub"
- Tags : "git", "code review"
```

**Critères de succès** :
- ✅ Mapping "github" trouvé
- ✅ Documentation affichée

---

### Test 5 : Aucune documentation trouvée

**Objectif** : Vérifier le comportement quand aucune doc ne correspond.

**Étapes** :
1. Naviguer vers `https://example.com`
2. Cliquer sur l'icône SmartContext Doc

**Résultat attendu** :
```
Popup affiche :
- 🔍 Aucune documentation trouvée pour cette page
- Bouton "Signaler une documentation manquante"
```

**Critères de succès** :
- ✅ Message clair affiché
- ✅ Bouton "Signaler" fonctionnel (log en console)

---

### Test 6 : Mode hors ligne

**Objectif** : Vérifier que l'extension fonctionne sans serveur.

**Étapes** :
1. Arrêter le serveur (Ctrl+C)
2. Naviguer vers `https://github.com`
3. Cliquer sur l'icône SmartContext Doc

**Résultat attendu** :
```
Popup affiche :
- Serveur : Mode hors ligne (pastille orange)
- Documentation : "Cheatsheet GitHub" (depuis mapping local)
- Pas de résumé IA (sections masquées)
```

**Critères de succès** :
- ✅ Pastille orange affichée
- ✅ Documentation chargée depuis `extension/mapping.json`
- ✅ Pas d'erreur réseau dans la console

---

### Test 7 : Génération résumé IA

**Objectif** : Vérifier que la génération de résumé fonctionne.

**Prérequis** : Azure OpenAI configuré correctement.

**Étapes** :
1. Exécuter :
   ```bash
   curl -X POST http://localhost:8787/summarize \
     -H "Content-Type: application/json" \
     -d '{"key":"jira","text":"Guide Jira pour débutants. Étapes : créer un projet, définir un workflow, créer des tickets."}'
   ```

**Résultat attendu** :
```json
{
  "status": "success",
  "key": "jira",
  "summary": "Ce guide explique...",
  "message": "Résumé généré avec succès"
}
```

**Critères de succès** :
- ✅ Code HTTP 200
- ✅ JSON valide retourné
- ✅ Fichier `server/data/summaries/jira.json` créé

---

### Test 8 : Affichage résumé IA dans popup

**Objectif** : Vérifier que le résumé IA s'affiche dans le popup.

**Prérequis** : Test 7 réussi (résumé généré pour "jira").

**Étapes** :
1. Serveur démarré
2. Naviguer vers `https://jira.atlassian.net`
3. Cliquer sur l'icône SmartContext Doc

**Résultat attendu** :
```
Popup affiche :
- Section "Résumé IA" visible
- Section "Checklist" avec 5 points
- Section "Erreurs fréquentes" avec 3 erreurs
- Section "FAQ" avec 3 questions/réponses
```

**Critères de succès** :
- ✅ Résumé affiché
- ✅ Checklist formatée correctement
- ✅ FAQ affichée avec questions en bleu

---

### Test 9 : Ajout mapping via API

**Objectif** : Vérifier l'ajout d'un nouveau mapping.

**Étapes** :
1. Exécuter :
   ```bash
   curl -X POST http://localhost:8787/ingest \
     -H "Content-Type: application/json" \
     -d '{
       "key":"slack",
       "title":"Guide Slack",
       "urlMatch":["slack.com","app.slack.com"],
       "docUrlOrPath":"docs/slack_guide.pdf",
       "tags":["communication"]
     }'
   ```

**Résultat attendu** :
```json
{
  "status": "updated",
  "key": "slack",
  "title": "Guide Slack",
  "message": "Mapping mis à jour avec succès"
}
```

**Vérifications** :
1. Fichier `server/data/mapping.json` contient la nouvelle entrée
2. Fichier `extension/mapping.json` synchronisé automatiquement

**Critères de succès** :
- ✅ API retourne 200
- ✅ Mapping mis à jour
- ✅ Extension reflète le changement après rechargement

---

### Test 10 : Workflow n8n

**Objectif** : Vérifier que le workflow n8n fonctionne.

**Prérequis** : n8n installé et démarré (`npx n8n`).

**Étapes** :
1. Importer `n8n/workflow.smartcontext.json` dans n8n
2. Activer le workflow
3. Exécuter :
   ```bash
   curl -X POST http://localhost:5678/webhook/smartcontext/upload \
     -H "Content-Type: application/json" \
     -d '{
       "key":"notion",
       "title":"Guide Notion",
       "urlMatch":["notion.so"],
       "docUrlOrPath":"docs/notion.pdf"
     }'
   ```

**Résultat attendu** :
```json
{
  "status": "updated",
  "key": "notion",
  "title": "Guide Notion",
  "mapping_updated": true,
  "summary_generated": true,
  "summary_excerpt": "...",
  "timestamp": "..."
}
```

**Critères de succès** :
- ✅ Workflow s'exécute sans erreur
- ✅ Mapping mis à jour dans le serveur
- ✅ Résumé généré (si Azure configuré)

---

## 🔧 Tests Techniques

### Test de performance : Temps de réponse

**Objectif** : Mesurer les temps de réponse des endpoints.

```bash
# Health check
time curl http://localhost:8787/health

# Mapping
time curl http://localhost:8787/mapping.json

# Résumé (si existe)
time curl http://localhost:8787/summaries/jira
```

**Critères de succès** :
- ✅ `/health` < 50ms
- ✅ `/mapping.json` < 100ms
- ✅ `/summaries/:key` < 200ms

---

### Test de charge : Multiples requêtes

**Objectif** : Vérifier que le serveur supporte plusieurs requêtes simultanées.

```bash
# Lancer 10 requêtes parallèles
for i in {1..10}; do
  curl http://localhost:8787/health &
done
wait
```

**Critères de succès** :
- ✅ Toutes les requêtes retournent 200
- ✅ Pas d'erreur dans les logs serveur

---

### Test de sécurité : Injection

**Objectif** : Vérifier que les inputs sont validés.

```bash
# Tentative d'injection dans le key
curl -X POST http://localhost:8787/ingest \
  -H "Content-Type: application/json" \
  -d '{"key":"../../../etc/passwd","title":"Hack","urlMatch":["test"],"docUrlOrPath":"test"}'
```

**Critères de succès** :
- ✅ Requête rejetée ou key nettoyé
- ✅ Pas d'accès à des fichiers système

---

### Test Azure : Fallback

**Objectif** : Vérifier le comportement si Azure est indisponible.

**Étapes** :
1. Modifier `.env` avec un endpoint invalide
2. Exécuter `npm run test:summarize`

**Résultat attendu** :
```json
{
  "summary": "Documentation pour test. Le résumé IA n'est pas disponible...",
  "_fallback": true,
  ...
}
```

**Critères de succès** :
- ✅ Pas de crash serveur
- ✅ Fallback retourné
- ✅ Message clair sur la configuration

---

## 📊 Checklist complète

### Installation
- [ ] Node.js ≥ 18 installé
- [ ] Dépendances installées (`npm install`)
- [ ] `.env` configuré
- [ ] Mapping synchronisé

### Serveur
- [ ] Serveur démarre sans erreur
- [ ] `/health` retourne OK
- [ ] `/mapping.json` retourne les mappings
- [ ] CORS activé

### Extension
- [ ] Extension chargée dans Chrome
- [ ] Pas d'erreur dans console extension
- [ ] Icône visible et cliquable
- [ ] Popup s'ouvre correctement

### Fonctionnalités
- [ ] Détection URL fonctionne
- [ ] Matching trouve la bonne doc
- [ ] Mode hors ligne fonctionne
- [ ] Résumé IA s'affiche (si généré)
- [ ] Boutons fonctionnels (Actualiser, Signaler)

### API
- [ ] POST /ingest met à jour le mapping
- [ ] POST /summarize génère un résumé
- [ ] GET /summaries/:key retourne le résumé

### Azure AI
- [ ] Credentials configurés
- [ ] Génération de résumé réussie
- [ ] Fallback si Azure indisponible

### n8n (optionnel)
- [ ] Workflow importé
- [ ] Webhook actif
- [ ] Exécution sans erreur

---

## 🐛 Résolution de problèmes

### Extension ne détecte pas l'URL
- Vérifier `manifest.json` : `host_permissions` contient `<all_urls>`
- Recharger l'extension dans Chrome
- Vérifier la console du service worker

### Serveur ne démarre pas
- Port 8787 occupé ? Changer dans `.env`
- Node.js version ≥ 18 ?
- Dépendances installées ?

### Résumé IA non généré
- Variables `.env` correctes ?
- Tester : `node azure/summarize.js --sample jira`
- Vérifier les logs serveur pour erreurs Azure

### Mapping non synchronisé
- Exécuter manuellement : `npm run sync-mapping`
- Vérifier permissions lecture/écriture sur les fichiers

---

## 📈 Métriques de succès

| Métrique | Cible | Comment mesurer |
|----------|-------|-----------------|
| Taux de détection URL | ≥ 95% | Tests manuels sur URLs variées |
| Temps de réponse API | < 200ms | `time curl` |
| Disponibilité serveur | 99%+ | Monitoring uptime |
| Taux d'erreur génération IA | < 5% | Logs serveur |
| Satisfaction utilisateur | 4.5/5 | Feedback utilisateurs |

---

**Bon testing ! 🧪**
