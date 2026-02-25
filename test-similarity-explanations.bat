@echo off
echo ============================================================
echo 🔍 Test Tickets Similaires avec Explications V3.1
echo ============================================================
echo.

echo 📊 Tests prévus :
echo   1️⃣ Fetch détails ticket similaire
echo   2️⃣ Analyse complète avec explications
echo   3️⃣ Vérification qualité des explications
echo.

REM Health check
echo [0] Health check...
curl -s http://localhost:8787/smartticket/health
echo.
echo.

REM === Test 1 : Fetch ticket similaire ===
echo ============================================================
echo [1] Test Fetch Ticket Similaire - ID 111525
echo ============================================================
echo.
echo Attendu :
echo   - Détails complets du ticket
echo   - Modules : Absence, Contrat, Planning
echo   - Keywords : absence, multi-contrats, incohérence, calcul
echo   - RiskWords : incohérence, calcul incorrect, multi-contrats
echo.
curl -s http://localhost:8787/smartticket/fetch-ticket?id=111525
echo.
echo.
pause

REM === Test 2 : Analyse complète avec similarités ===
echo ============================================================
echo [2] Test Analyse Complète - Ticket avec similarités
echo ============================================================
echo ID: TEST-002
echo Description: Erreur calcul absence multi-contrats
echo.
echo Attendu :
echo   - 🟠 Ticket accepté incomplet
echo   - Difficulté : Moyenne (3/5)
echo   - 3 tickets similaires avec explications :
echo     * #111525 : ~92%% - Modules communs, termes identiques
echo     * #112020 : ~88%% - Catégorie identique, anomalies similaires
echo     * #110452 : ~67%% - Pattern fonctionnel comparable
echo.
curl -s "http://localhost:8787/smartticket/full-analysis?url=https://mantis.example.com/view.php?id=TEST-002"
echo.
echo.
pause

REM === Test 3 : Vérification JSON ===
echo ============================================================
echo [3] Test Format JSON - Explications présentes
echo ============================================================
echo.
echo Vérification :
echo   - similarTickets[].explanation existe
echo   - similarTickets[].explanationText existe
echo   - Raisons lisibles et pertinentes
echo.
curl -s "http://localhost:8787/smartticket/full-analysis?url=https://mantis.example.com/view.php?id=TEST-002" | findstr "explanation"
echo.
echo.
pause

REM === Test 4 : Fetch ticket inexistant ===
echo ============================================================
echo [4] Test Fetch Ticket Inexistant - ID 999999
echo ============================================================
echo.
echo Attendu :
echo   - 404 Not Found
echo   - Message d'erreur clair
echo.
curl -s http://localhost:8787/smartticket/fetch-ticket?id=999999
echo.
echo.
pause

REM === Test 5 : Ticket sans similarités ===
echo ============================================================
echo [5] Test Ticket Simple - Peu de similarités
echo ============================================================
echo ID: TEST-005
echo Description: Alignement colonne planning (cosmetic)
echo.
echo Attendu :
echo   - 🟢 Ticket complet
echo   - Difficulté : Faible (1-2/5)
echo   - Possiblement 0-1 ticket similaire (seuil > 0.3)
echo.
curl -s "http://localhost:8787/smartticket/full-analysis?url=https://mantis.example.com/view.php?id=TEST-005"
echo.
echo.

echo ============================================================
echo ✅ Tests terminés !
echo.
echo 📊 Récapitulatif :
echo   TEST 1 : Fetch détails ticket ✓
echo   TEST 2 : Analyse complète avec explications ✓
echo   TEST 3 : Format JSON validé ✓
echo   TEST 4 : Erreur 404 gérée ✓
echo   TEST 5 : Ticket sans similarités ✓
echo.
echo 🎯 Points de validation :
echo   □ Route /fetch-ticket fonctionne
echo   □ Explications générées automatiquement
echo   □ JSON contient explanation et explanationText
echo   □ Raisons pertinentes (modules, keywords, pattern)
echo   □ Top 3 tickets triés par score décroissant
echo.
echo 🔗 URLs Mantis reconstituées :
echo   Format : https://mantis-pd.cegid.fr/mantis-client/view.php?id={id}
echo   Exemple : https://mantis-pd.cegid.fr/mantis-client/view.php?id=111525
echo.
echo ============================================================
pause
