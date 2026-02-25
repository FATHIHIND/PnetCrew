@echo off
REM Script de démarrage pour Windows
REM SmartContext Doc - Serveur API

echo ========================================
echo  SmartContext Doc - Demarrage serveur
echo ========================================
echo.

REM Vérifier si node est installé
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Node.js n'est pas installe
    echo Telecharger depuis : https://nodejs.org
    pause
    exit /b 1
)

echo [OK] Node.js detecte
node --version
echo.

REM Vérifier si .env existe
if not exist .env (
    echo [ATTENTION] Fichier .env manquant
    echo.
    echo Copie de .env.example vers .env...
    copy .env.example .env
    echo.
    echo [ACTION REQUISE] Editez le fichier .env avec vos credentials Azure
    echo   - AZURE_OPENAI_ENDPOINT
    echo   - AZURE_OPENAI_API_KEY
    echo   - AZURE_OPENAI_DEPLOYMENT
    echo.
    notepad .env
    echo.
    echo Appuyez sur une touche une fois la configuration terminee...
    pause >nul
)

REM Vérifier si node_modules existe
if not exist server\node_modules (
    echo [INFO] Installation des dependances...
    cd server
    call npm install
    cd ..
    echo.
)

REM Synchroniser le mapping
echo [INFO] Synchronisation du mapping...
cd server
call npm run sync-mapping
echo.

REM Démarrer le serveur
echo [INFO] Demarrage du serveur en mode developpement...
echo.
echo Le serveur va demarrer sur http://localhost:8787
echo Appuyez sur Ctrl+C pour arreter le serveur
echo.
call npm run dev

pause
