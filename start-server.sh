#!/bin/bash
# Script de démarrage pour Linux/Mac
# SmartContext Doc - Serveur API

echo "========================================"
echo "  SmartContext Doc - Démarrage serveur"
echo "========================================"
echo ""

# Vérifier si node est installé
if ! command -v node &> /dev/null; then
    echo "[ERREUR] Node.js n'est pas installé"
    echo "Télécharger depuis : https://nodejs.org"
    exit 1
fi

echo "[OK] Node.js détecté"
node --version
echo ""

# Vérifier si .env existe
if [ ! -f .env ]; then
    echo "[ATTENTION] Fichier .env manquant"
    echo ""
    echo "Copie de .env.example vers .env..."
    cp .env.example .env
    echo ""
    echo "[ACTION REQUISE] Éditez le fichier .env avec vos credentials Azure"
    echo "  - AZURE_OPENAI_ENDPOINT"
    echo "  - AZURE_OPENAI_API_KEY"
    echo "  - AZURE_OPENAI_DEPLOYMENT"
    echo ""

    # Ouvrir l'éditeur par défaut
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open -e .env
    else
        ${EDITOR:-nano} .env
    fi

    echo ""
    read -p "Appuyez sur Entrée une fois la configuration terminée..."
fi

# Vérifier si node_modules existe
if [ ! -d "server/node_modules" ]; then
    echo "[INFO] Installation des dépendances..."
    cd server
    npm install
    cd ..
    echo ""
fi

# Synchroniser le mapping
echo "[INFO] Synchronisation du mapping..."
cd server
npm run sync-mapping
echo ""

# Démarrer le serveur
echo "[INFO] Démarrage du serveur en mode développement..."
echo ""
echo "Le serveur va démarrer sur http://localhost:8787"
echo "Appuyez sur Ctrl+C pour arrêter le serveur"
echo ""
npm run dev
