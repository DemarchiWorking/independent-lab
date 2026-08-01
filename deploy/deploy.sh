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
# Antes: `curl` na `/` — a home inteira (SSR + leitura de banco), 1 tentativa
# só, `sleep 2` fixo. Falso negativo fácil em cold start, e não distinguia
# "processo não subiu" de "banco fora do ar" (GH-OPS M-5). Agora: `/api/health`
# (round trip barato, ver `src/app/api/health/route.ts`), com algumas
# tentativas — `pm2 reload` some com o processo por um instante até o novo
# assumir a porta.
HEALTH_URL="http://127.0.0.1:8081/api/health"
ok=""
for tentativa in $(seq 1 10); do
  if resposta=$(curl -fsS "$HEALTH_URL" 2>/dev/null); then
    ok="$resposta"
    break
  fi
  sleep 1
done

if [ -n "$ok" ]; then
  echo "    OK — $HEALTH_URL respondeu: $ok"
else
  echo
  echo "[ERRO] $HEALTH_URL não respondeu 2xx depois do deploy (10 tentativas)."
  echo "       Veja os logs: pm2 logs labdatadev-gamehub --lines 100"
  exit 1
fi

echo
echo "============================================================"
echo " Deploy concluído. $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
echo "============================================================"
