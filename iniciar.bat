@echo off
setlocal
REM ============================================================
REM  labdatadev-gamehub — iniciar em modo desenvolvimento (Windows)
REM  Dois cliques neste arquivo: instala dependencias se preciso
REM  e sobe o app em http://localhost:8081
REM ============================================================

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo [ERRO] Node.js nao encontrado no PATH.
    echo Instale o Node 20+ em https://nodejs.org e rode este arquivo de novo.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo.
    echo Primeira vez por aqui — instalando dependencias ^(npm install^)...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERRO] npm install falhou. Veja o log acima.
        echo.
        pause
        exit /b 1
    )
)

if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo Criado .env a partir de .env.example ^(modo GAMEHUB_DB=file, sem infra^).
    )
)

echo.
echo Subindo o gamehub em modo desenvolvimento...
echo O navegador abre sozinho em alguns segundos em http://localhost:8081
echo Para parar: feche esta janela ou pressione Ctrl+C.
echo.

REM Abre o navegador depois de um pequeno delay, sem travar o script principal
start "" /min powershell -NoProfile -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:8081'"

call npm run dev

pause
