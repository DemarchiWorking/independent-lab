@echo off
setlocal
REM ============================================================
REM  independent-lab — iniciar em modo desenvolvimento (Windows)
REM  Dois cliques neste arquivo: instala dependencias se preciso
REM  e sobe o app em http://localhost:8081
REM ============================================================

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo [ERRO] Node.js nao encontrado no PATH.
    echo Instale o Node 22 ou 24 LTS em https://nodejs.org e rode este arquivo de novo.
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

REM O .env e o GAMEHUB_SECRET local sao criados pelo "predev" do npm
REM (scripts\garantir-segredo.mjs), antes de o servidor subir.

echo.
echo Subindo o gamehub em modo desenvolvimento...
echo O navegador abre sozinho em alguns segundos em http://localhost:8081
echo O servidor so aceita conexoes desta maquina ^(127.0.0.1^).
echo Para parar: feche esta janela ou pressione Ctrl+C.
echo.

REM Abre o navegador depois de um pequeno delay, sem travar o script principal
start "" /min powershell -NoProfile -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:8081'"

call npm run dev

pause
