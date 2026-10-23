#!/usr/bin/env bash
# labdatadev-gamehub Document Engine — wrapper horário de cron
# Roda o scan-and-generate.mjs e mantém um log por dia em logs/YYYY-MM-DD.log

set -uo pipefail

# Cron roda com PATH mínimo (não herda o PATH do shell interativo). O node do
# sistema já está em /usr/bin, mas garantimos aqui também o diretório do npm
# global (claude CLI) como defesa em profundidade — o script Node já usa
# caminho absoluto para o binário do claude (mesmo padrão do V4mos).
export PATH="/root/.npm-global/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
export HOME="/root"

ENGINE_DIR="/root/labdatadev-gamehub/document-engine"
LOG_DIR="$ENGINE_DIR/logs"
LOG_FILE="$LOG_DIR/$(date +%F).log"

mkdir -p "$LOG_DIR"

{
  echo "=================================================="
  echo "labdatadev-gamehub Document Engine — execução $(date -Is)"
  echo "=================================================="
  cd "$ENGINE_DIR" || exit 1
  node scripts/scan-and-generate.mjs
  echo "Saída: $?"
} >> "$LOG_FILE" 2>&1
