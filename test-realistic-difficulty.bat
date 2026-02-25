@echo off
echo ============================================================
echo 🎟️ Test SmartTicket - Système d'Analyse Réaliste V2
echo ============================================================
echo.

echo 📊 Test de tous les niveaux de difficulté
echo.

REM Health check
echo [0] Health check...
curl -s http://localhost:8787/smartticket/health | jq .
echo.
echo.

REM === Difficulté 1/5 (Faible) ===
echo ==========================================
echo [1] Test Difficulté 1/5 - Ticket Simple UI
echo ==========================================
echo ID: 100001
echo Attendu: Score 1/5, Badge VERT
echo.
curl -s "http://localhost:8787/smartticket/analyze?url=https://mantis.example.com/view.php?id=100001" | jq .
echo.
echo.
pause

REM === Difficulté 2/5 (Faible) ===
echo ==========================================
echo [2] Test Difficulté 2/5 - Bug Modéré
echo ==========================================
echo ID: 100002
echo Attendu: Score 2/5, Badge VERT
echo.
curl -s "http://localhost:8787/smartticket/analyze?url=https://mantis.example.com/view.php?id=100002" | jq .
echo.
echo.
pause

REM === Difficulté 3/5 (Moyenne) ===
echo ==========================================
echo [3] Test Difficulté 3/5 - Multi-Module Complexe
echo ==========================================
echo ID: 111525
echo Attendu: Score 3/5, Badge ORANGE
echo.
curl -s "http://localhost:8787/smartticket/analyze?url=https://mantis.example.com/view.php?id=111525" | jq .
echo.
echo.
pause

REM === Difficulté 4/5 (Élevée) ===
echo ==========================================
echo [4] Test Difficulté 4/5 - Régression Critique
echo ==========================================
echo ID: 111888
echo Attendu: Score 4/5, Badge ROUGE
echo.
curl -s "http://localhost:8787/smartticket/analyze?url=https://mantis.example.com/view.php?id=111888" | jq .
echo.
echo.
pause

REM === Difficulté 5/5 (Élevée) ===
echo ==========================================
echo [5] Test Difficulté 5/5 - Ticket Cauchemar
echo ==========================================
echo ID: 112000
echo Attendu: Score 5/5, Badge ROUGE FONCÉ
echo.
curl -s "http://localhost:8787/smartticket/analyze?url=https://mantis.example.com/view.php?id=112000" | jq .
echo.
echo.
pause

REM === Test URL générique ===
echo ==========================================
echo [6] Test URL générique avec mots-clés
echo ==========================================
echo URL: error-multi-client-paie
echo Attendu: Score élevé (mots-clés détectés)
echo.
curl -s "http://localhost:8787/smartticket/analyze?url=https://example.com/error-multi-client-paie" | jq .
echo.
echo.

echo ============================================================
echo ✅ Tests terminés !
echo.
echo 📊 Résumé des scores attendus :
echo   - 100001 : 1/5 (Faible)   🟢
echo   - 100002 : 2/5 (Faible)   🟢
echo   - 111525 : 3/5 (Moyenne)  🟠
echo   - 111888 : 4/5 (Élevée)   🔴
echo   - 112000 : 5/5 (Élevée)   🔴
echo.
echo 👉 Testez maintenant dans l'extension Chrome !
echo ============================================================
pause
