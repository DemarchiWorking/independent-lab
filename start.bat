@echo off
setlocal enabledelayedexpansion
REM ============================================================================
REM labdatadev-gamehub — subir o stack real no Windows 11, com 1 clique.
REM
REM Como funciona: os scripts de deploy sao bash (arrays, `set -euo pipefail`,
REM `sed -i`) — nao rodam em PowerShell/cmd puro. Este .bat so verifica os
REM pre-requisitos e chama o MESMO start.sh de sempre dentro do WSL (Windows
REM Subsystem for Linux) — nenhuma logica de deploy e duplicada aqui.
REM
REM Pre-requisitos (uma vez so):
REM   1. Docker Desktop instalado, com "Use the WSL 2 based engine" ligado
REM      (Settings > General) e a integracao com a distro Ubuntu ligada
REM      (Settings > Resources > WSL Integration).
REM   2. WSL2 com uma distro instalada (recomendado: Ubuntu). Se nao tiver,
REM      abra o PowerShell como Administrador e rode: wsl --install -d Ubuntu
REM      (pede reiniciar o PC uma vez).
REM ============================================================================

echo.
echo labdatadev-gamehub — inicializando...
echo.

where wsl >nul 2>nul
if errorlevel 1 (
  echo [ERRO] WSL nao encontrado neste Windows.
  echo.
  echo Abra o PowerShell como Administrador e rode:
  echo     wsl --install -d Ubuntu
  echo Reinicie o PC quando pedir, depois rode este start.bat de novo.
  echo.
  pause
  exit /b 1
)

wsl -e bash -c "command -v docker >/dev/null 2>&1"
if errorlevel 1 (
  echo [ERRO] O comando 'docker' nao responde dentro do WSL.
  echo.
  echo Verifique no Docker Desktop: Settings ^> Resources ^> WSL Integration
  echo e ligue o toggle da sua distro ^(ex.: Ubuntu^), depois "Apply ^& Restart".
  echo.
  pause
  exit /b 1
)

REM %~dp0 = pasta onde este .bat esta, em caminho Windows (ex. C:\...\labdatadev-gamehub\)
REM wslpath traduz pro caminho equivalente dentro do WSL (ex. /mnt/c/.../labdatadev-gamehub)
for /f "delims=" %%P in ('wsl wslpath -a "%~dp0"') do set WSLPATH=%%P

echo Pasta do projeto (dentro do WSL): %WSLPATH%
wsl -e bash -c "case \"%WSLPATH%\" in /mnt/*) echo AVISO; exit 0;; *) exit 1;; esac" >nul 2>nul
if not errorlevel 1 (
  echo.
  echo [AVISO] Este projeto esta no disco do Windows ^(uma pasta /mnt/... vista
  echo pelo WSL^). Funciona, mas fica MUITO mais lento pra buildar e o WSL as
  echo vezes perde o "bit de execucao" dos scripts. Recomendado ^(uma vez so^):
  echo     wsl -e bash -c "cp -r '%WSLPATH%' ~/labdatadev-gamehub"
  echo e depois rode ~/labdatadev-gamehub/start.sh de dentro do Ubuntu ^(WSL^)
  echo em vez deste .bat. Continuando mesmo assim...
  echo.
)

echo Subindo o stack ^(app + nginx + Supabase self-hosted^)...
echo Isso pode demorar alguns minutos na primeira vez.
echo.

wsl -e bash -c "cd '%WSLPATH%' && chmod +x start.sh deploy/*.sh deploy/docker/*.sh && ./start.sh"

echo.
echo Se nao apareceu nenhum [ERRO] acima, abra http://localhost:3006 no navegador.
echo ^(o WSL2 encaminha a porta pro Windows sozinho — nao precisa configurar nada^)
echo.
pause
