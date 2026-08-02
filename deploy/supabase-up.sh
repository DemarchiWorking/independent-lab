#!/usr/bin/env bash
# ==============================================================================
# labdatadev-gamehub — sobe o Supabase self-hosted e aplica as migrations
# (GH-OPS Bloco 2).
#
# Este é o passo que NÃO EXISTIA em lugar nenhum do deploy antes desta sessão
# (`docs/BACKLOG-PRODUTO.md` GH-OPS-03) — até aqui, aplicar `supabase/migrations/`
# era manual, fora de qualquer script.
#
# Idempotente de verdade, não só "não quebra": cada migration só roda uma vez,
# rastreada em `_migrations.aplicadas` dentro do próprio Postgres — pode rodar
# este script quantas vezes quiser (deploy contínuo, VPS reiniciada, etc.).
#
# Uso:
#   ./deploy/supabase-up.sh                                    # loopback (dev)
#   ./deploy/supabase-up.sh api.seudominio.com.br app.seudominio.com.br
#   ./deploy/supabase-up.sh --labd-cloud                        # + overlay Traefik do Kong (api.gamehub.labd.cloud)
#
# `GAMEHUB_PUBLIC_URL` (env, opcional): sobrescreve `SUPABASE_PUBLIC_URL`
# com QUALQUER URL (http ou https, IP:porta ou domínio) — usado por
# `deploy/docker/setup.sh` quando não há domínio/HTTPS ainda, só IP público
# (Épico 14: sem isto, a presença ao vivo não tinha como saber que URL usar
# no navegador — ver achado B1 da auditoria BMAD/NFR, 2026-08-01).
# ==============================================================================
set -euo pipefail

LABD_CLOUD=0
API_DOMAIN=""
APP_DOMAIN=""
for arg in "$@"; do
  case "$arg" in
    --labd-cloud) LABD_CLOUD=1 ;;
    *)
      if [ -z "$API_DOMAIN" ]; then API_DOMAIN="$arg";
      elif [ -z "$APP_DOMAIN" ]; then APP_DOMAIN="$arg";
      fi
      ;;
  esac
done
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUPA_DIR="$ROOT_DIR/deploy/supabase"

COMPOSE_FILES=(-f docker-compose.yml)
if [ "$LABD_CLOUD" = "1" ]; then
  COMPOSE_FILES+=(-f docker-compose.labd-cloud.yml)
fi

log() { echo; echo "==> $1"; }

cd "$SUPA_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "[ERRO] Docker não encontrado. Rode deploy/vps-setup.sh primeiro (ele instala Docker)." >&2
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "[ERRO] 'docker compose' (plugin v2) não encontrado." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# 1. .env do stack — gera na primeira vez, NUNCA regenera depois (regenerar
#    trocaria JWT_SECRET e derrubaria toda sessão/token válido).
# ---------------------------------------------------------------------------
if [ ! -f ".env" ]; then
  log "Gerando segredos do Supabase (primeira vez)..."
  node gerar-chaves.mjs > .env
  # Linhas de URL/porta SEMPRE presentes a partir daqui — é o que garante que
  # o bloco de `sed` abaixo (que só SUBSTITUI, nunca insere) tenha o que
  # substituir mesmo numa primeira execução com domínio já informado. Sem
  # isso, passar o domínio na primeira chamada seria silenciosamente
  # ignorado — o `sed` não acha a linha, e um fallback "adiciona se faltar"
  # entraria DEPOIS e gravaria o loopback por cima da intenção do operador.
  {
    echo "SUPABASE_PUBLIC_URL=http://127.0.0.1:8010"
    echo "SITE_URL=http://127.0.0.1:8081"
    # 8000 é o default de qualquer Supabase self-hosted, mas nesta VPS (e em
    # qualquer VPS que já rode outro stack Supabase, ex. Company HQ em
    # /opt/company/supabase) 127.0.0.1:8000 já está ocupado — achado ao vivo
    # 2026-08-02: `docker compose up` do Kong falhou com "port is already
    # allocated" rodando este script pela 2a vez numa VPS com outro Supabase
    # já no ar. 8010 evita a colisão sem exigir coordenação manual.
    echo "KONG_HTTP_PORT=8010"
  } >> .env
  chmod 600 .env
  echo "    deploy/supabase/.env criado. NUNCA apague sem motivo — apagar" \
       "     invalida todo login e todo Realtime já conectado."
