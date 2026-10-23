@echo off
chcp 65001 >nul 2>nul
setlocal enabledelayedexpansion
title labdatadev-gamehub - Simulador de Empreendedorismo
REM ============================================================================
REM  labdatadev-gamehub - RODAR LOCALMENTE NO WINDOWS COM 2 CLIQUES
REM
REM  O que este arquivo faz:
REM    1. confere se o Docker Desktop esta instalado e ligado
REM    2. sobe o jogo inteiro (app + nginx) com `docker compose up -d`
REM    3. abre o navegador em http://localhost:3006
REM
REM  Banco de dados: ARQUIVOS locais (JSON), dentro de um volume Docker
REM  chamado `labdatadev-gamehub_gamehub-data`. Nao precisa de Postgres,
REM  nem de Supabase, nem de internet depois do primeiro build. Os dados
REM  ficam salvos entre um `JOGAR.bat` e o proximo - so somem se voce rodar
REM  PARAR-E-APAGAR-DADOS.bat.
REM
REM  NAO precisa de WSL, nem de Git Bash, nem de rodar comando nenhum.
REM  (O Docker Desktop ja instala o `docker` no cmd/PowerShell do Windows.)
REM
REM  Unico pre-requisito, uma vez so:
REM    Docker Desktop -> https://www.docker.com/products/docker-desktop/
REM ============================================================================

cd /d "%~dp0"

echo.
echo  ============================================================
echo    labdatadev-gamehub - Simulador de Empreendedorismo
echo  ============================================================
echo.

REM --- 1. Docker instalado? -------------------------------------------------
where docker >nul 2>nul
if errorlevel 1 (
  echo  [ERRO] Docker nao encontrado neste computador.
  echo.
  echo  Instale o Docker Desktop ^(gratuito^) e rode este arquivo de novo:
  echo    https://www.docker.com/products/docker-desktop/
  echo.
  echo  Depois de instalar, ABRA o Docker Desktop uma vez e espere o
  echo  icone da baleia ficar verde antes de tentar novamente.
  echo.
  pause
  exit /b 1
)

REM --- 2. Docker Desktop ligado? -------------------------------------------
docker info >nul 2>nul
if errorlevel 1 (
  echo  [ERRO] O Docker esta instalado, mas o Docker Desktop nao esta rodando.
  echo.
  echo  Abra o Docker Desktop pelo menu Iniciar, espere o icone da baleia
  echo  parar de piscar ^(fica verde^), e rode este arquivo de novo.
  echo.
  pause
  exit /b 1
)

REM --- 3. Compose v2? -------------------------------------------------------
docker compose version >nul 2>nul
if errorlevel 1 (
  echo  [ERRO] Seu Docker e antigo demais ^(sem `docker compose` v2^).
  echo  Atualize o Docker Desktop para a versao mais recente.
  echo.
  pause
  exit /b 1
)

REM --- 4. Porta ------------------------------------------------------------
REM Troque aqui se a 3006 estiver ocupada no seu PC (ex.: 8080).
if "%GAMEHUB_HTTP_PORT%"=="" set GAMEHUB_HTTP_PORT=3006

echo  Subindo o jogo na porta %GAMEHUB_HTTP_PORT%...
echo.
echo  Na PRIMEIRA vez isso demora alguns minutos ^(o Docker precisa
echo  construir a imagem do jogo^). Nas proximas, sobe em ~15 segundos.
echo  Pode deixar esta janela aberta.
echo.

docker compose up -d --wait --wait-timeout 600
if errorlevel 1 (
  echo.
  echo  [ERRO] Alguma coisa falhou ao subir. Para ver o motivo, rode:
  echo      docker compose logs
  echo.
  echo  Causa mais comum: a porta %GAMEHUB_HTTP_PORT% ja esta em uso por outro
  echo  programa. Para usar outra porta, feche esta janela e rode no cmd:
  echo      set GAMEHUB_HTTP_PORT=8080 ^&^& JOGAR.bat
  echo.
  pause
  exit /b 1
)

echo.
echo  ============================================================
echo    PRONTO! O jogo esta no ar.
echo.
echo    Abra no navegador:  http://localhost:%GAMEHUB_HTTP_PORT%
echo.
echo    Para PARAR:         PARAR.bat
echo    Para ver os logs:   docker compose logs -f
echo  ============================================================
echo.

start "" "http://localhost:%GAMEHUB_HTTP_PORT%"

echo  Pode fechar esta janela - o jogo continua rodando em segundo plano.
echo.
pause
