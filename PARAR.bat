@echo off
chcp 65001 >nul 2>nul
title labdatadev-gamehub - Parar
REM ============================================================================
REM  Para o jogo. OS DADOS FICAM SALVOS - da pra voltar de onde parou rodando
REM  JOGAR.bat de novo.
REM
REM  Para apagar tambem os dados (recomecar do zero), use
REM  PARAR-E-APAGAR-DADOS.bat.
REM ============================================================================
cd /d "%~dp0"

echo.
echo  Parando o labdatadev-gamehub...
echo.

docker compose down

echo.
echo  ============================================================
echo    Parado. Seus dados continuam salvos.
echo    Rode JOGAR.bat quando quiser voltar.
echo  ============================================================
echo.
pause
