# Configuration XLSX.js pour l'extension

## 📦 Télécharger XLSX.js

La bibliothèque XLSX.js est nécessaire pour lire le fichier Excel.

### Option 1 : Téléchargement direct

1. Aller sur : https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js
2. Faire **Clic droit → Enregistrer sous**
3. Sauvegarder dans : `extension/lib/xlsx.full.min.js`

### Option 2 : Via npm (si Node.js installé)

```bash
cd extension
mkdir -p lib
curl -o lib/xlsx.full.min.js https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js
```

### Option 3 : Via CDN (alternative)

Si vous préférez utiliser un CDN, modifiez `popup.html` pour ajouter :

```html
<script src="https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js"></script>
```

## ✅ Vérification

Une fois le fichier téléchargé, la structure doit être :

```
extension/
├── lib/
│   └── xlsx.full.min.js  ← Ce fichier
├── data/
│   └── tickets_seed.xlsx
├── js/
│   ├── excel-loader.js
│   └── vector-db.js
└── manifest.json
```

## 🚀 Démarrage

Après avoir téléchargé `xlsx.full.min.js` :

1. Rechargez l'extension dans Chrome
2. La base vectorielle sera initialisée automatiquement
3. Vérifiez les logs dans la console du service worker

**Note** : Le fichier fait environ 750 KB. Le téléchargement peut prendre quelques secondes.
