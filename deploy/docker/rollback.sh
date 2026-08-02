#!/usr/bin/env bash
# ============================================================================
# labdatadev-gamehub — rollback instantâneo do checkpoint Docker em produção.
#
# Companheiro de deploy/docker/update.sh: todo `update.sh` marca a imagem
# que estava rodando como `:previous` ANTES de buildar a nova, e também
# marca cada versão nova com o hash curto do commit (`:<commit>`). Isso
# torna o rollback aqui um simples retag + `up -d` — SEM rebuild, then
# segundos em vez de minutos, o que importa quando o motivo do rollback é
# "a versão nova está no ar mas quebrada em produção" (bug de runtime que
# typecheck/teste não pegam).
#
# Uso (na VPS, depois de pelo menos um deploy/docker/update.sh ter rodado):
#   ./deploy/docker/rollback.sh            # volta pra imagem :previous
#   ./deploy/docker/rollback.sh a1b2c3d    # volta pra um commit específico
#                                           # (precisa existir como tag local
#                                           # labdatadev-gamehub:a1b2c3d —
#                                           # update.sh cria uma a cada deploy)
# ============================================================================
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."

STATE_DIR="deploy/docker/.state"
ALVO="${1:-previous}"
log() { echo; echo "==> $1"; }

if [ ! -f "$STATE_DIR/compose-files" ]; then
  echo "[ERRO] $STATE_DIR/compose-files não existe — rode deploy/docker/setup.sh" >&2
  echo "        primeiro (deploy inicial); rollback.sh só sabe VOLTAR pra um" >&2
  echo "        checkpoint que já esteve no ar." >&2
  exit 1
fi
read -r -a COMPOSE_FILES <<< "$(cat "$STATE_DIR/compose-files")"

if ! docker image inspect "labdatadev-gamehub:$ALVO" >/dev/null 2>&1; then
  echo "[ERRO] Tag labdatadev-gamehub:$ALVO não existe localmente." >&2
  echo "        Tags disponíveis:" >&2
  docker images labdatadev-gamehub --format '          %-12s %s' | awk '{print "          " $0}' >&2
  exit 1
fi

log "guardando o que está no ar agora como :rolled-back-from (caso o rollback tenha sido engano)"
docker tag labdatadev-gamehub:latest labdatadev-gamehub:rolled-back-from 2>/dev/null || true

log "retag labdatadev-gamehub:$ALVO -> labdatadev-gamehub:latest"
docker tag "labdatadev-gamehub:$ALVO" labdatadev-gamehub:latest

log "subindo o checkpoint anterior (${COMPOSE_FILES[*]}, sem rebuild)"
docker compose "${COMPOSE_FILES[@]}" up -d --wait --wait-timeout 180

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
  echo "[ERRO] Healthcheck falhou depois do rollback." >&2
  echo "        Isso é grave: nem a versão nova nem a anterior respondem." >&2
  echo "        Verifique 'docker compose ${COMPOSE_FILES[*]} logs -f' manualmente." >&2
  exit 1
fi

if [ "$ALVO" = "previous" ]; then
  echo "rollback (previous, commit exato desconhecido)" > "$STATE_DIR/last-deployed-commit"
else
  echo "$ALVO" > "$STATE_DIR/last-deployed-commit"
fi

echo
echo "============================================================"
echo " Rollback concluído."
echo "   OK — $ok"
echo "   Imagem no ar agora: labdatadev-gamehub:$ALVO"
echo "   Se foi engano: ./deploy/docker/rollback.sh rolled-back-from"
echo "============================================================"
