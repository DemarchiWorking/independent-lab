@echo off
REM labdatadev-gamehub — gatilho manual "gerar agora", via SSH, do notebook Windows.
REM
REM Só funciona se este notebook já conseguir rodar "ssh" ate a VPS (senha ou
REM chave configurada). Se nunca testou, abra o cmd e rode primeiro:
REM   ssh SSH_USER@SSH_HOST
REM Se conectar, este .bat funciona. Se pedir senha toda vez, funciona
REM tambem — so vai pedir a senha aqui na hora de rodar.
REM
REM AJUSTE ESTAS 2 LINHAS antes de usar (dados da VPS):
set SSH_HOST=2.25.146.39
set SSH_USER=root

echo ==================================================
echo labdatadev-gamehub — gerando documentacao agora...
echo ==================================================
ssh %SSH_USER%@%SSH_HOST% "bash /root/labdatadev-gamehub/document-engine/scripts/gerar-agora.sh"

echo.
echo Pressione qualquer tecla para fechar.
pause >nul
