@echo off
chcp 65001 >nul 2>nul
title labdatadev-gamehub - Apagar dados
REM ============================================================================
REM  Para o jogo E APAGA todos os cadastros/progresso do banco em arquivo.
REM  Use quando quiser fazer uma demonstracao do zero.
REM ============================================================================
cd /d "%~dp0"

echo.
echo  ATENCAO: isto apaga TODOS os negocios, cadastros e progresso
echo  salvos neste computador. Nao da pra desfazer.
echo.
set /p RESP="  Digite APAGAR e de Enter para confirmar: "

if /i not "%RESP%"=="APAGAR" (
  echo.
  echo  Cancelado - nada foi apagado.
  echo.
  pause
  exit /b 0
)

echo.
docker compose down -v

echo.
echo  ============================================================
echo    Dados apagados. Rode JOGAR.bat para comecar do zero.
echo  ============================================================
echo.
pause
