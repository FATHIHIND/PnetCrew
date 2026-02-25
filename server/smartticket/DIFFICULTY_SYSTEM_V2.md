# 📊 SmartTicket - Système d'Analyse de Difficulté V2 (Réaliste)

## 🎯 Vue d'ensemble

Système professionnel d'analyse de difficulté des tickets adapté à **PeopleNet**, **Mantis** et **PMTalk**.

Calcule un **score de difficulté sur 5** basé sur **7 critères réalistes** du monde de l'ERP RH.

---

## 🧮 Algorithme de Scoring

### Score Brut (0-14 points maximum)

Chaque critère ajoute de 0 à 2 points au score brut :

| Critère | Points | Description |
|---------|--------|-------------|
| **1. Modules impactés** | 0-2 | Nombre de modules PeopleNet concernés |
| **2. Mots-clés de risque** | 0-2 | Présence de mots-clés critiques |
| **3. Qualité du scénario** | 0-2 | Scénario de reproduction fourni ? |
| **4. Longueur description** | 0-2 | Complexité selon taille description |
| **5. Nombre commentaires** | 0-2 | Échanges nombreux = complexité |
| **6. Ticket réouvert** | 0-2 | Correctifs échoués précédemment |
| **7. Priorité Mantis** | 0-2 | Urgence du ticket |

### Conversion en Score Final (1-5)

| Score Brut | Score Final | Niveau | Badge |
|------------|-------------|--------|-------|
| 0-2 | **1/5** | Faible | 🟢 VERT |
| 3-4 | **2/5** | Faible | 🟢 VERT |
| 5-6 | **3/5** | Moyenne | 🟠 ORANGE |
| 7-8 | **4/5** | Élevée | 🔴 ROUGE |
| 9+ | **5/5** | Élevée | 🔴 ROUGE FONCÉ |

---

## 📋 Critères Détaillés

### Critère 1 : Modules PeopleNet Impactés

Détecte les modules fonctionnels mentionnés dans le ticket.

**Modules reconnus :**
- Paie
- Absence
- Planning
- RH
- Contrat
- Règlements
- Formation
- Temps
- Recrutement
- Entretien
- Compétences

**Scoring :**
- 1 module = **+0 point**
- 2 modules = **+1 point** (interactions possibles)
- 3+ modules = **+2 points** (complexité multi-module)

**Exemples :**
```
"Problème Planning" → 1 module → +0
"Incohérence Absence et Planning" → 2 modules → +1
"Bug Paie + Absence + Contrat" → 3 modules → +2
```

---

### Critère 2 : Mots-clés de Risque Fonctionnel

Détecte les mots-clés critiques dans titre, description et commentaires.

**Mots-clés critiques :**
- **Régression** : "régression", "fonctionnait avant", "depuis mise à jour"
- **Multi-client** : "multi-client", "tous les clients", "généralisé"
- **Impact financier** : "erreur paie", "salaire faux", "calcul incorrect"
- **Intégrité données** : "corruption", "perte de données", "doublon"
- **Conformité** : "DSN", "URSSAF", "non-conformité"
- **Blocage** : "blocage", "crash", "timeout"

**Scoring :**
- 1 mot-clé = **+1 point**
- 2+ mots-clés = **+2 points**

**Exemples :**
```
"Bug mineur affichage" → 0 mot-clé → +0
"Régression calcul paie" → 2 mots-clés → +2
"Corruption données multi-client" → 2 mots-clés → +2
```

---

### Critère 3 : Qualité du Scénario de Reproduction

Analyse la présence et la qualité du scénario de reproduction.

**Mots-clés de scénario :**
- "étapes", "reproduire", "scénario"
- "steps to reproduce", "comment reproduire"
- "marche à suivre", "procédure"

**Niveaux :**
- **Scénario clair** : mots-clés présents + description >200 chars → **+0 point**
- **Scénario partiel** : mots-clés présents mais description courte → **+1 point**
- **Scénario manquant** : aucun mot-clé → **+2 points**

**Exemples :**
```
"Étapes : 1) Ouvrir planning 2) Cliquer..." → Clair → +0
"Reproduire : ouvrir planning" → Partiel → +1
"Le planning ne fonctionne pas" → Manquant → +2
```

---

### Critère 4 : Longueur de la Description

La longueur indique la complexité et le détail du problème.

