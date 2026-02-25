# 🚀 Démarrage Rapide - SmartContext Doc

Guide express pour lancer le projet en 5 minutes.

## ⚡ Installation rapide

### 1. Installer les dépendances

```bash
# Depuis la racine du projet
npm run install:all
```

### 2. Configurer Azure

```bash
# Copier le template .env
cp .env.example .env

# Éditer .env avec vos credentials Azure
# Windows : notepad .env
# Mac/Linux : nano .env
```

Remplir :
```env
AZURE_OPENAI_ENDPOINT=https://VOTRE-INSTANCE.openai.azure.com/
AZURE_OPENAI_API_KEY=votre_clef
AZURE_OPENAI_DEPLOYMENT=gpt-4
```

### 3. Synchroniser le mapping

```bash
npm run sync
```

### 4. Démarrer le serveur

```bash
npm run server:dev
```

### 5. Charger l'extension

1. Ouvrir Chrome : `chrome://extensions`
2. Activer "Mode développeur"
3. "Charger l'extension non empaquetée"
4. Sélectionner le dossier `extension/`

## ✅ Vérification

### Tester le serveur

```bash
curl http://localhost:8787/health
```

Doit retourner : `{"status":"ok", ...}`

### Tester l'extension

1. Aller sur `https://github.com`
2. Cliquer sur l'icône SmartContext Doc
3. Doit afficher "Cheatsheet GitHub"

## 🎯 Prochaines étapes

- [Configuration Azure complète](README.md#️-configuration-azure-ai-foundry)
- [Utilisation n8n](README.md#-utilisation-n8n)
- [Personnalisation](README.md#-personnalisation)

## 🆘 Problèmes courants

**Port 8787 déjà utilisé ?**
```bash
# Changer le port dans .env
PORT=8788
```

**Extension ne s'affiche pas ?**
- Vérifier que le dossier `extension/` contient bien `manifest.json`
- Recharger l'extension dans Chrome

**Résumé IA non disponible ?**
- Vérifier `.env` (endpoint, clé, deployment)
- Tester : `npm run test:summarize`

---

📖 Documentation complète : voir [README.md](README.md)