else
  log "deploy/supabase/.env já existe — preservando segredos."
fi

# URLs: só sobrescreve se um domínio/GAMEHUB_PUBLIC_URL foi passado (senão
# mantém o que já estava — permite rodar `./deploy/supabase-up.sh` sem
# argumento pra só aplicar migrations novas, sem mexer em config de rede).
# `GAMEHUB_PUBLIC_URL` tem prioridade sobre `API_DOMAIN` — é mais específico
# (URL completa, qualquer esquema) contra um domínio que sempre vira https.
if [ -n "${GAMEHUB_PUBLIC_URL:-}" ]; then
  escapado="$(printf '%s' "$GAMEHUB_PUBLIC_URL" | sed 's/[&|]/\\&/g')"
  sed -i.bak "s|^SUPABASE_PUBLIC_URL=.*|SUPABASE_PUBLIC_URL=$escapado|" .env
  rm -f .env.bak
elif [ -n "$API_DOMAIN" ]; then
  sed -i.bak "s|^SUPABASE_PUBLIC_URL=.*|SUPABASE_PUBLIC_URL=https://$API_DOMAIN|" .env
  rm -f .env.bak
fi
if [ -n "$APP_DOMAIN" ]; then
  sed -i.bak "s|^SITE_URL=.*|SITE_URL=https://$APP_DOMAIN|" .env
  rm -f .env.bak
fi

# ---------------------------------------------------------------------------
# 2. Sobe o stack e ESPERA de verdade (não `sleep` chutado) — `--wait` do
#    Docker Compose v2 bloqueia até todo `healthcheck:` do compose passar.
# ---------------------------------------------------------------------------
log "Subindo containers do Supabase (${COMPOSE_FILES[*]})..."
docker compose "${COMPOSE_FILES[@]}" up -d --wait --wait-timeout 180

log "Status dos containers:"
docker compose "${COMPOSE_FILES[@]}" ps

# ---------------------------------------------------------------------------
# 3. Migrations — aplicadas em ordem, uma vez cada, dentro de transação.
# ---------------------------------------------------------------------------
log "Aplicando migrations..."

docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<'SQL'
create schema if not exists _migrations;
create table if not exists _migrations.aplicadas (
  arquivo text primary key,
  aplicada_em timestamptz not null default now()
);
SQL

aplicadas_novas=0
for arquivo in "$ROOT_DIR"/supabase/migrations/*.sql; do
  nome="$(basename "$arquivo")"
  ja_aplicada="$(docker compose exec -T db psql -U postgres -d postgres -tAc \
    "select 1 from _migrations.aplicadas where arquivo = '$nome'")"

  if [ "$ja_aplicada" = "1" ]; then
    echo "    [skip] $nome (já aplicada)"
    continue
  fi

  echo "    [aplicando] $nome"
  docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
    < "$arquivo"
  docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
    -c "insert into _migrations.aplicadas (arquivo) values ('$nome')"
  aplicadas_novas=$((aplicadas_novas + 1))
done
echo "    $aplicadas_novas migration(s) nova(s) aplicada(s)."

# ---------------------------------------------------------------------------
# 4. Seed — sempre roda; é `upsert` idempotente (supabase/seed.sql).
# ---------------------------------------------------------------------------
log "Aplicando seed (cidades do ICP)..."
docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  < "$ROOT_DIR/supabase/seed.sql"

# lido de volta do .env (não do ambiente do shell) — é a fonte real que o
# docker compose usou para publicar a porta/URL.
PORTA_KONG="$(grep '^KONG_HTTP_PORT=' .env | cut -d= -f2)"
URL_PUBLICA="$(grep '^SUPABASE_PUBLIC_URL=' .env | cut -d= -f2-)"

echo
echo "============================================================"
echo " Supabase self-hosted no ar."
echo " Kong (API gateway): ${URL_PUBLICA:-http://127.0.0.1:${PORTA_KONG:-8000}}"
echo " Kong (rede interna Docker, sempre): http://kong:8000"
echo " Verifique: cd deploy/supabase && docker compose ${COMPOSE_FILES[*]} ps"
echo "============================================================"
