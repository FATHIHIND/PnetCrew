@echo off
echo ==========================================
echo 🎟️ Test SmartTicket Integration
echo ==========================================
echo.

REM 1. Health check
echo 1️⃣ Health check du serveur...
curl -s http://localhost:8787/smartticket/health
echo.
echo.

REM 2. Test avec URL générique (error keyword)
echo 2️⃣ Test URL avec mot-cle "error"...
curl -s "http://localhost:8787/smartticket/analyze?url=https://example.com/error-123"
echo.
echo.

REM 3. Test avec URL Mantis mock
echo 3️⃣ Test URL Mantis (mock ticket 12345)...
curl -s "http://localhost:8787/smartticket/analyze?url=https://mantis.example.com/view.php?id=12345"
echo.
echo.

REM 4. Test avec URL multi-keywords
echo 4️⃣ Test URL avec mots-cles multiples...
curl -s "http://localhost:8787/smartticket/analyze?url=https://example.com/production-multi-absence-critical"
echo.
echo.

REM 5. Test avec URL simple
echo 5️⃣ Test URL simple (Google)...
curl -s "http://localhost:8787/smartticket/analyze?url=https://google.com"
echo.
echo.

echo ==========================================
echo ✅ Tests terminés !
echo.
echo 👉 Maintenant, testez dans Chrome :
echo    1. Ouvrez une page quelconque
echo    2. Cliquez sur l'icône SmartContext Doc
echo    3. Vérifiez que la section "🔥 Difficulté du ticket" apparaît
echo.
echo 📊 Résultat attendu :
echo    - Badge coloré (vert/orange/rouge)
echo    - Barre de 5 segments remplie
echo    - Liste des modules impactés
echo    - Liste des risques détectés
echo ==========================================
pause
