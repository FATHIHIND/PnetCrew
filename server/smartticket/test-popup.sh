#!/bin/bash

# Script de test pour SmartTicket Popup
# Usage: ./test-popup.sh

echo "🎟️ Test SmartTicket - Extension Chrome"
echo "========================================"
echo ""

# 1. Health check
echo "1️⃣ Health check du serveur..."
curl -s http://localhost:8787/smartticket/health | jq '.' || echo "❌ Serveur non démarré"
echo ""

# 2. Analyser un ticket (mock)
echo "2️⃣ Analyse d'un ticket mock..."
curl -s -X POST http://localhost:8787/smartticket/analyze \
  -H "Content-Type: application/json" \
  -d '{"ticketId": "12345", "source": "mantis"}' | jq '.'
echo ""

# 3. Récupérer le dernier résultat
echo "3️⃣ Récupération du dernier résultat..."
curl -s http://localhost:8787/smartticket/last-result | jq '.'
echo ""

echo "✅ Test terminé !"
echo ""
echo "👉 Maintenant, ouvrez l'extension Chrome SmartTicket"
echo "   pour voir le résultat dans la popup."
