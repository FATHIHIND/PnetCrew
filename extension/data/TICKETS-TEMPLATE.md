# Template fichier Excel - tickets_seed.xlsx

## 📋 Format requis

Le fichier Excel doit contenir ces colonnes (ordre flexible) :

| Colonne | Type | Requis | Exemple | Description |
|---------|------|--------|---------|-------------|
| **id_ticket** | Texte/Nombre | ✅ Oui | `112020` | Identifiant unique du ticket |
| **title** | Texte | ✅ Oui | `Incohérence calcul absence` | Titre court du ticket |
| **description** | Texte | ❌ Non | `Le calcul des absences...` | Description détaillée |
| **modules** | Texte | ❌ Non | `Absence;Planning` | Modules séparés par `;` |
| **priority** | Texte | ❌ Non | `high` | Priorité (low, normal, high, urgent) |
| **category** | Texte | ❌ Non | `Absence` | Catégorie du ticket |

---

## ✅ Exemples valides

### Format standard
```
| id_ticket | title                              | description                   | modules          | priority |
|-----------|------------------------------------|-------------------------------|------------------|----------|
| 112020    | Incohérence calcul absence         | Le calcul ne marche pas...   | Absence;Planning | high     |
| 110452    | Erreur planning                    | Après modification absence... | Planning         | normal   |
| 109876    | Bug affichage bulletin             | Le bulletin ne s'affiche...  | Paie             | low      |
```

### Format avec variations de noms (détectées automatiquement)
```
| ID      | Title                    | Description           | Modules | Priority |
|---------|--------------------------|----------------------|---------|----------|
| 112020  | Incohérence absence      | Le calcul...         | Absence | High     |
```

```
| id      | titre                    | desc                 | modules | priorite |
|---------|--------------------------|----------------------|---------|----------|
| 112020  | Incohérence absence      | Le calcul...         | Absence | Haute    |
```

**Note** : Le système normalise automatiquement les noms de colonnes.

---

## 📝 Bonnes pratiques

### 1. ID unique
- Utiliser des IDs uniques (pas de doublons)
- Format : numérique (`112020`) ou alphanumérique (`TICKET-112020`)

### 2. Titre descriptif
- Court mais précis (30-80 caractères)
- Inclure le problème principal
- Exemples :
  - ✅ `Incohérence calcul absence multi-contrats`
  - ❌ `Bug` (trop vague)

### 3. Description détaillée
- Optionnel mais recommandé
- Plus la description est riche, meilleur sera l'embedding
- Inclure : contexte, étapes, impact

### 4. Modules
- Séparer par `;` si plusieurs
- Exemples : `Paie`, `Absence;Planning`, `RH;Contrat`

### 5. Priorité
- Valeurs acceptées : `low`, `normal`, `high`, `urgent`
- Insensible à la casse : `High`, `HIGH`, `high` → OK

---

## 🔢 Taille recommandée

| Nombre de tickets | Temps d'initialisation | Taille IndexedDB |
|-------------------|------------------------|------------------|
| 10-50 tickets | ~30 secondes | ~100 KB |
| 50-200 tickets | ~2-5 minutes | ~400 KB |
| 200-1000 tickets | ~10-30 minutes | ~2 MB |
| 1000+ tickets | ~30+ minutes | ~10+ MB |

**Note** : La génération d'embeddings via Azure OpenAI prend ~1-2 secondes par ticket.

---

## 🚫 Erreurs courantes

### ❌ Colonnes manquantes
```
| ID | Description |
|----|-------------|
| 1  | Bug paie    |
```
**Problème** : Colonne `title` manquante
**Solution** : Ajouter au minimum `id_ticket` et `title`

### ❌ Doublons d'ID
```
| id_ticket | title |
|-----------|-------|
| 112020    | Bug A |
| 112020    | Bug B |
```
**Problème** : Même ID utilisé 2 fois
**Solution** : Utiliser des IDs uniques

### ❌ Encodage incorrect
```
| id_ticket | title |
|-----------|-------|
| 112020    | Probl�me |
```
**Problème** : Caractères spéciaux mal encodés
**Solution** : Enregistrer l'Excel en UTF-8

---

## 📦 Exemple complet

Fichier : `tickets_seed.xlsx`

**Feuille 1 (unique)**

| id_ticket | title | description | modules | priority | category |
|-----------|-------|-------------|---------|----------|----------|
| 112020 | Incohérence calcul absence multi-contrats | Le calcul des absences ne fonctionne pas correctement pour les salariés ayant plusieurs contrats simultanés. Les absences sont comptabilisées en double. | Absence;Planning | high | Absence |
| 110452 | Erreur calcul planning après modification | Après modification d'une absence, le planning ne se recalcule pas automatiquement. Impact sur le pointage. | Planning;Absence | normal | Planning |
| 109876 | Bug affichage bulletin de paie | Le bulletin de paie ne s'affiche pas correctement sur Google Chrome. Les colonnes sont décalées. | Paie | low | Paie |
| 111525 | Bug calcul paie avec prime exceptionnelle | La prime exceptionnelle n'est pas prise en compte dans le calcul du net à payer. | Paie | urgent | Paie |
| 108765 | Régression paie après mise à jour V2024.2 | Depuis la mise à jour V2024.2, les calculs de paie sont incorrects pour plusieurs clients. Cotisations sociales mal calculées. | Paie | urgent | Paie |

---

## ✅ Validation avant import

Avant d'utiliser votre fichier Excel, vérifiez :

- [ ] Colonnes `id_ticket` et `title` présentes
- [ ] Pas de doublons d'ID
- [ ] Encodage UTF-8
- [ ] Pas de cellules fusionnées
- [ ] Première ligne = en-têtes de colonnes
- [ ] Pas de formules Excel (seulement des valeurs)

---

## 🔄 Mise à jour de la base

Pour recharger le fichier Excel après modification :

```javascript
// Console du service worker (chrome://extensions → service worker)
chrome.runtime.sendMessage({action: 'reinitializeVectorDB'}, (response) => {
  console.log('Réinitialisation:', response);
});
```

⚠️ **Attention** : Cette action supprime toute la base existante et recharge depuis Excel.

---

## 📥 Où placer le fichier

**Emplacement** : `extension/data/tickets_seed.xlsx`

**Structure finale** :
```
extension/
├── data/
│   └── tickets_seed.xlsx  ← Votre fichier Excel ICI
├── js/
├── lib/
└── manifest.json
```

---

**Prêt !** Une fois le fichier placé, rechargez l'extension et la base vectorielle s'initialisera automatiquement. 🚀
