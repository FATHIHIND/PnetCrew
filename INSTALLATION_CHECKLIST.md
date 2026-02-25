# ✅ Checklist d'Installation - SmartContext Doc

Guide pas à pas pour vérifier que tout est correctement installé.

## 📋 Étape par Étape

### ☑️ 1. Vérification des Fichiers

Vérifiez que tous les fichiers sont présents :

```bash
# Depuis la racine du projet
ls -la
```

**Fichiers attendus à la racine** :
- [ ] `README.md`
- [ ] `QUICKSTART.md`
- [ ] `TESTING.md`
- [ ] `CLAUDE.md`
- [ ] `PROJECT_STRUCTURE.md`
- [ ] `INSTALLATION_CHECKLIST.md` (ce fichier)
- [ ] `package.json`
- [ ] `.env.example`
- [ ] `.gitignore`
- [ ] `start-server.bat`
- [ ] `start-server.sh`

**Dossiers attendus** :
- [ ] `extension/`
- [ ] `server/`
- [ ] `n8n/`

---

### ☑️ 2. Installation Node.js

```bash
node --version
```

**Version requise** : ≥ 18.0.0

Si Node.js n'est pas installé :
- Windows : [nodejs.org/download](https://nodejs.org/download)
- Mac : `brew install node`
- Linux : `sudo apt install nodejs npm` (Debian/Ubuntu)

---

### ☑️ 3. Installation des Dépendances

```bash
# Depuis la racine
cd server
npm install
```

**Vérifier l'installation** :
- [ ] Dossier `server/node_modules/` créé
- [ ] Pas d'erreurs affichées
- [ ] Packages installés : express, cors, dotenv, axios, pdf-parse, nodemon

**En cas d'erreur** :
- Supprimer `node_modules/` et `package-lock.json`
- Réexécuter `npm install`

---

### ☑️ 4. Configuration Variables d'Environnement

```bash
# Depuis la racine du projet
cp .env.example .env
```

**Éditer le fichier `.env`** :

```env
PORT=8787
AZURE_OPENAI_ENDPOINT=https://VOTRE-INSTANCE.openai.azure.com/
AZURE_OPENAI_API_KEY=votre_clef_api
AZURE_OPENAI_DEPLOYMENT=gpt-4
```

**Obtenir les credentials Azure** :

1. Aller sur [portal.azure.com](https://portal.azure.com)
2. Créer/sélectionner une ressource "Azure OpenAI"
3. Aller dans "Keys and Endpoint" :
   - Copier **Endpoint** → `AZURE_OPENAI_ENDPOINT`
   - Copier **Key 1** → `AZURE_OPENAI_API_KEY`
4. Aller dans [Azure AI Studio](https://oai.azure.com) :
   - Créer un deployment GPT
   - Noter le nom → `AZURE_OPENAI_DEPLOYMENT`

**Vérifier la configuration** :
- [ ] Fichier `.env` créé
- [ ] Les 3 variables Azure remplies
- [ ] Port défini (8787 par défaut)

---

### ☑️ 5. Synchronisation du Mapping

```bash
# Depuis le dossier server/
npm run sync-mapping
```

**Résultat attendu** :
```
📋 Synchronisation du mapping...
✓ Mapping chargé: 5 entrée(s)
✓ Mapping copié vers l'extension
✅ Synchronisation terminée avec succès!
```

**Vérifier** :
- [ ] Fichier `extension/mapping.json` existe
- [ ] Contenu identique à `server/data/mapping.json`

---

### ☑️ 6. Démarrage du Serveur

```bash
# Depuis le dossier server/
npm run dev
```

**Résultat attendu** :
```
╔════════════════════════════════════════════╗
║     SmartContext Doc - Serveur API        ║
╚════════════════════════════════════════════╝

🚀 Serveur démarré sur http://localhost:8787

📚 Endpoints disponibles:
   GET  /health              - Health check
   GET  /mapping.json        - Récupérer le mapping
   ...
```

**Vérifier** :
- [ ] Serveur démarre sans erreur
- [ ] Port 8787 écoute
- [ ] Pas de message d'erreur Azure (si configuré)

**Test rapide** :

```bash
# Dans un autre terminal
curl http://localhost:8787/health
```

**Réponse attendue** :
```json
{
  "status": "ok",
  "timestamp": "2026-02-05T...",
  "version": "1.0.0"
}
```

---

### ☑️ 7. Chargement Extension Chrome

1. **Ouvrir Chrome** : `chrome://extensions`

2. **Activer le Mode Développeur** :
   - Cliquer sur le switch en haut à droite

3. **Charger l'extension** :
   - Cliquer "Charger l'extension non empaquetée"
   - Naviguer vers le dossier `extension/`
   - Sélectionner et valider

4. **Vérifier** :
   - [ ] Extension "SmartContext Doc" visible dans la liste
   - [ ] Version : 1.0.0
   - [ ] Aucune erreur affichée
   - [ ] Icône visible dans la barre d'outils Chrome

**Inspecter le Service Worker** :
- Cliquer sur "Inspecter les vues : service worker"
- Vérifier dans la console : `[SmartContext] Background script chargé`

---

### ☑️ 8. Test Fonctionnel

**Test 1 : URL GitHub**

1. Naviguer vers : `https://github.com/torvalds/linux`
2. Cliquer sur l'icône SmartContext Doc
3. **Vérifier le popup** :
   - [ ] URL affichée : `https://github.com/...`
   - [ ] Statut serveur : "Serveur connecté" (pastille verte)
   - [ ] Documentation : "Cheatsheet GitHub"
   - [ ] Tags : "git", "code review"
   - [ ] Bouton "Ouvrir la documentation" présent

**Test 2 : URL Jira**

1. Naviguer vers : `https://jira.atlassian.net/`
2. Cliquer sur l'icône SmartContext Doc
3. **Vérifier le popup** :
   - [ ] Documentation : "Guide Jira"
   - [ ] Tags : "process", "workflow", "tickets"

**Test 3 : Mode hors ligne**

1. Arrêter le serveur (Ctrl+C dans le terminal)
2. Actualiser le popup
3. **Vérifier** :
   - [ ] Statut : "Mode hors ligne" (pastille orange)
   - [ ] Documentation toujours affichée
   - [ ] Pas de résumé IA

---

### ☑️ 9. Test Azure AI (Optionnel)

**Prérequis** : Azure OpenAI configuré dans `.env`

```bash
# Test de génération de résumé
cd server
npm run summarize:sample
```

**Résultat attendu** :
```json
{
  "key": "test",
  "summary": "...",
  "checklist": [...],
  "common_errors": [...],
  "faqs": [...],
  "generated_at": "2026-02-05T...",
  "source": "azure-openai"
}
```

**Vérifier** :
- [ ] Pas d'erreur 401 (clé invalide)
- [ ] Pas d'erreur 404 (deployment non trouvé)
- [ ] JSON valide retourné
- [ ] Résumé en français

**En cas d'erreur** :
- Vérifier `.env` (endpoint, clé, deployment)
- Vérifier quota Azure OpenAI
- Consulter les logs serveur

---

### ☑️ 10. Test n8n (Optionnel)

**Prérequis** : n8n installé (`npm install -g n8n`)

1. **Démarrer n8n** :
   ```bash
   n8n
   # Ouvre http://localhost:5678
   ```

2. **Importer le workflow** :
   - Aller dans "Workflows" → "Import from File"
   - Sélectionner `n8n/workflow.smartcontext.json`
   - Cliquer "Import"

3. **Activer le workflow** :
   - Switch "Inactive" → "Active"

4. **Tester le webhook** :
   ```bash
   curl -X POST http://localhost:5678/webhook/smartcontext/upload \
     -H "Content-Type: application/json" \
     -d '{"key":"test","title":"Test Doc","urlMatch":["test.com"],"docUrlOrPath":"docs/test.pdf"}'
   ```

5. **Vérifier** :
   - [ ] Workflow s'exécute sans erreur
   - [ ] Réponse JSON reçue
   - [ ] Mapping mis à jour dans `server/data/mapping.json`

---

## 🎉 Installation Complète !

Si toutes les cases sont cochées, l'installation est réussie ! 🚀

## 🆘 Problèmes Courants

### ❌ Port 8787 déjà utilisé

**Solution** :
```env
# Dans .env, changer le port
PORT=8788
```

### ❌ Extension ne se charge pas

**Solutions** :
1. Vérifier que `manifest.json` existe dans `extension/`
2. Vérifier la console Chrome pour erreurs
3. Essayer de recharger l'extension

### ❌ "Cannot find module 'express'"

**Solution** :
```bash
cd server
rm -rf node_modules package-lock.json
npm install
```

### ❌ Azure OpenAI erreur 401

**Solution** :
1. Vérifier `AZURE_OPENAI_API_KEY` dans `.env`
2. Régénérer la clé dans le portail Azure si nécessaire

### ❌ Mapping non synchronisé

**Solution** :
```bash
cd server
npm run sync-mapping
```

---

## 📚 Prochaines Étapes

1. **Lire la documentation complète** : [README.md](README.md)
2. **Tester tous les scénarios** : [TESTING.md](TESTING.md)
3. **Personnaliser le mapping** : Éditer `server/data/mapping.json`
4. **Ajouter de vrais PDF** : Dans `extension/docs/`
5. **Créer des icônes** : Voir `extension/ICONS_README.txt`

---

## ✉️ Support

En cas de problème :
1. Consulter [README.md](README.md) section "Résolution de problèmes"
2. Vérifier les logs serveur (terminal)
3. Vérifier la console extension Chrome
4. Vérifier cette checklist étape par étape

---

**Bon développement ! 🎯**
