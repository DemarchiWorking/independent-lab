#!/usr/bin/env bash
# ============================================================================
# labdatadev-gamehub — atualização rápida do checkpoint Docker em produção.
#
# Mesma filosofia de deploy/deploy.sh (caminho PM2 legado): o gate de
# qualidade roda ANTES de tocar no que está no ar. Se typecheck/teste
# falhar, a versão antiga continua rodando — nunca troca por algo quebrado.
# Diferença do deploy.sh: aqui a imagem antiga também fica marcada como
# `:previous` antes de subir a nova, então se o healthcheck falhar DEPOIS
# do build (bug que só aparece em runtime, não em teste), o operador tem
# `deploy/docker/rollback.sh` pronto — sem rebuild, segundos.
#
# Uso (na VPS, depois de deploy/docker/setup.sh já ter rodado uma vez):
#   ./deploy/docker/update.sh
# ============================================================================
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."

STATE_DIR="deploy/docker/.state"
log() { echo; echo "==> $1"; }

if [ ! -f "$STATE_DIR/compose-files" ]; then
  echo "[ERRO] $STATE_DIR/compose-files não existe — rode deploy/docker/setup.sh" >&2
  echo "        primeiro (deploy inicial); update.sh só sabe ATUALIZAR um" >&2
  echo "        checkpoint que já está no ar." >&2
  exit 1
fi
read -r -a COMPOSE_FILES <<< "$(cat "$STATE_DIR/compose-files")"

log "git pull"
git pull --ff-only

log "npm ci"
npm ci

log "typecheck (gate)"
npm run typecheck

log "testes (gate)"
npm test

# Guarda a imagem que está rodando AGORA como ":previous" antes de buildar a
# nova — é o que torna o rollback instantâneo (sem rebuild) possível.
if docker image inspect labdatadev-gamehub:latest >/dev/null 2>&1; then
  log "marcando imagem atual como :previous (pra rollback rápido se precisar)"
  docker tag labdatadev-gamehub:latest labdatadev-gamehub:previous
fi

log "build + sobe nova versão (${COMPOSE_FILES[*]})"
docker compose "${COMPOSE_FILES[@]}" up -d --build --wait --wait-timeout 180

PORTA="${GAMEHUB_HTTP_PORT:-3006}"
log "healthcheck em http://127.0.0.1:${PORTA}/api/health"
ok=""
for tentativa in $(seq 1 10); do
  if resposta=$(curl -fsS "http://127.0.0.1:${PORTA}/api/health" 2>/dev/null); then
    ok="$resposta"
    break
  fi
  sleep 2
done

if [ -z "$ok" ]; then
  echo "[ERRO] Healthcheck falhou depois do update." >&2
  echo "        A versão nova pode estar parcialmente no ar. Rode agora:" >&2
  echo "          ./deploy/docker/rollback.sh" >&2
  echo "        pra voltar pra imagem anterior (labdatadev-gamehub:previous)." >&2
  exit 1
fi

COMMIT="$(git rev-parse --short HEAD)"
echo "$COMMIT" > "$STATE_DIR/last-deployed-commit"
docker tag labdatadev-gamehub:latest "labdatadev-gamehub:$COMMIT"

echo
echo "============================================================"
echo " Atualizado."
echo "   OK — $ok"
echo "   Commit no ar: $COMMIT"
echo "   Pra voltar pra este exato build depois: ./deploy/docker/rollback.sh $COMMIT"
echo "============================================================"
