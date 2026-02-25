# 🎟️ SmartTicket - Extension Chrome

Extension Chrome pour afficher l'analyse des tickets difficiles depuis le backend SmartTicket.

## 📁 Structure

```
smartticket/
├── popup.html     # Interface utilisateur
├── popup.css      # Styles professionnels
├── popup.js       # Logique d'affichage
└── README.md      # Documentation
```

## 🚀 Installation

### 1. Charger l'extension

1. Ouvrir Chrome et aller à `chrome://extensions`
2. Activer le **Mode développeur** (en haut à droite)
3. Cliquer sur **Charger l'extension non empaquetée**
4. Sélectionner le dossier `extension/` (parent de smartticket/)

### 2. Configurer le serveur

Le serveur backend doit être démarré sur `http://localhost:8787` :

```bash
cd server
npm run dev
```

## 🎯 Utilisation

### Étape 1 : Analyser un ticket

Utiliser l'API backend pour analyser un ticket :

```bash
curl -X POST http://localhost:8787/smartticket/analyze \
  -H "Content-Type: application/json" \
  -d '{"ticketId": "12345", "source": "mantis"}'
```

Le résultat est automatiquement stocké dans le cache pour la popup.

### Étape 2 : Ouvrir la popup

1. Cliquer sur l'icône de l'extension dans Chrome
2. La popup affiche automatiquement le dernier ticket analysé

## 📊 Affichage

La popup affiche :

### 🔍 En-tête
- **ID du ticket** (ex: #12345)
- **Titre** (ex: "Incohérence calcul absence multi-contrats")

### 📊 Difficulté
- **Badge coloré** selon le niveau :
  - 🟢 **Faible** (1.0-1.5) - Vert
  - 🟡 **Moyen** (1.5-2.5) - Jaune
  - 🟠 **Élevé** (2.5-3.5) - Orange
  - 🔴 **Très Élevé** (3.5-4.5) - Rouge
  - 🔴 **Critique** (4.5-5.0) - Rouge foncé

- **Score numérique** (ex: 4.5)
- **Barre de 5 segments** remplie proportionnellement

### 🔧 Modules Impactés
Liste des modules fonctionnels touchés (Absence, Paie, Planning, etc.)

### ⚠️ Risques Détectés
- Risque d'intégrité des données
- Impact financier
- Plusieurs clients affectés
- etc.

### 🤖 Résumé IA
Résumé généré par l'analyseur SmartTicket avec contexte et recommandations.

### 📋 Métadonnées
- **Priorité** (urgent, high, normal, low)
- **Statut** (new, assigned, resolved, etc.)
- **Âge** (nombre de jours depuis création)

## 🎨 Personnalisation

### Modifier les couleurs

Éditer `popup.css`, variables dans les classes `.difficulty-badge.*` :

```css
.difficulty-badge.critical {
  background: #fbd5d5;
  color: #742a2a;
}
```

### Changer l'URL de l'API

Éditer `popup.js`, ligne 7 :

```javascript
const API_URL = 'http://localhost:8787/smartticket/last-result';
```

## 🔧 Débogage

### Console du Service Worker

1. Aller à `chrome://extensions`
2. Trouver l'extension SmartTicket
3. Cliquer sur **"Inspecter les vues : service worker"**

### Console de la Popup

1. Clic droit sur l'icône de l'extension
2. Sélectionner **"Inspecter"**
3. Voir les logs dans l'onglet Console

### Erreurs courantes

#### ❌ "Aucune analyse disponible"
- **Cause** : Aucun ticket n'a été analysé
- **Solution** : Analyser un ticket avec `POST /smartticket/analyze`

#### ❌ "Erreur HTTP 500"
- **Cause** : Le serveur backend a rencontré une erreur
- **Solution** : Vérifier les logs du serveur

#### ❌ "Failed to fetch"
- **Cause** : Le serveur backend n'est pas démarré
- **Solution** : Lancer `npm run dev` dans le dossier `server/`

## 🧪 Tests

### Test avec données mock (développement)

Le serveur fournit des données mock en mode développement :

```bash
# Dans server/.env
NODE_ENV=development

# Démarrer le serveur
npm run dev

# Analyser un ticket mock
curl -X POST http://localhost:8787/smartticket/analyze \
  -H "Content-Type: application/json" \
  -d '{"ticketId": "12345", "source": "mantis"}'
```

### Test de la popup

1. Analyser un ticket (voir ci-dessus)
2. Ouvrir la popup (clic sur l'icône)
3. Vérifier l'affichage :
   - Badge de difficulté coloré
   - Barre de 5 segments remplie
   - Modules affichés
   - Risques listés
   - Résumé formaté

## 📚 API Backend

L'extension utilise l'endpoint :

**GET** `/smartticket/last-result`

**Response (200):**
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
  "missingInformation": ["Scénario de reproduction non fourni"],
  "risks": ["Risque d'intégrité des données", "Plusieurs clients affectés"],
  "expertsNeeded": ["paie_expert", "planning_expert"],
  "dependencies": [
    {
      "type": "multi_module",
      "modules": ["absence", "paie"],
      "impact": "high"
    }
  ],
  "suggestedAction": "URGENT: Demander scénario de reproduction...",
  "summary": "Ticket #12345 (mantis) - Priorité urgent\\n...",
  "keyPoints": [...],
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

**Response (404):**
```json
{
  "error": "Aucune analyse disponible",
  "message": "Veuillez d'abord analyser un ticket avec POST /analyze"
}
```

## 🎉 Prochaines Étapes

- [ ] Auto-refresh toutes les X secondes
- [ ] Historique des derniers tickets analysés
- [ ] Export PDF du résultat
- [ ] Notifications desktop pour nouveaux tickets critiques
- [ ] Intégration directe avec Mantis/PMTalk
