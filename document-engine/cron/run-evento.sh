#!/usr/bin/env bash
# labdatadev-gamehub Document Engine — wrapper de MODO EVENTO
#
# Mesmo motor de `run-hourly.sh` (não duplica lógica — chama o mesmo
# scan-and-generate.mjs), só que pensado pra rodar de 5 em 5 minutos
# durante uma apresentação ao vivo, em vez de 1 em 1 hora. Isso encurta
# drasticamente o tempo de espera entre "um jurado se cadastra" e "a
# documentação dele aparece pronta".
#
# COMO USAR (ver deploy/apresentacao/README-APRESENTACAO.md pro passo a
# passo completo):
#   1. Antes do evento: crontab -e, comente a linha de run-hourly.sh e
#      adicione: */5 * * * * /root/labdatadev-gamehub/document-engine/cron/run-evento.sh
#   2. Depois do evento: reverta — volte pro run-hourly.sh de hora em hora.
#      Rodar de 5 em 5 minutos pra sempre gasta Pro plan/CPU à toa quando
#      não há apresentação nenhuma acontecendo.
#
# Log separado (logs/evento-YYYY-MM-DD.log) de propósito — não polui o log
# diário normal com uma rajada de execuções de 5 em 5 minutos.

set -uo pipefail

export PATH="/root/.npm-global/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
export HOME="/root"

ENGINE_DIR="/root/labdatadev-gamehub/document-engine"
LOG_DIR="$ENGINE_DIR/logs"
LOG_FILE="$LOG_DIR/evento-$(date +%F).log"

mkdir -p "$LOG_DIR"

{
  echo "=================================================="
  echo "labdatadev-gamehub Document Engine — MODO EVENTO — execução $(date -Is)"
  echo "=================================================="
  cd "$ENGINE_DIR" || exit 1
  node scripts/scan-and-generate.mjs
  echo "Saída: $?"
} >> "$LOG_FILE" 2>&1
