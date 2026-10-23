#!/usr/bin/env bash
# labdatadev-gamehub Document Engine — gatilho manual ("gerar agora")
#
# Roda o motor imediatamente, sem esperar o cron (nem o de hora em hora nem
# o modo evento de 5 em 5 min). Uso típico: um jurado/investidor se cadastra
# na sua frente durante a apresentação e você quer mostrar o resultado o
# mais rápido possível.
#
# Mostra a saída ao vivo no terminal (`tee`) E grava no log do dia, pro
# registro ficar consistente com as execuções automáticas.
#
# Uso (na VPS ou via SSH remoto — ver deploy/apresentacao/gerar-agora.bat
# pro atalho do Windows):
#   bash /root/labdatadev-gamehub/document-engine/scripts/gerar-agora.sh
#
# Depois de rodar: o nome de cada negócio processado com sucesso aparece na
# saída ("OK — documentação de "<nome>" gerada..."). Pra saber o e-mail de
# login da pessoa (pra falar "seu resultado já está pronto, entra com tal
# e-mail"), consulte /admin/clientes (painel cross-tenant) — o motor não
# tem acesso ao e-mail do usuário (vive no Supabase Auth, não na tabela de
# negócios), então não temos como imprimir isso aqui sem uma consulta extra
# ao banco que não existe hoje.

set -uo pipefail

export PATH="/root/.npm-global/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
export HOME="/root"

ENGINE_DIR="/root/labdatadev-gamehub/document-engine"
LOG_DIR="$ENGINE_DIR/logs"
LOG_FILE="$LOG_DIR/$(date +%F).log"

mkdir -p "$LOG_DIR"

echo "=================================================="
echo "labdatadev-gamehub Document Engine — GERAR AGORA — $(date -Is)"
echo "=================================================="

cd "$ENGINE_DIR" || exit 1
node scripts/scan-and-generate.mjs 2>&1 | tee -a "$LOG_FILE"

echo
echo "Concluído. Se algum nome apareceu acima como 'OK — documentação de \"...\"',"
echo "já está pronto pra ver em /painel (a pessoa precisa entrar com o e-mail"
echo "que usou no cadastro)."