**Scoring :**
- < 300 caractères = **+0 point** (description courte)
- 300-999 caractères = **+1 point** (description détaillée)
- ≥ 1000 caractères = **+2 points** (problème complexe)

**Exemples :**
```
"Bug affichage" (15 chars) → +0
"Le planning affiche des créneaux incorrects pour les salariés en horaire variable..." (250 chars) → +1
"Contexte: Client ABC avec 500 salariés. Problème: Après migration V2024.1, le calcul des absences..." (1200 chars) → +2
```

---

### Critère 5 : Nombre de Commentaires

Les échanges nombreux indiquent une complexité ou des difficultés de résolution.

**Scoring :**
- 0-1 commentaires = **+0 point**
- 2-4 commentaires = **+1 point**
- 5+ commentaires = **+2 points**

**Exemples :**
```
0 commentaires → +0
3 commentaires (Support, Dev, Client) → +1
8 commentaires (multiples échanges) → +2
```

---

### Critère 6 : Ticket Réouvert

Les réouvertures indiquent des correctifs échoués ou incomplets.

**Scoring :**
- 0 réouverture = **+0 point**
- 1 réouverture = **+1 point**
- 2+ réouvertures = **+2 points**

**Détection :**
Analyse de l'historique du ticket (`history`) pour trouver les changements de statut vers "reopened".

**Exemples :**
```
new → assigned → resolved → closed → +0
new → assigned → resolved → reopened → +1
new → assigned → resolved → reopened → assigned → reopened → +2
```

---

### Critère 7 : Priorité Mantis

La priorité indique l'urgence et l'impact business.

**Scoring :**
- **Low / Normal** = **+0 point**
- **High** = **+1 point**
- **Urgent** = **+2 points**

**Exemples :**
```
priority: "low" → +0
priority: "high" → +1
priority: "urgent" → +2
```

---

## 📊 Exemples Complets

### Exemple 1 : Ticket Simple (Score 1/5)

**Ticket :**
```
ID: 100001
Titre: "Alignement colonne dans Planning"
Description: "La colonne 'Nom' du planning n'est pas alignée correctement sur Chrome."
Catégorie: Planning
Priorité: low
Commentaires: 0
Réouvertures: 0
```

**Analyse :**
- Modules : 1 (Planning) → **+0**
- Mots-clés risque : 0 → **+0**
- Scénario : manquant → **+2**
- Description : 80 chars → **+0**
- Commentaires : 0 → **+0**
- Réouvertures : 0 → **+0**
- Priorité : low → **+0**

**Score brut : 2 → Score final : 1/5 (Faible) 🟢**

---

### Exemple 2 : Ticket Moyen (Score 3/5)

**Ticket :**
```
ID: 111525
Titre: "Incohérence calcul absence multi-contrats"
Description: "Le calcul des absences ne fonctionne pas correctement pour les salariés ayant plusieurs contrats simultanés. Étapes: 1) Créer salarié multi-contrat 2) Poser absence 3) Constater doublon." (1300 chars)
Catégorie: Absence
Priorité: high
Commentaires: 4
Réouvertures: 0
```

**Analyse :**
- Modules : 2 (Absence, Planning) → **+1**
- Mots-clés risque : 1 ("incohérence") → **+1**
- Scénario : clair → **+0**
- Description : 1300 chars → **+2**
- Commentaires : 4 → **+1**
- Réouvertures : 0 → **+0**
- Priorité : high → **+1**

**Score brut : 6 → Score final : 3/5 (Moyenne) 🟠**

---

### Exemple 3 : Ticket Critique (Score 5/5)

**Ticket :**
```
ID: 112000
Titre: "Corruption données Planning + Absence après migration V2024.3 - Multi-client bloqué"
Description: "CRITIQUE: Corruption massive... 50+ clients bloqués... perte de données... DSN à risque..." (2500 chars)
Catégorie: Planning
Priorité: urgent
Commentaires: 12
Réouvertures: 3
```

**Analyse :**
- Modules : 5 (Planning, Absence, Paie, RH, Contrat) → **+2**
- Mots-clés risque : 6 ("corruption", "multi-client", "perte de données", "DSN", "régression", "blocage") → **+2**
- Scénario : manquant (impossible à reproduire) → **+2**
- Description : 2500 chars → **+2**
- Commentaires : 12 → **+2**
- Réouvertures : 3 → **+2**
- Priorité : urgent → **+2**

