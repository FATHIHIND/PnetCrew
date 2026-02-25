@echo off
echo ============================================================
echo 🎟️ Test SmartTicket V3.0 - Pipeline Complet (4 Étapes)
echo ============================================================
echo.

echo 📊 Pipeline :
echo   1️⃣ Complétude (barrière)
echo   2️⃣ Résumé
echo   3️⃣ Difficulté
echo   4️⃣ Similarité
echo.

REM Health check
echo [0] Health check...
curl -s http://localhost:8787/smartticket/health
echo.
echo.

REM === Test 1 : Ticket REJETÉ (Score < 55) ===
echo ============================================================
echo [1] Test Ticket REJETÉ - Score complétude ^< 55
echo ============================================================
echo ID: TEST-001
echo Description: "Bonjour, svp"
echo.
echo Attendu :
echo   - 🔴 Ticket rejeté
echo   - Pipeline arrêté après étape 1
echo   - Pas de résumé, difficulté ni similarité
echo.
curl -s "http://localhost:8787/smartticket/full-analysis?url=https://mantis.example.com/view.php?id=TEST-001"
echo.
echo.
pause

REM === Test 2 : Ticket ACCEPTÉ INCOMPLET (55 ≤ Score < 80) ===
echo ============================================================
echo [2] Test Ticket ACCEPTÉ INCOMPLET - 55 ≤ Score ^< 80
echo ============================================================
echo ID: TEST-002
echo Description complète mais manque environnement et preuve
echo.
echo Attendu :
echo   - 🟠 Ticket accepté mais incomplet
echo   - Pipeline continue (4 étapes exécutées)
echo   - Résumé, difficulté et similarité générés
echo.
curl -s "http://localhost:8787/smartticket/full-analysis?url=https://mantis.example.com/view.php?id=TEST-002"
echo.
echo.
pause

REM === Test 3 : Ticket COMPLET (Score ≥ 80) ===
echo ============================================================
echo [3] Test Ticket COMPLET - Score ≥ 80
echo ============================================================
echo ID: TEST-003
echo Description complète avec étapes, environnement et preuve
echo.
echo Attendu :
echo   - 🟢 Ticket complet
echo   - Pipeline complet exécuté (4 étapes)
echo   - Résumé détaillé, difficulté élevée, tickets similaires
echo.
curl -s "http://localhost:8787/smartticket/full-analysis?url=https://mantis.example.com/view.php?id=TEST-003"
echo.
echo.
pause

REM === Test 4 : Ticket RÉGRESSION ===
echo ============================================================
echo [4] Test Ticket RÉGRESSION
echo ============================================================
echo ID: TEST-004
echo Ticket avec régression après mise à jour
echo.
echo Attendu :
echo   - 🟢 Ticket complet
echo   - Difficulté élevée (4-5/5)
echo   - Risques : "Régression fonctionnelle"
echo   - Tickets similaires trouvés
echo.
curl -s "http://localhost:8787/smartticket/full-analysis?url=https://mantis.example.com/view.php?id=TEST-004"
echo.
echo.
pause

REM === Test 5 : Ticket SIMPLE (Cosmetic) ===
echo ============================================================
echo [5] Test Ticket SIMPLE (Cosmetic)
echo ============================================================
echo ID: TEST-005
echo Problème d'alignement (priorité low)
echo.
echo Attendu :
echo   - 🟢 Ticket complet
echo   - Difficulté faible (1-2/5)
echo   - Peu de risques
echo.
curl -s "http://localhost:8787/smartticket/full-analysis?url=https://mantis.example.com/view.php?id=TEST-005"
echo.
echo.

echo ============================================================
echo ✅ Tests terminés !
echo.
echo 📊 Récapitulatif :
echo   TEST-001 : 🔴 Rejeté (Score ^< 55)
echo   TEST-002 : 🟠 Incomplet (Score 55-79)
echo   TEST-003 : 🟢 Complet (Score ≥ 80)
echo   TEST-004 : 🟢 Complet avec régression
echo   TEST-005 : 🟢 Complet simple
echo.
echo 🎯 Points de validation :
echo   □ Étape 1 rejette les tickets incomplets
echo   □ Pipeline s'arrête si rejeté
echo   □ Pipeline continue si accepté (incomplet ou complet)
echo   □ Résumé généré (4-6 lignes)
echo   □ Difficulté calculée (1-5)
echo   □ Tickets similaires trouvés (max 3)
echo.
echo ============================================================
pause
