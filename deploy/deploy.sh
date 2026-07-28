#!/usr/bin/env bash
# ============================================================================
# labdatadev-gamehub — esteira de melhoria contínua (rodar a cada atualização).
#
# Filosofia: o gate de qualidade roda ANTES de tocar no processo em produção.
# Se typecheck/teste/build falhar, o app antigo continua no ar — nunca troca
# por uma versão quebrada.
#
# Uso local (SSH na VPS):  ./deploy/deploy.sh
# Uso via CI: chamado pelo .github/workflows/deploy.yml
# ============================================================================
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

log() { echo; echo "==> $1"; }

log "git pull"
git pull --ff-only

log "npm ci"
npm ci

log "typecheck (gate)"
npm run typecheck

log "testes (gate)"
npm test

log "build de produção (gate)"
npm run build

log "aplicando no PM2"
if pm2 describe labdatadev-gamehub >/dev/null 2>&1; then
  pm2 reload deploy/ecosystem.config.js
else
  pm2 start deploy/ecosystem.config.js
fi
pm2 save

log "health check"
sleep 2
if curl -fsS -o /dev/null http://127.0.0.1:8081; then
  echo "    OK — app respondendo em 127.0.0.1:8081"
else
  echo
  echo "[ERRO] o app não respondeu depois do deploy."
  echo "       Veja os logs: pm2 logs labdatadev-gamehub --lines 100"
  exit 1
fi

echo
echo "============================================================"
echo " Deploy concluído. $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
echo "============================================================"