**Score brut : 14 → Score final : 5/5 (Élevée) 🔴**

---

## 📡 Format de Réponse API

### Endpoint

```
GET /smartticket/analyze?url=<ticket_url>
```

### Réponse JSON

```json
{
  "ticketId": "111525",
  "difficultyScore": 3,
  "difficultyLevel": "Moyenne",
  "rawScore": 6,
  "criteria": {
    "modules": 2,
    "riskWords": ["incohérence", "multi-contrats"],
    "missingScenario": false,
    "descriptionSize": 1300,
    "commentsCount": 4,
    "reopened": 0,
    "priority": "high"
  },
  "modules": ["Absence", "Planning"],
  "risks": [
    "Cross-module (2 modules impactés)",
    "Impact multi-clients",
    "Description insuffisante"
  ],
  "summary": "Ticket #111525 - Difficulté Moyenne (3/5). Complexité Absence & Planning avec interactions entre modules. Risques détectés : incohérence, multi-contrats.",
  "recommendation": "Demander un scénario de reproduction détaillé au client. Vérifier les interactions entre Absence et Planning. Estimer le nombre de clients impactés et prioriser en conséquence."
}
```

---

## 🧪 Tests

### Lancer les tests

```bash
cd C:\Users\FATIH\Desktop\PnetCrew
test-realistic-difficulty.bat
```

### URLs de test

| URL | ID | Score Attendu | Niveau |
|-----|----|---------------|--------|
| `?id=100001` | 100001 | 1/5 | Faible 🟢 |
| `?id=100002` | 100002 | 2/5 | Faible 🟢 |
| `?id=111525` | 111525 | 3/5 | Moyenne 🟠 |
| `?id=111888` | 111888 | 4/5 | Élevée 🔴 |
| `?id=112000` | 112000 | 5/5 | Élevée 🔴 |

### Test manuel avec curl

```bash
# Ticket simple (1/5)
curl "http://localhost:8787/smartticket/analyze?url=https://mantis.example.com/view.php?id=100001"

# Ticket complexe (3/5)
curl "http://localhost:8787/smartticket/analyze?url=https://mantis.example.com/view.php?id=111525"

# Ticket critique (5/5)
curl "http://localhost:8787/smartticket/analyze?url=https://mantis.example.com/view.php?id=112000"
```

---

## 🎨 Intégration Extension Chrome

L'extension appelle automatiquement l'API et affiche :

- **Badge coloré** : Vert (1-2), Orange (3), Rouge (4-5)
- **Barre de 5 segments** : remplie selon le score
- **Modules impactés** : badges bleus
- **Risques détectés** : liste rouge avec icônes

---

## 🔧 Configuration

### Ajouter un module PeopleNet

**Fichier** : `analyzers/difficulty-v2.js`

```javascript
const PEOPLENET_MODULES = [
  'Paie',
  'Absence',
  // ...
  'NOUVEAU_MODULE'  // ← Ajouter ici
];
```

### Ajouter un mot-clé de risque

```javascript
const RISK_KEYWORDS = [
  'régression',
  'incohérence',
  // ...
  'nouveau_risque'  // ← Ajouter ici
];
```

### Modifier les seuils de conversion

```javascript
function calculateFinalScore(rawScore) {
  if (rawScore <= 2) return 1;
  if (rawScore <= 4) return 2;
  if (rawScore <= 6) return 3;  // ← Modifier ici
  if (rawScore <= 8) return 4;
  return 5;
}
```

---

## 📚 Fichiers

| Fichier | Description |
|---------|-------------|
| `analyzers/difficulty-v2.js` | Algorithme de scoring réaliste |
| `examples/realistic-tickets.js` | 5 tickets d'exemple (1/5 à 5/5) |
| `routes/smartticket.routes.js` | API REST GET /analyze |
| `DIFFICULTY_SYSTEM_V2.md` | Cette documentation |

---

## ✅ Avantages du Système V2

✅ **Réaliste** : Basé sur vrais critères ERP RH
✅ **Professionnel** : Adapté à PeopleNet/Mantis
✅ **Transparent** : Score détaillé par critère
✅ **Extensible** : Facile d'ajouter modules/risques
✅ **Testé** : 5 exemples couvrant tous niveaux
✅ **Intégré** : Compatible extension Chrome existante

---

**Version** : 2.0.0
**Date** : 2026-02-10
**Auteur** : Claude Sonnet 4.5
