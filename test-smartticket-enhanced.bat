@echo off
echo ============================================================
echo 🎟️ Test SmartTicket V2 Enhanced - Nouvelles Fonctionnalités
echo ============================================================
echo.

echo 📊 Test des améliorations :
echo   ✅ scoreDetails (détail du score)
echo   ✅ recommendation (recommandations IA)
echo   ✅ priorityBadgeClass (badge priorité coloré)
echo   ✅ Bouton "Analyser à nouveau"
echo.

REM Health check
echo [0] Health check...
curl -s http://localhost:8787/smartticket/health
echo.
echo.

REM === Test Ticket Moyenne (3/5) ===
echo ============================================================
echo [1] Test Ticket Moyen (Score 3/5) - ID: 111525
echo ============================================================
echo.
echo Attendu :
echo   - Score: 3/5 (Moyenne)
echo   - Priorité: High (Badge Orange)
echo   - scoreDetails: 5 critères détaillés
echo   - recommendation: Texte riche avec actions concrètes
echo.
curl -s "http://localhost:8787/smartticket/analyze?url=https://mantis.example.com/view.php?id=111525"
echo.
echo.
pause

REM === Test Ticket Urgent (4/5) ===
echo ============================================================
echo [2] Test Ticket Critique (Score 4/5) - ID: 111888
echo ============================================================
echo.
echo Attendu :
echo   - Score: 4/5 (Élevée)
echo   - Priorité: Urgent (Badge Rouge avec animation)
echo   - scoreDetails: 7+ critères
echo   - recommendation: Commence par "⚠️ URGENT"
echo.
curl -s "http://localhost:8787/smartticket/analyze?url=https://mantis.example.com/view.php?id=111888"
echo.
echo.
pause

REM === Test Ticket Low Priority ===
echo ============================================================
echo [3] Test Ticket Simple (Score 1/5) - ID: 100001
echo ============================================================
echo.
echo Attendu :
echo   - Score: 1/5 (Faible)
echo   - Priorité: Low (Badge Bleu)
echo   - scoreDetails: 1-2 critères seulement
echo   - recommendation: Simple et directe
echo.
curl -s "http://localhost:8787/smartticket/analyze?url=https://mantis.example.com/view.php?id=100001"
echo.
echo.
pause

echo ============================================================
echo ✅ Tests terminés !
echo.
echo 📊 Vérifications à faire dans la popup Chrome :
echo.
echo 1️⃣ Badge Priorité
echo    - Low    : 🔵 Bleu
echo    - Normal : ⚪ Gris
echo    - High   : 🟠 Orange
echo    - Urgent : 🔴 Rouge (avec animation pulse)
echo.
echo 2️⃣ Section "📊 Détails du score"
echo    - Liste des critères avec impact (+1, +2)
echo    - Exemple : "📌 Modules impactés (+1)"
echo.
echo 3️⃣ Section "💡 Recommandation"
echo    - Texte formaté avec retours à la ligne
echo    - Actions concrètes et prioritaires
echo.
echo 4️⃣ Bouton "🔄 Analyser à nouveau"
echo    - Cliquer dessus recharge l'analyse
echo    - Feedback visuel : "⏳ Analyse en cours..." → "✅ Analysé !"
echo.
echo ============================================================
pause
