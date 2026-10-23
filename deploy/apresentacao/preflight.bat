@echo off
REM labdatadev-gamehub — checagem pre-apresentacao, via SSH, do notebook Windows.
REM Rode isso ANTES de sair de casa/escritorio rumo ao Sebrae.
REM
REM AJUSTE ESTAS 2 LINHAS antes de usar (dados da VPS):
set SSH_HOST=2.25.146.39
set SSH_USER=root

echo ==================================================
echo labdatadev-gamehub — checagem pre-apresentacao...
echo ==================================================
ssh %SSH_USER%@%SSH_HOST% "bash /root/labdatadev-gamehub/deploy/apresentacao/preflight.sh"

echo.
echo Pressione qualquer tecla para fechar.
pause >nul
